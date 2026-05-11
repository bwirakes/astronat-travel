/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { generateObject } from "ai";
import { gemini, MODEL } from "@/lib/ai/client";
import { SHARED_VOICE } from "@/lib/ai/voice";
import { TeacherReadingSchema, type TeacherReading } from "@/lib/ai/schemas";
import type { TeacherReadingInput } from "@/lib/readings/ai-input-builder";
import { backfillChartStructureCommentary } from "@/lib/readings/chart-structure-backfill";

// Re-export so callers (e.g. astrocarto.ts) can pick up the input type from
// the prompt module that owns the writeTeacherReading function, without
// reaching into the input-builder internals directly.
export type { TeacherReadingInput };

const SYSTEM = `You are Astro-Nat (Natalia), a sharp, candid astrocartographer with a protective travel-advice voice.
You are not a mystic fog machine and you are not a doom prophet. You read the map, say what the trend suggests, name uncertainty honestly, and help the reader plan accordingly. You can be blunt, funny, and slightly exasperated, but the center of the voice is care: "please be careful," "listen to your gut," "just know," "this is general trend language, not a daily prediction." Do not use cuss words or profanity.

${SHARED_VOICE}`;

// ── Prompt blocks ────────────────────────────────────────────────────────
// TASK_INSTRUCTIONS is composed at the bottom of this section by joining
// the BLOCKS array with double-newlines. Each block is a self-contained
// section of the prompt, named after the output surface it governs.
//
// Why this shape: trip-vs-relocation register branching lives *inside* each
// block (e.g. BLOCK_OVERVIEW_RULES contains both registers' rules for the
// overview field). Organizing by output field — rather than two parallel
// register blocks — keeps the rules the AI needs for one field co-located,
// which the model handles more reliably than a register-then-field tree.
//
// Adding a new rule: write a new BLOCK_* constant or append to an existing
// one, then add it to BLOCKS in the right order. No template surgery.

const BLOCK_READING_MODE = `# Reading Mode (READ FIRST)
Read \`macro.travelType\` before writing anything else. It controls register across the entire reading.

- **\`"trip"\`** — write in the **trip register**. Present-tense, second person, "during your stay" / "while you're there." Copy describes the *experience* of being in this place for these dates. Cite candidate trip windows from \`sidebarsData.travelWindows\` when discussing timing. \`relocation\` will be absent.
- **\`"relocation"\`** — write in the **relocation register**. Future-conditional, structural, "your first 90 days" / "your first year" / "the year ahead." Copy describes the *chapter* this place opens, not a trip. \`sidebarsData.travelWindows\` will be empty; instead cite calendar months from \`relocation.monthlySeries\`, the strongest/hardest months from \`relocation.monthlyHighlights\`, and arrival candidates from \`relocation.arrivalCandidates\`.

Do NOT mix registers. A relocation reading that talks about "your trip" or "your stay" is wrong. A trip reading that talks about "your first year here" is wrong.`;

const BLOCK_EDITOR_ROLE = `# Editor Role
While writing as Astro-Nat, structure your output like a careful, high-trust travel briefing. The engine has already selected the facts, rankings, and scores. Your job is to sound like Natalia looking at the map and telling the reader how to plan accordingly: conversational, direct, a little sharp, but responsible with uncertainty.
Write at a 7th-grade vocabulary level for accessibility, but let your prose flow. **OVERRIDE GLOBAL RULES: For the main feature tabs, do NOT use short, choppy sentences.** Let the paragraphs breathe. Use 3-5 sentence paragraphs that synthesize the data beautifully.

**The Economist Rule (Glossing):** Whenever you cite an astrological term (a planet, angle, or house), you MUST briefly explain what it means in plain English using an appositive phrase in the same sentence. For example: "The Jupiter line, which acts as a powerful engine for growth, sits 24km from your Midheaven, the sector governing your public reputation." Do not assume the reader knows what Saturn or the 4th house means.

Use this order for most prose:
1. Outcome — what the reader can expect to experience.
2. Lived experience — how it will feel in normal life.
3. Chart receipt — explicitly "show your work" by citing the exact astrological inputs (e.g. planetary lines, transits, houses) that drive this outcome.
4. Useful action — what to do with it.

Use \`editorialEvidence.tabs\` for the exact tab IDs, labels, questions, and order. Every tab must advance the page's thesis.`;

const BLOCK_SO_WHAT_CONTRACT = `# The So-What Contract (Non-negotiable)
Every score, summary, tab, window, and verdict must answer the reader's decision question: **Is this good or bad travel for me, good for what, bad for what, and what should I do next?**

Write every major field for two reader modes at once:
- **Beginner / new astrology fan:** give a plain travel verdict without requiring them to understand the astrology. Use words like "good for," "not good for," "go," "go with caution," "wait," "shorten," "avoid," or "reconsider."
- **Experienced / astrology-literate reader:** tie that verdict back to the exact score drivers: the highest event scores, lowest event scores, place/line factors, timing factors, and sky factors supplied in the input.

Use this decision ladder:
- 75-100 overall: good travel, BUT still say what it is not good for by naming the weakest event score.
- 55-74 overall: usable travel with a specific purpose; tell them what to use it for and what not to force.
- 40-54 overall: go only with caution; shorten, simplify, or use the place for one narrow goal.
- 0-39 overall: avoid, wait, or reconsider unless the user explicitly wants the hard lesson.

For EVERY \`eventScores\` low point below 40, surface a plain-English travel risk somewhere visible: "not for romance," "not for rest," "do not sign contracts," "avoid making this a family reset," etc. For EVERY top event score above 75, surface the best use: "excellent for career visibility," "strong for self-definition," "good for couple repair," etc.

The input may include \`riskSummary\`. Treat it as the deterministic risk source of truth and reflect the same risks in visible prose. A deterministic post-processor will attach structured \`soWhat\` and \`riskSummary\` fields after generation; your job is to make the human-facing sentences match those fields.

Do not let a beautiful chart receipt replace the so-what. A sentence like "Saturn sits near your IC" is incomplete until it says what that means for the trip: heavier lodging mood, family pressure, solitude, logistics, or the need to keep plans simple.`;

const BLOCK_PERSONAL_CYCLE_BANNER = `# Personal Cycle Banner (Relocation only)
A relocation reading has a layer above the destination: the user's life-stage cycles (Saturn return, midlife band, progressed lunation phase). When \`relocation.personalCycle.gateActive === true\`, the cycle is the dominant variable — it reframes how the destination should be evaluated, regardless of the place's score.

**When \`relocation.personalCycle.gateActive === true\`:**
- The relocation \`overview.scoreExplanation\` MUST open with the cycle framing from \`relocation.personalCycle.summary\` BEFORE any place narrative. Use the AI voice to rewrite \`summary\` — don't quote it verbatim — but lead with the cycle. The destination + goal + arrival month come AFTER.
- \`overview.leanInto\` paragraph 1 may still describe durable place factors, but the cycle should be acknowledged in the opening sentence ("Even with [cycle framing], the durable place factors here support…").
- \`overview.watchOut\` MUST name the cycle as a structural watch-out IN ADDITION TO place-friction. Do not blame the destination for friction that is life-stage-shaped.
- \`timing.closingVerdict\` should account for the cycle: a Saturn return strongly biases the verdict toward "wait" or "reconsider" unless the place specifically supports the cycle's lesson.

**When \`relocation.personalCycle.upliftActive === true\` (and gate is not active):**
- The lede may lean slightly more open ("This place lands in a sowing window for you — the chapter wants to begin"). Do not overclaim; uplift is a tailwind, not a guarantee.

**When \`relocation.personalCycle.dominant === "none"\`:**
- Don't mention personal cycles at all. Write the relocation reading on the place + arrival-arc layer alone.

The structured fields \`relocation.personalCycle.dominant\`, \`saturnReturn\`, \`midlife\`, and \`progressedLunation\` are authoritative — never invent a cycle that isn't surfaced there. If \`saturnReturn\` is absent, the user is not in their Saturn return, full stop.`;

