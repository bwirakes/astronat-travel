import { PLANET_COLORS } from "@/app/lib/planet-data";
import {
  HOUSE_DOMAINS,
  PLANET_DOMAINS,
  getOrdinal,
} from "@/app/lib/astro-wording";

export interface PlanetPlacementHoverContentProps {
  planet: string;
  sign: string;
  house: number;
  degree?: string;
  implication?: string;
  rulerCondition?: string;
  context?: "natal" | "relocated";
}

export function PlanetPlacementHoverContent({
  planet,
  sign,
  house,
  degree,
  implication,
  rulerCondition,
  context = "natal",
}: PlanetPlacementHoverContentProps) {
  const pColor = PLANET_COLORS[planet] || "var(--color-y2k-blue)";
  const domain = PLANET_DOMAINS[planet] || `${planet} Placements`;
  const houseDomain = HOUSE_DOMAINS[house] || "life";
  const sentence = implication || `${planet} in ${sign} emphasizes the ${getOrdinal(house)} house of ${houseDomain}.`;

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: pColor,
          }}
        />
        <h4
          style={{
            fontFamily: "var(--font-primary)",
            fontSize: "1.2rem",
            textTransform: "uppercase",
            color: "var(--text-primary)",
            letterSpacing: "0.02em",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {planet}
        </h4>
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text-tertiary)",
          marginBottom: "0.75rem",
        }}
      >
        {sign}
        {degree ? ` | ${degree}` : ""} | {getOrdinal(house)} House
        {context === "relocated" && rulerCondition ? ` | ${rulerCondition}` : ""}
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: pColor,
          marginBottom: "0.5rem",
        }}
      >
        {domain}
      </div>

      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.9rem",
          lineHeight: 1.5,
          color: "var(--text-secondary)",
          margin: 0,
        }}
      >
        {sentence}
      </p>
    </>
  );
}
