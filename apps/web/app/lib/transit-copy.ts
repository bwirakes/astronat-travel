/**
 * transit-copy.ts — Deterministic human-language copy for transit spans.
 *
 * transitFeeling() takes a transit hit + the user's goal IDs and returns:
 *   feeling  — "You'll feel…" 1-sentence experiential description
 *   focus    — which of the user's goals this window activates or taxes
 *   actions  — 2-3 plain-English things to do or avoid
 *
 * Pure function. Client-safe. No SwissEph, no AI calls.
 */

import { PLANET_EXPRESSION_NOUNS } from "./astro-wording";

// Goal ID → natal planets whose activation matters for that goal.
// Mirrors GOAL_NATAL_TARGETS in window-scoring.ts — kept local to avoid a circular dep.
const GOAL_TARGETS: Record<string, string[]> = {
    love:       ["venus", "moon"],
    career:     ["sun", "mars", "saturn", "mc"],
    community:  ["mercury", "jupiter"],
    growth:     ["jupiter", "neptune"],
    relocation: ["moon", "ic"],
    timing:     [],
};

const GOAL_LABEL: Record<string, string> = {
    love:       "love and connection",
    career:     "career and visibility",
    community:  "community and networks",
    growth:     "growth and expansion",
    relocation: "home and belonging",
    timing:     "timing",
};

// Angle targets treated as natal planets — use house noun copy.
const ANGLE_EXPRESSION: Record<string, string> = {
    asc:        "sense of presence and how you show up",
    mc:         "public direction and what you want to be known for",
    dsc:        "relationship pattern and who you attract",
    ic:         "private foundation — home, belonging, what grounds you",
};

// Aspect → {tone, quality}: quality is "easy" or "hard" for action table lookup.
const ASPECT_TONE: Record<string, { phrase: string; quality: "easy" | "hard" }> = {
    conjunct:    { phrase: "amplified and impossible to ignore",        quality: "easy" },
    conjunction: { phrase: "amplified and impossible to ignore",        quality: "easy" },
    trine:       { phrase: "flowing — available without effort",        quality: "easy" },
    sextile:     { phrase: "accessible with a small push",              quality: "easy" },
    square:      { phrase: "under pressure and forced into awareness",  quality: "hard" },
    opposition:  { phrase: "pulled in two directions — tension visible", quality: "hard" },
};

