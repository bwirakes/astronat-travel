"use client";

import Link from "next/link";
import ElonMapSVG from "@/app/(frontend)/geodetic/components/ElonMapSVG";
import TrumpMapSVG from "@/app/(frontend)/geodetic/components/TrumpMapSVG";

const elonPlanets = [
  {
    sym: "\u2642",
    title: "Mars — Geodetic equiv. ~40°W",
    desc: 'Musk\'s natal Mars in Aquarius maps to approximately <strong>40°W longitude</strong> — running through Brazil and the US East Coast/Texas region. His SpaceX Starbase (Boca Chica, Texas, ~97°W), Tesla Gigafactory (Austin), and X headquarters all cluster near this longitude band. Mars in geodetics: drive, industry, physical infrastructure.',
  },
  {
    sym: "\u2609",
    title: "Sun — Geodetic equiv. ~96°E",
    desc: 'His Cancer Sun maps to ~96°E longitude — running through <strong>Southeast Asia, Myanmar, and western China</strong>. Notably, Tesla\'s largest non-US factory is in Shanghai (121°E, within the Sun\'s adjacent band). The geodetic Sun often correlates with visibility and identity — where one\'s public profile is most luminous.',
  },
  {
    sym: "\u2644",
    title: "Saturn — Geodetic equiv. ~55°E",
    desc: 'Saturn in Taurus maps to ~55°E — the <strong>Arabian Peninsula and Gulf region</strong>. Musk\'s complex relationship with Saudi Arabia (attempted Twitter buyout financing, PIF involvement) and UAE operations has been a recurring source of constraint, negotiation, and structural friction — classically Saturnian themes.',
  },
];

