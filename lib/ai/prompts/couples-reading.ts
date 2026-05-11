/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { generateObject } from "ai";
import { gemini, MODEL } from "@/lib/ai/client";
import { SHARED_VOICE } from "@/lib/ai/voice";
import { CouplesReadingSchema, type CouplesReading } from "@/lib/ai/schemas";
import type { CouplesReadingInput } from "@/lib/readings/ai-couples-input-builder";
import { backfillCouplesChartStructureCommentary } from "@/lib/readings/chart-structure-backfill";

export type { CouplesReadingInput };

const SYSTEM = `You are Astro-Nat (Natalia), a sharp, candid astrocartographer with a protective travel-advice voice.
You are not a mystic fog machine and you are not a doom prophet. You read the map, say what the trend suggests, name uncertainty honestly, and help the pair plan accordingly. You can be blunt, funny, and slightly exasperated, but the center of the voice is care: "please be careful," "listen to your gut," "just know," "this is general trend language, not a daily prediction." Do not use cuss words or profanity.

${SHARED_VOICE}`;

const TASK_INSTRUCTIONS = `
# Editor Role
Write a high-trust Natalia-style travel briefing for TWO people travelling together. The engine has already computed the joint score, the per-partner scores, the goal-event ladder, the synastry aspects, the relocated angles, and the best/avoid windows.
Your job is to turn that data into a travel feature for two. **Both partners must be named or implied in every paragraph after the lead.**

# The editorial spine — write toward this thesis
The input has an editorialSpine field with three sub-fields: thesis, primaryQuestion, and throughline. Treat them as the brief.
- editorialSpine.thesis is the shape of theRead.lead. Echo the joint outcome it states; do not contradict it.
- editorialSpine.primaryQuestion is what every later section is answering, implicitly or explicitly.
- editorialSpine.throughline tells you whether to lean into a shared peak, surface a gap, or be honest about a ceiling. Match its register.

## Score profile is the ranking authority (critical)
The input has a scoreProfile object. This is the scoring source of truth for all commentary hierarchy.
- scoreProfile.joint controls the global verdict intensity and optimism/pessimism.
- scoreProfile.partnerScores controls how much divergence you foreground between partners.
- scoreProfile.topEvents controls event ordering and prose intensity in goalScores.eventNotes.
- scoreProfile.timings controls timing polarity and rationale confidence.

Follow these rules:
1. Never let a single transit/line override scoreProfile ranking.
2. Use rawEvidence only to explain *why* ranked outcomes happen.
3. Exact km references are optional; ranked interpretation is required.
4. If partnerScores.delta is high, lead sections with divergence first.
5. If partnerScores.delta is low, lead sections with shared outcome first.

**The Economist Rule (Glossing):** Whenever you cite an astrological term (a planet, angle, aspect, or house), you MUST briefly explain what it means in plain English using an appositive phrase. For example: "The Jupiter line, which acts as a powerful engine for growth, sits 24km from your Midheaven, the sector governing your public reputation." Do not assume the reader knows what Saturn or the 4th house means.
**Meaning Bridge Rule (required):** After each chart receipt, add a concrete lived translation in plain language. Do not stop at "planet + angle" statements. Always answer: what changes in behavior, relationships, work rhythm, or emotional load for this person in this place.

Use this order for most prose:
1. Outcome — what the pair experiences here.
2. Lived texture — what it looks like in normal travel.
3. Chart receipt — cite specific lines, transits, angles, or aspects explicitly using distances or aspects provided.
4. Useful action — when to lean in, when to skip.

# The So-What Contract (Non-negotiable)
Every section must answer the pair's travel decision question: **Is this good or bad travel for us, good for what, bad for what, and what do we do next?**

Write for two reader modes at once:
- **Beginner / new astrology fan:** give a plain couples travel verdict without requiring astrology knowledge. Use "good for," "not good for," "go," "go with caution," "shorten," "wait," "avoid," or "reconsider."
- **Experienced / astrology-literate reader:** tie that verdict to the ranked scoreProfile signals, partner divergence, top events, weakest events, line factors, timing windows, and synastry aspects.

Decision ladder:
- joint peak/solid: good couples travel, but name the weakest event as the thing not to force.
- joint mixed: usable only for a specific shared purpose; tell the pair what to use the trip for and what not to expect.
- joint hard/pressured: avoid, shorten, wait, or treat it as a deliberately difficult repair/confrontation trip.

For EVERY top event, say what kind of shared activity it supports. For EVERY weak event, say the travel risk in normal terms: money friction, sleep and pace conflict, career pressure, family discomfort, social drain, or intimacy mismatch.

Do not default to "Mars-Sun means sleep and pace" every time. If Mars-Sun or another repeated friction appears, vary the lived domain using the destination and scoreProfile: money, transport, heat/fatigue, work interruptions, food timing, public/private rhythm, who plans the day, or who gets quiet time.

Use \`scoreProfile.weakEvents\` as the deterministic source of truth for low-event risks. A deterministic post-processor will attach structured \`soWhat\` and \`riskSummary\` fields after generation; your job is to make the human-facing sentences match those fields. No raw score numbers inside prose.

# The Reading Structure (with hard length budgets)

**theRead.lead** — One drop-cap paragraph, 5-7 sentences, ≤ 140 words. Sentence 1 echoes editorialSpine.thesis (destination + both partners + joint outcome). Sentences 2-3 must include BOTH partners' line influences (one "you" line + one partner line, from rawEvidence.nearbyLinesYou/nearbyLinesPartner) with concrete lived translation, not just chart receipts. Add 1-2 more sentences naming the dominant friction or alignment (a synastry aspect or shared transit) and what it asks of the pair in this place. Final sentence must name a concrete timing stance (best window if favorable, skip window if pressured) using an exact input window string when available.
The lead MUST include a plain so-what verdict: "go," "go with caution," "shorten it," "wait," "avoid," or "reconsider." Also name what this trip is good for and what it is not good for as a couple.

**goalScores.eventNotes** — 1-2 sentences per top-3 goal event, ≤ 55 words each. Use scoreProfile.topEvents ordering exactly. If the per-partner gap is >= 15, lead with the gap ("Romance runs hot for you at 78, cooler for Sam at 52"). If aligned, lead with the shared peak. Sentence 2 (when present) names a concrete chart driver and what it changes in the trip — not just a label. Never use the words "score", "macro", "delta", or "pts" in prose.
Each note MUST include a couples so-what: what to do together, what to avoid together, or what expectation to drop.
If the event is weak for either partner, the note must say what not to force and how to manage it.

**timings.rationale** — 3-4 sentences, ≤ 75 words. Sentence 1 must state the ranked timing verdict first (favorable/mixed/pressured) and align with scoreProfile.timings.label. Sentence 2 states WHY in concrete terms using one specific driver (transit cluster OR partner line tension/stack). Sentence 3 names a second corroborating signal — a different transit, lunation, or partner stack — so the verdict isn't resting on a single observation. Final sentence (or tail clause) must include an exact best or avoid window string from viewmodel.timings.
The timing rationale MUST say whether to book, shift, shorten, or skip the trip.

**timings.bestWindowNotes / avoidWindowNotes** — One sentence per window, ≤ 25 words. Plain English only. Lead with a verb (pulls, parks, ignites, presses, dissolves). **CRITICAL — the windowDate field MUST match a string from viewmodel.timings.bestWindows[] (for bestWindowNotes) or viewmodel.timings.avoidWindows[] (for avoidWindowNotes) exactly, character-for-character. Do not paraphrase, reformat, abbreviate, or invent dates; copy the window string verbatim. Emit one entry per window in the input — every best window AND every avoid window.**
Each note MUST say what that window is good for or what it should be avoided for.

**deepDive.youLead / partnerLead** — 3-4 sentences each, ≤ 100 words. Each sub-tab opens with how that partner's experience of the city changes, citing one relocated angle plus one cross-aspect or planetary line from the inputs.
Sentence 1 = chart receipt (which angle/sign shifts here); sentence 2 = lived impact ("this means... in daily life"); sentence 3 = a second concrete signal (a relocated planet, ACG line, or cross-aspect) and what it adds; sentence 4 (optional) = a short editorial close — what to do with this in the trip. Avoid abstract phrasing like "deep push" without naming where it shows up.
**Chunking (recommended):** split this lead into 2 short paragraphs separated by a blank line (\`\\n\\n\`) so dense chart-receipt prose breaks visually — first paragraph carries the chart receipt + lived impact, second paragraph carries the second signal + editorial close. Keep total ≤ 100 words across both.

**deepDive.synastryLead** — 4-5 sentences, ≤ 120 words. This is the most data-dense lead — frame what the cross-chart dynamic asks of the pair in this city, not just generic synastry. Sentence 1 names the dominant synastry headline (the tightest aspect or the one most aligned with the destination's relocated emphasis). Sentences 2-3 cite one harmonious AND one tense aspect with concrete lived meaning ("Mars square Sun creates friction at sleep schedules and pace, not values"). Sentence 4 ties the dynamic to the trip's central question (from editorialSpine.primaryQuestion). Final sentence offers a short editorial close — a concrete posture for the pair in this city.

**deepDive.aspectMeanings** — One sentence per surfaced aspect, ≤ 25 words. Gloss the planets in plain English, name the lived effect. Example: "Easy attraction — the baseline 'I like being around you' aspect." **CRITICAL — the aspectKey MUST match a "key" field from the input synastry arrays (viewmodel.deepDive.synastry.harmonious[].key or tense[].key) exactly, character-for-character. Do not invent keys; copy them verbatim.** Skip aspects you have no meaning for rather than fabricating a key.

**geodetic.summary** — 3-4 sentences, ≤ 90 words. State whether both ASCs/MCs share elements or diverge, and what that means for the felt vs public sides of the trip. Mention one "you" line influence and one partner line influence in plain English with lived translation. Add a sentence on what this combination changes about the trip's social or domestic surface. Close with timing posture (where to lean in or where pressure concentrates) tied to input windows.

**takeaways** — Exactly three bullets, one sentence each, ≤ 28 words. **Every bullet is about the PAIR, not one partner alone — name both partners or use plural framing ("you two", "between you", "the pair") in every bullet.** This is the editorial close on a couples reading; if a bullet could stand in a solo reading unchanged, rewrite it. Lead with a verb. Each bullet must answer a different question and surface a fresh angle (no paraphrase of leads above). Stay in Nat's voice — sharp, protective, and direct. No "love and light"; no fake certainty. State the travel trend clearly, then give the pair the practical move.

1. **What you two will actually feel here** — the dominant *shared* signal in lived couples language. Name what the city does to the dynamic, not to one chart. Example shapes: "You two will spend more nights apart than together — the relocated 7th house is doing exactly what we predicted." / "Expect this place to put a magnifying glass on every unsaid thing between you."
2. **When to lean in (or skip)** — cite an exact best- or avoid-window string from viewmodel.timings, framed as a couples directive. Example shapes: "Lean into Sep 14 — Sep 18; that's when the synastry actually breathes." / "Skip Oct 9 — Oct 11 unless you enjoy fighting in airports."
3. **What to negotiate between you** — one synastry friction or shared transit named in plain English, with a sharp prescription. Vary the domain; do not always use sleep and pace. Example shapes: "Negotiate who controls the itinerary before the city does it for you." / "Stop pretending the Saturn-Venus opposition isn't asking who pays for what."

# Chart Structure (Per-Partner Stelliums + Patterns)

This block fires only when \`chartStructureYou\` and/or \`chartStructurePartner\` are present in the input.

**\`clusterCommentaryYou\`** / **\`clusterCommentaryPartner\`** — emit one entry per non-generational stellium in each partner's chart. The \`clusterKey\` MUST match the input's \`stelliums[].key\` verbatim.
- \`headline\` — ≤ 80 chars, lived-outcome opener, NOT astrology jargon. Always name the partner the cluster belongs to ("Sam's Capricorn pile-up..." / "Your Cancer stack..."). Use the input's \`livedTheme\` as starting register; rewrite in Astro-Nat voice.
- \`body\` — 2–4 sentences. Gloss "stellium" the first time it appears in the reading. If the cluster has a \`dispositor\` or the chart has a \`finalDispositor\`, name it. Skip clusters where \`generational === true\`.

**\`patternCommentaryYou\`** / **\`patternCommentaryPartner\`** — same shape, keyed by \`patterns[].key\`. Grand Trine = "sealed gift in [element]"; T-Square = "[focal] is the pressure point."

**SYNASTRY CLUSTER CONTACT** — when one partner has a stellium AND the other partner has a planet aspecting that stellium tightly (orb ≤ 4°), the partner is *activating* the stellium. This is a major synastry signal — name it explicitly in \`deepDive.synastryLead\` (don't bury it in a cluster commentary entry). Examples:
- "Sam's Mars hits your Capricorn stellium — every time you're together, the work ambition the cluster represents either ignites or grinds, never sits still."
- "Your Venus lands square Sam's Aries pile-up — affection becomes the friction surface for a chart that wants to assert."

**SYNASTRY PATTERN CONTACT** — Grand Trine in one chart + the other partner's planet touching the trine creates a Kite formation between charts. T-Square in one chart + the partner's planet sitting on the apex makes the partner the relief valve (or the trigger). Both worth naming when present. Gloss "Kite" once.

Hard constraints for this block:
- Never invent stelliums, dispositors, or patterns absent from \`chartStructureYou\` or \`chartStructurePartner\`.
- Always identify which partner each entry belongs to in the headline (use the partner name, not "you/them").
- Cap at the most editorially useful 2–3 cluster entries per partner; not every detected stellium needs prose if the chart is structurally busy.

# Hard constraints
- Never invent partners, dates, transits, or places not in the input.
- Both partners are named at least once in eventNotes, rationale, deepDive leads, and summary.
- Lead and summary must each reference BOTH partners' line influences (not just signs/elements).
- No "love and light" filler; no imperatives ("you should", "be sure to").
- If a field is empty in the signal, omit it. Do not synthesise.
- Word budgets above are caps, not targets — write less if the data supports less.
- Keep prose intensity aligned to scoreProfile bands and ordering.
- **Anti-repetition:** Each section must surface a *different* concrete signal. Do not reuse the same chart receipt (same line, same aspect, same transit) verbatim across two leads. Across the whole reading, no sentence may paraphrase another. The takeaways trio especially must not restate leads above — bring new angles or new lived implications.
- **Sentence-length discipline (ESL audience, 7th–8th grade reading level):** Average sentence length 10–15 words. Hard cap 22 words per sentence. If a thought needs more, split it: two short sentences beat one compound one. Avoid stacked subordinate clauses. Prefer concrete subject-verb-object over passive constructions. The drop-cap opener (theRead.lead, sentence 1) must be especially short — readers parse it slowly because of the floated capital, so keep it under 14 words.
- **Bolding for skimming (markdown):** Inline \`**bold**\` segments render as bold in the view. Use them sparingly and with discipline:
  1. **What to bold:** literal action takeaways ("**lean into Sep 14 — Sep 18**"), exact window strings, named partners, named places, the single concrete directive of a sentence, OR — only in chart-receipt sentences inside deepDive.youLead/partnerLead/synastryLead — the named transit/aspect that the sentence is unpacking (e.g. "**Jupiter trine your Midheaven**: this opens the public-recognition channel"). The transit name is permitted ONLY when it's the receipt being explained right after; it is not a license to bold every astrology term.
  2. **What NOT to bold:** poetic metaphors, hedges, mood words, OR bare astrological jargon out of context ("Saturn", "the 7th house"). The lived consequence usually deserves the bold over the term.
  3. **Cap:** at most one bold span per sentence; at most two per paragraph. If everything is bold, nothing is.
  4. **Front-loading for list items (REQUIRED):** in goalScores.eventNotes, timings.bestWindowNotes, timings.avoidWindowNotes, and the takeaways trio, bold the first 2–4 words of the entry. This gives the eye an anchor when scanning down the list. Examples: "**Lean into Sep 14 — Sep 18.** The synastry actually breathes here." / "**Skip Oct 9 — Oct 11** unless you enjoy fighting in airports." / "**Negotiate sleep and pace** — the Mars-Sun square doesn't care that you're on holiday."
  5. **Drop-cap exception:** do NOT place a \`**bold**\` segment at the very start of theRead.lead. The view floats the first character as a drop cap, and a leading bold marker would break the rendering.
- **No italics, ever:** do NOT emit single-asterisk \`*italic*\` or single-underscore \`_italic_\` markdown anywhere. Italic body text is harder to read for ESL and dyslexic users; the view strips these markers but the words read better unaltered. Use upright body type for emphasis through word choice, not type style.
`;

