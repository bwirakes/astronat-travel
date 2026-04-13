"use client";

import GeodeticMapSVG from "@/app/(frontend)/geodetic/components/GeodeticMapSVG";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = Record<string, any>;

export function GeoMapSection({ block }: { block: Block }) {
  const heading = String(block.heading ?? "");
  const sectionLabel = block.sectionLabel as string | undefined;
  const intro = block.intro as string | undefined;

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
        {intro && (
          <p className="text-[0.9rem] font-light text-[var(--text-secondary)] leading-[1.8] max-w-[680px] mb-8">
            {intro}
          </p>
        )}

        {/* Sepharial map container */}
        <div className="bg-[var(--color-charcoal)] pt-8 [clip-path:var(--cut-md)] border border-[var(--surface-border)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(248,245,236,0.35)] mb-4 px-8 hidden md:block">
            Sepharial Geodetic System — 0° Aries anchored to 0° Longitude
            (Greenwich Meridian)
          </div>
          <GeodeticMapSVG className="w-full h-auto block" />
          <div className="flex flex-wrap gap-8 py-5 px-8 border-t border-[rgba(248,245,236,0.08)] bg-[rgba(248,245,236,0.03)]">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[rgba(248,245,236,0.35)]">
              <span className="w-4 h-1 bg-[rgba(230,122,122,0.7)] shrink-0" />
              0° Aries — Greenwich Meridian
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[rgba(248,245,236,0.35)]">
              <span className="w-4 h-1 bg-[rgba(202,241,240,0.6)] shrink-0" />
              Key city
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[rgba(248,245,236,0.35)]">
              <span className="w-4 h-1 bg-[rgba(230,122,122,0.85)] shrink-0" />
              Singapore (AstroNat base)
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[rgba(248,245,236,0.35)]">
              <span className="w-4 h-1 bg-[rgba(248,245,236,0.12)] shrink-0" />
              Longitude bands — each = 30° / one zodiac sign
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 mt-8">
          <div className="p-6 border border-[var(--surface-border)] rounded-tl-[var(--shape-asymmetric-md)] bg-[var(--bg-raised)]">
            <div className="font-secondary text-[2rem] font-semibold text-[var(--color-y2k-blue)] leading-none">
              1°
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] mt-1">
              Zodiac = 1° Longitude
            </div>
          </div>
          <div className="p-6 border-y border-r border-[var(--surface-border)] md:border-l-0 border-l-[var(--surface-border)] bg-[var(--bg-raised)]">
            <div className="font-secondary text-[2rem] font-semibold text-[var(--color-y2k-blue)] leading-none">
              30°
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] mt-1">
              Longitude per zodiac sign
            </div>
          </div>
          <div className="p-6 border border-t-0 md:border-t md:border-l-0 border-[var(--surface-border)] bg-[var(--bg-raised)]">
            <div className="font-secondary text-[2rem] font-semibold text-[var(--color-y2k-blue)] leading-none">
              12
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] mt-1">
              Bands covering the globe
            </div>
          </div>
          <div className="p-6 border-b border-r md:border-t md:border-l-0 border-l-[var(--surface-border)] border-[var(--surface-border)] rounded-br-[var(--shape-asymmetric-md)] bg-[var(--bg-raised)]">
            <div className="font-secondary text-[2rem] font-semibold text-[var(--color-y2k-blue)] leading-none">
              1890s
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] mt-1">
              Sepharial&apos;s original system
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
