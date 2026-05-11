import Link from "next/link";
import { AstronatCard } from "@/app/components/ui/astronat-card";
import { ArrowUpRight } from "lucide-react";
import type { Lesson } from "./curriculum";

type RelatedGuidesProps = {
  /** Optional kicker. Defaults to "Read next". */
  label?: string;
  /** 2–4 hand-picked related guides. Order matters — left to right. */
  guides: Lesson[];
};

/**
 * Footer block of cross-shelf recommendations on a guide page. Replaces
 * the prev/next `PaginationCard`: there's no curriculum order, so we
 * surface 3 hand-curated related guides as small editorial cards.
 */
export function RelatedGuides({
  label = "Read next",
  guides,
}: RelatedGuidesProps) {
  if (!guides.length) return null;
  return (
    <section className="px-6 md:px-12 lg:px-20 py-16 md:py-24 max-w-[1600px] mx-auto">
      <div className="border-t border-[var(--surface-border)] pt-10 md:pt-14">
        <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-70 mb-8 md:mb-10">
          {label}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {guides.map((g) => (
            <Link key={g.id} href={g.href} className="group block">
              <AstronatCard
                variant="surface"
                shape="cut-md"
                className="h-full p-6 md:p-8 flex flex-col gap-5 transition-colors group-hover:border-[var(--lesson-accent)]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.3em]"
                    style={{ color: g.accent }}
                  >
                    {g.category}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-50">
                    {g.readingTime}
                  </span>
                </div>
                <h3 className="font-primary text-2xl md:text-3xl leading-[1.05] tracking-tight">
                  {g.shortTitle}
                </h3>
                <p className="font-body text-sm md:text-base leading-snug opacity-80">
                  {g.oneLine}
                </p>
                <div className="mt-auto pt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] opacity-60 group-hover:opacity-100 transition-opacity">
                  Read
                  <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </AstronatCard>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
