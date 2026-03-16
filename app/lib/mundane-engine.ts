/**
 * mundane-engine.ts — Core calculation logic for world transits,
 * angular planets, and parans. Extracted for reuse in 12-month
 * window calculations.
 */

import { SIGN_RULERS } from "./astro-constants";

const SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const PLANET_MAP: Record<string, string> = {
    sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus",
    mars: "Mars", jupiter: "Jupiter", saturn: "Saturn",
    uranus: "Uranus", neptune: "Neptune", pluto: "Pluto",
};

const MAJOR_ASPECTS = [
    { angle: 0,   orb: 8,  name: "Conjunction",  symbol: "☌" },
    { angle: 60,  orb: 6,  name: "Sextile",      symbol: "⚹" },
    { angle: 90,  orb: 8,  name: "Square",        symbol: "□" },
    { angle: 120, orb: 8,  name: "Trine",         symbol: "△" },
    { angle: 180, orb: 8,  name: "Opposition",    symbol: "☍" },
];

function signOf(lon: number) {
    const idx = Math.floor(lon / 30) % 12;
    return { sign: SIGNS[idx], degree: Math.round((lon % 30) * 10) / 10 };
}

function angularDiff(a: number, b: number): number {
    let diff = Math.abs(a - b) % 360;
    if (diff > 180) diff = 360 - diff;
    return diff;
}

function gmst(utcDate: Date): number {
    const JD = utcDate.getTime() / 86400000 + 2440587.5;
    const T = (JD - 2451545.0) / 36525.0;
    const g = 280.46061837 + 360.98564736629 * (JD - 2451545.0)
        + 0.000387933 * T * T - (T * T * T) / 38710000.0;
    return ((g % 360) + 360) % 360;
}

function eclToRA(eclLon: number, obliquity = 23.4393): number {
    const λ = eclLon * (Math.PI / 180);
    const ε = obliquity * (Math.PI / 180);
    const ra = Math.atan2(Math.sin(λ) * Math.cos(ε), Math.cos(λ));
    return ((ra * (180 / Math.PI)) % 360 + 360) % 360;
}

function mcLon(planetRA: number, RAMC: number): number {
    return ((RAMC - planetRA + 540) % 360) - 180;
}

export interface MundanePlanetaryPosition {
    name: string;
    longitude: number;
    sign: string;
    degree: number;
    ra: number;
}

export interface MundaneWorldTransit {
    p1: string;
    p2: string;
    aspect: string;
    symbol: string;
    orb: number;
    p1Sign: string;
    p1Deg: number;
    p2Sign: string;
    p2Deg: number;
    applying: boolean;
    isTense: boolean;
}

export interface MundaneAngularPlanet {
    planet: string;
    angle: string;
    mcLonDeg: number;
    distFromLocation: number;
    sign: string;
    degree: number;
}

export interface MundaneParan {
    p1: string;
    p2: string;
    type: string;
    lat: number;
}

export interface MundaneData {
    planets: MundanePlanetaryPosition[];
    worldTransits: MundaneWorldTransit[];
    angularPlanets: MundaneAngularPlanet[];
    parans: MundaneParan[];
}

