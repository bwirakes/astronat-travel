/**
 * Backtest corpus for the geodetic weather engine.
 *
 * Each case has a source (NOAA / EM-DAT / USGS / research) so it can be
 * traced. Targets are the DATE when the event peaked, in UTC, and the lat/lon
 * of the most-affected coordinate.
 *
 * Runner: see scripts/geodetic-backtest.ts (calls the local /api/geodetic-weather
 * endpoint and computes aggregate metrics).
 */

export type BacktestTier =
    | "Calm" | "Unsettled" | "Turbulent" | "Severe" | "Extreme";

export type BacktestLayer =
    | "angle-transit" | "paran" | "station" | "world-point"
    | "ingress" | "eclipse" | "late-degree" | "configuration"
    | "severity-modifier";

export type BacktestCategory =
    | "hydromet" | "geophysical" | "wildfire"
    | "mundane-trigger" | "control-calm";

export interface BacktestCase {
    id: string;
    label: string;
    dateUtc: string;                    // YYYY-MM-DD
    lat: number;
    lon: number;
    category: BacktestCategory;
    /** Lowest severity tier we expect (inclusive). */
    expectedMinTier: BacktestTier;
    /** Layers we expect to see fire in the events array. */
    expectedLayers: BacktestLayer[];
    /** Optional control pair: score this same dateUtc at another location
     *  and assert |eventScore − controlScore| ≥ threshold. */
    regionalControl?: { lat: number; lon: number; label: string };
    source: string;
    notes?: string;
}

