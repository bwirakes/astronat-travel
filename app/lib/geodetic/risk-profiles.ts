/**
 * Risk-profile lookup — translates a computed geodetic event into a ranked
 * physical-world risk profile. Encodes the master table from
 * `Geodetic_Weather_Patterns.pdf` p.2 as typed data so the mundane reading
 * can render deterministic risk bars without any AI help.
 *
 * The PDF lists, per planetary signature, the correlated event types:
 *   Mercury lines (fault zones) → earthquake swarms, tremors
 *   Sun activation (fire/water signs, cardinal) → solar radiation / volcanic
 *   Mars lines (fire, cardinal) → eruptions, fires, explosive storms
 *   Jupiter in water signs, IC → floods, cyclones
 *   Neptune lines (water, mutable) → mega-storms, maritime disasters
 *   Saturn + Neptune → pressure + oceanic instability
 *   Uranus activation (air, fixed/cardinal) → earthquakes, lightning
 *   Pluto + Mars (fire, fixed) → major eruptions, tectonic events
 *   Nodal axis (cardinal) → widespread extreme weather
 *
 * Values are 0–5 severity rankings (0 = no signal, 5 = dominant signature).
 */

export type RiskChannel =
    | "seismic" | "hydro" | "atmospheric" | "civil" | "fire"
    // Socioeconomic axes (audit gap fill): physical-risk channels don't
    // capture Sun's political/capital meaning or Jupiter's financial/
    // religious meaning. Same 0-5 scale, separate semantics.
    | "political" | "financial" | "religious";

export interface RiskProfile {
    seismic: number;
    hydro: number;
    atmospheric: number;
    civil: number;
    fire: number;
    political: number;
    financial: number;
    religious: number;
}

export const ZERO_PROFILE: RiskProfile = {
    seismic: 0,
    hydro: 0,
    atmospheric: 0,
    civil: 0,
    fire: 0,
    political: 0,
    financial: 0,
    religious: 0,
};

const PLANET_BASE: Record<string, Partial<RiskProfile>> = {
    Mercury: { atmospheric: 3, seismic: 2 },
    // Sun: capitals, royal cities, political centres
    Sun: { fire: 2, seismic: 1, political: 4, financial: 1 },
    Mars: { fire: 4, civil: 3, seismic: 2, political: 1 },
    // Jupiter: financial centres, religious sites, embassies
    Jupiter: { hydro: 3, atmospheric: 1, financial: 4, religious: 3, political: 1 },
    Venus: { hydro: 1 },
    Saturn: { seismic: 2, atmospheric: 2, political: 2 },
    Uranus: { atmospheric: 4, seismic: 3, political: 2 },
    Neptune: { hydro: 4, atmospheric: 2, religious: 3 },
    // Pluto: power capitals, mining regions, nuclear sites
    Pluto: { seismic: 4, civil: 2, political: 3 },
    Moon: { hydro: 2 },
    NorthNode: { civil: 2, atmospheric: 2 },
    SouthNode: { civil: 2, atmospheric: 2 },
};

const LAYER_MULT: Record<string, number> = {
    "angle-transit": 1.0,
    paran: 0.9,
    station: 1.2,
    eclipse: 1.4,
    "world-point": 1.1,
    "late-degree": 1.1,
    configuration: 1.2,
    ingress: 0.8,
    "severity-modifier": 0.7,
};

function add(dst: RiskProfile, src: Partial<RiskProfile>, mult: number): RiskProfile {
    return {
        seismic: dst.seismic + (src.seismic ?? 0) * mult,
        hydro: dst.hydro + (src.hydro ?? 0) * mult,
        atmospheric: dst.atmospheric + (src.atmospheric ?? 0) * mult,
        civil: dst.civil + (src.civil ?? 0) * mult,
        fire: dst.fire + (src.fire ?? 0) * mult,
        political: dst.political + (src.political ?? 0) * mult,
        financial: dst.financial + (src.financial ?? 0) * mult,
        religious: dst.religious + (src.religious ?? 0) * mult,
    };
}

function clamp5(profile: RiskProfile): RiskProfile {
    const c = (n: number) => Math.max(0, Math.min(5, Math.round(n)));
    return {
        seismic: c(profile.seismic),
        hydro: c(profile.hydro),
        atmospheric: c(profile.atmospheric),
        civil: c(profile.civil),
        fire: c(profile.fire),
        political: c(profile.political),
        financial: c(profile.financial),
        religious: c(profile.religious),
    };
}

/**
 * Compute the risk profile for a single active event.
 * Pure function. No AI. Entirely rule-driven from the PDF matrix.
 */
export function riskProfileFor(event: {
    layer: string;
    planets: string[];
    direction?: string;
}): RiskProfile {
    let profile: RiskProfile = { ...ZERO_PROFILE };
    const mult = LAYER_MULT[event.layer] ?? 1;
    for (const p of event.planets) {
        const base = PLANET_BASE[p];
        if (base) profile = add(profile, base, mult);
    }
    // Maleficness boosts civil + fire slightly (mundane tension vs harmony).
    if (event.direction === "malefic") {
        profile = add(profile, { civil: 1, fire: 0.5 }, 1);
    }
    return clamp5(profile);
}

/**
 * Aggregate the risk profile across all active events in a window.
 * Returns the max per channel (worst-case) rather than sum, so one big
 * event isn't washed out by many small ones.
 */
export function aggregateRisk(events: Array<{ layer: string; planets: string[]; direction?: string }>): RiskProfile {
    let agg: RiskProfile = { ...ZERO_PROFILE };
    for (const e of events) {
        const p = riskProfileFor(e);
        agg = {
            seismic: Math.max(agg.seismic, p.seismic),
            hydro: Math.max(agg.hydro, p.hydro),
            atmospheric: Math.max(agg.atmospheric, p.atmospheric),
            civil: Math.max(agg.civil, p.civil),
            fire: Math.max(agg.fire, p.fire),
            political: Math.max(agg.political, p.political),
            financial: Math.max(agg.financial, p.financial),
            religious: Math.max(agg.religious, p.religious),
        };
    }
    return agg;
}

export const RISK_LABELS: Record<RiskChannel, string> = {
    seismic: "Seismic / tectonic",
    hydro: "Flood / storm",
    atmospheric: "Atmospheric disruption",
    civil: "Civil / public tension",
    fire: "Fire / heat",
    political: "Political / capital",
    financial: "Financial centre",
    religious: "Religious / spiritual",
};

export const RISK_GLOSS: Record<RiskChannel, string> = {
    seismic: "Ground shifts, tectonic pressure, structural stress.",
    hydro: "Water-resonant — cyclones, floods, heavy rain, maritime events.",
    atmospheric: "Wind shear, magnetic flips, lightning, fronts.",
    civil: "Public tension, configurations on angles, Mars-world-point contacts.",
    fire: "Ignition signatures — wildfire risk, volcanic, explosive.",
    political: "Capitals, government seats, royal cities, public-affairs nexus.",
    financial: "Financial centres, trade hubs, embassies, law and commerce.",
    religious: "Sacred sites, contemplative places, devotional and spiritual zones.",
};
