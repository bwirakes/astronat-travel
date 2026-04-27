"use client";

import type { CSSProperties, FormEvent, ReactElement } from "react";
import { useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { AcgMap, type NatalData } from "@/app/components/AcgMap";
import AcgLinesCard from "@/app/components/AcgLinesCard";
import RelocationBiWheel from "@/app/(frontend)/(app)/reading/[id]/components/v4/RelocationBiWheel";
import { PLANET_COLORS, PLANET_GLYPHS } from "@/app/lib/planet-data";

interface LocationState {
  label: string;
  lat: number | null;
  lon: number | null;
}

interface HouseResult {
  house: number;
  sphere: string;
  relocatedSign: string;
  score: number;
  status: string;
}

interface EventScore {
  eventName: string;
  baseVolume: number;
  affinityModifier: number;
  finalScore: number;
  verdict: string;
}

interface ScoringResult {
  resultId: string | null;
  macroScore: number;
  macroVerdict: string;
  houseSystem: string;
  houses: HouseResult[];
  eventScores: EventScore[];
  rawInput?: unknown;
  rawOutput?: unknown;
  storageWarning?: string;
}

interface HouseDebug extends HouseResult {
  rulerPlanet?: string;
  rulerCondition?: string;
  breakdown?: Record<string, number>;
}

interface GeoTransitHit {
  planet: string;
  angle: "ASC" | "MC" | "DSC" | "IC";
  house: number;
  orb: number;
  severity: number;
  direction: string;
  personalActivation: boolean;
  natalContact?: string;
  natalOrb?: number;
}
interface WorldPointHit {
  planet: string;
  point: string;
  pointLon: number;
  orb: number;
  severity: number;
  direction: string;
}
interface ChartRulerInfoView {
  relocatedAscSign: string;
  ruler: string;
  rulerNatalHouse?: number;
  rulerRelocatedHouse?: number;
  rulerRelocatedHouseSign?: string;
  rulerAngular: boolean;
}
interface EclipseHitView {
  kind: "solar" | "lunar";
  dateUtc: string;
  degree: number;
  sign: string;
  daysFromTarget: number;
  activatedAngle: string;
  angleOrb: number;
  natalContact: string;
  natalOrb: number;
  direction: string;
  severity: number;
}
interface ProgressedBandView {
  planet: "Sun" | "Moon";
  longitude: number;
  sign: string;
  longitudeRange: string;
  destinationInBand: boolean;
}
interface ProgressionsView {
  progressedDateUtc: string;
  yearsElapsed: number;
  aggregate: number;
  bands: ProgressedBandView[];
}
interface MidpointTriggerView {
  transitPlanet: string;
  transitLon: number;
  natalA: string;
  natalB: string;
  midpointLon: number;
  orb: number;
}
interface HarmonicHitView {
  transitPlanet: string;
  natalPlanet: string;
  angle: 45 | 135;
  orb: number;
}
interface ModalityCohortView {
  planetA: string;
  planetB: string;
  aspectAngle: 0 | 90 | 180;
  modality: "cardinal" | "fixed" | "mutable";
  orb: number;
}

interface ScoringRawOutput {
  explanations?: {
    overall?: string;
    houses?: string[];
    events?: string[];
  };
  aspects?: {
    transitHits?: Record<string, unknown>[];
    mappedTransits?: Record<string, unknown>[];
  };
  houses?: HouseDebug[];
  eventScores?: EventScore[];
  natalPlanets?: Record<string, unknown>[];
  relocatedPlanets?: Record<string, unknown>[];
  natalCusps?: number[];
  relocatedCusps?: number[];
  natalAngles?: Record<"ASC" | "IC" | "DSC" | "MC", number>;
  relocatedAngles?: Record<"ASC" | "IC" | "DSC" | "MC", number>;
  acgLines?: Record<string, unknown>[];
  parans?: Record<string, unknown>[];
  lots?: Record<string, unknown>;
  sect?: string;
  globalPenalty?: number;
  // A1–A8 surfacing
  activeGeoTransits?: GeoTransitHit[];
  natalWorldPoints?: { aggregate: number; hits: WorldPointHit[] } | null;
  chartRuler?: ChartRulerInfoView | null;
  personalEclipses?: { aggregate: number; hits: EclipseHitView[] } | null;
  progressedBands?: ProgressionsView | null;
  midpointTriggers?: MidpointTriggerView[];
  harmonic45Hits?: HarmonicHitView[];
  modalityCohorts?: ModalityCohortView[];
}

interface ScoringRawInput {
  birthDateUtc?: string;
  birthPlace?: {
    label?: string;
    lat?: number;
    lon?: number;
  };
  travelLocation?: {
    label?: string;
    lat?: number;
    lon?: number;
  };
}

const initialLocation: LocationState = {
  label: "",
  lat: null,
  lon: null,
};

const layoutStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-md)",
  maxWidth: "1320px",
  width: "100%",
  margin: "0 auto",
  background: "var(--bg)",
};

