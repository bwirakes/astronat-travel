/**
 * couples-viewmodel.ts — single-shape adapter for the magazine couples view.
 *
 * Mirrors `toV4ViewModel` for /reading. Takes a persisted synastry reading
 * row and returns a flat shape the magazine components consume directly.
 * Every derivation rule lives here; components stay presentational.
 *
 * Render-time fallbacks: old synastry rows that pre-date the partnerEventScores
 * persistence change still render — we recompute on the fly when missing.
 * Coherence is always computed at render time (it's free).
 */

import {
  verdictBand,
  verdictTone,
  jointScore,
  VERDICT_COLORS,
  type VerdictBand,
  HERO_LABELS,
  EVENT_LABELS,
  WINDOW_LABELS,
  WINDOW_RATIONALES,
} from "./verdict";
import { LIFE_EVENTS } from "./planet-library";
import type { FinalEventScore } from "./scoring-engine";

// ═══════════════════════════════════════════════════════════════
// SHAPE
// ═══════════════════════════════════════════════════════════════

export type GoalId =
  | "identity"
  | "wealth"
  | "home"
  | "romance"
  | "health"
  | "partnerships"
  | "career"
  | "friendship"
  | "spirituality"
  // Legacy IDs still accepted for old readings.
  | "love"
  | "community"
  | "relocation"
  | "growth"
  | "timing";

export interface PartnerEventScore {
  event: string;
  you: number;
  partner: number;
}

export interface AngleVM {
  /** Display name, e.g. "Rising (ASC)". */
  name: string;
  /** Plain-English topic, e.g. "How you come across". */
  plain: string;
  /** "24° Aries" — "—" only if natal cusps are missing for this side
   *  (legacy reading rows that pre-date partnerNatalCusps persistence). */
  natal: string;
  /** "11° Cancer" — always present (computed from relocated cusps). */
  relocated: string;
  /** Sentence-long copy describing what shifts when this angle moves. */
  delta: string;
}

export interface SynastryAspectVM {
  p1: string;
  p2: string;
  aspect: string;
  orb: number;
  meaning: string;
  /** Canonical lookup key: `${p1}-${aspect}-${p2}` lowercased.
   *  The AI prose pipeline uses this verbatim as the `aspectKey` in
   *  `CouplesReading.deepDive.aspectMeanings[]` so the view can match
   *  AI-authored meanings to rendered aspects without inventing IDs. */
  key: string;
}

export interface ChartTabVM {
  planets: Array<{ planet: string; longitude: number }>;
  cusps: number[];
  macroScore: number;
  element: string;
  modality: string;
  /** One-sentence "what shifts here" opener. Synthesized from the strongest
   *  natal→relocated sign change among the four angles, mirroring the lead
   *  in WhatShiftsTab. */
  lead: string;
  /** Four corner cards (ASC/IC/DSC/MC). When natal cusps are unavailable,
   *  `natal` falls back to "—" but `relocated` and `delta` still render. */
  angles: AngleVM[];
}

