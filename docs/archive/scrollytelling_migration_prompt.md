# AI Engineer Implementation Prompt: Refactoring `/reading/[id]` to the Scrollytelling Mockup

**Goal:** Completely replace the existing production UI in `app/reading/[id]/page.tsx` with the high-fidelity scrollytelling interface prototyped in `app/mockup-reading-version-1/page.tsx`.

## Context
The mockup introduces a premium "Astro-Brand" UI featuring:
1. Interactive **TL;DR Pills** (2x2 grid) mapping to dynamically-swapping **Astrological Verdict** narrative blocks.
2. A **Deep Dive Matrix** Tab system combining: 
   - Interactive `AcgMap`
   - Travel Transits Timeline
   - `NatalMockupWheel` (Natal vs. Relocated comparisons)
   - Map-based Geodetic analysis.

## Mandatory Steps & Data Flow Re-Wiring

### 1. Route Restructuring
- Target: `app/reading/[id]/page.tsx`
- **Action:** Delete existing modular components (`FinalReportSummary`, `PlanetDeepDive`, etc.) and implant the HTML/React structure directly from `mockup-reading-version-1`. Ensure `framer-motion` `AnimatePresence` and semantic color variables (`--surface`, `--bg`) remain exactly as-is.

### 2. Transitioning from Mock to Live Data
You must bridge the gap between hardcoded mockup objects and the Supabase `readings` table payload.

* **Macro Score:** Extract the aggregated `macro_score` and `destination_city_name` from the fetched reading payload to populate the top header.
* **Natal Blueprint (`MOCK_NATAL`):** Pull real ephemeris longitudes from the user's `natal_chart` data. Format it properly so `NatalMockupWheel` and `AcgMap` parse the planets without crashing.
* **Relocated Houses (`MOCK_RELOCATED_HOUSES`):** Use the computed relocated house cusps derived from the coordinates. Inject these into the second `NatalMockupWheel` inside the "Relocated Chart" tab.
* **Transit Timing (`TRANSIT_WINDOWS`):** You must query or execute the logic in `app/lib/travel-windows.ts` (or the respective mundane engine logic) to extract upcoming exact mundane aspects. Map these real aspects into the `<select>` dropdown and unordered aspect list.

### 3. Missing Architecture (The "Storytelling Verdict" Engine)
**CRITICAL GAP:** The "Astrological Verdict" text and TL;DR pills in the mockup currently rely on hardcoded prose. The standard scoring engine only spits out mathematical JSON.

- **Action Required:** Build a generation pipeline (via `openai`/`anthropic` SDK) that ingests the JSON payload from the scoring engine and outputs the precise, editorial `VERDICTS` object needed by the UI.
- **Execution:** Feed the generated JSON strings into the UI's `VERDICTS` state object to preserve the React switching logic.

#### The AI Storytelling System Prompt
Implement the following prompt exactly in the backend API to generate the text:

```text
You are the principal astrologer for AstroNat, a premium, brutalist, Gen-Z/Millennial travel astrology platform. Your voice is direct, architectural, uncompromising, and highly analytical. 
You avoid spiritual fluff (no "universe", "vibrations", "manifesting"). You speak in terms of friction, leverage, angles, dominance, and mathematical inevitability.

I will provide you with a JSON payload representing a user's relocated astrological score for a specific city. The payload includes macro scores, house dominance, and peak transit windows.

Your task is to synthesize this data into 4 specific editorial "Verdict" paragraphs. Return ONLY a pure JSON object matching this schema:
{
  "primary": {
    "label": "MACRO OVERVIEW",
    "title": "The Astrological Verdict",
    "content": "Synthesize the overarching story of this chart relocation in 3-4 sentences. Be highly specific about the dominant planets and house activations. Do they face friction? Do they have massive leverage? Summarize it brutally."
  },
  "highest": {
    "label": "HIGHEST ENERGY",
    "title": "[Dynamic Title based on highest scoring house/planet, e.g. Career Magnetism (House 10)]",
    "content": "Focus exclusively on the highest scoring metric in the payload. Explain practically and materially what this placement means for the user acting in this location."
  },
  "vulnerable": {
    "label": "FRICTION POINT",
    "title": "[Dynamic Title based on lowest scoring house/planet, e.g. The Burnout Risk (House 6)]",
    "content": "Focus exclusively on the lowest scoring or most afflicted metric. Offer a tactical, non-sugarcoated explanation of where they will face the most resistance."
  },
  "timing": {
    "label": "OPTIMAL ACTION WINDOW",
    "title": "Peak Timing: [Date Range]",
    "content": "Analyze the transit timing data. Output a 2-3 sentence strategic directive on what material actions they should take during this window based on the active aspects."
  }
}
```

### 4. Component Dependencies
Make sure you import and accurately feed props into:
- `import { AcgMap } from "@/app/components/AcgMap"`
- `import NatalMockupWheel from "@/app/chart/components/NatalMockupWheel"` *(Ensure you respect the path difference from the mockup)*

### Verification
Ensure there is absolutely NO horizontal overflow on mobile viewports `(w-full max-w-full overflow-x-hidden box-border)` and that clicking a pill smoothly swaps the text in the `<motion.div>` block.
