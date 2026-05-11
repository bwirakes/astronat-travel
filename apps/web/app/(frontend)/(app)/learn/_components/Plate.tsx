import React from "react";
import { SectionHeader } from "./SectionHeader";

type PlateProps = {
  /** Figure number — printed as `FIG. N` in small caps mono. */
  number: number | string;
  /** Headline of the figure. Short, serif. */
  title: string;
  /** One-sentence description. Sits next to the title in a marginalia column on
   *  desktop, beneath it on mobile. Should describe what the figure IS, not what
   *  the underlying concept means (that belongs in body prose). */
  caption?: string;
  /** Figure body — the actual diagram, table, image, etc. Plus any KeyStrips
   *  underneath. */
  children: React.ReactNode;
};

/**
 * Major editorial figure with print-style pacing. Use for primary teaching
 * artifacts that close (or open) a section — the modality matrix, the angles
 * primer, the precession illustration, etc.
 *
 * Layout:
 *
 *   ─────────────────────────────────────────────────────────────────
 *   FIG. 01            The grid
 *                      How every sign sits at one intersection of
 *                      modality and element.
 *   ─────────────────────────────────────────────────────────────────
 *
 *   {children — the figure body}
 *
 * The kicker + title + caption form a 12-column header (3 / 4 / 5),
 * left-anchored at the prose width. The body breaks out to the full
 * 1600px inner frame so figures (matrices, charts, wide tables) get the
 * room they need — the editorial breakout pattern from longform
 * journalism (NYT, Atlantic): prose stays narrow, figures go wide.
 *
 * For lightweight inline figures (small SVGs with a caption), use
 * <DiagramFigure> instead. Plate is for full-section artifacts.
 */
export function Plate({ number, title, caption, children }: PlateProps) {
  const figNum =
    typeof number === "number"
      ? String(number).padStart(2, "0")
      : number;

  return (
    <section className="px-6 md:px-12 lg:px-20 py-16 md:py-24 max-w-[1600px] mx-auto">
      {/* ─── Header: kicker + title + caption (left-anchored at prose width) */}
      <SectionHeader
        kicker={`Fig. ${figNum}`}
        title={title}
        caption={caption}
        titleSize="figure"
        titleClassName="md:max-w-[12ch]"
        layout="inline"
        className="max-w-[990px] mb-10 md:mb-14"
      />

      {/* ─── Body — full-bleed within the 1600px frame ────────────────── */}
      <div>{children}</div>
    </section>
  );
}
