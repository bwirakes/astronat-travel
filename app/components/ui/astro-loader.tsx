"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import PlanetIcon from "@/app/components/PlanetIcon";
import SignIcon from "@/app/components/SignIcon";

interface AstroLoaderProps {
  label?: string;
  minHeight?: string;
}

export const APP_SHELL_LOADER_MIN_HEIGHT = "75vh";

type FloatItem = {
  key: string;
  kind: "planet" | "sign" | "star";
  value: string;
  color: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  delay?: string;
  size?: number;
};

const PAGE_FLOATS: FloatItem[] = [
  { key: "a", kind: "planet", value: "Sun", color: "var(--gold)", top: "10vh", left: "6vw" },
  { key: "b", kind: "sign", value: "Leo", color: "var(--color-y2k-blue)", top: "10vh", right: "6vw", delay: "-1.2s" },
  { key: "c", kind: "planet", value: "Neptune", color: "var(--color-acqua)", top: "34vh", left: "4vw", delay: "-2s" },
  { key: "d", kind: "sign", value: "Scorpio", color: "var(--color-spiced-life)", top: "34vh", right: "4vw", delay: "-2.8s" },
  { key: "e", kind: "planet", value: "Moon", color: "var(--color-acqua)", bottom: "6vh", left: "6vw", delay: "-1.7s" },
  { key: "f", kind: "sign", value: "Sagittarius", color: "var(--gold)", bottom: "6vh", right: "6vw", delay: "-0.8s" },
  { key: "g", kind: "planet", value: "Mars", color: "var(--color-spiced-life)", top: "20vh", left: "15vw", delay: "-2.2s" },
  { key: "h", kind: "sign", value: "Aquarius", color: "var(--color-y2k-blue)", top: "20vh", right: "15vw", delay: "-1.4s" },
  { key: "s1", kind: "star", value: "✦", color: "var(--gold)", top: "12vh", left: "22vw", size: 16 },
  { key: "s2", kind: "star", value: "✦", color: "var(--color-spiced-life)", bottom: "12vh", right: "22vw", delay: "-1.5s", size: 16 },
];

const CORE_FLOATS: FloatItem[] = [
  { key: "p1", kind: "planet", value: "Venus", color: "var(--color-spiced-life)", top: "54px", left: "-2px", delay: "0s" },
  { key: "p2", kind: "planet", value: "Jupiter", color: "var(--gold)", top: "52px", right: "-2px", delay: "-1.7s" },
  { key: "z1", kind: "sign", value: "Libra", color: "var(--color-y2k-blue)", bottom: "8px", left: "52px", delay: "-2.4s" },
  { key: "z2", kind: "sign", value: "Pisces", color: "var(--color-acqua)", bottom: "10px", right: "52px", delay: "-0.9s" },
];

