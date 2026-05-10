/**
 * universal-sky-rank.ts — pick the top sky events for the KPI panel and an
 * overall trip-vs-sky verdict tone.
 *
 * Pure function. Takes a UniversalSkyState plus the user's goalIds and
 * travel window, returns a ranked list of events ready for the §03 KPI
 * cards on PlaceFieldTab. The same ranker is consumed by:
 *   - the deterministic-templates path (Phase 1) — UI reads RankedEvent[]
 *     directly to render cards.
 *   - the AI prompt path (Phase 2) — ai-input-builder feeds RankedEvent[]
 *     as `topEvents` so the model has a curated, severity-sorted list to
 *     write copy for.
 *
 * Severity model mirrors scoring-engine's computeSkyModifier — that's the
 * function the math is anchored to, so a "high-severity" event in the UI
 * is the same one that's actually moving E_Final scores.
 */
import type {
    UniversalSkyState,
    SkyRetrograde,
    SkyRetrogradeWindow,
    SkyAspect,
    SkyNodeAspect,
    SkyIngress,
    DignityTier,
    ElementName,
    ModalityName,
    AspectKind,
} from "./universal-sky";

// ── Types ──────────────────────────────────────────────────────────────────

export type RankedEventKind =
    | "retrograde"          // currently retrograde at travelDate
    | "retrograde-upcoming" // station-Rx happens within the trip window
    | "eclipse"             // active solar/lunar eclipse window
    | "aspect"              // major outer-outer transiting aspect
    | "node-aspect"         // malefic hard aspect to lunar nodes
    | "ingress";            // sun/mercury/venus/mars sign change

export type ImpactBadge = "supportive" | "tense" | "neutral";

export interface RankedEvent {
    /** Stable identifier — matches UniversalSkySpan.key when the same event
     *  appears as a Gantt row. The KPI card and the Gantt row share copy. */
    key: string;
    kind: RankedEventKind;
    /** Astrology-accurate label. The UI replaces this with template/AI prose. */
    rawHeadline: string;
    /** Display range, e.g. "Jun 29 — Jul 23" or "active through Aug 26". */
    dateRange: string;
    /** 0–1 absolute severity. Higher = more prominent in the KPI panel. */
    severity: number;
    /** Whether this event hits/overlaps the trip's travel window. */
    duringTrip: boolean;
    /** Helpful structured detail templates and AI both use to write copy. */
    planet?: string;
    secondaryPlanet?: string;
    sign?: string;
    dignity?: DignityTier;
    aspectType?: AspectKind | "conjunction" | "square" | "opposition";
    nodeWhich?: "north" | "south";
    eclipseKind?: "solar" | "lunar";
    /** Pre-computed impact tone — drives the card pill colour and ordering. */
    impactBadge: ImpactBadge;
}

export type OverallSkyTone = "supportive" | "tense" | "mixed" | "quiet";

export interface SkyVerdict {
    tone: OverallSkyTone;
    /** Deterministic 4-8 word headline. AI may replace this with a goal-tied
     *  alternative; UI falls back to this when AI is missing. */
    headline: string;
    /** Sum of severities across all surfaced events, signed (negative when
     *  net-tense). Useful for UI debug overlays + AI prompt context. */
    netSignedSeverity: number;
}

// ── Severity model — mirrors scoring-engine's computeSkyModifier ──────────

const BASE_RX_WEIGHT: Record<string, number> = {
    sun: 8, moon: 6, mercury: 7, venus: 6, mars: 6,
    jupiter: 3, saturn: 3, uranus: 2, neptune: 2, pluto: 2,
};

const DIGNITY_MULT: Record<DignityTier, number> = {
    domicile: 0.4, exalted: 0.5, neutral: 1.0, detriment: 1.5, fall: 1.7,
};

const MODALITY_MULT: Record<ModalityName, number> = {
    cardinal: 1.0, fixed: 0.9, mutable: 1.2,
};

