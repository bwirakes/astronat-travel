export type WeatherEventType =
    | "flood"
    | "wildfire"
    | "storm_cyclone"
    | "earthquake"
    | "heatwave"
    | "tornado"
    | "winter_storm"
    | "compound";

export type GeodeticRiskTier = "low" | "watch" | "moderate" | "high" | "critical";

export interface CriteriaCount {
    met: number;
    total: number;
    key: string;
}

export interface SourceWeatherEvent {
    date: string;
    title: string;
    type: WeatherEventType;
    pss: number;
    stars: string[];
    pair: string | null;
    geostress: string | null;
    criteria: CriteriaCount;
    source?: string;
    sourceNote?: string;
    severity?: number;
    deaths?: number;
    damageBillions?: number;
    notes?: string;
    combo?: string;
}

export interface GeodeticWeatherEvent extends SourceWeatherEvent {
    id: string;
    kind: "historical" | "forecast";
    tier: GeodeticRiskTier;
    editorialBody: string;
    heatmap: number[];
    zones: string[];
}

export interface HardAspect2026 {
    date: string;
    bodies: string;
    degree: string;
    type: "conj" | "sq" | "opp" | "node" | "eclipse";
    severity: "high" | "critical";
    geodeticLongitude: string;
    conflict: string;
    weather: string;
    note?: string;
}

export interface MoonPhase2026 {
    date: string;
    type: "NM" | "FM";
    degree: string;
    note: string;
    eclipse?: boolean;
}

export interface GeodeticFingerprint {
    name: string;
    color: WeatherEventType | "storm";
    description: string;
    threshold: number;
    required: string[];
    anyOne: string[];
    trigger: string;
    events: string[];
    zone: string;
}

export interface BodyStarMatrixCatalog {
    stars: string[];
    bodies: string[];
    starSeverity: Record<string, number>;
    notes: Record<string, Record<string, string>>;
}

export interface EclipsePair {
    id: "pair-a" | "pair-b";
    firstDate: string;
    firstDegree: string;
    secondDate: string;
    secondDegree: string;
    axis: string;
    oppositionOrbDeg: number;
    corridor: string;
    notes: string;
    linkedEventIds: string[];
}

export interface TechniqueWeight {
    id: string;
    label: string;
    value: string;
    numeric?: number;
}

export interface KeyIngress {
    date: string;
    label: string;
    emphasis?: "high" | "warning" | "critical";
}

export interface FormulaCard {
    title: string;
    lines: string[];
}

export interface ComputedStatistics {
    totalEvents: number;
    severityFiveCount: number;
    highPssCount: number;
    meanPss: number;
    eclipsePairCount: number;
    totalDamageBillions: number;
    contingency: { A: number; B: number; C: number; D: number };
    phi: number;
    relativeRisk: number | null;
    cohensH: number;
    severityFiveHighPssPercent: number;
    geostressCount: number;
}

export interface GeodeticTechniqueCatalog {
    baseWeights: TechniqueWeight[];
    newTechniqueWeights: TechniqueWeight[];
    sensitizerWeights: TechniqueWeight[];
    twoPhaseModel: { phase1: string; phase2: string };
    eclipsePairs: EclipsePair[];
    validatedMidpoints: Array<{ label: string; validation: string; weight: number }>;
    fixedStars: Array<{ label: string; severity: number }>;
    keyIngresses: KeyIngress[];
    sourceNotes: string[];
    formulas: FormulaCard[];
    orbWindows: string[];
    riskTiers: Array<{ tier: GeodeticRiskTier; label: string; threshold: string }>;
}

export interface GeodeticWeatherSourceCatalog {
    historicalEvents: GeodeticWeatherEvent[];
    forecastEvents: GeodeticWeatherEvent[];
    geodeticZonesByDate: Record<string, string[]>;
    hardAspects2026: HardAspect2026[];
    moonPhases2026: MoonPhase2026[];
    moonCalendar2026: MoonPhase2026[];
    fingerprints: GeodeticFingerprint[];
    bodyStarMatrix: BodyStarMatrixCatalog;
    techniques: GeodeticTechniqueCatalog;
    statistics: ComputedStatistics;
}

export interface GeodeticTimeSlice {
    dateUtc: string;
    eventId?: string;
    scores: number[];
    phase1: number[];
    phase2: number[];
}

export interface GeodeticHotspot {
    longitude: number;
    score: number;
    tier: Exclude<GeodeticRiskTier, "low">;
    label: string;
    topFactors: string[];
}

export interface GeodeticMatrixResponse {
    startDate: string;
    endDate: string;
    longitudeResolution: number;
    longitudes: number[];
    globalHeatmap: number[];
    events: GeodeticWeatherEvent[];
    sourceCatalog: GeodeticWeatherSourceCatalog;
    timeSlices: GeodeticTimeSlice[];
    hotspots: GeodeticHotspot[];
}
