"use client";

interface AstroLoaderProps {
  label?: string;
  minHeight?: string;
}

export function AstroLoader({
  label = "Computing Chart Matrix...",
  minHeight = "100vh",
}: AstroLoaderProps) {
  return (
    <div
      style={{
        minHeight,
        background: "var(--color-black)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
      }}
    >
      <img
        src="/avatar/saturn-monogram.svg"
        alt="Loading"
        width={80}
        height={80}
        style={{ animation: "astro-spin 3s linear infinite", filter: "invert(1)" }}
      />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
