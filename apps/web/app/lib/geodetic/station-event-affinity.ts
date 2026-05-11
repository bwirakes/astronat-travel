/**
 * station-event-affinity.ts — Per-planet × per-event distribution for
 * geodetic station signals.
 *
 * Today's geodetic flow when a planet stations near your city's angle:
 *
 *   STATION_BASE (per-planet, signed)
 *     × directMult × timeFactor × orbFactor × angleStrength
 *     → severity (single number per contribution)
 *     → bucketGeodetic (single number per house, then 0-100)
 *     → macroScore (single number, headline ring)
 *
 * Per-event differentiation already exists via W_EVENTS — Saturn-on-MC routes
 * to H10, and W_EVENTS[Career][H10] is high so Career feels it. But that's
 * only the "house-of-landing" channel. The framework also says a planet has
 * an *intrinsic* significator weight independent of which house the station
 * hit. Saturn-on-IC (H4) today only nudges Home (W_EVENTS[Home][H4] = 1.0,
 * other events = 0). Astrologically, Saturn is also Career's natural
 * significator — so Saturn-station-anywhere should additionally nudge Career.
 *
 * This module is the second channel: a per-event vector multiplied by the
 * station severity, added directly to E_Final alongside skyModifier.
 *
 * Source: AstroNat geodetic planetary meanings —
 *   ☉ Sun:     vitality, leadership, government, public affairs
 *   ☽ Moon:    public sentiment, masses, weather, agriculture, coasts
 *   ☿ Mercury: communication, transport, commerce, information flow
 *   ♀ Venus:   economy, trade, diplomacy, harmony, values, resources
 *   ♂ Mars:    military, conflict, fire, accidents, urgency
 *   ♃ Jupiter: economic expansion, religion, law, international relations
 *   ♄ Saturn:  austerity, structure, collapse, restriction
 *   ♅ Uranus:  revolution, technology disruption, sudden events
 *   ♆ Neptune: floods, oil/gas, pandemics, deception, dissolution
 *   ♇ Pluto:   power shifts, mass transformation, underground, nuclear
 */
import type { StationContribution } from "./station-scoring";
import { LIFE_EVENTS, PLANETS } from "../planet-library";

/**
 * Per-planet × per-event affinity matrix. Rows match `PLANETS` array order
 * (sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto).
 * Columns match `LIFE_EVENTS` order (Identity, Wealth, Home, Romance, Health,
 * Partnerships, Career, Friends, Spirituality).
 *
 * Each cell decomposes as `valence × weight`:
 *   valence ∈ {−1, 0, +1}  — does the planet support, ignore, or impede this area?
 *   weight  ∈ {0, 0.3, 0.6, 1.0}  — none / minor / medium / strong
 *
 * Final contribution to E_Final[event] from one station:
 *   stationSeverity × STATION_EVENT_AFFINITY[planet][event] × SCALE
 *
 * Where stationSeverity is the per-station scalar from `scoreStations`
 * (already encodes time/orb/angle decay + flat-per-planet base sign), and
 * SCALE is a calibration knob to bound the per-event magnitude.
 */
export const STATION_EVENT_AFFINITY: number[][] = [
    //  Ident  Wealth  Home   Roman  Health Partn  Career Frnd   Spirit
    [   +1.0, +0.3,  +0.2,  +0.2,  +0.6,  +0.2,  +1.0,  +0.3,  +0.2 ], // sun
    [   +0.3, +0.3,  +1.0,  +0.6,  +0.6,  +0.3,  +0.3,  +0.3,  +0.6 ], // moon
    [   +0.6, +0.3,  +0.2,  +0.3,  +0.3,  +0.6,  +1.0,  +0.6,  +0.2 ], // mercury
    [   +0.3, +1.0,  +0.3,  +1.0,  +0.3,  +1.0,  +0.3,  +0.6,  +0.3 ], // venus
    [   +1.0, +0.0,  -0.6,  -0.6,  -0.3,  -0.6,  +0.3,  +0.3,  +0.0 ], // mars
    [   +0.6, +1.0,  +0.3,  +0.6,  +0.6,  +0.3,  +0.6,  +1.0,  +1.0 ], // jupiter
    [   -0.3, +0.3,  +0.3,  -0.6,  -0.6,  -0.3,  +1.0,  +0.0,  +0.6 ], // saturn
    [   +0.3, -0.3,  -0.6,  -0.6,  -0.3,  -0.6,  -0.3,  +1.0,  +0.3 ], // uranus
    [   -0.3, -0.6,  +0.3,  +0.3,  -0.6,  -0.3,  -0.3,  +0.3,  +1.0 ], // neptune
    [   +0.3, +0.6,  -0.3,  -0.6,  -0.3,  -0.6,  +0.3,  +0.0,  +0.6 ], // pluto
];

/**
 * Calibration scale on the per-event channel. Tunes the magnitude of the
 * station-event contribution so it doesn't overwhelm the existing
 * per-house→W_EVENTS channel (which already routes Saturn-on-MC into Career
 * via H10's 0.6 weight).
 *
 * Heuristic: a maxed-out Saturn station severity is ~−25. With affinity
 * +1.0 (Career), the raw product is −25. We want this to translate to
 * roughly a −2 to −5 hit on the Career E_Final score — comparable to a
 * single retrograde dampener via skyModifier. A SCALE of 0.15 gives:
 *   −25 × +1.0 × 0.15 = −3.75   (a clear but bounded Career signal)
 *   −25 × −0.6 × 0.15 = +2.25   (Romance lifts when Saturn structures the city)
 *
 * If the eval shows the new channel either too quiet or too loud, this
 * single number is the calibration knob. */
const SCALE = 0.15;

/**
 * Compute the station-event modifier vector for a list of station
 * contributions. Returns a 9-element vector aligned with LIFE_EVENTS.
 *
 * Each contribution adds `severity × affinity[planet][event] × SCALE` to
 * every event. Multiple stations stack additively.
 *
 * Sign convention:
 *   - Saturn (severity = −X) × +1.0 Career affinity → negative Career hit
 *     ("Saturn restricting the structure of work in this place")
 *   - Saturn (severity = −X) × −0.6 Romance affinity → positive Romance lift
 *     ("Saturn-on-angle eases up on relationship structure")
 *   - Jupiter (severity = +X) × +1.0 Wealth affinity → positive Wealth lift
 *     ("Jupiter expanding economy of the place")
 *   - Mars (severity = −X) × +1.0 Identity affinity → negative Identity hit
 *     ("Mars-on-angle: traveler's identity in friction with conflict zone")
 */
export function computeStationEventModifier(
    contributions: StationContribution[] | undefined,
): number[] {
    const mod = new Array(LIFE_EVENTS.length).fill(0);
    if (!contributions || contributions.length === 0) return mod;

    for (const c of contributions) {
        const pIdx = PLANETS.indexOf(c.planet.toLowerCase());
        if (pIdx === -1) continue;
        const affinityRow = STATION_EVENT_AFFINITY[pIdx];
        for (let e = 0; e < LIFE_EVENTS.length; e++) {
            mod[e] += c.severity * affinityRow[e] * SCALE;
        }
    }
    return mod;
}
