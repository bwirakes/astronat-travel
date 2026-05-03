# Technical Implementation Plan: Reading Tabs Editorial Overhaul

This plan details how we will modify the AI prompt generation, the data schema, and the UI components to achieve the required narrative flow, specifically addressing the Overview, Life Themes, Geography (Place Field), and Relocation (What Shifts) tabs.

## 1. Modifying the Data Schemas (`lib/ai/schemas.ts`)

To support a more narrative, paragraph-driven structure for "Lean Into" and "Watch Out", we need to adjust the `OverviewEditorialSchema` so the UI can expect robust paragraphs rather than simple bulleted lists.

### [MODIFY] `lib/ai/schemas.ts`
Currently, `leanInto` and `watchOut` are string arrays. If we want them to be a single, cohesive LLM-written explanation of the score drivers, we can change them to strings (paragraphs) or objects that contain both a summary and bullet points.
```typescript
const OverviewEditorialSchema = z.object({
  scoreExplanation: z.string(),
  goalExplanation: z.string(),
  // We will keep these as arrays but instruct the prompt to return 2-3 detailed paragraphs 
  // instead of 5 generic bullet points. Alternatively, we can change them to objects:
  leanInto: z.array(z.string()).max(3),
  watchOut: z.array(z.string()).max(3),
});
```
*Note: We can keep them as arrays but drastically change the prompt to output detailed, multi-sentence paragraphs instead of short bullets, allowing the UI to render them as distinct, readable blocks.*

## 2. Overhauling the AI Prompt (`lib/ai/prompts/teacher-reading.ts`)

The root cause of the generic copy is in the prompt instructions. Currently, the prompt tells the AI to base the "Lean Into" section *only* on `editorialEvidence.scoreDrivers`, which in `app/lib/reading-tabs.ts` is populated with hardcoded strings like "Growth is one of the clearest outcomes this place supports." 

We will rewrite the prompt instructions for the affected sections:

### [MODIFY] `lib/ai/prompts/teacher-reading.ts`
We will update the `SYSTEM` prompt in the following areas:

**For the Overview Tab (`overview`):**
```text
**overview** — Outcome-first copy for the answer page.
- `scoreExplanation`: MUST combine the destination, the user's `goalIds` (primary goal), and the `dateRange` into the very first sentence. Explain the `overallScore` by explicitly citing the `topTransits` and `nearbyLines` that drive it. Example: "Hong Kong is a great place for your career goals during May 12-22 because Mars squares Uranus, giving you the friction needed to push a project forward."
- `goalExplanation`: Name the user's selected goal outcome and explain how the chart supports it.
- `leanInto`: Do not write generic bullets. Write 1-2 detailed paragraphs explaining the positive drivers of the `overallScore`. Synthesize the `scoreBreakdown`, `activeHouses`, and `nearbyLines` to explain exactly *why* the score is high and what specific energy to use.
- `watchOut`: Write 1-2 detailed paragraphs explaining the negative drivers or friction points based on `topTransits` or `lessEmphasized` themes.
```

**For the Life Themes Tab (`life-themes`):**
```text
**tabs** — One entry per `editorialEvidence.tabs[].id`.
- For `life-themes`: The `plainEnglishSummary` MUST evaluate the strongest themes through the lens of the user's primary goal FIRST. Frame the loud themes as either supporting the goal or pulling focus away from it. (e.g., "While you came looking for love, this place pulls you toward work...")
```

**For the Geography / Place Field Tab (`place-field`):**
```text
- For `place-field`: The core question is "How do I fit in?". The `plainEnglishSummary` must mention how the user's specific core placements (e.g., Moon, Sun) interact with the geography and change their physical perception or experience of the environment.
```

**For the Relocation / What Shifts Tab (`what-shifts`):**
```text
- For `what-shifts`: The core question is "How am I perceived here?". You MUST lead the `plainEnglishSummary` with the user's new relocated Rising sign, its ruling planet, and how that shifts their public perception. Mention activating specific relocated placements (e.g., "focus on activating Jupiter in Gemini").
```

## 3. Resolving the Generic Evidence Bug (`app/lib/reading-tabs.ts`)

### [MODIFY] `app/lib/reading-tabs.ts`
Currently, `deriveScoreNarrative` creates hardcoded generic strings for `leanIntoEvidence` and `watchOutEvidence`. While the AI prompt will be updated to ignore these and use the raw signals, it is cleaner to either remove these hardcoded strings or enrich them with the actual house/transit data so the AI has better context. 

Since the AI already receives `activeHouses`, `nearbyLines`, and `topTransits` in `TeacherReadingInput`, we will instruct the AI (in `teacher-reading.ts`) to rely on those raw signals for `leanInto` rather than the sterile `leanIntoEvidence` strings.

## 4. UI Adjustments (`app/(frontend)/(app)/reading/[id]/components/v4/tabs/`)

### [MODIFY] `OverviewTab.tsx`
The `SupportBlock` component currently renders `leanInto` and `watchOut` items as a list `<ul><li>`. If the AI generates 1-2 robust paragraphs instead of 4-5 short bullets, we need to adjust the typography and spacing of `SupportBlock` so it reads like an editorial paragraph rather than a list of terms.
- Remove the asterisk `*` list style if the AI returns paragraphs.
- Adjust `lineHeight` and `gap` to support longer text blocks.

## How the Score Feeds into This

You asked about **the score**: 
The `overallScore` is computed via `computeHouseMatrix` in `lib/readings/astrocarto.ts`. It is broken down into `scoreBreakdown` (place, timing, sky). 

1. **The Math:** The `overallScore` is determined by how well the `nearbyLines` (Astrocartography), `activeHouses` (Relocation), and `topTransits` (Timing) align with the weights for the user's chosen `goalIds` (e.g., Career heavily weights houses 10, 6, 2).
2. **The AI Hand-off:** This math is passed to the AI as raw facts (e.g., "Overall Score: 85, Place: 40, Timing: 30, Sky: 15"). 
3. **The Synthesis (The Fix):** Currently, the AI is NOT instructed to explain *how* those points were earned. With the updated prompt, the AI will look at the `overallScore`, see that the user selected "Career", see that "Mars on MC" is a top line, and explicitly write: *"Your score of 85 is heavily driven by the place itself—specifically your Mars line on the Midheaven, which lifts your career potential."*

## User Review Required

Does this technical architecture align with how you want the data to flow? 

Specifically:
1. Are you okay with changing `leanInto` and `watchOut` from short bullet points to 1-2 detailed paragraphs in the UI (`OverviewTab.tsx`)?
2. Once approved, I will implement these changes directly in the AI prompt and UI files without writing any new logic—just rewiring the existing inputs to produce the high-fidelity output you requested.
