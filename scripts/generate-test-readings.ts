#!/usr/bin/env bun
/**
 * generate-test-readings.ts — produce 5 synthetic V4 readings end-to-end
 * by calling writeTeacherReading directly with hand-built TeacherReadingInput
 * payloads for varied city / goal / travelType combos. Saves each as a full
 * `details` JSON to tmp/v4-readings/.
 *
 * The natal/relocated math (cusps, lines, transits) is pulled from a stable
 * mock chart so we don't need a Supabase round-trip just to demonstrate the
 * AI fields populating. The point of this script is the prompt path, not
 * regression-testing the chart engine.
 *
 * Usage:  bun scripts/generate-test-readings.ts
 *
 * Output: tmp/v4-readings/reading-{1..5}.json
 *
 * Then audit:  bun scripts/eval-v4-reading.ts --dir tmp/v4-readings/
 */
// Bun loads .env.local automatically.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { writeTeacherReading, type TeacherReadingInput } from "@/lib/ai/prompts/teacher-reading";

const OUT_DIR = "tmp/v4-readings";

// Stable mock natal chart — same chart for all 5 so destination/goal is the
// only variable. Coordinates and longitudes are reasonable astrological
// values; they don't need to be Swiss-Ephemeris-accurate for this demo.
const NATAL_PLANETS = [
    { name: "Sun",     longitude: 354, sign: "Pisces" },
    { name: "Moon",    longitude: 198, sign: "Libra" },
    { name: "Mercury", longitude:   2, sign: "Aries" },
    { name: "Venus",   longitude: 322, sign: "Aquarius" },
    { name: "Mars",    longitude:  14, sign: "Aries" },
    { name: "Jupiter", longitude: 156, sign: "Virgo" },
    { name: "Saturn",  longitude:  60, sign: "Gemini" },
    { name: "Neptune", longitude: 246, sign: "Sagittarius" },
];

const NATAL_ANGLES = { ASC: 32, IC: 285, DSC: 212, MC: 105 };

interface Scenario {
    label: string;
    destination: string;
    destinationLat: number;
    destinationLon: number;
    relocatedCusps: number[];
    natalCusps: number[];
    travelDate: string;
    travelType: "trip" | "relocation";
    goalIds: string[];
    macroScore: number;
}

const SCENARIOS: Scenario[] = [
    {
        label: "Tokyo trip, love + community",
        destination: "Tokyo, Japan",
        destinationLat: 35.6762, destinationLon: 139.6503,
        relocatedCusps: [180, 210, 240, 270, 300, 330,   0,  30,  60,  90, 120, 150],
        natalCusps:     [ 32,  62,  92, 122, 152, 182, 212, 242, 272, 302, 332,   2],
        travelDate: "2026-08-12",
        travelType: "trip",
        goalIds: ["love", "community"],
        macroScore: 84,
    },
    {
        label: "Lisbon relocation, growth + relocation",
        destination: "Lisbon, Portugal",
        destinationLat: 38.7223, destinationLon: -9.1393,
        relocatedCusps: [ 75, 105, 135, 165, 195, 225, 255, 285, 315, 345,  15,  45],
        natalCusps:     [ 32,  62,  92, 122, 152, 182, 212, 242, 272, 302, 332,   2],
        travelDate: "2026-09-01",
        travelType: "relocation",
        goalIds: ["growth", "relocation"],
        macroScore: 91,
    },
    {
        label: "Mexico City trip, career + timing",
        destination: "Mexico City, Mexico",
        destinationLat: 19.4326, destinationLon: -99.1332,
        relocatedCusps: [220, 250, 280, 310, 340,  10,  40,  70, 100, 130, 160, 190],
        natalCusps:     [ 32,  62,  92, 122, 152, 182, 212, 242, 272, 302, 332,   2],
        travelDate: "2026-06-15",
        travelType: "trip",
        goalIds: ["career", "timing"],
        macroScore: 67,
    },
    {
        label: "Reykjavik trip, growth alone",
        destination: "Reykjavik, Iceland",
        destinationLat: 64.1466, destinationLon: -21.9426,
        relocatedCusps: [ 30,  60,  90, 120, 150, 180, 210, 240, 270, 300, 330,   0],
        natalCusps:     [ 32,  62,  92, 122, 152, 182, 212, 242, 272, 302, 332,   2],
        travelDate: "2026-12-21",
        travelType: "trip",
        goalIds: ["growth"],
        macroScore: 73,
    },
    {
        label: "Bali relocation, relocation + love + growth",
        destination: "Ubud, Bali, Indonesia",
        destinationLat: -8.5069, destinationLon: 115.2625,
        relocatedCusps: [100, 130, 160, 190, 220, 250, 280, 310, 340,  10,  40,  70],
        natalCusps:     [ 32,  62,  92, 122, 152, 182, 212, 242, 272, 302, 332,   2],
        travelDate: "2026-05-12",
        travelType: "relocation",
        goalIds: ["relocation", "love", "growth"],
        macroScore: 89,
    },
];