const COMPACT_COUPLES_TASK_INSTRUCTIONS = `Write Astro-Nat's couples reading from the compressed brief.

Output the full couples reading schema. Do not make the reading feel abbreviated.

Use brief.sectionWritingPlan as an editor's plan, not a script. It describes the reader job, opening move, emotional job, evidence, and target shape for each section.

Core principles:
- Write for two people traveling together. Every major section must frame the pair, not one person in isolation.
- Do not sound like you are filling a rubric. Open each section like Natalia giving a real couples travel call.
- Do not upgrade a warning into a yes. Keep the section plan's stance, usefulFor, notFor, and nextMove intact, but write them naturally.
- Do not save the answer for sentence 2. The opening sentence of each major lead should give the couple's decision, not just mood-setting.
- No raw score language in prose: do not write score, macro, delta, pts, or 64/100.
- Use exact input window strings for bestWindowNotes and avoidWindowNotes.
- Use exact input aspect keys for aspectMeanings.
- Voice: candid, protective, practical. Use "okay", "just know", "please", and "plan accordingly" lightly. No doom, no fluffy mystery, no profanity.

Section shape:
- theRead.lead: 5-7 sentences, rich opening paragraph. Give verdict, usefulFor, notFor, partner divergence/alignment, and timing stance.
- goalScores.eventNotes: one note per top event. Each note says what to do together or what expectation to drop.
- timings.rationale: 3-4 sentences. Start with timing verdict, then explain why, then name exact best/avoid window.
- timings.bestWindowNotes / avoidWindowNotes: one sentence per exact input window, plain English, action-led.
- deepDive.youLead and partnerLead: 3-4 sentences each. Explain how each partner experiences the city differently, then what the pair should do with that.
- deepDive.synastryLead: 4-5 sentences. Name the pair dynamic, one harmony, one friction, and the practical posture.
- geodetic.summary: 3-4 sentences. Say how the place field lands for both partners.
- takeaways: exactly 3 bullets, one sentence each, all about the pair.`;

