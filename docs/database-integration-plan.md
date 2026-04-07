# Live Database & API Hookup Plan

This plan details the strategy for moving the AstroNat application from mock/hardcoded data to live mathematical computations powered by Swiss Ephemeris, stored and retrieved directly from Supabase.

## Application State Summary

### 1. `/readings` (History)
- **Status:** Mostly Hardcoded.
- **Hardcoded Items:** `MOCK_READINGS` in `app/readings/page.tsx` (`id`, `destination`, `score`, `travelDate`, `travelType`). Links add `?demo=true`.
- **Works:** UI layout, animations, `ScoreRing` verdict, routing to new reading.
- **API Strategy:** Fetch data from Supabase `readings` table where `user_id = auth.uid()`. 

### 2. `/reading/[id]` (Single Reading / Result)
- **Status:** Mixed. Fetches from Supabase if `!isDemo` but demo still uses `MOCK_READING_DETAILS`.
- **Hardcoded Items:** Demo uses `mock-readings.ts`.
- **Works:** Integration with Supabase is mostly there via `readings` table but the actual data inside `details` is expected to be rich (houses, transitWindows, planetaryLines).
- **API Strategy:** Finish `/api/readings/generate` POST endpoint to compute and generate all this data using SwissEphemeris and insert it into Supabase.

### 3. `/chart` (Natal Chart & Relocation Map)
- **Status:** Mixed. Fetches mostly real planets but heavily relies on mock aspects and static demo values.
- **Hardcoded Items:** `DEMO_NATAL`, `MOCK_PLANETS`, `MOCK_ASPECTS`, `DEMO_CITY`. Aspects are totally hardcoded.
- **Works:** Getting basic natal planets from `/api/natal`. ACG Map renders lines based on natal positions. Theme toggle.
- **API Strategy:** Update `/api/natal` to compute real astrological aspects (Conjunctions, Squares, Trines, Sextiles, Oppositions) with Orbs. Wire up dignities.

### 4. `/birthday` (Solar Return Optimizer)
- **Status:** Fully Hardcoded.
- **Hardcoded Items:** `MOCK_RESULTS` for Top 5 cities.
- **Works:** The UI selector for year, city ranking visual, animated rings.
- **API Strategy:** Need an API endpoint (`/api/birthday/generate`) that generates the Solar Return Chart for the user's birth time adjusted for the given year, scores a predefined set of major cities globally against that Solar Return chart, and returns the top 5 cities.

### 5. `/goals` (User Life Goals)
- **Status:** Hooked up to Supabase.
- **Hardcoded Items:** None really. 
- **Works:** Reads from `profiles.life_goals`. Writes back successfully via `saveGoals`.
- **API Strategy:** No further changes needed.

### 6. `/couples` (Synastry / Relationships)
- **Status:** Fully Hardcoded.
- **Hardcoded Items:** `MOCK_RESULT` displaying `userScore`, `partnerScore`, `compositeScore`, `breakdowns`. 
- **Works:** The 3-column UI component, conflict callout, score comparison matrix.
- **API Strategy:** Create `/api/couples/generate` that takes Partner's birth data + Destination, computes Relocated charts for BOTH at the destination, and calculates a Composite chart score.

### 7. `/mundane` (Country Charts)
- **Status:** Mostly Hardcoded.
- **Hardcoded Items:** `MOCK_SYNASTRY`, generic constant `getCountryNatal()` returning a fixed chart for all countries.
- **Works:** Search bar, grid UI, flags.
- **API Strategy:** Create `/api/mundane/synastry` to compute the actual natal chart of the country dynamically based on founding date/location, then calculate aspects against the user's natal chart.

### 8. `api/readings/generate/route.ts` & Computations
- **Status:** The backend engine scripts exist (`/lib/house-matrix.ts`, `/lib/scoring-engine.ts`) but the generation route is mocked.
- **API Strategy:** Link up the generation route to perform the actual computations: project natal to destination, run `computeHouseMatrix`, `computeEventScores`, then save to `readings` table.