const panelStyle: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--surface-border)",
  borderRadius: "var(--shape-asymmetric-md)",
  padding: "var(--space-lg)",
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const twoColumnFieldsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "0.75rem",
};

const errorStyle: CSSProperties = {
  padding: "0.85rem",
  border: "1px solid rgba(255,60,60,0.28)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-spiced-life)",
  background: "rgba(255,60,60,0.08)",
  fontSize: "0.85rem",
};

const resultsPanelStyle: CSSProperties = {
  background: "var(--surface)",
  color: "var(--text-primary)",
  borderRadius: "var(--shape-asymmetric-md)",
  padding: "var(--space-lg)",
  border: "1px solid var(--surface-border)",
  overflow: "hidden",
  isolation: "isolate",
};

const resultsHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  alignItems: "center",
  marginBottom: "var(--space-md)",
  paddingBottom: "var(--space-md)",
  borderBottom: "1px solid var(--surface-border)",
};

const microLabelStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.65rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
  marginBottom: "0.35rem",
};

const tableWrapStyle: CSSProperties = {
  // Lets wide tables (e.g. 18-column House Breakdown) scroll horizontally
  // instead of squishing the cells. `WebkitOverflowScrolling` keeps momentum
  // scroll on iOS Safari.
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
  maxWidth: "100%",
  border: "1px solid var(--surface-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--surface)",
};

const tableStyle: CSSProperties = {
  // `min-width: max-content` is the trick that activates the wrap's
  // overflow: when total cell content exceeds the viewport, the table grows
  // past 100% and the wrapper scrolls. With plain `width: 100%`, the table
  // would compress and the scroll never triggers.
  minWidth: "max-content",
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.82rem",
  background: "var(--surface)",
};

const tableHeaderStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.6rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
  background: "var(--bg)",
  textAlign: "left",
  padding: "0.65rem 0.75rem",
  borderBottom: "1px solid var(--surface-border)",
  whiteSpace: "nowrap",
};

const tableCellStyle: CSSProperties = {
  padding: "0.7rem 0.75rem",
  borderBottom: "1px solid var(--surface-border)",
  verticalAlign: "middle",
  background: "var(--surface)",
  // Keep numeric/short cells on one line so they don't wrap and break the
  // horizontal scroll rhythm. Long string fields render fine — browsers
  // honor explicit \n in formatCell output.
  whiteSpace: "nowrap",
};

function locationFromLabel(label: string): LocationState {
  return { label, lat: null, lon: null };
}

function locationFromCoordinates(location: { label: string; lat: number; lon: number }): LocationState {
  return { label: location.label, lat: location.lat, lon: location.lon };
}

async function resolveLocation(location: LocationState, fieldName: string): Promise<LocationState> {
  if (location.lat !== null && location.lon !== null) return location;
  if (!location.label.trim()) throw new Error(`${fieldName} is required.`);

  const res = await fetch(`/api/geocode?city=${encodeURIComponent(location.label)}`);
  if (!res.ok) throw new Error(`Could not find coordinates for ${fieldName.toLowerCase()}.`);

  const geo = await res.json();
  if (typeof geo?.lat !== "number" || typeof geo?.lon !== "number") {
    throw new Error(`Could not find coordinates for ${fieldName.toLowerCase()}.`);
  }

  return {
    label: geo.label ?? location.label,
    lat: geo.lat,
    lon: geo.lon,
  };
}

function asRawOutput(value: unknown): ScoringRawOutput | undefined {
  return value && typeof value === "object" ? (value as ScoringRawOutput) : undefined;
}

