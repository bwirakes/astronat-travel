import React from "react";

export interface SvgShapeProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

export function Y2KCyclone({ size = 100, className = "", ...props }: SvgShapeProps) {
  // Generate concentric ellipses rotated to create a spirograph cyclone effect
  const ellipses = Array.from({ length: 18 }).map((_, i) => (
    <ellipse
      key={i}
      cx="50"
      cy="50"
      rx="45"
      ry="15"
      transform={`rotate(${i * 10} 50 50)`}
      stroke="currentColor"
      strokeWidth="0.5"
      fill="none"
    />
  ));

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} {...props}>
      {ellipses}
    </svg>
  );
}

export function AsteriskStarburst({ size = 100, className = "", ...props }: SvgShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} {...props}>
      {/* 4-point star for the vertical/horizontal axes */}
      <path d="M50 0 L58 42 L100 50 L58 58 L50 100 L42 58 L0 50 L42 42 Z" fill="currentColor" />
      {/* Smaller 4-point star for the diagonal axes */}
      <path
        d="M50 15 L55 45 L85 50 L55 55 L50 85 L45 55 L15 50 L45 45 Z"
        fill="currentColor"
        transform="rotate(45 50 50)"
      />
    </svg>
  );
}

/** Single 4-point star lifted from the Astronat identity stars-around-planet.
 *  Use as a flanking accent on promoted scalar values (score pills, etc.).
 *  Inherits color via `currentColor`. */
export function BrandSparkle({ size = 12, className = "", ...props }: SvgShapeProps) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ display: "inline-block", ...(props.style ?? {}) }}
      {...props}
    >
      <path d="M12 0 L13.6 10.4 L24 12 L13.6 13.6 L12 24 L10.4 13.6 L0 12 L10.4 10.4 Z" fill="currentColor" />
    </svg>
  );
}

/** Thin elliptical arc that mirrors the orbital ring around the "O" in the
 *  Astronat logo. Used as a brand-flourish divider between editorial sections.
 *  Inherits stroke color via `currentColor` — wrap in a span that sets
 *  `color: var(--color-spiced-life)` for the canonical coral ring. */
export function OrbitalArc({ size, className = "", ...props }: SvgShapeProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 40"
      preserveAspectRatio="none"
      width={size ?? "100%"}
      height={size ? undefined : 28}
      className={className}
      {...props}
    >
      <ellipse
        cx="300"
        cy="20"
        rx="290"
        ry="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(-2 300 20)"
      />
    </svg>
  );
}

export function WireframeGlobe({ size = 100, className = "", ...props }: SvgShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" className={className} {...props}>
      {/* Outer circle */}
      <circle cx="50" cy="50" r="48" />
      
      {/* Latitudes (horizontal lines) */}
      <path d="M14 16 Q50 30 86 16" />
      <path d="M4 33 Q50 45 96 33" />
      <path d="M2 50 L98 50" />
      <path d="M4 67 Q50 55 96 67" />
      <path d="M14 84 Q50 70 86 84" />

      {/* Longitudes (vertical ellipses) */}
      <ellipse cx="50" cy="50" rx="32" ry="48" />
      <ellipse cx="50" cy="50" rx="16" ry="48" />
      <line x1="50" y1="2" x2="50" y2="98" />
    </svg>
  );
}

export function MonolineStar({ size = 100, className = "", ...props }: SvgShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} {...props}>
      <path
        d="M50 5 Q50 50 95 50 Q50 50 50 95 Q50 50 5 50 Q50 50 50 5 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function AbstractSaturn({ size = 100, className = "", ...props }: SvgShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} {...props}>
      {/* Intersecting rings without the planet body */}
      <ellipse cx="50" cy="50" rx="45" ry="15" transform="rotate(-20 50 50)" />
      <ellipse cx="50" cy="50" rx="35" ry="10" transform="rotate(-20 50 50)" />
      <ellipse cx="50" cy="50" rx="25" ry="5" transform="rotate(-20 50 50)" />
      
      <circle cx="50" cy="50" r="2" fill="currentColor" />
    </svg>
  );
}

export function VintageCrosshairs({ size = 100, className = "", ...props }: SvgShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
      {/* Corner brackets */}
      <path d="M10 30 V10 H30" />
      <path d="M90 30 V10 H70" />
      <path d="M10 70 V90 H30" />
      <path d="M90 70 V90 H70" />
      {/* Center crosshair */}
      <path d="M45 50 H55 M50 45 V55" strokeWidth="1" />
    </svg>
  );
}