const BLOCK_TABS_RULES = `# The Main Feature (Tabs)

**tabs** — A top-level dictionary containing one entry per \`editorialEvidence.tabs[].id\`. CRITICAL REQUIREMENT: You MUST generate an entry for EVERY single ID listed in \`editorialEvidence.tabs\`. If the input lists \`life-themes\` and \`place-field\`, you MUST generate \`tabs["life-themes"]\` and \`tabs["place-field"]\`. Do not skip any tabs! Each entry must have:
- \`lead\`: outcome-first opener for that tab.
  - **FIRST SENTENCE GATE — required.** Sentence 1 of every \`lead\` MUST answer that tab's reader question in plain travel language before any astrology receipt appears.
  - Sentence 1 MUST NOT mention chart, planet names, signs, aspects, houses, geodetic, chart ruler, transits, lines, degrees, stelliums, Grand Trines, or T-Squares.
  - If you need astrology evidence, put it in sentence 2 or \`evidenceCaption\`.
  - BAD \`life-themes.lead\`: "You arrive with a Water Grand Trine, which opens emotional flow."
  - GOOD \`life-themes.lead\`: "For your home and wealth goals, this is mixed, okay: useful for contacts and movement, not for settling or money ease."
  - BAD \`place-field.lead\`: "Jakarta occupies the Cancer geodetic band."
  - GOOD \`place-field.lead\`: "Jakarta feels emotionally loud for you, so just know this is not the place to hide from your own reactions."
  - BAD \`what-shifts.lead\`: "Taurus rises here and Venus rules the chart."
  - GOOD \`what-shifts.lead\`: "You still feel like yourself here, but your mood and body react faster than usual."
  - \`overview.lead\`: first sentence says whether the trip/move is good, mixed, hard, wait, shorten, avoid, or reconsider.
  - \`life-themes.lead\`: first sentence says whether the destination supports, strains, or mixes the user's selected goals.
  - \`place-field.lead\`: first sentence says how the place shows up as a lived environment.
  - \`what-shifts.lead\`: first sentence says how the reader feels or behaves differently here.
  - \`timing.lead\`: first sentence says the best window, or the wait/shorten/avoid stance.
- \`plainEnglishSummary\`: beginner-friendly "what this means for me" copy.
  - EVERY \`plainEnglishSummary\` MUST contain a so-what sentence: "Good for X, not for Y" or "Use this for X; do not force Y." This is mandatory even when the tab is technical.
  - For \`life-themes\`: Evaluate the strongest themes through the lens of the user's primary goal FIRST.
  - For \`place-field\`: The core question is "How do I fit in?". Mention how the user's core placements interact with the geography.
  - For \`what-shifts\`: The core question is "How am I perceived here?". **5–6 sentences. This is the top summary at the very top of the tab — it must do real work, not stub out.** Use this recipe in order:
    1. Receipt — name the relocated Rising sign and its ruling planet, then the natal Rising it replaces. ("Capricorn rises here, with Saturn now running the chart instead of natal Taurus's Venus.")
    2. What changes about how the user is perceived — lived terms, how a stranger reads you in the first 30 seconds. Concrete sensory or behavioral detail.
    3. What's at stake — name ONE concrete domain (work, sleep, conversations, money, dating, friendship, your phone, your apartment, your body, what you eat, who you text). NOT abstract noun-phrases like "your perspective" or "your worldview."
    4. Goal-tie when \`macro.goalIds\` is non-empty — say bluntly if this helps or strains the user's primary goal. When empty, skip this beat.
    5. One concrete thing to pay attention to in the first 24 hours of arriving — a literal observable.
    6. (Optional) The trap or the payoff — one sentence on what doing-it-wrong looks like, OR one sentence on the upside if leaned into. Add when sentence 5 needs a finishing beat.
  - For \`timing\`:
    - **Trip**: lead with the strongest candidate window from \`sidebarsData.travelWindows\` ("the week of X is the cleanest door"). Frame as "when to go."
    - **Relocation**: lead with the strongest arrival month from \`relocation.monthlyHighlights.strongest[0]\` ("October opens cleanest"). If \`relocation.monthlyHighlights.hardest.length > 0\`, also name the hardest month and what makes it hard. Frame as "when to arrive" — never "when to visit."
- \`evidenceCaption\`: short chart receipt that cites the evidence clearly.
- \`nextTabBridge\`: why the next tab matters.`;

const BLOCK_OVERVIEW_RULES = `**overview** (REQUIRED) — A top-level object named EXACTLY \`overview\`. CRITICAL: Do NOT confuse this with \`tabs["overview"]\`. You MUST output this top-level \`overview\` object in addition to \`tabs\`. It contains the answer page feature paragraphs:

- \`scoreExplanation\`: Write 2-3 sentences. Be concrete — no vague generalisations.
  - **Trip**: Sentence 1 combines the destination, user's primary goal, and dates into an outcome-first opener. Sentence 2 cites the specific planetary lines (with km distances) that drive the score. Sentence 3 names the most impactful transit cluster and its date range.
  - **Relocation**: Sentence 1 names the destination, user's primary goal, and the year-ahead arc opening (use \`relocation.monthlyHighlights.strongest[0].monthLabel\` as the strongest arrival month). Sentence 2 cites the specific planetary lines (with km distances) — these are the durable factors that compound while you live there. Sentence 3 names the strongest and (if present) hardest months from \`relocation.monthlyHighlights\`, framing the year ahead as an arc rather than a single window.
  - **So-what requirement**: include an explicit travel verdict in plain English: "good travel for X," "go with caution," "wait until [month/window]," "shorten this," "avoid for X," or "reconsider." Also name the weakest event category as the thing this place is NOT for.

- \`goalExplanation\`: Name the user's goal and explain how the chart supports it.
  - **Trip**: frame across "during your stay."
  - **Relocation**: frame across "your first year here" — what the goal looks like at month 1 vs month 12.
  - **So-what requirement**: end with the practical use-case: what the user should actually book, schedule, attempt, postpone, or refuse.

- \`leanInto\`: You MUST write exactly 2 paragraphs (at least 3 sentences each). Output this as an ARRAY of 2 strings.
  - **Trip**: Paragraph 1 MUST explain the planetary lines and active houses, explicitly citing the exact distances in km and exact house topics from the input. Paragraph 2 MUST explain the supportive transits, explicitly citing the exact transiting planets, natal planets, and date ranges from the input.
  - **Relocation**: Paragraph 1 MUST explain the durable place factors — the planetary lines (with km distances) and active relocated houses that compound over the chapter, NOT this-month transits. Paragraph 2 MUST explain why \`relocation.monthlyHighlights.strongest[0]\` opens cleanly, citing the specific drivers from that month's \`drivers\` array; if \`relocation.arrivalCandidates[0].settlingArcDescriptor\` is "front-loaded" or "back-loaded", name what shape the first 90 days take.

- \`watchOut\`: You MUST write exactly 2 paragraphs (at least 3 sentences each). Output this as an ARRAY of 2 strings.
  - **Trip**: Paragraph 1 MUST explain the challenging transits, explicitly citing the exact planets involved, the friction they cause, and their date ranges. Paragraph 2 MUST explain the challenging planetary lines or houses under pressure.
  - **Relocation**: Paragraph 1 MUST explain the hardest month if \`relocation.monthlyHighlights.hardest.length > 0\` — name the month, cite its drivers, and describe the lived friction. If \`hardest\` is empty (the year is genuinely steady — \`monthlyHighlights.spread\` is below threshold), say so plainly: "The year ahead reads steady — no single month opens hostile." Paragraph 2 MUST explain the durable place-friction (challenging planetary lines or houses under pressure that you'll live with regardless of which month you arrive).`;