function asRawInput(value: unknown): ScoringRawInput | undefined {
  return value && typeof value === "object" ? (value as ScoringRawInput) : undefined;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(3);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(formatCell).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getRecordValue(record: Record<string, unknown>, key: string): unknown {
  return record[key];
}

function acgLineContribution(line: { planet: string; angle: string; distance_km: number }): number {
  const planet = line.planet.toLowerCase();
  const angle = line.angle.toUpperCase();
  const benefics = ["venus", "jupiter"];
  const luminaries = ["sun", "moon"];
  const malefics = ["mars", "saturn", "pluto"];
  const angleStrength: Record<string, number> = { ASC: 1.2, MC: 1.1, DSC: 0.95, IC: 0.9 };
  let baseInfluence = 10;

  if (benefics.includes(planet)) baseInfluence = 30;
  else if (luminaries.includes(planet)) baseInfluence = 18;
  else if (malefics.includes(planet)) baseInfluence = -25;

  return Math.round(
    baseInfluence * (angleStrength[angle] ?? 1) * Math.exp(-(line.distance_km * line.distance_km) / (2 * 250 * 250)),
  );
}

function planetKey(value: unknown): string {
  return String(value ?? "").toLowerCase().replace(/\s+/g, "");
}

function buildNatalMapData(planets: Record<string, unknown>[] | undefined, cusps: number[] | undefined): NatalData | null {
  if (!planets?.length || !cusps || cusps.length !== 12) return null;

  const byPlanet = new Map(planets.map((planet) => [planetKey(planet.name ?? planet.planet), planet]));
  const required = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
  if (!required.every((key) => typeof byPlanet.get(key)?.longitude === "number")) return null;

  const point = (key: string) => {
    const planet = byPlanet.get(key)!;
    return {
      longitude: Number(planet.longitude),
      latitude: typeof planet.latitude === "number" ? Number(planet.latitude) : undefined,
      retrograde: Boolean(planet.retrograde ?? planet.is_retrograde),
    };
  };

  return {
    sun: point("sun"),
    moon: point("moon"),
    mercury: point("mercury"),
    venus: point("venus"),
    mars: point("mars"),
    jupiter: point("jupiter"),
    saturn: point("saturn"),
    uranus: point("uranus"),
    neptune: point("neptune"),
    pluto: point("pluto"),
    houses: cusps,
  };
}

function buildWheelPlanets(
  planets: Record<string, unknown>[] | undefined,
  relocatedPlanets: Record<string, unknown>[] | undefined,
) {
  if (!planets?.length) return [];
  const relocatedByName = new Map((relocatedPlanets ?? []).map((planet) => [planetKey(planet.name), planet]));

  return planets
    .filter((planet) => typeof planet.longitude === "number")
    .map((planet) => {
      const name = String(planet.planet ?? planet.name ?? "");
      const relocated = relocatedByName.get(planetKey(name));
      return {
        p: name,
        glyph: PLANET_GLYPHS[name] ?? name.slice(0, 2),
        deg: Number(planet.longitude),
        color: PLANET_COLORS[name] ?? "var(--text-primary)",
        plain: name,
        sign: String(planet.sign ?? ""),
        degree: `${Math.floor(Number(planet.longitude) % 30)}°`,
        natalHouse: typeof planet.house === "number" ? Number(planet.house) : undefined,
        relocatedHouse: typeof relocated?.house === "number" ? Number(relocated.house) : undefined,
      };
    });
}

function buildAcgLines(lines: Record<string, unknown>[] | undefined) {
  return (lines ?? []).map((line) => {
    const planet = String(line.planet ?? "");
    const angle = String(line.angle ?? "");
    const distance = typeof line.distance_km === "number" ? Number(line.distance_km) : 0;
    return {
      planet,
      angle,
      distance_km: distance,
      contribution: acgLineContribution({ planet, angle, distance_km: distance }),
    };
  });
}

export default function ScoringTesterClient(): ReactElement {
  const today = new Date().toISOString().split("T")[0];
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00");
  const [travelDate, setTravelDate] = useState(today);
  const [travelTime, setTravelTime] = useState("12:00");
  const [birthPlace, setBirthPlace] = useState<LocationState>(initialLocation);
  const [travelLocation, setTravelLocation] = useState<LocationState>(initialLocation);
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit =
    Boolean(name.trim()) &&
    Boolean(birthDate) &&
    Boolean(birthTime) &&
    Boolean(travelDate) &&
    Boolean(travelTime) &&
    Boolean(birthPlace.label.trim()) &&
    Boolean(travelLocation.label.trim()) &&
    !loading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const resolvedBirthPlace = await resolveLocation(birthPlace, "Birth place");
      const resolvedTravelLocation = await resolveLocation(travelLocation, "Travel location");
      setBirthPlace(resolvedBirthPlace);
      setTravelLocation(resolvedTravelLocation);

      const res = await fetch("/api/scoring-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          birthDate,
          birthTime,
          travelDate,
          travelTime,
          birthPlace: resolvedBirthPlace,
          travelLocation: resolvedTravelLocation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Scoring failed.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scoring failed.");
    } finally {
      setLoading(false);
    }
  }

  const rawOutput = asRawOutput(result?.rawOutput);
  const rawInput = asRawInput(result?.rawInput);
  const debugHouses = rawOutput?.houses ?? result?.houses ?? [];
  const debugEvents = rawOutput?.eventScores ?? result?.eventScores ?? [];
  const transitHits = rawOutput?.aspects?.transitHits ?? [];
  const mappedTransits = rawOutput?.aspects?.mappedTransits ?? [];
  const natalMapData = buildNatalMapData(rawOutput?.natalPlanets, rawOutput?.natalCusps);
  const wheelPlanets = buildWheelPlanets(rawOutput?.natalPlanets, rawOutput?.relocatedPlanets);
  const visualAcgLines = buildAcgLines(rawOutput?.acgLines);
  const hasBiWheelData =
    wheelPlanets.length > 0 &&
    rawOutput?.natalCusps?.length === 12 &&
    rawOutput?.relocatedCusps?.length === 12;

  return (
    <div style={layoutStyle}>
      <section style={panelStyle}>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "var(--space-md)" }}>
          Run a raw relocation score without generating a full reading. Results are saved to the scoring test table for review.
        </p>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div className="input-group">
            <label className="input-label" htmlFor="scoring-name">Name</label>
            <input
              id="scoring-name"
              className="input-field"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Nat"
            />
          </div>

          <CityAutocomplete
            id="scoring-birth-place"
            label="Birth place"
            value={birthPlace.label}
            onChange={(value) => setBirthPlace(locationFromLabel(value))}
            onSelect={(suggestion) => setBirthPlace(locationFromCoordinates(suggestion))}
            placeholder="e.g. Jakarta, Indonesia"
          />

          <div style={twoColumnFieldsStyle}>
            <div className="input-group">
              <label className="input-label" htmlFor="scoring-birth-date">Birth date</label>
              <input
                id="scoring-birth-date"
                className="input-field"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="scoring-birth-time">Birth time</label>
              <input
                id="scoring-birth-time"
                className="input-field"
                type="time"
                value={birthTime}
                onChange={(event) => setBirthTime(event.target.value)}
              />
            </div>
          </div>

          <CityAutocomplete
            id="scoring-travel-location"
            label="Travel location"
            value={travelLocation.label}
            onChange={(value) => setTravelLocation(locationFromLabel(value))}
            onSelect={(suggestion) => setTravelLocation(locationFromCoordinates(suggestion))}
            placeholder="e.g. Tokyo, Japan"
          />

          <div style={twoColumnFieldsStyle}>
            <div className="input-group">
              <label className="input-label" htmlFor="scoring-travel-date">Travel date</label>
              <input
                id="scoring-travel-date"
                className="input-field"
                type="date"
                value={travelDate}
                onChange={(event) => setTravelDate(event.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="scoring-travel-time">Travel time</label>
              <input
                id="scoring-travel-time"
                className="input-field"
                type="time"
                value={travelTime}
                onChange={(event) => setTravelTime(event.target.value)}
              />
            </div>
          </div>

          {error && (
            <div style={errorStyle}>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={!canSubmit}
            style={{ justifyContent: "center", padding: "0.85rem 1.25rem", borderRadius: "var(--shape-asymmetric-md)", opacity: canSubmit ? 1 : 0.45 }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={15} /> Computing score...
              </>
            ) : (
              <>
                <Sparkles size={15} /> Run scoring test
              </>
            )}
          </button>
        </form>
      </section>

      {result && (
        <section style={resultsPanelStyle}>
          {result.storageWarning && (
            <div style={{ ...errorStyle, marginBottom: "var(--space-md)" }}>
              {result.storageWarning}
            </div>
          )}

          <div style={resultsHeaderStyle}>
            <div>
              <p style={microLabelStyle}>Overall score</p>
              <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(3rem, 8vw, 5rem)", lineHeight: 0.85, margin: 0 }}>
                {result.macroScore}
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ display: "inline-flex", border: "1px solid currentColor", borderRadius: "20px", padding: "0.3rem 0.8rem", fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {result.macroVerdict}
              </span>
              <p style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: "0.65rem", marginTop: "0.65rem" }}>
                {result.houseSystem} houses
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gap: "var(--space-md)" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>
                Visual Scoring Context
              </h3>
              <div style={{ display: "grid", gap: "var(--space-md)" }}>
                <div style={panelStyle}>
                  <h4 style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                    Astrocartography Map
                  </h4>
                  {natalMapData && rawInput?.travelLocation ? (
                    <AcgMap
                      natal={natalMapData}
                      birthDateTimeUTC={rawInput.birthDateUtc}
                      birthLat={rawInput.birthPlace?.lat}
                      birthLon={rawInput.birthPlace?.lon}
                      birthCity={rawInput.birthPlace?.label}
                      highlightCity={{
                        lat: rawInput.travelLocation.lat ?? 0,
                        lon: rawInput.travelLocation.lon ?? 0,
                        name: rawInput.travelLocation.label ?? "Travel location",
                        score: result.macroScore,
                      }}
                      interactive
                      autoZoomToCity={false}
                    />
                  ) : (
                    <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                      Map data is missing for this result. Run the scoring form again to generate the visual payload.
                    </p>
                  )}
                </div>

                <div style={panelStyle}>
                  <h4 style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                    Planetary Lines Card
                  </h4>
                  {visualAcgLines.length > 0 ? (
                    <AcgLinesCard
                      planetLines={visualAcgLines}
                      natalPlanets={(rawOutput?.natalPlanets ?? []).map((planet) => ({
                        planet: String(planet.planet ?? planet.name ?? ""),
                        sign: String(planet.sign ?? ""),
                        degree: typeof planet.longitude === "number" ? Math.floor(Number(planet.longitude) % 30) : 0,
                        longitude: typeof planet.longitude === "number" ? Number(planet.longitude) : 0,
                        retrograde: Boolean(planet.retrograde ?? planet.is_retrograde),
                        house: typeof planet.house === "number" ? Number(planet.house) : 0,
                        dignity: typeof planet.dignity === "string" ? planet.dignity : undefined,
                      }))}
                      birthCity={rawInput?.birthPlace?.label ?? "Birth place"}
                      destination={rawInput?.travelLocation?.label ?? "Travel location"}
                    />
                  ) : (
                    <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                      No nearby ACG lines were returned for this destination.
                    </p>
                  )}
                </div>

                <div style={panelStyle}>
                  <h4 style={{ margin: "0 0 0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                    Relocation Bi-Wheel
                  </h4>
                  {hasBiWheelData ? (
                    <div style={{ minHeight: "auto", background: "transparent" }}>
                      <RelocationBiWheel
                        natalPlanets={wheelPlanets}
                        natalAnglesDeg={rawOutput?.natalAngles ?? null}
                        relocatedAnglesDeg={rawOutput?.relocatedAngles ?? null}
                        natalCuspsDeg={rawOutput?.natalCusps ?? []}
                        relocatedCuspsDeg={rawOutput?.relocatedCusps ?? []}
                      />
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                      Bi-wheel data is missing for this result. Run the scoring form again to generate natal and relocated cusps.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {rawOutput?.explanations && (
              <div>
                <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>
                  Model Explanations
                </h3>
                <div style={tableWrapStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={tableHeaderStyle}>Type</th>
                        <th style={tableHeaderStyle}>Explanation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rawOutput.explanations.overall && (
                        <tr>
                          <td style={tableCellStyle}>Overall</td>
                          <td style={tableCellStyle}>{rawOutput.explanations.overall}</td>
                        </tr>
                      )}
                      {(rawOutput.explanations.houses ?? []).map((explanation, index) => (
                        <tr key={`house-explanation-${index}`}>
                          <td style={tableCellStyle}>House</td>
                          <td style={tableCellStyle}>{explanation}</td>
                        </tr>
                      ))}
                      {(rawOutput.explanations.events ?? []).map((explanation, index) => (
                        <tr key={`event-explanation-${index}`}>
                          <td style={tableCellStyle}>Event</td>
                          <td style={tableCellStyle}>{explanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {rawOutput && (
              <div>
                <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>
                  Model Context
                </h3>
                <div style={tableWrapStyle}>
                  <table style={tableStyle}>
                    <tbody>
                      <tr>
                        <th style={tableHeaderStyle}>Sect</th>
                        <td style={tableCellStyle}>{formatCell(rawOutput.sect)}</td>
                      </tr>
                      <tr>
                        <th style={tableHeaderStyle}>Global Penalty</th>
                        <td style={tableCellStyle}>{formatCell(rawOutput.globalPenalty)}</td>
                      </tr>
                      <tr>
                        <th style={tableHeaderStyle}>Lot of Fortune</th>
                        <td style={tableCellStyle}>{formatCell(rawOutput.lots?.lotOfFortuneLon)}</td>
                      </tr>
                      <tr>
                        <th style={tableHeaderStyle}>Lot of Spirit</th>
                        <td style={tableCellStyle}>{formatCell(rawOutput.lots?.lotOfSpiritLon)}</td>
                      </tr>
                      <tr>
                        <th style={tableHeaderStyle}>Relocated Cusps</th>
                        <td style={tableCellStyle}>{formatCell(rawOutput.relocatedCusps)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <HouseBreakdownPanel debugHouses={debugHouses} />

            <div>
              <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>
                House Scores
              </h3>
              <div style={tableWrapStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>House</th>
                      <th style={tableHeaderStyle}>Sphere</th>
                      <th style={tableHeaderStyle}>Sign</th>
                      <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Score</th>
                      <th style={tableHeaderStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.houses.map((house) => (
                      <tr key={house.house}>
                        <td style={{ ...tableCellStyle, fontFamily: "var(--font-mono)", color: "var(--color-y2k-blue)" }}>H{house.house}</td>
                        <td style={tableCellStyle}>{house.sphere}</td>
                        <td style={tableCellStyle}>{house.relocatedSign}</td>
                        <td style={{ ...tableCellStyle, textAlign: "right", fontWeight: 800 }}>{house.score}</td>
                        <td style={tableCellStyle}>{house.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>
                Scoring Model Output
              </h3>
              <div style={tableWrapStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>Event</th>
                      <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Base</th>
                      <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Affinity</th>
                      <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Final</th>
                      <th style={tableHeaderStyle}>Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugEvents.map((event) => (
                      <tr key={event.eventName}>
                        <td style={tableCellStyle}>{event.eventName}</td>
                        <td style={{ ...tableCellStyle, textAlign: "right" }}>{event.baseVolume}</td>
                        <td style={{ ...tableCellStyle, textAlign: "right" }}>{event.affinityModifier}</td>
                        <td style={{ ...tableCellStyle, textAlign: "right", fontWeight: 800 }}>{event.finalScore}</td>
                        <td style={tableCellStyle}>{event.verdict}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <GeodeticEnginePanel rawOutput={rawOutput} />

            {transitHits.length > 0 && (
              <div>
                <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>
                  Transit Aspects
                </h3>
                <div style={tableWrapStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        {["date", "transit_planet", "natal_planet", "aspect", "orb", "applying", "benefic", "retrograde"].map((key) => (
                          <th key={key} style={tableHeaderStyle}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transitHits.map((hit, index) => (
                        <tr key={`transit-hit-${index}`}>
                          {["date", "transit_planet", "natal_planet", "aspect", "orb", "applying", "benefic", "retrograde"].map((key) => (
                            <td key={key} style={tableCellStyle}>{formatCell(getRecordValue(hit, key))}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {mappedTransits.length > 0 && (
              <div>
                <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>
                  Mapped Scoring Transits
                </h3>
                <div style={tableWrapStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        {["targetHouse", "transitPlanet", "natalPlanet", "aspect", "orb", "applying", "benefic", "transitRx", "rulerOf"].map((key) => (
                          <th key={key} style={tableHeaderStyle}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mappedTransits.map((transit, index) => (
                        <tr key={`mapped-transit-${index}`}>
                          {["targetHouse", "transitPlanet", "natalPlanet", "aspect", "orb", "applying", "benefic", "transitRx", "rulerOf"].map((key) => (
                            <td key={key} style={tableCellStyle}>{formatCell(getRecordValue(transit, key))}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(rawOutput?.acgLines?.length ?? 0) > 0 && (
              <div>
                <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>
                  ACG Lines
                </h3>
                <div style={tableWrapStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        {["planet", "angle", "distance_km"].map((key) => (
                          <th key={key} style={tableHeaderStyle}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawOutput?.acgLines?.map((line, index) => (
                        <tr key={`acg-line-${index}`}>
                          {["planet", "angle", "distance_km"].map((key) => (
                            <td key={key} style={tableCellStyle}>{formatCell(getRecordValue(line, key))}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(rawOutput?.parans?.length ?? 0) > 0 && (
              <div>
                <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>
                  Parans
                </h3>
                <div style={tableWrapStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        {["p1", "p2", "lat", "type"].map((key) => (
                          <th key={key} style={tableHeaderStyle}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawOutput?.parans?.map((paran, index) => (
                        <tr key={`paran-${index}`}>
                          {["p1", "p2", "lat", "type"].map((key) => (
                            <td key={key} style={tableCellStyle}>{formatCell(getRecordValue(paran, key))}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(rawOutput?.relocatedPlanets?.length ?? 0) > 0 && (
              <div>
                <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>
                  Relocated Planet Occupancy
                </h3>
                <div style={tableWrapStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        {["name", "house", "dignityStatus", "hasLine"].map((key) => (
                          <th key={key} style={tableHeaderStyle}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawOutput?.relocatedPlanets?.map((planet, index) => (
                        <tr key={`relocated-planet-${index}`}>
                          {["name", "house", "dignityStatus", "hasLine"].map((key) => (
                            <td key={key} style={tableCellStyle}>{formatCell(getRecordValue(planet, key))}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Generic data-driven table helpers ─────────────────────────────────────
//
// Anywhere we used to hardcode a list of column keys for a table, we now
// derive them from the data itself. Columns are pulled from the union of
// keys across all rows (so optional fields still get a column when present
// on at least one row), while still letting callers pin / hide / reorder
// columns if they need a specific layout.

interface DataTableColumn<T> {
    /** Object key on the row — also used as the header label by default. */
    key: keyof T & string;
    /** Optional override for the header label. */
    label?: string;
    /** Optional cell renderer; default = formatCell on the raw value. */
    render?: (row: T) => React.ReactNode;
    /** "right" for numeric columns. */
    align?: "left" | "right";
    /** When true, value is rendered bold + colored when non-zero. */
    emphasizeNonZero?: boolean;
}

interface DataTableProps<T extends Record<string, unknown>> {
    rows: T[];
    /** Explicit columns. When omitted, columns are auto-derived from rows. */
    columns?: DataTableColumn<T>[];
    /** Columns to pin to the front (only used in auto-derive mode). */
    pinFirst?: (keyof T & string)[];
    /** When true, columns whose value is 0/empty for every row are hidden. */
    hideAllZeroColumns?: boolean;
    /** When true, hides columns whose value is undefined for every row.
     *  Default true — keeps the table tidy when readings predate a field. */
    hideAllMissingColumns?: boolean;
    rowKey: (row: T, index: number) => string;
    /** Renders empty state copy when rows is empty. Default: nothing. */
    empty?: React.ReactNode;
}

function autoDeriveColumns<T extends Record<string, unknown>>(
    rows: T[],
    pinFirst: (keyof T & string)[] = [],
): DataTableColumn<T>[] {
    if (rows.length === 0) return [];
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const k of pinFirst) {
        if (rows.some((r) => Object.prototype.hasOwnProperty.call(r, k))) {
            seen.add(k);
            ordered.push(k);
        }
    }
    for (const row of rows) {
        for (const k of Object.keys(row)) {
            if (!seen.has(k)) {
                seen.add(k);
                ordered.push(k);
            }
        }
    }
    return ordered.map((key) => {
        const sample = rows.find((r) => r[key as keyof T] !== undefined)?.[key as keyof T];
        const align: "left" | "right" = typeof sample === "number" ? "right" : "left";
        return { key: key as keyof T & string, align, emphasizeNonZero: typeof sample === "number" };
    });
}

function DataTable<T extends Record<string, unknown>>({
    rows,
    columns,
    pinFirst,
    hideAllZeroColumns = false,
    hideAllMissingColumns = true,
    rowKey,
    empty,
}: DataTableProps<T>) {
    if (rows.length === 0) {
        return empty ? <div style={tableWrapStyle}>{empty}</div> : null;
    }
    let cols = columns ?? autoDeriveColumns(rows, pinFirst);
    if (hideAllMissingColumns) {
        cols = cols.filter((c) => rows.some((r) => r[c.key] !== undefined));
    }
    if (hideAllZeroColumns) {
        cols = cols.filter((c) =>
            rows.some((r) => {
                const v = r[c.key];
                if (v === undefined || v === null || v === "") return false;
                if (typeof v === "number") return v !== 0;
                if (typeof v === "boolean") return v;
                return true;
            }),
        );
    }
    return (
        <div style={tableWrapStyle}>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        {cols.map((c) => (
                            <th
                                key={c.key}
                                style={{
                                    ...tableHeaderStyle,
                                    textAlign: c.align === "right" ? "right" : "left",
                                }}
                            >
                                {c.label ?? c.key}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={rowKey(row, i)}>
                            {cols.map((c) => {
                                const raw = row[c.key];
                                const isNumber = typeof raw === "number";
                                const nonZero = isNumber && raw !== 0;
                                const cellContent = c.render
                                    ? c.render(row)
                                    : formatCell(raw as PrimitiveCell);
                                const cellStyle: React.CSSProperties = {
                                    ...tableCellStyle,
                                    textAlign: c.align === "right" ? "right" : "left",
                                };
                                if (c.emphasizeNonZero && nonZero) {
                                    cellStyle.fontWeight = 800;
                                    cellStyle.color = (raw as number) > 0
                                        ? "var(--color-success, #16a34a)"
                                        : "var(--color-warning, #dc2626)";
                                }
                                return (
                                    <td key={c.key} style={cellStyle}>
                                        {cellContent}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

type PrimitiveCell = string | number | boolean | null | undefined;

// ── House Breakdown panel ────────────────────────────────────────────────
//
// Auto-derives breakdown columns from the actual `breakdown` keys returned
// by computeHouseMatrix, so any new field added to HouseBreakdown shows up
// here without a code change. Adds: a "hide all-zero columns" toggle, a
// score column with status, and bold/colored emphasis on non-zero values.

function HouseBreakdownPanel({ debugHouses }: { debugHouses: HouseDebug[] }) {
    const [hideZeros, setHideZeros] = useState(true);

    const rows = useMemo(() => {
        return debugHouses.map((h) => ({
            house: `H${h.house}`,
            ruler: h.rulerPlanet ?? "—",
            condition: h.rulerCondition ?? "—",
            score: h.score,
            status: h.status,
            ...(h.breakdown ?? {}),
        }));
    }, [debugHouses]);

    if (rows.length === 0) return null;

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                }}
            >
                <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.25rem", margin: 0 }}>
                    House Breakdown
                </h3>
                <label
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        userSelect: "none",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={hideZeros}
                        onChange={(e) => setHideZeros(e.target.checked)}
                        style={{ marginRight: "0.4rem", verticalAlign: "middle" }}
                    />
                    hide columns that are 0 everywhere
                </label>
            </div>
            <DataTable
                rows={rows}
                pinFirst={["house", "ruler", "condition", "score", "status"]}
                hideAllZeroColumns={hideZeros}
                rowKey={(r) => `breakdown-${r.house}`}
            />
        </div>
    );
}

// ── Geodetic Engine (A1–A8) panel ──────────────────────────────────────────
// Renders all the new geodetic engine outputs in one stack of small tables.
// Each subsection only renders when its data exists.
function GeodeticEnginePanel({ rawOutput }: { rawOutput?: ScoringRawOutput }) {
    if (!rawOutput) return null;
    const geo = rawOutput.activeGeoTransits ?? [];
    const wp = rawOutput.natalWorldPoints;
    const cr = rawOutput.chartRuler;
    const ec = rawOutput.personalEclipses;
    const pb = rawOutput.progressedBands;
    const mp = rawOutput.midpointTriggers ?? [];
    const h45 = rawOutput.harmonic45Hits ?? [];
    const mc = rawOutput.modalityCohorts ?? [];

    const anyData = geo.length || (wp && wp.hits.length) || cr || (ec && ec.hits.length)
        || pb || mp.length || h45.length || mc.length;
    if (!anyData) return null;

    return (
        <div>
            <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.25rem", marginBottom: "0.75rem" }}>
                Geodetic Engine (A1–A8)
            </h3>

            {geo.length > 0 && (
                <SubPanel title="A1 · Active Geo-Transits">
                    <DataTable
                        rows={geo as unknown as Record<string, unknown>[]}
                        pinFirst={["planet", "angle", "house", "orb", "severity", "direction", "personalActivation"]}
                        rowKey={(_, i) => `geo-${i}`}
                    />
                </SubPanel>
            )}

            {wp && wp.hits.length > 0 && (
                <SubPanel title={`A2 · Natal World Points  (aggregate=${wp.aggregate})`}>
                    <DataTable
                        rows={wp.hits as unknown as Record<string, unknown>[]}
                        pinFirst={["planet", "point", "orb", "severity", "direction"]}
                        rowKey={(_, i) => `wp-${i}`}
                    />
                </SubPanel>
            )}

            {cr && (
                <SubPanel title="A3 · Chart Ruler (relocated)">
                    <DataTable
                        rows={[cr as unknown as Record<string, unknown>]}
                        pinFirst={[
                            "relocatedAscSign", "ruler",
                            "rulerNatalHouse", "rulerRelocatedHouse",
                            "rulerRelocatedHouseSign", "rulerAngular",
                        ]}
                        rowKey={() => "chart-ruler"}
                    />
                </SubPanel>
            )}

            {ec && ec.hits.length > 0 && (
                <SubPanel title={`A4 · Personal Eclipses  (aggregate=${ec.aggregate})`}>
                    <DataTable
                        rows={ec.hits as unknown as Record<string, unknown>[]}
                        pinFirst={[
                            "kind", "dateUtc", "degree", "sign",
                            "activatedAngle", "angleOrb",
                            "natalContact", "natalOrb",
                            "direction", "severity",
                        ]}
                        rowKey={(_, i) => `ec-${i}`}
                    />
                </SubPanel>
            )}

            {pb && (
                <SubPanel title={`A5 · Progressed Bands  (years=${pb.yearsElapsed}, aggregate=${pb.aggregate})`}>
                    <DataTable
                        rows={pb.bands as unknown as Record<string, unknown>[]}
                        pinFirst={["planet", "longitude", "sign", "longitudeRange", "destinationInBand"]}
                        rowKey={(_, i) => `pb-${i}`}
                    />
                </SubPanel>
            )}

            {mp.length > 0 && (
                <SubPanel title={`A6 · Midpoint Triggers  (${mp.length} total, top 5)`}>
                    <DataTable
                        rows={mp.slice(0, 5) as unknown as Record<string, unknown>[]}
                        pinFirst={["transitPlanet", "natalA", "natalB", "midpointLon", "orb"]}
                        rowKey={(_, i) => `mp-${i}`}
                    />
                </SubPanel>
            )}

            {h45.length > 0 && (
                <SubPanel title={`A6 · 45°/135° Harmonic Hits  (${h45.length} total, top 5)`}>
                    <DataTable
                        rows={h45.slice(0, 5) as unknown as Record<string, unknown>[]}
                        pinFirst={["transitPlanet", "angle", "natalPlanet", "orb"]}
                        rowKey={(_, i) => `h45-${i}`}
                    />
                </SubPanel>
            )}

            {mc.length > 0 && (
                <SubPanel title="A8 · Modality Cohorts (late-degree malefic pairs)">
                    <DataTable
                        rows={mc as unknown as Record<string, unknown>[]}
                        pinFirst={["planetA", "aspectAngle", "planetB", "modality", "orb"]}
                        rowKey={(_, i) => `mc-${i}`}
                    />
                </SubPanel>
            )}
        </div>
    );
}

function SubPanel({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: "1rem" }}>
            <div
                style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "var(--color-y2k-blue)",
                    marginBottom: "0.4rem",
                }}
            >
                {title}
            </div>
            {children}
        </div>
    );
}
