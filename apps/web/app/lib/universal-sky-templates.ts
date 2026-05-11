/**
 * universal-sky-templates.ts — deterministic plain-English copy for sky
 * events. Used as the Phase 1 baseline (no AI dependency) and as the
 * fallback when AI-authored copy is missing or invalid.
 *
 * The split between rank.ts and templates.ts:
 *   - rank.ts decides WHICH events to surface and HOW they impact the trip.
 *   - templates.ts decides WHAT to say about each event in plain English.
 *
 * Voice rules (mirrors what the AI prompt will enforce in Phase 2):
 *   - No astrology jargon. Never write "Rx", dignity tier names, orbs in
 *     degrees, modality names, element names, or "domicile/exalted/peregrine".
 *   - Verb-led titles: "Mercury reverses in Cancer", not "Mercury Rx Cancer".
 *   - Goal-tied action prefixed with the goal label and a colon.
 *
 * Astro→English translations:
 *   retrograde → "reverses" / "slows" / "loops back through"
 *   ingress    → "moves into"
 *   sextile    → "supports"
 *   square     → "presses on"
 *   trine      → "aligns with"
 *   opposition → "stretches across from"
 *   conjunction → "joins"
 */
import type { RankedEvent, ImpactBadge } from "./universal-sky-rank";
import { GOAL_DEFINITIONS, type GoalId } from "./reading-tabs";

export interface TemplatedCard {
    /** 4-8 plain-English words. Subject-verb-object. */
    title: string;
    /** 1-2 short sentences in lay language describing what's happening. */
    plainBody: string;
    /** Goal-tied advice. Prefixed "Romance:", "Career:", etc. when goal is set. */
    goalAction: string;
    /** Carried through to the UI's pill colour. */
    impactBadge: ImpactBadge;
}

export interface TemplatedSpanCopy {
    /** 3-5 plain-English words. */
    title: string;
    /** ≤12 word lived takeaway. */
    body: string;
}

// ── Plain-English titles by event kind ────────────────────────────────────

function planetCap(p?: string): string {
    if (!p) return "";
    return p[0].toUpperCase() + p.slice(1);
}

function eventTitle(e: RankedEvent): string {
    switch (e.kind) {
        case "retrograde":
        case "retrograde-upcoming":
            // Mutable-sign mercurial planets feel "edited"; saturn/pluto feel
            // structural. Keep the verb soft for inner planets, firmer for outers.
            if (e.planet === "mercury" || e.planet === "venus") {
                return `${planetCap(e.planet)} reverses${e.sign ? ` in ${e.sign}` : ""}`;
            }
            if (e.planet === "mars") {
                return `Mars stalls${e.sign ? ` in ${e.sign}` : ""}`;
            }
            if (e.planet === "saturn" || e.planet === "pluto") {
                return `${planetCap(e.planet)} loops back${e.sign ? ` through ${e.sign}` : ""}`;
            }
            return `${planetCap(e.planet)} slows${e.sign ? ` in ${e.sign}` : ""}`;
        case "eclipse":
            if (e.eclipseKind === "solar") {
                return e.sign ? `Solar eclipse in ${e.sign}` : "Solar eclipse window";
            }
            return e.sign ? `Lunar eclipse in ${e.sign}` : "Lunar eclipse window";
        case "aspect": {
            const verb = aspectVerb(e.aspectType);
            return `${planetCap(e.planet)} ${verb} ${planetCap(e.secondaryPlanet)}`;
        }
        case "node-aspect": {
            const verb = aspectVerb(e.aspectType);
            const node = e.nodeWhich === "north" ? "north node" : "south node";
            return `${planetCap(e.planet)} ${verb} ${node}`;
        }
        case "ingress":
            return `${planetCap(e.planet)} moves into ${e.sign}`;
    }
}

function aspectVerb(t: RankedEvent["aspectType"]): string {
    switch (t) {
        case "trine":      return "aligns with";
        case "sextile":    return "supports";
        case "square":     return "presses on";
        case "opposition": return "stretches across from";
        case "conjunction":return "joins";
        default:           return "meets";
    }
}

// ── Body sentences keyed by (kind, planet) ────────────────────────────────

interface BodyTemplate {
    /** Sentence 1: what this event is, lay terms. */
    primary: string;
    /** Sentence 2 (optional): widen the consequence. */
    secondary?: string;
}