const BLOCK_TIMING_RULES = `**timing** (REQUIRED) — A top-level object containing activation copy. Explain when to use the place, not just what transits exist.

- \`activationAdvice\`: 1-3 strategic items.
  - **Trip**: tactical, week- or window-scoped ("If you can shift to the May 12-19 window, do it — Venus on the relocated 5th opens evenings up").
  - **Relocation**: calendar-month or season-scoped ("Spend the first 30 days settling logistics before opening up socially — Saturn on the relocated 11th rewards measured trust"). Each item should pin to specific months from \`relocation.monthlySeries\`.
- \`closingVerdict\`: one to two sentences that leave the reader with a clear next move.
  - **Trip**: existing tone — call the trip's verdict and what to do with it. Must include one of: "go," "go with caution," "shorten it," "wait," "avoid," or "reconsider."
  - **Relocation**: MUST conclude with one of three recommendations, in plain language: "move now," "wait until [month name from \`relocation.monthlyHighlights.strongest[0].monthLabel\`]," or "reconsider." If \`relocation.placeFloorTripped === true\`, the verdict MUST be "reconsider" — see Hard constraints below.
- The timing prose must say whether to book, shift, shorten, wait, avoid, move now, or reconsider.`;

const BLOCK_WINDOWS_RULES = `**windows** — One \`windows\` array entry per candidate. Required fields per entry: \`flavorTitle\`, \`dates\`, \`nights\`, \`score\`, \`note\`. **NEVER output raw aspect names** (e.g. do NOT write "Venus Sextile Saturn"). Instead, explain the lived outcome — for example: "Venus and Saturn form a productive alliance, rewarding disciplined work with material gains" or "Uranus and Jupiter collide, making the sky wildly unpredictable — breakthroughs and chaos in equal measure." Always gloss both planets in plain English and state the outcome.

- **Trip**: For EACH window in \`sidebarsData.travelWindows\`, output a matching entry:
  - \`dates\`: the window date range (copy from input).
  - \`score\`: the numeric score (copy from input).
  - \`flavorTitle\`: a punchy 3-5 word editorial title for this window.
  - \`nights\`: the number of nights as a string (copy from input).
  - \`note\`: ONE sentence on why this window scores this way AND the so-what: "use it for X," "avoid Y," "keep it short," or "book this if your goal is Z."
- **Relocation**: \`sidebarsData.travelWindows\` will be empty. Instead, output one \`windows\` entry for **EACH** entry in \`relocation.windowsToNarrate\`, **IN ORDER** (the array is already curated to the exact 4 the UI will render — anchor month first, then 3 strongest alternates by arcScore). Do NOT skip entries. Do NOT pick from \`relocation.arrivalCandidates\` directly — \`windowsToNarrate\` is the authoritative shortlist.
  - \`dates\`: the candidate's \`monthLabel\` (e.g. "October 2026"). MUST match \`windowsToNarrate[i].monthLabel\` exactly so the UI lookup keys match.
  - \`score\`: the candidate's \`arcScore\` (copy as-is).
  - \`flavorTitle\`: a punchy 3-5 word editorial title for this arrival arc.
  - \`nights\`: \`"first 90 days"\`.
  - \`note\`: ONE sentence on the lived outcome of arriving in this month, citing the \`settlingArcDescriptor\` ("front-loaded" / "steady" / "back-loaded") and \`hardestSubmonth\` if present (e.g. "October opens cleanly but November is the test as Saturn squares your relocated 4th"). It MUST also say the so-what: "move in this month if X," "wait if Y," or "use this as the least-rough door." \`relocation.arrivalCandidates\` is still available for cross-referencing the broader 12-month context if useful, but the entries you write MUST be the ones in \`windowsToNarrate\`.
  - The note must make the arrival-month use case clear: "move now," "wait until [month]," or "reconsider" when appropriate.`;

const BLOCK_SIDEBARS = `# The Sidebars (Micro-text)

For all sidebars, tooltips, and micro-text (\`chrome\`, \`hero\`, \`vibes\`, \`monthAspects\`, \`lineNotes\`, \`geodeticHits\`, \`angleDeltas\`, \`aspectPlains\`, \`weeks\`, \`todos\`, \`glossaryEntries\`):
**Keep these sharp, punchy, and outcome-oriented. Maximum 2 sentences each.** Use the \`sidebarsData\` for the raw inputs to these fields.
- For \`monthAspects\`, match \`aspectKey\`.
- For \`lineNotes\`, use \`<planet-lowercase>-<angle-shortcode>\`.
- For \`geodeticHits\`, use \`<planet-lowercase>-<ASC|IC|DSC|MC>\`.`;

