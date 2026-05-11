"use client";

import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  kicker?: string;
  title: string;
  theme?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const titleSizeMap = {
  sm: "1.2rem",
  md: "2rem",
  lg: "clamp(3rem, 6vw, 5rem)",
};

export function SectionHeader({
  kicker,
  title,
  theme = "dark",
  size = "sm",
  className,
}: SectionHeaderProps) {
  const borderColor = "var(--text-primary)";

  return (
    <div
      className={cn("section-header", className)}
      style={{
        borderBottom: `2px solid ${borderColor}`,
        paddingBottom: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      {kicker && (
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-mono)",
            fontSize: "0.55rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            marginBottom: "0.4rem",
          }}
        >
          {kicker}
        </span>
      )}
      <h3
        style={{
          fontFamily: "var(--font-primary)",
          fontSize: titleSizeMap[size],
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: "var(--text-primary)",
          margin: 0,
          lineHeight: 1.05,
          fontWeight: 400,
        }}
      >
        {title}
      </h3>
    </div>
  );
}