const RETROGRADE_BODIES: Record<string, BodyTemplate> = {
    sun: {
        primary: "A rare ego retreat — visibility softens for a few weeks.",
        secondary: "Lower the volume on launches; come back stronger.",
    },
    moon: {
        primary: "Emotional currents move slower than usual.",
        secondary: "Let plans settle before naming what you feel.",
    },
    mercury: {
        primary: "Plans get edited mid-flight. Confirmations, bookings, and conversations want a second pass.",
        secondary: "Slow communication wins this window.",
    },
    venus: {
        primary: "Old connections circle back — and old aesthetic instincts get reviewed.",
        secondary: "It's a re-visit, not a fresh start.",
    },
    mars: {
        primary: "Energy turns inward. Pushing harder costs more than usual.",
        secondary: "Conserve fuel; pick fewer fights.",
    },
    jupiter: {
        primary: "Growth slows from outward expansion to inward review.",
        secondary: "Expect rethinks of last year's bets.",
    },
    saturn: {
        primary: "Commitments get tested. Structures want their second draft.",
        secondary: "Honest accounting beats forward motion.",
    },
    uranus: {
        primary: "Disruption goes underground. Quiet shifts in identity and freedom.",
        secondary: "What's been unconventional gets re-examined privately.",
    },
    neptune: {
        primary: "Fog lifts in places, thickens in others. Old illusions get audited.",
        secondary: "Don't trust every flash of clarity.",
    },
    pluto: {
        primary: "Power dynamics revisit themselves. What was buried surfaces.",
        secondary: "Resist the urge to redo what's already done.",
    },
};

const ECLIPSE_BODIES: Record<"solar" | "lunar", BodyTemplate> = {
    solar: {
        primary: "Big public-life reset. New chapters force themselves open whether you're ready or not.",
        secondary: "Skip launches inside the window; let the dust settle.",
    },
    lunar: {
        primary: "Emotional and relational reckoning. Hidden things come to light.",
        secondary: "Listen before reacting.",
    },
};

const NODE_ASPECT_BODIES: Record<string, BodyTemplate> = {
    "mars-square":  { primary: "Old patterns push back hard. Fate-flavoured friction in the background." },
    "saturn-square":{ primary: "A structural pinch on long-term direction." },
    "pluto-square": { primary: "Power undertow on the karmic axis. Don't engineer outcomes." },
    "default":      { primary: "Fated friction in the background. Don't fight it head-on." },
};

const INGRESS_BODIES: Record<string, BodyTemplate> = {
    sun:     { primary: "The season changes. Public mood shifts." },
    mercury: { primary: "The conversation reframes. Topics rotate." },
    venus:   { primary: "The flavour of connection shifts. New social colour." },
    mars:    { primary: "The drive reorients. Fresh courage in a new register." },
    jupiter: { primary: "A multi-year arc opens. Watch for new doors." },
    saturn:  { primary: "Long-term structures find a new shape." },
    uranus:  { primary: "A multi-year disruption arc rotates." },
    neptune: { primary: "A multi-year dream chapter shifts." },
    pluto:   { primary: "A generational power chapter rotates." },
};

const ASPECT_BODIES: Record<string, BodyTemplate> = {
    "trine":      { primary: "Quiet structural alignment in the background. Not loud, but durable." },
    "sextile":    { primary: "Soft tailwind in the slow-moving sky. Open doors, low cost." },
    "square":     { primary: "Long-running tension in the slow-moving sky. Friction shows up indirectly." },
    "opposition": { primary: "Two big forces pulling in opposite directions. Hold the middle." },
};

// ── Goal-tied actions ─────────────────────────────────────────────────────

/** Map a (kind, primaryGoal) pair to a one-sentence action prefixed with the
 *  goal label. Primary goal is the FIRST goalId from the user's reading.
 *  Falls back to a generic action when the goal isn't in our lookup. */
