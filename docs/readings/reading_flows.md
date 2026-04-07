# Reading Flows Architecture

This document describes the flow and component architecture for creating new astrological readings in the Astro-Nat dashboard.

## Overview
Astro-Nat provides multiple entry points to initiate readings, abstracting complex astrological chart concepts into a clean, intent-driven wizard. We route authenticated users away from the generic primary onboarding flow (`/flow`) and instead use a dedicated reading creation wizard (`/reading/new`).

## Core Components

### 1. `ReadingFlow.tsx` (Wizard Component)
Situated at `app/components/ReadingFlow.tsx`, this component manages local state for a specific chart calculation request.

**State Elements:**
- `type`: "travel" | "relocation" | "couples"
- `goals`: Array of user intentions (max 3, e.g., "love", "career", "timing").
- `destination`: Geospatial target city.
- `date`: Optional target travel/relocation date.

**Steps:**
1. **Type Selection**: Determines if we are computing a standard Astrocartography map (Travel/Relocation) or a Synastry composite (Couples).
2. **Intent Matching**: Let users prioritize their goals. While the engine computes all planetary lines, highlighting goals allows the frontend to curate the final editorial scrollytelling (`/reading/[id]`).
3. **Coordinate Input**: Captures destination and resolves latitude/longitude before computation.

### 2. Entry Points (`HomeClient.tsx`)
The dashboard exposes these specific flows:
- **New Reading CTA**: Routes to `/reading/new`.
- **Couples CTA**: Routes to `/reading/new?type=couples` to automatically select the synastry branch of the wizard.

### 3. Backend Integration
Upon completion of the wizard, the UI posts a payload to `/api/readings/generate`:
```json
{
  "destination": "Tokyo, Japan",
  "travelType": "trip",
  "readingCategory": "astrocartography",
  "targetLat": 35.6764,
  "targetLon": 139.6500,
  "travelDate": "2026-05-12",
  "goals": ["career", "timing"]
}
```

The API then:
1. Validates the incoming payload.
2. Performs a cache check for base `natal_charts` computations.
3. Triggers the Swiss Ephemeris and House Matrix scoring engine for the `targetLat/targetLon`.
4. Persists the macro score, event breakdown, and transit data inside the `public.readings` table.
5. Returns a `readingId` to the UI, which routes to `/reading/[readingId]`.

## Avoiding Re-Onboarding
By keeping this flow discrete from `/flow/page.tsx` (which manages `profiles` ingestion), we ensure returning users do not have to resubmit their core birth data just to compute a new destination chart.
