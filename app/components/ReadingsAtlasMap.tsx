"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { Plus, Minus, RotateCcw } from "lucide-react";
import { WORLD_MAP_PATH } from "./worldMapPath";
import { BAND_CONFIG, getVerdict, type Verdict } from "./ScoreRing";

export interface AtlasPin {
  id: string;
  destination: string;
  lat: number;
  lon: number;
  score: number;
  travelDate: string;
  travelType: string;
}

interface Props {
  pins: AtlasPin[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  showCounter?: { shown: number; total: number } | null;
}

const projectLon = (lon: number) => (((lon + 180) % 360 + 360) % 360) * (1000 / 360);
const projectLat = (lat: number) => (90 - lat) * (500 / 180);

const pinColor = (verdict: Verdict) => BAND_CONFIG[verdict].ring;

function FocusOnHover({ targetId }: { targetId: string | null }) {
  const { zoomToElement, resetTransform } = useControls();
  useEffect(() => {
    if (!targetId) return;
    const t = setTimeout(() => {
      try {
        zoomToElement(`atlas-pin-${targetId}`, 2.4, 600);
      } catch {
        /* element not found yet — ignore */
      }
    }, 80);
    return () => clearTimeout(t);
  }, [targetId, zoomToElement, resetTransform]);
  return null;
}

export function ReadingsAtlasMap({
  pins,
  hoveredId,
  onHover,
  onSelect,
  showCounter,
}: Props) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const topPin = pins.reduce<AtlasPin | null>((best, p) => (!best || p.score > best.score ? p : best), null);

  const mapSvg = (
    <svg
      viewBox="0 0 1000 500"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
    >
      <path
        d={WORLD_MAP_PATH}
        fill="color-mix(in oklab, var(--text-primary) 9%, transparent)"
        stroke="color-mix(in oklab, var(--text-primary) 22%, transparent)"
        strokeWidth={0.5}
        vectorEffect="non-scaling-stroke"
      />

      <line
        x1={0}
        y1={projectLat(0)}
        x2={1000}
        y2={projectLat(0)}
        stroke="color-mix(in oklab, var(--text-primary) 14%, transparent)"
        strokeWidth={0.4}
        strokeDasharray="4 6"
        vectorEffect="non-scaling-stroke"
      />

      {pins.map((p) => {
        const verdict = getVerdict(p.score);
        const color = pinColor(verdict);
        const cx = projectLon(p.lon);
        const cy = projectLat(p.lat);
        const isHovered = hoveredId === p.id;
        const isTop = topPin?.id === p.id;
        const baseR = 4 + (p.score / 100) * 3;
        const r = isHovered ? baseR + 2 : baseR;
        const dimmed = hoveredId !== null && !isHovered;

        return (
          <g
            key={p.id}
            id={`atlas-pin-${p.id}`}
            transform={`translate(${cx}, ${cy})`}
            style={{ cursor: "pointer", transition: "opacity 0.18s ease" }}
            opacity={dimmed ? 0.3 : 1}
            onMouseEnter={() => onHover(p.id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(p.id)}
          >
            {isTop && (
              <motion.circle
                r={baseR}
                fill="none"
                stroke={color}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: [1, 2.2, 1], opacity: [0.55, 0, 0.55] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <circle
              r={r}
              fill={color}
              stroke="var(--bg)"
              strokeWidth={1.4}
              vectorEffect="non-scaling-stroke"
              style={{ transition: "r 0.15s ease" }}
            />
            {isHovered && (
              <text
                x={r + 4}
                y={3}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  fill: "var(--text-primary)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  pointerEvents: "none",
                }}
              >
                {p.destination.toUpperCase()}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        border: "1px solid var(--surface-border)",
        background: "color-mix(in oklab, var(--text-primary) 2%, var(--bg))",
      }}
    >
      {isClient ? (
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={8}
          limitToBounds={true}
          centerZoomedOut={true}
          doubleClick={{ disabled: false, mode: "zoomIn", step: 0.7 }}
          wheel={{ step: 0.15 }}
          panning={{ velocityDisabled: true }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <FocusOnHover targetId={hoveredId} />

              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  zIndex: 5,
                  display: "flex",
                  gap: 4,
                  background: "color-mix(in oklab, var(--bg) 85%, transparent)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: 3,
                }}
              >
                <CtrlBtn onClick={() => zoomIn(0.4)} aria="Zoom in"><Plus size={14} /></CtrlBtn>
                <CtrlBtn onClick={() => zoomOut(0.4)} aria="Zoom out"><Minus size={14} /></CtrlBtn>
                <CtrlBtn onClick={() => resetTransform()} aria="Reset"><RotateCcw size={13} /></CtrlBtn>
              </div>

              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%", cursor: "grab" }}
                contentStyle={{ width: "100%", height: "100%" }}
              >
                {mapSvg}
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      ) : (
        mapSvg
      )}

      {showCounter && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 12,
            zIndex: 5,
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            background: "color-mix(in oklab, var(--bg) 70%, transparent)",
            padding: "4px 8px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          showing {showCounter.shown} of {showCounter.total}
        </div>
      )}

      <AnimatePresence>
        {hoveredId && (() => {
          const p = pins.find((x) => x.id === hoveredId);
          if (!p) return null;
          const verdict = getVerdict(p.score);
          const color = pinColor(verdict);
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                zIndex: 5,
                background: "var(--surface)",
                border: `1px solid ${color}`,
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                pointerEvents: "none",
                maxWidth: "70%",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `2px solid ${color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "var(--text-primary)",
                }}
              >
                {p.score}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.destination}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.55rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {BAND_CONFIG[verdict].label} · {p.travelType}
                </span>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

function CtrlBtn({
  onClick,
  children,
  aria,
}: {
  onClick: () => void;
  children: React.ReactNode;
  aria: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      style={{
        width: 26,
        height: 26,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        color: "var(--text-primary)",
        cursor: "pointer",
        borderRadius: "var(--radius-xs)",
      }}
    >
      {children}
    </button>
  );
}