function goalAction(event: RankedEvent, primaryGoalId: string | undefined): string {
    if (!primaryGoalId) {
        return genericAction(event);
    }
    const def = GOAL_DEFINITIONS[primaryGoalId as GoalId];
    if (!def) return genericAction(event);
    const label = def.label;

    // Tightly-targeted pairs first.
    if (event.kind === "retrograde" || event.kind === "retrograde-upcoming") {
        if (event.planet === "mercury") {
            if (label === "Romance") return `Romance: text plans before you sign, not after.`;
            if (label === "Career")  return `Career: keep launches on the calendar; hold the press release.`;
            if (label === "Wealth")  return `Wealth: reread contracts before counter-signing.`;
            if (label === "Health")  return `Health: revisit routines that worked, don't start new ones.`;
            if (label === "Partnerships") return `Partnerships: clarify expectations before commitments.`;
            if (label === "Friendship") return `Friendship: catch up with old connections, not new ones.`;
            if (label === "Identity") return `Identity: edit the bio; don't rebrand.`;
            if (label === "Spirituality") return `Spirituality: revisit a practice that lapsed.`;
            if (label === "Home")    return `Home: review leases and listings; don't sign yet.`;
        }
        if (event.planet === "venus") {
            if (label === "Romance") return `Romance: old flames may circle back. Pause before reigniting.`;
            if (label === "Wealth")  return `Wealth: review what you actually value spending on.`;
            if (label === "Career")  return `Career: review your portfolio, not your pitch.`;
        }
        if (event.planet === "mars") {
            if (label === "Career")  return `Career: hold pushes; let projects breathe.`;
            if (label === "Health")  return `Health: down-shift intensity; recovery over PRs.`;
        }
        if (event.planet === "saturn") {
            if (label === "Career")  return `Career: audit responsibilities; don't add weight.`;
            if (label === "Partnerships") return `Partnerships: name the contract honestly, even if uncomfortable.`;
        }
    }

    if (event.kind === "eclipse") {
        if (label === "Career")        return `Career: skip big launches inside the window.`;
        if (label === "Romance")       return `Romance: keep stakes low for two weeks either side.`;
        if (label === "Partnerships")  return `Partnerships: don't formalize anything during the window.`;
        if (label === "Identity")      return `Identity: let the new self emerge — don't force it.`;
    }

    if (event.kind === "ingress") {
        if (event.planet === "venus" && label === "Romance") return `Romance: try the new flavour the sign suggests.`;
        if (event.planet === "mars"  && label === "Career")  return `Career: reorient your push; the energy has rotated.`;
        if (event.planet === "mercury" && label === "Career") return `Career: shift the topic of your communication to match.`;
    }

    if (event.kind === "aspect") {
        if (event.impactBadge === "supportive") return `${label}: take quiet structural moves.`;
        if (event.impactBadge === "tense")      return `${label}: expect indirect friction. Patience pays.`;
    }

    if (event.kind === "node-aspect") {
        return `${label}: don't force the karmic timeline.`;
    }

    return `${label}: ${def.action}.`;
}

function genericAction(event: RankedEvent): string {
    if (event.kind === "retrograde" || event.kind === "retrograde-upcoming") {
        if (event.planet === "mercury") return "Reread, rebook, and double-check the details.";
        if (event.planet === "venus")   return "Old patterns visit before they leave for good.";
        if (event.planet === "mars")    return "Conserve energy. Push less, choose better.";
        return "Review before you advance.";
    }
    if (event.kind === "eclipse") return "Let the dust settle; don't launch.";
    if (event.kind === "ingress") return "A new chapter opens — meet it lightly.";
    if (event.kind === "aspect") {
        return event.impactBadge === "supportive"
            ? "Move with the tailwind."
            : "Keep edges soft.";
    }
    return "Take it slow.";
}

// ── Public API ────────────────────────────────────────────────────────────

export function templateForKpiCard(
    event: RankedEvent,
    primaryGoalId: string | undefined,
): TemplatedCard {
    const title = eventTitle(event);
    const body = bodyForEvent(event);
    return {
        title,
        plainBody: [body.primary, body.secondary].filter(Boolean).join(" "),
        goalAction: goalAction(event, primaryGoalId),
        impactBadge: event.impactBadge,
    };
}

/** Smaller copy for inline rows in the Timing Gantt. */
export function templateForSpanRow(
    event: RankedEvent,
): TemplatedSpanCopy {
    const title = eventTitle(event);
    const body = bodyForEvent(event);
    return {
        title,
        body: body.primary, // single short sentence
    };
}

/** Span-shaped variant of templateForSpanRow. Accepts a UniversalSkySpan
 *  directly so TimingTab doesn't need to round-trip through RankedEvent.
 *  Returns plain-English title + ≤12-word body for inline row display. */
