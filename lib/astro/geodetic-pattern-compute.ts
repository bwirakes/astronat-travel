/**
 * Shared event-detection primitives for /geodetic-patterns.
 *
 * Imports swisseph-wasm directly — keep this module out of client bundles.
 * Next marks "swisseph-wasm" as a server-external package (see next.config.ts).
 */

import SwissEph from "swisseph-wasm";
import {
  BODIES,
  HARD_ASPECTS,
  OUTER_BODIES,
  STATIONING_BODIES,
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
            meta: { retrograde: exactRes.longitudeSpeed < 0, anaretic: isAnaretic(exactRes.longitude) },
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
            meta: { direction: speed >= 0 ? "direct" : "retrograde", anaretic: isAnaretic(exactRes.longitude) },
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

  for (let i = 0; i < OUTER_BODIES.length; i++) {
    for (let j = i + 1; j < OUTER_BODIES.length; j++) {
      const a = OUTER_BODIES[i];
      const b = OUTER_BODIES[j];
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

  for (let i = 0; i < OUTER_BODIES.length; i++) {
    for (let j = i + 1; j < OUTER_BODIES.length; j++) {
      const a = OUTER_BODIES[i];
      const b = OUTER_BODIES[j];
      let prevSign: string | null = null;
      let prevJd = jdStart;
      for (let jd = jdStart; jd <= jdEnd; jd += STEP) {
        const sign = getSign(midpoint(jd, a, b));
        if (prevSign && prevSign !== sign) {
          const exactJd = bisectMid(a, b, prevJd, jd, prevSign);
          const lon = midpoint(exactJd, a, b);
          events.push({
            utc: jdToIso(swe, exactJd),
            jd: Number(exactJd.toFixed(6)),
            type: "midpoint-ingress",
            body: `${a}/${b}`,
            fromSign: prevSign,
            toSign: sign,
            lon: Number(lon.toFixed(6)),
            geodeticZone: geodeticZoneFor(lon),
            meta: { body1: a, body2: b, anaretic: isAnaretic(lon) },
          });
        }
        prevSign = sign;
        prevJd = jd;
      }
    }
  }
  return events;
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
  ];
  events.sort((a, b) => a.jd - b.jd);
  return events;
}
