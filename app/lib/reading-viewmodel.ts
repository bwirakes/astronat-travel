/**
 * reading-viewmodel.ts — Adapter from `reading.details` to the V4 "101" view model.
 *
 * The V4 reading view (app/(frontend)/(app)/reading/[id]/components/v4) is fed
 * by this single function. Backend pipelines (lib/readings/astrocarto.ts) and
 * the demo mocks (lib/astro/mock-readings.ts) write very different shapes into
 * `reading.details` — this adapter is defensive and produces a normalized
 * shape the V4 components can render without further branching.
 */
import { houseFromLongitude, signFromLongitude } from "./geodetic";

// ─── Output shape ─────────────────────────────────────────────────────

export interface V4TravelWindow {
    rank: number;
    flavor: string;       // "Best match" | "Social window" | "Quiet window"
    flavorTitle: string;  // "Home-like, settling" — short
    emoji: string;
    dates: string;        // "May 12 – May 22, 2026"
    nights: string;       // "10 nights"
    score: number;        // 0–100
    note: string;         // plain-English why
    startISO: string;
    endISO: string;
}

export interface V4Vibe {
    icon: string;
    title: string;
    body: string;        // accepts inline <strong> via dangerouslySetInnerHTML
}

export interface V4Angle {
    name: string;        // "Rising (ASC)"
    plain: string;       // "How you come across"
    natal: string;       // "24° Aries" (best-effort)
    relocated: string;   // "11° Cancer"
    delta: string;       // sentence-long plain-English shift
}

export interface V4PlanetHouseRow {
    planet: string;
    glyph: string;
    natalHouse: string;     // "12 · behind the scenes"
    reloHouse: string;      // "10 · public life"
    shift: string;          // plain English
}

export interface V4AspectToAngle {
    planet: string;
    glyph: string;
    toAngle: string;        // "IC"
    aspect: string;         // "conjunct (0°)"
    strength: "exact" | "very strong" | "supportive" | "moderate" | "gentle";
    plain: string;
    wasNatal: string;
}

export interface V4ChartAngle {
    k: "ASC" | "IC" | "DSC" | "MC";
    name: string;
    deg: number;            // ecliptic longitude (0–360)
    plain: string;
}

export interface V4ChartPlanet {
    p: string;
    glyph: string;
    deg: number;
    color: string;
    plain: string;
}

export interface V4ChartAspect {
    id: string;
    kind: "strongest" | "supportive" | "friction";
    from: { deg: number; p: string; isTransit?: boolean };
    to: { deg: number; p: string; isAngle?: boolean; isNatal?: boolean };
    title: string;
    what: string;
    why: string;
    timing: string;
}

export interface V4ChartMonth {
    key: string;            // "May" / "Jun" / "Jul"
    label: string;          // "May 2026"
    score: number;          // 0–100
    summary: string;
    transits: V4ChartPlanet[];
    aspects: V4ChartAspect[];
}

export interface V4LineRow {
    planet: string;
    glyph: string;
    angle: string;          // "MC" / "IC" / "ASC" / "DSC"
    distKm: number;
    color: string;
    note: string;
}

export interface V4WeekRow {
    w: number;
    range: string;
    title: string;
    body: string;
}

export interface V4ReadingVM {
    location: { city: string; region: string; lat: number; lon: number };
    generated: string;
    travelDateISO: string | null;

    hero: {
        bestWindow: V4TravelWindow;
        explainer: string;     // "That's a 10-night window where the skies..."
    };
    travelWindows: V4TravelWindow[];   // length 1–3, hero is index 0

    vibes: V4Vibe[];                    // exactly 3

    chart: {
        angles: V4ChartAngle[];
        natal: V4ChartPlanet[];
        months: V4ChartMonth[];         // 3
    };

    callout: string;                    // small explanation under chart

    todo: Array<{ title: string; body: string }>;  // 4 items

    astrology: {
        lines: V4LineRow[];
        weeks: V4WeekRow[];             // weekly narrative (may be empty until streamed)
    };

    relocated: {
        birth: { place: string; coords: string; date: string };
        travel: { place: string; coords: string; window: string };
        angles: V4Angle[];
        planetsInHouses: V4PlanetHouseRow[];
        aspectsToAngles: V4AspectToAngle[];
        glossary: Array<{ term: string; def: string }>;
    };
}

// ─── Constants and dictionaries ──────────────────────────────────────

