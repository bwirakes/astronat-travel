"use client";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Image from "next/image";
import Link from "next/link";
import GeodeticMapSVG from "./components/GeodeticMapSVG";
import ElonMapSVG from "./components/ElonMapSVG";
import TrumpMapSVG from "./components/TrumpMapSVG";
import { ArrowRight } from "lucide-react";

const TICKER = [
  "Geodetic Astrology",
  "Mundane Cycles",
  "Sepharial's World Map",
  "Saturn–Jupiter Conjunctions",
  "Eclipse Paths",
  "World Points",
  "Geodetic Equivalents",
  "National Horoscopes"
];

export default function GeodeticMundanePage() {
  return (
    <div className="bg-[var(--bg)] text-[var(--text-primary)] min-h-screen font-body w-full relative overflow-x-hidden transition-colors duration-300">
      <Navbar hideAuth={false} />
      
      {/* Hero */}
      <section className="pt-32 pb-14 md:pt-44 md:pb-24 border-b border-[var(--surface-border)] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-end">
          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-px bg-[var(--color-y2k-blue)]"></div>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-y2k-blue)]">Geodetic &amp; Mundane Astrology</span>
            </div>
            <h1 className="font-secondary leading-[0.88] tracking-tight text-[var(--text-primary)] mb-6" style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)" }}>
              <span className="block mb-1 text-[var(--color-spiced-life)]" style={{ fontFamily: "var(--font-display-alt-2)", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 400 }}>The world</span>
              Where the <em className="italic text-[var(--color-y2k-blue)] font-light">Sky</em><br/>Meets the Earth
            </h1>
          </div>
          <div className="relative">
            <p className="text-[0.95rem] font-light text-[var(--text-secondary)] leading-[1.85] mb-6">
              Most people know astrology as something personal — your chart, your planets, your life. But there is a whole other branch of the tradition that looks outward: at countries, cities, and the cycles shaping the world around us. <strong className="font-medium text-[var(--text-primary)]">Geodetic astrology</strong> maps the zodiac directly onto the globe. <strong className="font-medium text-[var(--text-primary)]">Mundane astrology</strong> tracks the planetary cycles that move through history.
            </p>
            <p className="text-xs font-light text-[var(--text-secondary)] leading-[1.65] max-w-sm mb-8 opacity-80">
              The sky isn't just above you — it is mapped onto the earth beneath you. Geodetic astrology reveals the archetypal character of locations and how shifting mundane cycles activate territories across history.
            </p>
            <div className="flex flex-wrap gap-4 items-center mb-5">
              <Link href="#" className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-eggshell)] bg-[var(--color-y2k-blue)] border-none px-8 py-3.5 transition-colors hover:bg-[var(--color-charcoal)] rounded-[var(--shape-asymmetric-md)]">
                Book a Geodetic Reading →
              </Link>
              <Link href="#" className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-primary)] bg-transparent border border-[var(--surface-border)] px-8 py-3.5 transition-all hover:bg-[var(--text-primary)] hover:text-[var(--bg)] rounded-[var(--shape-asymmetric-md)]">
                Explore the Course
              </Link>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-spiced-life)] shrink-0"></span>
              <span className="text-[0.72rem] text-[var(--text-tertiary)] tracking-[0.04em]">Analytical, evidence-led practice — not prediction theatre.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker ─────────────────────────────────────────────────── */}
      <div className="bg-[var(--color-y2k-blue)] py-3 overflow-hidden whitespace-nowrap">
        <div className="inline-flex" style={{ animation: "ticker-scroll 32s linear infinite" }}>
          {[...TICKER, ...TICKER].map((item, i) => (
            <span
              key={i}
              className="font-mono text-[11px] uppercase tracking-[0.22em] px-10 text-[var(--color-eggshell)]"
            >
              {item} 
              <span className="ml-4 text-[var(--color-acqua)]">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* What is it */}
      <section className="py-20 border-b border-[var(--surface-border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-baseline border-b border-[var(--surface-border)] pb-5 mb-10">
            <h2 className="font-secondary text-[clamp(2rem,3.5vw,2.8rem)] font-semibold text-[var(--text-primary)] leading-none">What is Geodetic Astrology?</h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] shrink-0">01 — The Basics</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div>
              <h3 className="font-secondary text-[1.9rem] font-semibold text-[var(--text-primary)] leading-[1.1] mb-3.5">A zodiac fixed to the globe</h3>
              <p className="text-[0.9rem] font-light text-[var(--text-secondary)] leading-[1.85] mb-4">
                The Victorian astrologer <strong className="font-medium text-[var(--text-primary)]">Sepharial</strong> (Walter Gorn Old, 1864–1929) proposed a deceptively simple idea: anchor 0° Aries permanently to the Greenwich Meridian, and let each degree of the zodiac correspond to one degree of longitude around the earth.
              </p>
              <p className="text-[0.9rem] font-light text-[var(--text-secondary)] leading-[1.85] mb-4">
                The result is a <strong className="font-medium text-[var(--text-primary)]">fixed planetary map of the world</strong>. Every city and country gets its own zodiac sign on the Midheaven and Ascendant — determined purely by geography, not by anyone's birth time. These are called a location's <strong className="font-medium text-[var(--text-primary)]">geodetic angles</strong>.
              </p>
              <p className="text-[0.9rem] font-light text-[var(--text-secondary)] leading-[1.85]">
                When slow-moving planets transit a city's geodetic angles, <strong className="font-medium text-[var(--text-primary)]">the collective experience of that place tends to shift</strong> in ways that mirror the planet's archetype. Pluto crossing a country's geodetic Midheaven has historically correlated with governance upheaval. Saturn with austerity or constraint. Jupiter with growth and expansion.
              </p>
            </div>
            <div>
              <h3 className="font-secondary text-[1.9rem] font-semibold text-[var(--text-primary)] leading-[1.1] mb-3.5">How your chart connects</h3>
              <p className="text-[0.9rem] font-light text-[var(--text-secondary)] leading-[1.85] mb-4">
                Your natal planets each have a <strong className="font-medium text-[var(--text-primary)]">geodetic equivalent</strong> — a longitude on earth where that planet resonates in the fixed geodetic system. These are places where you are likely to feel that planet's energy more strongly, simply because your chart aligns with the ground beneath your feet.
              </p>
              <p className="text-[0.9rem] font-light text-[var(--text-secondary)] leading-[1.85] mb-4">
                A natal Venus at 15° Taurus, for example, sits at roughly <strong className="font-medium text-[var(--text-primary)]">45° East longitude</strong> — a line running through East Africa, the Arabian Peninsula, and into Russia. People with strong Venus placements often describe feeling unusually creative or relationally activated near these longitudes.
              </p>
              <p className="text-[0.9rem] font-light text-[var(--text-secondary)] leading-[1.85]">
                Unlike astrocartography (which shifts with your birth chart), geodetic equivalents are a <strong className="font-medium text-[var(--text-primary)]">collective, earth-level resonance</strong> — a meeting point between your personal chart and the world's inherent geography.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEPHARIAL MAP SVG */}
      <section className="py-20 border-b border-[var(--surface-border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-baseline border-b border-[var(--surface-border)] pb-5 mb-10">
            <h2 className="font-secondary text-[clamp(2rem,3.5vw,2.8rem)] font-semibold text-[var(--text-primary)] leading-none">The Sepharial Geodetic Map</h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] shrink-0">02 — The Map</span>
          </div>
          <p className="text-[0.9rem] font-light text-[var(--text-secondary)] leading-[1.8] max-w-[680px] mb-8">
            Each band below shows which zodiac sign rules that longitude — and therefore which cities and regions carry that sign's collective signature. Hover a band to see the sign, its ruling planet, and key cities within it.
          </p>
          
          <div className="bg-[var(--color-charcoal)] pt-8 [clip-path:var(--cut-md)] border border-[var(--surface-border)]">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(248,245,236,0.35)] mb-4 px-8 hidden md:block">
              Sepharial Geodetic System — 0° Aries anchored to 0° Longitude (Greenwich Meridian)
            </div>
            <GeodeticMapSVG className="w-full h-auto block" />
            <div className="flex flex-wrap gap-8 py-5 px-8 border-t border-[rgba(248,245,236,0.08)] bg-[rgba(248,245,236,0.03)]">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[rgba(248,245,236,0.35)]">
                <span className="w-4 h-1 bg-[rgba(230,122,122,0.7)] shrink-0"></span>0° Aries — Greenwich Meridian
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[rgba(248,245,236,0.35)]">
                <span className="w-4 h-1 bg-[rgba(202,241,240,0.6)] shrink-0"></span>Key city
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[rgba(248,245,236,0.35)]">
                <span className="w-4 h-1 bg-[rgba(230,122,122,0.85)] shrink-0"></span>Singapore (AstroNat base)
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[rgba(248,245,236,0.35)]">
                <span className="w-4 h-1 bg-[rgba(248,245,236,0.12)] shrink-0"></span>Longitude bands — each = 30° / one zodiac sign
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 mt-8">
            <div className="p-6 border border-[var(--surface-border)] rounded-tl-[var(--shape-asymmetric-md)] bg-[var(--bg-raised)]">
              <div className="font-secondary text-[2rem] font-semibold text-[var(--color-y2k-blue)] leading-none">1°</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] mt-1">Zodiac = 1° Longitude</div>
            </div>
            <div className="p-6 border-y border-r border-[var(--surface-border)] md:border-l-0 border-l-[var(--surface-border)] bg-[var(--bg-raised)]">
              <div className="font-secondary text-[2rem] font-semibold text-[var(--color-y2k-blue)] leading-none">30°</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] mt-1">Longitude per zodiac sign</div>
            </div>
            <div className="p-6 border border-t-0 md:border-t md:border-l-0 border-[var(--surface-border)] bg-[var(--bg-raised)]">
              <div className="font-secondary text-[2rem] font-semibold text-[var(--color-y2k-blue)] leading-none">12</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] mt-1">Bands covering the globe</div>
            </div>
            <div className="p-6 border-b border-r md:border-t md:border-l-0 border-l-[var(--surface-border)] border-[var(--surface-border)] rounded-br-[var(--shape-asymmetric-md)] bg-[var(--bg-raised)]">
              <div className="font-secondary text-[2rem] font-semibold text-[var(--color-y2k-blue)] leading-none">1890s</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] mt-1">Sepharial's original system</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 border-b border-[var(--surface-border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-baseline border-b border-[var(--surface-border)] pb-5 mb-10">
            <h2 className="font-secondary text-[clamp(2rem,3.5vw,2.8rem)] font-semibold text-[var(--text-primary)] leading-none">How It Works — The Core Ideas</h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] shrink-0">03 — Techniques</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-9 relative overflow-hidden min-h-[320px] flex flex-col justify-between bg-[var(--color-charcoal)] rounded-[2rem] border border-[var(--surface-border)] group hover:border-[var(--color-y2k-blue)] transition-colors">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(248,245,236,0.3)] mb-5">01</div>
                <div className="font-secondary text-[1.6rem] font-semibold text-[var(--color-eggshell)] leading-[1.1] mb-2.5">Geodetic Angles</div>
                <p className="text-[0.82rem] font-light text-[rgba(248,245,236,0.55)] leading-[1.8]">Every city has a fixed zodiac sign on its Midheaven and Ascendant — determined by latitude and longitude alone. These are its inherent "character". When outer planets transit these points, collective events tend to unfold that mirror the planet's archetype.</p>
              </div>
              <span className="absolute bottom-5 right-6 font-secondary text-[5rem] leading-none text-[rgba(248,245,236,0.05)] pointer-events-none group-hover:text-[rgba(248,245,236,0.1)] transition-colors">MC</span>
            </div>
            
            <div className="p-9 relative overflow-hidden min-h-[320px] flex flex-col justify-between bg-[var(--bg-raised)] border border-[var(--surface-border)] rounded-[2rem] group hover:border-[var(--color-y2k-blue)] transition-colors">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mb-5">02</div>
                <div className="font-secondary text-[1.6rem] font-semibold text-[var(--text-primary)] leading-[1.1] mb-2.5">Your Geodetic Equivalents</div>
                <p className="text-[0.82rem] font-light text-[var(--text-secondary)] leading-[1.8]">Each of your natal planets maps to a longitude on earth. These are locations where you resonate with that planet at a collective level — not just personally. Venus equivalents for creative richness; Saturn for discipline; Pluto for deep transformation.</p>
              </div>
              <span className="absolute bottom-5 right-6 font-secondary text-[5rem] leading-none text-[rgba(27,27,27,0.04)] pointer-events-none group-hover:text-[rgba(27,27,27,0.08)] transition-colors">♀</span>
            </div>

            <div className="p-9 relative overflow-hidden min-h-[320px] flex flex-col justify-between bg-[var(--color-y2k-blue)] rounded-[2rem] border border-[rgba(248,245,236,0.14)] group hover:bg-[#0340cc] transition-colors">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgba(248,245,236,0.3)] mb-5">03</div>
                <div className="font-secondary text-[1.6rem] font-semibold text-[var(--color-eggshell)] leading-[1.1] mb-2.5">Mundane Cycles</div>
                <p className="text-[0.82rem] font-light text-[rgba(248,245,236,0.55)] leading-[1.8]">Mundane astrology tracks slow outer-planet cycles that shape collective history — Saturn–Jupiter conjunctions (~20 yrs), Saturn–Pluto (~35 yrs), and Pluto's sign ingresses. Layered onto geodetics, they reveal <em className="italic">when</em> a location is most activated.</p>
              </div>
              <span className="absolute bottom-5 right-6 font-secondary text-[5rem] leading-none text-[rgba(248,245,236,0.2)] pointer-events-none group-hover:text-[rgba(248,245,236,0.3)] transition-colors">♄</span>
            </div>
          </div>
        </div>
      </section>

      {/* MUNDANE BANNER */}
      <section className="py-20 border-b border-[var(--surface-border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-baseline border-b border-[var(--surface-border)] pb-5 mb-10">
            <h2 className="font-secondary text-[clamp(2rem,3.5vw,2.8rem)] font-semibold text-[var(--text-primary)] leading-none">The Mundane Cycles Active Now</h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] shrink-0">04 — Current Sky</span>
          </div>
          <div className="bg-[var(--color-spiced-life)] grid grid-cols-1 lg:grid-cols-[1fr_400px] overflow-hidden rounded-[2rem] border border-[var(--surface-border)] shadow-xl">
            <div className="p-8 lg:p-14 relative">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[rgba(27,27,27,0.45)] mb-3">Mundane Astrology</div>
              <span className="font-display-alt-2 text-[clamp(2.5rem,4vw,3.5rem)] text-[var(--color-charcoal)] leading-[0.95] block mb-1">The world</span>
              <h2 className="font-secondary text-[clamp(2.5rem,4vw,3.5rem)] font-semibold leading-[0.9] text-[var(--color-eggshell)] mb-5">
                Big cycles,<br/><em className="italic font-light">collective shifts</em>
              </h2>
              <p className="text-[0.875rem] font-light text-[rgba(27,27,27,0.65)] max-w-[440px] leading-[1.75] mb-8">
                Mundane astrology is the astrology of nations and collective experience. It doesn't predict specific events — it identifies archetypal pressures and timing windows. These are the major cycles active right now.
              </p>
              <div className="flex flex-col gap-2.5">
                {[
                  { sym: "♇", title: "Pluto in Aquarius (2024–2044)", desc: "The restructuring of networks, institutions, and collective power — once per ~248 years." },
                  { sym: "♆", title: "Neptune into Aries (from 2025)", desc: "The dissolution of old identities; new mythologies emerge. Idealism meets the pioneer impulse." },
                  { sym: "♄♆", title: "Saturn–Neptune conjunction (2025–26)", desc: "Reality vs. illusion; structural dissolution; the material limits of dreams meet reality — and vice versa." },
                  { sym: "♃♄", title: "Jupiter–Saturn cycle (~20 yrs)", desc: "The classic \"chronocrator\" — correlates with political leadership changes and economic paradigm shifts." }
                ].map((c, i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-4 bg-[rgba(27,27,27,0.08)] rounded-[2rem] border border-[rgba(27,27,27,0.03)] group transition-all hover:bg-[rgba(27,27,27,0.12)]">
                    <span className="font-secondary text-[1.3rem] text-[var(--color-charcoal)] min-w-[1.5rem] leading-none mt-0.5">{c.sym}</span>
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-charcoal)] font-bold mb-0.5">{c.title}</div>
                      <div className="text-[0.78rem] font-light text-[rgba(27,27,27,0.6)] leading-snug">{c.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[var(--color-charcoal)] flex flex-col justify-center px-6 lg:px-10 py-12">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(248,245,236,0.35)] mb-5">Research Notes</div>
              <div className="font-secondary text-[1.5rem] font-semibold text-[var(--color-eggshell)] leading-[1.2] mb-4">Where these cycles land on the geodetic map</div>
              <div className="flex flex-col gap-3 mb-6">
                {[
                  { loc: "SE Asia", desc: "Singapore's geodetic MC (♋ Cancer) activated by Neptune transit — themes of home, belonging, institutional identity" },
                  { loc: "Europe", desc: "Pluto transiting ♈ Aries geodetic zones across UK/West Africa longitude band — power restructuring in post-colonial frameworks" },
                  { loc: "Americas", desc: "Saturn–Neptune in ♈/♓ signs — Washington D.C.'s geodetic angles under pressure from dissolution cycles" }
                ].map((note, idx) => (
                  <div key={idx} className="px-3.5 py-3 bg-[rgba(248,245,236,0.04)] border-l-2 border-[var(--color-y2k-blue)] group hover:bg-[rgba(248,245,236,0.06)] transition-colors">
                    <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-acqua)] mb-1">{note.loc}</div>
                    <div className="text-[0.78rem] font-light text-[rgba(248,245,236,0.55)] leading-tight">{note.desc}</div>
                  </div>
                ))}
              </div>
              <Link href="#" className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-eggshell)] bg-[var(--color-y2k-blue)] hover:bg-[#0340cc] px-6 py-4 transition-colors self-start rounded-[var(--shape-asymmetric-md)]">
                Read the Research Notes →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CASE STUDIES */}
      <section className="py-20 border-b border-[var(--surface-border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-baseline border-b border-[var(--surface-border)] pb-5 mb-10">
            <h2 className="font-secondary text-[clamp(2rem,3.5vw,2.8rem)] font-semibold text-[var(--text-primary)] leading-none">Case Studies</h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] shrink-0">05 — Famous Charts</span>
          </div>
          <p className="text-[0.9rem] font-light text-[var(--text-secondary)] leading-[1.85] max-w-[620px] mb-12">
            Theory becomes real when you look at specific people. Here are two well-known figures whose <strong className="font-medium text-[var(--text-primary)]">geodetic equivalents</strong> map strikingly onto the key locations of their lives and influence. These are illustrative analyses based on publicly available birth data — the same method used in professional readings.
          </p>

          {/* Elon Musk */}
          <div className="border border-[var(--surface-border)] bg-[var(--bg-raised)] rounded-[2rem] overflow-hidden mb-12 hover:border-[rgba(4,86,251,0.3)] transition-colors group">
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-4 px-6 lg:px-10 py-6 border-b border-[var(--surface-border)]">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-y2k-blue)] bg-[rgba(4,86,251,0.08)] px-3 py-1 hidden md:block">Case Study 01</span>
              <div>
                <div className="font-secondary text-[1.8rem] font-semibold text-[var(--text-primary)] mb-0.5">Elon Musk</div>
                <div className="text-[10px] font-mono tracking-[0.06em] text-[var(--text-tertiary)] uppercase">Entrepreneur — born Pretoria, South Africa · Geodetic MC: ♈ Aries</div>
              </div>
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--text-tertiary)] text-right hidden md:block">Born 28 Jun 1971<br/>Pretoria, 28.2°E</div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="border-b lg:border-b-0 lg:border-r border-[var(--surface-border)] bg-[var(--color-charcoal)] flex flex-col">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(248,245,236,0.35)] px-6 pt-5 pb-2">Geodetic Equivalent Lines — Elon Musk</div>
                <ElonMapSVG className="w-full h-auto block flex-1" />
                <div className="flex flex-wrap gap-4 px-6 pb-5 pt-2 border-t border-[rgba(248,245,236,0.07)]">
                   <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(248,245,236,0.45)]">
                      <span className="w-2 h-2 rounded-full bg-[#FFD700]"></span>Sun equiv — ~96°E
                   </div>
                   <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(248,245,236,0.45)]">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-spiced-life)]"></span>Mars equiv — ~40°W
                   </div>
                   <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(248,245,236,0.45)]">
                      <span className="w-2 h-2 rounded-full bg-[#888]"></span>Saturn equiv — ~55°E
                   </div>
                </div>
              </div>
              <div className="p-6 lg:p-10 flex flex-col justify-center">
                <p className="font-secondary text-[1.25rem] italic text-[var(--text-primary)] leading-[1.45] mb-6 pb-6 border-b border-[var(--surface-border)]">
                  "Musk's Mars equivalent falls along roughly 40°W — a line running directly through his Texas and Florida operational heartland. Mars: ambition, industrial force, launch energy."
                </p>
                <div className="flex flex-col gap-6">
                  {[
                    { sym: "♂", title: "Mars — Geodetic equiv. ~40°W", desc: "Musk's natal Mars in Aquarius maps to approximately <strong>40°W longitude</strong> — running through Brazil and the US East Coast/Texas region. His SpaceX Starbase (Boca Chica, Texas, ~97°W), Tesla Gigafactory (Austin), and X headquarters all cluster near this longitude band. Mars in geodetics: drive, industry, physical infrastructure." },
                    { sym: "☉", title: "Sun — Geodetic equiv. ~96°E", desc: "His Cancer Sun maps to ~96°E longitude — running through <strong>Southeast Asia, Myanmar, and western China</strong>. Notably, Tesla's largest non-US factory is in Shanghai (121°E, within the Sun's adjacent band). The geodetic Sun often correlates with visibility and identity — where one's public profile is most luminous." },
                    { sym: "♄", title: "Saturn — Geodetic equiv. ~55°E", desc: "Saturn in Taurus maps to ~55°E — the <strong>Arabian Peninsula and Gulf region</strong>. Musk's complex relationship with Saudi Arabia (attempted Twitter buyout financing, PIF involvement) and UAE operations has been a recurring source of constraint, negotiation, and structural friction — classically Saturnian themes." }
                  ].map((p, i) => (
                    <div key={i} className="grid grid-cols-[2.5rem_1fr] gap-3">
                      <span className="font-secondary text-[1.4rem] text-[var(--color-y2k-blue)] text-center">{p.sym}</span>
                      <div>
                        <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-primary)] font-bold mb-0.5">{p.title}</div>
                        <p className="text-[0.82rem] font-light text-[var(--text-secondary)] leading-relaxed" dangerouslySetInnerHTML={{ __html: p.desc }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 lg:px-10 py-5 bg-[var(--surface-border)] flex flex-wrap items-center justify-between opacity-80">
               <span className="text-[0.75rem] font-light text-[var(--text-tertiary)] italic">Birth data: 28 June 1971, Pretoria, S. Africa (RR: A). Geodetic equivalents calculated per Sepharial's system.</span>
               <Link href="#" className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-y2k-blue)] font-bold">Get your geodetic reading →</Link>
            </div>
          </div>

          {/* Trump */}
          <div className="border border-[var(--surface-border)] bg-[var(--bg-raised)] rounded-[2rem] overflow-hidden hover:border-[rgba(4,86,251,0.3)] transition-colors group">
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-center gap-4 px-6 lg:px-10 py-6 border-b border-[var(--surface-border)]">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-y2k-blue)] bg-[rgba(4,86,251,0.08)] px-3 py-1 hidden md:block">Case Study 02</span>
              <div>
                <div className="font-secondary text-[1.8rem] font-semibold text-[var(--text-primary)] mb-0.5">Donald Trump</div>
                <div className="text-[10px] font-mono tracking-[0.06em] text-[var(--text-tertiary)] uppercase">45th & 47th US President — born Queens, New York · Geodetic MC: ♑ Capricorn</div>
              </div>
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--text-tertiary)] text-right hidden md:block">Born 14 Jun 1946<br/>Queens, NY, 73.8°W</div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="border-b lg:border-b-0 lg:border-r border-[var(--surface-border)] bg-[var(--color-charcoal)] flex flex-col">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(248,245,236,0.35)] px-6 pt-5 pb-2">Geodetic Equivalent Lines — Donald Trump</div>
                <TrumpMapSVG className="w-full h-auto block flex-1" />
                <div className="flex flex-wrap gap-4 px-6 pb-5 pt-2 border-t border-[rgba(248,245,236,0.07)]">
                   <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(248,245,236,0.45)]">
                      <span className="w-2 h-2 rounded-full bg-[#FFD700]"></span>Sun equiv — ~82°E
                   </div>
                   <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(248,245,236,0.45)]">
                      <span className="w-2 h-2 rounded-full bg-[rgba(220,220,255,0.9)]"></span>Moon equiv — ~99°W
                   </div>
                   <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(248,245,236,0.45)]">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-spiced-life)]"></span>Mars equiv — ~146°E
                   </div>
                </div>
              </div>
              <div className="p-6 lg:p-10 flex flex-col justify-center">
                <p className="font-secondary text-[1.25rem] italic text-[var(--text-primary)] leading-[1.45] mb-6 pb-6 border-b border-[var(--surface-border)]">
                  "Trump's birth longitude (73.8°W) falls in Capricorn on the geodetic map — and his entire empire of identity has remained anchored to that New York band throughout his life."
                </p>
                <div className="flex flex-col gap-6">
                  {[
                    { sym: "☉", title: "Sun — Geodetic equiv. ~82°E", desc: "His Gemini Sun maps to ~82°E — running through <strong>Egypt, East Africa, and western Russia</strong>. Trump's most fraught and formative foreign entanglements — Russia investigations, Middle East diplomacy (Abraham Accords), Egypt relations — all orbit this longitude band. The Sun in geodetics: identity, visibility, power projection." },
                    { sym: "☽", title: "Moon — Geodetic equiv. ~99°W", desc: "His Sagittarius Moon maps to ~99°W — running through the <strong>American heartland</strong> (Oklahoma, Texas, Kansas). This is precisely Trump's electoral base geography. The Moon in geodetics correlates with emotional resonance, public mood, and the \"feeling\" of a place. His MAGA coalition's geographic centre sits almost exactly here." },
                    { sym: "♂", title: "Mars — Geodetic equiv. ~146°E", desc: "Leo Mars maps to ~146°E — running through <strong>Japan, eastern Australia, and the Pacific</strong>. Trump's trade war with China, confrontational stance toward North Korea, and the pivot of US military posture toward the Indo-Pacific were defining features of his foreign policy. Mars: friction, force, confrontation." }
                  ].map((p, i) => (
                    <div key={i} className="grid grid-cols-[2.5rem_1fr] gap-3">
                      <span className="font-secondary text-[1.4rem] text-[var(--color-y2k-blue)] text-center">{p.sym}</span>
                      <div>
                        <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-primary)] font-bold mb-0.5">{p.title}</div>
                        <p className="text-[0.82rem] font-light text-[var(--text-secondary)] leading-relaxed" dangerouslySetInnerHTML={{ __html: p.desc }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 lg:px-10 py-5 bg-[var(--surface-border)] flex flex-wrap items-center justify-between opacity-80">
               <span className="text-[0.75rem] font-light text-[var(--text-tertiary)] italic">Birth data: 14 June 1946, 10:54am, Jamaica, Queens, NY (RR: AA). Geodetic equivalents per Sepharial's system.</span>
               <Link href="#" className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-y2k-blue)] font-bold">Book your reading →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 bg-[var(--color-charcoal)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[rgba(248,245,236,0.35)] mb-3">Ready to explore yours</div>
            <h2 className="font-secondary text-[clamp(2.5rem,4vw,3.5rem)] font-semibold leading-[0.95] text-[var(--color-eggshell)] mb-5">
              Your chart,<br/>your location,<br/><em className="italic text-[var(--color-spiced-life)] font-light">your geodetic map.</em>
            </h2>
            <p className="text-[0.9rem] font-light text-[rgba(248,245,236,0.45)] leading-[1.8] max-w-[480px]">
              A geodetic reading maps your natal planets onto the globe, identifies the key longitudinal resonances in your chart, and layers in current mundane cycles. It's a grounded, analytical lens on where you are — and where you might want to be.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Link href="#" className="p-8 flex items-center justify-between gap-6 transition-all bg-[var(--color-y2k-blue)] hover:bg-[#0340cc] hover:translate-y-[-4px] rounded-[2rem] group">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(248,245,236,0.6)] mb-1">Most requested</div>
                <div className="font-secondary text-[1.4rem] font-semibold text-[var(--color-eggshell)] leading-[1.1]">ACG Deep Dive<br/><span className="font-normal opacity-80 text-[1.1rem]">includes geodetic overlay</span></div>
              </div>
              <ArrowRight size={24} className="text-[var(--color-eggshell)] opacity-50 group-hover:opacity-100 shrink-0" />
            </Link>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Link href="#" className="p-6 bg-[rgba(248,245,236,0.05)] border border-[rgba(248,245,236,0.1)] hover:bg-[rgba(248,245,236,0.08)] transition-all rounded-[var(--shape-asymmetric-md)] group">
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(248,245,236,0.6)] mb-1">Self-study</div>
                  <div className="font-secondary text-[1.1rem] font-semibold text-[var(--color-eggshell)] leading-tight">Geodetic & Mundane<br/>Intensive Course</div>
               </Link>
               <Link href="#" className="p-6 bg-[rgba(248,245,236,0.05)] border border-[rgba(248,245,236,0.1)] hover:bg-[rgba(248,245,236,0.08)] transition-all rounded-[var(--shape-asymmetric-md)] group">
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(248,245,236,0.6)] mb-1">Free</div>
                  <div className="font-secondary text-[1.1rem] font-semibold text-[var(--color-eggshell)] leading-tight">Research Notes<br/>ongoing cycle analysis</div>
               </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
