/**
 * Shared event-detection primitives for /geodetic-patterns.
 *
 * Imports swisseph-wasm directly — keep this module out of client bundles.
 * Next marks "swisseph-wasm" as a server-external package (see next.config.ts).
 */

import SwissEph from "swisseph-wasm";
import { computeDeclination } from "./declination";
import {
  ASPECT_BODIES,
  BODIES,
  CARDINAL_SIGNS,
  HARD_ASPECTS,
  MIDPOINT_PAIRS,
  NODAL_ORB_DEG,
  NODAL_TRANSIT_BODIES,
  OOB_DECLINATION_DEG,
  ONE_SIDED_NODAL_BODIES,
  ONE_SIDED_NODAL_THRESHOLD,
  STATIONING_BODIES,
  STELLIUM_BODIES,
  STELLIUM_MIN,
  STELLIUM_ORB_DEG,
  geodeticZoneFor,
  getSign,
  isAnaretic,
  type PatternEvent,
} from "./geodetic-patterns";

const SEFLG_SWIEPH = 2;          // bundled .se1 files (1800–2400)
const SEFLG_MOSEPH = 4;          // Moshier analytical, no files needed
const SEFLG_SPEED = 256;

// Asteroids (Chiron, Ceres, Pallas, Juno, Vesta) require seas_18.se1 (SWIEPH).
// Everything else uses Moshier so we don't need any ephemeris files.
const ASTEROID_BODIES = new Set(["Chiron", "Ceres", "Pallas", "Juno", "Vesta"]);
const flagsFor = (bodyName: string) =>
  (ASTEROID_BODIES.has(bodyName) ? SEFLG_SWIEPH : SEFLG_MOSEPH) | SEFLG_SPEED;
const FLAGS = SEFLG_MOSEPH | SEFLG_SPEED;             // default for raw jd math
const ECL_FLAGS = SEFLG_MOSEPH;                       // eclipses use Moshier (no files)

const SE_ECL_TOTAL = 4;
const SE_ECL_ANNULAR = 8;
const SE_ECL_PARTIAL = 16;
const SE_ECL_ANNULAR_TOTAL = 32;
const SE_ECL_PENUMBRAL = 64;

interface SweCalc { longitude: number; longitudeSpeed: number }
interface SweRev { year: number; month: number; day: number; hour: number }
type Swe = {
  initSwissEph: () => Promise<void> | void;
  julday: (y: number, m: number, d: number, h: number) => number;
  revjul: (jd: number, cal: number) => SweRev;
  calc: (jd: number, ipl: number, flags: number) => SweCalc;
  sol_eclipse_when_glob?: (jd: number, flags: number, ifltype: number, backward: number) => number[] | null;
  lun_eclipse_when?: (jd: number, flags: number, ifltype: number, backward: number) => number[] | null;
};

let _swePromise: Promise<Swe> | null = null;
export function getSwe(): Promise<Swe> {
  if (!_swePromise) {
    _swePromise = (async () => {
      const swe = new SwissEph() as unknown as Swe;
      await swe.initSwissEph();
      return swe;
    })();
  }
  return _swePromise;
}

