"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

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
  /** Birth datetime as ISO 8601 UTC string — REQUIRED for accurate lines */
  birthDateTimeUTC?: string;
  /** Birth longitude in decimal degrees (east positive) — REQUIRED */
  birthLon?: number;
  /** Optional: a specific city to highlight with a pin */
  highlightCity?: { lat: number; lon: number; name: string; score?: number };
  /** If true, smaller/compact map for embedding in cards */
  compact?: boolean;
  /** If true, click anywhere on map to get score for that lat/lon */
  interactive?: boolean;
  /** Callback when user clicks a location in interactive mode */
  onLocationClick?: (lat: number, lon: number) => void;
  /** Callback emitted when distances are computed vs the highlightCity */
  onLinesCalculated?: (lines: { planet: string; angle: string; distance_km: number }[]) => void;
}

import { WORLD_MAP_PATH } from "./worldMapPath";
import PlanetIcon from "./PlanetIcon";

// ── Map Projection ─────────────────────────────────────────────

const projectLon = (lon: number) => (lon + 180) * (1000 / 360);
const projectLat = (lat: number) => (90 - lat) * (500 / 180);
const unprojectLon = (x: number, w: number) => (x / w) * 360 - 180;
const unprojectLat = (y: number, h: number) => 90 - (y / h) * 180;

// ── Astronomy Helpers ──────────────────────────────────────────

function julianDay(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5;
}