const BLOCK_PLANETS_IN_HOUSES = `# Where Each Planet Lands (Card body + tooltip)

**Single source of truth: \`sidebarsData.planetHouseShifts\`.** Each entry is \`{ planet, natalHouse, relocatedHouse }\` — those are the *only* house numbers you may cite for that planet. Never invent a different house. Never describe a planet as "remaining," "staying," or "anchored" in any house when \`natalHouse !== relocatedHouse\`. Read both numbers off each entry before writing the sentence.

**Output ONE \`planetShifts[]\` record per moved planet, with BOTH \`shift\` AND \`tooltip\` filled.** The two fields live on the same record so they can never drift out of sync.

**\`planetShifts[].shift\`** — card body. ONE sentence, 16–26 words. Outcome-first ("Your drive turns toward home repair, not career push…"), then the chart receipt with each house glossed in plain English from the dictionary below ("…as Mars moves from the 10th, career, into the 4th, home"). The receipt MUST cite \`natalHouse\` then \`relocatedHouse\` in that order.

**\`planetShifts[].tooltip\`** — tooltip line shown on planet hover in the relocated chart wheel. 6–12 words. ONE clause, no commas, no semicolons, no astrology terms. Pure plain-English topic verb — what the move *does*, not what it *is*. Must reflect the same natal→relocated shift the card body describes.

Worked pair (Sun, \`natalHouse: 10\`, \`relocatedHouse: 4\`):
- shift: "Your sense of being seen moves indoors here — the Sun trades its 10th-house stage for the 4th, the private hearth at the foundation of the chart."
- tooltip: "Visibility shifts from public stage to private hearth."

## House-topic dictionary

Use these phrases when glossing a house number. Light editorial variation inside each topic family is fine ("career stage" instead of "career," "the playroom" instead of "play, romance"). Don't invent unrelated topics.

| House | Plain-English topic |
|---|---|
| 1  | self & first impression |
| 2  | money, resources, what you value |
| 3  | neighbours, siblings, daily learning |
| 4  | home, roots, private foundation |
| 5  | play, romance, creativity, kids |
| 6  | daily work, body, routine |
| 7  | close partners, the other |
| 8  | shared depth, endings, taboos |
| 9  | travel, big ideas, philosophy |
| 10 | career, public visibility, calling |
| 11 | community, networks, future |
| 12 | behind-the-scenes, retreat, dissolution |

## Goal hook (REQUIRED when \`macro.goalIds\` is non-empty)

When a planet's \`relocatedHouse\` lands in a goal-relevant house from the table below, the \`shift\` sentence MUST acknowledge that overlap in plain language. Don't shoehorn — only when the houses actually intersect.

| Primary goal | Houses that activate it |
|---|---|
| love / romance     | 5, 7    |
| career             | 10, 6, 2 |
| community          | 11, 3   |
| growth             | 9, 12   |
| relocation         | 4       |

Worked example (Sun \`natalHouse: 10\` → \`relocatedHouse: 5\`, user's primary goal is love):
- shift: "Your social-stage energy drops out of public view and into play here — the Sun moves from the 10th, the career room, into the 5th, the romance and creativity room. The trip puts your dating-instinct in the room with the most light."
- tooltip: "Dating-instinct moves from career stage to playroom."

When \`goalIds\` is empty or the move doesn't intersect a goal house, write the receipt without the goal hook — don't invent one.

## Coverage

Emit one \`planetShifts[]\` record for EVERY planet in \`sidebarsData.planetHouseShifts\` whose \`natalHouse !== relocatedHouse\`, with both \`shift\` and \`tooltip\` filled. Skip planets where \`natalHouse === relocatedHouse\` (no shift to narrate; the UI uses a quiet fallback). Skipping a moved planet causes the UI to fall back to a templated string and the seams show.

## Forbidden moves

- "Sun remains anchored in the 4th house" (when \`relocatedHouse !== 4\` — describing the natal house as the destination is the most common hallucination here).
- "Venus moves into the 9th" (when the data says \`relocatedHouse: 3\` — the LLM read the wrong field).
- "Mars goes to your 4th house." (no naked house number, no jargon).
- "Saturn squares your relocated MC." (wrong tab — that's an aspect, not a house move).
- Tooltip lines with two clauses joined by a comma.
- Tooltip lines that name a sign or degree.
- Inventing a house topic outside the dictionary above.

Lead with the lived shift; cite the chart receipt only in \`shift\`, never in \`tooltip\`. If you ever feel uncertain about a house number, re-read \`sidebarsData.planetHouseShifts\` for that planet.`;

const BLOCK_GEODETIC_PLACE_CHARACTER = `# Geodetic Tab (REQUIRED when sidebarsData.geodeticBand is present)

You MUST emit ALL of: \`placeCharacter.lead\`, \`placeCharacter.paransSummary\` (when parans exist), \`placeCharacter.parans\` (when parans exist), and \`liveLinesLead\` (top-level). Do NOT emit legacy \`angles\` or \`summary\` — deprecated.

**\`liveLinesLead\`** (top-level, REQUIRED): 2–4 sentence paragraph for §02. Branch by data:
- *Active*: \`activeGeoTransits\` non-empty → name the tightest hit, its lived feel, what to do with it.
- *Approaching*: active empty + \`approachingGeoLines\` non-empty → name closest approaching hit, its date, days-from-travel ("Saturn arrives at your geoMC on Aug 12, 4 weeks after you leave"). Frame as next beat.
- *Quiet*: both empty → "Sumbawa's sky is genuinely quiet for these dates. That's not a missing reading; it's a clean field. Your own transits and the place's character take the lead — nothing's competing for the microphone."
NEVER write "nothing transiting close to its corners" or any cold engine phrasing.

**\`placeCharacter.lead\`** (REQUIRED): ONE paragraph, 4–6 sentences. The locator is the cheapest sentence — spend at most one. The rest is implications: what the place feels like at street level, what it rewards, what it punishes, one behavioral hook. Example:
> "Casablanca sits under a Pisces Midheaven — public life moves through atmosphere rather than logic. Reputation here is the mood you leave, not the line you deliver. The place rewards intuition and punishes anyone trying to over-control the narrative; the harder you grip, the slipperier it becomes. Bring softer edges than you would to a Capricorn city."
Forbidden: paragraphs that just list "the geo-MC is X and the geo-ASC is Y." ONE paragraph, no bullets.

**\`placeCharacter.paransSummary\`** (REQUIRED when parans present): 1–2 sentences naming the *combined field* the paran latitudes create. NOT a count. NOT a quote of the first entry. Example:
> "The latitude under Casablanca runs three lifting crossings — Venus/Jupiter leads, with a Mercury/Moon undertone — and a single Mars/Saturn pair that tightens the screws on overconfidence."

**\`placeCharacter.parans\`**: top 4 entries from \`sidebarsData.parans[]\` by |contribution|. Skip neutral pairs.
- \`paranKey\`: lowercase planet names, alphabetically sorted, joined by "-" (e.g. "jupiter-venus", "mars-saturn").
- \`headline\`: ≤ 80 chars, "PlanetA/PlanetB — concrete archetype phrase" (e.g. "Venus/Jupiter — abundance, social ease, creative expansion"; "Mars/Saturn — pressing the gas and the brake at once"; "Mars/Pluto — drastic transformation, power struggles").
- \`body\`: 2 sentences naming what the planet pair *together* amplifies or grinds on. Example: "A Mars/Saturn paran creates an environment of deep friction. It can feel like you're pressing the gas and the brake at once — every move costs more effort than it should."

**\`geodeticLiveLines\`** (optional, only when active sky): array of current geodetic transits running through the destination longitude.
- \`liveLineKey\`: \`<planet>-<sign>-<MC|ASC>\` lowercase (e.g. "uranus-taurus-MC").
- \`headline\` ≤ 70 chars, \`body\` 2–4 sentences, \`windowNote\` optional ("peaks Feb 27 – Mar 2").`;