export const CASES: BacktestCase[] = [
    // ── Hydrometeorological ──────────────────────────────────────────────
    {
        id: "valencia-dana-2024",
        label: "Spain Valencia DANA floods",
        dateUtc: "2024-10-29", lat: 39.47, lon: -0.38,
        category: "hydromet", expectedMinTier: "Turbulent",
        expectedLayers: ["angle-transit", "late-degree"],
        regionalControl: { lat: -36.85, lon: 174.76, label: "Auckland" },
        source: "EM-DAT DANA 2024",
        notes: "Neptune 29° Pisces anaretic, conjunct Scheat. OOB Mars/Moon cited in research.",
    },
    {
        id: "rhine-floods-2021",
        label: "Germany/Belgium Rhine floods",
        dateUtc: "2021-07-14", lat: 50.3, lon: 7.6,
        category: "hydromet", expectedMinTier: "Turbulent",
        expectedLayers: ["angle-transit"],
        source: "EM-DAT July 2021 floods",
    },
    {
        id: "pakistan-floods-2022",
        label: "Pakistan superfloods",
        dateUtc: "2022-08-28", lat: 27.5, lon: 68.4,
        category: "hydromet", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "EM-DAT Pakistan 2022 monsoon",
    },
    {
        id: "katrina-2005",
        label: "Hurricane Katrina landfall",
        dateUtc: "2005-08-29", lat: 30.0, lon: -89.9,
        category: "hydromet", expectedMinTier: "Unsettled",
        expectedLayers: ["angle-transit"],
        source: "NOAA NHC 2005",
    },
    {
        id: "sandy-2012",
        label: "Hurricane Sandy landfall",
        dateUtc: "2012-10-29", lat: 40.7, lon: -74.0,
        category: "hydromet", expectedMinTier: "Unsettled",
        expectedLayers: ["angle-transit"],
        source: "NOAA NHC 2012",
    },
    {
        id: "harvey-2017",
        label: "Hurricane Harvey Houston",
        dateUtc: "2017-08-26", lat: 29.76, lon: -95.37,
        category: "hydromet", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "NOAA NHC 2017",
    },
    {
        id: "maria-2017",
        label: "Hurricane Maria Puerto Rico",
        dateUtc: "2017-09-20", lat: 18.22, lon: -66.50,
        category: "hydromet", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "NOAA NHC 2017",
    },
    {
        id: "ian-2022",
        label: "Hurricane Ian SW Florida",
        dateUtc: "2022-09-28", lat: 26.7, lon: -82.0,
        category: "hydromet", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "NOAA NHC 2022",
    },
    {
        id: "libya-derna-2023",
        label: "Libya Derna dam collapse",
        dateUtc: "2023-09-11", lat: 32.8, lon: 22.6,
        category: "hydromet", expectedMinTier: "Unsettled",
        expectedLayers: ["angle-transit"],
        source: "EM-DAT Storm Daniel 2023",
    },
    {
        id: "dubai-floods-2024",
        label: "Dubai record floods",
        dateUtc: "2024-04-16", lat: 25.1, lon: 55.2,
        category: "hydromet", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "EM-DAT Dubai 2024",
    },
    {
        id: "cyclone-idai-2019",
        label: "Cyclone Idai Mozambique",
        dateUtc: "2019-03-14", lat: -19.8, lon: 34.9,
        category: "hydromet", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "EM-DAT Idai 2019",
    },
    {
        id: "texas-uri-2021",
        label: "Texas winter storm Uri",
        dateUtc: "2021-02-14", lat: 32.8, lon: -96.8,
        category: "hydromet", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "NWS Uri 2021",
    },
    {
        id: "storm-harry-2025",
        label: "Storm Harry Mediterranean",
        dateUtc: "2025-02-10", lat: 38.5, lon: 15.0,
        category: "hydromet", expectedMinTier: "Turbulent",
        expectedLayers: ["late-degree", "severity-modifier"],
        source: "Research synthesis",
        notes: "Neptune 29°58' Pisces + Scheat + OOB Mars/Moon",
    },

    // ── Geophysical ──────────────────────────────────────────────────────
    {
        id: "tohoku-2011",
        label: "Tōhoku earthquake/tsunami",
        dateUtc: "2011-03-11", lat: 38.32, lon: 142.37,
        category: "geophysical", expectedMinTier: "Turbulent",
        expectedLayers: ["world-point", "late-degree"],
        source: "USGS M9.1 2011",
        notes: "Uranus 0° Aries world-point — global broadcast",
    },
    {
        id: "indian-ocean-tsunami-2004",
        label: "Indian Ocean tsunami",
        dateUtc: "2004-12-26", lat: 3.3, lon: 95.9,
        category: "geophysical", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "USGS M9.1 2004",
    },
    {
        id: "haiti-eq-2010",
        label: "Haiti earthquake",
        dateUtc: "2010-01-12", lat: 18.5, lon: -72.4,
        category: "geophysical", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "USGS M7.0 2010",
    },
    {
        id: "nepal-eq-2015",
        label: "Nepal earthquake",
        dateUtc: "2015-04-25", lat: 28.2, lon: 84.7,
        category: "geophysical", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "USGS M7.8 2015",
    },
    {
        id: "turkey-syria-eq-2023",
        label: "Turkey-Syria earthquake",
        dateUtc: "2023-02-06", lat: 37.2, lon: 37.0,
        category: "geophysical", expectedMinTier: "Turbulent",
        expectedLayers: ["angle-transit"],
        source: "USGS M7.8 2023",
    },
    {
        id: "la-palma-2021",
        label: "La Palma eruption",
        dateUtc: "2021-09-19", lat: 28.6, lon: -17.9,
        category: "geophysical", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "IGN Cumbre Vieja 2021",
    },
    {
        id: "tonga-2022",
        label: "Tonga Hunga eruption",
        dateUtc: "2022-01-15", lat: -20.5, lon: -175.4,
        category: "geophysical", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "VEI 5-6 Jan 15 2022",
    },

    // ── Wildfire + heat ──────────────────────────────────────────────────
    {
        id: "la-fires-2025",
        label: "LA Palisades/Eaton fires",
        dateUtc: "2025-01-07", lat: 34.05, lon: -118.24,
        category: "wildfire", expectedMinTier: "Unsettled",
        expectedLayers: ["late-degree"],
        source: "CAL FIRE Jan 2025",
        notes: "Mars Rx OOB cycle. Research expected L3 station near angle — orb too wide.",
    },
    {
        id: "maui-2023",
        label: "Maui Lahaina fire",
        dateUtc: "2023-08-08", lat: 20.9, lon: -156.7,
        category: "wildfire", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "CAL FIRE / HIFD 2023",
    },
    {
        id: "camp-fire-2018",
        label: "Camp Fire Paradise CA",
        dateUtc: "2018-11-08", lat: 39.8, lon: -121.6,
        category: "wildfire", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "CAL FIRE Camp Fire",
    },
    {
        id: "aus-black-summer",
        label: "Australia Black Summer peak",
        dateUtc: "2020-01-04", lat: -35.3, lon: 149.1,
        category: "wildfire", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "BoM 2019-20 season",
    },
    {
        id: "pnw-heat-dome-2021",
        label: "Pacific NW heat dome",
        dateUtc: "2021-06-28", lat: 45.5, lon: -122.7,
        category: "wildfire", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "NWS Portland 2021",
    },

    // ── Mundane triggers (non-weather) ───────────────────────────────────
    {
        id: "arab-spring-tunis-2011",
        label: "Arab Spring Tunisia",
        dateUtc: "2011-01-14", lat: 36.8, lon: 10.1,
        category: "mundane-trigger", expectedMinTier: "Turbulent",
        expectedLayers: ["world-point", "late-degree"],
        source: "Historical record",
        notes: "Same Uranus 0° Aries signature as Japan — validates global broadcast",
    },
    {
        id: "beirut-2020",
        label: "Beirut port explosion",
        dateUtc: "2020-08-04", lat: 33.9, lon: 35.5,
        category: "mundane-trigger", expectedMinTier: "Unsettled",
        expectedLayers: [],
        source: "UN investigation 2020",
    },

    // ── Calm null controls ───────────────────────────────────────────────
    {
        id: "nyc-null-2018",
        label: "NYC ordinary day",
        dateUtc: "2018-09-15", lat: 40.7, lon: -74.0,
        category: "control-calm", expectedMinTier: "Calm",
        expectedLayers: [],
        source: "—",
    },
    {
        id: "reykjavik-null-2019",
        label: "Reykjavík summer null",
        dateUtc: "2019-07-22", lat: 64.13, lon: -21.9,
        category: "control-calm", expectedMinTier: "Calm",
        expectedLayers: [],
        source: "—",
    },
    {
        id: "singapore-null-2016",
        label: "Singapore aseasonal null",
        dateUtc: "2016-03-10", lat: 1.35, lon: 103.8,
        category: "control-calm", expectedMinTier: "Calm",
        expectedLayers: [],
        source: "—",
    },
    {
        id: "buenos-aires-null-2017",
        label: "Buenos Aires mid-autumn",
        dateUtc: "2017-04-20", lat: -34.6, lon: -58.4,
        category: "control-calm", expectedMinTier: "Calm",
        expectedLayers: [],
        source: "—",
    },
];

export const TIER_INDEX: Record<BacktestTier, number> = {
    Calm: 0, Unsettled: 1, Turbulent: 2, Severe: 3, Extreme: 4,
};

/** Convert a tier to an expected "calibration midpoint" score (0-100). */
export const TIER_MIDPOINT: Record<BacktestTier, number> = {
    Calm: 85, Unsettled: 70, Turbulent: 50, Severe: 30, Extreme: 10,
};
