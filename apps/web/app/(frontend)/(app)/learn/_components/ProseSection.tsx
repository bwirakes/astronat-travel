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

type ProseSectionProps = ProseSectionBaseProps &
  ProseSectionWithHeader & {
    /**
     * Optional right-column marginalia (byline, "in this article" mini-TOC,
     * pull quote, sources mini, related guides). Renders alongside the body
     * in a 4-col sidebar on `lg+` screens; collapses below the body on
     * mobile. When present, the body shifts to a 7-col column so the
     * outer frame stops feeling empty on wide screens.
     */
    marginalia?: React.ReactNode;
    /**
     * Whether the marginalia column should stick to the top of the
     * viewport while the body scrolls. Defaults to `true` — useful for
     * the article's opening section so the byline + TOC stay in view.
     * Set `false` for body-anchored marginalia (inline pull quotes that
     * scroll with their paragraph).
     */
    stickyMarginalia?: boolean;
};

/**
 * The workhorse body-prose container for lessons.
 *
 * Without `marginalia`: single column, body type, `max-w-[990px]` inside the
 * `max-w-[1600px]` outer frame. Article-density spacing.
 *
 * With `marginalia`: 12-col grid on `lg+` screens — body in cols 1–7,
 * sidebar in cols 9–12 with a 1-col gutter between them. The chapter
 * header (kicker + title) spans the body cols so its bottom hairline
 * stays anchored to the article spine, not the marginalia. Mobile
 * collapses to a single stacked column.
 *
 *   <ProseSection
 *     kicker="§ 01"
 *     title="The system in one breath"
 *     marginalia={<>
 *       <Margin.Byline>By Astro-Nat</Margin.Byline>
 *       <Margin.Toc items={[...]} />
 *       <Margin.PullQuote>A sign is a coordinate.</Margin.PullQuote>
 *     </>}
 *   >
 *     <p>Body paragraph...</p>
 *   </ProseSection>
 */
export function ProseSection({
  children,
  id,
  kicker,
  title,
  noGlossify = false,
  marginalia,
  stickyMarginalia = true,
}: ProseSectionProps) {
  const hasHeader = kicker != null || title != null;
  const hasMarginalia = !!marginalia;
  // FT/Monocle density: the masthead's bottom hairline IS the divider,
  // so the next section opens with minimal top padding. Chapter break
  // ≤ 32px, body section break ≤ 24px.
  const sectionPaddingClass = hasHeader
    ? "pt-4 md:pt-6 pb-3 md:pb-5"
    : "py-3 md:py-5";
  const headerKicker = kicker ?? "";
  const headerTitle = title ?? "";
  const inner = noGlossify ? children : <Glossify>{children}</Glossify>;

  // Body container styles — same in both layout modes. Inline h3/h4 styles
  // give us small-caps mono subsection breaks with a top hairline.
  const bodyClass = `
    font-body text-base md:text-lg leading-[1.6] space-y-4
    [&>p]:opacity-95
    [&>h3]:font-mono [&>h3]:text-xs
    [&>h3]:uppercase [&>h3]:tracking-[0.25em]
    [&>h3]:font-medium [&>h3]:opacity-100
    [&>h3]:pt-4 [&>h3]:mt-4 [&>h3]:mb-2
    [&>h3]:text-[var(--lesson-accent)]
    [&>h3]:border-t [&>h3]:border-[var(--surface-border)]
    [&>h3]:scroll-mt-24
    [&>h4]:font-mono [&>h4]:text-xs
    [&>h4]:uppercase [&>h4]:tracking-[0.25em]
    [&>h4]:font-medium [&>h4]:opacity-100
    [&>h4]:pt-4 [&>h4]:mt-4 [&>h4]:mb-2
    [&>h4]:text-[var(--lesson-accent)]
    [&>h4]:border-t [&>h4]:border-[var(--surface-border)]
    [&>h4]:scroll-mt-24
  `;

  return (
    <section
      className={`px-6 md:px-12 lg:px-20 max-w-[1600px] mx-auto ${sectionPaddingClass}`}
    >
      {hasMarginalia ? (
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-10 xl:gap-x-12">
          {/* ─── Body column (cols 1–7) ─────────────────────────────── */}
          <div className="lg:col-span-7">
            {hasHeader && (
              <SectionHeader
                id={id}
                kicker={headerKicker}
                title={headerTitle}
                className="mb-4 md:mb-6"
              />
            )}
            <div className={bodyClass}>{inner}</div>
          </div>

          {/* ─── Marginalia column (cols 9–12) ─────────────────────── */}
          <aside
            className={`mt-10 lg:mt-2 lg:col-span-4 lg:col-start-9 ${
              stickyMarginalia ? "lg:sticky lg:top-24 lg:self-start" : ""
            }`}
          >
            <div className="space-y-7 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-1 [&_a]:decoration-[var(--surface-border)] hover:[&_a]:decoration-[var(--lesson-accent)]">
              {marginalia}
            </div>
          </aside>
        </div>
      ) : (
        <>
          {hasHeader && (
            <SectionHeader
              id={id}
              kicker={headerKicker}
              title={headerTitle}
              className="max-w-[990px] mb-4 md:mb-6"
            />
          )}
          <div className={`max-w-[990px] ${bodyClass}`}>{inner}</div>
        </>
      )}
    </section>
  );
}
