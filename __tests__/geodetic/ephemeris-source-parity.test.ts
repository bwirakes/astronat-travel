import { describe, expect, it } from "bun:test";
import { HARD_ASPECTS_2026, MOON_CALENDAR_2026 } from "@/app/lib/geodetic/weather-triggers";
import { ECLIPSES, LUNATIONS } from "@/app/lib/geodetic/geodetic-events";
import { WEATHER_TECHNIQUES } from "@/app/lib/geodetic/weather-techniques";
import { computeRealtimePositions } from "@/lib/astro/transits";

const DAY_MS = 86_400_000;

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

function angularDiff(a: number, b: number): number {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}

function parseZodiacDegree(value: string): number | null {
    const match = value.match(/(\d+(?:\.\d+)?)°\s*([♈♉♊♋♌♍♎♏♐♑♒♓])/);
    if (!match) return null;
    return SIGN_BASE[match[2]] + Number(match[1]);
}

function nearestCanonicalMoon(phase: (typeof MOON_CALENDAR_2026)[number]) {
    const expectedKind = phase.eclipse
        ? null
        : phase.type === "NM" ? "new-moon" : "full-moon";
    const pool = phase.eclipse
        ? ECLIPSES.filter((event) => event.kind === (phase.type === "NM" ? "solar" : "lunar"))
        : LUNATIONS.filter((event) => event.kind === expectedKind);
    const target = new Date(`${phase.date}T12:00:00Z`).getTime();
    return pool
        .map((event) => ({
            event,
            days: Math.abs(new Date(event.dateUtc).getTime() - target) / DAY_MS,
        }))
        .sort((a, b) => a.days - b.days)[0];
}

async function planetAtNoon(date: string, planet: string) {
    const positions = await computeRealtimePositions(new Date(`${date}T12:00:00Z`));
    const position = positions.find((p) => p.name === planet);
    if (!position) throw new Error(`Missing ${planet} at ${date}`);
    return position;
}

async function findStation(planet: string, startDate: string, endDate: string) {
    let previousTime = new Date(`${startDate}T00:00:00Z`).getTime();
    let previousSpeed = (await planetAtNoon(startDate, planet)).speed;
    const end = new Date(`${endDate}T00:00:00Z`).getTime();

    for (let time = previousTime + DAY_MS; time <= end; time += DAY_MS) {
        const current = await computeRealtimePositions(new Date(time));
        const position = current.find((p) => p.name === planet);
        if (!position) throw new Error(`Missing ${planet} while searching station`);

        if ((previousSpeed < 0) !== (position.speed < 0)) {
            let lo = previousTime;
            let hi = time;
            for (let i = 0; i < 20; i += 1) {
                const mid = (lo + hi) / 2;
                const midPosition = (await computeRealtimePositions(new Date(mid))).find((p) => p.name === planet);
                if (!midPosition) throw new Error(`Missing ${planet} during bisection`);
                if ((previousSpeed < 0) === (midPosition.speed < 0)) lo = mid;
                else hi = mid;
            }
            const stationTime = (lo + hi) / 2;
            const stationPosition = (await computeRealtimePositions(new Date(stationTime))).find((p) => p.name === planet);
            if (!stationPosition) throw new Error(`Missing ${planet} at station`);
            return { dateUtc: new Date(stationTime).toISOString(), position: stationPosition };
        }

        previousTime = time;
        previousSpeed = position.speed;
    }

    return null;
}

describe("geodetic source catalog ephemeris parity", () => {
    it("keeps 2026 moon trigger dates and degrees aligned with canonical lunation/eclipse tables", () => {
        const failures = MOON_CALENDAR_2026.flatMap((phase) => {
            const canonical = nearestCanonicalMoon(phase);
            const claimedDegree = parseZodiacDegree(phase.degree);
            if (!canonical || claimedDegree == null) {
                return [`${phase.date} ${phase.type}: no parseable canonical match for ${phase.degree}`];
            }
            const degreeOrb = angularDiff(claimedDegree, canonical.event.degree);
            if (canonical.days > 1.1 || degreeOrb > 1.25) {
                return [
                    `${phase.date} ${phase.type}: nearest canonical ${canonical.event.dateUtc} is ${canonical.days.toFixed(1)}d away / ${degreeOrb.toFixed(1)}° off`,
                ];
            }
            return [];
        });

        expect(failures).toEqual([]);
    });

    it("keeps Mars eclipse-degree trigger rows within scoring orb on their claimed dates", async () => {
        const failures: string[] = [];
        for (const trigger of HARD_ASPECTS_2026.filter((row) => row.type === "eclipse")) {
            const claimedDegree = parseZodiacDegree(trigger.degree);
            if (claimedDegree == null) {
                failures.push(`${trigger.date}: could not parse ${trigger.degree}`);
                continue;
            }
            const mars = await planetAtNoon(trigger.date, "Mars");
            const orb = angularDiff(mars.longitude, claimedDegree);
            if (orb > 2) {
                failures.push(`${trigger.date} ${trigger.bodies}: Mars is ${orb.toFixed(1)}° from ${trigger.degree}`);
            }
        }

        expect(failures).toEqual([]);
    });

    it("keeps key station dates aligned with SwissEph/NASA-derived speed reversals", async () => {
        const neptuneRx = WEATHER_TECHNIQUES.keyIngresses.find((row) => row.label === "Neptune Rx station");
        expect(neptuneRx).toBeDefined();

        const station = await findStation("Neptune", "2026-06-15", "2026-07-15");
        expect(station).not.toBeNull();

        const claimed = new Date(`${neptuneRx!.date}T12:00:00Z`).getTime();
        const actual = new Date(station!.dateUtc).getTime();
        const daysOff = Math.abs(actual - claimed) / DAY_MS;
        expect(daysOff).toBeLessThanOrEqual(2);
    });
});