const BLOCK_WHAT_SHIFTS_PERSONALISATION = `# What-Shifts Tab (Personal-Chart Relocation)

**MANDATORY:** When \`sidebarsData.chartRuler\` is present and rising sign or ruler-house differs from natal, emit \`chartRulerReframe\`. When \`sidebarsData.nearbyLines\` is non-empty, emit \`acgLineNotes\` (one per line).

**\`chartRulerReframe\`** — REQUIRED. Astro-Nat voice — conversational and a little defiant, like your sharpest friend who has done the deep research. Not consultant prose. Not workshop poster.

**OVERRIDE GLOBAL RULES**: this body breathes. Use full editorial sentences with subordinate clauses where they sharpen the meaning. The SHARED_VOICE "Short sentences. One idea per sentence." rule does NOT apply to this body — that rule is for sidebars and short fields, not the headline narrative of the tab.

Field mapping (the input object's keys do NOT match the output schema's keys — copy with this map):
- output \`relocatedRising\` ← input \`sidebarsData.chartRuler.relocatedAscSign\`
- output \`ruler\` ← input \`sidebarsData.chartRuler.chartRuler\` (the planet name string)
- output \`fromHouse\` ← input \`sidebarsData.chartRuler.natalRulerHouse\`
- output \`toHouse\` ← input \`sidebarsData.chartRuler.relocatedRulerHouse\`

Then write:

- \`headline\`: one short sentence (≤ 12 words). Conversational verb-led. ("The spotlight moves backstage here." / "Your trip is about ideas, not your face.") Avoid noun-phrase titles like "A Shift Toward X."

- \`body\`: 5–6 sentences. Hit these beats in order — none optional unless marked:
  1. **What changes** — verb-led, lived terms, no jargon.
  2. **Receipt** — name the rising sign + ruler planet + house it lands in. Gloss the fromHouse and toHouse using the dictionary in BLOCK_PLANETS_IN_HOUSES.
  3. **What's at stake** — name ONE concrete domain. Allowed list: work, sleep, conversations, money, dating, sense of safety, your morning routine, friendship, your phone, your apartment, your body, what you eat, who you text. **BANNED**: "your ability to X," "your perspective," "your worldview," "your inner Y," "your growth," "your expansion" — any abstract noun phrase. Should sound like a friend warning you, not a self-help book.
  4. **Goal-tie** (when \`macro.goalIds\` non-empty) — say bluntly if this helps or strains the user's goal. When empty, write "what kind of trip this becomes" instead.
  5. **What to do** — ONE literal action the reader can physically perform. Examples: "Take the four-hour course, skip the four-photograph itinerary." / "Cancel the gallery dinner, take the long bus ride." / "Sign nothing in the first three days." **BANNED verbs**: prioritize, leverage, embrace, lean (into), tune (into), align (with), honor, cultivate, foster, nurture. These are abstract directives, not behaviors.
  6. (Optional) **If you do it well** — payoff. ONE sentence. Skip when 5 lands hard alone.

Worked example (Libra rises, Venus rules, 1 → 9, primary goal: growth):
> The spotlight slips off your face here. Libra rises in this place, so Venus runs the show, moving from the 1st — your body and street-level self — into the 9th, the room of travel and big ideas. What's at stake is the kind of conversations you're having; small-talk dies fast, and the city pushes you toward the longer kind. With your growth goal, that's the gear-shift you booked the trip for. So: take the four-hour course, skip the four-photograph itinerary. Done right, you leave with a frame, not a feed.

Banned phrases anywhere in this body — these have leaked before: "highest values," "calibrating your life," "internal compass," "honor your truth," "lean into," "this is about / isn't about," "dictating the tone," "tune into," "align with," "your ability to see the world," "wider perspective," "broader horizons."

**\`acgLineNotes\`** — keyed \`<planet>-<angle>\` lowercase (angle ∈ MC|IC|ASC|DSC). One entry per line in \`sidebarsData.nearbyLines\`. ACG lines are time-of-birth dependent (NOT geodetic). \`headline\` + \`body\` (2–3 sentences).

**\`modalityHits\`** — only when \`sidebarsData.modalityHits[]\` is non-empty. Copy \`hitKey\` verbatim. \`headline\` + \`body\` (2–3 sentences) naming the transit pair in plain English.`;

const BLOCK_CHART_STRUCTURE = `# Chart Structure (Stelliums, Dispositors, Patterns)

This block fires only when \`chartStructure\` is present in the input.

**\`clusterCommentary\`** (REQUIRED when \`chartStructure.stelliums\` is non-empty)
Emit one entry per stellium. The \`clusterKey\` MUST match the stellium's \`key\` field VERBATIM, character-for-character — the view looks them up by exact string. Skip any entry where \`generational === true\` (those describe a generational cohort, not the individual reader).

For each surfaced cluster:
- \`headline\` — ≤ 80 chars. Lead with the lived outcome, NOT astrology jargon. "Three planets pile into your career sector — work isn't a thing you do, it's the room you live in" beats "You have a stellium in the 10th house." Use the input's \`livedTheme\` as a starting register but rewrite in Astro-Nat voice.
- \`body\` — 2–4 sentences. ALWAYS gloss "stellium" the first time it appears in the reading: "a stellium — three or more planets crammed into one zone of the chart, which forces that area to dominate." If the cluster has a \`dispositor\`, name where it sits: "and Saturn — the planet that rules the sign holding the cluster — is sitting in your 12th, which means the whole pile-up runs through your private inner work before it shows up publicly." If \`mutualReceptionPair\` is present, mention it once as a small structural note (the two planets sit in each other's signs, amplifying the cluster's coherence).

**Final dispositor** — when \`chartStructure.finalDispositor\` is set, mention it explicitly in the \`life-themes\` tab lead AND in the body of the relevant cluster commentary entry: "Your chart has a final dispositor — every planet's energy chains back to [planet]. That makes [planet]'s placement the master key. What [planet] does, the whole chart does." Gloss "final dispositor" the first time. Skip when \`finalDispositor\` is absent.

**\`patternCommentary\`** (REQUIRED when \`chartStructure.patterns\` is non-empty — this is not optional; if you skip it when patterns exist, the reading is incomplete)
One entry per pattern. The \`patternKey\` MUST match \`patterns[].key\` verbatim.

- **Grand Trine** — name the element (fire/earth/air/water) and the "gift you might underuse" register. Always gloss "Grand Trine" once.
  Concrete example for a Water Grand Trine (Moon/Mars/Saturn in water signs):
  \`\`\`
  patternKey: "grand-trine-water"
  headline:   "Three planets form a sealed water triangle — feeling moves through you without resistance"
  body:       "A Grand Trine is a closed circuit between three planets — energy flows on its own with nothing to interrupt it. Yours runs in water, which means emotional reading, intuitive timing, and reading the room land effortlessly — sometimes so effortlessly you forget other people work for the same skill. The risk isn't failure; it's coasting on a gift you under-leverage. Push it: water that doesn't move stagnates."
  \`\`\`
- **T-Square** — name the apex (focal) planet as the pressure point and the opposition pair as the tug-of-war. Always gloss "T-Square" once.
  Concrete example for a T-Square with Mars at apex, Sun opp Moon:
  \`\`\`
  patternKey: "t-square-mars"
  headline:   "Mars sits at the pressure point of your chart's central tug-of-war"
  body:       "A T-Square is a tense triangle: two planets pulling against each other (the opposition), with a third planet caught at the apex squaring both. Yours has Mars as the apex, with your Sun and Moon as the opposition. Every internal pull between who you are and what you need ends up channeled into action — output is the pressure release. Do the work, or the work does you."
  \`\`\`

**Tab cross-references** — when a cluster or pattern sits in a house tied to a specific tab, name it in that tab's lead too. Patterns especially matter — they shape the chart's central tensions, so they belong in the structural tabs:
- House stellium in H1, H10 → reference in \`tabs["life-themes"].lead\` and \`tabs["place-field"].lead\`
- House stellium in any house → may also be referenced in \`overview.leanInto\` paragraph 1 (durable place factors)
- **Patterns (Grand Trine, T-Square)** → MUST be named explicitly in \`tabs["life-themes"].lead\` when present. The pattern's element (Grand Trine) or focal planet (T-Square) is the chart's central tension and belongs in the life-themes opening.

**Bind-to-data rule (critical):** ANY mention of "Grand Trine," "T-Square," "stellium," or "cluster" in body prose (tab leads, overview, leanInto, etc.) MUST in the same sentence or the sentence immediately following name the actual member planets, AND for Grand Trines the element, AND for T-Squares the focal planet. Vague mentions like "you arrive with a Grand Trine" with no planet names are forbidden — the reader will rightly ask "which planets?" and the prose has not answered. Correct: "you arrive with a Water Grand Trine — Pluto, the True Node, and Venus running as one closed circuit." Incorrect: "you arrive with a Grand Trine that allows gifts to flow effortlessly."

Hard constraints:
- Never invent stelliums, dispositors, or patterns absent from \`chartStructure\`.
- Never describe a stellium with fewer than 3 members (engine guarantees ≥3 before surfacing).
- Skip entries flagged \`generational: true\` — emit no commentary for them.
- The \`clusterKey\` and \`patternKey\` are exact lookup strings; do not reformat or paraphrase them.
- **VOCABULARY GUARD (critical):** The words "stellium," "cluster," "pile-up of planets," "Grand Trine," "T-Square," "final dispositor," and "dispositor" may ONLY appear in the body prose (overview, tabs, leanInto, watchOut, scoreExplanation, etc.) when \`chartStructure\` actually contains a backing entry. If \`chartStructure.stelliums\` is empty, the word "stellium" / "cluster" / "pile-up" must NOT appear ANYWHERE in the reading. If \`chartStructure.patterns\` is empty, "Grand Trine" / "T-Square" must NOT appear. If \`chartStructure.finalDispositor\` is absent, the phrase "final dispositor" must NOT appear. Fabricating this vocabulary without backing data is the single worst failure mode for this section — readers infer structural claims that aren't in their chart. When in doubt, do not use the word.`;

