/**
 * Geodetic planetary meanings — the per-planet narrative theme + city
 * archetype lookup from the Geodetic 101 framework.
 *
 * Each entry has three slices the reading copy can surface:
 *   - theme:         one-line core archetype ("vitality, leadership")
 *   - shadow:        when the placement strains ("austerity, restriction")
 *   - cityArchetypes: example real-world places that resonate with that
 *                     planetary energy ("capitals, royal cities")
 *
 * Used by:
 *   1. The LLM teacher-reading prompt — gives the model deterministic
 *      grounding strings so its narrative copy doesn't drift.
 *   2. WhatShiftsTab and seasonal-trigger surfaces — render a small
 *      "Saturn here = austerity, structure" caption next to scored hits.
 *
 * Keep this short, voice-of-the-product, no astrology jargon. Each string
 * must read like a beginner would write it — the audit prefers that
 * readers see "structure, restriction" over "Cronus, the binder."
 */

export interface GeodeticPlanetMeaning {
    /** Core positive expression. */
    theme: string;
    /** Strained / shadow expression. */
    shadow: string;
    /** Three-to-five real-world city archetypes. */
    cityArchetypes: string[];
}

const PLANET_MEANINGS_RAW: Record<string, GeodeticPlanetMeaning> = {
    Sun: {
        theme: "vitality, leadership, public visibility",
        shadow: "ego, performance pressure, burnout",
        cityArchetypes: ["capitals", "royal cities", "political centres", "stadiums"],
    },
    Moon: {
        theme: "public sentiment, comfort, rhythm, the everyday",
        shadow: "moodiness, dependency, restlessness",
        cityArchetypes: ["coastal regions", "rivers", "agricultural zones", "neighbourhoods"],
    },
    Mercury: {
        theme: "messages, commerce, learning, movement",
        shadow: "rumour, miscommunication, scattered focus",
        cityArchetypes: ["transit hubs", "media centres", "universities", "fault zones"],
    },
    Venus: {
        theme: "ease, beauty, money, belonging",
        shadow: "indulgence, vanity, smoothing over conflict",
        cityArchetypes: ["resort cities", "art capitals", "wine regions", "diplomatic seats"],
    },
    Mars: {
        theme: "action, courage, urgency, momentum",
        shadow: "conflict, accidents, fire, friction",
        cityArchetypes: ["borders", "military sites", "contested territories", "industrial corridors"],
    },
    Jupiter: {
        theme: "expansion, opportunity, law, faith",
        shadow: "overreach, righteousness, complacency",
        cityArchetypes: ["financial centres", "religious sites", "embassies", "publishing capitals"],
    },
    Saturn: {
        theme: "structure, mastery, discipline, the long arc",
        shadow: "austerity, restriction, isolation, collapse",
        cityArchetypes: ["old cities", "fault lines", "government institutions", "monasteries"],
    },
    Uranus: {
        theme: "innovation, awakening, sudden breakthroughs",
        shadow: "disruption, instability, sudden events, earthquakes",
        cityArchetypes: ["tech hubs", "protest-prone cities", "seismic zones", "research clusters"],
    },
    Neptune: {
        theme: "imagination, devotion, art, retreat",
        shadow: "dissolution, deception, fog, addictions",
        cityArchetypes: ["coastal cities", "oil regions", "spiritual sites", "film capitals"],
    },
    Pluto: {
        theme: "depth, transformation, hidden power",
        shadow: "power shifts, mass transformation, underground events, nuclear",
        cityArchetypes: ["power capitals", "mining regions", "nuclear sites", "underworlds"],
    },
};

const ALIASES: Record<string, string> = {
    sun: "Sun",
    moon: "Moon",
    mercury: "Mercury",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
    uranus: "Uranus",
    neptune: "Neptune",
    pluto: "Pluto",
};

/** Case-insensitive lookup. Returns undefined for non-classical bodies
 *  (nodes, asteroids, lots) so callers can decide how to handle them. */
export function geodeticPlanetMeaning(planet: string): GeodeticPlanetMeaning | undefined {
    const key = ALIASES[planet.toLowerCase()];
    return key ? PLANET_MEANINGS_RAW[key] : undefined;
}

/** All ten classical-through-Pluto entries, in canonical order. Used to
 *  render the planet-meaning grid in design surfaces. */
export const GEODETIC_PLANET_MEANINGS: ReadonlyArray<{ planet: string } & GeodeticPlanetMeaning> = [
    "Sun", "Moon", "Mercury", "Venus", "Mars",
    "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
].map((planet) => ({ planet, ...PLANET_MEANINGS_RAW[planet] }));

/** Compact one-liner for in-flow narrative use. */
export function geodeticPlanetThemeOneLiner(planet: string): string | undefined {
    const m = geodeticPlanetMeaning(planet);
    if (!m) return undefined;
    return `${planet} here · ${m.theme}`;
}
