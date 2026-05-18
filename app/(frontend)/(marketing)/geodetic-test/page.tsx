import type { ReactNode } from "react";
import type { ComputedPosition } from "@/lib/astro/transits";
import { getComputedSkyForDate, EPHEMERIS_DAILY_BODIES } from "@/lib/astro/ephemeris-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeGeodeticWeather, type GeodeticWeatherResult } from "@/app/lib/geodetic-weather";
import { ECLIPSES, LUNATIONS, STATIONS } from "@/app/lib/geodetic/geodetic-events";
import { HARD_ASPECTS_2026, MOON_CALENDAR_2026, triggersForWindow } from "@/app/lib/geodetic/weather-triggers";
import { FORECAST_WEATHER_EVENTS, tierFromPss, tierLabel } from "@/app/lib/geodetic/weather-predictions";
import { WEATHER_TECHNIQUES } from "@/app/lib/geodetic/weather-techniques";
import { GEODETIC_FINGERPRINTS } from "@/app/lib/geodetic/weather-fingerprints";
import { BODY_STAR_MATRIX } from "@/app/lib/geodetic/body-star-matrix";
import { GeodeticTabs } from "./GeodeticTabs";
import { IngressTabs, type IngressPanelData } from "./IngressTabs";
import { ORIGINAL_STATS_HTML } from "./original-stats-html";
import { ORIGINAL_TECHNIQUES_HTML } from "./original-techniques-html";
import { ORIGINAL_EVENTS_ACCURACY } from "./original-events-accuracy";
import { ORIGINAL_DASHBOARD_EVENTS } from "./original-events";
import {
    CRANE_FRAMEWORK_BODY_HTML,
    CRANE_FRAMEWORK_SCOPE,
    CRANE_FRAMEWORK_STYLES,
} from "./crane-framework-html";
import { CRANE_TECHNIQUES, CRANE_SUBCRITERIA, CRANE_T18_CAP_RAISED } from "@/app/lib/geodetic/crane-techniques";
import {
    ECLIPSES_2026_2027,
    RETROGRADE_SHADOW_WINDOWS,
    SIGN_INGRESSES,
    STELLIUMS_2026_2027,
} from "@/app/lib/geodetic/events-2026-2027.generated";
import styles from "./page.module.css";

// This page is a live ephemeris/geodetic dashboard that queries Supabase at
// render time. Prerendering it at build requires Supabase credentials in the
// build environment, which CI doesn't have. Mark as fully dynamic so the
// build never tries to fetch live data — it'll SSR on each request instead.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