export function AstroLoader({
  label = "Generating your reading...",
  minHeight = APP_SHELL_LOADER_MIN_HEIGHT,
}: AstroLoaderProps) {
  const phases = useMemo(
    () => [
      "Scanning the sky",
      "Calculating transits",
      "Cross-checking house placements",
      "Looking up geodetics",
      "Composing your reading",
    ],
    [],
  );
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phaseLabel = useMemo(() => `Phase ${phaseIndex + 1} / ${phases.length}`, [phaseIndex, phases.length]);

  useEffect(() => {
    const timer = setInterval(() => setPhaseIndex((prev) => (prev + 1) % phases.length), 2200);
    return () => clearInterval(timer);
  }, [phases.length]);

  const renderFloatGlyph = (item: FloatItem, size = 24) => {
    if (item.kind === "planet") return <PlanetIcon planet={item.value} size={size} color={item.color} />;
    if (item.kind === "sign") return <SignIcon sign={item.value} size={Math.round(size * 0.92)} color={item.color} />;
    return (
      <span style={{ color: item.color, fontSize: `${item.size ?? 16}px` }}>
        {item.value}
      </span>
    );
  };

  const pageFloatBase: CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 0,
    animation: "loader-float 6.2s ease-in-out infinite",
  };

  const pageChipBase: CSSProperties = {
    width: "46px",
    height: "46px",
    borderRadius: "9999px",
    border: "1px solid var(--surface-border)",
    background: "color-mix(in srgb, var(--surface) 72%, transparent)",
    display: "grid",
    placeItems: "center",
  };

  const coreFloatBase: CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    width: "46px",
    height: "46px",
    borderRadius: "9999px",
    border: "1px solid var(--surface-border)",
    background: "color-mix(in srgb, var(--surface) 72%, transparent)",
    display: "grid",
    placeItems: "center",
    animation: "loader-float 5.2s ease-in-out infinite",
    zIndex: 1,
  };

  const coreOrbBase: CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    borderRadius: "9999px",
    border: "1px solid var(--surface-border)",
    background: "color-mix(in srgb, var(--surface) 70%, transparent)",
    animation: "loader-float 4.2s ease-in-out infinite",
  };

  const coreStarBase: CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    fontSize: "1rem",
    color: "var(--gold)",
    opacity: 0.8,
    animation: "loader-float 4.8s ease-in-out infinite",
  };

  return (
    <div
      style={{
        minHeight,
        width: "100%",
        display: "grid",
        placeItems: "center",
        padding: "var(--space-lg) var(--space-md)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {PAGE_FLOATS.map((item) => {
        const isChip = item.kind !== "star";
        return (
          <div
            key={item.key}
            style={{
              ...pageFloatBase,
              ...(isChip ? pageChipBase : null),
              top: item.top,
              right: item.right,
              bottom: item.bottom,
              left: item.left,
              animationDelay: item.delay,
              opacity: item.kind === "star" ? 0.85 : 0.75,
            }}
          >
            {renderFloatGlyph(item, 28)}
          </div>
        );
      })}

      <div
        style={{
          position: "relative",
          width: "220px",
          height: "190px",
          zIndex: 2,
        }}
      >
        <div style={{ ...coreOrbBase, width: "24px", height: "24px", top: "18px", left: "8px" }} />
        <div style={{ ...coreOrbBase, width: "20px", height: "20px", top: "114px", right: "16px", animationDelay: "-1.3s" }} />
        <div style={{ ...coreStarBase, top: "24px", right: "24px" }}>✦</div>
        <div style={{ ...coreStarBase, bottom: "18px", left: "20px", color: "var(--color-spiced-life)", animationDelay: "-2s" }}>✦</div>
        {CORE_FLOATS.map((item) => (
          <div
            key={item.key}
            style={{
              ...coreFloatBase,
              top: item.top,
              right: item.right,
              bottom: item.bottom,
              left: item.left,
              animationDelay: item.delay,
            }}
          >
            {renderFloatGlyph(item, 24)}
          </div>
        ))}
        <div
          style={{
            width: "148px",
            height: "148px",
            margin: "18px auto 0",
            borderRadius: "9999px",
            border: "1px solid var(--surface-border)",
            display: "grid",
            placeItems: "center",
            background: "color-mix(in srgb, var(--surface) 88%, transparent)",
            position: "relative",
            zIndex: 2,
          }}
        >
          <Image
            src="/avatar/saturn-monogram.svg"
            alt="Astronat loading"
            width={110}
            height={110}
            style={{ animation: "astro-spin 5.8s linear infinite", filter: "none" }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            top: "calc(100% + var(--space-md))",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(620px, calc(100vw - 2rem))",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.62rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginBottom: "0.5rem",
            }}
          >
            {phaseLabel}
          </p>
          <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "clamp(1.35rem, 3.4vw, 1.8rem)", marginBottom: "0.45rem" }}>
            {phases[phaseIndex]}
          </h3>
          <span style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>{label}</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes loader-float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </div>
  );
}