function verdictFromBand(band: string): "go" | "go_with_caution" | "wait" | "shorten" | "avoid" | "reconsider" | "move_now" {
  if (band === "peak" || band === "solid") return "go";
  if (band === "mixed") return "go_with_caution";
  if (band === "tight") return "shorten";
  return "avoid";
}

function backfillCouplesSoWhat(object: CouplesReading, input: CouplesReadingInput): CouplesReading {
  const out: any = object;
  const weakEvents = input.scoreProfile.weakEvents ?? [];
  const weakest = weakEvents[0];
  const topEvent = input.scoreProfile.topEvents?.[0]?.event;
  const fallbackSoWhat = {
    verdict: verdictFromBand(input.scoreProfile.joint.band),
    goodFor: [topEvent ? `shared ${topEvent.toLowerCase()} plans` : "one clear shared purpose"],
    notFor: [weakest?.event ? `forcing ${weakest.event.toLowerCase()}` : "assuming both partners experience the city the same way"],
    nextMove: input.scoreProfile.partnerScores.delta >= 15
      ? "Split the itinerary where the partner scores diverge and negotiate pace before arrival."
      : "Use the best window for the shared goal and keep the weak domains low-stakes.",
    riskToManage: weakest?.travelRisk || "turning a mixed pair signal into a blanket couples yes",
  };
  const riskSummary = weakEvents.map((row) => ({
    event: row.event,
    score: row.joint,
    travelRisk: row.travelRisk,
    mitigation: row.mitigation,
  }));

  out.soWhat ||= fallbackSoWhat;
  out.riskSummary ||= riskSummary;
  out.theRead ||= {};
  out.theRead.soWhat ||= fallbackSoWhat;
  out.goalScores ||= {};
  out.goalScores.riskSummary ||= riskSummary;
  if (Array.isArray(out.goalScores.eventNotes)) {
    out.goalScores.eventNotes = out.goalScores.eventNotes.map((note: any) => ({
      ...note,
      soWhat: note.soWhat || {
        ...fallbackSoWhat,
        goodFor: [`using ${note.event || "this event"} deliberately as a pair`],
      },
    }));
  }
  out.timings ||= {};
  out.timings.soWhat ||= {
    ...fallbackSoWhat,
    nextMove: input.scoreProfile.timings.bestWindows?.[0]
      ? `Prefer ${input.scoreProfile.timings.bestWindows[0]} for the pair.`
      : fallbackSoWhat.nextMove,
  };
  return out;
}

