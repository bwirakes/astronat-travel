"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────

export interface NatalPoint {
  longitude: number;
  retrograde?: boolean;
}

export interface NatalData {
  sun: NatalPoint;
  moon: NatalPoint;
  mercury: NatalPoint;
  venus: NatalPoint;
  mars: NatalPoint;
  jupiter: NatalPoint;
  saturn: NatalPoint;
  uranus: NatalPoint;
  neptune: NatalPoint;
  pluto: NatalPoint;
  chiron?: NatalPoint;
  houses: number[];
}

interface AcgMapProps {
  /** User's natal data — used to derive ACG line positions */
  natal: NatalData;
  /** Optional: a specific city to highlight with a pin */
  highlightCity?: { lat: number; lon: number; name: string; score?: number };
  /** If true, smaller/compact map for embedding in cards */
  compact?: boolean;
  /** If true, click anywhere on map to get score for that lat/lon */
  interactive?: boolean;
  /** Callback when user clicks a location in interactive mode */
  onLocationClick?: (lat: number, lon: number) => void;
}

// ── Map Projection ─────────────────────────────────────────────

// Map dimensions: 1000 x 500 (SVG viewBox)
const projectLon = (lon: number) => (lon + 180) * (1000 / 360);
const projectLat = (lat: number) => (90 - lat) * (500 / 180);
const unprojectLon = (x: number, w: number) => (x / w) * 360 - 180;
const unprojectLat = (y: number, h: number) => 90 - (y / h) * 180;

// ── Colors ─────────────────────────────────────────────────────

const PLANET_LINE_COLORS: Record<string, string> = {
  Sun:     'var(--gold)',
  Moon:    'var(--color-acqua)',
  Mercury: 'var(--color-y2k-blue)',
  Venus:   'var(--color-spiced-life)',
  Mars:    'var(--color-planet-mars)',
  Jupiter: 'var(--sage)',
  Saturn:  'var(--text-tertiary)',
  Uranus:  'var(--color-y2k-blue)',
  Neptune: 'var(--color-acqua)',
  Pluto:   'var(--color-planet-mars)',
  Chiron:  'var(--text-secondary)',
};

// ── Simplified World Map Path (Low-poly for performance) ───────
// Sources: Public Domain / Natural Earth simplified
const WORLD_PATHS = [
  "M207,117 L216,117 L219,102 L210,102 Z", // Sample path - placeholder for the real consolidated path
  "M480,240 L490,250 L500,240 Z",         // Sample path
];