export function ChromaticRing({ size = 100, className = "", ...props }: SvgShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} {...props}>
      <defs>
        <linearGradient id="chrome-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#9ca3af" />
          <stop offset="50%" stopColor="#e5e7eb" />
          <stop offset="75%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#d1d5db" />
        </linearGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="35"
        stroke="url(#chrome-grad)"
        strokeWidth="15"
        fill="none"
      />
      {/* Inner highlight ring to give edge contrast */}
      <circle cx="50" cy="50" r="27.5" stroke="#ffffff" strokeWidth="0.5" fill="none" opacity="0.5" />
      <circle cx="50" cy="50" r="42.5" stroke="#ffffff" strokeWidth="0.5" fill="none" opacity="0.5" />
    </svg>
  );
}

export function GeodeticGrid({ size = 100, className = "", ...props }: SvgShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} {...props}>
      <defs>
        <pattern id="dot-grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="1" fill="currentColor" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#dot-grid)" />
    </svg>
  );
}

export function ConcentricDiamonds({ size = 100, className = "", ...props }: SvgShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} {...props}>
      <path d="M50 5 L95 50 L50 95 L5 50 Z" />
      <path d="M50 20 L80 50 L50 80 L20 50 Z" />
      <path d="M50 35 L65 50 L50 65 L35 50 Z" />
    </svg>
  );
}

export function WireframeCube({ size = 100, className = "", ...props }: SvgShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} {...props}>
      {/* Front face */}
      <path d="M30 40 L70 40 L70 80 L30 80 Z" />
      {/* Back face */}
      <path d="M45 20 L85 20 L85 60 L45 60 Z" />
      {/* Connecting lines */}
      <line x1="30" y1="40" x2="45" y2="20" />
      <line x1="70" y1="40" x2="85" y2="20" />
      <line x1="70" y1="80" x2="85" y2="60" />
      <line x1="30" y1="80" x2="45" y2="60" />
    </svg>
  );
}

export function OrbitalPaths({ size = 100, className = "", ...props }: SvgShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} {...props}>
      <ellipse cx="50" cy="50" rx="45" ry="10" transform="rotate(30 50 50)" />
      <ellipse cx="50" cy="50" rx="45" ry="10" transform="rotate(90 50 50)" />
      <ellipse cx="50" cy="50" rx="45" ry="10" transform="rotate(150 50 50)" />
    </svg>
  );
}

export function Sunburst({ size = 100, className = "", ...props }: SvgShapeProps) {
  const rays = Array.from({ length: 16 }).map((_, i) => (
    <line key={i} x1="50" y1="50" x2="50" y2="5" transform={`rotate(${i * 22.5} 50 50)`} stroke="currentColor" strokeWidth="2" />
  ));
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} {...props}>
      {rays}
      <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function BarcodeDecal({ size = 100, className = "", ...props }: SvgShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor" className={className} {...props}>
      <rect x="10" y="20" width="4" height="60" />
      <rect x="18" y="20" width="8" height="60" />
      <rect x="30" y="20" width="2" height="60" />
      <rect x="36" y="20" width="10" height="60" />
      <rect x="50" y="20" width="4" height="60" />
      <rect x="58" y="20" width="6" height="60" />
      <rect x="68" y="20" width="2" height="60" />
      <rect x="74" y="20" width="12" height="60" />
      <rect x="90" y="20" width="4" height="60" />
    </svg>
  );
}

export function PhaseMoon({ size = 100, className = "", ...props }: SvgShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="currentColor" className={className} {...props}>
      {/* A crescent moon shape using arcs */}
      <path d="M50 10 A 40 40 0 1 0 90 50 A 30 30 0 0 1 50 10 Z" />
    </svg>
  );
}

export function TargetReticle({ size = 100, className = "", ...props }: SvgShapeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} {...props}>
      <circle cx="50" cy="50" r="40" strokeDasharray="4 4" />
      <circle cx="50" cy="50" r="25" />
      <circle cx="50" cy="50" r="5" fill="currentColor" />
      <line x1="50" y1="0" x2="50" y2="15" />
      <line x1="50" y1="85" x2="50" y2="100" />
      <line x1="0" y1="50" x2="15" y2="50" />
      <line x1="85" y1="50" x2="100" y2="50" />
    </svg>
  );
}