const PLANET_COPY: Record<string, {
    b_e: { feel: string; actions: string[] };
    b_h: { feel: string; actions: string[] };
    m_e: { feel: string; actions: string[] };
    m_h: { feel: string; actions: string[] };
}> = {
    Jupiter: {
        b_e: { feel: "expansive and lucky — like the room gets larger when you walk in",
               actions: ["Ask for more than you normally would", "Lock in agreements — terms feel generous right now", "Introduce yourself to people you've been hesitating to reach"] },
        b_h: { feel: "pulled toward growth but stretched by it — the opportunity is real but oversized",
               actions: ["Push forward on growth but right-size before committing", "Say yes selectively — not everything that looks big is yours to take on"] },
        m_e: { feel: "optimistic but scattered — the energy wants to expand in too many directions at once",
               actions: ["Focus the enthusiasm: pick one big thing, not three", "Watch for overpromising; right-size your asks"] },
        m_h: { feel: "over-extended and over-committed — a stretch that's becoming a strain",
               actions: ["Don't add new obligations this window", "Renegotiate what's already on your plate before adding more"] },
    },
    Saturn: {
        b_e: { feel: "grounded and serious — steady progress is available if you show up for it",
               actions: ["Commit to the slow build — formalize contracts, plans, agreements", "Do the deep work you've been postponing", "Structure something rather than leaving it open"] },
        b_h: { feel: "tested and slowed — like you're pushing against resistance in everything you move",
               actions: ["Deep work only — don't launch, pitch, or negotiate", "Use the pressure to finish something you've been avoiding, not to start anything new", "Rest and restructure rather than forcing new starts"] },
        m_e: { feel: "steady but serious — background weight that asks you to prove something",
               actions: ["Focus on long-term commitments, not short wins", "Avoid shortcuts — they'll cost you later this window"] },
        m_h: { feel: "heavy and restricted — everything requires more effort than it should",
               actions: ["Don't launch, pitch, or negotiate during this stretch", "Protect your energy — serious work only", "Delays are likely; build buffer into any timeline"] },
    },
    Mars: {
        b_e: { feel: "motivated and sharp — momentum is on your side and action lands",
               actions: ["Bias toward action — this is a window for doing, not planning", "Start the thing you've been delaying", "Physical activity amplifies the energy positively"] },
        b_h: { feel: "energized but edgy — a lot of drive looking for an outlet",
               actions: ["Channel the energy into something physical or creative", "Avoid confrontations that need patience; choose your battles"] },
        m_e: { feel: "wired and impatient — shorter fuses, faster reactions",
               actions: ["Skip negotiations that need calm and patience", "Physical activity helps; sitting with the tension doesn't", "Double-check anything you send before hitting send"] },
        m_h: { feel: "frustrated and reactive — friction with anything you try to push forward",
               actions: ["Avoid confrontations entirely if possible", "Protect your energy — don't scatter across too many fronts", "Wait this out before making moves that can't be undone"] },
    },
    Venus: {
        b_e: { feel: "socially warm and aesthetically alive — connections form without forcing",
               actions: ["Schedule creative collaboration, pitches, or meetings", "Reach out to people you've been meaning to connect with", "Finalize deals and agreements — terms flow more easily"] },
        b_h: { feel: "drawn toward connection but navigating some friction in it",
               actions: ["Lead with honesty in relationships rather than smoothing things over", "Creative work is still available — lean into it"] },
        m_e: { feel: "pleasant but indecisive — values want to be negotiated rather than held",
               actions: ["Don't rush relationship or financial decisions", "Let conversations breathe — the right arrangement will surface"] },
        m_h: { feel: "off-balance in relationships and values — like compromise is being demanded before you're ready",
               actions: ["Don't force a deal or connection that feels wrong", "Hold your ground on what you actually want", "Revisit this when the pressure lifts"] },
    },
    Mercury: {
        b_e: { feel: "clear-headed and well-connected — information moves, conversations land",
               actions: ["Good window for paperwork, contracts, and important conversations", "Reach out — signals are clear", "Write the thing you've been thinking about"] },
        b_h: { feel: "mentally active but pulled in multiple directions",
               actions: ["Focus on one conversation or document at a time", "Back up your work; active Mercury means things move fast"] },
        m_e: { feel: "mentally busy but slightly slippery — easy to misread tone or miss details",
               actions: ["Reconfirm every logistic before assuming it's holding", "Re-read anything important before sending", "Back up files and double-check communications"] },
        m_h: { feel: "scattered and easily misunderstood — communications are prone to getting lost or twisted",
               actions: ["Don't sign anything without sleeping on it", "Slow down correspondence — haste creates more work later", "Over-communicate rather than assuming things were heard"] },
    },
    Sun: {
        b_e: { feel: "visible and vital — a natural focal point, good for anything requiring presence",
               actions: ["Show up — this is a good window for visibility and being seen", "Make the ask, the pitch, the introduction", "Lead from the front"] },
        b_h: { feel: "in the spotlight in ways that require you to prove something",
               actions: ["Prepare thoroughly — this is a window for results, not rehearsal", "Own the attention rather than deflecting it"] },
        m_e: { feel: "noticed but pressured — your identity and direction are being tested",
               actions: ["Stay grounded in what you actually want, not what's expected", "Avoid decisions made purely to manage others' perception"] },
        m_h: { feel: "under scrutiny and slowed — like your direction is being blocked or questioned",
               actions: ["Don't force visibility — lie low and do the real work", "This is not a launch window; it's a consolidation window", "Prove through action, not announcement"] },
    },
    Moon: {
        b_e: { feel: "emotionally settled and instinctively right — your gut is trustworthy",
               actions: ["Trust your instincts on things you've been uncertain about", "This is a good window for conversations that need emotional honesty", "Lean into what feels like home"] },
        b_h: { feel: "emotionally alive but stirred — feelings are close to the surface",
               actions: ["Create space for the feelings rather than managing them", "Don't mistake emotional intensity for crisis"] },
        m_e: { feel: "moody and reactive — quicker to take things personally than usual",
               actions: ["Don't read tone too literally right now", "Build in rest — emotional reserves are lower in this window", "Postpone difficult conversations until after this passes"] },
        m_h: { feel: "emotionally turbulent — pulled in two directions and easily overwhelmed",
               actions: ["Protect your environment — minimize unnecessary exposure to stress", "Rest, not productivity, is the right call for this window", "Don't make permanent decisions from a temporary emotional state"] },
    },
    Neptune: {
        b_e: { feel: "open, imaginative, and spiritually receptive — a softer, more porous quality to everything",
               actions: ["Good window for creative work, inspiration, and quiet reflection", "Trust impressions and images over analytical conclusions", "Spend time near water or in stillness if you can"] },
        b_h: { feel: "idealistic and slightly spacey — the creative signal is real but so is the blur",
               actions: ["Capture ideas quickly — clarity won't last", "Don't sign anything that requires precision right now"] },
        m_e: { feel: "foggy and uncertain — hard to get a clean read on situations or people",
               actions: ["Don't sign anything without sleeping on it", "Get things in writing — ambiguity is high", "Trust instincts but verify facts separately"] },
        m_h: { feel: "disoriented and prone to wishful thinking — what looks clear probably isn't",
               actions: ["Avoid major commitments during this window", "Seek a second opinion on anything that feels too good", "Double-check contracts, logistics, and anything signed"] },
    },
    Uranus: {
        b_e: { feel: "alive to possibility — something unexpected opens up and it's welcome",
               actions: ["Say yes to the unusual offer or conversation", "This is a window for experimentation, not consolidation", "Let plans flex — the deviation is often better than the original"] },
        b_h: { feel: "restless and itching to break something — the urge for freedom is strong",
               actions: ["Find a constructive outlet for the need to disrupt", "Don't burn things down impulsively — be selective about what you change"] },
        m_e: { feel: "destabilized — things that were solid are less so right now",
               actions: ["Keep your schedule loose this window", "Don't make long-term commitments based on current conditions", "Adapt rather than resist"] },
        m_h: { feel: "disrupted and unable to predict what comes next",
               actions: ["Protect yourself from overcommitting to anything that requires stability", "Expect delays and detours — buffer every timeline", "The disruption usually carries information; look for it"] },
    },
    Pluto: {
        b_e: { feel: "deeply focused and magnetically present — transformation is available if you're willing",
               actions: ["Go deep on something that matters — surface-level effort won't satisfy", "This is a window for real change, not maintenance", "Face what you've been avoiding"] },
        b_h: { feel: "aware of power dynamics and what's being asked of you beneath the surface",
               actions: ["Name what's actually happening — the subtext matters more than the text", "Don't be naive about motivations, yours or others'"] },
        m_e: { feel: "intense and aware of undercurrents — power dynamics are charged right now",
               actions: ["Don't provoke a power struggle you can't afford to lose", "Choose your battles very carefully this window", "Psychological intensity is high — rest is protective"] },
        m_h: { feel: "pressured at a deep level — something wants to force a transformation",
               actions: ["Don't resist the change; ask what it's asking of you", "Avoid power confrontations entirely if possible", "This is a window for inner work, not outer combat"] },
    },
};