const PLANET_ELEMENT_AFFINITY: Record<string, { preferred: ElementName; clash: ElementName }> = {
    sun: { preferred: "fire", clash: "water" },
    moon: { preferred: "water", clash: "fire" },
    mercury: { preferred: "air", clash: "water" },
    venus: { preferred: "earth", clash: "fire" },
    mars: { preferred: "fire", clash: "water" },
    jupiter: { preferred: "fire", clash: "earth" },
    saturn: { preferred: "earth", clash: "fire" },
    uranus: { preferred: "air", clash: "water" },
    neptune: { preferred: "water", clash: "earth" },
    pluto: { preferred: "water", clash: "fire" },
};

function elementMult(planet: string, element: ElementName): number {
    const aff = PLANET_ELEMENT_AFFINITY[planet];
    if (!aff) return 1.0;
    if (aff.preferred === element) return 0.85;
    if (aff.clash === element) return 1.4;
    return 1.0;
}

function rxSeverity(r: { planet: string; dignity: DignityTier; modality: ModalityName; element: ElementName }): number {
    const base = BASE_RX_WEIGHT[r.planet] ?? 0;
    const raw = base * DIGNITY_MULT[r.dignity] * MODALITY_MULT[r.modality] * elementMult(r.planet, r.element);
    // Normalise to 0–1. Theoretical max is roughly 8 × 1.7 × 1.2 × 1.4 = ~22.
    // Clamp at 1.0 to prevent runaway scaling.
    return Math.min(1, raw / 22);
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MS_DAY = 86_400_000;

const ASPECT_BENEFIC_BY_TYPE: Record<string, ImpactBadge> = {
    conjunction: "neutral",
    sextile: "supportive",
    trine: "supportive",
    square: "tense",
    opposition: "tense",
};

function fmtMonthDay(iso: string): string {
    const t = new Date(`${iso}T12:00:00Z`).getTime();
    if (!isFinite(t)) return iso;
    return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtRange(entryISO: string, exitISO: string): string {
    if (entryISO === exitISO) return fmtMonthDay(entryISO);
    return `${fmtMonthDay(entryISO)} — ${fmtMonthDay(exitISO)}`;
}

function overlapsTripWindow(
    entryISO: string,
    exitISO: string,
    travelStartISO: string,
    travelEndISO: string,
): boolean {
    const a1 = new Date(entryISO).getTime();
    const a2 = new Date(exitISO).getTime();
    const b1 = new Date(travelStartISO).getTime();
    const b2 = new Date(travelEndISO).getTime();
    if (![a1, a2, b1, b2].every(isFinite)) return false;
    return Math.max(a1, b1) <= Math.min(a2, b2);
}

// ── Main ranker ────────────────────────────────────────────────────────────

export interface RankSkyEventsArgs {
    sky: UniversalSkyState;
    /** ISO start of the trip window. For relocations, this is the move date. */
    travelStartISO: string;
    /** ISO end of the trip window. For relocations, travelStart + 365d. */
    travelEndISO: string;
    /** Cap on the number of cards rendered. Loaded skies (Oct 2026) get 4;
     *  quiet skies surface fewer. Default 4 — what the §03 panel can fit. */
    maxCards?: number;
}

export function rankSkyEvents(args: RankSkyEventsArgs): RankedEvent[] {
    const { sky, travelStartISO, travelEndISO } = args;
    const maxCards = args.maxCards ?? 4;
    const candidates: RankedEvent[] = [];

    // (1) Currently retrograde at refDate.
    for (const r of sky.retrogrades) {
        const matchingWindow = sky.retrogradeWindows.find(
            (w) => w.planet === r.planet && w.isOngoingAtRef,
        );
        const entryISO = matchingWindow?.entryISO ?? sky.refDateISO;
        const exitISO = matchingWindow?.exitISO ?? sky.refDateISO;
        const sev = rxSeverity(r);
        candidates.push({
            key: matchingWindow ? `retrograde-${r.planet}-${matchingWindow.midISO}` : `retrograde-${r.planet}-${sky.refDateISO}`,
            kind: "retrograde",
            rawHeadline: `${capPlanet(r.planet)} retrograde in ${r.sign}`,
            dateRange: matchingWindow
                ? `${fmtMonthDay(entryISO)} — ${fmtMonthDay(exitISO)}`
                : "ongoing",
            severity: sev,
            duringTrip: overlapsTripWindow(entryISO, exitISO, travelStartISO, travelEndISO),
            planet: r.planet,
            sign: r.sign,
            dignity: r.dignity,
            impactBadge: "tense",
        });
    }

    // (2) Upcoming retrograde windows that don't overlap the current Rx state.
    //     (If Pluto is already Rx now AND there's a "retrograde window" for
    //     Pluto in the data with isOngoingAtRef === true, we already added
    //     it above — skip.)
    for (const w of sky.retrogradeWindows) {
        if (w.isOngoingAtRef) continue;
        // Synthesize a SkyRetrograde-like shape for severity scoring.
        const synth = {
            planet: w.planet,
            dignity: w.dignity,
            // Fall back to neutral when modality/element aren't on the window
            // (the daily-scan stations only carry the entry sign + dignity).
            modality: "mutable" as ModalityName,
            element: "earth" as ElementName,
        };
        const sev = rxSeverity(synth) * 0.85; // slight discount — not yet active
        candidates.push({
            key: `retrograde-${w.planet}-${w.midISO}`,
            kind: "retrograde-upcoming",
            rawHeadline: `${capPlanet(w.planet)} retrograde in ${w.sign}`,
            dateRange: fmtRange(w.entryISO, w.exitISO),
            severity: sev,
            duringTrip: overlapsTripWindow(w.entryISO, w.exitISO, travelStartISO, travelEndISO),
            planet: w.planet,
            sign: w.sign,
            dignity: w.dignity,
            impactBadge: "tense",
        });
    }

    // (3) Active eclipse windows. Solar more weighty than lunar.
    if (sky.eclipses.inSolarWindow) {
        const next = sky.eclipses.nextEvents.find((e) => e.kind === "solar");
        const dateRange = next ? `peaks ${fmtMonthDay(next.dateISO)}` : "active";
        candidates.push({
            key: next ? `eclipse-solar-${next.dateISO}` : `eclipse-solar-${sky.refDateISO}`,
            kind: "eclipse",
            rawHeadline: next ? `Solar eclipse in ${next.sign}` : "Solar eclipse window",
            dateRange,
            severity: 0.9,
            duringTrip: true, // window is wide; assume overlap
            eclipseKind: "solar",
            sign: next?.sign,
            impactBadge: "tense",
        });
    }
    if (sky.eclipses.inLunarWindow) {
        const next = sky.eclipses.nextEvents.find((e) => e.kind === "lunar");
        const dateRange = next ? `peaks ${fmtMonthDay(next.dateISO)}` : "active";
        candidates.push({
            key: next ? `eclipse-lunar-${next.dateISO}` : `eclipse-lunar-${sky.refDateISO}`,
            kind: "eclipse",
            rawHeadline: next ? `Lunar eclipse in ${next.sign}` : "Lunar eclipse window",
            dateRange,
            severity: 0.6,
            duringTrip: true,
            eclipseKind: "lunar",
            sign: next?.sign,
            impactBadge: "tense",
        });
    }

    // (4) Major transit-to-transit aspects (outer–outer + Mars/Jupiter).
    for (const a of sky.aspects) {
        if (a.type === "conjunction") continue; // ambiguous tone
        // Tighter orbs → higher severity. Linear taper from full → 0 at 6° orb.
        const tightness = Math.max(0, 1 - a.orb / 6);
        const sev = 0.4 * tightness;
        candidates.push({
            key: `aspect-${a.p1}-${a.p2}-${a.type}`,
            kind: "aspect",
            rawHeadline: `${capPlanet(a.p1)} ${a.type} ${capPlanet(a.p2)}`,
            dateRange: "throughout your trip",
            severity: sev,
            duringTrip: true,
            planet: a.p1,
            secondaryPlanet: a.p2,
            aspectType: a.type,
            impactBadge: ASPECT_BENEFIC_BY_TYPE[a.type] ?? "neutral",
        });
    }

    // (5) Malefic hard aspects to nodes.
    for (const n of sky.nodeAspects) {
        if (!n.isMalefic) continue;
        const tightness = Math.max(0, 1 - n.orb / 3);
        candidates.push({
            key: `node-aspect-${n.planet}-${n.node}-${n.type}`,
            kind: "node-aspect",
            rawHeadline: `${capPlanet(n.planet)} ${n.type} ${n.node === "north" ? "north node" : "south node"}`,
            dateRange: "active",
            severity: 0.5 * tightness,
            duringTrip: true,
            planet: n.planet,
            nodeWhich: n.node,
            aspectType: n.type,
            impactBadge: "tense",
        });
    }

    // (6) Sun/Mercury/Venus/Mars ingresses — meaningful pace shifts.
    //     Slow-planet ingresses (Saturn/Uranus/etc.) are rare enough that
    //     when present they merit attention; include them too.
    for (const ing of sky.ingresses) {
        const isFast = ["sun", "mercury", "venus", "mars"].includes(ing.planet);
        const isSlow = ["jupiter", "saturn", "uranus", "neptune", "pluto"].includes(ing.planet);
        // Skip moon (changes signs every 2.5 days; pure noise)
        if (!isFast && !isSlow) continue;
        const sev = isSlow ? 0.55 : 0.3;
        const sevDuringTrip = sev * (overlapsTripWindow(ing.dateISO, ing.dateISO, travelStartISO, travelEndISO) ? 1.0 : 0.5);
        candidates.push({
            key: `ingress-${ing.planet}-${ing.dateISO}`,
            kind: "ingress",
            rawHeadline: `${capPlanet(ing.planet)} enters ${ing.toSign}`,
            dateRange: fmtMonthDay(ing.dateISO),
            severity: sevDuringTrip,
            duringTrip: overlapsTripWindow(ing.dateISO, ing.dateISO, travelStartISO, travelEndISO),
            planet: ing.planet,
            sign: ing.toSign,
            impactBadge: "neutral",
        });
    }

    // Bias: events that overlap the trip window get a boost so they're
    // surfaced ahead of equally-severe events that fall outside it.
    for (const c of candidates) {
        if (c.duringTrip) c.severity = Math.min(1, c.severity * 1.3);
    }

    candidates.sort((a, b) => b.severity - a.severity);
    return candidates.slice(0, maxCards);
}

// ── Verdict derivation ────────────────────────────────────────────────────

export function deriveSkyVerdict(events: RankedEvent[]): SkyVerdict {
    if (events.length === 0) {
        return { tone: "quiet", headline: "Sky is quiet — your move", netSignedSeverity: 0 };
    }

    let signed = 0;
    let supportiveCount = 0;
    let tenseCount = 0;
    for (const e of events) {
        if (e.impactBadge === "supportive") {
            signed += e.severity;
            supportiveCount++;
        } else if (e.impactBadge === "tense") {
            signed -= e.severity;
            tenseCount++;
        }
    }

    let tone: OverallSkyTone;
    let headline: string;
    if (Math.abs(signed) < 0.3) {
        tone = "mixed";
        headline = "Mixed sky — pick your moments";
    } else if (signed >= 0.3) {
        tone = "supportive";
        headline = "Tailwind window — open the door";
    } else {
        tone = "tense";
        headline = "Pressure window — slow before you sign";
    }

    return { tone, headline, netSignedSeverity: signed };
}

// ── Tiny helpers ──────────────────────────────────────────────────────────

function capPlanet(p: string): string {
    if (!p) return p;
    return p[0].toUpperCase() + p.slice(1);
}

// Re-export for downstream consumers (templates module + UI).
export type {
    UniversalSkyState,
    SkyRetrograde,
    SkyRetrogradeWindow,
    SkyAspect,
    SkyNodeAspect,
    SkyIngress,
    DignityTier,
    ElementName,
    ModalityName,
};