export async function computeMundaneData(params: {
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    lat: number;
    lon: number;
}): Promise<MundaneData> {
    const { date, time, lat, lon } = params;

    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);

    const { Origin, Horoscope } = await import("circular-natal-horoscope-js");

    const origin = new Origin({
        year, month: month - 1, date: day, hour, minute,
        latitude: lat, longitude: lon,
    });

    const horoscope = new Horoscope({
        origin,
        houseSystem: "placidus",
        zodiac: "tropical",
        aspectPoints: ["bodies"],
        aspectWithPoints: ["bodies"],
        aspectTypes: ["major"],
        customOrbs: {},
        language: "en",
    });

    const planets: MundanePlanetaryPosition[] = [];
    for (const [key, body] of Object.entries(horoscope.CelestialBodies)) {
        const b = body as any;
        if (!b?.ChartPosition) continue;
        const lon360 = b.ChartPosition.Ecliptic?.DecimalDegrees ?? 0;
        const { sign, degree } = signOf(lon360);
        const displayName = PLANET_MAP[key] ?? key;
        planets.push({
            name: displayName,
            longitude: Math.round(lon360 * 10) / 10,
            sign,
            degree,
            ra: eclToRA(lon360),
        });
    }

    const worldTransits: MundaneWorldTransit[] = [];
    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            const p1 = planets[i];
            const p2 = planets[j];
            const diff = angularDiff(p1.longitude, p2.longitude);

            for (const asp of MAJOR_ASPECTS) {
                const orb = Math.abs(diff - asp.angle);
                if (orb <= asp.orb) {
                    const rawDiff = (p2.longitude - p1.longitude + 360) % 360;
                    const applying = rawDiff < 180;
                    worldTransits.push({
                        p1: p1.name, p2: p2.name,
                        aspect: asp.name, symbol: asp.symbol,
                        orb: Math.round(orb * 100) / 100,
                        p1Sign: p1.sign, p1Deg: p1.degree,
                        p2Sign: p2.sign, p2Deg: p2.degree,
                        applying,
                        isTense: asp.name === "Square" || asp.name === "Opposition",
                    });
                    break;
                }
            }
        }
    }
    worldTransits.sort((a, b) => a.orb - b.orb);

    const utcDate = new Date(`${date}T${time}:00Z`);
    const RAMC = ((gmst(utcDate) + lon) % 360 + 360) % 360;

    const ORB_ANGULAR = 3;
    const angularPlanets: MundaneAngularPlanet[] = [];

    for (const p of planets) {
        const mc = mcLon(p.ra, RAMC);
        const ic = ((mc + 180 + 540) % 360) - 180;
        const obliquity = 23.4393 * (Math.PI / 180);
        const φ = lat * (Math.PI / 180);
        const tanVal = Math.tan(φ) * Math.tan(obliquity);
        const ascLon = Math.abs(tanVal) <= 1
            ? ((mc - 90 + Math.asin(tanVal) * (180 / Math.PI) + 540) % 360) - 180
            : null;
        const dscLon = ascLon !== null
            ? ((ascLon + 180 + 540) % 360) - 180
            : null;

        const mcDist = Math.abs(((mc - lon + 540) % 360) - 180);
        if (mcDist <= ORB_ANGULAR) {
            angularPlanets.push({ planet: p.name, angle: "MC", mcLonDeg: mc, distFromLocation: Math.round(mcDist * 111), sign: p.sign, degree: p.degree });
        }
        const icDist = Math.abs(((ic - lon + 540) % 360) - 180);
        if (icDist <= ORB_ANGULAR) {
            angularPlanets.push({ planet: p.name, angle: "IC", mcLonDeg: ic, distFromLocation: Math.round(icDist * 111), sign: p.sign, degree: p.degree });
        }
        if (ascLon !== null) {
            const ascDist = Math.abs(((ascLon - lon + 540) % 360) - 180);
            if (ascDist <= ORB_ANGULAR) {
                angularPlanets.push({ planet: p.name, angle: "ASC", mcLonDeg: ascLon, distFromLocation: Math.round(ascDist * 111), sign: p.sign, degree: p.degree });
            }
        }
        if (dscLon !== null) {
            const dscDist = Math.abs(((dscLon - lon + 540) % 360) - 180);
            if (dscDist <= ORB_ANGULAR) {
                angularPlanets.push({ planet: p.name, angle: "DSC", mcLonDeg: dscLon, distFromLocation: Math.round(dscDist * 111), sign: p.sign, degree: p.degree });
            }
        }
    }

    const PARAN_LAT_ORB = 2;
    const parans: MundaneParan[] = [];
    const angularLats: { planet: string; angle: string; crossLat: number }[] = [];
    for (const p of planets) {
        const mc = mcLon(p.ra, RAMC);
        const obliquity = 23.4393 * (Math.PI / 180);
        for (let testLat = -75; testLat <= 75; testLat += 0.5) {
            const φ = testLat * (Math.PI / 180);
            const tanVal = Math.tan(φ) * Math.tan(obliquity);
            if (Math.abs(tanVal) > 1) continue;
            const dOA = Math.asin(tanVal) * (180 / Math.PI);
            const ascAtTestLat = ((mc - 90 + dOA + 540) % 360) - 180;
            const dscAtTestLat = ((mc + 90 - dOA + 540) % 360) - 180;
            const mcAtTestLat = mc;

            if (Math.abs(((ascAtTestLat - lon + 540) % 360) - 180) < 1.0) {
                angularLats.push({ planet: p.name, angle: "ASC", crossLat: testLat });
            }
            if (Math.abs(((dscAtTestLat - lon + 540) % 360) - 180) < 1.0) {
                angularLats.push({ planet: p.name, angle: "DSC", crossLat: testLat });
            }
            if (Math.abs(((mcAtTestLat - lon + 540) % 360) - 180) < 1.0) {
                angularLats.push({ planet: p.name, angle: "MC", crossLat: testLat });
            }
        }
    }

    for (let i = 0; i < angularLats.length; i++) {
        for (let j = i + 1; j < angularLats.length; j++) {
            const a = angularLats[i];
            const b = angularLats[j];
            if (a.planet === b.planet) continue;
            const latDiff = Math.abs(a.crossLat - b.crossLat);
            if (latDiff <= PARAN_LAT_ORB && Math.abs(a.crossLat - lat) <= 3) {
                parans.push({
                    p1: a.planet, p2: b.planet,
                    type: `${a.angle}/${b.angle}`,
                    lat: Math.round((a.crossLat + b.crossLat) / 2 * 10) / 10,
                });
            }
        }
    }

    return { planets, worldTransits, angularPlanets, parans: parans.slice(0, 20) };
}
