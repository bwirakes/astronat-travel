import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AstronatCard } from "@/app/components/ui/astronat-card";
import { getModule, type Lesson } from "./curriculum";

type PaginationCardProps = {
  prev?: Lesson | null;
  next?: Lesson | null;
  /** One sentence: why this lesson hands off to the next. The most important
   *  string on the page — turns a directory into a curriculum. */
  bridge?: string;
};

/**
 * Canonical lesson handoff. Replaces the per-page button-soup that exists today.
 * Layout:
 *   [Previous chip — small, low-emphasis]   [Next card — large, accent-bordered]
 *
 * If `bridge` is provided, it sits above the Next card explaining *why* the next
 * lesson follows this one. This is the single biggest UX intervention for
 * curriculum coherence.
 */
export function PaginationCard({ prev, next, bridge }: PaginationCardProps) {
  return (
    <section className="px-6 md:px-12 lg:px-20 py-20 md:py-32 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 md:gap-10 items-stretch">
        {/* Previous */}
        {prev ? (
          <Link href={prev.href} className="group block h-full">
            <AstronatCard
              variant="surface"
              shape="cut-md"
              className="p-6 md:p-8 h-full flex flex-col justify-between transition-colors group-hover:border-[var(--lesson-accent)]"
            >
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] opacity-50 mb-6">
                <ArrowLeft className="w-3 h-3" />
                Previous
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-50 mb-2">
                  {getModule(prev.module).label} · Lesson {prev.number}
                </div>
                <h3 className="font-primary text-2xl md:text-3xl leading-tight tracking-tight uppercase">
                  {prev.shortTitle}
                </h3>
              </div>
            </AstronatCard>
          </Link>
        ) : (
          <Link href="/learn" className="group block h-full">
            <AstronatCard
              variant="surface"
              shape="cut-md"
              className="p-6 md:p-8 h-full flex flex-col justify-between transition-colors group-hover:border-[var(--lesson-accent)]"
            >
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] opacity-50 mb-6">
                <ArrowLeft className="w-3 h-3" />
                Index
              </div>
              <h3 className="font-primary text-2xl md:text-3xl leading-tight tracking-tight uppercase">
                The Academy
              </h3>
            </AstronatCard>
          </Link>
        )}

        {/* Next */}
        {next ? (
          <Link href={next.href} className="group block h-full">
            <AstronatCard
              variant="charcoal"
              shape="asymmetric-md"
              className="p-8 md:p-12 h-full flex flex-col justify-between border-2 transition-colors"
              style={{ borderColor: "var(--lesson-accent)" }}
            >
              {bridge && (
                <p className="font-body text-base md:text-lg leading-relaxed opacity-80 mb-10 max-w-xl">
                  {bridge}
                </p>
              )}
              <div>
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3"
                  style={{ color: "var(--lesson-accent)" }}
                >
                  Next · {getModule(next.module).label} · Lesson {next.number}
                </div>
                <div className="flex items-end justify-between gap-6 flex-wrap">
                  <h3 className="font-primary text-4xl md:text-6xl leading-[0.9] tracking-tight uppercase">
                    {next.shortTitle}
                  </h3>
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Continue
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </AstronatCard>
          </Link>
        ) : (
          <Link href="/learn" className="group block h-full">
            <AstronatCard
              variant="charcoal"
              shape="asymmetric-md"
              className="p-8 md:p-12 h-full flex flex-col justify-between border-2 transition-colors"
              style={{ borderColor: "var(--lesson-accent)" }}
            >
              <p className="font-body text-base md:text-lg leading-relaxed opacity-80 mb-10 max-w-xl">
                You&apos;ve reached the end of the curriculum. The Academy index has
                every lesson at a glance.
              </p>
              <div>
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.3em] mb-3"
                  style={{ color: "var(--lesson-accent)" }}
                >
                  Curriculum complete
                </div>
                <div className="flex items-end justify-between gap-6 flex-wrap">
                  <h3 className="font-primary text-4xl md:text-6xl leading-[0.9] tracking-tight uppercase">
                    Back to the Index
                  </h3>
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] opacity-70 whitespace-nowrap">
                    Return
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </AstronatCard>
          </Link>
        )}
      </div>
    </section>
  );
}
