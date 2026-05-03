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

export type GoalId = "love" | "career" | "community" | "relocation" | "growth" | "timing";

export interface PartnerEventScore {
  event: string;
  you: number;
  partner: number;
}

export interface StandoutPlacement {
  planet: string;
  sign: string;
  degree: string;
  house: string;
  note: string;
}

export interface SynastryAspectVM {
  p1: string;
  p2: string;
  aspect: string;
  orb: number;
  meaning: string;
}

export interface ChartTabVM {
  planets: Array<{ planet: string; longitude: number }>;
  cusps: number[];
  macroScore: number;
  element: string;
  modality: string;
  standout: StandoutPlacement[];
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
  love:       ["Romance & Love", "Partnerships & Marriage"],
  career:     ["Career & Public Recognition", "Wealth & Financial Growth"],
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

// Per-(planet × house) one-line implications for relocated standouts.
// Generic templated fallback used when no specific entry exists.
const STANDOUT_NOTES: Record<string, string> = {
  "Sun-10":     "MC-conjunct here — public visibility runs hot.",
  "Sun-1":      "Sun rising — you'll be seen as the version of you who shows up here.",
  "Sun-7":      "Sun on the DSC — relationships do the talking in this city.",
  "Sun-4":      "Sun on the IC — private life expands; public life softens.",
  "Moon-1":     "Moon rising — emotions sit on the surface here.",
  "Moon-4":     "Moon on the IC — felt sense of home arrives faster than expected.",
  "Moon-10":    "Moon on the MC — career feeds on emotional weather.",
  "Venus-7":    "Venus on the DSC — partnership is the headline; this is a love stop.",
  "Venus-9":    "Venus in 9H — romance asks for movement, not nesting.",
  "Venus-4":    "Venus on the IC — affection deepens the longer you stay still.",
  "Mars-1":     "Mars rising — you'll move fast here, take physical risks.",
  "Mars-3":     "Mars in 3H — sharp tongue, fast recovery. Don't take heat personally.",
  "Mars-10":    "Mars on the MC — driven, visible, spikey at work.",
  "Jupiter-9":  "Jupiter in 9H — long walks, language pickup, low-key opportunity.",
  "Jupiter-10": "Jupiter on the MC — career luck swings up; put your name on things.",
  "Saturn-1":   "Saturn rising — body tightens; sleep, structure, fewer plans.",
  "Saturn-10":  "Saturn on the MC — the work demands more than usual; reputation hardens.",
  "Saturn-4":   "Saturn on the IC — home life feels like a project to get right.",
  "Mercury-3":  "Mercury in 3H — talking, writing, errands all run faster here.",
  "Neptune-12": "Neptune in 12H — dreams loud, edges soft. Pace the social calendar.",
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

  // ── Deep Dive: per-partner chart VMs ──────────────────────────
  const youCusps: number[]  = arrayOr<number>(reading.userRelocatedCusps, reading.relocatedCusps, equalCusps());
  const ptnrCusps: number[] = arrayOr<number>(reading.partnerRelocatedCusps, equalCusps());
  const youPlanets  = normalizePlanets(reading.natalPlanets);
  const ptnrPlanets = normalizePlanets(reading.partnerNatalPlanets);

  const youDeep: ChartTabVM = {
    planets: youPlanets,
    cusps: youCusps,
    macroScore: youScore,
    element: dominantElement(youPlanets),
    modality: dominantModality(youPlanets),
    standout: topStandoutPlacements(youPlanets, youCusps, destination),
  };
  const ptnrDeep: ChartTabVM = {
    planets: ptnrPlanets,
    cusps: ptnrCusps,
    macroScore: partnerScore,
    element: dominantElement(ptnrPlanets),
    modality: dominantModality(ptnrPlanets),
    standout: topStandoutPlacements(ptnrPlanets, ptnrCusps, destination),
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
    },
    deepDive: {
      you: youDeep,
      partner: ptnrDeep,
      synastry: { harmonious, tense },
      partnerName,
    },
    geodetic: {
      you:     { ascSign: youAsc.sign,  ascDeg: youAsc.deg,  mcSign: youMc.sign,  mcDeg: youMc.deg,
                 note: relocNote(youDeep.standout, "you", destination) },
      partner: { ascSign: ptnrAsc.sign, ascDeg: ptnrAsc.deg, mcSign: ptnrMc.sign, mcDeg: ptnrMc.deg,
                 note: relocNote(ptnrDeep.standout, "partner", destination) },
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

/** Top 3 placements by editorial weight: angular planets first (within 8°
 *  of any angle), then luminaries by tightness, then dignified planets. */
export function topStandoutPlacements(
  planets: Array<{ planet: string; longitude: number }>,
  cusps: number[],
  _destination: string,
): StandoutPlacement[] {
  void _destination;
  const angles = [cusps[0], cusps[3], cusps[6], cusps[9]].filter((n) => typeof n === "number");
  const scored = planets.map((p) => {
    const sign = signFromLon(p.longitude);
    const house = houseFromLon(p.longitude, cusps);
    let score = 0;

    const angleOrb = angles.length
      ? Math.min(...angles.map((a) => angularDistance(p.longitude, a)))
      : 999;
    if (angleOrb <= 8) score += 50 - angleOrb * 5;

    if (p.planet === "Sun" || p.planet === "Moon") score += 30;
    if (p.planet === "Mars" || p.planet === "Saturn" || p.planet === "Jupiter") score += 10;

    return { p, sign, house, score };
  });
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map(({ p, sign, house }): StandoutPlacement => {
    const houseLabel = HOUSE_LABEL[house] ?? "";
    const noteKey = `${p.planet}-${house}`;
    const note = STANDOUT_NOTES[noteKey] ??
      `${p.planet} in ${sign} sits in ${ordinal(house)} house here — ${houseLabel.toLowerCase()} territory.`;
    return {
      planet: p.planet,
      sign,
      degree: degMin(p.longitude),
      house: `${house}H ${houseLabel}`,
      note,
    };
  });
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
  return { p1, p2, aspect, orb, meaning };
}

function relocNote(standout: StandoutPlacement[], _which: "you" | "partner", destination: string): string {
  void _which;
  if (!standout.length) return `${destination} amplifies parts of the chart that aren't angular.`;
  const top = standout[0];
  return top.note;
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
  if (!Array.isArray(raw)) return ["love", "career"];
  const valid: GoalId[] = ["love", "career", "community", "relocation", "growth", "timing"];
  const filtered = (raw as unknown[])
    .map((g) => String(g).toLowerCase())
    .filter((g): g is GoalId => valid.includes(g as GoalId));
  return filtered.length ? filtered : ["love", "career"];
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
