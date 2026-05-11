import React from "react";
import { Glossify } from "./Glossify";

type ConceptZeroProps = {
  /** Optional kicker. Defaults to "The lesson in one breath." */
  kicker?: string;
  /** The plain-language anchor — the lesson stated in one or two paragraphs. */
  children: React.ReactNode;
  /**
   * Optional follow-on note. Rendered inline below the lede as a normal
   * article callout — the "yes, but…" footnote a skeptical reader will
   * raise.
   */
  aside?: React.ReactNode;
  /** Skip auto-glossifying the body. */
  noGlossify?: boolean;
};

/**
 * Blog-style opener. The lesson in plain English, set in body type at a
 * comfortable reading width. Optional callout note lives inline beneath the
 * lede instead of in a marginalia column.
 */
export function ConceptZero({
  kicker = "The lesson in one breath",
  children,
  aside,
  noGlossify = false,
}: ConceptZeroProps) {
  const wrap = (node: React.ReactNode) =>
    noGlossify ? node : <Glossify>{node}</Glossify>;

  return (
    <section className="px-6 md:px-12 lg:px-20 pt-6 md:pt-10 pb-16 md:pb-24 max-w-[1600px] mx-auto">
      <article className="max-w-3xl">
        <span className="block font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] mb-5 opacity-60">
          {kicker}
        </span>

        <div className="font-body text-lg md:text-xl leading-[1.65] opacity-90 space-y-5">
          {wrap(children)}
        </div>

        {aside && <div className="mt-8">{wrap(aside)}</div>}
      </article>
    </section>
  );
}