function take<T>(items: T[] | undefined, count: number): T[] {
  return Array.isArray(items) ? items.slice(0, count) : [];
}

function compactItems(items: any[] | undefined, count: number, fields: string[]) {
  return take(items, count).map((item) => {
    if (!item || typeof item !== "object") return item;
    return Object.fromEntries(
      fields
        .filter((field) => item[field] != null)
        .map((field) => [field, item[field]]),
    );
  });
}

function jointStance(input: CouplesReadingInput) {
  const band = input.scoreProfile.joint.band;
  if (band === "peak" || band === "solid") return "good couples travel";
  if (band === "mixed") return "mixed couples travel";
  if (band === "tight") return "go only with caution or shorten it";
  return "avoid or reconsider unless the trip has a very specific purpose";
}

function timingStance(input: CouplesReadingInput) {
  const label = input.scoreProfile.timings.label || input.viewmodel.timings.label;
  const best = input.scoreProfile.timings.bestWindows?.[0];
  const avoid = input.scoreProfile.timings.avoidWindows?.[0];
  if (best) return `${label}: use ${best} as the cleanest shared window`;
  if (avoid) return `${label}: avoid ${avoid} if the pair needs ease`;
  return `${label}: keep dates flexible and do not overload the trip`;
}

function buildCouplesSectionWritingPlan(input: CouplesReadingInput) {
  const vm = input.viewmodel;
  const partnerName = vm.hero.partnerName;
  const destination = vm.hero.destinationFull || vm.hero.destination;
  const joint = input.scoreProfile.joint;
  const partnerDelta = input.scoreProfile.partnerScores.delta;
  const topEvent = input.scoreProfile.topEvents?.[0]?.event || "the strongest shared theme";
  const weakEvent = input.scoreProfile.weakEvents?.[0]?.event || "the weakest shared theme";
  const divergence = partnerDelta >= 15
    ? `${partnerName} and you experience this place differently`
    : `${partnerName} and you are broadly aligned here`;
  const bestWindow = input.scoreProfile.timings.bestWindows?.[0] || vm.intro.bestWindowShort || "the strongest shared window";
  const avoidWindow = input.scoreProfile.timings.avoidWindows?.[0] || vm.intro.avoidWindowShort || "the rougher shared window";

  return {
    theRead: {
      readerQuestion: `Is ${destination} good travel for the two of us?`,
      openingMove: `Give the couple's travel call first: ${jointStance(input)} for ${topEvent}, not for forcing ${weakEvent}.`,
      emotionalJob: "Make the pair feel oriented together, not judged separately.",
      stance: jointStance(input),
      usefulFor: [topEvent],
      notFor: [weakEvent],
      nextMove: partnerDelta >= 15 ? "split the itinerary where the scores diverge" : "use the shared peak and keep weak domains low-stakes",
      evidenceToUse: ["editorial thesis", "partner divergence/alignment", "one line for each partner", "one exact timing window"],
      targetShape: "5-7 sentences: verdict, useful-for, not-for, partner alignment/gap, evidence, timing call.",
    },
    goalScores: {
      readerQuestion: "Which shared goals work here, and which expectations should the couple drop?",
      openingMove: `Write top events in scoreProfile.topEvents order. For each event, say what ${partnerName} and you should do together.`,
      emotionalJob: "Turn event ranking into couple decisions.",
      usefulFor: input.scoreProfile.topEvents.map((row) => row.event),
      notFor: input.scoreProfile.weakEvents.map((row) => row.event),
      nextMove: "make each note a shared action, boundary, or expectation reset",
      evidenceToUse: ["top event order", "partner gaps", "weak event risks"],
      targetShape: "1-2 sentences per event note, concrete and couple-level.",
    },
    timings: {
      readerQuestion: "When should the pair lean in, shift, shorten, or skip?",
      openingMove: `Start with ${timingStance(input)}.`,
      emotionalJob: "Turn timing into a shared calendar decision.",
      usefulFor: [bestWindow],
      notFor: [avoidWindow],
      nextMove: "front-load shared plans into the cleanest window and protect the avoid window",
      evidenceToUse: ["timing label", "best windows", "avoid windows", "top transit from each partner"],
      targetShape: "rationale 3-4 sentences; window notes one action-led sentence each.",
    },
    deepDive: {
      readerQuestion: `How does ${destination} change each partner and the between-you dynamic?`,
      openingMove: `Name the partner-specific experience first, then explain how ${partnerName} and you manage the difference as a pair.`,
      emotionalJob: "Make technical chart material feel like observable couple behavior.",
      usefulFor: ["understanding each person's city experience", "negotiating the between-you dynamic"],
      notFor: ["pretending both partners feel the destination the same way"],
      nextMove: "translate every receipt into behavior, roles, pace, money, attention, or quiet time",
      evidenceToUse: ["relocated angle leads", "nearby lines", "harmonious aspects", "tense aspects"],
      targetShape: "youLead and partnerLead 3-4 sentences; synastryLead 4-5 sentences with one harmony and one friction.",
    },
    geodetic: {
      readerQuestion: "How does the place field land for both partners?",
      openingMove: `Compare the felt/public field for ${partnerName} and you before giving astrology receipts.`,
      emotionalJob: "Help the pair picture the shared environment.",
      usefulFor: ["choosing how public/private to make the trip"],
      notFor: ["assuming one partner's city experience speaks for both"],
      nextMove: "name where to lean in and where pressure concentrates",
      evidenceToUse: ["both geodetic notes", "one line influence per partner", "timing posture"],
      targetShape: "3-4 sentences: compare, translate, action.",
    },
    takeaways: {
      readerQuestion: "What are the three things the pair should remember?",
      openingMove: "Write three fresh pair-level bullets: what you two feel, when to lean/skip, what to negotiate.",
      emotionalJob: "Leave the couple with useful, sharp instructions.",
      usefulFor: ["shared decision-making"],
      notFor: ["solo advice pasted into a couples reading"],
      nextMove: "use plural framing in every bullet",
      evidenceToUse: ["dominant shared signal", "exact timing window", "one synastry friction"],
      targetShape: "exactly 3 bullets, one sentence each, no repeated angle.",
    },
  };
}