// Synthetic top transits — same set across all scenarios for simplicity.
// In production these come from solve12MonthTransits.
const TOP_TRANSITS: TeacherReadingInput["topTransits"] = [
    {
        aspect: "Venus in Capricorn trines Moon in Libra",
        planets: { a: "Venus in Capricorn", b: "Moon in Libra" },
        dateRange: "May 9 — May 14",
        tone: "supportive",
        houseTopics: ["home and roots"],
        aspectKey: "May-0-Venus-Moon",
    },
    {
        aspect: "Jupiter in Cancer conjuncts Descendant",
        planets: { a: "Jupiter in Cancer", b: "Descendant in Cancer" },
        dateRange: "Jun 1 — Jun 10",
        tone: "supportive",
        houseTopics: ["partnership"],
        aspectKey: "Jun-0-Jupiter-DSC",
    },
    {
        aspect: "Mars in Aries squares Saturn in Gemini",
        planets: { a: "Mars in Aries", b: "Saturn in Gemini" },
        dateRange: "Jun 18 — Jun 22",
        tone: "challenging",
        houseTopics: ["work and discipline"],
        aspectKey: "Jun-1-Mars-Saturn",
    },
];

const NEARBY_LINES: TeacherReadingInput["nearbyLines"] = [
    { planet: "Venus",   angle: "Imum Coeli", closeness: "very close" },
    { planet: "Jupiter", angle: "Descendant", closeness: "near" },
    { planet: "Neptune", angle: "Midheaven",  closeness: "distant" },
];

const ACTIVE_HOUSES: TeacherReadingInput["activeHouses"] = [
    { topic: "home and roots", vibe: "lit up" },
    { topic: "partnership",     vibe: "lit up" },
    { topic: "career",          vibe: "under pressure" },
];

const NATAL_SPOTLIGHT: TeacherReadingInput["natalSpotlight"] = [
    { planet: "Sun",  sign: "Pisces", role: "Doing real work" },
    { planet: "Moon", sign: "Libra",  role: "Amplified here" },
    { planet: "Mars", sign: "Aries",  role: "Under pressure" },
];

function buildAIInput(s: Scenario): TeacherReadingInput {
    return {
        destination: s.destination,
        dateRange: { start: s.travelDate, end: addDays(s.travelDate, 10) },
        overallScore: s.macroScore,
        travelType: s.travelType,
        goalIds: s.goalIds,
        topTransits: TOP_TRANSITS,
        nearbyLines: NEARBY_LINES,
        activeHouses: ACTIVE_HOUSES,
        natalSpotlight: NATAL_SPOTLIGHT,
        angleShifts: (["ASC", "IC", "DSC", "MC"] as const).map(angle => ({
            angle,
            natalSign: signOf(NATAL_ANGLES[angle]),
            relocatedSign: signOf(s.relocatedCusps[angle === "ASC" ? 0 : angle === "IC" ? 3 : angle === "DSC" ? 6 : 9]),
        })),
        planetHouseShifts: NATAL_PLANETS.map(p => ({
            planet: p.name,
            natalHouse: houseFromLon(p.longitude, NATAL_ANGLES.ASC),
            relocatedHouse: houseFromLon(p.longitude, s.relocatedCusps[0]),
        })),
        aspectsToAngles: [
            { planet: "Venus",   angle: "IC",  aspect: "conjunct", orb: 0.4 },
            { planet: "Jupiter", angle: "DSC", aspect: "conjunct", orb: 1.8 },
            { planet: "Moon",    angle: "ASC", aspect: "sextile",  orb: 2.5 },
            { planet: "Saturn",  angle: "ASC", aspect: "conjunct", orb: 6.2 },
            { planet: "Neptune", angle: "MC",  aspect: "sextile",  orb: 4.1 },
        ],
    };
}

function addDays(iso: string, n: number): string {
    const d = new Date(iso);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}
function houseFromLon(planetLon: number, ascLon: number): number {
    let off = planetLon - ascLon;
    if (off < 0) off += 360;
    return Math.floor(off / 30) + 1;
}
const ZODIAC = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
function signOf(lon: number): string {
    return ZODIAC[Math.floor(((lon % 360) + 360) % 360 / 30) % 12];
}

