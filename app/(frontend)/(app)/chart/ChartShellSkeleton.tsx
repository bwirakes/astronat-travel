import type { CSSProperties } from "react";

// Server-component skeleton shaped like the post-load chart layout. Renders
// instantly above the Suspense boundary so the user sees the page's
// structure (hero strip, wheel slot, content grid) form before data
// arrives. Reuses the `route-skeleton-shimmer` keyframe in globals.css.

const shimmer: CSSProperties = {
  background:
    "linear-gradient(90deg, color-mix(in srgb, var(--surface) 65%, transparent) 0%, color-mix(in srgb, var(--surface) 90%, transparent) 50%, color-mix(in srgb, var(--surface) 65%, transparent) 100%)",
  backgroundSize: "200% 100%",
  animation: "route-skeleton-shimmer 1.6s ease-in-out infinite",
  borderRadius: "var(--radius-sm, 6px)",
};

function Bar({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return <div style={{ ...shimmer, width, height }} />;
}

function HeroSlot() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 0, flex: 1 }}>
      <Bar width={80} height={9} />
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
        <Bar width={120} height={28} />
        <div style={{ ...shimmer, width: 18, height: 18, borderRadius: "9999px" }} />
      </div>
    </div>
  );
}

export function ChartShellSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        padding: "var(--space-md) 0 var(--space-3xl)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2xl, 32px)",
      }}
    >
      {/* Asc / Sun / Moon hero strip — three slots separated by hairlines */}
      <section
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: "clamp(16px, 2.5vw, 28px)",
          paddingBottom: "var(--space-md)",
        }}
      >
        <HeroSlot />
        <span aria-hidden style={{ background: "var(--surface-border)", width: 1, alignSelf: "stretch" }} />
        <HeroSlot />
        <span aria-hidden style={{ background: "var(--surface-border)", width: 1, alignSelf: "stretch" }} />
        <HeroSlot />
      </section>

      {/* Content grid — lede prose left, natal wheel right */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr minmax(300px, 400px)",
          gap: "clamp(2rem, 5vw, 6rem)",
        }}
      >
        {/* Left: lede paragraphs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Bar width="92%" height={16} />
          <Bar width="88%" height={16} />
          <Bar width="76%" height={16} />
          <div style={{ height: "var(--space-md, 16px)" }} />
          <Bar width="90%" height={16} />
          <Bar width="84%" height={16} />
          <Bar width="65%" height={16} />
        </div>

        {/* Right: natal wheel slot — circular */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md, 16px)", alignItems: "center" }}>
          <Bar width={100} height={10} />
          <div
            style={{
              ...shimmer,
              width: "100%",
              aspectRatio: "1 / 1",
              borderRadius: "9999px",
              maxWidth: 360,
            }}
          />
          <Bar width={140} height={9} />
        </div>
      </div>

      {/* Thick rule + first content section header */}
      <div style={{ borderTop: "1px solid var(--surface-border)", paddingTop: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-md, 16px)" }}>
        <Bar width={140} height={10} />
        <Bar width="35%" height={24} />
      </div>
    </div>
  );
}