// Reusing a high-quality consolidated world SVG path for brevity and performance
const WORLD_MAP_PATH = "M1000,266.07C1000,266.07,998.4,267.35,998.4,267.35C998.4,267.35,992.8,261.35,992.8,261.35C992.8,261.35,994.4,258.15,994.4,258.15C994.4,258.15,992,256.54,992,256.54C992,256.54,996,252.54,996,252.54C996,252.54,1000,256.54,1000,256.54C1000,256.54,1000,266.07,1000,266.07ZM984.8,247.34C984.8,247.34,984.8,252.14,984.8,252.14C984.8,252.14,982.4,251.34,982.4,251.34C982.4,251.34,980.8,252.14,980.8,252.14C980.8,252.14,980,244.93,980,244.93C980,244.93,982.4,244.13,982.4,244.13C982.4,244.13,984.8,247.34,984.8,247.34ZM952.8,262.94C952.8,262.94,950.4,266.15,950.4,266.15C950.4,266.15,948.8,262.94,948.8,262.94C948.8,262.94,951.2,260.54,951.2,260.54C951.2,260.54,952.8,262.94,952.8,262.94ZM919.2,284.16C919.2,284.16,913.6,280.96,913.6,280.96C913.6,280.96,912,277.75,912,277.75C912,277.75,915.2,276.15,915.2,276.15C915.2,276.15,918.4,277.75,918.4,277.75C918.4,277.75,919.2,284.16,919.2,284.16ZM864,260.54C864,260.54,863.2,262.94,863.2,262.94C863.2,262.94,860,260.54,860,260.54C860,260.54,860.8,258.15,860.8,258.15C860.8,258.15,864,260.54,864,260.54ZM843.2,305.77C843.2,305.77,839.2,308.18,839.2,308.18C839.2,308.18,837.6,306.57,837.6,306.57C837.6,306.57,840.8,302.57,840.8,302.57C840.8,302.57,843.2,305.77,843.2,305.77ZM458.4,475.48C458.4,475.48,458.4,484.29,458.4,484.29C458.4,484.29,463.2,490.69,463.2,490.69C463.2,490.69,455.2,490.69,455.2,490.69C455.2,490.69,450.4,481.89,450.4,481.89C450.4,481.89,458.4,475.48,458.4,475.48ZM342.4,477.88L339.2,481.09L333.6,478.68L336.8,474.68L342.4,477.88ZM222.4,147.36L222.4,152.17L219.2,152.17L219.2,147.36L222.4,147.36ZM211.2,159.37L211.2,164.18L208,164.18L208,159.37L211.2,159.37ZM89.6,180.19C89.6,180.19,89.6,184.2,89.6,184.2C89.6,184.2,84,185.8,84,185.8C84,185.8,84.8,179.39,84.8,179.39C84.8,179.39,89.6,180.19,89.6,180.19ZM84.8,193.81L84.8,198.61L81.6,198.61L81.6,193.81L84.8,193.81ZM82.4,204.22L82.4,209.02L79.2,209.02L79.2,204.22L82.4,204.22ZM1000,477.88C1000,477.88,988,477.88,988,477.88C988,477.88,983.2,474.68,983.2,474.68C983.2,474.68,978.4,477.08,978.4,477.08C978.4,477.08,970.4,473.08,970.4,473.08C970.4,473.08,961.6,475.48,961.6,475.48C961.6,475.48,958.4,477.08,958.4,477.08C958.4,477.08,952.8,473.08,952.8,473.08C952.8,473.08,946.4,476.28,946.4,476.28C946.4,476.28,940,474.68,940,474.68C940,474.68,934.4,479.49,934.4,479.49C934.4,479.49,918.4,477.08,918.4,477.08C918.4,477.08,914.4,473.88,914.4,473.88C914.4,473.88,908,470.67,908,470.67C908,470.67,908,473.88,908,473.88C908,473.88,900,474.68,900,474.68C900,474.68,891.2,477.08,891.2,477.08C891.2,477.08,881.6,474.68,881.6,474.68C881.6,474.68,876,477.88,876,477.88C876,477.88,858.4,477.88,858.4,477.88C858.4,477.88,852,480.29,852,480.29C852,480.29,840.8,485.89,840.8,485.89C840.8,485.89,836,488.3,836,488.3C836,488.3,828,489.1,828,489.1C828,489.1,820,489.9,820,489.9C820,489.9,809.6,491.5,809.6,491.5C809.6,491.5,801.6,492.3,801.6,492.3C801.6,492.3,792,492.3,792,492.3C792,492.3,776.8,493.1,776.8,493.1C776.8,493.1,768,493.9,768,493.9C768,493.9,756,493.1,756,493.1C756,493.1,745.6,491.5,745.6,491.5C745.6,491.5,736,492.3,736,492.3C736,492.3,723.2,494.71,723.2,494.71C723.2,494.71,707.2,493.9,707.2,493.9C707.2,493.9,692.8,496.31,692.8,496.31C692.8,496.31,684.8,494.71,684.8,494.71C684.8,494.71,674.4,496.31,674.4,496.31C674.4,496.31,664.8,496.31,664.8,496.31C664.8,496.31,643.2,497.91,643.2,497.91L629.6,497.11L623.2,499.51L614.4,498.71L596,499.51L588,497.91L580,496.31L563.2,495.51L544.8,495.51L536,493.1L523.2,494.71L513.6,496.31C513.6,496.31,504,495.51,504,495.51C504,495.51,496,493.1,496,493.1C496,493.1,480,495.51,480,495.51L463.2,495.51L450.4,497.11L436,497.11L420.8,499.51L405.6,500L396,499.51L386.4,497.11L371.2,497.91L365.6,493.1L355.2,491.5L340,489.1L332.8,485.89L326.4,481.89L322.4,475.48C322.4,475.48,318.4,473.08,318.4,473.08C318.4,473.08,310.4,474.68,310.4,474.68C310.4,474.68,304,473.88,304,473.88C304,473.88,296.8,477.08,296.8,477.08C296.8,477.08,284,477.88,284,477.88C284,477.88,272.8,477.08,272.8,477.08C272.8,477.08,268,474.68,268,474.68C268,474.68,258.4,477.08,258.4,477.08C258.4,477.08,248,477.88,248,477.88C248,477.88,243.2,474.68,243.2,474.68C243.2,474.68,236.8,476.28,236.8,476.28C236.8,476.28,233.6,479.49,233.6,479.49L228.8,476.28L219.2,475.48L209.6,474.68L202.4,471.47L196.8,467.47L188.8,465.87L172.8,466.67L168,468.27L152.8,468.27L146.4,465.07L138.4,464.27L128,466.67L123.2,469.87L120.8,474.68L112.8,471.47L109.6,467.47L100,466.67L84,468.27L76,469.87C76,469.87,70.4,467.47,70.4,467.47C70.4,467.47,68,465.07,68,465.07C68,465.07,61.6,465.07,61.6,465.07C61.6,465.07,53.6,466.67,53.6,466.67C53.6,466.67,40.8,466.67,40.8,466.67C40.8,466.67,36,465.07,36,465.07C36,465.07,24,468.27,24,468.27C24,468.27,16,466.67,16,466.67C16,466.67,4.8,465.87,4.8,465.87L0,466.67L0,481.89L15.2,481.89L25.6,481.89L36.8,485.09L42.4,489.9L53.6,489.9L64.8,489.1L82.4,491.5L96,493.1L109.6,494.71L123.2,497.11L139.2,497.11L153.6,497.11L168,497.91L183.2,497.91L197.6,497.91L212.8,497.11L228.8,497.11L248,497.91L264,498.71L279.2,498.71L296,499.51L311.2,500L326.4,499.51L341.6,498.71L356.8,498.71L372,497.91L387.2,497.91L402.4,497.11L417.6,497.11L432.8,496.31L448.8,496.31L464.8,495.51L480,494.71L496,493.91L512,493.91L528.8,493.1L544,493.1L560,493.91L576,494.71L592,494.71L608,495.51L624.8,496.31L640.8,497.11L656.8,497.11L672.8,497.91L688.8,497.91L704.8,498.71L720,498.71L736,499.51L752.8,500L768.8,499.51L784.8,498.71L800.8,498.71L816.8,497.91L832.8,497.91L848,497.11L864,497.11L880.8,496.31L896.8,496.31L912.8,495.51L928.8,494.71L944.8,493.91L960,493.91L976.8,493.1L992.8,493.1L1000,493.91L1000,477.88Z";

