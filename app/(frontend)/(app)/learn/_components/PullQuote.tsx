import React from "react";

type PullQuoteProps = {
  /** Optional small-caps label sitting above the quote. Defaults to "The take". */
  label?: string;
  /** The quote itself. One sentence is best. */
  children: React.ReactNode;
  /** Optional attribution line (e.g. "— Astro-Nat"). */
  attribution?: string;
};

/**
 * Magazine-style pull quote. Replaces the `<Recap>` checklist as the closer
 * on a guide: one sentence that nails the take, set big in the secondary
 * serif, no checkmarks and no "you now know" pedagogy. The reader should
 * be able to screenshot this and tweet it.
 */
export function PullQuote({
  label = "The take",
  children,
  attribution,
}: PullQuoteProps) {
  return (
    <section className="px-6 md:px-12 lg:px-20 py-16 md:py-24 max-w-[1600px] mx-auto">
      <figure className="max-w-3xl border-t border-b border-[var(--surface-border)] py-12 md:py-16">
        <div
          className="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] mb-6 md:mb-8 font-medium"
          style={{ color: "var(--lesson-accent)" }}
        >
          {label}
        </div>
        <blockquote className="font-primary italic text-3xl md:text-4xl lg:text-5xl leading-[1.15] tracking-tight">
          {children}
        </blockquote>
        {attribution && (
          <figcaption className="mt-6 md:mt-8 font-mono text-xs uppercase tracking-[0.25em] opacity-60">
            {attribution}
          </figcaption>
        )}
      </figure>
    </section>
  );
}