const PLANET_GLYPH: Record<string, string> = {
    sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
    jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
    chiron: "⚷", "north node": "☊", "true node": "☊",
};

const PLANET_COLOR_VAR: Record<string, string> = {
    sun: "var(--gold)",
    moon: "var(--color-planet-moon)",
    mercury: "var(--color-planet-mercury)",
    venus: "var(--color-planet-venus)",
    mars: "var(--color-planet-mars)",
    jupiter: "var(--color-planet-jupiter)",
    saturn: "var(--color-planet-saturn)",
    uranus: "var(--color-planet-uranus)",
    neptune: "var(--color-planet-neptune)",
    pluto: "var(--color-planet-pluto)",
};

const PLANET_PLAIN: Record<string, string> = {
    sun: "Your core identity.",
    moon: "Your emotional life, what comforts you.",
    mercury: "How you think and talk.",
    venus: "Love, pleasure, beauty, money.",
    mars: "Drive, anger, how you pursue things.",
    jupiter: "Luck, growth, big ideas.",
    saturn: "Discipline, structure, what takes time.",
    uranus: "Sudden changes, freedom, surprise.",
    neptune: "Dreams, spirituality, what dissolves.",
    pluto: "Power, transformation, what's hidden.",
};

const HOUSE_LABEL: Record<number, string> = {
    1: "1 · self",
    2: "2 · resources",
    3: "3 · learning, siblings",
    4: "4 · home, roots",
    5: "5 · creativity, romance",
    6: "6 · daily work",
    7: "7 · partnership",
    8: "8 · shared, depth",
    9: "9 · big ideas, travel",
    10: "10 · public life",
    11: "11 · community",
    12: "12 · behind the scenes",
};

// LIFE_EVENT (from app/lib/planet-library.ts) → vibe presentation
const VIBE_PRESET: Record<string, { icon: string; title: string }> = {
    "Identity & Self-Discovery":     { icon: "✦", title: "You'll come into focus." },
    "Wealth & Financial Growth":     { icon: "✺", title: "Resources line up." },
    "Home, Family & Roots":          { icon: "⌂", title: "It feels like home." },
    "Romance & Love":                { icon: "♡", title: "Soft, romantic weather." },
    "Health, Routine & Wellness":    { icon: "✚", title: "Your body settles." },
    "Partnerships & Marriage":       { icon: "◎", title: "You'll meet teachers." },
    "Career & Public Recognition":   { icon: "▲", title: "Your direction sharpens." },
    "Friendship & Networking":       { icon: "◈", title: "New people enter." },
    "Spirituality & Inner Peace":    { icon: "✧", title: "Things get quieter inside." },
};

const ANGLE_PLAIN: Record<"ASC"|"IC"|"DSC"|"MC", { name: string; plain: string }> = {
    ASC: { name: "Rising (ASC)",    plain: "How you come across" },
    IC:  { name: "IC · home point", plain: "What feels like home" },
    DSC: { name: "Descendant",      plain: "Who you attract" },
    MC:  { name: "MC · direction",  plain: "Your public calling" },
};

const ANGLE_CHART_PLAIN: Record<"ASC"|"IC"|"DSC"|"MC", string> = {
    ASC: "How you come across to people here. Your \"first impression\" angle.",
    IC:  "What feels like home. The most private, residential angle.",
    DSC: "Who you attract — partners, teachers, close others.",
    MC:  "Your public calling. What you want to be known for.",
};

const STATIC_GLOSSARY = [
    { term: "Relocated chart", def: "Your birth chart recalculated as if you had been born in the new location. The planets stay the same; the houses and angles rotate." },
    { term: "Angles (ASC/IC/DSC/MC)", def: "The four \"corners\" of a chart. They change the fastest when you move — they are the main reason places feel different." },
    { term: "Houses", def: "Twelve slices of life (self, home, work, relationships, etc). Planets move through different houses when you change location." },
    { term: "Aspects", def: "Angular relationships between planets and the four corners. Conjunctions (0°) are strongest; sextiles (60°) and trines (120°) are supportive; squares (90°) are friction." },
];

// ─── Small helpers ────────────────────────────────────────────────────

