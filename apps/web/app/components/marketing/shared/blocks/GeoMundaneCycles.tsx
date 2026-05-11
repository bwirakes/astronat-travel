"use client";

import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = Record<string, any>;

export function GeoMundaneCycles({ block }: { block: Block }) {
  const heading = String(block.heading ?? "");
  const sectionLabel = block.sectionLabel as string | undefined;
  const bannerKicker = block.bannerKicker as string | undefined;
  const bannerTitleAccent = block.bannerTitleAccent as string | undefined;
  const bannerTitle = block.bannerTitle as string | undefined;
  const bannerBody = block.bannerBody as string | undefined;
  const cycles = (block.cycles as { sym?: string; title?: string; desc?: string }[] | undefined) ?? [];
  const notes = (block.researchNotes as { loc?: string; desc?: string }[] | undefined) ?? [];
  const researchCtaLabel = block.researchCtaLabel as string | undefined;
  const researchCtaHref = block.researchCtaHref as string | undefined;

  return (
    <section className="py-20 border-b border-[var(--surface-border)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-baseline border-b border-[var(--surface-border)] pb-5 mb-10">
          <h2 className="font-secondary text-[clamp(2rem,3.5vw,2.8rem)] font-semibold text-[var(--text-primary)] leading-none">
            {heading}
          </h2>
          {sectionLabel && (
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] shrink-0">
              {sectionLabel}
            </span>
          )}
        </div>
        <div className="bg-[var(--color-spiced-life)] grid grid-cols-1 lg:grid-cols-[1fr_400px] overflow-hidden rounded-[2rem] border border-[var(--surface-border)] shadow-xl">
          {/* Left — cycles */}
          <div className="p-8 lg:p-14 relative">
            {bannerKicker && (
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[rgba(27,27,27,0.45)] mb-3">
                {bannerKicker}
              </div>
            )}
            {bannerTitleAccent && (
              <span className="font-display-alt-2 text-[clamp(2.5rem,4vw,3.5rem)] text-[var(--color-charcoal)] leading-[0.95] block mb-1">
                {bannerTitleAccent}
              </span>
            )}
            {bannerTitle && (
              <h2
                className="font-secondary text-[clamp(2.5rem,4vw,3.5rem)] font-semibold leading-[0.9] text-[var(--color-eggshell)] mb-5"
                dangerouslySetInnerHTML={{ __html: bannerTitle }}
              />
            )}
            {bannerBody && (
              <p className="text-[0.875rem] font-light text-[rgba(27,27,27,0.65)] max-w-[440px] leading-[1.75] mb-8">
                {bannerBody}
              </p>
            )}
            <div className="flex flex-col gap-2.5">
              {cycles.map((c, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 px-5 py-4 bg-[rgba(27,27,27,0.08)] rounded-[2rem] border border-[rgba(27,27,27,0.03)] group transition-all hover:bg-[rgba(27,27,27,0.12)]"
                >
                  <span className="font-secondary text-[1.3rem] text-[var(--color-charcoal)] min-w-[1.5rem] leading-none mt-0.5">
                    {c.sym}
                  </span>
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-charcoal)] font-bold mb-0.5">
                      {c.title}
                    </div>
                    <div className="text-[0.78rem] font-light text-[rgba(27,27,27,0.6)] leading-snug">
                      {c.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — research notes */}
          <div className="bg-[var(--color-charcoal)] flex flex-col justify-center px-6 lg:px-10 py-12">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(248,245,236,0.35)] mb-5">
              Research Notes
            </div>
            <div className="font-secondary text-[1.5rem] font-semibold text-[var(--color-eggshell)] leading-[1.2] mb-4">
              Where these cycles land on the geodetic map
            </div>
            <div className="flex flex-col gap-3 mb-6">
              {notes.map((note, idx) => (
                <div
                  key={idx}
                  className="px-3.5 py-3 bg-[rgba(248,245,236,0.04)] border-l-2 border-[var(--color-y2k-blue)] group hover:bg-[rgba(248,245,236,0.06)] transition-colors"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-acqua)] mb-1">
                    {note.loc}
                  </div>
                  <div className="text-[0.78rem] font-light text-[rgba(248,245,236,0.55)] leading-tight">
                    {note.desc}
                  </div>
                </div>
              ))}
            </div>
            {researchCtaLabel && (
              <Link
                href={researchCtaHref ?? "#"}
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-eggshell)] bg-[var(--color-y2k-blue)] hover:bg-[#0340cc] px-6 py-4 transition-colors self-start rounded-[var(--shape-asymmetric-md)]"
              >
                {researchCtaLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