export interface CouplesVM {
  hero: {
    destination: string;
    /** Original unparsed destination ("Budapest, Hungary") so consumers
     *  that need the country part (flag lookup, full label) can recover
     *  it without re-reading the persisted reading. */
    destinationFull: string;
    dateRange: string;
    partnerName: string;
    /** The headline "for both of you" score. Joint quality, not agreement. */
    joint: { score: number; band: VerdictBand; label: string; accent: string };
    /** Side stat — how far apart the partners' individual scores are.
     *  Surfaced as the Δ MACRO column in the ledger; kept on hero in case
     *  another surface wants the raw delta without re-deriving. */
    deltaPts: number;
  };
  ledger: {
    you: { score: number; band: VerdictBand; label: string; accent: string };
    partner: { score: number; band: VerdictBand; label: string; accent: string };
    delta: number;
  };
  intro: {
    goals: GoalId[];
    topPicks: string[];
    cautions: string[];
    bestWindowShort: string | null;
    avoidWindowShort: string | null;
  };
  goals: {
    events: PartnerEventScore[];
    priority: Set<string>;
    selectedGoals: GoalId[];
    topThree: PartnerEventScore[];
  };
  timings: {
    /** Joint score (0–100) shown next to the verdict label.
     *  Same number as `hero.joint.score` — kept here so the timings panel
     *  can render its `{label} · {score}/100` subhead without reaching
     *  back up into hero. */
    score: number;
    label: string;
    rationale: string;
    accent: string;
    bestWindows: string[];
    avoidWindows: string[];
    /** Per-window joint score, index-aligned with bestWindows / avoidWindows.
     *  Empty array if the engine didn't compute scores (legacy readings). */
    bestWindowScores: number[];
    avoidWindowScores: number[];
  };
  deepDive: {
    you: ChartTabVM;
    partner: ChartTabVM;
    synastry: { harmonious: SynastryAspectVM[]; tense: SynastryAspectVM[] };
    partnerName: string;
  };
  geodetic: {
    you:     { ascSign: string; ascDeg: number; mcSign: string; mcDeg: number; note: string };
    partner: { ascSign: string; ascDeg: number; mcSign: string; mcDeg: number; note: string };
    summary: string;
    partnerName: string;
  };
  prose: import("@/lib/ai/schemas").CouplesReading | null;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const TONE_ACCENT_MAP: Record<ReturnType<typeof verdictTone>, string> = {
  lift:    "var(--sage)",
  neutral: "var(--gold)",
  press:   "var(--color-spiced-life)",
};

const GOAL_TO_EVENTS: Record<GoalId, string[]> = {
  identity:   ["Identity & Self-Discovery"],
  wealth:     ["Wealth & Financial Growth"],
  home:       ["Home, Family & Roots"],
  romance:    ["Romance & Love"],
  health:     ["Health, Routine & Wellness"],
  partnerships: ["Partnerships & Marriage"],
  career:     ["Career & Public Recognition"],
  friendship: ["Friendship & Networking"],
  spirituality: ["Spirituality & Inner Peace"],
  love:       ["Romance & Love", "Partnerships & Marriage"],
  community:  ["Friendship & Networking"],
  relocation: ["Home, Family & Roots", "Identity & Self-Discovery"],
  growth:     ["Spirituality & Inner Peace", "Identity & Self-Discovery"],
  timing:     [],
};

const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

const ELEMENT_OF: Record<string, "Fire" | "Earth" | "Air" | "Water"> = {
  Aries: "Fire",  Leo: "Fire",   Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air",  Libra: "Air",  Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

const MODALITY_OF: Record<string, "Cardinal" | "Fixed" | "Mutable"> = {
  Aries: "Cardinal", Cancer: "Cardinal", Libra: "Cardinal", Capricorn: "Cardinal",
  Taurus: "Fixed",   Leo: "Fixed",       Scorpio: "Fixed",  Aquarius: "Fixed",
  Gemini: "Mutable", Virgo: "Mutable",   Sagittarius: "Mutable", Pisces: "Mutable",
};

const HOUSE_LABEL: Record<number, string> = {
  1: "Identity",  2: "Resources", 3: "Voice",      4: "Home",
  5: "Romance",   6: "Routine",   7: "Partnership", 8: "Intimacy",
  9: "Travel",    10: "Career",   11: "Community",  12: "Inner",
};

// Four-corner labels and default "what shifts" copy. Mirrors the angle
// section of WhatShiftsTab so the couples deep-dive uses the same vocabulary
// as the solo /reading view.
const ANGLE_PLAIN: Record<"ASC" | "IC" | "DSC" | "MC", { name: string; plain: string }> = {
  ASC: { name: "Rising (ASC)", plain: "How you come across" },
  IC:  { name: "Roots (IC)",   plain: "What feels like home" },
  DSC: { name: "Partner (DSC)", plain: "Who you attract" },
  MC:  { name: "Calling (MC)", plain: "What you're known for" },
};

const ANGLE_DELTA: Record<"ASC" | "IC" | "DSC" | "MC", string> = {
  ASC: "Your public-facing self shifts. People meet a slightly different version of you here.",
  IC:  "What feels like home re-codes. The kind of room that settles you here may not be the kind that settles you back home.",
  DSC: "You'll attract a different sort of person here — close encounters carry a different flavor.",
  MC:  "What you want to be known for shifts. A quieter dream can sharpen into a real plan in this place.",
};

// Curated synastry-aspect meanings. Lookup key: `{p1Lower}-{aspect}-{p2Lower}`,
// then `{aspect}-{tone}` fallback. Hand-curated for the common pairs;
// fallback strings are honest about being generic.
const ASPECT_MEANINGS: Record<string, string> = {
  "venus-trine-sun":            "Easy attraction. The baseline 'I like being around you' aspect.",
  "sun-trine-venus":            "Easy attraction. The baseline 'I like being around you' aspect.",
  "moon-sextile-venus":         "Domestic warmth. The cooking-together, sharing-blankets aspect.",
  "venus-sextile-moon":         "Domestic warmth. The cooking-together, sharing-blankets aspect.",
  "sun-trine-jupiter":          "Mutual encouragement. You make each other braver.",
  "jupiter-trine-sun":          "Mutual encouragement. You make each other braver.",
  "venus-square-mars":          "Magnetic but combustible. Chemistry without a thermostat.",
  "mars-square-venus":          "Magnetic but combustible. Chemistry without a thermostat.",
  "mars-square-saturn":         "Pace mismatch. You push, they brake. Productive if you split roles.",
  "saturn-square-mars":         "Pace mismatch. You push, they brake. Productive if you split roles.",
  "mercury-opposition-mars":    "Conversations escalate fast. Choose channels deliberately.",
  "mars-opposition-mercury":    "Conversations escalate fast. Choose channels deliberately.",
  "moon-conjunction-saturn":    "Felt seriousness. One of you holds the weight; check the math.",
  "saturn-conjunction-moon":    "Felt seriousness. One of you holds the weight; check the math.",
  "sun-square-saturn":          "Authority friction. Productive once you stop competing.",
  "saturn-square-sun":          "Authority friction. Productive once you stop competing.",
};

const ASPECT_FALLBACK: Record<string, string> = {
  "trine":       "Easy current. Things flow without effort here.",
  "sextile":     "Productive support. Available if you act on it.",
  "conjunction": "Energies fuse. The pair behaves like one body.",
  "opposition":  "Pulled in opposite directions. Useful if you negotiate.",
  "square":      "Live tension. Productive friction or repeated argument.",
};

// ═══════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════

export function toCouplesViewModel(reading: any): CouplesVM {
  // ── Hero / ledger ─────────────────────────────────────────────
  const youScore     = numOr(reading.userMacroScore, reading.macroScore, 0);
  const partnerScore = numOr(reading.partnerMacroScore, 0);
  const delta        = numOr(reading.scoreDelta, Math.abs(youScore - partnerScore));
  // Joint = the headline "for both of you" score. Drives both the hero pill
  // and the timing-window verdict, since both surfaces are answering the
  // same question: "is this place good for the pair?"
  const joint     = jointScore(youScore, partnerScore);
  const jointBand = verdictBand(joint);

  // Per-partner bands still drive the ledger and per-event rows.
  const youBand   = verdictBand(youScore);
  const ptnrBand  = verdictBand(partnerScore);

  const partnerName: string = reading.partnerName || "Partner";
  const destinationFull: string = String(reading.destination || "");
  const destination: string = destinationFull.split(",")[0] || "the destination";
  const dateRange: string = formatDateRange(reading.travelDate);

  // ── Goals + events ────────────────────────────────────────────
  const selectedGoals = resolveGoals(reading.goals);
  const events: PartnerEventScore[] = buildEventScores(reading);
  const sorted = sortEventsByGoals(events, selectedGoals);
  const priority = new Set(selectedGoals.flatMap((g) => GOAL_TO_EVENTS[g]));
  const topThree = sorted.slice(0, 3);

  // ── Intro derivations ─────────────────────────────────────────
  const priorityEvents = sorted.filter((e) => priority.has(e.event));
  const ranked = [...priorityEvents].sort((a, b) => (b.you + b.partner) - (a.you + a.partner));
  const topPicks = ranked.slice(0, 3).map((e) => stripAmpersand(e.event));
  const cautions = ranked.slice(-1).map((e) => stripAmpersand(e.event));

  const bestWindows  = pickStringList(reading.narrative?.verdict?.bestWindows ?? reading.bestWindows ?? []);
  const avoidWindows = pickStringList(reading.narrative?.verdict?.avoidWindows ?? reading.avoidWindows ?? []);
  const pickNumberList = (input: unknown): number[] =>
    Array.isArray(input) ? input.map((n) => Number(n)).filter((n) => Number.isFinite(n)) : [];
  const bestWindowScores  = pickNumberList(reading.bestWindowScores);
  const avoidWindowScores = pickNumberList(reading.avoidWindowScores);

  // ── Deep Dive: per-partner chart VMs ──────────────────────────
  const youCusps: number[]  = arrayOr<number>(reading.userRelocatedCusps, reading.relocatedCusps, equalCusps());
  const ptnrCusps: number[] = arrayOr<number>(reading.partnerRelocatedCusps, equalCusps());
  // Natal cusps for the natal→relocated comparison on the four-corners cards.
  // `partnerNatalCusps` is a recent persistence addition (see lib/readings/
  // astrocarto.ts); legacy synastry rows lack it and fall back to "—".
  const youNatalCusps  = arrayOr<number>(reading.natalCusps);
  const ptnrNatalCusps = arrayOr<number>(reading.partnerNatalCusps);
  const youPlanets  = normalizePlanets(reading.natalPlanets);
  const ptnrPlanets = normalizePlanets(reading.partnerNatalPlanets);

  const youAngles  = buildAngles(youNatalCusps,  youCusps);
  const ptnrAngles = buildAngles(ptnrNatalCusps, ptnrCusps);

  const youDeep: ChartTabVM = {
    planets: youPlanets,
    cusps: youCusps,
    macroScore: youScore,
    element: dominantElement(youPlanets),
    modality: dominantModality(youPlanets),
    lead: buildAngleLead(youAngles, destination),
    angles: youAngles,
  };
  const ptnrDeep: ChartTabVM = {
    planets: ptnrPlanets,
    cusps: ptnrCusps,
    macroScore: partnerScore,
    element: dominantElement(ptnrPlanets),
    modality: dominantModality(ptnrPlanets),
    lead: buildAngleLead(ptnrAngles, destination),
    angles: ptnrAngles,
  };

  // ── Synastry aspects: split by tone, attach meanings ──────────
  const allAspects = Array.isArray(reading.synastryAspects) ? reading.synastryAspects : [];
  const harmonious = allAspects
    .filter((a: any) => a.tone === "harmonious")
    .sort((a: any, b: any) => a.orb - b.orb)
    .slice(0, 5)
    .map((a: any) => decorateAspect(a));
  const tense = allAspects
    .filter((a: any) => a.tone === "tense")
    .sort((a: any, b: any) => a.orb - b.orb)
    .slice(0, 5)
    .map((a: any) => decorateAspect(a));

  // ── Geodetic / relocated angles per partner ───────────────────
  const youAsc = relocAngle(youCusps[0]);
  const youMc  = relocAngle(youCusps[9]);
  const ptnrAsc = relocAngle(ptnrCusps[0]);
  const ptnrMc  = relocAngle(ptnrCusps[9]);

  // ── Assemble ──────────────────────────────────────────────────
  return {
    hero: {
      destination,
      destinationFull,
      dateRange,
      partnerName,
      joint: {
        score: joint,
        band: jointBand,
        label: HERO_LABELS[jointBand],
        accent: VERDICT_COLORS[jointBand] ?? "var(--text-secondary)",
      },
      deltaPts: delta,
    },
    ledger: {
      you: {
        score: youScore, band: youBand,
        label: HERO_LABELS[youBand],
        accent: TONE_ACCENT_MAP[verdictTone(youBand)],
      },
      partner: {
        score: partnerScore, band: ptnrBand,
        label: HERO_LABELS[ptnrBand],
        accent: TONE_ACCENT_MAP[verdictTone(ptnrBand)],
      },
      delta,
    },
    intro: {
      goals: selectedGoals,
      topPicks,
      cautions,
      bestWindowShort: bestWindows[0] ? shortenWindow(bestWindows[0]) : null,
      avoidWindowShort: avoidWindows[0] ? shortenWindow(avoidWindows[0]) : null,
    },
    goals: {
      events: sorted,
      priority,
      selectedGoals,
      topThree,
    },
    timings: {
      score: joint,
      label: WINDOW_LABELS[jointBand],
      rationale: WINDOW_RATIONALES[jointBand],
      accent: VERDICT_COLORS[jointBand] ?? "var(--text-secondary)",
      bestWindows,
      avoidWindows,
      bestWindowScores,
      avoidWindowScores,
    },
    deepDive: {
      you: youDeep,
      partner: ptnrDeep,
      synastry: { harmonious, tense },
      partnerName,
    },
    geodetic: {
      you:     { ascSign: youAsc.sign,  ascDeg: youAsc.deg,  mcSign: youMc.sign,  mcDeg: youMc.deg,
                 note: youDeep.lead },
      partner: { ascSign: ptnrAsc.sign, ascDeg: ptnrAsc.deg, mcSign: ptnrMc.sign, mcDeg: ptnrMc.deg,
                 note: ptnrDeep.lead },
      summary: relocSummary(youAsc, ptnrAsc, youMc, ptnrMc),
      partnerName,
    },
    prose: reading.couplesReading || null,
  };
}

// ═══════════════════════════════════════════════════════════════
// DERIVATION RULES
// ═══════════════════════════════════════════════════════════════

/** Reading.partnerEventScores is the post-Phase-1 persisted shape.
 *  Fallback for old rows: build a degraded series from `houseComparison`
 *  if available, else map LIFE_EVENTS to user/partner macroScore (a flat
 *  approximation but an honest one — the page will still render). */
export function buildEventScores(reading: any): PartnerEventScore[] {
  const userEvents: FinalEventScore[] = Array.isArray(reading.eventScores) ? reading.eventScores : [];
  const partnerEvents: FinalEventScore[] = Array.isArray(reading.partnerEventScores) ? reading.partnerEventScores : [];

  if (userEvents.length === LIFE_EVENTS.length && partnerEvents.length === LIFE_EVENTS.length) {
    return LIFE_EVENTS.map((name, i) => ({
      event: name,
      you:     numOr(userEvents[i]?.finalScore, 0),
      partner: numOr(partnerEvents[i]?.finalScore, 0),
    }));
  }

  // Degraded fallback: flat macro scores. Rows that pre-date partner event
  // scoring still render, just without per-event nuance.
  const youMacro     = numOr(reading.userMacroScore, reading.macroScore, 0);
  const partnerMacro = numOr(reading.partnerMacroScore, 0);
  return LIFE_EVENTS.map((name) => ({ event: name, you: youMacro, partner: partnerMacro }));
}

export function sortEventsByGoals(events: PartnerEventScore[], goals: GoalId[]): PartnerEventScore[] {
  const priority = goals.flatMap((g) => GOAL_TO_EVENTS[g]);
  const seen = new Set<string>();
  const head: PartnerEventScore[] = [];
  for (const name of priority) {
    if (seen.has(name)) continue;
    const found = events.find((e) => e.event === name);
    if (found) { head.push(found); seen.add(name); }
  }
  const tail = events.filter((e) => !seen.has(e.event));
  return [...head, ...tail];
}

/** Mode of element across the 10 bodies, weighted by luminaries 2x.
 *  Returns a friendly phrase like "Air-heavy" or "Water-anchored". */
export function dominantElement(planets: Array<{ planet: string; longitude: number }>): string {
  const tally: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  for (const p of planets) {
    const sign = signFromLon(p.longitude);
    const element = ELEMENT_OF[sign];
    if (!element) continue;
    const weight = (p.planet === "Sun" || p.planet === "Moon") ? 2 : 1;
    tally[element] += weight;
  }
  const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Mixed";
  return winner === "Air" ? "Air-heavy"
       : winner === "Water" ? "Water-anchored"
       : winner === "Fire" ? "Fire-led"
       : winner === "Earth" ? "Earth-grounded"
       : "Mixed";
}

export function dominantModality(planets: Array<{ planet: string; longitude: number }>): string {
  const tally: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  for (const p of planets) {
    const sign = signFromLon(p.longitude);
    const modality = MODALITY_OF[sign];
    if (!modality) continue;
    const weight = (p.planet === "Sun" || p.planet === "Moon") ? 2 : 1;
    tally[modality] += weight;
  }
  const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Mixed";
  return winner ? `${winner}-leaning` : "Mixed";
}

/** Build the four-corner cards (ASC/IC/DSC/MC) for one partner. Cusp indices:
 *  ASC=0, IC=3, DSC=6, MC=9. When `natalCusps` is empty (legacy reading),
 *  the natal column renders as "—" but relocated/delta still populate. */
export function buildAngles(natalCusps: number[], relocatedCusps: number[]): AngleVM[] {
  const cuspIdx = { ASC: 0, IC: 3, DSC: 6, MC: 9 } as const;
  return (["ASC", "IC", "DSC", "MC"] as const).map((k) => {
    const natalLon = natalCusps[cuspIdx[k]];
    const reloLon  = relocatedCusps[cuspIdx[k]];
    return {
      name: ANGLE_PLAIN[k].name,
      plain: ANGLE_PLAIN[k].plain,
      natal: typeof natalLon === "number" ? fmtSignDeg(natalLon) : "—",
      relocated: typeof reloLon === "number" ? fmtSignDeg(reloLon) : "—",
      delta: ANGLE_DELTA[k],
    };
  });
}

/** One-sentence "what shifts" opener. Mirrors WhatShiftsTab.buildLead: prefer
 *  the strongest natal→relocated sign change, fall back to a generic "the
 *  rest of the chart reshapes around this place" line. */
export function buildAngleLead(angles: AngleVM[], destination: string): string {
  const changed = angles.filter((a) => a.natal !== "—" && signOfFmt(a.natal) !== signOfFmt(a.relocated));
  const headline = changed[0] ?? angles.find((a) => a.relocated !== "—") ?? angles[0];
  if (!headline) return `${destination} reshapes the chart's framing.`;
  const topic = (headline.plain || headline.name).toLowerCase();
  if (headline.natal === "—" || headline.relocated === "—") {
    return `In ${destination}, ${topic} re-frames — the chart reshapes around this place.`;
  }
  return `In ${destination}, ${topic} shifts from ${headline.natal} into ${headline.relocated} — the rest of the chart reshapes around that move.`;
}

function decorateAspect(a: any): SynastryAspectVM {
  const p1 = capitalize(a.planet1 || a.p1 || "");
  const p2 = capitalize(a.planet2 || a.p2 || "");
  const aspect = String(a.aspect || a.type || a.name || "").toLowerCase();
  const orb = Number(a.orb ?? 0);
  const key = `${p1.toLowerCase()}-${aspect}-${p2.toLowerCase()}`;
  const meaning = ASPECT_MEANINGS[key] ??
    ASPECT_FALLBACK[aspect] ??
    "Energies meet here — read the band, not the headline.";
  return { p1, p2, aspect, orb, meaning, key };
}

export function relocSummary(
  youAsc: { sign: string }, ptnrAsc: { sign: string },
  youMc: { sign: string },  ptnrMc: { sign: string },
): string {
  const youAscEl  = ELEMENT_OF[youAsc.sign];
  const ptnrAscEl = ELEMENT_OF[ptnrAsc.sign];
  const youMcEl   = ELEMENT_OF[youMc.sign];
  const ptnrMcEl  = ELEMENT_OF[ptnrMc.sign];
  const ascSame = !!youAscEl && youAscEl === ptnrAscEl;
  const mcSame  = !!youMcEl  && youMcEl  === ptnrMcEl;

  const ascLower = youAscEl?.toLowerCase() ?? "—";
  const mcLower  = youMcEl?.toLowerCase()  ?? "—";

  if (ascSame && mcSame) {
    return `Both ASCs land in ${ascLower}, both MCs in ${mcLower}. The felt and public worlds are in tune here.`;
  }
  if (ascSame) {
    return `Both ASCs land in ${ascLower} — the felt language of the place is shared. The MCs differ, so your public ambitions point in different directions here.`;
  }
  if (mcSame) {
    return `Both MCs land in ${mcLower} — your public bearings point the same way here. The ASCs differ, so the felt experience varies between you.`;
  }
  return "Different elements on every angle — this place asks two different things from each of you.";
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function numOr(...candidates: Array<unknown>): number {
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return c;
  }
  return 0;
}

function arrayOr<T>(...candidates: Array<unknown>): T[] {
  for (const c of candidates) {
    if (Array.isArray(c)) return c as T[];
  }
  return [] as T[];
}

function pickStringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") as string[] : [];
}

function resolveGoals(raw: unknown): GoalId[] {
  if (!Array.isArray(raw)) return ["romance", "career"];
  const valid: GoalId[] = [
    "identity", "wealth", "home", "romance", "health", "partnerships", "career", "friendship", "spirituality",
    "love", "community", "relocation", "growth", "timing",
  ];
  const filtered = (raw as unknown[])
    .map((g) => String(g).toLowerCase())
    .filter((g): g is GoalId => valid.includes(g as GoalId));
  return filtered.length ? filtered : ["romance", "career"];
}

function equalCusps(): number[] {
  return [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
}

function normalizePlanets(raw: unknown): Array<{ planet: string; longitude: number }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p: any) => {
      const longitude = typeof p.longitude === "number" ? p.longitude : NaN;
      const rawName = (p.planet ?? p.name ?? "").toString();
      if (!Number.isFinite(longitude) || !rawName) return null;
      return { planet: capitalize(rawName), longitude };
    })
    .filter((x): x is { planet: string; longitude: number } => x !== null);
}