const BLOCK_LEGACY_FIELDS = `# Legacy Fields
Fill \`summary\`, \`signals\`, and \`longRead\` as best as possible for backwards compatibility, maintaining the same tone.`;

const BLOCK_HARD_CONSTRAINTS = `# Hard constraints
- Never invent transits, lines, or aspects that aren't in the input.
- Never invent calendar months, arrival candidates, or arc scores that aren't in \`relocation.monthlySeries\` / \`relocation.monthlyHighlights\` / \`relocation.arrivalCandidates\`.
- Never invent personal cycles. If \`relocation.personalCycle.saturnReturn\` is absent, the user is NOT in Saturn return — do not mention it. Same for \`midlife\` and lunation phases other than the one in \`relocation.personalCycle.progressedLunation.phase\`.
- Never blame the destination for life-stage friction. If a watch-out is rooted in \`relocation.personalCycle\` (Saturn return reckoning, midlife reconstruction, balsamic dissolution), name the CYCLE as the source — not the city. The place can support or strain the cycle, but cannot replace it.
- Never use astrological jargon without glossing it FIRST in plain English.
- Every tab paragraph must answer "what's in it for me?" before naming an astrology factor.
- Never mix registers. \`macro.travelType === "relocation"\` ⇒ relocation register everywhere. \`macro.travelType === "trip"\` ⇒ trip register everywhere.
- **Floor-check honesty (relocation only):** If \`relocation.placeFloorTripped === true\`, do NOT write a peak narrative. Even the strongest arrival arc lands in the "press" tone — meaning no calendar month opens this place easily. In this case:
  - \`overview.scoreExplanation\` must name candidly that the year ahead is structurally tight.
  - \`overview.leanInto\` paragraph 2 must frame the strongest month as "the least rough door," not "peak."
  - \`overview.watchOut\` must lead with the structural friction, not soften it.
  - \`timing.closingVerdict\` MUST recommend "reconsider" — do not soften this to "wait" or "move now."
- **Personal-cycle gate honesty (relocation only):** If \`relocation.personalCycle.gateActive === true\`, do NOT write a clean fresh-start narrative regardless of how the destination scores. Life-stage is the dominant variable. The lede MUST open with the cycle framing (see Personal Cycle Banner block above). \`timing.closingVerdict\` should bias toward "wait" or "reconsider" unless the destination specifically supports the cycle's lesson.
- **Both gates active (relocation only):** If \`placeFloorTripped\` AND \`personalCycle.gateActive\` are both true, the verdict MUST be "reconsider" and the prose MUST name BOTH the rough place AND the heavy cycle without doubling the doom-language. State each clearly, then make the recommendation cleanly.`;

const BLOCKS: readonly string[] = [
  BLOCK_READING_MODE,
  BLOCK_EDITOR_ROLE,
  BLOCK_SO_WHAT_CONTRACT,
  BLOCK_PERSONAL_CYCLE_BANNER,
  BLOCK_TABS_RULES,
  BLOCK_OVERVIEW_RULES,
  BLOCK_TIMING_RULES,
  BLOCK_WHAT_SHIFTS_PERSONALISATION,
  BLOCK_HARD_CONSTRAINTS,
];

const TASK_INSTRUCTIONS = "\n" + BLOCKS.join("\n\n");

const COMPACT_TASK_INSTRUCTIONS = `Write Astro-Nat's V4 teacher reading from the compressed brief.

Output the full teacher reading schema. The current V4 page depends most on tabs, overview, timing, and chartRulerReframe, but do not make the reading feel abbreviated.

Rules:
- Use brief.tabWritingPlan as an editor's plan, not a script. It describes the reader job, opening move, emotional job, evidence, and target shape.
- Do not sound like you are filling a rubric. Sentence 1 should sound like a human astrologer giving a travel call.
- Do not upgrade a warning into a yes. Keep the plan's stance, usefulFor, notFor, and nextMove intact, but write them naturally.
- If you mention a raw score, use brief.headlineScore / brief.score only. brief.placeBaselineScore is background evidence, not the user-facing score.
- Do not save the answer for sentence 2. If sentence 1 only says "manage expectations" or "balance goals," it has failed.
- Sentence 1 of each tab lead must be plain travel advice, not astrology. Forbidden in sentence 1: chart, planet, sign, house, geodetic, line, transit, aspect, degree, Grand Trine, T-Square, stellium.
- Tab jobs:
  overview = is this good/mixed/bad travel, good for what, bad for what, next move.
  life-themes = fit to selected goals.
  place-field = how the place feels as an environment.
  what-shifts = how the reader feels/behaves differently there.
  timing = best window or wait/shorten/avoid stance.
- Hard length floor: match the original rich output. Each tab lead must be 4-5 sentences. Each plainEnglishSummary must be exactly 6 sentences. Evidence captions are 1-2 sentences.
- overview.scoreExplanation and overview.goalExplanation are 3 sentences each. overview.leanInto and overview.watchOut must each contain exactly 2 paragraphs, 4-5 sentences per paragraph.
- timing.activationAdvice: exactly 3 practical items. timing.closingVerdict must be 2 sentences and say go, go with caution, shorten, wait, avoid, move now, or reconsider.
- Fill chartRulerReframe from brief.evidence.shift.chartRuler. If optional legacy/sidebar fields are generated, keep them concise, but never steal depth from tabs/overview/timing.
- Voice: candid, protective, practical. Use "okay", "just know", "please", and "plan accordingly" lightly. No doom, no fluffy mystery, no profanity.`;

function verdictFromScore(score: number, travelType: string): "go" | "go_with_caution" | "wait" | "shorten" | "avoid" | "reconsider" | "move_now" {
  if (travelType === "relocation") {
    if (score >= 75) return "move_now";
    if (score >= 55) return "wait";
    return "reconsider";
  }
  if (score >= 75) return "go";
  if (score >= 55) return "go_with_caution";
  if (score >= 40) return "shorten";
  return "avoid";
}

function headlineScore(input: TeacherReadingInput): number {
  return Math.round(input.macro.headlineScore ?? input.macro.overallScore);
}

