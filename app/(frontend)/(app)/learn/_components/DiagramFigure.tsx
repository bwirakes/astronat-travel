import React from "react";

type DiagramFigureProps = {
  /** The diagram itself — typically an SVG, image, or table. */
  children: React.ReactNode;
  /** One-line caption shown below the diagram. */
  caption?: string;
  /** Optional source attribution for the figure. */
  source?: string;
  /** Figure number (auto-numbering is the page's job; pass it in.) */
  number?: number | string;
};

/**
 * Standard wrapper for any figure on a lesson page. Caption sits in the
 * editorial style; source line is small and italicized.
 */
export function DiagramFigure({
  children,
  caption,
  source,
  number,
}: DiagramFigureProps) {
  return (
    <figure className="my-12 max-w-4xl mx-auto">
      <div className="rounded-md overflow-hidden border border-[var(--surface-border)] bg-[var(--surface)]">
        {children}
      </div>
      {(caption || number) && (
        <figcaption className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 max-w-3xl">
          {number !== undefined && (
            <span
              className="font-mono text-[10px] uppercase tracking-[0.25em]"
              style={{ color: "var(--lesson-accent)" }}
            >
              Figure {number}
            </span>
          )}
          {caption && (
            <span className="font-body text-sm md:text-base opacity-75 leading-relaxed">
              {caption}
            </span>
          )}
          {source && (
            <span className="font-mono text-[9px] uppercase tracking-widest opacity-50 ml-auto">
              {source}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
