import React from "react";

type KeyItem = {
  /** The defined term. Rendered serif italic. */
  term: React.ReactNode;
  /** One-word or short-phrase definition. Rendered as plain body text. */
  defn: React.ReactNode;
};

type KeyStripProps = {
  /** Small caps label that anchors the strip on the left. e.g. "ELEMENT". */
  label: string;
  /** 2–6 term/definition pairs. */
  items: KeyItem[];
};

/**
 * Horizontal legend strip. Reads as:
 *
 *   ELEMENT     Fire — action  ·  Earth — matter  ·  Air — mind  ·  Water — feeling
 *
 * Use beneath a Plate to surface key definitions that would otherwise crowd
 * the figure itself. Each KeyStrip carries one axis of meaning — element,
 * modality, dignity, etc. Multiple strips can stack.
 *
 * Mobile collapses the items into a wrapping flex; on desktop they sit on one
 * line, divided by middots.
 */
export function KeyStrip({ label, items }: KeyStripProps) {
  return (
    <div className="grid md:grid-cols-12 gap-y-2 gap-x-6 py-3 border-t border-[var(--surface-border)]">
      <div className="md:col-span-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-60">
          {label}
        </span>
      </div>
      <div className="md:col-span-10 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            <span className="inline-flex items-baseline gap-2 font-body text-sm md:text-base">
              <span className="font-primary italic">{item.term}</span>
              <span className="opacity-40">—</span>
              <span className="opacity-80">{item.defn}</span>
            </span>
            {i < items.length - 1 && (
              <span aria-hidden className="opacity-30 hidden md:inline">
                ·
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
