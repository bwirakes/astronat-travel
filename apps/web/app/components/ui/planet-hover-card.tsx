"use client";

import { PLANET_COLORS } from "@/app/lib/planet-data";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/app/components/ui/hover-card";
import { PlanetPlacementHoverContent } from "@/app/components/ui/planet-placement-hover-content";

export interface PlanetHoverCardProps {
  planet: string;
  sign: string;
  house: number;
  degree?: string;
  implication?: string;
  rulerCondition?: string;
  context?: "natal" | "relocated";
  children: React.ReactNode;
}

export function PlanetHoverCard({
  planet,
  sign,
  house,
  degree,
  implication,
  rulerCondition,
  context = "natal",
  children,
}: PlanetHoverCardProps) {
  const pColor = PLANET_COLORS[planet] || "var(--color-y2k-blue)";

  return (
    <HoverCard openDelay={200} closeDelay={150}>
      <HoverCardTrigger asChild>
        <span
          style={{
            cursor: "zoom-in",
            borderBottom: `1px dashed ${pColor}`,
          }}
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        sideOffset={5}
        className="planet-hover-card-pop"
        style={{ zIndex: 9999, width: "300px" }}
      >
        <PlanetPlacementHoverContent
          planet={planet}
          sign={sign}
          house={house}
          degree={degree}
          implication={implication}
          rulerCondition={rulerCondition}
          context={context}
        />
      </HoverCardContent>
    </HoverCard>
  );
}
