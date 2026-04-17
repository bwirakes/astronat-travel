"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";

type BackButtonProps = {
  /** Explicit destination. If omitted, uses router.back() with fallback. */
  href?: string;
  /** Fallback route when no history entry exists. Defaults to /dashboard. */
  fallback?: string;
  /** Visible label. Defaults to "Home" when href is /dashboard, else "Back". */
  label?: string;
  style?: CSSProperties;
  className?: string;
};

export function BackButton({
  href,
  fallback = "/dashboard",
  label,
  style,
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallback);
  };

  const resolvedLabel = label ?? (href === "/dashboard" ? "Home" : "Back");

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={resolvedLabel}
      className={className}
      style={{
        background: "none",
        border: "none",
        color: "var(--text-tertiary)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.6rem",
        cursor: "pointer",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: "var(--space-md)",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "0.25rem 0",
        ...style,
      }}
    >
      <ArrowLeft size={12} aria-hidden /> {resolvedLabel}
    </button>
  );
}
