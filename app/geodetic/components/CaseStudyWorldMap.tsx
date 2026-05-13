import { WORLD_MAP_PATH } from "@/app/components/worldMapPath";

type CaseLine = {
  label: string;
  lon: number;
  color: string;
  dash?: string;
  opacity?: number;
};

type CasePin = {
  label: string;
  lat: number;
  lon: number;
  color: string;
  align?: "left" | "right";
};

type Props = {
  className?: string;
  title: string;
  lines: CaseLine[];
  pins: CasePin[];
  focusLon?: number;
};

const projectLon = (lon: number) => (((lon + 180) % 360 + 360) % 360) * (1000 / 360);
const projectLat = (lat: number) => (90 - lat) * (500 / 180);

function formatLon(lon: number) {
  if (lon === 0) return "0°";
  return lon > 0 ? `${Math.abs(lon)}°E` : `${Math.abs(lon)}°W`;
}

export default function CaseStudyWorldMap({
  className,
  title,
  lines,
  pins,
  focusLon = 0,
}: Props) {
  const centerX = projectLon(focusLon);
  const viewWidth = 760;
  const minX = Math.max(0, Math.min(1000 - viewWidth, centerX - viewWidth / 2));
  const viewBox = `${minX} 45 ${viewWidth} 360`;

  return (
    <svg
      className={className}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`${title.replace(/\W/g, "")}-case-bg`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--geo-case-map-bg-wash-top)" />
          <stop offset="100%" stopColor="var(--geo-case-map-bg-wash-bottom)" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1000" height="500" fill="var(--geo-case-map-bg)" />
      <rect x="0" y="0" width="1000" height="500" fill={`url(#${title.replace(/\W/g, "")}-case-bg)`} />

      {[-120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => (
        <g key={lon}>
          <line
            x1={projectLon(lon)}
            y1="45"
            x2={projectLon(lon)}
            y2="405"
            stroke="var(--geo-case-map-grid)"
            strokeWidth="0.7"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={projectLon(lon) + 4}
            y="397"
            fill="var(--geo-case-map-label)"
            fontFamily="var(--font-mono)"
            fontSize="8"
            letterSpacing="0.08em"
          >
            {formatLon(lon)}
          </text>
        </g>
      ))}

      {[-60, -30, 0, 30, 60].map((lat) => (
        <line
          key={lat}
          x1="0"
          y1={projectLat(lat)}
          x2="1000"
          y2={projectLat(lat)}
          stroke="var(--geo-case-map-grid-soft)"
          strokeWidth="0.6"
          strokeDasharray={lat === 0 ? "6 5" : "2 8"}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      <path
        d={WORLD_MAP_PATH}
        fill="var(--geo-case-map-land)"
        stroke="var(--geo-case-map-land-stroke)"
        strokeWidth="0.55"
        vectorEffect="non-scaling-stroke"
      />

      {lines.map((line) => (
        <g key={line.label}>
          <line
            x1={projectLon(line.lon)}
            y1="45"
            x2={projectLon(line.lon)}
            y2="405"
            stroke={line.color}
            strokeWidth="1.7"
            strokeDasharray={line.dash}
            opacity={line.opacity ?? 0.92}
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={projectLon(line.lon) + 6}
            y="66"
            fill={line.color}
            fontFamily="var(--font-mono)"
            fontSize="9"
            fontWeight="700"
            letterSpacing="0.12em"
          >
            {line.label.toUpperCase()}
          </text>
        </g>
      ))}

      {pins.map((pin) => {
        const x = projectLon(pin.lon);
        const y = projectLat(pin.lat);
        const labelX = pin.align === "right" ? x - 9 : x + 9;
        const anchor = pin.align === "right" ? "end" : "start";

        return (
          <g key={pin.label} transform={`translate(${x} ${y})`}>
            <circle r="7" fill="var(--geo-case-map-pin-bg)" stroke={pin.color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
            <circle r="3" fill={pin.color} />
            <text
              x={labelX - x}
              y="-6"
              fill={pin.color}
              fontFamily="var(--font-body)"
              fontSize="10"
              fontWeight="600"
              textAnchor={anchor}
              paintOrder="stroke"
              stroke="var(--geo-case-map-label-halo)"
              strokeWidth="3"
              strokeLinejoin="round"
            >
              {pin.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