function buildSyntheticTransitWindows() {
    // Match the TransitHit shape (post-fix transit_planet_lon).
    return [
        { date: "2026-05-09", transit_planet: "Venus",   transit_planet_lon: 285, natal_planet: "Moon",    aspect: "trine",     orb: 0.4, applying: true,  benefic: true,  retrograde: false },
        { date: "2026-05-12", transit_planet: "Sun",     transit_planet_lon:  52, natal_planet: "Saturn",  aspect: "conjunct",  orb: 1.2, applying: false, benefic: true,  retrograde: false },
        { date: "2026-05-22", transit_planet: "Mercury", transit_planet_lon:  72, natal_planet: "Jupiter", aspect: "trine",     orb: 0.9, applying: true,  benefic: true,  retrograde: false },
        { date: "2026-06-01", transit_planet: "Jupiter", transit_planet_lon: 113, natal_planet: "DSC",     aspect: "conjunct",  orb: 1.8, applying: true,  benefic: true,  retrograde: false },
        { date: "2026-06-18", transit_planet: "Mars",    transit_planet_lon: 152, natal_planet: "Saturn",  aspect: "square",    orb: 0.5, applying: true,  benefic: false, retrograde: false },
        { date: "2026-07-04", transit_planet: "Venus",   transit_planet_lon: 320, natal_planet: "Sun",     aspect: "conjunct",  orb: 1.3, applying: false, benefic: true,  retrograde: false },
        { date: "2026-07-14", transit_planet: "Neptune", transit_planet_lon: 252, natal_planet: "MC",      aspect: "sextile",   orb: 4.1, applying: true,  benefic: true,  retrograde: false },
    ];
}

async function generate(s: Scenario, index: number): Promise<void> {
    const aiInput = buildAIInput(s);
    console.log(`\n[${index + 1}/${SCENARIOS.length}] ${s.label}  →  ${s.destination}`);
    console.time(`  writeTeacherReading-${index + 1}`);
    let teacherReading: any;
    try {
        teacherReading = await writeTeacherReading(aiInput);
    } catch (err: any) {
        console.error(`  AI call failed: ${err?.message ?? err}`);
        if (err?.cause) console.error(`  cause: ${JSON.stringify(err.cause).slice(0, 400)}`);
        if (err?.text)  console.error(`  text:  ${String(err.text).slice(0, 500)}`);
        if (err?.value) console.error(`  value: ${JSON.stringify(err.value).slice(0, 500)}`);
        console.error(`  → saving without teacherReading (will score low)`);
        teacherReading = undefined;
    }
    console.timeEnd(`  writeTeacherReading-${index + 1}`);

    const details = {
        destination: s.destination,
        destinationLat: s.destinationLat,
        destinationLon: s.destinationLon,
        travelType: s.travelType,
        travelDate: s.travelDate,
        goals: [],
        goalIds: s.goalIds,
        macroScore: s.macroScore,
        macroVerdict: s.macroScore >= 75 ? "Productive" : "Mixed",
        houses: Array.from({ length: 12 }, (_, i) => ({
            house: i + 1,
            score: 60 + ((i * 7 + s.macroScore) % 35),
        })),
        houseSystem: "placidus",
        planetaryLines: [
            { planet: "Venus",   line: "IC",  distance: 0,   tier: "Strong" },
            { planet: "Jupiter", line: "DSC", distance: 47,  tier: "Strong" },
            { planet: "Neptune", line: "MC",  distance: 188, tier: "Moderate" },
        ],
        transitWindows: buildSyntheticTransitWindows(),
        eventScores: [],
        natalPlanets: NATAL_PLANETS.map(p => ({ ...p, planet: p.name })),
        relocatedCusps: s.relocatedCusps,
        natalAngles: NATAL_ANGLES,
        natalCusps: s.natalCusps,
        birth: { city: "Brooklyn, NY", date: "1991-03-14", time: "06:42", lat: 40.6782, lon: -73.9442 },
        ...(teacherReading ? { teacherReading } : {}),
    };

    if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
    const outPath = join(OUT_DIR, `reading-${index + 1}.json`);
    writeFileSync(outPath, JSON.stringify(details, null, 2));
    console.log(`  → ${outPath}  (${(JSON.stringify(details).length / 1024).toFixed(1)}kb)`);
}

async function main() {
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.error("Missing GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY in .env.local");
        process.exit(1);
    }
    console.log(`Generating ${SCENARIOS.length} synthetic V4 readings → ${OUT_DIR}/`);
    for (let i = 0; i < SCENARIOS.length; i++) {
        await generate(SCENARIOS[i], i);
    }
    console.log(`\nDone. Audit:  bun scripts/eval-v4-reading.ts --dir ${OUT_DIR}/`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
