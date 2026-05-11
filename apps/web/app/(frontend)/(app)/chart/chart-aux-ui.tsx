"use client";

import Link from "next/link";

export function TravelCTA() {
  return (
    <div
      style={{
        marginTop: "var(--space-xl)",
        padding: "1.5rem 1.75rem",
        background: "var(--text-primary)",
        color: "var(--bg)",
        borderRadius: "var(--radius-md)",
        maxWidth: "860px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.7,
            marginBottom: "0.35rem",
          }}
        >
          Your chart is the blueprint
        </div>
        <div style={{ fontFamily: "var(--font-primary)", fontSize: "1.1rem", fontWeight: 600 }}>
          See what it looks like when you travel →
        </div>
      </div>
      <Link
        href="/readings/new"
        style={{
          background: "var(--bg)",
          color: "var(--text-primary)",
          padding: "0.75rem 1.25rem",
          borderRadius: "var(--radius-sm)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Start a reading
      </Link>
    </div>
  );
}

export function TeaserCard({
  kicker,
  title,
  cta,
  onClick,
}: {
  kicker: string;
  title: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--surface-border)",
        borderRadius: "var(--radius-md)",
        padding: "1rem 1.25rem",
        textAlign: "left",
        cursor: "pointer",
        transition: "all 0.15s ease",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6rem",
          letterSpacing: "0.2em",
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.95rem",
          color: "var(--text-primary)",
          lineHeight: 1.4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          color: "var(--color-y2k-blue)",
          fontWeight: 600,
          marginTop: "0.25rem",
        }}
      >
        {cta}
      </div>
    </button>
  );
}
