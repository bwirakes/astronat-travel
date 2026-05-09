import React, { Children, isValidElement, cloneElement } from "react";
import { SectionHeader } from "./SectionHeader";

type ElementSectionProps = {
  /** Section number — printed `01 / 04` style. Auto-padded to two digits. */
  number: number;
  /** Total sections in the series, for the denominator. */
  total: number;
  /** Section title — the element name, the house group, etc. Serif italic. */
  title: string;
  /** One short sentence describing the group. Body type, sits beside the title. */
  caption: string;
  /** Names of the items in the group (e.g. "Aries · Leo · Sagittarius").
   *  Mono small caps, sits below the title. */
  members?: string;
  /** Cards / content for the section. Auto-numbered by ConceptStack convention
   *  if the children are ConceptCards and `startIndex` is supplied separately. */
  children: React.ReactNode;
  /** Continuous index for ConceptCards inside this section. Cards in this
   *  group will be rendered with index = startIndex, startIndex+1, ... */
  startIndex?: number;
};

/**
 * Section header for grouping a stack of cards under one editorial banner —
 * "FIRE · 01 / 04 · Aries, Leo, Sagittarius". Use to break a wall of N cards
 * into smaller chapters so the page reads as an article instead of a catalog.
 *
 * Header layout (mirrors Plate's print-style 12-col grid):
 *
 *   ─────────────────────────────────────────────────────────────────────
 *   01 / 04                FIRE
 *                          Run on momentum and conviction. They start
 *                          things — and finish them by sheer want.
 *                          ARIES · LEO · SAGITTARIUS
 *   ─────────────────────────────────────────────────────────────────────
 *
 *   {children — usually a 2-col grid of ConceptCards}
 */
export function ElementSection({
  number,
  total,
  title,
  caption,
  members,
  children,
  startIndex = 0,
}: ElementSectionProps) {
  const num = String(number).padStart(2, "0");
  const tot = String(total).padStart(2, "0");

  // Auto-number the children (if they accept `index`) so cards keep continuous
  // numbering across sections (Aries=01, Taurus=02 ... regardless of group).
  const items = Children.toArray(children).map((child, i) =>
    isValidElement(child)
      ? cloneElement(child as React.ReactElement<{ index?: number }>, {
          index: startIndex + i,
        })
      : child,
  );

  return (
    <section className="px-6 md:px-12 lg:px-20 pt-12 md:pt-20 pb-8 md:pb-12 max-w-[1600px] mx-auto">
      {/* ─── Header: counter + title + caption ───────────────────────── */}
      <SectionHeader
        kicker={`${num} / ${tot}`}
        title={title}
        caption={caption}
        meta={members}
        className="max-w-[990px] mb-10 md:mb-14"
      />

      {/* ─── Body — 3-up at lg+, full-bleed within the 1600px frame ──── */}
      {/* Each element group has 3 signs (Aries · Leo · Sagittarius for
          Fire), so 3-up renders one element as a single magazine row.
          [&>*]:max-w-none lets each ConceptCard fill its grid column
          instead of holding to its built-in max-w-2xl. */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 [&>*]:max-w-none [&>*]:w-full">
        {items}
      </div>
    </section>
  );
}
