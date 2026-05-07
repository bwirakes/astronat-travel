import React from "react";
import { Glossify } from "./Glossify";
import { SectionHeader } from "./SectionHeader";

type ProseSectionBaseProps = {
  children: React.ReactNode;
  /** Optional anchor id for the rendered chapter heading. */
  id?: string;
  /** Skip auto-glossifying. */
  noGlossify?: boolean;
};

type ProseSectionWithHeader = {
  /** Optional chapter counter, e.g. "§ 01". */
  kicker?: React.ReactNode;
  /** Optional full-frame chapter title. */
  title?: React.ReactNode;
};

type ProseSectionProps = ProseSectionBaseProps & ProseSectionWithHeader;

/**
 * The workhorse body-prose container for lessons. Single column, body type,
 * max-w-3xl reading width inside a max-w-[1600px] outer frame so the page
 * edges line up with LessonIntro / Plate / Recap.
 *
 * Use it for any plain article prose between the major teaching artifacts —
 * the precession note that follows the lede, the bridging paragraph between
 * a card stack and a diagram, etc. No kicker, no rules, no chrome. The
 * reader just reads. When a chapter title is needed, pass `kicker` + `title`
 * so the heading can use the full editorial frame while paragraphs keep the
 * narrow reading column.
 *
 *   <ProseSection kicker="§ 01" title="The system in one breath">
 *     <p>Body paragraph...</p>
 *     <Aside label="...">callout...</Aside>
 *   </ProseSection>
 */
export function ProseSection({
  children,
  id,
  kicker,
  title,
  noGlossify = false,
}: ProseSectionProps) {
  const hasHeader = kicker != null || title != null;
  const sectionPaddingClass = hasHeader
    ? "pt-12 md:pt-20 pb-6 md:pb-10"
    : "py-6 md:py-10";
  const headerKicker = kicker ?? "";
  const headerTitle = title ?? "";
  const inner = noGlossify ? children : <Glossify>{children}</Glossify>;

  return (
    <section
      className={`px-6 md:px-12 lg:px-20 max-w-[1600px] mx-auto ${sectionPaddingClass}`}
    >
      {hasHeader && (
        <SectionHeader
          id={id}
          kicker={headerKicker}
          title={headerTitle}
          className="max-w-3xl mb-6 md:mb-8"
        />
      )}
      <div
        className="
          max-w-3xl font-body text-lg md:text-xl leading-[1.65] space-y-6
          [&>p]:opacity-90
          [&>h4]:font-mono [&>h4]:text-xs md:[&>h4]:text-sm
          [&>h4]:uppercase [&>h4]:tracking-[0.25em]
          [&>h4]:font-medium [&>h4]:opacity-100
          [&>h4]:pt-8 md:[&>h4]:pt-10
          [&>h4]:mt-6 md:[&>h4]:mt-8
          [&>h4]:mb-3 md:[&>h4]:mb-4
          [&>h4]:text-[var(--lesson-accent)]
          [&>h4]:border-t [&>h4]:border-[var(--surface-border)]
          [&>h4]:scroll-mt-24
        "
      >
        {inner}
      </div>
    </section>
  );
}
