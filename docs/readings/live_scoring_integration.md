# Live Scoring Integration Architecture

This document describes the end-to-end integration architecture for replacing the mocked reading generation logic with the live `computeHouseMatrix` data science scoring engine, powered by the Swiss Ephemeris (`Moshier`).

## Objective
Connect `/api/readings/generate/route.ts` to `SwissEph`, calculating relocated house cusps, mapping astrocartography distances, calculating transit windows, and returning the structured live `HouseMatrixResult`.

## Data Flow & Computation Pipeline

### 1. Refactor Natal Chart Generation into Core Utility
Currently, raw Swiss Ephemeris logic for natal charts is coupled to the GET handler at `app/api/natal/route.ts`. 

**Action**: Extract the core `generateNatalData(profile, swe)` logic from `api/natal/route.ts` into `lib/astro/core.ts` so it can be cleanly reused by the reading generator upon a cache-miss.

### 2. Generator API Execution Pipeline (`app/api/readings/generate/route.ts`)
The API handles the creation of the dynamic reading via the following sequential steps:

1. **Profile Fetches**: Fetch the user's `profiles` database record to access accurate UTC birth date/time and coordinates.
2. **Natal Retrieval**: Retrieve `cachedChart.ephemeris_data.planets`. If missing, synchronously utilize the extracted helper from Step 1 to compute and cache the natal placements.
3. **Compute Relocated Environment**:
   - `relocatedCusps`: Call `swe.houses()` utilizing the *user's birth time* but targeting the *destination's* Latitude and Longitude.
   - The destination Coordinates (`destLat`, `destLon`) are read directly from the POST payload.
4. **Compute ACG Distances**:
   - Execute `computeACG(birthUtc)` to retrieve the global natal planetary lines.
   - Iterate through every planetary line and calculate the `haversineDistance()` between the target destination and the closest point on the ACG coordinates to map them into the required `MatrixACGLine[]` format.
5. **Compute Transits**:
   - Execute `computeRealtimePositions(travelDateUtc)` to find the global planetary configurations for the specific date of travel/relocation.
   - Calculate aspects between the transit positions and natal positions using `findAllAspects()` and map them using `mapTransitsToMatrix()`.
6. **Execution Engine**:
   - Feed all aggregated variables (Natal Planets, Relocated Cusps, ACG Lines, Transits, destLat, destLon) natively into the `computeHouseMatrix()` function.
   - Extract the returned `macroScore` and `houses` output.
7. **Storage**:
   - Write the finalized computations to the `readings` SQL table mapping the JSON payload to the `.details` column and returning the UUID to the client application.

## System Interfaces

The output of the Matrix Engine (`HouseMatrixResult`) inherently provides the granular `score`, `rulerPlanet`, `relocatedSign`, `rulerCondition`, and nested `breakdown` data which is immediately hydrated into the React frontend via `/reading/[id]/page.tsx` for the final scrollytelling UX.

> **Note on Parans**: For Version 1 of this live integration, deep Paran intersection mathematics are excluded from the main execution branch to guarantee sub-second serverless response times. The engine safely handles empty incoming Paran arrays.
