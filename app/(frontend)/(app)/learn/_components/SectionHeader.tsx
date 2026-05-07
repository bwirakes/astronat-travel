import React from "react";

type SectionHeaderProps = {
  id?: string;
  kicker: React.ReactNode;
  title: React.ReactNode;
  caption?: React.ReactNode;
  meta?: React.ReactNode;
  titleSize?: "chapter" | "figure";
  titleClassName?: string;
  layout?: "stack" | "inline";
  className?: string;
};

const TITLE_SIZE_CLASS: Record<NonNullable<SectionHeaderProps["titleSize"]>, string> =
  {
    chapter: "text-[clamp(1.25rem,2.2vw,1.75rem)]",
    figure: "text-[clamp(1.1rem,2vw,1.4rem)]",
};

const CAPTION_CLASS: Record<NonNullable<SectionHeaderProps["layout"]>, string> = {
  inline:
    "font-body text-sm md:text-base leading-relaxed opacity-70 max-w-[640px]",
  stack: "font-body text-sm md:text-base leading-relaxed opacity-75 max-w-[640px]",
};

export function SectionHeader({
  id,
  kicker,
  title,
  caption,
  meta,
  titleSize = "chapter",
  titleClassName = "",
  layout = "stack",
  className = "",
}: SectionHeaderProps) {
  const titleSizeClass = TITLE_SIZE_CLASS[titleSize];

  return (
    <header className={className}>
      <div className="flex items-baseline gap-[0.85rem] pb-2.5 border-b border-[var(--surface-border)]">
        {kicker && (
          <span
            className="font-mono text-[0.62rem] uppercase tracking-[0.22em] font-bold shrink-0"
            style={{ color: "var(--lesson-accent)" }}
          >
            {kicker}
          </span>
        )}
        <h2
          id={id}
          className={`m-0 flex-1 font-primary font-medium tracking-[-0.01em] leading-[1.2] scroll-mt-24 ${titleSizeClass} ${titleClassName}`}
        >
          {title}
        </h2>
      </div>
      {caption && <p className={`${CAPTION_CLASS[layout]} mt-2.5`}>{caption}</p>}
      {meta && (
        <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-60 mt-3">
          {meta}
        </div>
      )}
    </header>
  );
}
