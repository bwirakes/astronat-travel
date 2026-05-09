import type { CSSProperties } from "react";

type Variant = "list" | "detail" | "split" | "default";

interface RouteSkeletonProps {
  variant?: Variant;
  label?: string;
}

// Lightweight server-component skeleton. Used as the Suspense fallback for
// in-app route transitions where the heavy AstroLoader would be overkill —
// we want a sub-1KB shell, not 250 lines of animated SVG. Reserve the
// AstroLoader for genuine cold starts (initial page load, reading
// generation) where the brand presence pays for itself.

const baseShimmer: CSSProperties = {
  background:
    "linear-gradient(90deg, color-mix(in srgb, var(--surface) 65%, transparent) 0%, color-mix(in srgb, var(--surface) 90%, transparent) 50%, color-mix(in srgb, var(--surface) 65%, transparent) 100%)",
  backgroundSize: "200% 100%",
  animation: "route-skeleton-shimmer 1.6s ease-in-out infinite",
  borderRadius: "var(--radius-sm, 6px)",
};

function Bar({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return <div style={{ ...baseShimmer, width, height }} />;
}

function ListVariant() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md, 16px)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "var(--space-sm, 12px)", borderBottom: "1px solid var(--surface-border)" }}>
        <Bar width={120} height={12} />
        <Bar width={90} height={28} />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-sm, 12px)", padding: "var(--space-sm, 12px) 0", borderBottom: "1px solid var(--surface-border)" }}>
          <div style={{ ...baseShimmer, width: 40, height: 40, borderRadius: "9999px" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Bar width="60%" height={14} />
            <Bar width="35%" height={10} />
          </div>
          <Bar width={60} height={24} />
        </div>
      ))}
    </div>
  );
}

function DetailVariant() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md, 16px)", maxWidth: 760, margin: "0 auto" }}>
      <Bar width="40%" height={12} />
      <Bar width="80%" height={36} />
      <Bar width="60%" height={20} />
      <div style={{ height: "var(--space-md, 16px)" }} />
      {Array.from({ length: 6 }).map((_, i) => (
        <Bar key={i} width={i % 3 === 0 ? "92%" : i % 3 === 1 ? "85%" : "70%"} height={14} />
      ))}
    </div>
  );
}

function SplitVariant() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)", gap: "var(--space-lg, 24px)", height: "100%" }}>
      <div style={{ ...baseShimmer, minHeight: 320, borderRadius: "var(--radius-md, 10px)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md, 16px)" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-sm, 12px)" }}>
            <div style={{ ...baseShimmer, width: 36, height: 36, borderRadius: "9999px" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <Bar width="55%" height={13} />
              <Bar width="30%" height={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DefaultVariant({ label }: { label?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md, 16px)", maxWidth: 720, margin: "0 auto" }}>
      <Bar width="50%" height={28} />
      <Bar width="80%" height={14} />
      <Bar width="65%" height={14} />
      {label && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.62rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            marginTop: "var(--space-md, 16px)",
            textAlign: "center",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

export function RouteSkeleton({ variant = "default", label }: RouteSkeletonProps) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        padding: "var(--space-lg, 24px) var(--space-md, 16px)",
        minHeight: "60vh",
      }}
      aria-busy="true"
      aria-live="polite"
    >
      {variant === "list" && <ListVariant />}
      {variant === "detail" && <DetailVariant />}
      {variant === "split" && <SplitVariant />}
      {variant === "default" && <DefaultVariant label={label} />}
      <style>{`
        @keyframes route-skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-busy="true"] [style*="route-skeleton-shimmer"] {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