export function templateForSpanShape(span: {
    kind: "retrograde" | "ingress" | "sky-aspect" | "eclipse" | "node-aspect" | "station";
    planet: string;
    sign?: string;
    dignity?: string;
    aspectType?: string;
    secondaryPlanet?: string;
}): TemplatedSpanCopy {
    // Synthesize a ranked-event-like shape so we can reuse the existing
    // body lookup tables.
    const kind: RankedEvent["kind"] =
        span.kind === "retrograde" ? "retrograde" :
        span.kind === "ingress"    ? "ingress"    :
        span.kind === "eclipse"    ? "eclipse"    :
        span.kind === "node-aspect"? "node-aspect":
        span.kind === "sky-aspect" ? "aspect"     :
        // station — Rx start vs direct end. Treat as retrograde-coloured.
        "retrograde";

    const synth: RankedEvent = {
        key: "",
        kind,
        rawHeadline: "",
        dateRange: "",
        severity: 0,
        duringTrip: true,
        planet: span.planet,
        sign: span.sign,
        dignity: (span.dignity as RankedEvent["dignity"]) ?? undefined,
        aspectType: (span.aspectType as RankedEvent["aspectType"]) ?? undefined,
        secondaryPlanet: span.secondaryPlanet,
        eclipseKind: span.kind === "eclipse"
            ? (span.planet === "moon" ? "lunar" : "solar")
            : undefined,
        impactBadge: "neutral",
    };

    if (span.kind === "station") {
        // Stations get their own short titles since they're zero-width pins
        // that often appear next to the matching retrograde row.
        const planet = capPlanetSafe(span.planet);
        const isRx = (synth.dignity ?? "neutral") !== "neutral" || true; // unused; we infer from below
        // We can't tell rx-vs-direct from kind alone — caller passes label info
        // through another channel. Default to a safe phrasing.
        const title = `${planet} turns`;
        return {
            title,
            body: "A short pause at the turn — let it settle.",
        };
    }

    return templateForSpanRow(synth);
}

function capPlanetSafe(p: string): string {
    return planetCap(p);
}

/** Lookup body template for a ranked event. */
function bodyForEvent(event: RankedEvent): BodyTemplate {
    if (event.kind === "retrograde" || event.kind === "retrograde-upcoming") {
        return RETROGRADE_BODIES[event.planet ?? ""] ?? { primary: "A retrograde slows things down." };
    }
    if (event.kind === "eclipse") {
        return ECLIPSE_BODIES[event.eclipseKind ?? "solar"];
    }
    if (event.kind === "node-aspect") {
        const key = `${event.planet}-${event.aspectType}`;
        return NODE_ASPECT_BODIES[key] ?? NODE_ASPECT_BODIES["default"];
    }
    if (event.kind === "ingress") {
        return INGRESS_BODIES[event.planet ?? ""] ?? { primary: "A planet moves into a new sign." };
    }
    if (event.kind === "aspect") {
        return ASPECT_BODIES[event.aspectType ?? ""] ?? { primary: "Two planets shape each other in the slow-moving sky." };
    }
    return { primary: "" };
}

/** Build a goal-tied verdict lead sentence for the §03 panel.
 *  Voice: Nat — direct, short, no fluff. One sharp sentence that names the
 *  loudest event, then a goal-tied takeaway if a primary goal is set. */
export function templateForVerdictLead(
    events: RankedEvent[],
    primaryGoalId: string | undefined,
): string {
    if (events.length === 0) {
        return "Sky is unusually quiet right now. Your chart and the place do the work.";
    }
    const lead = events[0];
    const leadTitle = eventTitle(lead);
    const goalDef = primaryGoalId ? GOAL_DEFINITIONS[primaryGoalId as GoalId] : undefined;

    // "Loudest thing overhead: Mercury reverses in Cancer."
    const sentence1 = `Loudest thing overhead: ${leadTitle.toLowerCase()}.`;
    if (!goalDef) return sentence1;

    // "For romance: text plans before you sign, not after."
    const tail = goalActionShortened(lead, primaryGoalId);
    return `${sentence1} For ${goalDef.label.toLowerCase()}: ${tail}`;
}

function goalActionShortened(event: RankedEvent, primaryGoalId: string | undefined): string {
    const action = goalAction(event, primaryGoalId);
    // Strip the leading "Romance: " / "Career: " etc. and lowercase the
    // first word so it reads as a continuation.
    const colon = action.indexOf(":");
    const tail = colon === -1 ? action : action.slice(colon + 1).trim();
    return tail.charAt(0).toLowerCase() + tail.slice(1);
}