function computeGMST(utcDate: Date): number {
  const JD = julianDay(utcDate);
  const T  = (JD - 2451545.0) / 36525.0;
  const gmst =
    280.46061837 +
    360.98564736629 * (JD - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;
  return ((gmst % 360) + 360) % 360;
}

function computeRAMC(utcDate: Date, birthLonDeg: number): number {
  return ((computeGMST(utcDate) + birthLonDeg) % 360 + 360) % 360;
}

function eclToRA(eclLonDeg: number): number {
  const λ = eclLonDeg * (Math.PI / 180);
  const ε = 23.4393 * (Math.PI / 180);
  const ra = Math.atan2(Math.sin(λ) * Math.cos(ε), Math.cos(λ));
  return ((ra * (180 / Math.PI)) % 360 + 360) % 360;
}

function computeDec(eclLonDeg: number, eclLatDeg: number = 0): number {
  const λ = eclLonDeg * (Math.PI / 180);
  const β = eclLatDeg * (Math.PI / 180);
  const ε = 23.4393 * (Math.PI / 180);
  const sinDec = Math.sin(β) * Math.cos(ε) +
                 Math.cos(β) * Math.sin(ε) * Math.sin(λ);
  return Math.asin(sinDec) * (180 / Math.PI);
}

function mcLonFromRAMC(RAMC: number, planetRA: number): number {
  const raw = RAMC - planetRA;
  return ((raw + 540) % 360) - 180;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth ratio in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.abs(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

type GeoPoint = { lat: number; lon: number };

function computeAscDscCurve(
  mcLon: number,
  decDeg: number,
  angle: 'ASC' | 'DSC'
): GeoPoint[] {
  const sign = angle === 'ASC' ? -1 : 1;
  const decRad = decDeg * (Math.PI / 180);
  const points: GeoPoint[] = [];

  for (let latDeg = -75; latDeg <= 75; latDeg += 2) {
    const φ = latDeg * (Math.PI / 180);
    const tanPhi_tanDec = Math.tan(φ) * Math.tan(decRad);

    if (Math.abs(tanPhi_tanDec) > 1) continue;

    const H_rad = Math.acos(-tanPhi_tanDec);
    const H_deg = H_rad * (180 / Math.PI);

    const ptLon = mcLon + sign * H_deg;
    const normLon = ((ptLon + 540) % 360) - 180;

    points.push({ lat: latDeg, lon: normLon });
  }

  return points;
}

function splitAtAntiMeridian(points: GeoPoint[], threshold: number = 180): GeoPoint[][] {
  if (points.length === 0) return [];

  const segments: GeoPoint[][] = [];
  let currentSegment: GeoPoint[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const prevLon = points[i - 1].lon;
    const currLon = points[i].lon;

    if (Math.abs(currLon - prevLon) > threshold) {
      segments.push(currentSegment);
      currentSegment = [];
    }

    currentSegment.push(points[i]);
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

interface AcgLine {
  planet: string;
  angle: 'MC' | 'IC' | 'ASC' | 'DSC';
  longitude?: number;
  curve?: GeoPoint[];
  color: string;
  declination: number;
}

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

// ── Smart Map Controls ─────────────────────────────────────────

const MapControls = ({ hasCity }: { hasCity: boolean }) => {
  const { zoomToElement } = useControls();
  useEffect(() => {
    if (hasCity) {
      // Small timeout allows SVG to render fully so bounding box is correct
      const t = setTimeout(() => {
         zoomToElement("city-pin", 3.2, 1000); // 3.2x scale, 1s duration
      }, 150);
      return () => clearTimeout(t);
    }
  }, [hasCity, zoomToElement]);
  return null;
}

// ── AcgMap Component ───────────────────────────────────────────

export function AcgMap({ 
    natal, birthDateTimeUTC, birthLon, highlightCity, 
    compact = false, interactive = false, 
    onLocationClick, onLinesCalculated 
}: AcgMapProps) {
  
  const [hoveredLine, setHoveredLine] = useState<AcgLine | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent, line: AcgLine) => {
    if (compact || !interactive) return;
    setHoveredLine(line);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    if (compact || !interactive) return;
    setHoveredLine(null);
  };
  
  // ── Derive ACG Lines ───────────────────────────────────────
  
  const lines = useMemo(() => {
    const planets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron'] as const;
    const computedLines: AcgLine[] = [];

    let RAMC: number | null = null;
    if (birthDateTimeUTC && birthLon !== undefined) {
      try {
        const utcDate = new Date(birthDateTimeUTC);
        if (!isNaN(utcDate.getTime())) {
          RAMC = computeRAMC(utcDate, birthLon);
        }
      } catch (e) {
        console.warn('[AcgMap] Invalid birthDateTimeUTC, falling back to demo mode.', e);
      }
    }
    
    planets.forEach(p => {
      const point = natal[p];
      if (!point) return;
      
      const name = p.charAt(0).toUpperCase() + p.slice(1);
      const color = PLANET_LINE_COLORS[name] || 'var(--text-tertiary)';
      
      if (RAMC !== null) {
        // Accurate lines config
        const ra  = eclToRA(point.longitude);
        const dec = computeDec(point.longitude);
        const mcLon = mcLonFromRAMC(RAMC, ra);
        
        computedLines.push({ planet: name, angle: 'MC', longitude: mcLon, color, declination: dec });
        const icLon = ((mcLon + 180 + 540) % 360) - 180;
        computedLines.push({ planet: name, angle: 'IC', longitude: icLon, color, declination: dec });
        
        const ascCurve = computeAscDscCurve(mcLon, dec, 'ASC');
        computedLines.push({ planet: name, angle: 'ASC', curve: ascCurve, color, declination: dec });
        
        const dscCurve = computeAscDscCurve(mcLon, dec, 'DSC');
        computedLines.push({ planet: name, angle: 'DSC', curve: dscCurve, color, declination: dec });
      } else {
        // Demo
        const mcLon = ((point.longitude - 120 + 540) % 360) - 180;
        computedLines.push({ planet: name, angle: 'MC', longitude: mcLon, color, declination: 0 });
        computedLines.push({ planet: name, angle: 'IC', longitude: ((mcLon + 180 + 540) % 360) - 180, color, declination: 0 });
        computedLines.push({ planet: name, angle: 'ASC', longitude: ((mcLon - 90 + 540) % 360) - 180, color, declination: 0 });
        computedLines.push({ planet: name, angle: 'DSC', longitude: ((mcLon + 90 + 540) % 360) - 180, color, declination: 0 });
      }
    });

    return computedLines;
  }, [natal, birthDateTimeUTC, birthLon]);

  // Hook to calculate distance outputs for ChartClient + Tooltips
  const distances = useMemo(() => {
      if (!highlightCity) return new Map<string, number>();
      const distMap = new Map<string, number>();
      
      lines.forEach(line => {
          let minD = Infinity;
          if (line.angle === 'MC' || line.angle === 'IC') {
              // Minimal distance from a pure vertical meridian is along the parallel
              minD = haversine(highlightCity.lat, highlightCity.lon, highlightCity.lat, line.longitude!);
          } else if (line.curve) {
              line.curve.forEach(pt => {
                  const d = haversine(highlightCity.lat, highlightCity.lon, pt.lat, pt.lon);
                  if (d < minD) minD = d;
              });
          }
          distMap.set(`${line.planet}-${line.angle}`, Math.round(minD));
      });
      return distMap;
  }, [lines, highlightCity]);

  // Bubble up distances
  useEffect(() => {
      if (onLinesCalculated && highlightCity && distances.size > 0) {
          const out = lines.map(line => ({
              planet: line.planet,
              angle: line.angle,
              distance_km: distances.get(`${line.planet}-${line.angle}`) || 0
          }));
          onLinesCalculated(out);
      }
  }, [distances, highlightCity]);


  const getOpacity = (line: AcgLine) => {
    if (!hoveredLine) return line.angle === 'MC' || line.angle === 'IC' ? 0.9 : 0.7;
    return hoveredLine.planet === line.planet && hoveredLine.angle === line.angle ? 1 : 0.15;
  };

  const getFullAngleName = (angle: string) => {
    switch(angle) {
        case 'MC': return 'Midheaven (MC)';
        case 'IC': return 'Imum Coeli (IC)';
        case 'ASC': return 'Ascendant (AC)';
        case 'DSC': return 'Descendant (DC)';
        default: return angle;
    }
  }

  const mapContent = (
      <svg
        viewBox="0 0 1000 500"
        style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
        onClick={(e) => {
          if (!interactive || !onLocationClick) return;
          const svg = e.currentTarget;
          if (!svg) return;
          const point = svg.createSVGPoint();
          point.x = e.clientX;
          point.y = e.clientY;
          const transformed = point.matrixTransform(svg.getScreenCTM()?.inverse());
          
          if (transformed) {
             const lat = unprojectLat(transformed.y, 500);
             const lon = unprojectLon(transformed.x, 1000);
             onLocationClick(lat, lon);
          }
        }}
      >
        {/* Layer 1: World Map */}
        <path
          d={WORLD_MAP_PATH}
          fill="rgba(120, 120, 120, 0.18)" 
          stroke="var(--surface-border)"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
          opacity={0.8}
        />

        {/* Layer 2: Paran Lines */}
        {(() => {
          const lats = new Set<number>();
          if (lines.some(l => l.curve)) {
             lines.filter(l => l.angle === 'MC').forEach(l => {
                if (l.declination) {
                   const paranLat = 90 - Math.abs(l.declination);
                   lats.add(paranLat);
                   lats.add(-paranLat);
                }
             })
          } else {
            [30, 0, -30].forEach(l => lats.add(l));
          }
          
          return Array.from(lats).map(lat => (
            <line
                key={`paran-${lat}`}
                x1="0" y1={projectLat(lat)}
                x2="1000" y2={projectLat(lat)}
                stroke="var(--surface-border)"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="4 8"
                opacity="0.3"
            />
          ));
        })()}

        {/* Layer 3: ACG Planet Lines */}
        {lines.map((line, i) => {
          const opacity = getOpacity(line);
          const dash = (line.angle === 'MC' || line.angle === 'IC') ? (line.angle === 'MC' ? "" : "10 5") : (line.angle === 'ASC' ? "6 3" : "2 5");
          const isHovered = hoveredLine && hoveredLine.planet === line.planet && hoveredLine.angle === line.angle;
          
          if (line.angle === 'MC' || line.angle === 'IC') {
            const x = projectLon(line.longitude!);
            return (
              <line
                  key={`${line.planet}-${line.angle}-${i}`}
                  x1={x} y1="0"
                  x2={x} y2="500"
                  stroke={line.color}
                  strokeWidth={isHovered ? 2 : (compact ? 0.8 : 1.2)}
                  vectorEffect="non-scaling-stroke"
                  strokeDasharray={dash}
                  opacity={opacity}
                  style={{ transition: 'opacity 0.2s ease, stroke-width 0.2s ease' }}
              />
            );
          } else if (line.curve) {
            const segments = splitAtAntiMeridian(line.curve);
            return (
              <g key={`${line.planet}-${line.angle}-${i}`}>
                {segments.map((seg, si) => seg.length > 1 ? (
                  <polyline
                    key={`${line.planet}-${line.angle}-${i}-seg${si}`}
                    points={seg.map(p => `${projectLon(p.lon)},${projectLat(p.lat)}`).join(' ')}
                    fill="none"
                    stroke={line.color}
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={isHovered ? 2 : (compact ? 0.8 : 1.2)}
                    strokeDasharray={dash}
                    opacity={opacity}
                    style={{ transition: 'opacity 0.2s ease, stroke-width 0.2s ease' }}
                  />
                ) : null)}
              </g>
            );
          }
          return null;
        })}

        {/* Layer 6: Static Line Labels */}
        {!compact && !hoveredLine && lines.map((line, i) => {
          const color = line.color;
          const displayAngle = line.angle === 'ASC' ? 'AC' : line.angle === 'DSC' ? 'DC' : line.angle;
          const labelStyles = {
             fill: color,
             fontSize: '8px',
             fontFamily: 'var(--font-mono)',
             fontWeight: 'bold',
             textAnchor: 'middle' as const,
             pointerEvents: 'none' as const,
             letterSpacing: '0.04em'
          };
          
          const renderLabel = (x: number, y: number) => (
            <g transform={`translate(${x}, ${y})`}>
              <rect x={-10} y={-14} width={20} height={20} fill="var(--bg)" opacity={0.6} rx={2} />
              <g transform="translate(-6, -11)">
                <PlanetIcon planet={line.planet} size={12} color={color} />
              </g>
              <text x={0} y={4} style={labelStyles}>{displayAngle}</text>
            </g>
          );

          if (line.angle === 'MC' || line.angle === 'IC') {
            const x = projectLon(line.longitude!);
            return (
              <g key={`label-${line.planet}-${line.angle}-${i}`}>
                {renderLabel(x, 24)}
                {renderLabel(x, 250)}
              </g>
            );
          } else if (line.curve && line.curve.length > 0) {
            const topPoint = line.curve.reduce((max, p) => p.lat > max.lat ? p : max, line.curve[0]);
            const midPoint = line.curve.reduce((closest, p) => Math.abs(p.lat) < Math.abs(closest.lat) ? p : closest, line.curve[0]);
            
            const topX = projectLon(topPoint.lon);
            const topY = Math.max(15, projectLat(topPoint.lat) + 15);
            const midX = projectLon(midPoint.lon);
            const midY = projectLat(midPoint.lat);

            return (
               <g key={`label-${line.planet}-${line.angle}-${i}`}>
                 {renderLabel(topX, topY)}
                 {Math.abs(topY - midY) > 40 && renderLabel(midX, midY)}
               </g>
            );
          }
          return null;
        })}

        {/* Layer 7: Highlighted City Pin */}
        {highlightCity && (
          <g id="city-pin" transform={`translate(${projectLon(highlightCity.lon)}, ${projectLat(highlightCity.lat)})`}>
            {/* Outer pulse ring */}
            <motion.circle
              r={compact ? 4 : 6}
              fill="none"
              stroke="var(--color-y2k-blue)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Inner pin */}
            <circle r={compact ? 3 : 4} fill="var(--color-y2k-blue)" />
            {/* Custom Label */}
            {!compact && highlightCity.name && (
              <g transform={`translate(8, 4)`}>
                <text
                    style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: '9px', 
                        fill: 'var(--text-primary)',
                        fontWeight: 'bold',
                        letterSpacing: '0.05em'
                    }}
                >
                    {highlightCity.name.toUpperCase()}
                </text>
              </g>
            )}
          </g>
        )}

        {/* Layer 4: Interactive Invisible Hit Targets */}
        {interactive && lines.map((line, i) => {
          if (line.angle === 'MC' || line.angle === 'IC') {
            const x = projectLon(line.longitude!);
            return (
              <line
                key={`hit-${line.planet}-${line.angle}-${i}`}
                x1={x} y1="-100" x2={x} y2="600"
                stroke="transparent"
                strokeWidth="15"
                vectorEffect="non-scaling-stroke"
                onMouseMove={(e) => handleMouseMove(e, line)}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
              />
            )
          } else if (line.curve) {
            const segments = splitAtAntiMeridian(line.curve);
            return (
              <g key={`hit-${line.planet}-${line.angle}-${i}`}>
                {segments.map((seg, si) => seg.length > 1 ? (
                  <polyline
                    key={`hit-${line.planet}-${line.angle}-${i}-seg${si}`}
                    points={seg.map(p => `${projectLon(p.lon)},${projectLat(p.lat)}`).join(' ')}
                    fill="none"
                    stroke="transparent"
                    vectorEffect="non-scaling-stroke"
                    strokeWidth="15"
                    onMouseMove={(e) => handleMouseMove(e, line)}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                  />
                ) : null)}
              </g>
            )
          }
           return null;
        })}
      </svg>
  );

  return (
    <div style={{
      width: '100%',
      // Made height dynamically taller! 
      height: compact ? '250px' : '450px',
      borderRadius: compact ? 'var(--radius-sm)' : 'var(--radius-md)',
      overflow: 'hidden',
      border: '1px solid var(--surface-border)',
      background: 'var(--bg)',
      position: 'relative'
    }}>
      {interactive && isClient ? (
        <TransformWrapper
            initialScale={1}
            minScale={0.8}
            maxScale={8}
            limitToBounds={false}
            centerZoomedOut={true}
            panning={{ disabled: false, excluded: [] }}
            wheel={{ disabled: false }}
            doubleClick={{ disabled: true }}
            pinch={{ disabled: false }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Optional UI Controls for Desktop */}
              <div style={{ 
                  position: 'absolute', top: 10, right: 10, zIndex: 10, 
                  display: 'flex', gap: '4px', background: 'var(--surface)',
                  padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)'
              }}>
                 <button onClick={() => zoomIn(0.5)} style={{ width: 24, height: 24, padding: 0, fontWeight: 'bold', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>+</button>
                 <button onClick={() => zoomOut(0.5)} style={{ width: 24, height: 24, padding: 0, fontWeight: 'bold', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>-</button>
                 <button onClick={() => resetTransform()} style={{ width: 24, height: 24, padding: 0, background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>↺</button>
              </div>

              {/* Attach MapControls so "zoomToElement" triggers on mount targeting Jakarta */}
              <MapControls hasCity={!!highlightCity} />

              <TransformComponent 
                 wrapperStyle={{ width: "100%", height: "100%", cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                 contentStyle={{ width: "100%", height: "auto" }}
              >
                {mapContent}
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      ) : (
        mapContent
      )}

      {/* Dynamic Hover Tooltip */}
      <AnimatePresence>
        {hoveredLine && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              left: mousePos.x + 15,
              top: mousePos.y + 15,
              background: 'var(--surface)',
              border: `1px solid ${hoveredLine.color}`,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <PlanetIcon planet={hoveredLine.planet} size={18} color={hoveredLine.color} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ 
                    fontFamily: 'var(--font-primary)', 
                    fontSize: '0.85rem', 
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    color: hoveredLine.color,
                    letterSpacing: '0.02em',
                    lineHeight: 1
                }}>
                  {hoveredLine.planet}
                </span>
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.55rem',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase'
                }}>
                  {getFullAngleName(hoveredLine.angle)} 
                  {distances.get(`${hoveredLine.planet}-${hoveredLine.angle}`) !== undefined && 
                    ` • ${distances.get(`${hoveredLine.planet}-${hoveredLine.angle}`)} km`}
                </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