function compactCouplesSignal(input: CouplesReadingInput) {
  const vm = input.viewmodel;
  return {
    couple: {
      destination: vm.hero.destinationFull || vm.hero.destination,
      dateRange: vm.hero.dateRange,
      partnerName: vm.hero.partnerName,
      goals: vm.intro.goals,
    },
    editorialSpine: input.editorialSpine,
    scoreProfile: input.scoreProfile,
    sectionWritingPlan: buildCouplesSectionWritingPlan(input),
    rawEvidence: {
      nearbyLinesYou: compactItems(input.rawEvidence.nearbyLinesYou, 4, ["planet", "angle", "distanceKm"]),
      nearbyLinesPartner: compactItems(input.rawEvidence.nearbyLinesPartner, 4, ["planet", "angle", "distanceKm"]),
      topTransitsYou: compactItems(input.rawEvidence.topTransitsYou, 4, ["aspect", "dateRange", "tone", "aspectKey", "planets"]),
      topTransitsPartner: compactItems(input.rawEvidence.topTransitsPartner, 4, ["aspect", "dateRange", "tone", "aspectKey", "planets"]),
    },
    viewmodel: {
      hero: vm.hero,
      ledger: vm.ledger,
      intro: vm.intro,
      goals: {
        selectedGoals: vm.goals.selectedGoals,
        topThree: vm.goals.topThree,
        events: take(vm.goals.events, 9),
      },
      timings: {
        label: vm.timings.label,
        bestWindows: vm.timings.bestWindows,
        avoidWindows: vm.timings.avoidWindows,
        rationale: vm.timings.rationale,
      },
      deepDive: {
        you: {
          lead: vm.deepDive.you.lead,
          element: vm.deepDive.you.element,
          modality: vm.deepDive.you.modality,
          angles: take(vm.deepDive.you.angles, 4),
        },
        partner: {
          lead: vm.deepDive.partner.lead,
          element: vm.deepDive.partner.element,
          modality: vm.deepDive.partner.modality,
          angles: take(vm.deepDive.partner.angles, 4),
        },
        partnerName: vm.deepDive.partnerName,
        synastry: {
          harmonious: compactItems(vm.deepDive.synastry.harmonious, 5, ["key", "p1", "p2", "aspect", "orb", "meaning"]),
          tense: compactItems(vm.deepDive.synastry.tense, 5, ["key", "p1", "p2", "aspect", "orb", "meaning"]),
        },
      },
      geodetic: vm.geodetic,
    },
    ...(input.chartStructureYou ? {
      chartStructureYou: {
        stelliums: compactItems(input.chartStructureYou.stelliums, 3, ["key", "members", "sign", "house", "livedTheme", "generational"]),
        patterns: compactItems(input.chartStructureYou.patterns, 3, ["key", "type", "element", "focalPlanet", "planets"]),
        finalDispositor: input.chartStructureYou.finalDispositor,
      },
    } : {}),
    ...(input.chartStructurePartner ? {
      chartStructurePartner: {
        stelliums: compactItems(input.chartStructurePartner.stelliums, 3, ["key", "members", "sign", "house", "livedTheme", "generational"]),
        patterns: compactItems(input.chartStructurePartner.patterns, 3, ["key", "type", "element", "focalPlanet", "planets"]),
        finalDispositor: input.chartStructurePartner.finalDispositor,
      },
    } : {}),
  };
}