function signFromLon(lon: number): string {
  const idx = Math.floor((((lon % 360) + 360) % 360) / 30);
  return ZODIAC[idx] ?? "Aries";
}

function houseFromLon(lon: number, cusps: number[]): number {
  if (!cusps || cusps.length !== 12) return 1;
  const l = ((lon % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const start = ((cusps[i] % 360) + 360) % 360;
    const end   = ((cusps[(i + 1) % 12] % 360) + 360) % 360;
    const inside = start <= end ? l >= start && l < end : l >= start || l < end;
    if (inside) return i + 1;
  }
  return 1;
}

function angularDistance(a: number, b: number): number {
  const diff = ((a - b) % 360 + 360) % 360;
  return Math.min(diff, 360 - diff);
}

/** Format a longitude (0–360°) as "24° Aries" for display. */
function fmtSignDeg(lon: number): string {
  const within = ((lon % 30) + 30) % 30;
  return `${Math.floor(within)}° ${signFromLon(lon)}`;
}

/** Extract the sign from a `fmtSignDeg` string ("24° Aries" → "Aries"). */
function signOfFmt(formatted: string): string {
  const m = formatted.match(/[A-Z][a-z]+$/);
  return m ? m[0] : formatted;
}

function relocAngle(lon: unknown): { sign: string; deg: number } {
  const n = typeof lon === "number" && Number.isFinite(lon) ? lon : 0;
  const within = ((n % 30) + 30) % 30;
  return { sign: signFromLon(n), deg: Math.floor(within) };
}

function degMin(lon: number): string {
  const within = ((lon % 30) + 30) % 30;
  const deg = Math.floor(within);
  const min = Math.floor((within - deg) * 60);
  return `${deg}°${min.toString().padStart(2, "0")}′`;
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function stripAmpersand(s: string): string {
  return s.split(" &")[0];
}

function shortenWindow(s: string): string {
  const dash = s.indexOf(" — ");
  return dash > 0 ? s.slice(0, dash) : s;
}

// TODO(couples): persist a real travel-date range on the synastry reading
// record. Today the model has a single travelDate; we synthesise a ±5-day
// window so the magazine layout has something to render. Replace once the
// wizard captures a range.
function formatDateRange(travelDate: unknown): string {
  if (typeof travelDate !== "string") return "DATES TBD";
  const d = new Date(travelDate);
  if (isNaN(d.getTime())) return "DATES TBD";
  const start = new Date(d.getTime() - 5 * 86_400_000);
  const end   = new Date(d.getTime() + 5 * 86_400_000);
  const fmt = (x: Date) => x.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  return `${fmt(start)} — ${fmt(end)}, ${d.getFullYear()}`;
}
