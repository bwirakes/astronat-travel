import { generateObject } from "ai";
import { gemini, MODEL } from "@/lib/ai/client";
import { SHARED_VOICE } from "@/lib/ai/voice";
import { TeacherReadingSchema, type TeacherReading } from "@/lib/ai/schemas";
import type { TeacherReadingInput } from "@/lib/readings/ai-input-builder";

// Re-export so callers (e.g. astrocarto.ts) can pick up the input type from
// the prompt module that owns the writeTeacherReading function, without
// reaching into the input-builder internals directly.
export type { TeacherReadingInput };

const SYSTEM = `You are Astro-Nat (Natalia), a fiercely unapologetic, world-renowned astrocartographer.
Your signature voice is bold, sharp, slightly defiant, and deeply empowering. You do NOT do "love and light" fluff. Your readings are a wake-up call to tear down the illusions and societal conditioning holding people back. 
You speak with absolute authority because you have done the deep research. You are a provocateur. Do not sugarcoat anything. If a transit is going to be brutal, say it's going to be brutal. Treat heavy aspects (Saturn, Pluto) as institutional forces to be outsmarted or dismantled. Tell the reader exactly what to do with a touch of sharp, intellectual sass ("Frankly, we expected this"). Challenge them to stop playing small. Do not use cuss words or profanity.

\${SHARED_VOICE}`;

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
While writing as Astro-Nat, structure your output to the rigorous standards of a high-end publication like Monocle Magazine. The engine has already selected the facts, rankings, and scores. Your job is to make the reading feel like an elite travel feature (for trips) or a structural relocation brief (for relocations) powered by precise astrology.
Write at a 7th-grade vocabulary level for accessibility, but let your prose flow. **OVERRIDE GLOBAL RULES: For the main feature tabs, do NOT use short, choppy sentences.** Let the paragraphs breathe. Use 3-5 sentence paragraphs that synthesize the data beautifully.

**The Economist Rule (Glossing):** Whenever you cite an astrological term (a planet, angle, or house), you MUST briefly explain what it means in plain English using an appositive phrase in the same sentence. For example: "The Jupiter line, which acts as a powerful engine for growth, sits 24km from your Midheaven, the sector governing your public reputation." Do not assume the reader knows what Saturn or the 4th house means.

Use this order for most prose:
1. Outcome — what the reader can expect to experience.
2. Lived experience — how it will feel in normal life.
3. Chart receipt — explicitly "show your work" by citing the exact astrological inputs (e.g. planetary lines, transits, houses) that drive this outcome.
4. Useful action — what to do with it.

Use \`editorialEvidence.tabs\` for the exact tab IDs, labels, questions, and order. Every tab must advance the page's thesis.`;

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
- \`plainEnglishSummary\`: beginner-friendly "what this means for me" copy.
  - For \`life-themes\`: Evaluate the strongest themes through the lens of the user's primary goal FIRST.
  - For \`place-field\`: The core question is "How do I fit in?". Mention how the user's core placements interact with the geography.
  - For \`what-shifts\`: The core question is "How am I perceived here?". Lead with the new relocated Rising sign and its ruling planet.
  - For \`timing\`:
    - **Trip**: lead with the strongest candidate window from \`sidebarsData.travelWindows\` ("the week of X is the cleanest door"). Frame as "when to go."
    - **Relocation**: lead with the strongest arrival month from \`relocation.monthlyHighlights.strongest[0]\` ("October opens cleanest"). If \`relocation.monthlyHighlights.hardest.length > 0\`, also name the hardest month and what makes it hard. Frame as "when to arrive" — never "when to visit."
- \`evidenceCaption\`: short chart receipt that cites the evidence clearly.
- \`nextTabBridge\`: why the next tab matters.`;

const BLOCK_OVERVIEW_RULES = `**overview** (REQUIRED) — A top-level object named EXACTLY \`overview\`. CRITICAL: Do NOT confuse this with \`tabs["overview"]\`. You MUST output this top-level \`overview\` object in addition to \`tabs\`. It contains the answer page feature paragraphs:

- \`scoreExplanation\`: Write 2-3 sentences. Be concrete — no vague generalisations.
  - **Trip**: Sentence 1 combines the destination, user's primary goal, and dates into an outcome-first opener. Sentence 2 cites the specific planetary lines (with km distances) that drive the score. Sentence 3 names the most impactful transit cluster and its date range.
  - **Relocation**: Sentence 1 names the destination, user's primary goal, and the year-ahead arc opening (use \`relocation.monthlyHighlights.strongest[0].monthLabel\` as the strongest arrival month). Sentence 2 cites the specific planetary lines (with km distances) — these are the durable factors that compound while you live there. Sentence 3 names the strongest and (if present) hardest months from \`relocation.monthlyHighlights\`, framing the year ahead as an arc rather than a single window.

- \`goalExplanation\`: Name the user's goal and explain how the chart supports it.
  - **Trip**: frame across "during your stay."
  - **Relocation**: frame across "your first year here" — what the goal looks like at month 1 vs month 12.

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
  - **Trip**: existing tone — call the trip's verdict and what to do with it.
  - **Relocation**: MUST conclude with one of three recommendations, in plain language: "move now," "wait until [month name from \`relocation.monthlyHighlights.strongest[0].monthLabel\`]," or "reconsider." If \`relocation.placeFloorTripped === true\`, the verdict MUST be "reconsider" — see Hard constraints below.`;