const DAY_MS = 86_400_000;
const PLANET_ORDER = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"] as const;
const CITY_SET = [
    { name: "London", lat: 51.5, lon: 0 },
    { name: "Paris", lat: 48.9, lon: 2.3 },
    { name: "Berlin", lat: 52.5, lon: 13.4 },
    { name: "Rome", lat: 41.9, lon: 12.5 },
    { name: "Istanbul", lat: 41.0, lon: 29.0 },
    { name: "Cairo", lat: 30.0, lon: 31.2 },
    { name: "Nairobi", lat: -1.3, lon: 36.8 },
    { name: "Karachi", lat: 24.9, lon: 67.0 },
    { name: "Islamabad", lat: 33.7, lon: 73.1 },
    { name: "New Delhi", lat: 28.6, lon: 77.2 },
    { name: "Bangkok", lat: 13.8, lon: 100.5 },
    { name: "Manila", lat: 14.6, lon: 121.0 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { name: "Sydney", lat: -33.9, lon: 151.2 },
    { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
    { name: "New York", lat: 40.7, lon: -74.0 },
    { name: "Mexico City", lat: 19.4, lon: -99.1 },
    { name: "Havana", lat: 23.1, lon: -82.4 },
    { name: "Reykjavik", lat: 64.1, lon: -22.0 },
    { name: "Jakarta", lat: -6.2088, lon: 106.8456 },
    { name: "Lagos", lat: 6.5, lon: 3.4 },
    { name: "Sao Paulo", lat: -23.6, lon: -46.6 },
    { name: "Moscow", lat: 55.8, lon: 37.6 },
    { name: "Mumbai", lat: 19.1, lon: 72.9 },
];
const SCORE_DATES = ["2026-02-17", "2026-08-12", "2026-11-03", "2026-12-09"];
const TNO_BODIES = ["Eris", "Sedna", "Haumea", "Makemake"] as const;
const RISK_TNO_BODIES = ["Haumea", "Sedna", "Makemake"] as const;

const EL_NINO_EVENTS = [
    {
        period: "1957–58",
        oni: 1.5,
        rank: 6,
        planets: ["Neptune 3–5°♏ · IC 153–151°W", "Uranus 0–5°♌ · IC outside W. Pacific"],
        criteria: { t22Ic: true, satSag: true, jupNep: false, satNep: false, worldPoint: false },
        score: "~0.18",
        verdict: "Model fires: Neptune IC in Niño 3.4; Saturn-Sag bonus adds background support. Weakest of the six.",
    },
    {
        period: "1972–73",
        oni: 2.1,
        rank: 4,
        planets: ["Neptune 3–5°♐ · IC near 177–175°W", "Jupiter 2–7°♑ · IC misses Central America / Caribbean"],
        criteria: { t22Ic: true, satSag: false, jupNep: false, satNep: false, worldPoint: false },
        score: "~0.10",
        verdict: "Model fires T22 IC only. Modest score, consistent with a moderate ONI 2.1 event.",
    },
    {
        period: "1982–83",
        oni: 2.1,
        rank: 3,
        planets: ["Neptune 25°♐ · IC near 115°W", "Uranus 2°♐ · IC near 178°W", "Saturn 27°♎–1°♏ · IC borderline 153–149°W"],
        criteria: { t22Ic: true, satSag: false, jupNep: false, satNep: false, worldPoint: false },
        score: "~0.30",
        verdict: "Model fires strongly: Neptune and Uranus both place IC lines into the Niño zone.",
    },
    {
        period: "1997–98",
        oni: 2.4,
        rank: 2,
        planets: ["Pluto 2–5°♐ · IC near 178–175°W", "Saturn ~0°♈ · world point / western Niño edge"],
        criteria: { t22Ic: true, satSag: false, jupNep: false, satNep: false, worldPoint: true },
        score: "~0.28",
        verdict: "Model fires: Pluto IC in Niño zone plus Saturn world-point activation.",
    },
    {
        period: "2015–16",
        oni: 2.6,
        rank: 1,
        planets: ["Saturn 1–8°♐ · IC near 179–172°W", "Neptune 7–9°♓ · IC outside Atlantic / W. Africa"],
        criteria: { t22Ic: true, satSag: true, jupNep: true, satNep: true, worldPoint: false },
        score: "~0.48",
        verdict: "Model fires CRITICAL: Saturn-Sag IC, Jupiter-Neptune, and Saturn-Neptune all active during the record event.",
    },
    {
        period: "2023–24",
        oni: 2.0,
        rank: 5,
        planets: ["Jupiter 10–20°♉ · IC near 170–160°W", "Uranus 20–21°♉ · IC near 160–159°W", "Saturn 0–7°♓ · IC outside Atlantic"],
        criteria: { t22Ic: true, satSag: false, jupNep: false, satNep: false, worldPoint: false },
        score: "~0.28",
        verdict: "Model fires: Jupiter-Uranus Taurus conjunction places dual IC lines into central Niño 3.4.",
    },
];

const CITY_REFERENCES = [
    { city: "London", lat: "51.5°N", lon: "0°E", mc: "0°♈", ic: "0°♎", asc: "26°27'♋", dsc: "26°27'♑", note: "Prime Meridian world-point. Saturn/Neptune Aries world-point broadcasts through this axis." },
    { city: "Paris", lat: "48.9°N", lon: "2.3°E", mc: "2°♈", ic: "2°♎", asc: "26°06'♋", dsc: "26°06'♑", note: "Neptune/Saturn Aries pressure near MC through 2026." },
    { city: "Berlin", lat: "52.5°N", lon: "13.4°E", mc: "13°♈", ic: "13°♎", asc: "6°07'♌", dsc: "6°07'♒", note: "Central Europe Aries/Libra axis." },
    { city: "Rome", lat: "41.9°N", lon: "12.5°E", mc: "12°♈", ic: "12°♎", asc: "28°50'♋", dsc: "28°50'♑", note: "Italy/Vatican seismic and civic axis." },
    { city: "Istanbul", lat: "41.0°N", lon: "29.0°E", mc: "29°♈", ic: "29°♎", asc: "12°57'♌", dsc: "12°57'♒", note: "Haumea/Cairo-Egypt corridor nearby; Aries/Libra world-axis edge." },
    { city: "Cairo", lat: "30.0°N", lon: "31.2°E", mc: "1°♉", ic: "1°♏", asc: "7°44'♌", dsc: "7°44'♒", note: "Haumea 2026 Scorpio/Taurus corridor maps strongly through Egypt/East Africa." },
    { city: "Nairobi", lat: "1.3°S", lon: "36.8°E", mc: "7°♉", ic: "7°♏", asc: "~2°♌", dsc: "~2°♒", note: "Fixed Scorpio/Taurus IC/MC: seismic-volcanic classifier." },
    { city: "Karachi", lat: "24.9°N", lon: "67.0°E", mc: "7°♊", ic: "7°♐", asc: "~7°36'♍", dsc: "~7°36'♓", note: "Sedna/Algol MC corridor nearby; Uranus Gemini era raises transport/seismic signal." },
    { city: "Islamabad", lat: "33.7°N", lon: "73.1°E", mc: "13°♊", ic: "13°♐", asc: "~14°30'♍", dsc: "~14°30'♓", note: "Deep in Uranus Gemini/Sedna-Algol regional watch corridor." },
    { city: "New Delhi", lat: "28.6°N", lon: "77.2°E", mc: "17°♊", ic: "17°♐", asc: "17°45'♍", dsc: "17°45'♓", note: "Mutable Gemini/Sag transport and atmospheric spread axis." },
    { city: "Bangkok", lat: "13.8°N", lon: "100.5°E", mc: "10°♋", ic: "10°♑", asc: "11°15'♎", dsc: "11°15'♈", note: "SE Asia Saturn/Neptune DSC corridor; flood and cyclone classifier." },
    { city: "Manila", lat: "14.6°N", lon: "121.0°E", mc: "1°♌", ic: "1°♒", asc: "2°10'♏", dsc: "2°10'♉", note: "Pluto Aquarius squares Scorpio ASC; Leo/Aquarius eclipse axis is active." },
    { city: "Tokyo", lat: "35.7°N", lon: "139.7°E", mc: "19°42'♌", ic: "19°42'♒", asc: "12°57'♏", dsc: "12°57'♉", note: "Aug 12 2026 eclipse 20° Leo is nearly exact on MC." },
    { city: "Sydney", lat: "33.9°S", lon: "151.2°E", mc: "1°♍", ic: "1°♓", asc: "20°42'♐", dsc: "20°42'♊", note: "Virgo/Pisces mutable water/transport axis." },
    { city: "Los Angeles", lat: "34.1°N", lon: "118.2°W", mc: "1°48'♐", ic: "1°48'♊", asc: "15°59'♒", dsc: "15°59'♌", note: "Sedna IC around 121°W and Uranus Gemini IC corridor echo California." },
    { city: "New York", lat: "40.7°N", lon: "74.0°W", mc: "16°♑", ic: "16°♋", asc: "29°24'♈", dsc: "29°24'♎", note: "Cancer IC flood/storm-surge classifier; ASC near Aries world-point." },
    { city: "Mexico City", lat: "19.4°N", lon: "99.1°W", mc: "20°54'♐", ic: "20°54'♊", asc: "17°14'♓", dsc: "17°14'♍", note: "Gemini/Sag transport and seismic ripple classifier." },
    { city: "Havana", lat: "23.1°N", lon: "82.4°W", mc: "7°36'♑", ic: "7°36'♋", asc: "11°04'♈", dsc: "11°04'♎", note: "Cancer/Capricorn hurricane-axis reference." },
    { city: "Reykjavik", lat: "64.1°N", lon: "22.0°W", mc: "8°♓", ic: "8°♍", asc: "~28°30'♋", dsc: "~28°30'♑", note: "Scheat/Pisces and Virgo/Pisces northern Atlantic watch." },
];

const EXTRA_ORIGINAL_FINGERPRINTS = [
    {
        name: "VOLCANIC_ERUPTION_SIGNATURE",
        description: "Volcanic eruption — Pluto station primary trigger; Ring of Fire multiplier; IC line through volcanic arc",
        threshold: 0.50,
        required: ["Pluto station within ±7 days", "Target volcano on known volcanic arc within 5° of Pluto IC/MC line"],
        anyOne: ["Mars in fixed sign aspecting Pluto", "Pluto/Mars at anaretic fixed degree", "Moon transit of local volcanic MC/IC within ±24h"],
        trigger: "Moon transiting local geodetic MC/IC or Mars crossing Pluto's current degree.",
        events: ["Mount Dukono May 2026 — Pluto Rx station May 6; Moon local MC timing marker"],
        zone: "Ring of Fire volcanic arcs: Indonesia, Philippines, Japan, Kamchatka, Cascadia, Andes.",
    },
    {
        name: "AVIATION_INCIDENT_SIGNATURE",
        description: "Major aviation accidents, structural crashes, midair collisions, mass-casualty transport disasters",
        threshold: 0.40,
        required: ["Mercury Rx or stationing within ±14 days", "Mars Rx or stationing"],
        anyOne: ["Uranus hard aspect Mercury", "Algol conjunct Uranus or Mars", "Koch cusp conjunction near airport/region", "Eclipse within ±60 days"],
        trigger: "Mercury or Mars crossing eclipse degree, or Mars station within ±7 days.",
        events: ["Jeju Air Dec 2024", "American Airlines / Black Hawk collision Jan 2025"],
        zone: "Uranus in Gemini 2025–2033 elevates global aviation and transport infrastructure risk.",
    },
    {
        name: "EL_NINO_CLIMATE_SIGNATURE",
        description: "El Niño onset — central Pacific SST warming and Niño 3.4 geodetic IC activation",
        threshold: 0.45,
        required: ["Outer planet IC line in El Niño zone", "Neptune-Jupiter oceanic expansion cycle"],
        anyOne: ["Saturn square/opposition Neptune", "Saturn in Sagittarius IC zone", "Jupiter-Uranus Taurus central Pacific activation"],
        trigger: "Jupiter crossing Saturn/Neptune midpoint in water sign, or Mars triggering Neptune in water sign.",
        events: ["1982-83 El Niño", "1997-98 El Niño", "2015-16 El Niño", "2023-24 El Niño"],
        zone: "Planets at Virgo through Sagittarius place IC lines in the 120°W-170°W Niño 3.4 band.",
    },
    {
        name: "CONFLICT_GEOPOLITICAL_SIGNATURE",
        description: "Military conflict, coups, uprisings, geopolitical crises, mass-casualty political violence",
        threshold: 0.50,
        required: ["Mars hard Pluto within ±10 days", "Saturn or Pluto at anaretic degree or crossing sign boundary"],
        anyOne: ["Mars conjunct Saturn", "Uranus square Pluto", "Eclipse on world axis", "Node crossing collective angle"],
        trigger: "Mars crossing eclipse or station degree, or Sun/Mars crossing 0° cardinal world point.",
        events: ["Mars conjunct Pluto Jan 2026", "Mars conjunct Saturn Apr 2026", "Mars opposition Pluto Oct 2026"],
        zone: "World-axis and fixed-sign hard aspects are treated as the primary geopolitical broadcast corridors.",
    },
];

const DASHBOARD_FINGERPRINTS = [...GEODETIC_FINGERPRINTS, ...EXTRA_ORIGINAL_FINGERPRINTS];

function fingerprintBadgeClass(name: string): string {
    if (name.includes("WILDFIRE")) return "b-fire";
    if (name.includes("CYCLONE")) return "b-storm";
    if (name.includes("SEISMIC") || name.includes("VOLCANIC")) return "b-quake";
    if (name.includes("TORNADO")) return "b-tornado";
    if (name.includes("AVIATION")) return "b-aviation";
    if (name.includes("CONFLICT")) return "b-conflict";
    if (name.includes("COMPOUND")) return "b-compound";
    if (name.includes("EL_NINO") || name.includes("FLOOD")) return "b-flood";
    return "b-storm";
}

function dashboardFingerprint(fingerprint: (typeof DASHBOARD_FINGERPRINTS)[number]) {
    if (fingerprint.name !== "SEISMIC_VOLCANIC_SIGNATURE") return fingerprint;
    return {
        ...fingerprint,
        name: "SEISMIC_SIGNATURE",
        description: "Major earthquake (M7+) — geodetic ASC/MC/IC line required; Ring of Fire multiplier",
        required: ["Uranus ASC/MC/IC line ≤5° of target region", "Eclipse within ±60 days sensitising the region's longitude"],
        anyOne: ["Uranus at anaretic degree", "Uranus ingress to new sign within ±30 days", "Saturn stationing within ±7 days", "Outer planet at 0° cardinal sign", "Nodal axis crossing geodetic angle"],
        trigger: "Mars or Uranus crossing the exact eclipse degree OR geodetic ASC/MC of region. Ring of Fire multiplier applied for known subduction zones.",
        events: ["Japan Tohoku M9.0 Mar 11 2011", "Kamchatka M8.8 Jul 30 2025", "Sanriku M7.4 Apr 20 2026"],
        zone: "Ring of Fire: Indonesia, Japan, Kamchatka, Chile; ASC lines at event latitude required for high-latitude events.",
    };
}

const SIGN_GLYPHS: Record<string, string> = {
    Aries: "♈",
    Taurus: "♉",
    Gemini: "♊",
    Cancer: "♋",
    Leo: "♌",
    Virgo: "♍",
    Libra: "♎",
    Scorpio: "♏",
    Sagittarius: "♐",
    Capricorn: "♑",
    Aquarius: "♒",
    Pisces: "♓",
};

const SIGN_BASE: Record<string, number> = {
    "♈": 0,
    "♉": 30,
    "♊": 60,
    "♋": 90,
    "♌": 120,
    "♍": 150,
    "♎": 180,
    "♏": 210,
    "♐": 240,
    "♑": 270,
    "♒": 300,
    "♓": 330,
};

type SkyRow = {
    date: string;
    title: string;
    pss: number;
    positions: ComputedPosition[];
    triggers: string[];
    ephemerisEvents: EphemerisEventRow[];
    zones: string[];
    tnoHits: string[];
    moon?: string;
};

type ScoreRow = {
    city: string;
    date: string;
    result: GeodeticWeatherResult;
};

type AuditGate = {
    label: string;
    status: "pass" | "fail";
    detail: string;
};

type EphemerisEventRow = {
    id: number;
    exact_timestamp_ut: string;
    event_type: string;
    body: string;
    secondary_body: string | null;
    aspect: string | null;
    longitude: number | null;
    zodiac_sign: string | null;
    zodiac_degree: number | null;
    source: string;
};

type EclipsePathRow = {
    eclipse_date: string;
    eclipse_kind: string;
    central_latitude: number;
    central_longitude: number;
    path_width_km: number | null;
    central_duration: string | null;
    source_credit: string;
};

type EclipsePathSummary = {
    date: string;
    label: string;
    count: number;
    range: string;
    source: string;
};

type TnoActivationRow = {
    date: string;
    body: string;
    position: string;
    hits: string[];
};

type DashboardComputedData = {
    ephemerisEvents: EphemerisEventRow[];
    eclipsePaths: EclipsePathRow[];
};

function cx(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(" ");
}

function dateLabel(date: string): string {
    return new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
}

function planetLabel(position: ComputedPosition): string {
    const glyph = SIGN_GLYPHS[position.sign] ?? "";
    const rx = position.is_retrograde ? " Rx" : "";
    return `${Math.floor(position.degree_in_sign)}°${String(position.degree_minutes).padStart(2, "0")}' ${glyph}${rx}`;
}

function bodyGlyph(body: string): string {
    if (body === "True Node") return "☊";
    if (body === "Lilith") return "BML";
    return body;
}

function degreeLabel(longitude: number): string {
    const normalized = ((longitude % 360) + 360) % 360;
    const sign = Object.entries(SIGN_BASE).find(([, base]) => normalized >= base && normalized < base + 30)?.[0] ?? "♈";
    return `${(normalized - SIGN_BASE[sign]).toFixed(1)}°${sign}`;
}

function angularDiff(a: number, b: number): number {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}

function parseZodiacDegree(value: string): number | null {
    const match = value.match(/~?(\d+(?:\.\d+)?)°\s*(?:(\d{1,2})')?\s*([♈♉♊♋♌♍♎♏♐♑♒♓])/);
    if (!match) return null;
    return SIGN_BASE[match[3]] + Number(match[1]) + (Number(match[2] ?? 0) / 60);
}

function signGlyphFromDegreeText(value: string): string {
    return value.match(/[♈♉♊♋♌♍♎♏♐♑♒♓]/)?.[0] ?? "♈";
}

function modeForGlyph(glyph: string): string {
    if ("♈♋♎♑".includes(glyph)) return "Cardinal";
    if ("♉♌♏♒".includes(glyph)) return "Fixed";
    return "Mutable";
}

function eventTypeForIc(ic: string): string {
    const glyph = signGlyphFromDegreeText(ic);
    const mode = modeForGlyph(glyph);
    if ("♋♑♎♈".includes(glyph)) return mode === "Cardinal" ? "Flood / structural world-axis event" : "World-axis event";
    if ("♉♏♒♌".includes(glyph)) return glyph === "♌" || glyph === "♒" ? "Wildfire / sudden disruption" : "Major earthquake / volcanic";
    if ("♊♐".includes(glyph)) return "Transport disruption / aviation";
    return "Flooding / hidden-force or technical failure";
}

function angleMapForCityRef(city: (typeof CITY_REFERENCES)[number]): Array<{ angle: string; longitude: number }> {
    return [
        { angle: "MC", longitude: parseZodiacDegree(city.mc) ?? 0 },
        { angle: "ASC", longitude: parseZodiacDegree(city.asc) ?? 0 },
        { angle: "IC", longitude: parseZodiacDegree(city.ic) ?? 0 },
        { angle: "DSC", longitude: parseZodiacDegree(city.dsc) ?? 0 },
    ];
}

function nearestMoon(date: string): string | undefined {
    const target = new Date(`${date}T12:00:00Z`).getTime();
    const match = MOON_CALENDAR_2026
        .map((moon) => ({
            moon,
            days: Math.abs(new Date(`${moon.date}T12:00:00Z`).getTime() - target) / DAY_MS,
        }))
        .filter((row) => row.days <= 7)
        .sort((a, b) => a.days - b.days)[0];
    if (!match) return undefined;
    return `${match.moon.type}${match.moon.eclipse ? " eclipse" : ""} ${match.moon.degree}`;
}

async function positionsForDate(date: string): Promise<ComputedPosition[]> {
    return getComputedSkyForDate(new Date(`${date}T12:00:00Z`), { bodies: EPHEMERIS_DAILY_BODIES });
}

async function fetchComputedDashboardData(): Promise<DashboardComputedData> {
    const admin = createAdminClient();
    const [{ data: eventRows, error: eventError }, { data: pathRows, error: pathError }] = await Promise.all([
        admin
            .from("ephemeris_events")
            .select("id,exact_timestamp_ut,event_type,body,secondary_body,aspect,longitude,zodiac_sign,zodiac_degree,source")
            .gte("exact_timestamp_ut", "2026-01-01T00:00:00Z")
            .lte("exact_timestamp_ut", "2027-12-31T23:59:59Z")
            .order("exact_timestamp_ut", { ascending: true })
            .limit(5000),
        admin
            .from("eclipse_path_points")
            .select("eclipse_date,eclipse_kind,central_latitude,central_longitude,path_width_km,central_duration,source_credit")
            .gte("eclipse_date", "2026-01-01")
            .lte("eclipse_date", "2027-12-31")
            .order("eclipse_date", { ascending: true })
            .order("time_ut", { ascending: true }),
    ]);

    if (eventError) throw new Error(`Unable to load ephemeris events: ${eventError.message}`);
    if (pathError) throw new Error(`Unable to load eclipse path rows: ${pathError.message}`);

    return {
        ephemerisEvents: (eventRows ?? []) as EphemerisEventRow[],
        eclipsePaths: (pathRows ?? []) as EclipsePathRow[],
    };
}

function eventsNearDate(events: EphemerisEventRow[], date: string, days = 7): EphemerisEventRow[] {
    const target = new Date(`${date}T12:00:00Z`).getTime();
    return events
        .map((event) => ({
            event,
            delta: Math.abs(new Date(event.exact_timestamp_ut).getTime() - target) / DAY_MS,
        }))
        .filter((row) => row.delta <= days)
        .sort((a, b) => a.delta - b.delta)
        .map((row) => row.event);
}

function eventLabel(event: EphemerisEventRow): string {
    if (event.event_type === "aspect") {
        const angle = event.aspect ?? "";
        return `${bodyGlyph(event.body)} ${angle} ${bodyGlyph(event.secondary_body ?? "")}`.trim();
    }
    if (event.event_type === "ingress") return `${bodyGlyph(event.body)} ingress ${event.zodiac_sign ?? ""}`.trim();
    if (event.event_type === "station") return `${bodyGlyph(event.body)} station ${degreeLabel(event.longitude ?? 0)}`;
    return `${bodyGlyph(event.body)} ${event.event_type}`;
}

function fixedStarHits(positions: ComputedPosition[], orb = 2): string[] {
    const hits: string[] = [];
    for (const position of positions) {
        for (const star of WEATHER_TECHNIQUES.fixedStars) {
            const starDegree = parseZodiacDegree(star.label);
            if (starDegree == null) continue;
            const distance = angularDiff(position.longitude, starDegree);
            if (distance <= orb) hits.push(`${bodyGlyph(position.name)} ${star.label} (${distance.toFixed(1)}°)`);
        }
    }
    return hits;
}

function tnoHitsForPositions(positions: ComputedPosition[]): string[] {
    const tnos = positions.filter((position) => TNO_BODIES.includes(position.name as (typeof TNO_BODIES)[number]));
    return fixedStarHits(tnos, 3);
}

async function buildIngressPanels(): Promise<IngressPanelData[]> {
    const ingressEvents = [
        { id: "i2026aries", buttonLabel: "♈ Mar 2026", date: "2026-03-20", sign: "Aries" },
        { id: "i2026cancer", buttonLabel: "♋ Jun 2026", date: "2026-06-21", sign: "Cancer" },
        { id: "i2026libra", buttonLabel: "♎ Sep 2026", date: "2026-09-22", sign: "Libra" },
        { id: "i2026cap", buttonLabel: "♑ Dec 2026", date: "2026-12-21", sign: "Capricorn" },
        { id: "i2027aries", buttonLabel: "♈ Mar 2027", date: "2027-03-20", sign: "Aries" },
        { id: "i2027cancer", buttonLabel: "♋ Jun 2027", date: "2027-06-21", sign: "Cancer" },
        { id: "i2027libra", buttonLabel: "♎ Sep 2027", date: "2027-09-23", sign: "Libra" },
        { id: "i2027cap", buttonLabel: "♑ Dec 2027", date: "2027-12-22", sign: "Capricorn" },
    ];
    const signGlyph: Record<string, string> = { Aries: "♈", Cancer: "♋", Libra: "♎", Capricorn: "♑" };

    return Promise.all(ingressEvents.map(async (event) => {
        const { date, sign } = event;
        const positions = (await positionsForDate(date))
            .filter((position) => ["Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"].includes(position.name));
        const rows = CITY_REFERENCES.map((city) => {
            const hits = angleMapForCityRef(city).flatMap((angle) => {
                return positions
                    .map((position) => ({ position, orb: angularDiff(position.longitude, angle.longitude), angle: angle.angle }))
                    .filter((hit) => hit.orb <= 5)
                    .map((hit) => `${bodyGlyph(hit.position.name)}→${hit.angle} ${hit.orb.toFixed(1)}°${hit.orb <= 1 ? "⚡" : ""}`);
            });
            return {
                city: city.city,
                icSign: `${city.ic} [${modeForGlyph(signGlyphFromDegreeText(city.ic))}]`,
                eventType: eventTypeForIc(city.ic),
                hits,
                hot: hits.some((hit) => hit.includes("⚡") || hit.startsWith("Mars") || hit.startsWith("Pluto") || hit.startsWith("Uranus")),
            };
        })
            .filter((row) => row.hits.length)
            .sort((a, b) => Number(b.hot) - Number(a.hot) || b.hits.length - a.hits.length)
            .slice(0, 14);

        return {
            id: event.id,
            buttonLabel: event.buttonLabel,
            meta: `${dateLabel(date)} · Sun ingress ${signGlyph[sign]} ${sign} · computed ephemeris positions to city geodetic angles`,
            rows,
        };
    }));
}

async function buildSkyRows(events: EphemerisEventRow[]): Promise<SkyRow[]> {
    const forecasts = [...FORECAST_WEATHER_EVENTS].sort((a, b) => a.date.localeCompare(b.date));
    return Promise.all(
        forecasts.map(async (event) => {
            const positions = await positionsForDate(event.date);
            const window = triggersForWindow(event.date, 7);
            const ephemerisEvents = eventsNearDate(events, event.date, 7);
            return {
                date: event.date,
                title: event.title,
                pss: event.pss,
                positions,
                triggers: [
                    ...window.aspects.map((trigger) => `${trigger.bodies} ${trigger.degree}`),
                    ...ephemerisEvents.slice(0, 5).map(eventLabel),
                ],
                ephemerisEvents,
                zones: event.zones,
                tnoHits: tnoHitsForPositions(positions),
                moon: nearestMoon(event.date),
            };
        }),
    );
}

async function buildWeatherScores(): Promise<ScoreRow[]> {
    const rows: ScoreRow[] = [];
    for (const date of SCORE_DATES) {
        const positions = await positionsForDate(date);
        for (const city of CITY_SET) {
            rows.push({
                city: city.name,
                date,
                result: computeGeodeticWeather({
                    dateUtc: new Date(`${date}T12:00:00Z`),
                    destLat: city.lat,
                    destLon: city.lon,
                    positions,
                }),
            });
        }
    }
    return rows;
}

async function buildTnoActivations(dates: string[]): Promise<TnoActivationRow[]> {
    const rows: TnoActivationRow[] = [];
    for (const date of dates) {
        const positions = await positionsForDate(date);
        for (const body of TNO_BODIES) {
            const position = positions.find((row) => row.name === body);
            if (!position) continue;
            const hits = fixedStarHits([position], 3);
            rows.push({
                date,
                body,
                position: planetLabel(position),
                hits: hits.length ? hits : ["No fixed-star hit within 3°; position retained for transit context."],
            });
        }
    }
    return rows;
}

function eclipsePathSummaries(paths: EclipsePathRow[]): EclipsePathSummary[] {
    const grouped = new Map<string, EclipsePathRow[]>();
    for (const row of paths) {
        const list = grouped.get(row.eclipse_date) ?? [];
        list.push(row);
        grouped.set(row.eclipse_date, list);
    }
    return Array.from(grouped.entries()).map(([date, rows]) => {
        const lats = rows.map((row) => row.central_latitude);
        const lons = rows.map((row) => row.central_longitude);
        return {
            date,
            label: `${rows[0]?.eclipse_kind ?? "eclipse"} central path`,
            count: rows.length,
            range: `${Math.min(...lats).toFixed(1)}° to ${Math.max(...lats).toFixed(1)}° lat · ${Math.min(...lons).toFixed(1)}° to ${Math.max(...lons).toFixed(1)}° lon`,
            source: rows[0]?.source_credit ?? "NASA",
        };
    });
}

async function buildAuditGates(): Promise<AuditGate[]> {
    const moonFailures = MOON_CALENDAR_2026.flatMap((phase) => {
        const claimed = parseZodiacDegree(phase.degree);
        const canonicalPool = phase.eclipse
            ? ECLIPSES.filter((event) => event.kind === (phase.type === "NM" ? "solar" : "lunar"))
            : LUNATIONS.filter((event) => event.kind === (phase.type === "NM" ? "new-moon" : "full-moon"));
        const target = new Date(`${phase.date}T12:00:00Z`).getTime();
        const canonical = canonicalPool
            .map((event) => ({ event, days: Math.abs(new Date(event.dateUtc).getTime() - target) / DAY_MS }))
            .sort((a, b) => a.days - b.days)[0];
        if (!canonical || claimed == null) return [`${phase.date}: no canonical match`];
        const orb = angularDiff(claimed, canonical.event.degree);
        return canonical.days > 1.1 || orb > 1.25 ? [`${phase.date}: ${canonical.days.toFixed(1)}d / ${orb.toFixed(1)}°`] : [];
    });

    const marsFailures: string[] = [];
    for (const trigger of HARD_ASPECTS_2026.filter((row) => row.type === "eclipse")) {
        const claimed = parseZodiacDegree(trigger.degree);
        const mars = claimed == null ? undefined : (await positionsForDate(trigger.date)).find((position) => position.name === "Mars");
        const orb = mars && claimed != null ? angularDiff(mars.longitude, claimed) : Infinity;
        if (orb > 2) marsFailures.push(`${trigger.date}: Mars ${Number.isFinite(orb) ? orb.toFixed(1) : "n/a"}° off`);
    }

    const neptuneStation = STATIONS.find((station) => station.planet === "Neptune" && station.type === "retrograde" && station.dateUtc.startsWith("2026-07-07"));

    return [
        {
            label: "Moon trigger parity",
            status: moonFailures.length ? "fail" : "pass",
            detail: moonFailures.length ? moonFailures.join("; ") : "Moon rows match canonical lunation/eclipse tables.",
        },
        {
            label: "Mars eclipse triggers",
            status: marsFailures.length ? "fail" : "pass",
            detail: marsFailures.length ? marsFailures.join("; ") : "Mars trigger dates are inside the live ephemeris orb.",
        },
        {
            label: "Station reversals",
            status: neptuneStation ? "pass" : "fail",
            detail: neptuneStation ? "2026 Neptune Rx uses the ephemeris speed reversal date." : "Neptune Rx station is stale or missing.",
        },
    ];
}

function Kv({ label, value, tone }: { label: string; value: string; tone?: "hi" | "warn" | "crit" }) {
    return (
        <div className={styles.kv}>
            <span>{label}</span>
            <span className={tone ? styles[tone] : undefined}>{value}</span>
        </div>
    );
}

function SidebarBlock({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div>
            <h2>{title}</h2>
            {children}
        </div>
    );
}

function Badge({ children, kind = "geo" }: { children: ReactNode; kind?: "geo" | "pair" | "moon" | "star" | "asp" | "crit" }) {
    return <span className={cx(styles.pill, styles[`pill-${kind}`])}>{children}</span>;
}

function PssBar({ value }: { value: number }) {
    const tier = tierFromPss(value);
    return (
        <div className={styles["pss-bar-wrap"]}>
            <div className={styles["pss-bar"]}>
                <div className={cx(styles["pss-fill"], styles[tier])} style={{ width: `${Math.min(100, Math.round(value * 100))}%` }} />
            </div>
            <span className={styles["pss-val"]}>{value.toFixed(2)}</span>
        </div>
    );
}

function formatDamage(value?: number): string {
    if (value == null) return "—";
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}B`;
}

function formatInteger(value?: number): string {
    if (value == null) return "—";
    return value.toLocaleString("en-US");
}

function typeLabel(type: string): string {
    return type.replace(/_/g, " ");
}

function Sidebar({ station2026 }: { station2026: typeof STATIONS }) {
    return (
        <aside className={cx(styles.sidebar, "sidebar")}>
            <div className={cx(styles.logo, "logo")}>
                <div className={cx(styles["logo-icon"], "logo-icon")}>☉</div>
                <div>
                    <div className={cx(styles["logo-title"], "logo-title")}>Geodetic Engine</div>
                    <div className={cx(styles["logo-subtitle"], "logo-subtitle")}>v4.0 · Ephemeris-backed · QA build</div>
                </div>
            </div>

            <SidebarBlock title="Base Weights">
                {WEATHER_TECHNIQUES.baseWeights.map((row) => (
                    <Kv key={row.id} label={row.label} value={row.value} tone={(row.numeric ?? 0) >= 0.15 ? "hi" : undefined} />
                ))}
            </SidebarBlock>

            <SidebarBlock title="Koch Angles + Transpluto — v4.0">
                <Kv label="Planet ☌ Koch geodetic cusp ≤1°" value="0.22" tone="crit" />
                <Kv label="Planet ☌ Koch geodetic cusp ≤3°" value="0.14" tone="warn" />
                <Kv label="Transpluto ☌ Koch cusp ≤3°" value="0.14" tone="warn" />
                <Kv label="Midpoint ☌ geodetic cusp ≤3°" value="0.10" />
                <p className={styles["side-note"]}>Koch cusps are ASC / MC / IC / DC for the target location. This dashboard computes MC/ASC references from the app engine.</p>
            </SidebarBlock>

            <SidebarBlock title="World Axis — 8 Harmonic Points">
                <Kv label="0°♈ · 0°♋ · 0°♎ · 0°♑" value="Cardinal" tone="warn" />
                <Kv label="15°♉ · 15°♌ · 15°♏ · 15°♒" value="Fixed mid" tone="warn" />
                <Kv label="Planet station on World Point" value="0.20" tone="crit" />
                <Kv label="Eclipse on World Point" value="0.20" tone="crit" />
                <p className={styles["side-note"]}>Harmonic 8 divides 360° by 8. These points map collective-scale degree hits into geodetic longitudes.</p>
            </SidebarBlock>

            <SidebarBlock title="New Techniques — v2.1">
                {WEATHER_TECHNIQUES.newTechniqueWeights.slice(0, 12).map((row) => (
                    <Kv key={row.id} label={row.label} value={row.value} tone={(row.numeric ?? 0) >= 0.18 ? "crit" : (row.numeric ?? 0) >= 0.1 ? "warn" : undefined} />
                ))}
            </SidebarBlock>

            <SidebarBlock title="Key Ingresses 2025–2026">
                {WEATHER_TECHNIQUES.keyIngresses.map((row) => (
                    <Kv
                        key={`${row.date}-${row.label}`}
                        label={row.label}
                        value={dateLabel(row.date)}
                        tone={row.emphasis === "critical" ? "crit" : row.emphasis === "warning" ? "warn" : row.emphasis === "high" ? "hi" : undefined}
                    />
                ))}
            </SidebarBlock>

            <SidebarBlock title="2026 Station Ledger">
                {station2026.map((station) => (
                    <Kv key={`${station.dateUtc}-${station.planet}-${station.type}`} label={`${station.planet} ${station.type}`} value={`${dateLabel(station.dateUtc)} · ${degreeLabel(station.longitude)}`} />
                ))}
            </SidebarBlock>

            <div className={styles["info-box"]}>
                <b>Ephemeris QA:</b> the stale HTML values are now evaluated against canonical lunations, eclipse tables, station reversals, and live computed planetary positions.
            </div>
        </aside>
    );
}

function EventCorrelations() {
    const rows = [...ORIGINAL_DASHBOARD_EVENTS].sort((a, b) => a.date.localeCompare(b.date));
    const severityFive = rows.filter((row) => row.sev >= 5).length;
    const highPss = rows.filter((row) => row.pss >= 0.55).length;
    const meanPss = rows.length ? rows.reduce((sum, row) => sum + row.pss, 0) / rows.length : 0;
    const pairCount = rows.filter((row) => row.pair).length;
    const totalDamage = rows.reduce((sum, row) => sum + (row.dmg ?? 0), 0);

    return (
        <>
            <div className={cx(styles["stat-grid"], "stat-grid")} id="summary-stats">
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{rows.length}</div><div className={styles["stat-lbl"]}>Total events</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{severityFive}</div><div className={styles["stat-lbl"]}>Severity-5</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{highPss}</div><div className={styles["stat-lbl"]}>High-PSS ≥0.55</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{meanPss.toFixed(3)}</div><div className={styles["stat-lbl"]}>Mean PSS</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{pairCount}</div><div className={styles["stat-lbl"]}>Eclipse pair window</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>${totalDamage.toFixed(0)}B</div><div className={styles["stat-lbl"]}>Total damage</div></div>
            </div>

            <div className={cx(styles["section-hdr"], "section-hdr")}>VERIFIED EVENT DATABASE — 2024–2025</div>
            <div className={styles["info-box"]}>
                <b>Purple pills</b> = eclipse pair window active. <b>Teal pills</b> = geodetic angle activation or geometric stress pattern noted.
                PSS is the combined score before new technique adjustments. Ephemeris parity is checked in the Validation tab.
            </div>
            <div className={styles["table-scroll"]}>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Event</th>
                            <th>Type</th>
                            <th>Sev</th>
                            <th>Deaths</th>
                            <th>$B</th>
                            <th>PSS</th>
                            <th>Stars</th>
                            <th>Patterns</th>
                            <th>Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => {
                            const tier = tierFromPss(row.pss);
                            return (
                                <tr key={`${row.date}-${row.name}-${index}`}>
                                    <td className={styles["date-cell"]}>{row.date}</td>
                                    <td className={styles["event-cell"]}>
                                        <b>{row.name}</b>
                                        {row.notes ? <p>{row.notes}</p> : null}
                                    </td>
                                    <td><Badge kind="pair">{typeLabel(row.type)}</Badge></td>
                                    <td className={styles["sev-cell"]}>{row.sev}</td>
                                    <td className={styles["number-cell"]}>{formatInteger(row.deaths ?? undefined)}</td>
                                    <td className={styles["number-cell"]}>{formatDamage(row.dmg ?? undefined)}</td>
                                    <td className={styles["pss-cell"]}>
                                        <PssBar value={row.pss} />
                                        <div className={styles["risk-label"]}>{tier.toUpperCase()}</div>
                                        {row.crit ? (
                                            <>
                                                <div className={styles["criteria-line"]}>✦ {row.crit.n}/{row.crit.of} criteria</div>
                                                <p>{row.crit.key}</p>
                                            </>
                                        ) : null}
                                    </td>
                                    <td className={styles["pill-cell"]}>
                                        {row.stars.length ? row.stars.map((star) => <Badge key={star} kind="star">{star}</Badge>) : <span className={styles.muted}>—</span>}
                                    </td>
                                    <td className={styles["pill-cell"]}>
                                        {row.pair ? <Badge kind="pair">{row.pair}</Badge> : null}
                                        {row.geostress ? <Badge kind="geo">{row.geostress}</Badge> : null}
                                        {!row.pair && !row.geostress ? <span className={styles.muted}>—</span> : null}
                                    </td>
                                    <td className={styles.cite}>{row.source ?? "—"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

        </>
    );
}

function TechniquesGuide() {
    return <div dangerouslySetInnerHTML={{ __html: ORIGINAL_TECHNIQUES_HTML }} />;
}

function craneStatusClass(status: string): string {
    if (status === "tested") return "confirm";
    if (status === "watch") return "ambig";
    return "ambig";
}

function CraneWeatherFramework() {
    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: CRANE_FRAMEWORK_STYLES }} />
            <div className={cx(styles["section-hdr"], "section-hdr")}>CRANE WEATHER FRAMEWORK — T30–T34 + T17b/T18c/T18d</div>
            <div className={styles.note} style={{ marginBottom: "1rem" }}>
                <b>Numbering:</b> the validation report proposed these techniques as T25–T29; the dashboard already uses
                T25–T28 for other techniques, so the Crane additions are renumbered <b>T30–T34</b>. T17b and T18c/T18d
                are sub-criteria added under existing techniques. T18 maximum cap raised to {CRANE_T18_CAP_RAISED.toFixed(2)}.
                <br />
                All rules treat weather-event types only (heat, drought, flood, cyclone, cold-snap, wildfire, freeze).
                None apply to seismic / accident events.
            </div>

            <table className={styles.table} style={{ marginBottom: "1.5rem" }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Technique</th>
                        <th>Weight</th>
                        <th>Status</th>
                        <th>Applies To</th>
                    </tr>
                </thead>
                <tbody>
                    {CRANE_TECHNIQUES.map((t) => (
                        <tr key={t.id}>
                            <td><b>{t.id}</b></td>
                            <td>
                                <b>{t.label}</b>
                                <p style={{ marginTop: 4, color: "var(--muted, #8b949e)" }}>{t.rule}</p>
                                {t.notes ? <p style={{ marginTop: 4, fontStyle: "italic", color: "var(--muted, #8b949e)" }}>{t.notes}</p> : null}
                            </td>
                            <td>+{t.weight.toFixed(2)}</td>
                            <td className={craneStatusClass(t.status)}>{t.status.toUpperCase()}</td>
                            <td>{t.appliesTo.join(", ")}</td>
                        </tr>
                    ))}
                    {CRANE_SUBCRITERIA.map((t) => (
                        <tr key={t.id}>
                            <td><b>{t.id}</b><br /><small>under {t.parentTechniqueId}</small></td>
                            <td>
                                <b>{t.label}</b>
                                <p style={{ marginTop: 4, color: "var(--muted, #8b949e)" }}>{t.rule}</p>
                                {t.notes ? <p style={{ marginTop: 4, fontStyle: "italic", color: "var(--muted, #8b949e)" }}>{t.notes}</p> : null}
                            </td>
                            <td>+{t.weight.toFixed(2)}</td>
                            <td className={craneStatusClass(t.status)}>{t.status.toUpperCase()}</td>
                            <td>{t.appliesTo.join(", ")}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className={cx(styles["section-hdr"], "section-hdr")}>FRAMEWORK REFERENCE — NAT&apos;S SOURCE DOCUMENT</div>
            <div
                className={CRANE_FRAMEWORK_SCOPE}
                dangerouslySetInnerHTML={{ __html: CRANE_FRAMEWORK_BODY_HTML }}
            />
        </>
    );
}

function formatLongitude(lon: number): string {
    const norm = ((lon % 360) + 360) % 360;
    const inSign = norm % 30;
    const deg = Math.floor(inSign);
    const minutes = Math.round((inSign - deg) * 60);
    return `${deg}°${String(minutes).padStart(2, "0")}'`;
}

function CanonicalEphemeris() {
    const stationsByBody = new Map<string, typeof RETROGRADE_SHADOW_WINDOWS>();
    for (const win of RETROGRADE_SHADOW_WINDOWS) {
        const list = stationsByBody.get(win.body) ?? [];
        list.push(win);
        stationsByBody.set(win.body, list);
    }

    const bodyOrder = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
    const groupedBodies = bodyOrder.filter((b) => stationsByBody.has(b));

    return (
        <>
            <div className={cx(styles["section-hdr"], "section-hdr")}>CANONICAL 2026–2027 EPHEMERIS (SWISS EPHEMERIS)</div>
            <div className={styles.note} style={{ marginBottom: "1rem" }}>
                All rows below are generated by <code>scripts/generate-2026-2027-events.ts</code> from{" "}
                <code>swisseph-wasm</code> and validated by{" "}
                <code>__tests__/canonical-events-2026-2027.test.ts</code>. To refresh:{" "}
                <code>bun run scripts/generate-2026-2027-events.ts</code>.
            </div>

            <div className={cx(styles["section-hdr"], "section-hdr")} style={{ marginTop: "1rem" }}>RETROGRADE SHADOW WINDOWS — Pre-Rx · Rx · Direct · Post-Rx</div>
            {groupedBodies.map((body) => {
                const wins = stationsByBody.get(body)!;
                return (
                    <div key={body} style={{ marginBottom: "1.2rem" }}>
                        <h4 style={{ marginBottom: 6 }}>{body}</h4>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Cycle</th>
                                    <th>Pre-shadow start</th>
                                    <th>Retrograde station</th>
                                    <th>Direct station</th>
                                    <th>Post-shadow end</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wins.map((w, idx) => (
                                    <tr key={`${body}-${idx}`}>
                                        <td>#{idx + 1}</td>
                                        <td>
                                            {dateLabel(w.preShadowStart.utc)}
                                            <br /><small>{formatLongitude(w.preShadowStart.longitude)} {w.preShadowStart.sign}</small>
                                        </td>
                                        <td>
                                            <b>{dateLabel(w.retrogradeStation.utc)}</b>
                                            <br /><small>{formatLongitude(w.retrogradeStation.longitude)} {w.retrogradeStation.sign}</small>
                                        </td>
                                        <td>
                                            <b>{dateLabel(w.directStation.utc)}</b>
                                            <br /><small>{formatLongitude(w.directStation.longitude)} {w.directStation.sign}</small>
                                        </td>
                                        <td>
                                            {dateLabel(w.postShadowEnd.utc)}
                                            <br /><small>{formatLongitude(w.postShadowEnd.longitude)} {w.postShadowEnd.sign}</small>
                                        </td>
                                        <td>{w.durationDays.toFixed(0)}d</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            })}

            <div className={cx(styles["section-hdr"], "section-hdr")} style={{ marginTop: "1rem" }}>SIGN INGRESSES (ALL BODIES, 2026–2027)</div>
            <div className={styles.note} style={{ marginBottom: "0.6rem" }}>
                Every ingress falls exactly on the destination-sign cusp (0° of the new sign) by definition, so longitude is not shown — the From → To columns convey the cusp crossing.
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Date (UTC)</th>
                        <th>Body</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Direction</th>
                    </tr>
                </thead>
                <tbody>
                    {SIGN_INGRESSES.map((row, idx) => (
                        <tr key={`${row.utc}-${row.body}-${idx}`}>
                            <td>{dateLabel(row.utc)}</td>
                            <td><b>{row.body}</b></td>
                            <td>{row.fromSign}</td>
                            <td><b>{row.toSign}</b></td>
                            <td>{row.retrograde ? "Rx" : "D"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className={cx(styles["section-hdr"], "section-hdr")} style={{ marginTop: "1rem" }}>ECLIPSES 2026–2027 (SOLAR + LUNAR)</div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Date (UTC)</th>
                        <th>Kind</th>
                        <th>Type</th>
                        <th>Sun / Moon°</th>
                        <th>Sign</th>
                    </tr>
                </thead>
                <tbody>
                    {ECLIPSES_2026_2027.map((row, idx) => (
                        <tr key={`${row.utc}-${idx}`}>
                            <td>{dateLabel(row.utc)}</td>
                            <td><b>{row.kind}</b></td>
                            <td>{row.eclipseType}</td>
                            <td>{formatLongitude(row.longitude)}</td>
                            <td>{row.sign}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className={cx(styles["section-hdr"], "section-hdr")} style={{ marginTop: "1rem" }}>STELLIUMS — 3+ STELLIUM_BODIES WITHIN 5° (2026–2027)</div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Start (UTC)</th>
                        <th>End (UTC)</th>
                        <th>Duration</th>
                        <th>Members</th>
                        <th>Center (start)</th>
                    </tr>
                </thead>
                <tbody>
                    {STELLIUMS_2026_2027.map((row, idx) => (
                        <tr key={`${row.startUtc}-${idx}`}>
                            <td>{dateLabel(row.startUtc)}</td>
                            <td>{dateLabel(row.endUtc)}</td>
                            <td>{row.durationDays.toFixed(1)}d</td>
                            <td>{row.members.join(" · ")}</td>
                            <td>{formatLongitude(row.centerLongitudeStart)} {row.centerSignStart}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}

function StatsAndFormulas({ station2026, auditGates }: { station2026: typeof STATIONS; auditGates: AuditGate[] }) {
    const statsRows = [
        ["Forecast rows", String(FORECAST_WEATHER_EVENTS.length)],
        ["2026 stations", String(station2026.length)],
        ["Acceptance gates", `${auditGates.filter((gate) => gate.status === "pass").length}/${auditGates.length}`],
        ["2026 eclipses", String(ECLIPSES.filter((event) => event.dateUtc.startsWith("2026")).length)],
        ["Cached ephemeris bodies", String(EPHEMERIS_DAILY_BODIES.length)],
    ];
    const statsDetailHtml = statsRows
        .map(([label, value]) => `<div class="${styles.kv}"><span>${label}</span><span style="color:#7eb8f7">${value}</span></div>`)
        .join("");
    const html = ORIGINAL_STATS_HTML.replace('<div id="stats-detail"></div>', `<div id="stats-detail">${statsDetailHtml}</div>`);

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function CriteriaCheck({ active, label }: { active: boolean; label: string }) {
    return (
        <span className={cx(styles["criteria-check"], active ? styles["criteria-check-on"] : styles["criteria-check-off"])}>
            {active ? "✓" : "–"} {label}
        </span>
    );
}

function ElNinoPanel() {
    return (
        <div id="elnino-panel">
            <div className={cx(styles["info-box"], "info-box")}>
                <b>T22 Rule:</b> Outer planet with IC line in Niño 3.4 zone (120°W–170°W) = planet at 0°♍–0°♑ in ecliptic longitude.
                Saturn in Sagittarius is the strongest single indicator. Saturn square/opposition Neptune = Walker Circulation disruption (+0.10).
                Jupiter conjunction/opposition/square Neptune = oceanic expansion (+0.08).
            </div>
            <div className={styles["fp-grid"]}>
                {EL_NINO_EVENTS.map((event) => (
                    <div className={cx(styles["fp-card"], "fp-card")} key={event.period}>
                        <div className={cx(styles["fp-header"], "fp-header")}>
                            <Badge kind={event.oni >= 2.5 ? "crit" : "star"}>{event.period}</Badge>
                            <b>ONI {event.oni.toFixed(1)}</b>
                            <span className={styles.cite}>Rank #{event.rank}/6 · {event.score}</span>
                        </div>
                        <div className={styles["criteria-grid"]}>
                            <CriteriaCheck active={event.criteria.t22Ic} label="T22 IC" />
                            <CriteriaCheck active={event.criteria.satSag} label="Sat-Sag" />
                            <CriteriaCheck active={event.criteria.jupNep} label="Jup-Nep" />
                            <CriteriaCheck active={event.criteria.satNep} label="Sat□☍Nep" />
                            <CriteriaCheck active={event.criteria.worldPoint} label="World Pt" />
                        </div>
                        <div className={styles["risk-zones"]}>
                            <b>IC Zone Planet(s)</b>
                            {event.planets.map((planet) => <span key={planet}>{planet}</span>)}
                        </div>
                        <p>{event.verdict}</p>
                    </div>
                ))}
            </div>
            <div className={cx(styles["info-box"], "info-box")} style={{ borderLeftColor: "#74c77b" }}>
                <b>Model gaps:</b> SOI, PDO, trade wind weakening mechanics, ENSO-solar cycle correlation, volcanic forcing, and duration modeling are not astrologically modelled. Use T22 as onset-window flag and verify with Niño 3.4 anomaly data before publishing forecasts.
            </div>
        </div>
    );
}

function forecastForDate(date: string) {
    return FORECAST_WEATHER_EVENTS.find((event) => event.date === date);
}

function criteriaColor(met?: number): string {
    if (met == null) return "#444";
    if (met >= 10) return "#ff6b6b";
    if (met >= 8) return "#ff9f47";
    if (met >= 6) return "#ffd43b";
    return "#74b3ff";
}

function weatherTypeClass(type?: string): string {
    if (type === "wildfire") return "b-fire";
    if (type === "storm_cyclone") return "b-storm";
    if (type === "earthquake") return "b-quake";
    if (type === "tornado") return "b-tornado";
    if (type === "compound") return "b-compound";
    if (type === "heatwave") return "b-fire";
    if (type === "winter_storm") return "b-storm";
    return "b-flood";
}

function weatherTypeLabel(type?: string): string {
    return (type ?? "forecast").replace(/_/g, " ");
}

function zoneAngle(zone: string): "MC" | "IC" | "ASC" | "DSC" | "GLOBAL" {
    const match = zone.match(/^(MC|IC|ASC|DSC|GLOBAL)\b/);
    return (match?.[1] as "MC" | "IC" | "ASC" | "DSC" | "GLOBAL" | undefined) ?? "MC";
}

function zoneColor(zone: string): string {
    const colors = { MC: "#ff9f47", IC: "#7eb8f7", ASC: "#74c77b", DSC: "#da77f2", GLOBAL: "#ffd43b" };
    return colors[zoneAngle(zone)];
}

function conditionBullets(text?: string): string[] {
    return (text ?? "")
        .split(/(?<=\.)\s+|;\s+/)
        .map((item) => item.replace(/^[A-Z\s\d°–\-]+—\s*/, "").trim())
        .filter((item) => item.length > 8)
        .slice(0, 8);
}

function DetailedRiskCard({ row }: { row: SkyRow }) {
    const forecast = forecastForDate(row.date);
    const tier = tierFromPss(row.pss);
    const window = triggersForWindow(row.date, 13);
    const criteria = forecast?.criteria;
    const criteriaTotal = criteria ? Math.max(criteria.total, 28) : null;
    const bullets = conditionBullets(forecast?.combo ?? forecast?.notes ?? row.title);
    const zones = forecast?.zones?.length ? forecast.zones : row.zones;
    const triggers = [
        ...window.aspects.map((aspect) => ({ label: `${aspect.bodies} ${aspect.degree}`, kind: aspect.severity === "critical" ? "crit" : aspect.type === "eclipse" ? "eclipse" : "asp", title: aspect.weather })),
        ...window.moons.map((moon) => ({ label: `${moon.type === "NM" ? "🌑" : "🌕"} ${moon.date.slice(5)} ${moon.degree}`, kind: "moon", title: moon.note })),
    ];

    return (
        <div className={cx(styles["risk-card"], styles[`tier-${tier}`])}>
            <div className={styles["risk-card-hdr"]}>
                <span className={styles["risk-date"]}>{row.date}</span>
                <span style={{ fontSize: 11 }}>{tierLabel(tier).toUpperCase()}</span>
                <span className={cx("badge", weatherTypeClass(forecast?.type))}>{weatherTypeLabel(forecast?.type)}</span>
                <div style={{ minWidth: 100 }}><PssBar value={row.pss} /></div>
                {criteria && criteriaTotal ? <div style={{ fontSize: 10, fontWeight: 700, color: criteriaColor(criteria.met) }}>✦ {criteria.met}/{criteriaTotal} criteria</div> : null}
            </div>
            <div className={styles["risk-card-body"]}>
                {zones.length ? (
                    <div className={styles["risk-zones"]}>
                        <b>🌍 Geodetic Regions <span className={styles["angle-legend"]}>[<span style={{ color: "#ff9f47" }}>■MC</span> <span style={{ color: "#7eb8f7" }}>■IC</span> <span style={{ color: "#74c77b" }}>■ASC</span> <span style={{ color: "#da77f2" }}>■DSC</span>]</span></b>
                        {zones.map((zone) => (
                            <span className={styles["zone-tag"]} style={{ borderLeftColor: zoneColor(zone), color: zoneColor(zone) }} key={zone}>{zone}</span>
                        ))}
                    </div>
                ) : null}
                <div className={styles["risk-detail-grid"]}>
                    <div className={styles["risk-factors"]}>
                        <b>Key Conditions</b>
                        {bullets.map((bullet) => <div className={styles["factor-li"]} key={bullet}><span>{bullet}</span></div>)}
                    </div>
                    <div className={styles["risk-triggers"]}>
                        <b>Phase 2 Triggers</b>
                        {triggers.length ? triggers.map((trigger) => (
                            <span className={cx(styles["trigger-pill"], styles[`trigger-${trigger.kind}`])} title={trigger.title} key={`${trigger.kind}-${trigger.label}`}>⚡ {trigger.label}</span>
                        )) : <span className={styles.muted}>No hard aspect or lunation in the next 13 days.</span>}
                    </div>
                </div>
                <div className={styles["risk-pills"]}>
                    {(forecast?.stars ?? []).map((star) => <span className="star-pill" key={star}>★ {star}</span>)}
                    {forecast?.pair ? <span className="pair-pill">⬡ {forecast.pair}</span> : null}
                    {forecast?.geostress ? <span className="geo-pill">◈ {forecast.geostress}</span> : null}
                </div>
            </div>
        </div>
    );
}

function RiskCalendar({
    skyRows,
    ingressPanels,
    tnoRows,
}: {
    skyRows: SkyRow[];
    ingressPanels: IngressPanelData[];
    tnoRows: TnoActivationRow[];
}) {
    return (
        <>
            <div className={cx(styles["section-hdr"], "section-hdr")}>FORWARD RISK CALENDAR — 2026</div>
            <div className={cx(styles["info-box"], "info-box")}>
                <b>Purple = eclipse pair window active (Pair B: Feb 17/Aug 12, Leo/Aquarius axis).</b>
                All 2026 entries from Feb 17 onward are inside the Pair B corridor.
                <b> T-Sq ♋/♈</b> = Jupiter Cancer sq Saturn/Neptune Aries.
                <b> Fixed opp</b> = Jupiter Leo opposing Pluto Aquarius.
            </div>

            <div className={cx(styles["section-hdr"], "section-hdr")} style={{ marginTop: ".5rem" }}>GEODETIC CITY REFERENCE — 4-Angle System (MC · ASC · IC · DSC)</div>
            <div id="city-ref" className={styles["table-scroll"]}>
                <table>
                    <thead><tr><th>City</th><th>MC</th><th>ASC</th><th>IC</th><th>DSC</th><th>2026 Notes</th></tr></thead>
                    <tbody>
                        {CITY_REFERENCES.map((city) => (
                            <tr key={city.city}>
                                <td><b>{city.city}</b><p>{city.lat}, {city.lon}</p></td>
                                <td><Badge kind="geo">{city.mc}</Badge></td>
                                <td><Badge kind="geo">{city.asc}</Badge></td>
                                <td><Badge kind="star">{city.ic}</Badge></td>
                                <td><Badge kind="star">{city.dsc}</Badge></td>
                                <td>{city.note}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={cx(styles["section-hdr"], "section-hdr")} style={{ marginTop: "1rem" }}>SOLAR INGRESS CHARTS 2026–2027 — Planetary Hits to Geodetic Angles (±5°)</div>
            <div className={cx(styles["tech-card"], "tech-card")} style={{ borderLeft: "3px solid #7eb8f7", background: "#06080d", padding: 10 }}>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 8 }}>
                    At each solstice/equinox, planets within ±5° of a city&apos;s geodetic IC/ASC/MC/DSC set the quarterly event-type climate.
                    IC sign = seasonal weather blueprint. Outer planet hits = multi-month risk signature. Inner planet hits = event-week trigger candidate.
                </div>
                <IngressTabs panels={ingressPanels} />
            </div>

            <div className={cx(styles["section-hdr"], "section-hdr")} style={{ marginTop: "1rem" }}>TRANS-NEPTUNIAN BODIES — Haumea · Sedna · Makemake (2026 Activations)</div>
            <div id="tno-panel" className={styles["fp-grid"]}>
                {RISK_TNO_BODIES.map((body) => {
                    const rows = tnoRows.filter((row) => row.body === body);
                    return (
                        <div className={cx(styles["fp-card"], "fp-card")} key={body}>
                            <div className={cx(styles["fp-header"], "fp-header")}>
                                <Badge kind="star">{body}</Badge>
                                <span className={styles.cite}>Horizons-backed ephemeris</span>
                            </div>
                            {rows.map((row) => (
                                <div className={styles.kv} key={`${row.date}-${row.body}`}>
                                    <span>{dateLabel(row.date)} · {row.position}</span>
                                    <span>{row.hits.join(" · ")}</span>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

            <div className={cx(styles["section-hdr"], "section-hdr")} style={{ marginTop: "1rem" }}>T22 VALIDATION — El Niño Historical Cross-Check (1957–2024)</div>
            <ElNinoPanel />

            <div id="risk-cal" className={cx(styles["risk-timeline"], "risk-timeline")}>
                {skyRows.map((row) => <DetailedRiskCard row={row} key={`${row.date}-risk`} />)}
            </div>

            <div id="moon-cal">
                <div className={styles["table-scroll"]}>
                    <table>
                        <thead><tr><th>Date</th><th>Phase</th><th>Degree</th><th>Eclipse</th></tr></thead>
                        <tbody>
                            {MOON_CALENDAR_2026.map((moon) => (
                                <tr key={`${moon.date}-${moon.type}`}>
                                    <td>{dateLabel(moon.date)}</td>
                                    <td>{moon.type}</td>
                                    <td>{moon.degree}</td>
                                    <td>{moon.eclipse ? "Yes" : "No"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="aspects-cal">
                <div className={styles["table-scroll"]}>
                    <table>
                        <thead><tr><th>Date</th><th>Type</th><th>Aspect</th><th>Degree</th><th>Severity</th></tr></thead>
                        <tbody>
                            {HARD_ASPECTS_2026.map((row) => (
                                <tr key={`${row.date}-${row.bodies}-${row.degree}`}>
                                    <td>{dateLabel(row.date)}</td>
                                    <td>{row.type}</td>
                                    <td>{row.bodies}</td>
                                    <td>{row.degree}</td>
                                    <td>{row.severity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={cx(styles["section-hdr"], "section-hdr")} style={{ marginTop: "1.5rem" }}>RETROGRADE CYCLE TRACKER 2026 — Pre/Post Shadow Dates</div>
            <div id="retro-container" className={styles["table-scroll"]}>
                <table>
                    <thead><tr><th>Date</th><th>Station</th><th>Degree</th><th>Source</th></tr></thead>
                    <tbody>
                        {STATIONS.filter((station) => station.dateUtc.startsWith("2026")).map((station) => (
                            <tr key={`${station.dateUtc}-${station.planet}-${station.type}`}>
                                <td>{dateLabel(station.dateUtc)}</td>
                                <td>{station.planet} {station.type}</td>
                                <td>{degreeLabel(station.longitude)}</td>
                                <td className={styles.cite}>Canonical event ledger</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function ComputedForecastTable({ skyRows }: { skyRows: SkyRow[] }) {
    return (
        <div className={styles["table-scroll"]}>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Event</th>
                        <th>Tier</th>
                        <th>PSS</th>
                        {PLANET_ORDER.map((planet) => <th key={planet}>{planet}</th>)}
                        <th>Triggers</th>
                    </tr>
                </thead>
                <tbody>
                    {skyRows.map((row) => {
                        const positions = new Map(row.positions.map((position) => [position.name, position]));
                        const tier = tierFromPss(row.pss);
                        return (
                            <tr key={`${row.date}-${row.title}`}>
                                <td>{dateLabel(row.date)}</td>
                                <td><b>{row.title}</b></td>
                                <td><Badge kind={tier === "critical" ? "crit" : "geo"}>{tierLabel(tier)}</Badge></td>
                                <td><PssBar value={row.pss} /></td>
                                {PLANET_ORDER.map((planet) => {
                                    const position = positions.get(planet);
                                    return <td key={planet}>{position ? planetLabel(position) : "n/a"}</td>;
                                })}
                                <td>
                                    {[...row.triggers, row.moon].filter(Boolean).slice(0, 4).map((trigger) => (
                                        <Badge key={trigger} kind={String(trigger).includes("eclipse") ? "moon" : "asp"}>{trigger}</Badge>
                                    ))}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function ValidationPane({
    auditGates,
    weatherScores,
    computedData,
    skyRows,
    eclipsePaths,
}: {
    auditGates: AuditGate[];
    weatherScores: ScoreRow[];
    computedData: DashboardComputedData;
    skyRows: SkyRow[];
    eclipsePaths: EclipsePathSummary[];
}) {
    return (
        <>
            <div className={cx(styles["section-hdr"], "section-hdr")}>TECHNIQUE VALIDATION REPORT v8.0 — 183 EVENT BACKTEST (2005–2025)</div>
            <div className={cx(styles["info-box"], "info-box")}>Full backtest of traditional mundane astrology techniques against global events scored with PSS. Threshold: CONFIRMED ≥60% · PARTIAL 30–59% · NOT CONFIRMED &lt;30%. This build adds ephemeris QA below the original validation frame.</div>
            <div className={styles["warn-box"]}>
                <b>MODEL SCOPE &amp; GEOPOLITICAL CAVEAT</b><br />
                This model is optimized for natural disaster prediction: floods, storms, earthquakes, wildfires, heatwaves, and compound weather events. Geopolitical events are retained with caveats because state-level and human-initiated behavior has different predictability than geophysical timing.
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#c0bdb7", margin: "14px 0 6px" }}>VALIDATED GEOGRAPHIC ZONE FINDINGS</div>
            <div className={cx(styles["info-box"], "info-box")}>
                <b>♑ CAPRICORN IC CORRIDOR — 92°–112°E longitude</b><br />
                Original finding retained: Asia-Pacific aviation and seismic clustering is interpreted through shared Capricorn IC pressure during the Pluto-in-Capricorn era.
            </div>
            <div className={cx(styles["info-box"], "info-box")}>
                <b>♋ CANCER IC EARTHQUAKE ANOMALY — 73°–82°W longitude</b><br />
                Original caveat retained: Caribbean and Central Andean earthquakes are structurally under-scored by pure IC-sign weather classifiers and require local seismic history plus angular transits.
            </div>
            <div className={styles["stat-grid"]}>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{computedData.ephemerisEvents.length}</div><div className={styles["stat-lbl"]}>Ephemeris events loaded</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{computedData.eclipsePaths.length}</div><div className={styles["stat-lbl"]}>NASA path points</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>21</div><div className={styles["stat-lbl"]}>Cached bodies</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{FORECAST_WEATHER_EVENTS.length}</div><div className={styles["stat-lbl"]}>Forecast rows restored</div></div>
            </div>
            <div className={cx(styles["section-hdr"], "section-hdr")}>Ephemeris QA — Forecast Dates Recomputed</div>
            <ComputedForecastTable skyRows={skyRows} />
            <div className={cx(styles["section-hdr"], "section-hdr")}>NASA Eclipse Path Geometry QA</div>
            <div className={styles["table-scroll"]}>
                <table>
                    <thead><tr><th>Date</th><th>Path</th><th>Points</th><th>Geometry range</th><th>Source</th></tr></thead>
                    <tbody>
                        {eclipsePaths.map((row) => (
                            <tr key={row.date}>
                                <td>{dateLabel(row.date)}</td>
                                <td>{row.label}</td>
                                <td>{row.count}</td>
                                <td>{row.range}</td>
                                <td className={styles.cite}>{row.source}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={styles["fp-grid"]}>
                {auditGates.map((gate) => (
                    <div className={styles["fp-card"]} key={gate.label}>
                        <div className={styles["fp-header"]}>
                            <Badge kind={gate.status === "pass" ? "geo" : "crit"}>{gate.status.toUpperCase()}</Badge>
                            <b>{gate.label}</b>
                        </div>
                        <p>{gate.detail}</p>
                    </div>
                ))}
            </div>
            <div className={styles["section-hdr"]}>Original HTML Coverage Audit</div>
            <div className={styles["table-scroll"]}>
                <table>
                    <thead><tr><th>Original tab section</th><th>Status</th><th>Fix</th></tr></thead>
                    <tbody>
                        {[
                            ["Event Correlations", "Present", "149 original rows restored; forecast table now uses ephemeris positions."],
                            ["Techniques Guide", "Present", "T11–T23 missing method notes restored inside technique cards."],
                            ["Statistics & Formulas", "Present", "Original formulas retained with acceptance gates."],
                            ["Planetary Fingerprints", "Present", "Fingerprint catalog restored from GEODETIC_FINGERPRINTS."],
                            ["Risk Calendar 2026", "Present", "All forecast rows, ingress charts, city angles, TNOs, eclipse paths, retrogrades, aspects, and moons included."],
                            ["Body × Star Matrix", "Present", "Full matrix restored from BODY_STAR_MATRIX."],
                            ["Validation v8.3", "Present", "Missing-event accuracy and ephemeris coverage shown."],
                        ].map(([section, status, fix]) => (
                            <tr key={section}>
                                <td>{section}</td>
                                <td><Badge kind="geo">{status}</Badge></td>
                                <td>{fix}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={styles["section-hdr"]}>Engine Scores By City</div>
            <div className={styles["table-scroll"]}>
                <table>
                    <thead><tr><th>Date</th><th>City</th><th>Score</th><th>Severity</th><th>Top event</th></tr></thead>
                    <tbody>
                        {weatherScores.map((row) => (
                            <tr key={`${row.date}-${row.city}`}>
                                <td>{dateLabel(row.date)}</td>
                                <td>{row.city}</td>
                                <td>{row.result.score}</td>
                                <td>{row.result.severity}</td>
                                <td>{row.result.events[0]?.label ?? "No active event above threshold"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={styles["section-hdr"]}>Imported Missing Event Accuracy</div>
            <div className={styles["stat-grid"]}>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{ORIGINAL_EVENTS_ACCURACY.missingFromNormalizedByDate}</div><div className={styles["stat-lbl"]}>Missing rows</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{ORIGINAL_EVENTS_ACCURACY.ephemerisClaimAudit.claimSummary.checked}</div><div className={styles["stat-lbl"]}>Claims checked</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{ORIGINAL_EVENTS_ACCURACY.ephemerisClaimAudit.claimSummary.pass}</div><div className={styles["stat-lbl"]}>Claims pass</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{ORIGINAL_EVENTS_ACCURACY.ephemerisClaimAudit.claimSummary.warn}</div><div className={styles["stat-lbl"]}>Claims warn</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{ORIGINAL_EVENTS_ACCURACY.ephemerisClaimAudit.claimSummary.fail}</div><div className={styles["stat-lbl"]}>Claims fail</div></div>
                <div className={styles["stat-box"]}><div className={styles["stat-num"]}>{ORIGINAL_EVENTS_ACCURACY.ephemerisClaimAudit.eventSummary.unverifiable}</div><div className={styles["stat-lbl"]}>Unstructured rows</div></div>
            </div>
            <div className={styles["warn-box"]}>
                <b>Evaluator note:</b> the restored 149-row table is original-dashboard source data. Missing rows are not engine-verified until their event facts, coordinates, geodetic angles, and planet-degree claims are recomputed from structured inputs.
            </div>
            <div className={styles["table-scroll"]}>
                <table>
                    <thead><tr><th>Date</th><th>Event</th><th>Residual warning</th><th>Ephemeris result</th><th>Orb</th></tr></thead>
                    <tbody>
                        {ORIGINAL_EVENTS_ACCURACY.residualWarnings.map((row) => (
                            <tr key={`${row.date}-${row.event}-${row.claim}`}>
                                <td>{row.date}</td>
                                <td>{row.event}</td>
                                <td>{row.claim}</td>
                                <td>{row.actual}</td>
                                <td className={styles["sev-cell"]}>{row.orb.toFixed(2)}°</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function PlanetaryFingerprints() {
    return (
        <>
            <div className={cx(styles["section-hdr"], "section-hdr")}>8 PLANETARY FINGERPRINTS — Natural Disasters · Accidents · Aviation · Conflict (v4.0)</div>
            <div id="fp-container">
                {DASHBOARD_FINGERPRINTS.map(dashboardFingerprint).map((fingerprint) => (
                    <div className={cx(styles["fp-card"], "fp-card")} key={fingerprint.name}>
                        <div className={cx(styles["fp-header"], "fp-header")}>
                            <span className={cx("badge", fingerprintBadgeClass(fingerprint.name))}>{fingerprint.name.replace(/_/g, " ")}</span>
                            <span style={{ fontSize: 11, color: "#888" }}>threshold: {fingerprint.threshold}</span>
                            <span className="fp-match" style={{ color: "#7eb8f7" }}>✓ {fingerprint.events.length} validated events</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#c0bdb7", marginBottom: ".5rem" }}>{fingerprint.description}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".8rem", fontSize: 11 }}>
                            <div>
                                <div style={{ color: "#666", fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>Required all</div>
                                <ul className="req-list">
                                    {fingerprint.required.map((item) => <li key={item}><b className="tick">✓</b> {item}</li>)}
                                </ul>
                                <div style={{ color: "#666", fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em", margin: "5px 0 3px" }}>Any one</div>
                                <ul className="req-list">
                                    {fingerprint.anyOne.map((item) => <li key={item}>◇ {item}</li>)}
                                </ul>
                            </div>
                            <div>
                                <div style={{ color: "#666", fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>Phase 2 trigger</div>
                                <div style={{ fontSize: 11, color: "#ff9f47", marginBottom: ".5rem" }}>⚡ {fingerprint.trigger}</div>
                                <div style={{ color: "#666", fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>Geodetic zone</div>
                                <div style={{ fontSize: 11, color: "#888", marginBottom: ".5rem" }}>🌐 {fingerprint.zone}</div>
                                <div style={{ color: "#666", fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>Validated events</div>
                                <ul className="req-list">
                                    {fingerprint.events.map((event) => <li key={event}>{event}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

function StarMatrixAndAngles() {
    return (
        <>
            <div className={cx(styles["section-hdr"], "section-hdr")}>CELESTIAL BODY × FIXED STAR INTERACTION MATRIX</div>
            <div className={cx(styles["info-box"], "info-box")}>Main planets + weather sensitizers as rows. Cells carry the interaction notes used by the dashboard scoring layer. Computed city angles are available in the Risk Calendar city reference table.</div>
            <div className={styles["table-scroll"]}>
                <table id="star-matrix">
                    <thead>
                        <tr>
                            <th>Body</th>
                            {BODY_STAR_MATRIX.stars.map((star) => <th key={star}>{star}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {BODY_STAR_MATRIX.bodies.map((body) => (
                            <tr key={body}>
                                <td><b>{body}</b></td>
                                {BODY_STAR_MATRIX.stars.map((star) => (
                                    <td key={`${body}-${star}`}>{BODY_STAR_MATRIX.notes[body]?.[star] ?? "—"}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default async function GeodeticTestPage() {
    const computedData = await fetchComputedDashboardData();
    const [skyRows, weatherScores, auditGates, tnoRows, ingressPanels] = await Promise.all([
        buildSkyRows(computedData.ephemerisEvents),
        buildWeatherScores(),
        buildAuditGates(),
        buildTnoActivations(["2026-02-17", "2026-08-12", "2026-11-03", "2026-12-01"]),
        buildIngressPanels(),
    ]);
    const eclipsePaths = eclipsePathSummaries(computedData.eclipsePaths);
    // SWE-validated 2026 ledger: derive from RETROGRADE_SHADOW_WINDOWS, traditional planets only,
    // chronological, both Rx and Direct stations.
    const TRADITIONAL_BODIES = new Set(["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]);
    const station2026: typeof STATIONS = [];
    for (const w of RETROGRADE_SHADOW_WINDOWS) {
        if (!TRADITIONAL_BODIES.has(w.body)) continue;
        if (w.retrogradeStation.utc.startsWith("2026")) {
            station2026.push({
                planet: w.body, type: "retrograde",
                dateUtc: w.retrogradeStation.utc,
                longitude: w.retrogradeStation.longitude,
                sign: w.retrogradeStation.sign,
            });
        }
        if (w.directStation.utc.startsWith("2026")) {
            station2026.push({
                planet: w.body, type: "direct",
                dateUtc: w.directStation.utc,
                longitude: w.directStation.longitude,
                sign: w.directStation.sign,
            });
        }
    }
    station2026.sort((a, b) => a.dateUtc.localeCompare(b.dateUtc));
    const tabs = [
        { id: "tab-events", label: "Event Correlations", children: <EventCorrelations /> },
        { id: "tab-tech", label: "Techniques Guide", children: <TechniquesGuide /> },
        { id: "tab-crane", label: "Crane Weather Framework", children: <CraneWeatherFramework /> },
        { id: "tab-ephem", label: "Canonical Ephemeris 2026–27", children: <CanonicalEphemeris /> },
        { id: "tab-stats", label: "Statistics & Formulas", children: <StatsAndFormulas station2026={station2026} auditGates={auditGates} /> },
        { id: "tab-fp", label: "Planetary Fingerprints", children: <PlanetaryFingerprints /> },
        { id: "tab-cal", label: "Risk Calendar 2026", children: <RiskCalendar skyRows={skyRows} ingressPanels={ingressPanels} tnoRows={tnoRows} /> },
        { id: "tab-stars", label: "Body × Star Matrix", children: <StarMatrixAndAngles /> },
        { id: "tab-validation", label: "Validation v8.3", children: <ValidationPane auditGates={auditGates} weatherScores={weatherScores} computedData={computedData} skyRows={skyRows} eclipsePaths={eclipsePaths} /> },
    ];

    return (
        <div className={cx(styles.app, "app")}>
            <Sidebar station2026={station2026} />
            <main className={cx(styles.main, "main")}>
                <div className={cx(styles["main-title"], "main-title")}>
                    <h1>Geodetic Mundane Prediction Engine — v4.0</h1>
                    <span className={styles.cite}>Jan 2024 – Dec 2026 · Koch/Transpluto · World Axis (8 pts) · Hot Zones · Geophysical Degrees · All global events</span>
                </div>

                <GeodeticTabs tabs={tabs} />
            </main>
        </div>
    );
}