function natalExpression(natal: string): string {
    const key = natal.charAt(0).toUpperCase() + natal.slice(1).toLowerCase();
    const angleKey = natal.toLowerCase();
    return ANGLE_EXPRESSION[angleKey]
        ?? PLANET_EXPRESSION_NOUNS[key]
        ?? PLANET_EXPRESSION_NOUNS[natal]
        ?? natal.toLowerCase();
}

function planetKey(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export interface TransitFeeling {
    feeling: string;
    focus: string[];
    actions: string[];
}

/**
 * Deterministic human-language copy for a single transit hit.
 *
 * @param transit   — a TransitHit-compatible object
 * @param goalIds   — user's selected goal IDs from intake
 */
export function transitFeeling(
    transit: {
        transit_planet: string;
        natal_planet: string;
        aspect: string;
        benefic: boolean;
        orb?: number;
        retrograde?: boolean;
    },
    goalIds: string[],
): TransitFeeling {
    const planet = planetKey(transit.transit_planet);
    const natal  = transit.natal_planet.toLowerCase();
    const aspect = transit.aspect.toLowerCase().replace(/-/g, " ");
    const benefic = transit.benefic;
    const retro   = transit.retrograde === true;

    const aspectData = ASPECT_TONE[aspect] ?? { phrase: "active", quality: "easy" as const };
    const qualKey = aspectData.quality === "easy" ? "e" : "h";
    const dirKey  = benefic ? "b" : "m";
    const rowKey  = `${dirKey}_${qualKey}` as keyof (typeof PLANET_COPY)[string];

    const copy = PLANET_COPY[planet]?.[rowKey];
    const expression = natalExpression(transit.natal_planet);

    // Retrograde transits revisit ground already covered — frame as a return, not a fresh wave.
    const retroPrefix = retro
        ? "This one's a revisit, not a fresh wave — "
        : "";

    let feeling: string;
    if (copy) {
        const base = `${retroPrefix}you'll feel ${copy.feel}.`;
        feeling = base.charAt(0).toUpperCase() + base.slice(1);
    } else {
        feeling = benefic
            ? `${retroPrefix}you'll feel your ${expression} ${aspectData.phrase} — a supportive signal.`
            : `${retroPrefix}you'll feel your ${expression} ${aspectData.phrase} — some friction to work with.`;
        feeling = feeling.charAt(0).toUpperCase() + feeling.slice(1);
    }

    const focus: string[] = [];
    if (goalIds.length > 0) {
        for (const gid of goalIds) {
            const targets = GOAL_TARGETS[gid] ?? [];
            if (targets.includes(natal)) {
                const label = GOAL_LABEL[gid] ?? gid;
                const verb  = benefic ? "Strong window for" : "Extra friction on";
                focus.push(`${verb} your ${label} goals.`);
            }
        }
    }

    const actions = copy?.actions ?? (
        benefic
            ? ["Lean into the energy — this is a supportive stretch", "Make progress on what matters most"]
            : ["Stay patient and strategic", "Avoid forcing outcomes that need more time"]
    );

    return { feeling, focus, actions };
}

/** Short one-liner for Gantt bar labels and compact range card subheadings. */
export function transitOneLiner(transit: {
    transit_planet: string;
    natal_planet: string;
    aspect: string;
    benefic: boolean;
}): string {
    const planet  = planetKey(transit.transit_planet);
    const aspect  = transit.aspect.toLowerCase().replace(/-/g, " ");
    const aspectD = ASPECT_TONE[aspect];
    const qualKey = aspectD?.quality === "easy" ? "e" : "h";
    const dirKey  = transit.benefic ? "b" : "m";
    const rowKey  = `${dirKey}_${qualKey}` as keyof (typeof PLANET_COPY)[string];
    const copy    = PLANET_COPY[planet]?.[rowKey];

    if (copy) {
        const words = copy.feel.split(" ");
        return words.slice(0, 8).join(" ") + (words.length > 8 ? "…" : "");
    }
    return transit.benefic ? "Supportive energy" : "Some friction";
}