function glyph(name: string): string {
    return PLANET_GLYPH[name?.toLowerCase()] ?? "★";
}
function planetColor(name: string): string {
    return PLANET_COLOR_VAR[name?.toLowerCase()] ?? "var(--color-y2k-blue)";
}
function planetPlain(name: string): string {
    return PLANET_PLAIN[name?.toLowerCase()] ?? `Your ${name}.`;
}
function fmtSignDeg(lon: number | undefined): string {
    if (typeof lon !== "number" || !isFinite(lon)) return "—";
    const norm = ((lon % 360) + 360) % 360;
    const sign = signFromLongitude(norm);
    const deg = Math.floor(norm % 30);
    return `${deg}° ${sign}`;
}
function shortDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtRange(startISO: string, endISO: string): string {
    const s = new Date(startISO);
    const e = new Date(endISO);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return `${startISO} – ${endISO}`;
    const yr = e.getFullYear();
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${yr}`;
}
function nightsBetween(startISO: string, endISO: string): string {
    const s = new Date(startISO);
    const e = new Date(endISO);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return "—";
    const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86_400_000));
    return `${days} ${days === 1 ? "night" : "nights"}`;
}

// Aspect orb-classification (used for both Step 7 and Step 4 chart)
const ASPECTS = [
    { name: "conjunct",  angle: 0,   plain: "sitting on top of" },
    { name: "sextile",   angle: 60,  plain: "supportively angled to" },
    { name: "square",    angle: 90,  plain: "in friction with" },
    { name: "trine",     angle: 120, plain: "flowing easily into" },
    { name: "opposition",angle: 180, plain: "directly across from" },
];

function angSep(a: number, b: number): number {
    // Smallest angular separation in [0, 180].
    const d = ((a - b) % 360 + 360) % 360;
    return d > 180 ? 360 - d : d;
}

function classifyAspect(planetLon: number, angleLon: number, orbDeg = 8):
    { name: string; angle: number; plain: string; orb: number } | null {
    const sep = angSep(planetLon, angleLon);
    let best: { name: string; angle: number; plain: string; orb: number } | null = null;
    for (const a of ASPECTS) {
        const orb = Math.abs(sep - a.angle);
        if (orb <= orbDeg && (!best || orb < best.orb)) {
            best = { ...a, orb };
        }
    }
    return best;
}

function strengthFromOrb(orb: number, aspectAngle: number): V4AspectToAngle["strength"] {
    if (aspectAngle === 0 && orb < 1.5) return "exact";
    if (aspectAngle === 0 && orb < 4)   return "very strong";
    if (orb < 2)                        return "very strong";
    if (aspectAngle === 90 || aspectAngle === 180) return "moderate";
    return orb < 4 ? "supportive" : "gentle";
}

// ─── travelWindows derivation ─────────────────────────────────────────

const FLAVORS: Array<{ flavor: string; flavorTitle: string; emoji: string }> = [
    { flavor: "Best match",    flavorTitle: "Home-like, settling",  emoji: "✦" },
    { flavor: "Social window", flavorTitle: "Meeting people",       emoji: "✧" },
    { flavor: "Quiet window",  flavorTitle: "Commit to something",  emoji: "✷" },
];

function deriveTravelWindows(reading: any): V4TravelWindow[] {
    // 1. If a weather forecast is present and has interpretation.travelWindows, use it.
    const wfWindows = reading?.weatherForecast?.interpretation?.travelWindows;
    if (Array.isArray(wfWindows) && wfWindows.length) {
        return wfWindows.slice(0, 3).map((w: any, i: number) => ({
            rank: i + 1,
            flavor: FLAVORS[i]?.flavor ?? "Window",
            flavorTitle: FLAVORS[i]?.flavorTitle ?? "",
            emoji: FLAVORS[i]?.emoji ?? "✦",
            dates: w.label || w.dates || fmtRange(w.startDate ?? w.start ?? "", w.endDate ?? w.end ?? ""),
            nights: w.nights || nightsBetween(w.startDate ?? w.start ?? "", w.endDate ?? w.end ?? ""),
            score: typeof w.score === "number" ? Math.round(w.score) : 80,
            note: w.note || w.rationale || "",
            startISO: w.startDate ?? w.start ?? "",
            endISO: w.endDate ?? w.end ?? "",
        }));
    }

    // 2. Fall back to transitWindows. Two known shapes.
    const tw = reading?.transitWindows;
    if (Array.isArray(tw) && tw.length) {
        // Mock shape: { transit, type, start, end, recommendation }
        // Real shape: TransitHit { date, transit_planet, natal_planet, aspect, orb, applying, benefic }
        const isHitShape = tw[0] && "transit_planet" in tw[0];

        if (isHitShape) {
            // Group by ±5 days to make windows
            const benefics = tw.filter((h: any) => h.benefic).slice(0, 3);
            return benefics.map((h: any, i: number) => {
                const start = new Date(h.date);
                const end = new Date(start.getTime() + 7 * 86_400_000);
                return {
                    rank: i + 1,
                    flavor: FLAVORS[i]?.flavor ?? "Window",
                    flavorTitle: FLAVORS[i]?.flavorTitle ?? "",
                    emoji: FLAVORS[i]?.emoji ?? "✦",
                    dates: fmtRange(start.toISOString(), end.toISOString()),
                    nights: nightsBetween(start.toISOString(), end.toISOString()),
                    score: Math.max(60, 95 - i * 6),
                    note: `${h.transit_planet} ${h.aspect} natal ${h.natal_planet}. Tight ${h.orb.toFixed(1)}° orb.`,
                    startISO: start.toISOString(),
                    endISO: end.toISOString(),
                };
            });
        }

        // Mock-ish shape
        return tw.slice(0, 3).map((w: any, i: number) => ({
            rank: i + 1,
            flavor: FLAVORS[i]?.flavor ?? "Window",
            flavorTitle: FLAVORS[i]?.flavorTitle ?? "",
            emoji: FLAVORS[i]?.emoji ?? "✦",
            dates: fmtRange(w.start, w.end),
            nights: nightsBetween(w.start, w.end),
            score: typeof w.score === "number" ? w.score : Math.max(60, 90 - i * 6),
            note: w.recommendation || w.note || w.transit || "",
            startISO: w.start,
            endISO: w.end,
        }));
    }

    // 3. Last resort: synthesize one window from travelDate + macroScore.
    const baseISO = reading?.travelDate || new Date().toISOString().slice(0, 10);
    const start = new Date(baseISO);
    const end = new Date(start.getTime() + 9 * 86_400_000);
    return [{
        rank: 1,
        flavor: "Best match", flavorTitle: "Home-like, settling", emoji: "✦",
        dates: fmtRange(start.toISOString(), end.toISOString()),
        nights: nightsBetween(start.toISOString(), end.toISOString()),
        score: reading?.macroScore || 75,
        note: "Your travel window.",
        startISO: start.toISOString(),
        endISO: end.toISOString(),
    }];
}

// ─── Vibes (Step 3) ───────────────────────────────────────────────────

function deriveVibes(reading: any): V4Vibe[] {
    const eventScores = reading?.eventScores
        || reading?.matrixResult?.eventScores
        || reading?.details?.eventScores
        || [];

    const teacherLeanInto: string[] = reading?.teacherReading?.summary?.leanInto || [];

    let topEvents: any[] = [];
    if (Array.isArray(eventScores) && eventScores.length) {
        topEvents = [...eventScores].sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0)).slice(0, 3);
    }

    const fallbackBodies = [
        "<strong>This is the strongest signal</strong> for you here. Pay attention to it first — it'll set the tone for everything else.",
        "<strong>A real, second source of life</strong> at this place. Worth planning around.",
        "<strong>A subtler thread</strong>, but real. It tends to show up later in a trip.",
    ];

    if (topEvents.length === 3) {
        return topEvents.map((ev, i) => {
            const preset = VIBE_PRESET[ev.eventName] || { icon: "✦", title: ev.eventName };
            const body = teacherLeanInto[i] || fallbackBodies[i];
            return { icon: preset.icon, title: preset.title, body };
        });
    }

    // Fallback when no event scores: use teacherReading or a generic 3
    const titles = ["It feels like home.", "You'll meet teachers.", "Your direction softens."];
    const icons = ["⌂", "◎", "◈"];
    return titles.map((title, i) => ({
        icon: icons[i],
        title,
        body: teacherLeanInto[i] || fallbackBodies[i],
    }));
}

// ─── Step 4: chart angles + natal + months ───────────────────────────

function getAngleLons(reading: any): { ASC: number; IC: number; DSC: number; MC: number } | null {
    const cusps: number[] | undefined = reading?.relocatedCusps;
    if (!Array.isArray(cusps) || cusps.length < 12) return null;
    // Standard: cusps[0]=ASC, cusps[3]=IC, cusps[6]=DSC, cusps[9]=MC
    return { ASC: cusps[0], IC: cusps[3], DSC: cusps[6], MC: cusps[9] };
}

function deriveChartAngles(reading: any): V4ChartAngle[] {
    const lons = getAngleLons(reading);
    // The wheel uses screen-relative angles where ASC sits on the left (180°),
    // MC on top (90°), DSC on the right (0°), IC on the bottom (270°). When we
    // know real ecliptic longitudes we honor them directly; otherwise fall
    // back to the canonical wheel positions.
    if (!lons) {
        return (["ASC", "IC", "DSC", "MC"] as const).map(k => ({
            k, name: ANGLE_PLAIN[k].name.split(" ")[0],
            deg: { ASC: 180, IC: 270, DSC: 0, MC: 90 }[k],
            plain: ANGLE_CHART_PLAIN[k],
        }));
    }
    return (["ASC", "IC", "DSC", "MC"] as const).map(k => ({
        k,
        name: ANGLE_PLAIN[k].name.split(" ")[0],
        deg: lons[k],
        plain: ANGLE_CHART_PLAIN[k],
    }));
}

function deriveChartNatal(reading: any): V4ChartPlanet[] {
    const planets = reading?.natalPlanets || [];
    return planets.slice(0, 7).map((p: any) => {
        const name = (p.name || p.planet || "").toString();
        return {
            p: name,
            glyph: glyph(name),
            deg: typeof p.longitude === "number" ? p.longitude : 0,
            color: planetColor(name),
            plain: planetPlain(name),
        };
    });
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_KEYS   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function deriveChartMonths(reading: any, anchorISO: string | null): V4ChartMonth[] {
    // Anchor: travelDate's month if available, else now. Build months [-1, 0, +1].
    const anchor = anchorISO ? new Date(anchorISO) : new Date();
    if (isNaN(anchor.getTime())) anchor.setTime(Date.now());

    const months: Array<{ start: Date; end: Date; label: string; key: string }> = [];
    for (let i = -1; i <= 1; i++) {
        const m = new Date(anchor.getFullYear(), anchor.getMonth() + i, 1);
        const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
        months.push({
            start: m,
            end: next,
            label: `${MONTH_LABELS[m.getMonth()]} ${m.getFullYear()}`,
            key: MONTH_KEYS[m.getMonth()],
        });
    }

    const transitHits: any[] = Array.isArray(reading?.transitWindows) ? reading.transitWindows : [];
    const isHitShape = transitHits[0] && "transit_planet" in transitHits[0];
    const angleLons = getAngleLons(reading);
    const natalPlanetMap = new Map<string, number>();
    for (const p of (reading?.natalPlanets || [])) {
        const n = (p.name || p.planet || "").toString().toLowerCase();
        if (n && typeof p.longitude === "number") natalPlanetMap.set(n, p.longitude);
    }

    const teacherWeather: any[] = reading?.teacherReading?.signals?.weather || [];

    return months.map((m, monthIdx) => {
        const inRange = isHitShape
            ? transitHits.filter((h: any) => {
                const d = new Date(h.date);
                return d >= m.start && d < m.end;
            })
            : [];

        // Build ChartAspect[] from up to 3 hits per month.
        const aspects: V4ChartAspect[] = inRange.slice(0, 3).map((h: any, i: number): V4ChartAspect => {
            const transitPlanet = (h.transit_planet || "").toString();
            const natalPlanet = (h.natal_planet || "").toString();
            const isAngleTarget = ["ASC","IC","DSC","MC"].includes(natalPlanet.toUpperCase());
            const targetDeg = isAngleTarget && angleLons
                ? angleLons[natalPlanet.toUpperCase() as "ASC"|"IC"|"DSC"|"MC"]
                : (natalPlanetMap.get(natalPlanet.toLowerCase()) ?? 0);

            // Use the transiting planet's actual sky longitude on the hit date
            // (persisted on TransitHit since the V4 follow-up). Cached hits
            // written before that field landed fall back to the target degree
            // so the line still renders, just as a "hit" rather than a true
            // geometric position.
            const fromDeg = typeof h.transit_planet_lon === "number" ? h.transit_planet_lon : targetDeg;
            const kind: V4ChartAspect["kind"] = h.benefic ? "supportive" : "friction";
            const aspectName = (h.aspect || "").toString();
            const isStrong = i === 0 && (h.orb ?? 99) < 2;

            const tw = teacherWeather[monthIdx * 2 + i];
            const why = tw?.body
                || `${transitPlanet} ${aspectName} your ${natalPlanet}. ${h.benefic ? "Easeful." : "Useful pressure."}`;
            const timing = tw?.datesRange || `${shortDate(h.date)}, orb ${(h.orb ?? 0).toFixed(1)}°`;

            return {
                id: `${m.key}-${i}-${transitPlanet}-${natalPlanet}`,
                kind: isStrong ? "strongest" : kind,
                from: { deg: fromDeg, p: `${transitPlanet} ${glyph(transitPlanet)}`, isTransit: true },
                to: isAngleTarget
                    ? { deg: targetDeg, p: `Your ${natalPlanet}`, isAngle: true }
                    : { deg: targetDeg, p: `Your natal ${natalPlanet} ${glyph(natalPlanet)}`, isNatal: true },
                title: `${transitPlanet} ${aspectName} ${isAngleTarget ? `your ${natalPlanet}` : `your natal ${natalPlanet}`}`,
                what: aspectName,
                why,
                timing,
            };
        });

        // Transits visible on the wheel — one dot per unique transit planet,
        // colored. We don't know the precise sky longitude for the month, so
        // distribute them around the wheel to read as "active for the month".
        const seen = new Set<string>();
        const transits: V4ChartPlanet[] = [];
        for (const h of inRange) {
            const name = (h.transit_planet || "").toString();
            if (!name || seen.has(name)) continue;
            seen.add(name);
            transits.push({
                p: name,
                glyph: glyph(name),
                deg: aspects.find(a => a.from.p.startsWith(name))?.from.deg ?? (transits.length * 60) % 360,
                color: planetColor(name),
                plain: `${name} is active in ${m.label}.`,
            });
            if (transits.length >= 4) break;
        }

        // Score: aspect count, weighted by benefic/malefic.
        const benefics = inRange.filter((h: any) => h.benefic).length;
        const malefics = inRange.filter((h: any) => !h.benefic).length;
        const score = Math.max(40, Math.min(98, 70 + benefics * 8 - malefics * 6));

        const summary = aspects[0]?.title
            ? `${aspects[0].title}. ${benefics} supportive, ${malefics} friction.`
            : `${benefics} supportive, ${malefics} friction this month.`;

        return {
            key: m.key,
            label: m.label,
            score,
            summary,
            transits,
            aspects,
        };
    });
}

// ─── Step 6: lines & weeks ────────────────────────────────────────────

function deriveLines(reading: any): V4LineRow[] {
    const lines = reading?.planetaryLines || reading?.acgLines || [];
    return lines.slice(0, 6).map((l: any) => {
        const planet = (l.planet || "").toString();
        const angle = (l.line || l.angle || "").toString().toUpperCase();
        const distRaw = l.distance ?? l.distance_km ?? l.dist_km ?? 0;
        const distKm = typeof distRaw === "string"
            ? Number((distRaw.match(/\d+/) || ["0"])[0])
            : Number(distRaw);
        return {
            planet,
            glyph: glyph(planet),
            angle,
            distKm: isFinite(distKm) ? distKm : 0,
            color: planetColor(planet),
            note: l.note || l.tier || `${planet} ${angle} line near your destination.`,
        };
    });
}

function deriveWeeks(reading: any, narrative: any): V4WeekRow[] {
    // Prefer streamed narrative.weeks if present.
    const weeks = narrative?.weeks
        || reading?.teacherReading?.weeks
        || reading?.weatherForecast?.interpretation?.weeks
        || [];
    return weeks.slice(0, 6).map((w: any, i: number) => ({
        w: w.w ?? i + 1,
        range: w.range ?? "",
        title: w.title ?? "",
        body: w.body ?? "",
    }));
}

// ─── Step 7: relocated chart ─────────────────────────────────────────

function deriveRelocatedAngles(reading: any): V4Angle[] {
    const lons = getAngleLons(reading);
    // Persisted by runAstrocarto as `natalAngles: { ASC, IC, DSC, MC }`.
    // Cached readings written before that field landed will fall back to "—".
    const natalAngles = reading?.natalAngles;
    const getNatal = (k: "ASC"|"IC"|"DSC"|"MC"): string => {
        if (natalAngles && typeof natalAngles[k] === "number") return fmtSignDeg(natalAngles[k]);
        return "—";
    };

    return (["ASC", "IC", "DSC", "MC"] as const).map(k => ({
        name: ANGLE_PLAIN[k].name,
        plain: ANGLE_PLAIN[k].plain,
        natal: getNatal(k),
        relocated: lons ? fmtSignDeg(lons[k]) : "—",
        delta: deltaCopy(k),
    }));
}

function deltaCopy(k: "ASC"|"IC"|"DSC"|"MC"): string {
    switch (k) {
        case "ASC": return "Your public-facing self shifts. People meet a slightly different version of you here.";
        case "IC":  return "What feels like home re-codes. The kind of room that settles you here may not be the kind that settles you back home.";
        case "DSC": return "You'll attract a different sort of person here — close encounters carry a different flavor.";
        case "MC":  return "What you want to be known for shifts. A quieter dream can sharpen into a real plan in this place.";
    }
}

function derivePlanetsInHouses(reading: any): V4PlanetHouseRow[] {
    const natalPlanets = reading?.natalPlanets || [];
    const lons = getAngleLons(reading);
    if (!natalPlanets.length || !lons) {
        // Best-effort with what we have.
        return natalPlanets.slice(0, 7).map((p: any) => {
            const name = (p.name || p.planet || "").toString();
            return {
                planet: name,
                glyph: glyph(name),
                natalHouse: HOUSE_LABEL[p.house] ?? "—",
                reloHouse: "—",
                shift: "Re-housing data will appear here once the relocated chart finishes computing.",
            };
        });
    }
    return natalPlanets.slice(0, 7).map((p: any) => {
        const name = (p.name || p.planet || "").toString();
        const natalHouseNum: number | undefined = typeof p.house === "number"
            ? p.house
            : undefined;
        const reloHouseNum = typeof p.longitude === "number"
            ? houseFromLongitude(p.longitude, lons.ASC)
            : 0;
        return {
            planet: name,
            glyph: glyph(name),
            natalHouse: natalHouseNum ? HOUSE_LABEL[natalHouseNum] : "—",
            reloHouse: HOUSE_LABEL[reloHouseNum] ?? `${reloHouseNum}`,
            shift: shiftCopy(name, natalHouseNum, reloHouseNum),
        };
    });
}

function shiftCopy(name: string, from: number | undefined, to: number): string {
    const lower = name.toLowerCase();
    const planetWord = PLANET_PLAIN[lower] ? lower : "this planet";
    const toLabel = HOUSE_LABEL[to]?.split(" · ")[1] ?? "a different area of life";
    const verbs: Record<string, string> = {
        sun: "Your core identity moves into",
        moon: "Your emotional life moves into",
        mercury: "Your thinking/talking moves into",
        venus: "Love and pleasure move into",
        mars: "Your drive moves into",
        jupiter: "Your luck and growth move into",
        saturn: "Discipline turns toward",
        uranus: "Disruption shows up in",
        neptune: "Dreams settle into",
        pluto: "Power and change concentrate in",
    };
    const verb = verbs[planetWord] || `Your ${name} moves into`;
    return `${verb} ${toLabel}.${from ? ` (Natally in ${HOUSE_LABEL[from]?.split(" · ")[1] ?? "another house"}.)` : ""}`;
}

function deriveAspectsToAngles(reading: any): V4AspectToAngle[] {
    const natalPlanets = reading?.natalPlanets || [];
    const lons = getAngleLons(reading);
    if (!natalPlanets.length || !lons) return [];

    const out: V4AspectToAngle[] = [];
    for (const p of natalPlanets) {
        const name = (p.name || p.planet || "").toString();
        const lon = p.longitude;
        if (typeof lon !== "number") continue;

        for (const k of ["ASC","IC","DSC","MC"] as const) {
            const cls = classifyAspect(lon, lons[k], 8);
            if (!cls) continue;
            const strength = strengthFromOrb(cls.orb, cls.angle);
            out.push({
                planet: name,
                glyph: glyph(name),
                toAngle: k,
                aspect: `${cls.name} (${cls.angle}°, orb ${cls.orb.toFixed(1)}°)`,
                strength,
                plain: aspectPlain(name, k, cls.name),
                wasNatal: "Natal comparison: orb shifts in this place.",
            });
        }
    }
    // Sort by orb (best/exact first), keep top 5.
    return out
        .sort((a, b) => parseFloat(a.aspect.match(/orb ([\d.]+)/)?.[1] || "9") -
                         parseFloat(b.aspect.match(/orb ([\d.]+)/)?.[1] || "9"))
        .slice(0, 5);
}

function aspectPlain(planet: string, angle: "ASC"|"IC"|"DSC"|"MC", aspectName: string): string {
    const angleWord = { ASC: "first impression", IC: "home point", DSC: "close partners", MC: "calling" }[angle];
    const aspectVerb: Record<string, string> = {
        conjunct: "sits directly on",
        sextile: "supportively angles to",
        square: "presses on",
        trine: "flows easily into",
        opposition: "sits across from",
    };
    const verb = aspectVerb[aspectName] || "relates to";
    return `${planet} ${verb} your ${angleWord}.`;
}

// ─── Public entry point ──────────────────────────────────────────────

export function toV4ViewModel(reading: any, narrative?: any): V4ReadingVM {
    const travelWindows = deriveTravelWindows(reading);
    const heroWindow = travelWindows[0];

    const city = (reading?.destination || "—").toString().split(",")[0]?.trim() || "—";
    const region = (reading?.destination || "").toString().split(",").slice(1).join(",").trim();

    const travelDateISO = reading?.travelDate
        ? new Date(reading.travelDate).toISOString().slice(0, 10)
        : null;

    const generated = (() => {
        const ts = reading?.generated || reading?.created_at;
        if (!ts) return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    })();

    return {
        location: {
            city,
            region,
            lat: reading?.destinationLat ?? 0,
            lon: reading?.destinationLon ?? 0,
        },
        generated,
        travelDateISO,

        hero: {
            bestWindow: heroWindow,
            explainer: heroExplainer(heroWindow, city),
        },
        travelWindows,

        vibes: deriveVibes(reading),

        chart: {
            angles: deriveChartAngles(reading),
            natal: deriveChartNatal(reading),
            months: deriveChartMonths(reading, travelDateISO),
        },

        callout: "The scores above come from counting how many supportive aspects (the solid and dashed blue lines) hit your chart in a given month, minus the friction aspects (coral).",

        todo: deriveTodo(heroWindow, city, reading),

        astrology: {
            lines: deriveLines(reading),
            weeks: deriveWeeks(reading, narrative),
        },

        relocated: {
            birth: deriveBirth(reading),
            travel: {
                place: reading?.destination || "—",
                coords: fmtCoords(reading?.destinationLat, reading?.destinationLon),
                window: heroWindow.dates,
            },
            angles: deriveRelocatedAngles(reading),
            planetsInHouses: derivePlanetsInHouses(reading),
            aspectsToAngles: deriveAspectsToAngles(reading),
            glossary: STATIC_GLOSSARY,
        },
    };
}

function heroExplainer(w: V4TravelWindow | undefined, city: string): string {
    if (!w) return "Your reading is being prepared.";
    return `That's a ${w.nights} window where the skies over ${city} are most aligned with your chart. If you can, book it. If you can't — there are two other good windows. Keep scrolling.`;
}

function deriveTodo(hero: V4TravelWindow | undefined, city: string, reading: any): Array<{ title: string; body: string }> {
    const teacherTodo: string[] = reading?.teacherReading?.summary?.leanInto || [];
    const baseDates = hero?.dates || "your best window";
    return [
        {
            title: `Check your calendar for ${baseDates}.`,
            body: `That's your best window. ${hero?.nights ?? "Around a week"} is the sweet spot — long enough to settle, short enough to stay open.`,
        },
        {
            title: "If those dates don't work, look at the other two windows.",
            body: "Both secondary windows are real — just flavored differently (social vs reflective).",
        },
        {
            title: `Book somewhere that matches the reading.`,
            body: teacherTodo[0] || `Lean into the parts of ${city} that match the dominant vibe above.`,
        },
        {
            title: "Plan a few solo mornings.",
            body: teacherTodo[1] || "The quieter signals in your chart need room. Don't fill every hour.",
        },
    ];
}

function deriveBirth(reading: any): { place: string; coords: string; date: string } {
    const profile = reading?.profile || {};
    return {
        place: profile.birth_city || reading?.birthCity || "—",
        coords: profile.birth_lat != null && profile.birth_lon != null
            ? fmtCoords(profile.birth_lat, profile.birth_lon)
            : "—",
        date: profile.birth_date || reading?.birthDate || "—",
    };
}

function fmtCoords(lat: number | undefined | null, lon: number | undefined | null): string {
    if (typeof lat !== "number" || typeof lon !== "number") return "—";
    const ns = lat >= 0 ? "N" : "S";
    const ew = lon >= 0 ? "E" : "W";
    return `${Math.abs(lat).toFixed(2)}°${ns} ${Math.abs(lon).toFixed(2)}°${ew}`;
}