export async function writeCouplesReading(
  input: CouplesReadingInput,
  userId?: string,
): Promise<CouplesReading> {
  const promptSignal = compactCouplesSignal(input);
  const inputJson = JSON.stringify(promptSignal);
  const fullInputChars = JSON.stringify(input, null, 2).length;
  const t0 = Date.now();
  console.log(`[couples-reading] input ${inputJson.length} chars compacted from ${fullInputChars}, calling ${MODEL}`);
  try {
    const { object, usage, finishReason } = await generateObject({
      model: gemini(MODEL),
      system: SYSTEM,
      prompt: `${COMPACT_COUPLES_TASK_INSTRUCTIONS}\n\n<brief>\n${inputJson}\n</brief>\n\nWrite the couples reading JSON. Stay strictly inside the brief — do not invent.`,
      schema: CouplesReadingSchema,
      maxOutputTokens: 32768,
      providerOptions: {
        google: {
          thinkingConfig: { thinkingLevel: process.env.GEMINI_THINKING_LEVEL || "minimal" },
          structuredOutputs: true,
        },
      },
      experimental_telemetry: {
        isEnabled: true,
        functionId: "couples-reading",
        metadata: userId ? { posthog_distinct_id: userId } : undefined,
      },
    });
    console.log(`[couples-reading] ok in ${Date.now() - t0}ms — finish=${finishReason}, usage=${JSON.stringify(usage)}`);

    // Defensive backfill: same Gemini-skips-optional-arrays issue as the
    // teacher reading. Synthesize per-partner cluster + pattern commentary
    // entries from the engine's structured data when the LLM omits them.
    const report = backfillCouplesChartStructureCommentary(
        object,
        input.chartStructureYou,
        input.chartStructurePartner,
    );
    if (
        report.youClustersBackfilled.length > 0
        || report.youPatternsBackfilled.length > 0
        || report.partnerClustersBackfilled.length > 0
        || report.partnerPatternsBackfilled.length > 0
    ) {
        console.log(`[couples-reading] chart-structure backfill — youClusters:[${report.youClustersBackfilled.join(",")}] youPatterns:[${report.youPatternsBackfilled.join(",")}] partnerClusters:[${report.partnerClustersBackfilled.join(",")}] partnerPatterns:[${report.partnerPatternsBackfilled.join(",")}]`);
    }
    return backfillCouplesSoWhat(object, input);
  } catch (err: any) {
    console.error(`[couples-reading] failed after ${Date.now() - t0}ms — finish=${err?.finishReason ?? "?"}, textLen=${err?.text?.length ?? 0}, usage=${JSON.stringify(err?.usage ?? {})}`);
    throw err;
  }
}