function jdToIso(swe: Swe, jd: number): string {
  const r = swe.revjul(jd, 1);
  const h = Math.floor(r.hour);
  const mFloat = (r.hour - h) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${r.year}-${pad(r.month)}-${pad(r.day)}T${pad(h)}:${pad(m)}:${pad(s)}Z`;
}

function eclipseTypeName(retflag: number): string {
  if (retflag & SE_ECL_TOTAL) return "total";
  if (retflag & SE_ECL_ANNULAR_TOTAL) return "hybrid";
  if (retflag & SE_ECL_ANNULAR) return "annular";
  if (retflag & SE_ECL_PARTIAL) return "partial";
  if (retflag & SE_ECL_PENUMBRAL) return "penumbral";
  return "unknown";
}

function bisectIngress(swe: Swe, pid: number, flags: number, jdBefore: number, jdAfter: number, fromSign: string): number {
  let lo = jdBefore;
  let hi = jdAfter;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const midSign = getSign(swe.calc(mid, pid, flags).longitude);
    if (midSign === fromSign) lo = mid;
    else hi = mid;
  }
  return hi;
}

function bisectStation(swe: Swe, pid: number, flags: number, jdBefore: number, jdAfter: number): number {
  let lo = jdBefore;
  let hi = jdAfter;
  const sLo = swe.calc(lo, pid, flags).longitudeSpeed;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const sMid = swe.calc(mid, pid, flags).longitudeSpeed;
    if ((sLo < 0) === (sMid < 0)) lo = mid;
    else hi = mid;
  }
  return hi;
}

function bisectLunation(swe: Swe, jdBefore: number, jdAfter: number, target: 0 | 180): number {
  const elong = (jd: number) => {
    const sun = swe.calc(jd, BODIES.Sun, SEFLG_MOSEPH).longitude;
    const moon = swe.calc(jd, BODIES.Moon, SEFLG_MOSEPH).longitude;
    let d = ((moon - sun + 540) % 360) - 180;
    if (target === 180) d = d >= 0 ? d - 180 : d + 180;
    return d;
  };
  let lo = jdBefore;
  let hi = jdAfter;
  const sLo = elong(lo);
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    const sMid = elong(mid);
    if ((sLo < 0) === (sMid < 0)) lo = mid;
    else hi = mid;
  }
  return hi;
}

function detectIngressesAndStations(swe: Swe, jdStart: number, jdEnd: number): PatternEvent[] {
  const events: PatternEvent[] = [];
  const STEP = 1.0;
  const prev: Record<string, { sign: string; speed: number }> = {};

  for (let jd = jdStart; jd <= jdEnd; jd += STEP) {
    for (const [name, pid] of Object.entries(BODIES)) {
      const flags = flagsFor(name);
      let res: SweCalc;
      try { res = swe.calc(jd, pid, flags); }
      catch { continue; } // skip a body silently if ephemeris unavailable
      const sign = getSign(res.longitude);
      const speed = res.longitudeSpeed;
      const p = prev[name];

      if (p) {
        if (p.sign !== sign) {
          const exactJd = bisectIngress(swe, pid, flags, jd - STEP, jd, p.sign);
          const exactRes = swe.calc(exactJd, pid, flags);
          events.push({
            utc: jdToIso(swe, exactJd),
            jd: Number(exactJd.toFixed(6)),
            type: "ingress",
            body: name,
            fromSign: p.sign,
            toSign: sign,
            lon: Number(exactRes.longitude.toFixed(6)),
            geodeticZone: geodeticZoneFor(exactRes.longitude),
            meta: {
              retrograde: exactRes.longitudeSpeed < 0,
              anaretic: isAnaretic(exactRes.longitude),
              seasonal: name === "Sun" && CARDINAL_SIGNS.has(sign),
              speed: Number(exactRes.longitudeSpeed.toFixed(6)),
            },
          });
        }

        if (STATIONING_BODIES.includes(name) && (p.speed < 0) !== (speed < 0)) {
          const exactJd = bisectStation(swe, pid, flags, jd - STEP, jd);
          const exactRes = swe.calc(exactJd, pid, flags);
          events.push({
            utc: jdToIso(swe, exactJd),
            jd: Number(exactJd.toFixed(6)),
            type: "station",
            body: name,
            sign: getSign(exactRes.longitude),
            lon: Number(exactRes.longitude.toFixed(6)),
            geodeticZone: geodeticZoneFor(exactRes.longitude),
            meta: {
              direction: speed >= 0 ? "direct" : "retrograde",
              anaretic: isAnaretic(exactRes.longitude),
              speed: Number(speed.toFixed(6)),
            },
          });
        }
      }

      prev[name] = { sign, speed };
    }
  }
  return events;
}

function detectLunations(swe: Swe, jdStart: number, jdEnd: number): PatternEvent[] {
  const events: PatternEvent[] = [];
  const STEP = 0.5;
  let prevDiff = ((swe.calc(jdStart, BODIES.Moon, SEFLG_MOSEPH).longitude
                  - swe.calc(jdStart, BODIES.Sun, SEFLG_MOSEPH).longitude + 540) % 360) - 180;
  let prevHalf = (((swe.calc(jdStart, BODIES.Moon, SEFLG_MOSEPH).longitude
                  - swe.calc(jdStart, BODIES.Sun, SEFLG_MOSEPH).longitude) % 360) + 360) % 360;

  for (let jd = jdStart + STEP; jd <= jdEnd; jd += STEP) {
    const sun = swe.calc(jd, BODIES.Sun, SEFLG_MOSEPH).longitude;
    const moon = swe.calc(jd, BODIES.Moon, SEFLG_MOSEPH).longitude;
    const diff = ((moon - sun + 540) % 360) - 180;
    const halfRaw = ((moon - sun) % 360 + 360) % 360;

    if ((prevDiff < 0) !== (diff < 0) && Math.abs(prevDiff - diff) < 30) {
      const exactJd = bisectLunation(swe, jd - STEP, jd, 0);
      const lon = swe.calc(exactJd, BODIES.Sun, SEFLG_MOSEPH).longitude;
      events.push({
        utc: jdToIso(swe, exactJd),
        jd: Number(exactJd.toFixed(6)),
        type: "lunation-new",
        body: "Moon",
        sign: getSign(lon),
        lon: Number(lon.toFixed(6)),
        geodeticZone: geodeticZoneFor(lon),
      });
    }

    if ((prevHalf < 180) !== (halfRaw < 180) && Math.abs(prevHalf - halfRaw) < 30) {
      const exactJd = bisectLunation(swe, jd - STEP, jd, 180);
      const lon = swe.calc(exactJd, BODIES.Moon, SEFLG_MOSEPH).longitude;
      events.push({
        utc: jdToIso(swe, exactJd),
        jd: Number(exactJd.toFixed(6)),
        type: "lunation-full",
        body: "Moon",
        sign: getSign(lon),
        lon: Number(lon.toFixed(6)),
        geodeticZone: geodeticZoneFor(lon),
      });
    }

    prevDiff = diff;
    prevHalf = halfRaw;
  }
  return events;
}

function detectEclipses(swe: Swe, jdStart: number, jdEnd: number): PatternEvent[] {
  const events: PatternEvent[] = [];
  if (!swe.sol_eclipse_when_glob || !swe.lun_eclipse_when) return events;

  const solarFlags = SE_ECL_TOTAL | SE_ECL_ANNULAR | SE_ECL_PARTIAL | SE_ECL_ANNULAR_TOTAL;
  const lunarFlags = SE_ECL_TOTAL | SE_ECL_PARTIAL | SE_ECL_PENUMBRAL;

  let jd = jdStart;
  while (jd < jdEnd) {
    const r = swe.sol_eclipse_when_glob(jd, ECL_FLAGS, solarFlags, 0);
    if (!r || r.length < 2) break;
    const retflag = r[0];
    const peakJd = r[1];
    if (retflag <= 0 || !Number.isFinite(peakJd) || peakJd <= jd || peakJd > jdEnd) break;
    const lon = swe.calc(peakJd, BODIES.Sun, SEFLG_MOSEPH).longitude;
    events.push({
      utc: jdToIso(swe, peakJd),
      jd: Number(peakJd.toFixed(6)),
      type: "eclipse-solar",
      body: "Sun",
      sign: getSign(lon),
      lon: Number(lon.toFixed(6)),
      geodeticZone: geodeticZoneFor(lon),
      meta: { eclipseType: eclipseTypeName(retflag) },
    });
    jd = peakJd + 0.5;
  }

  jd = jdStart;
  while (jd < jdEnd) {
    const r = swe.lun_eclipse_when(jd, ECL_FLAGS, lunarFlags, 0);
    if (!r || r.length < 2) break;
    const retflag = r[0];
    const peakJd = r[1];
    if (retflag <= 0 || !Number.isFinite(peakJd) || peakJd <= jd || peakJd > jdEnd) break;
    const lon = swe.calc(peakJd, BODIES.Moon, SEFLG_MOSEPH).longitude;
    events.push({
      utc: jdToIso(swe, peakJd),
      jd: Number(peakJd.toFixed(6)),
      type: "eclipse-lunar",
      body: "Moon",
      sign: getSign(lon),
      lon: Number(lon.toFixed(6)),
      geodeticZone: geodeticZoneFor(lon),
      meta: { eclipseType: eclipseTypeName(retflag) },
    });
    jd = peakJd + 0.5;
  }
  return events;
}

/** Pair the consecutive station events into retrograde-spans (retro start → direct end). */
function deriveRetrogradeSpans(events: PatternEvent[]): PatternEvent[] {
  const spans: PatternEvent[] = [];
  const open: Record<string, PatternEvent> = {};
  for (const e of events) {
    if (e.type !== "station") continue;
    const dir = e.meta?.direction;
    if (dir === "retrograde") {
      open[e.body] = e;
    } else if (dir === "direct" && open[e.body]) {
      const start = open[e.body];
      delete open[e.body];
      spans.push({
        utc: start.utc,
        jd: start.jd,
        type: "retrograde-span",
        body: e.body,
        sign: start.sign,
        lon: start.lon,
        geodeticZone: start.geodeticZone,
        meta: {
          startUtc: start.utc,
          endUtc: e.utc,
          startSign: start.sign ?? "",
          endSign: e.sign ?? "",
          startLon: start.lon ?? 0,
          endLon: e.lon ?? 0,
          durationDays: Number((e.jd - start.jd).toFixed(2)),
        },
      });
    }
  }
  return spans;
}

/** Detect exact moments of conjunction/square/opposition between every outer-body pair. */
function detectAspects(swe: Swe, jdStart: number, jdEnd: number): PatternEvent[] {
  const events: PatternEvent[] = [];
  const STEP = 1.0;

  const angle = (jd: number, a: string, b: string) => {
    const la = swe.calc(jd, BODIES[a], flagsFor(a)).longitude;
    const lb = swe.calc(jd, BODIES[b], flagsFor(b)).longitude;
    return ((la - lb) % 360 + 360) % 360; // [0,360)
  };

  const bisectAspect = (a: string, b: string, target: number, lo: number, hi: number) => {
    const f = (jd: number) => {
      let d = angle(jd, a, b) - target;
      if (d > 180) d -= 360;
      else if (d < -180) d += 360;
      return d;
    };
    let l = lo, h = hi;
    const fl = f(l);
    for (let i = 0; i < 24; i++) {
      const m = (l + h) / 2;
      const fm = f(m);
      if ((fl < 0) === (fm < 0)) l = m;
      else h = m;
    }
    return h;
  };

  for (let i = 0; i < ASPECT_BODIES.length; i++) {
    for (let j = i + 1; j < ASPECT_BODIES.length; j++) {
      const a = ASPECT_BODIES[i];
      const b = ASPECT_BODIES[j];
      let prev: number | null = null;
      let prevJd = jdStart;
      for (let jd = jdStart; jd <= jdEnd; jd += STEP) {
        const ang = angle(jd, a, b);
        if (prev !== null) {
          for (const aspect of HARD_ASPECTS) {
            // shifted angle: distance to target, mapped to (-180, 180]
            const shift = (x: number) => {
              let d = x - aspect.angle;
              if (d > 180) d -= 360;
              else if (d < -180) d += 360;
              return d;
            };
            const sPrev = shift(prev);
            const sNow = shift(ang);
            if ((sPrev < 0) !== (sNow < 0) && Math.abs(sPrev - sNow) < 30) {
              const exactJd = bisectAspect(a, b, aspect.angle, prevJd, jd);
              const lonA = swe.calc(exactJd, BODIES[a], flagsFor(a)).longitude;
              const lonB = swe.calc(exactJd, BODIES[b], flagsFor(b)).longitude;
              events.push({
                utc: jdToIso(swe, exactJd),
                jd: Number(exactJd.toFixed(6)),
                type: "aspect",
                body: `${a}-${b}`,
                sign: getSign(lonA),
                lon: Number(lonA.toFixed(6)),
                geodeticZone: geodeticZoneFor(lonA),
                meta: {
                  aspect: aspect.name,
                  body1: a,
                  body2: b,
                  lon1: Number(lonA.toFixed(6)),
                  lon2: Number(lonB.toFixed(6)),
                  anaretic: isAnaretic(lonA) || isAnaretic(lonB),
                },
              });
            }
          }
        }
        prev = ang;
        prevJd = jd;
      }
    }
  }
  return events;
}

/** For each outer-body pair, emit ingresses of the midpoint as it crosses sign boundaries. */
function detectMidpointIngresses(swe: Swe, jdStart: number, jdEnd: number): PatternEvent[] {
  const events: PatternEvent[] = [];
  const STEP = 1.0;

  const midpoint = (jd: number, a: string, b: string) => {
    const la = swe.calc(jd, BODIES[a], flagsFor(a)).longitude;
    const lb = swe.calc(jd, BODIES[b], flagsFor(b)).longitude;
    let m = (la + lb) / 2;
    // unwrap shorter-arc midpoint
    if (Math.abs(la - lb) > 180) m = (m + 180) % 360;
    return ((m % 360) + 360) % 360;
  };

  const bisectMid = (a: string, b: string, lo: number, hi: number, fromSign: string) => {
    let l = lo, h = hi;
    for (let i = 0; i < 24; i++) {
      const m = (l + h) / 2;
      if (getSign(midpoint(m, a, b)) === fromSign) l = m;
      else h = m;
    }
    return h;
  };

  for (const [a, b] of MIDPOINT_PAIRS) {
    let prevSign: string | null = null;
    let prevJd = jdStart;
    for (let jd = jdStart; jd <= jdEnd; jd += STEP) {
      let signNow: string;
      try { signNow = getSign(midpoint(jd, a, b)); } catch { prevSign = null; continue; }
      if (prevSign && prevSign !== signNow) {
        const exactJd = bisectMid(a, b, prevJd, jd, prevSign);
        const lon = midpoint(exactJd, a, b);
        events.push({
          utc: jdToIso(swe, exactJd),
          jd: Number(exactJd.toFixed(6)),
          type: "midpoint-ingress",
          body: `${a}/${b}`,
          fromSign: prevSign,
          toSign: signNow,
          lon: Number(lon.toFixed(6)),
          geodeticZone: geodeticZoneFor(lon),
          meta: { body1: a, body2: b, anaretic: isAnaretic(lon) },
        });
      }
      prevSign = signNow;
      prevJd = jd;
    }
  }
  return events;
}

/**
 * Stelliums: 3+ planets within STELLIUM_ORB_DEG (5°) of each other. A "span"
 * is a contiguous period where the same exact member set persists.
 */
function detectStelliums(swe: Swe, jdStart: number, jdEnd: number): PatternEvent[] {
  const STEP = 1.0;
  type Open = { start: number; last: number; members: string[]; centerLon: number };
  const open = new Map<string, Open>();
  const out: PatternEvent[] = [];

  const findCluster = (jd: number): { members: string[]; centerLon: number } | null => {
    const positions: Array<{ name: string; lon: number }> = [];
    for (const name of STELLIUM_BODIES) {
      try {
        const r = swe.calc(jd, BODIES[name], flagsFor(name));
        positions.push({ name, lon: ((r.longitude % 360) + 360) % 360 });
      } catch { /* skip unavailable bodies */ }
    }
    // Wrap: duplicate each + 360 so a cluster straddling 0° still matches.
    const extended = [
      ...positions,
      ...positions.map((p) => ({ name: p.name, lon: p.lon + 360 })),
    ].sort((a, b) => a.lon - b.lon);

    let bestMembers: string[] = [];
    let bestCenter = 0;
    for (let i = 0; i < extended.length; i++) {
      let j = i;
      while (j + 1 < extended.length && extended[j + 1].lon - extended[i].lon <= STELLIUM_ORB_DEG) j++;
      const names = new Set(extended.slice(i, j + 1).map((p) => p.name));
      if (names.size > bestMembers.length && names.size >= STELLIUM_MIN) {
        bestMembers = [...names].sort();
        bestCenter = ((extended[i].lon + extended[j].lon) / 2) % 360;
      }
    }
    return bestMembers.length >= STELLIUM_MIN ? { members: bestMembers, centerLon: bestCenter } : null;
  };

  const closeSpan = (key: string, o: Open) => {
    out.push({
      utc: jdToIso(swe, o.start),
      jd: Number(o.start.toFixed(6)),
      type: "stellium",
      body: o.members.join("+"),
      sign: getSign(o.centerLon),
      lon: Number(o.centerLon.toFixed(6)),
      geodeticZone: geodeticZoneFor(o.centerLon),
      meta: {
        startUtc: jdToIso(swe, o.start),
        endUtc: jdToIso(swe, o.last),
        durationDays: Number((o.last - o.start).toFixed(2)),
        members: o.members.join(","),
        count: o.members.length,
      },
    });
    open.delete(key);
  };

  for (let jd = jdStart; jd <= jdEnd; jd += STEP) {
    const cluster = findCluster(jd);
    const key = cluster ? cluster.members.join(",") : "";

    // Close any span whose key is not today's
    for (const [k, o] of open) if (k !== key) closeSpan(k, o);

    if (cluster) {
      const existing = open.get(key);
      if (existing) {
        existing.last = jd;
        existing.centerLon = cluster.centerLon;
      } else {
        open.set(key, { start: jd, last: jd, members: cluster.members, centerLon: cluster.centerLon });
      }
    }
  }
  for (const [k, o] of open) closeSpan(k, o);
  return out;
}

/** OOB spans: body crosses |declination| threshold; emit a span per crossing pair. */
function detectOOBSpans(swe: Swe, jdStart: number, jdEnd: number): PatternEvent[] {
  const STEP = 1.0;
  const out: PatternEvent[] = [];
  // Bodies worth tracking OOB for: Moon + all classical/modern planets.
  const BODIES_TO_CHECK = ["Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];

  for (const name of BODIES_TO_CHECK) {
    const pid = BODIES[name];
    const flags = flagsFor(name);
    type Open = { start: number; peakDec: number; peakLon: number };
    let open: Open | null = null;
    let prevDec: number | null = null;
    let prevJd = jdStart;

    const getDec = (jd: number) => {
      try {
        const r = swe.calc(jd, pid, flags);
        // r.latitude may not be exposed; default to 0 (Moon has real latitude but SE returns it).
        const lat = (r as unknown as { latitude?: number }).latitude ?? 0;
        return { dec: computeDeclination(r.longitude, lat), lon: r.longitude };
      } catch { return null; }
    };

    for (let jd = jdStart; jd <= jdEnd; jd += STEP) {
      const cur = getDec(jd);
      if (!cur) continue;
      const absDec = Math.abs(cur.dec);
      const wasOob = prevDec !== null && Math.abs(prevDec) > OOB_DECLINATION_DEG;
      const isOob = absDec > OOB_DECLINATION_DEG;

      if (!wasOob && isOob) {
        open = { start: jd, peakDec: cur.dec, peakLon: cur.lon };
      } else if (open) {
        if (absDec > Math.abs(open.peakDec)) { open.peakDec = cur.dec; open.peakLon = cur.lon; }
        if (wasOob && !isOob) {
          const end = jd;
          out.push({
            utc: jdToIso(swe, open.start),
            jd: Number(open.start.toFixed(6)),
            type: "oob-span",
            body: name,
            sign: getSign(open.peakLon),
            lon: Number(open.peakLon.toFixed(6)),
            geodeticZone: geodeticZoneFor(open.peakLon),
            meta: {
              startUtc: jdToIso(swe, open.start),
              endUtc: jdToIso(swe, end),
              durationDays: Number((end - open.start).toFixed(2)),
              peakDeclination: Number(open.peakDec.toFixed(4)),
              hemisphere: open.peakDec >= 0 ? "north" : "south",
            },
          });
          open = null;
        }
      }

      prevDec = cur.dec;
      prevJd = jd;
    }
    // Close any open span at year end
    if (open) {
      out.push({
        utc: jdToIso(swe, open.start),
        jd: Number(open.start.toFixed(6)),
        type: "oob-span",
        body: name,
        sign: getSign(open.peakLon),
        lon: Number(open.peakLon.toFixed(6)),
        geodeticZone: geodeticZoneFor(open.peakLon),
        meta: {
          startUtc: jdToIso(swe, open.start),
          endUtc: jdToIso(swe, jdEnd),
          durationDays: Number((jdEnd - open.start).toFixed(2)),
          peakDeclination: Number(open.peakDec.toFixed(4)),
          hemisphere: open.peakDec >= 0 ? "north" : "south",
          ongoingAtYearEnd: true,
        },
      });
    }
    void prevJd; // keep linter quiet
  }
  return out;
}

/** Nodal axis activations: transiting body within NODAL_ORB_DEG of True Node (or anti-Node). */
function detectNodalActivations(swe: Swe, jdStart: number, jdEnd: number): PatternEvent[] {
  const STEP = 1.0;
  const out: PatternEvent[] = [];
  const NODE_PID = BODIES["True Node"];
  const NODE_FLAGS = flagsFor("True Node");

  for (const name of NODAL_TRANSIT_BODIES) {
    const pid = BODIES[name];
    const flags = flagsFor(name);
    let active: "node" | "anti" | null = null;
    let activeStart = 0;
    let activeLon = 0;

    const sepTo = (lon: number, target: number) => {
      const d = ((lon - target + 540) % 360) - 180;
      return Math.abs(d);
    };

    for (let jd = jdStart; jd <= jdEnd; jd += STEP) {
      let bodyLon: number, nodeLon: number;
      try {
        bodyLon = swe.calc(jd, pid, flags).longitude;
        nodeLon = swe.calc(jd, NODE_PID, NODE_FLAGS).longitude;
      } catch { continue; }
      const antiLon = (nodeLon + 180) % 360;
      const toNode = sepTo(bodyLon, nodeLon);
      const toAnti = sepTo(bodyLon, antiLon);

      const which: "node" | "anti" | null =
        toNode <= NODAL_ORB_DEG ? "node" :
        toAnti <= NODAL_ORB_DEG ? "anti" : null;

      if (active && which !== active) {
        // close previous
        out.push({
          utc: jdToIso(swe, activeStart),
          jd: Number(activeStart.toFixed(6)),
          type: "nodal-activation",
          body: name,
          sign: getSign(activeLon),
          lon: Number(activeLon.toFixed(6)),
          geodeticZone: geodeticZoneFor(activeLon),
          meta: {
            axis: active === "node" ? "North Node" : "Anti-Node (South Node)",
            startUtc: jdToIso(swe, activeStart),
            endUtc: jdToIso(swe, jd),
            durationDays: Number((jd - activeStart).toFixed(2)),
          },
        });
        active = null;
      }
      if (which && !active) {
        active = which;
        activeStart = jd;
        activeLon = bodyLon;
      }
    }
    if (active) {
      out.push({
        utc: jdToIso(swe, activeStart),
        jd: Number(activeStart.toFixed(6)),
        type: "nodal-activation",
        body: name,
        sign: getSign(activeLon),
        lon: Number(activeLon.toFixed(6)),
        geodeticZone: geodeticZoneFor(activeLon),
        meta: {
          axis: active === "node" ? "North Node" : "Anti-Node (South Node)",
          startUtc: jdToIso(swe, activeStart),
          endUtc: jdToIso(swe, jdEnd),
          durationDays: Number((jdEnd - activeStart).toFixed(2)),
          ongoingAtYearEnd: true,
        },
      });
    }
  }
  return out;
}

/**
 * All planets one side of Nodal axis: if ≥ ONE_SIDED_NODAL_THRESHOLD planets
 * are on the same 180° half relative to the True Node, open a span.
 */
function detectOneSidedNodal(swe: Swe, jdStart: number, jdEnd: number): PatternEvent[] {
  const STEP = 1.0;
  const out: PatternEvent[] = [];
  type Open = { start: number; last: number; side: "north" | "south"; peakCount: number };
  let open: Open | null = null;

  for (let jd = jdStart; jd <= jdEnd; jd += STEP) {
    let nodeLon: number;
    try { nodeLon = swe.calc(jd, BODIES["True Node"], flagsFor("True Node")).longitude; }
    catch { continue; }

    let north = 0, south = 0;
    for (const name of ONE_SIDED_NODAL_BODIES) {
      let lon: number;
      try { lon = swe.calc(jd, BODIES[name], flagsFor(name)).longitude; }
      catch { continue; }
      const rel = (((lon - nodeLon) % 360) + 360) % 360;
      if (rel < 180) north++; else south++;
    }
    const dominant: "north" | "south" | null =
      north >= ONE_SIDED_NODAL_THRESHOLD ? "north" :
      south >= ONE_SIDED_NODAL_THRESHOLD ? "south" : null;

    const closeOpen = (endJd: number) => {
      if (!open) return;
      out.push({
        utc: jdToIso(swe, open.start),
        jd: Number(open.start.toFixed(6)),
        type: "one-sided-nodal",
        body: "All planets",
        meta: {
          startUtc: jdToIso(swe, open.start),
          endUtc: jdToIso(swe, endJd),
          durationDays: Number((endJd - open.start).toFixed(2)),
          side: open.side,
          peakCount: open.peakCount,
          threshold: ONE_SIDED_NODAL_THRESHOLD,
        },
      });
      open = null;
    };

    if (open && dominant !== open.side) closeOpen(jd);
    if (dominant) {
      if (!open) {
        open = { start: jd, last: jd, side: dominant, peakCount: dominant === "north" ? north : south };
      } else {
        const cur = open.side === "north" ? north : south;
        if (cur > open.peakCount) open.peakCount = cur;
        open.last = jd;
      }
    }
  }
  if (open) {
    out.push({
      utc: jdToIso(swe, open.start),
      jd: Number(open.start.toFixed(6)),
      type: "one-sided-nodal",
      body: "All planets",
      meta: {
        startUtc: jdToIso(swe, open.start),
        endUtc: jdToIso(swe, jdEnd),
        durationDays: Number((jdEnd - open.start).toFixed(2)),
        side: open.side,
        peakCount: open.peakCount,
        threshold: ONE_SIDED_NODAL_THRESHOLD,
        ongoingAtYearEnd: true,
      },
    });
  }
  return out;
}

export async function computeYearEvents(year: number): Promise<PatternEvent[]> {
  const swe = await getSwe();
  const jdStart = swe.julday(year, 1, 1, 0);
  const jdEnd = swe.julday(year + 1, 1, 1, 0);
  const ingressStation = detectIngressesAndStations(swe, jdStart, jdEnd);
  const events = [
    ...ingressStation,
    ...detectLunations(swe, jdStart, jdEnd),
    ...detectEclipses(swe, jdStart, jdEnd),
    ...detectAspects(swe, jdStart, jdEnd),
    ...detectMidpointIngresses(swe, jdStart, jdEnd),
    ...deriveRetrogradeSpans(ingressStation),
    ...detectStelliums(swe, jdStart, jdEnd),
    ...detectOOBSpans(swe, jdStart, jdEnd),
    ...detectNodalActivations(swe, jdStart, jdEnd),
    ...detectOneSidedNodal(swe, jdStart, jdEnd),
  ];
  events.sort((a, b) => a.jd - b.jd);
  return events;
}
