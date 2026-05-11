import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header-context";
import { ProgressRail } from "../_components/ProgressRail";
import { LessonDisclaimer } from "../_components/LessonDisclaimer";
import { TraditionChip } from "../_components/TraditionChip";
import { GLOSSARY, getGlossaryEntry } from "../_components/glossary-data";
import { getLesson } from "../_components/curriculum";

export const metadata: Metadata = {
  title: "Glossary — Astronat Academy",
  description:
    "Every astrological and astronomical term used in the Astronat Academy, defined in plain English. Cross-linked to the lessons that use them.",
  alternates: { canonical: "/learn/glossary" },
};

/**
 * Auto-generated glossary page. Reads GLOSSARY from glossary-data.ts and
 * renders one entry per term. Adding/editing a term in the data file is the
 * only edit ever required to update this page.
 *
 * Page layout:
 *   - Hero: title + count + 4 tradition chips (legend).
 *   - A–Z list of entries, each with definition, source, related terms,
 *     and a "first used in" lesson link.
 */
export default function GlossaryPage() {
  // Sort A–Z by canonical term for a clean reader experience.
  const entries = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-body overflow-x-hidden transition-colors duration-300">
      <PageHeader title="Academy" backTo="/learn" backLabel="Academy" />
      <ProgressRail activeId="start" />

      <section className="px-6 md:px-12 lg:px-20 pt-32 md:pt-36 pb-16 max-w-7xl mx-auto">
        <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.25em] opacity-70 mb-8">
          Reference · {entries.length} terms · Updated 2026-05-07
        </div>
        <h1 className="font-primary text-5xl md:text-[6rem] lg:text-[7rem] leading-[0.85] tracking-tight uppercase mb-8 max-w-4xl">
          The
          <span className="block italic lowercase opacity-80">glossary.</span>
        </h1>
        <p className="font-body text-lg md:text-xl leading-relaxed opacity-80 max-w-2xl mb-10">
          Every term the Academy uses, defined in plain English. Each entry
          notes the lesson it&apos;s introduced in and the tradition it comes
          from. Hover any dotted-underlined term anywhere in the Academy to see
          a preview of its entry here.
        </p>

        <div className="flex flex-wrap gap-2 max-w-2xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-50 self-center mr-2">
            Traditions:
          </span>
          <TraditionChip tradition="hellenistic" />
          <TraditionChip tradition="modern" />
          <TraditionChip tradition="mundane" />
          <TraditionChip tradition="astronomy" />
        </div>
      </section>

      <section className="px-6 md:px-12 lg:px-20 pb-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 max-w-6xl">
          {entries.map((entry) => {
            const lesson = getLesson(entry.firstUsedIn);
            return (
              <article
                key={entry.slug}
                id={entry.slug}
                className="border-t border-[var(--surface-border)] pt-6 scroll-mt-32"
              >
                <header className="flex items-start justify-between gap-4 mb-3">
                  <h2 className="font-primary text-2xl md:text-3xl tracking-tight">
                    {entry.term}
                  </h2>
                  {entry.tradition && <TraditionChip tradition={entry.tradition} />}
                </header>

                {entry.aliases && entry.aliases.length > 0 && (
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-50 mb-3">
                    Also: {entry.aliases.join(" · ")}
                  </div>
                )}

                <p className="font-body text-base md:text-lg leading-relaxed opacity-90 mb-4">
                  {entry.definition}
                </p>

                {entry.source && (
                  <div className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-3">
                    Source: {entry.source.author}, {entry.source.year}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 items-baseline">
                  <Link
                    href={lesson.href}
                    className="font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-[var(--surface-border)] hover:border-[var(--color-y2k-blue)] transition-colors"
                  >
                    First used in: {lesson.shortTitle} →
                  </Link>
                  {entry.relatedTerms && entry.relatedTerms.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-baseline">
                      <span className="font-mono text-[9px] uppercase tracking-[0.25em] opacity-50">
                        Related:
                      </span>
                      {entry.relatedTerms.map((slug) => {
                        const related = getGlossaryEntry(slug);
                        if (!related) return null;
                        return (
                          <Link
                            key={slug}
                            href={`#${slug}`}
                            className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70 hover:opacity-100 hover:text-[var(--color-y2k-blue)] transition-colors"
                          >
                            {related.term}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <LessonDisclaimer />
    </div>
  );
}
