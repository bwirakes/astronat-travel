/**
 * fixed-stars.ts — Key fixed stars used by Layer 7 (Late Degrees).
 * Tropical ecliptic longitudes at epoch J2000 (rounded). Precession
 * ~50.3"/year = ~0.3° drift over 20 years — inside the ≥1° orb tolerance
 * used by Layer 7 scoring.
 */

export interface FixedStar {
    name: string;
    longitude: number;
    nature: "malefic" | "benefic" | "neutral";
    flavor: "violence" | "flood" | "fire" | "volatility"
          | "water" | "royal" | "fortune" | "heat" | "wind";
}

export const FIXED_STARS: FixedStar[] = [
    { name: "Algol",     longitude:  56.30, nature: "malefic", flavor: "violence"    },
    { name: "Aldebaran", longitude:  70.08, nature: "malefic", flavor: "volatility"  },
    { name: "Capella",   longitude:  82.10, nature: "neutral", flavor: "wind"        },
    { name: "Sirius",    longitude: 104.43, nature: "neutral", flavor: "heat"        },
    { name: "Regulus",   longitude: 150.15, nature: "neutral", flavor: "royal"       },
    { name: "Spica",     longitude: 204.08, nature: "benefic", flavor: "fortune"     },
    { name: "Arcturus",  longitude: 204.50, nature: "benefic", flavor: "fortune"     },
    { name: "Antares",   longitude: 249.92, nature: "malefic", flavor: "fire"        },
    { name: "Vega",      longitude: 285.87, nature: "benefic", flavor: "fortune"     },
    { name: "Fomalhaut", longitude: 334.00, nature: "neutral", flavor: "water"       },
    { name: "Scheat",    longitude: 359.58, nature: "malefic", flavor: "flood"       },
];

function angularDiff(a: number, b: number): number {
    let d = Math.abs(a - b) % 360;
    if (d > 180) d = 360 - d;
    return d;
}

export function findNearestStar(
    lon: number,
    maxOrbDeg: number = 1.5,
): { star: FixedStar; orb: number } | null {
    let best: { star: FixedStar; orb: number } | null = null;
    for (const s of FIXED_STARS) {
        const orb = angularDiff(lon, s.longitude);
        if (orb <= maxOrbDeg && (!best || orb < best.orb)) {
            best = { star: s, orb };
        }
    }
    return best;
}