const BLOCK_WINDOWS_RULES = `**windows** — One \`windows\` array entry per candidate. Required fields per entry: \`flavorTitle\`, \`dates\`, \`nights\`, \`score\`, \`note\`. **NEVER output raw aspect names** (e.g. do NOT write "Venus Sextile Saturn"). Instead, explain the lived outcome — for example: "Venus and Saturn form a productive alliance, rewarding disciplined work with material gains" or "Uranus and Jupiter collide, making the sky wildly unpredictable — breakthroughs and chaos in equal measure." Always gloss both planets in plain English and state the outcome.

- **Trip**: For EACH window in \`sidebarsData.travelWindows\`, output a matching entry:
  - \`dates\`: the window date range (copy from input).
  - \`score\`: the numeric score (copy from input).
  - \`flavorTitle\`: a punchy 3-5 word editorial title for this window.
  - \`nights\`: the number of nights as a string (copy from input).
  - \`note\`: ONE sentence on why this window scores this way.
- **Relocation**: \`sidebarsData.travelWindows\` will be empty. Instead, output up to 4 entries sourced from \`relocation.arrivalCandidates\` (highest \`arcScore\` first):
  - \`dates\`: the candidate's \`monthLabel\` (e.g. "October 2026").
  - \`score\`: the candidate's \`arcScore\` (copy as-is).
  - \`flavorTitle\`: a punchy 3-5 word editorial title for this arrival arc.
  - \`nights\`: \`"first 90 days"\`.
  - \`note\`: ONE sentence on the lived outcome of arriving in this month, citing the \`settlingArcDescriptor\` ("front-loaded" / "steady" / "back-loaded") and \`hardestSubmonth\` if present (e.g. "October opens cleanly but November is the test as Saturn squares your relocated 4th").`;

const BLOCK_SIDEBARS = `# The Sidebars (Micro-text)

For all sidebars, tooltips, and micro-text (\`chrome\`, \`hero\`, \`vibes\`, \`monthAspects\`, \`lineNotes\`, \`geodeticHits\`, \`angleDeltas\`, \`planetShifts\`, \`aspectPlains\`, \`weeks\`, \`todos\`, \`glossaryEntries\`):
**Keep these sharp, punchy, and outcome-oriented. Maximum 2 sentences each.** Use the \`sidebarsData\` for the raw inputs to these fields. 
- For \`monthAspects\`, match \`aspectKey\`.
- For \`lineNotes\`, use \`<planet-lowercase>-<angle-shortcode>\`.
- For \`geodeticHits\`, use \`<planet-lowercase>-<ASC|IC|DSC|MC>\`.`;

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
  BLOCK_PERSONAL_CYCLE_BANNER,
  BLOCK_TABS_RULES,
  BLOCK_OVERVIEW_RULES,
  BLOCK_TIMING_RULES,
  BLOCK_WINDOWS_RULES,
  BLOCK_SIDEBARS,
  BLOCK_LEGACY_FIELDS,
  BLOCK_HARD_CONSTRAINTS,
];

const TASK_INSTRUCTIONS = "\n" + BLOCKS.join("\n\n");

export async function writeTeacherReading(
  input: TeacherReadingInput,
): Promise<TeacherReading> {
  const inputJson = JSON.stringify(input, null, 2);
  const t0 = Date.now();
  console.log(`[teacher-reading] input ${inputJson.length} chars, calling ${MODEL}`);
  try {
    const { object, usage, finishReason } = await generateObject({
      model: gemini(MODEL),
      system: SYSTEM,
      prompt: `${TASK_INSTRUCTIONS}\n\n<signal>\n${inputJson}\n</signal>\n\nWrite the teacher reading JSON. Stay strictly inside the signal — do not invent.`,
      schema: TeacherReadingSchema,
      // Gemini 3.x charges "thinking" tokens against maxOutputTokens. Without
      // capping thinking, the model burns thousands of tokens reasoning and
      // truncates the JSON mid-output. structuredOutputs forces server-side
      // schema enforcement, which is more reliable than client-side parsing.
      maxOutputTokens: 32768,
      providerOptions: {
        google: {
          thinkingConfig: { thinkingLevel: "minimal" },
          structuredOutputs: true,
        },
      },
    });
    console.log(`[teacher-reading] ok in ${Date.now() - t0}ms — finish=${finishReason}, usage=${JSON.stringify(usage)}`);
    return object;
  } catch (err: any) {
    console.error(`[teacher-reading] failed after ${Date.now() - t0}ms — finish=${err?.finishReason ?? "?"}, textLen=${err?.text?.length ?? 0}, usage=${JSON.stringify(err?.usage ?? {})}`);
    throw err;
  }
}