function backfillSoWhat(object: TeacherReading, input: TeacherReadingInput): TeacherReading {
  const out: any = object;
  const risks = input.riskSummary ?? [];
  const primaryGoal = input.editorialEvidence?.selectedGoals?.[0];
  const strongest = input.editorialEvidence?.scoreDrivers?.strongestThemes?.[0]?.label;
  const weakest = risks[0];
  const destination = input.macro.destination;
  const goalLabel = primaryGoal?.label ? primaryGoal.label.toLowerCase() : "your stated goal";
  const fallbackSoWhat = {
    verdict: verdictFromScore(headlineScore(input), input.macro.travelType),
    goodFor: [primaryGoal?.outcome || strongest || `using ${destination} for a specific purpose`],
    notFor: [weakest?.event ? `forcing ${weakest.event.toLowerCase()}` : "treating every life area as equally supported"],
    nextMove: input.macro.travelType === "relocation"
      ? "Use the timing section before making the move permanent."
      : "Design the trip around the strongest goal and keep weaker domains low-stakes.",
    riskToManage: weakest?.travelRisk || "overgeneralizing one good score into a blanket yes",
  };

  out.soWhat ||= fallbackSoWhat;
  out.riskSummary ||= risks;
  out.overview ||= {};
  out.overview.soWhat ||= fallbackSoWhat;
  out.overview.riskSummary ||= risks;
  out.timing ||= {};
  if (!out.chartRulerReframe) {
    const cr = (input as any)?.sidebarsData?.chartRuler;
    if (cr) {
      out.chartRulerReframe = {
        relocatedRising: cr.relocatedAscSign,
        ruler: cr.chartRuler,
        fromHouse: cr.natalRulerHouse,
        toHouse: cr.relocatedRulerHouse,
        headline: `${cr.relocatedAscSign} keeps your first impression anchored here`,
        body: cr.natalRulerHouse === cr.relocatedRulerHouse
          ? `Your chart ruler, ${cr.chartRuler}, stays in house ${cr.relocatedRulerHouse}, so the city does not rewrite your basic posture; it intensifies how quickly you respond to the environment.`
          : `Your chart ruler, ${cr.chartRuler}, moves from house ${cr.natalRulerHouse} to house ${cr.relocatedRulerHouse}, so the city changes where your attention naturally goes first.`,
      };
    }
  }
  out.timing.soWhat ||= {
    ...fallbackSoWhat,
    nextMove: input.macro.travelType === "relocation"
      ? "Pick the cleanest arrival month or wait when the place floor is tight."
      : "Book the strongest window if flexible; simplify the trip if dates are fixed.",
  };
  if (out.tabs) {
    for (const tabId of Object.keys(out.tabs)) {
      out.tabs[tabId].soWhat ||= {
        ...fallbackSoWhat,
        goodFor: [`understanding how ${tabId.replace(/-/g, " ")} affects ${goalLabel}`],
      };
    }
  }
  if (Array.isArray(out.windows)) {
    out.windows = out.windows.map((window: any) => ({
      ...window,
      soWhat: window.soWhat || {
        ...fallbackSoWhat,
        verdict: verdictFromScore(window.score ?? headlineScore(input), input.macro.travelType),
        nextMove: `Use ${window.dates} only for the purpose named in this window.`,
      },
    }));
  }
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

function scoreBand(score: number) {
  if (score >= 75) return "good";
  if (score >= 55) return "mixed but usable";
  if (score >= 40) return "hard and narrow";
  return "avoid unless necessary";
}

function firstGoalLabel(input: TeacherReadingInput) {
  return input.editorialEvidence?.selectedGoals?.[0]?.label || "your selected goals";
}

function firstWindow(input: TeacherReadingInput) {
  const sidebars: any = input.sidebarsData || {};
  const relocation: any = input.relocation;
  if (input.macro.travelType === "relocation") {
    return relocation?.monthlyHighlights?.strongest?.[0]?.monthLabel
      || relocation?.windowsToNarrate?.[0]?.monthLabel
      || "the cleanest arrival month";
  }
  return sidebars.travelWindows?.[0]?.dates || "the strongest travel window";
}

function buildTabWritingPlan(input: TeacherReadingInput) {
  const evidence: any = input.editorialEvidence || {};
  const sidebars: any = input.sidebarsData || {};
  const destination = input.macro.destination;
  const score = headlineScore(input);
  const stance = scoreBand(score);
  const goals = (evidence.selectedGoals || []).map((goal: any) => goal.label).filter(Boolean);
  const strongest = evidence.scoreDrivers?.strongestThemes?.[0]?.label || evidence.pageThesis?.topHumanTheme || "the strongest signal";
  const weakest = input.riskSummary?.[0]?.event || evidence.pageThesis?.cautionHumanTheme || "the weakest signal";
  const cr = sidebars.chartRuler;
  const window = firstWindow(input);
  const primaryGoals = goals.length ? goals : [firstGoalLabel(input)];
  const selectedGoalText = primaryGoals.join(" and ");

  return {
    overview: {
      readerQuestion: "Is this trip worth taking, good for what, bad for what, and what should I do next?",
      openingMove: `Start by naming the travel verdict in human language: "${stance} trip" or equivalent. Then say it is useful for ${strongest}, not for ${weakest}.`,
      emotionalJob: "Make the reader feel oriented and protected, not graded.",
      stance,
      score,
      usefulFor: [strongest],
      notFor: [weakest],
      nextMove: input.macro.travelType === "relocation" ? "wait, reconsider, or choose the cleanest arrival month" : "keep the trip focused",
      evidenceToUse: ["overall score", "strongest theme", "weakest risk", "selected goal if relevant"],
      targetShape: "lead 4-5 sentences: call, use-case, caveat, action.",
    },
    "life-themes": {
      readerQuestion: `Does this place support ${selectedGoalText}?`,
      openingMove: `Start with ${selectedGoalText}, not a generic strongest theme. Say how the place handles the selected goal before naming unrelated strengths.`,
      emotionalJob: "Make the reader feel the app remembered what they asked for.",
      stance,
      goals: primaryGoals,
      usefulFor: [strongest],
      notFor: [weakest],
      nextMove: "do not force the weaker goal",
      evidenceToUse: ["selected goal", "goal score", "strongest theme", "weakest risk"],
      targetShape: "lead 4-5 sentences: selected-goal fit, useful detour, not-for caveat, practical boundary.",
    },
    "place-field": {
      readerQuestion: "How does this place show up as an environment?",
      openingMove: `${destination} should feel emotionally specific and reactive, not neutral. Describe the lived environment before receipts.`,
      emotionalJob: "Help the reader picture how the place behaves around them.",
      stance: "emotionally specific and reactive",
      environment: `${destination} needs pacing and self-awareness`,
      usefulFor: ["reading your reactions clearly"],
      notFor: ["hiding from your feelings"],
      nextMove: "pace the city carefully",
      evidenceToUse: ["geodetic band", "nearby lines", "personal geodetic hits"],
      targetShape: "lead 4-5 sentences: felt place, what it rewards, what it punishes, behavior hook.",
    },
    "what-shifts": {
      readerQuestion: "How do I feel or behave differently here?",
      openingMove: "Start with body, mood, behavior, or first-day reaction. Do not start with chart mechanics.",
      emotionalJob: "Make the shift feel observable and practical.",
      stance: cr?.natalRulerHouse === cr?.relocatedRulerHouse ? "same basic self, but your mood and body react louder" : "changed daily emphasis in your mood and body",
      usefulFor: ["noticing how your mood and body respond in real time"],
      notFor: ["pretending the place has no effect on your mood"],
      nextMove: "name how you feel and behave differently in the first day",
      evidenceToUse: ["relocated rising", "chart ruler", "relocated houses", "angle shifts"],
      targetShape: "lead 4-5 sentences: felt shift, first-day example, trap, action.",
    },
    timing: {
      readerQuestion: "When should I use this place?",
      openingMove: `Name ${window} as the best available window and say what belongs there.`,
      emotionalJob: "Turn timing into a schedule decision.",
      stance: "best available window",
      window,
      usefulFor: ["the focused part of the trip"],
      notFor: ["forcing weaker goals"],
      nextMove: "front-load the important plans and keep flexibility",
      evidenceToUse: ["best window", "supportive transits", "friction transits"],
      targetShape: "lead 4-5 sentences: best window, what to schedule, what not to force, fallback.",
    },
  };
}

function compactTeacherSignal(input: TeacherReadingInput) {
  const evidence: any = input.editorialEvidence || {};
  const sidebars: any = input.sidebarsData || {};
  const relocation: any = input.relocation;
  const chartStructure: any = input.chartStructure;
  const cr = sidebars.chartRuler;

  return {
    destination: input.macro.destination,
    travelType: input.macro.travelType,
    dateRange: input.macro.dateRange,
    score: headlineScore(input),
    headlineScore: headlineScore(input),
    placeBaselineScore: input.macro.placeBaselineScore != null
      ? Math.round(input.macro.placeBaselineScore)
      : undefined,
    verdict: scoreBand(headlineScore(input)),
    goals: compactItems(evidence.selectedGoals, 4, ["goalId", "label", "score", "outcome", "action"]),
    tabWritingPlan: buildTabWritingPlan(input),
    evidence: {
      pageThesis: evidence.pageThesis,
      strongest: compactItems(evidence.scoreDrivers?.strongestThemes, 4, ["label", "score", "why"]),
      weakest: compactItems(evidence.scoreDrivers?.lessEmphasized, 4, ["label", "score", "why"]),
      risks: compactItems(input.riskSummary, 4, ["event", "score", "travelRisk", "mitigation"]),
      leanInto: compactItems(evidence.scoreDrivers?.leanIntoEvidence, 4, ["label", "source", "score", "reason"]),
      watchOut: compactItems(evidence.scoreDrivers?.watchOutEvidence, 4, ["label", "source", "score", "reason"]),
      place: {
        geodeticBand: sidebars.geodeticBand,
        lines: compactItems(sidebars.nearbyLines, 4, ["planet", "angle", "distanceKm", "contribution"]),
        personalGeodetic: compactItems(sidebars.personalGeodetic, 3, ["planet", "angle", "angleTopic", "closeness"]),
      },
      shift: {
        chartRuler: cr ? {
          relocatedRising: cr.relocatedAscSign,
          ruler: cr.chartRuler,
          natalRulerHouse: cr.natalRulerHouse,
          relocatedRulerHouse: cr.relocatedRulerHouse,
        } : null,
        angles: compactItems(sidebars.angleShifts, 4, ["angle", "natalSign", "relocatedSign"]),
        houses: compactItems(evidence.shiftDrivers?.relocatedHouses, 5, ["planet", "natalHouse", "relocatedHouse", "topic"]),
      },
      timing: {
        windows: compactItems(sidebars.travelWindows, 4, ["rank", "dates", "score", "nights"]),
        transits: compactItems(sidebars.topTransits, 5, ["aspect", "dateRange", "tone", "houseTopics"]),
      },
      ...(chartStructure ? {
        structure: {
          patterns: compactItems(chartStructure.patterns, 3, ["key", "type", "element", "focalPlanet", "planets"]),
          finalDispositor: chartStructure.finalDispositor,
        },
      } : {}),
    },
    ...(relocation ? {
      relocation: {
        monthlyHighlights: relocation.monthlyHighlights,
        windowsToNarrate: compactItems(relocation.windowsToNarrate, 4, ["monthLabel", "arcScore", "settlingArcDescriptor", "hardestSubmonth", "drivers"]),
        placeFloorTripped: relocation.placeFloorTripped,
        personalCycle: relocation.personalCycle,
      },
    } : {}),
  };
}

export async function writeTeacherReading(
  input: TeacherReadingInput,
  userId?: string,
): Promise<TeacherReading> {
  const promptSignal = compactTeacherSignal(input);
  const inputJson = JSON.stringify(promptSignal);
  const t0 = Date.now();
  const cr = (input as any)?.sidebarsData?.chartRuler;
  const phs = (input as any)?.sidebarsData?.planetHouseShifts;
  const fullInputChars = JSON.stringify(input, null, 2).length;
  console.log(`[teacher-reading] input ${inputJson.length} chars compacted from ${fullInputChars}, calling ${MODEL} — chartRuler:${cr ? `✓ ${cr.relocatedAscSign}/${cr.chartRuler} H${cr.natalRulerHouse}→H${cr.relocatedRulerHouse}` : "✗"} planetHouseShifts:${phs?.length ?? 0}`);
  try {
    const { object, usage, finishReason } = await generateObject({
      model: gemini(MODEL),
      system: SYSTEM,
      prompt: `${COMPACT_TASK_INSTRUCTIONS}\n\n<brief>\n${inputJson}\n</brief>\n\nWrite the teacher reading JSON. Stay strictly inside the brief — do not invent.`,
      schema: TeacherReadingSchema,
      // Gemini 3.x charges "thinking" tokens against maxOutputTokens. Without
      // capping thinking, the model burns thousands of tokens reasoning and
      // truncates the JSON mid-output. structuredOutputs forces server-side
      // schema enforcement, which is more reliable than client-side parsing.
      maxOutputTokens: 32768,
      providerOptions: {
        google: {
          thinkingConfig: { thinkingLevel: process.env.GEMINI_THINKING_LEVEL || "minimal" },
          structuredOutputs: true,
        },
      },
      experimental_telemetry: {
        isEnabled: true,
        functionId: "teacher-reading",
        metadata: userId ? { posthog_distinct_id: userId } : undefined,
      },
    });
    const generated: TeacherReading = object as TeacherReading;
    console.log(`[teacher-reading] ok in ${Date.now() - t0}ms — finish=${finishReason}, usage=${JSON.stringify(usage)}`);
    console.log(`[teacher-reading] core fields — tabs:${generated.tabs ? "✓" : "✗"} overview:${generated.overview ? "✓" : "✗"} timing:${generated.timing ? "✓" : "✗"} chartRulerReframe:${generated.chartRulerReframe ? "✓" : "✗"}`);

    // Defensive backfill: when the input had clusters or patterns but the LLM
    // skipped clusterCommentary / patternCommentary (Gemini routinely ignores
    // REQUIRED directives on optional schema fields), synthesize the missing
    // entries from the engine's structured data so the reader sees the actual
    // member planets bound to the term.
    const backfillReport = backfillChartStructureCommentary(generated, input.chartStructure);
    if (backfillReport.patternsBackfilled.length > 0 || backfillReport.clustersBackfilled.length > 0) {
        console.log(`[teacher-reading] chart-structure backfill — clusters:[${backfillReport.clustersBackfilled.join(",")}] patterns:[${backfillReport.patternsBackfilled.join(",")}]`);
    }
    return backfillSoWhat(generated, input);
  } catch (err: any) {
    console.error(`[teacher-reading] failed after ${Date.now() - t0}ms — finish=${err?.finishReason ?? "?"}, textLen=${err?.text?.length ?? 0}, usage=${JSON.stringify(err?.usage ?? {})}`);
    throw err;
  }
}