const trumpPlanets = [
  {
    sym: "\u2609",
    title: "Sun — Geodetic equiv. ~82°E",
    desc: 'His Gemini Sun maps to ~82°E — running through <strong>Egypt, East Africa, and western Russia</strong>. Trump\'s most fraught and formative foreign entanglements — Russia investigations, Middle East diplomacy (Abraham Accords), Egypt relations — all orbit this longitude band. The Sun in geodetics: identity, visibility, power projection.',
  },
  {
    sym: "\u263D",
    title: "Moon — Geodetic equiv. ~99°W",
    desc: 'His Sagittarius Moon maps to ~99°W — running through the <strong>American heartland</strong> (Oklahoma, Texas, Kansas). This is precisely Trump\'s electoral base geography. The Moon in geodetics correlates with emotional resonance, public mood, and the "feeling" of a place. His MAGA coalition\'s geographic centre sits almost exactly here.',
  },
  {
    sym: "\u2642",
    title: "Mars — Geodetic equiv. ~146°E",
    desc: "Leo Mars maps to ~146°E — running through <strong>Japan, eastern Australia, and the Pacific</strong>. Trump's trade war with China, confrontational stance toward North Korea, and the pivot of US military posture toward the Indo-Pacific were defining features of his foreign policy. Mars: friction, force, confrontation.",
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function GeoCaseStudiesEmbed(_props: { block: Record<string, any> }) {
  return (
    <section className="py-20 border-b border-[var(--surface-border)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-baseline border-b border-[var(--surface-border)] pb-5 mb-10">
          <h2 className="font-secondary text-[clamp(2rem,3.5vw,2.8rem)] font-semibold text-[var(--text-primary)] leading-none">
            Case Studies
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] shrink-0">
            05 — Famous Charts
          </span>
        </div>
        <p className="text-[0.9rem] font-light text-[var(--text-secondary)] leading-[1.85] max-w-[620px] mb-12">
          Theory becomes real when you look at specific people. Here are two
          well-known figures whose{" "}
          <strong className="font-medium text-[var(--text-primary)]">
            geodetic equivalents
          </strong>{" "}
          map strikingly onto the key locations of their lives and influence.
          These are illustrative analyses based on publicly available birth data
          — the same method used in professional readings.
        </p>

        {/* Elon Musk */}
        <div className="border border-[var(--surface-border)] bg-[var(--bg-raised)] rounded-[2rem] overflow-hidden mb-12 hover:border-[rgba(4,86,251,0.3)] transition-colors group">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-4 px-6 lg:px-10 py-6 border-b border-[var(--surface-border)]">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-y2k-blue)] bg-[rgba(4,86,251,0.08)] px-3 py-1 hidden md:block">
              Case Study 01
            </span>
            <div>
              <div className="font-secondary text-[1.8rem] font-semibold text-[var(--text-primary)] mb-0.5">
                Elon Musk
              </div>
              <div className="text-[10px] font-mono tracking-[0.06em] text-[var(--text-tertiary)] uppercase">
                Entrepreneur — born Pretoria, South Africa &middot; Geodetic MC:
                ♈ Aries
              </div>
            </div>
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--text-tertiary)] text-right hidden md:block">
              Born 28 Jun 1971
              <br />
              Pretoria, 28.2°E
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="border-b lg:border-b-0 lg:border-r border-[var(--surface-border)] bg-[var(--color-charcoal)] flex flex-col">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(248,245,236,0.35)] px-6 pt-5 pb-2">
                Geodetic Equivalent Lines — Elon Musk
              </div>
              <ElonMapSVG className="w-full h-auto block flex-1" />
              <div className="flex flex-wrap gap-4 px-6 pb-5 pt-2 border-t border-[rgba(248,245,236,0.07)]">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(248,245,236,0.45)]">
                  <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
                  Sun equiv — ~96°E
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(248,245,236,0.45)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-spiced-life)]" />
                  Mars equiv — ~40°W
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(248,245,236,0.45)]">
                  <span className="w-2 h-2 rounded-full bg-[#888]" />
                  Saturn equiv — ~55°E
                </div>
              </div>
            </div>
            <div className="p-6 lg:p-10 flex flex-col justify-center">
              <p className="font-secondary text-[1.25rem] italic text-[var(--text-primary)] leading-[1.45] mb-6 pb-6 border-b border-[var(--surface-border)]">
                &ldquo;Musk&apos;s Mars equivalent falls along roughly 40°W — a
                line running directly through his Texas and Florida operational
                heartland. Mars: ambition, industrial force, launch
                energy.&rdquo;
              </p>
              <div className="flex flex-col gap-6">
                {elonPlanets.map((p, i) => (
                  <div key={i} className="grid grid-cols-[2.5rem_1fr] gap-3">
                    <span className="font-secondary text-[1.4rem] text-[var(--color-y2k-blue)] text-center">
                      {p.sym}
                    </span>
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-primary)] font-bold mb-0.5">
                        {p.title}
                      </div>
                      <p
                        className="text-[0.82rem] font-light text-[var(--text-secondary)] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: p.desc }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="px-6 lg:px-10 py-5 bg-[var(--surface-border)] flex flex-wrap items-center justify-between opacity-80">
            <span className="text-[0.75rem] font-light text-[var(--text-tertiary)] italic">
              Birth data: 28 June 1971, Pretoria, S. Africa (RR: A). Geodetic
              equivalents calculated per Sepharial&apos;s system.
            </span>
            <Link
              href="#"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-y2k-blue)] font-bold"
            >
              Get your geodetic reading &rarr;
            </Link>
          </div>
        </div>

        {/* Trump */}
        <div className="border border-[var(--surface-border)] bg-[var(--bg-raised)] rounded-[2rem] overflow-hidden hover:border-[rgba(4,86,251,0.3)] transition-colors group">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-4 px-6 lg:px-10 py-6 border-b border-[var(--surface-border)]">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-y2k-blue)] bg-[rgba(4,86,251,0.08)] px-3 py-1 hidden md:block">
              Case Study 02
            </span>
            <div>
              <div className="font-secondary text-[1.8rem] font-semibold text-[var(--text-primary)] mb-0.5">
                Donald Trump
              </div>
              <div className="text-[10px] font-mono tracking-[0.06em] text-[var(--text-tertiary)] uppercase">
                45th &amp; 47th US President — born Queens, New York &middot;
                Geodetic MC: ♑ Capricorn
              </div>
            </div>
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--text-tertiary)] text-right hidden md:block">
              Born 14 Jun 1946
              <br />
              Queens, NY, 73.8°W
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="border-b lg:border-b-0 lg:border-r border-[var(--surface-border)] bg-[var(--color-charcoal)] flex flex-col">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(248,245,236,0.35)] px-6 pt-5 pb-2">
                Geodetic Equivalent Lines — Donald Trump
              </div>
              <TrumpMapSVG className="w-full h-auto block flex-1" />
              <div className="flex flex-wrap gap-4 px-6 pb-5 pt-2 border-t border-[rgba(248,245,236,0.07)]">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(248,245,236,0.45)]">
                  <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
                  Sun equiv — ~82°E
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(248,245,236,0.45)]">
                  <span className="w-2 h-2 rounded-full bg-[rgba(220,220,255,0.9)]" />
                  Moon equiv — ~99°W
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(248,245,236,0.45)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-spiced-life)]" />
                  Mars equiv — ~146°E
                </div>
              </div>
            </div>
            <div className="p-6 lg:p-10 flex flex-col justify-center">
              <p className="font-secondary text-[1.25rem] italic text-[var(--text-primary)] leading-[1.45] mb-6 pb-6 border-b border-[var(--surface-border)]">
                &ldquo;Trump&apos;s birth longitude (73.8°W) falls in Capricorn
                on the geodetic map — and his entire empire of identity has
                remained anchored to that New York band throughout his
                life.&rdquo;
              </p>
              <div className="flex flex-col gap-6">
                {trumpPlanets.map((p, i) => (
                  <div key={i} className="grid grid-cols-[2.5rem_1fr] gap-3">
                    <span className="font-secondary text-[1.4rem] text-[var(--color-y2k-blue)] text-center">
                      {p.sym}
                    </span>
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-primary)] font-bold mb-0.5">
                        {p.title}
                      </div>
                      <p
                        className="text-[0.82rem] font-light text-[var(--text-secondary)] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: p.desc }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="px-6 lg:px-10 py-5 bg-[var(--surface-border)] flex flex-wrap items-center justify-between opacity-80">
            <span className="text-[0.75rem] font-light text-[var(--text-tertiary)] italic">
              Birth data: 14 June 1946, 10:54am, Jamaica, Queens, NY (RR: AA).
              Geodetic equivalents per Sepharial&apos;s system.
            </span>
            <Link
              href="#"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-y2k-blue)] font-bold"
            >
              Book your reading &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
