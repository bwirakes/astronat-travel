"use client";

import * as HoverCard from "@radix-ui/react-hover-card";
import { PLANET_DOMAINS, HOUSE_DOMAINS, getOrdinal } from "@/app/lib/astro-wording";

// Planet color map — shared with NatalMockupWheel
const PLANET_COLORS: Record<string, string> = {
  Sun:        "var(--gold)",
  Moon:       "#FFFFFF",
  Mercury:    "#BDBDBD",
  Venus:      "var(--color-spiced-life)",
  Mars:       "var(--color-planet-mars)",
  Jupiter:    "var(--amber)",
  Saturn:     "#757575",
  Uranus:     "var(--color-acqua)",
  Neptune:    "var(--color-y2k-blue)",
  Pluto:      "#8E24AA",
  Chiron:     "var(--gold)",
  "North Node": "var(--color-eggshell)",
  "South Node": "var(--text-secondary)",
  Ascendant:  "var(--color-y2k-blue)",
  MC:         "var(--color-spiced-life)",
  DC:         "var(--color-acqua)",
  IC:         "var(--gold)",
};

export interface PlanetHoverCardProps {
  planet: string;
  sign: string;
  house: number;
  degree?: string;
  rulerCondition?: string;
  context?: "natal" | "relocated";
  children: React.ReactNode;
}

export function PlanetHoverCard({
  planet,
  sign,
  house,
  degree,
  rulerCondition,
  context = "natal",
  children,
}: PlanetHoverCardProps) {
  const pColor = PLANET_COLORS[planet] || "var(--color-y2k-blue)";
  const domain = PLANET_DOMAINS[planet] || `${planet} Placements`;
  const houseDomain = HOUSE_DOMAINS[house] || "life";

  return (
    <HoverCard.Root openDelay={200} closeDelay={150}>
      <HoverCard.Trigger asChild>
        <span
          style={{
            cursor: "zoom-in",
            borderBottom: `1px dashed ${pColor}`,
          }}
        >
          {children}
        </span>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          sideOffset={5}
          style={{
            zIndex: 9999,
            background: "var(--surface)",
            border: "1px solid var(--surface-border)",
            padding: "var(--space-lg)",
            borderRadius: "var(--radius-sm)",
            width: "300px",
            // No box-shadow — brand rule
          }}
          className="planet-hover-card-pop"
        >
          {/* Planet title row */}
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

          {/* Position line */}
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

          {/* Domain label */}
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

          {/* Body sentence */}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              lineHeight: 1.5,
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            {planet} in {sign} in the {getOrdinal(house)} House of {houseDomain}.
          </p>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