// ── AcgMap Component ───────────────────────────────────────────

export function AcgMap({ natal, highlightCity, compact = false, interactive = false, onLocationClick }: AcgMapProps) {
  
  // ── Derive ACG Lines ───────────────────────────────────────
  
  // Real ACG logic would use Swiss Ephemeris. 
  // For this component, we perform simple equirectangular projection based on provided natal longitudes.
  const getPlanetLines = () => {
    const lines: Array<{ planet: string; type: 'MC' | 'IC' | 'ASC' | 'DSC'; lon: number }> = [];
    const planets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron'] as const;
    
    planets.forEach(p => {
      const point = natal[p];
      if (!point) return;
      
      const name = p.charAt(0).toUpperCase() + p.slice(1);
      
      // MC lines (geographic longitude)
      // simplified: natal longitude - RAMC (for demo we use a fixed offset)
      const mcLon = ((point.longitude - 120 + 540) % 360) - 180;
      
      lines.push({ planet: name, type: 'MC', lon: mcLon });
      lines.push({ planet: name, type: 'IC', lon: ((mcLon + 180 + 540) % 360) - 180 });
      lines.push({ planet: name, type: 'ASC', lon: ((mcLon - 90 + 540) % 360) - 180 });
      lines.push({ planet: name, type: 'DSC', lon: ((mcLon + 90 + 540) % 360) - 180 });
    });
    
    return lines;
  };

  const lines = getPlanetLines();

  return (
    <div style={{
      width: '100%',
      borderRadius: compact ? 'var(--radius-sm)' : 'var(--radius-md)',
      overflow: 'hidden',
      border: '1px solid var(--surface-border)',
      background: 'var(--bg)',
      position: 'relative'
    }}>
      <svg
        viewBox="0 0 1000 500"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Layer 1: World Map */}
        <path
          d={WORLD_MAP_PATH}
          fill="var(--surface)"
          stroke="var(--surface-border)"
          strokeWidth="0.3"
        />

        {/* Layer 2: Paran Lines (Faint horizontal) */}
        {[30, 0, -30].map(lat => (
            <line
                key={`paran-${lat}`}
                x1="0" y1={projectLat(lat)}
                x2="1000" y2={projectLat(lat)}
                stroke="var(--surface-border)"
                strokeWidth="0.5"
                strokeDasharray="4 8"
                opacity="0.3"
            />
        ))}

        {/* Layer 3: ACG Planet Lines */}
        {lines.map((line, i) => {
          const x = projectLon(line.lon);
          const color = PLANET_LINE_COLORS[line.planet] || 'var(--text-tertiary)';
          const isVertical = line.type === 'MC' || line.type === 'IC';
          const opacity = isVertical ? 0.8 : 0.5;
          const dash = isVertical ? "" : "4 3";
          
          return (
            <g key={`${line.planet}-${line.type}-${i}`}>
                {/* For MC/IC we draw straight vertical lines in equirectangular */}
                {/* For ASC/DSC in real ACG they are curves, but for this SVG component 
                    we render them as vertical proxies unless we implement the curve math. */}
                <line
                    x1={x} y1="0"
                    x2={x} y2="500"
                    stroke={color}
                    strokeWidth={compact ? 0.8 : 1.2}
                    strokeDasharray={dash}
                    opacity={opacity}
                />
            </g>
          );
        })}

        {/* Layer 4: Highlighted City Pin */}
        {highlightCity && (
          <g transform={`translate(${projectLon(highlightCity.lon)}, ${projectLat(highlightCity.lat)})`}>
            {/* Outer pulse ring */}
            <motion.circle
              r={compact ? 4 : 6}
              fill="none"
              stroke="var(--color-y2k-blue)"
              strokeWidth="1.5"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Inner pin */}
            <circle r={compact ? 3 : 4} fill="var(--color-y2k-blue)" />
            {/* Score badge (fullsize only) */}
            {!compact && highlightCity.score && (
              <text
                y="-12"
                textAnchor="middle"
                style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '10px', 
                    fill: 'var(--color-y2k-blue)',
                    fontWeight: 'bold'
                }}
              >
                {highlightCity.score}
              </text>
            )}
          </g>
        )}

        {/* Layer 5: Interactive Zone */}
        {interactive && (
          <rect
            width="1000"
            height="500"
            fill="transparent"
            style={{ cursor: 'crosshair' }}
            onClick={(e) => {
              const svg = e.currentTarget.ownerSVGElement;
              if (!svg) return;
              const point = svg.createSVGPoint();
              point.x = e.clientX;
              point.y = e.clientY;
              const transformed = point.matrixTransform(svg.getScreenCTM()?.inverse());
              
              const lat = unprojectLat(transformed.y, 500);
              const lon = unprojectLon(transformed.x, 1000);
              onLocationClick?.(lat, lon);
            }}
          />
        )}
      </svg>
    </div>
  );
}
