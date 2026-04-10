"use client";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Image from "next/image";
import Link from "next/link";

// ─── AstroNat — Final Homepage Design (V2 Parity) ─────────────────────────
// This version strictly follows the astronat-website-v2.html mockup.
// Horizontal alignment, vertical spacing, and exact copy are synchronised.

const TICKER = [
  "Astrocartography",
  "Geodetic Forecasting",
  "Travel Electional",
  "Relocation Strategy",
  "Natal Chart",
  "B2B Corporate Intel",
];

const TESTIMONIALS = [
  {
    quote: "“The level of technical detail was unlike anything I'd experienced. Nat doesn't just tell you where to go — she explains the celestial mechanics behind it.”",
    name: "Rebecca T.",
    location: "London, UK",
  },
  {
    quote: "“My relocation solar return reading was spot-on. Within the year, every theme she highlighted played out — in exactly the city she pointed to.”",
    name: "Marcos D",
    location: "São Paulo, Brazil",
  },
  {
    quote: "“The Travel Astrology Intensive changed how I plan every trip. I'm now obsessed with eclipse paths and I have absolutely zero regrets.”",
    name: "Priya K",
    location: "Dubai, UAE",
  },
];

export default function Home() {
  return (
    <div className="bg-[var(--bg)] text-[var(--text-primary)] min-h-screen font-body transition-colors duration-300">
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <Navbar hideAuth={false} />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      {/* pt-32 on mobile adds space for the fixed navbar while keeping editorial gap */}
      <section className="pt-32 pb-14 md:pt-40 md:pb-24 relative overflow-hidden">
        {/* Background grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(var(--text-primary)_1px,transparent_1px),linear-gradient(90deg,var(--text-primary)_1px,transparent_1px)]"
          style={{ backgroundSize: "60px 60px" }}
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_420px] items-center gap-12 md:gap-14">
          {/* Left Column */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-12 h-px bg-[var(--color-y2k-blue)]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-y2k-blue)]">
                Astrocartography &amp; Travel Astrology · Singapore
              </span>
            </div>

            <h1 className="font-secondary leading-[0.88] tracking-tight text-[var(--text-primary)] mb-6"
                style={{ fontSize: "clamp(2.8rem, 7vw, 6.5rem)" }}>
              <span className="block mb-1 text-[var(--color-spiced-life)]" 
                    style={{ fontFamily: "var(--font-display-alt-2)", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 400 }}>
                Your chart
              </span>
              Where In <em className="italic font-medium text-[var(--color-y2k-blue)]">The World</em>
              <br />
              Is Your Map
              <br />
              Calling You?
            </h1>

            <p className="text-[0.85rem] font-light text-[var(--text-secondary)] leading-[1.65] max-w-sm mb-8 opacity-80">
              Astrocartography, geodetic forecasting &amp; travel electional astrology — read by a practitioner who takes both the stars and the evidence seriously.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <Link
                href="/flow"
                className="bg-[var(--color-y2k-blue)] text-[var(--color-eggshell)] px-8 py-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-all hover:bg-[var(--color-charcoal)]"
                style={{ borderRadius: "var(--radius-none)" }}
              >
                Read My Map →
              </Link>
              <Link
                href="#services"
                className="border border-[var(--surface-border)] px-8 py-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-all hover:bg-[var(--color-charcoal)] hover:text-[var(--color-eggshell)]"
                style={{ borderRadius: "var(--radius-none)" }}
              >
                View Services
              </Link>
            </div>
          </div>

          {/* Right Column (Hero Photo) */}
          <div className="relative">
            <div className="relative w-full aspect-[4/5] md:w-[420px] md:h-[620px] overflow-hidden">
              <Image
                src="/astronat-hero.jpg"
                alt="Natalia — AstroNat Founder"
                fill
                priority
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
            </div>

            {/* Badge overlay */}
            <div className="absolute bottom-8 -left-8 bg-[var(--color-y2k-blue)] px-6 py-5 shadow-xl">
              <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[rgba(248,245,236,0.6)] mb-1">
                Currently Exploring
              </div>
              <div className="font-secondary text-lg font-semibold text-[var(--color-eggshell)] leading-tight">
                Europe &amp; the Mediterranean
              </div>
            </div>

            {/* Saturn float */}
            <div className="absolute -top-4 -right-4 w-20 h-20 opacity-90 animate-pulse">
              <Image src="/avatar/saturn-o.svg" alt="" width={80} height={80} />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="max-w-7xl mx-auto px-6 pt-5 mt-16 border-t border-[var(--surface-border)] relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { n: "500+", l: "Charts Read" },
              { n: "12+", l: "Years Practising" },
              { n: "40+", l: "Countries Mapped" },
              { n: "CIA", l: "Affiliated Faculty" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col">
                <span className="font-secondary text-3xl font-semibold text-[var(--text-primary)] leading-none">
                  {s.n}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mt-2">
                  {s.l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ticker ─────────────────────────────────────────────────── */}
      <div className="bg-[var(--color-y2k-blue)] py-3 overflow-hidden whitespace-nowrap">
        <div className="inline-flex" style={{ animation: "ticker-scroll 28s linear infinite" }}>
          {[...TICKER, ...TICKER].map((item, i) => (
            <span
              key={i}
              className="font-mono text-[11px] uppercase tracking-[0.22em] px-10"
              style={{ color: "var(--color-eggshell)" }}
            >
              {item}
              {i % TICKER.length < TICKER.length - 1 && (
                <span className="px-4" style={{ color: "var(--color-acqua)" }}>★</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* ── Intro / Mission Statement ───────────────────────────────── */}
      <section className="py-20 md:py-28 border-b border-[var(--surface-border)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[1fr_2.5fr] gap-12 md:gap-20 items-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
            About the Practice
          </div>
          <p className="font-secondary text-2xl md:text-4xl leading-tight text-[var(--text-primary)]">
            AstroNat is an editorial travel astrology practice for those who seek more than just a destination. It is for the{" "}
            <em className="italic font-semibold text-[var(--color-y2k-blue)]">traveller, the expat, and the CEO</em>{" "}
            who recognises that where we are is as important as when we are.
          </p>
        </div>
      </section>

      {/* ── Services ───────────────────────────────────────────────── */}
      <section id="services" className="py-20 md:py-28 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex justify-between items-baseline border-b border-[var(--surface-border)] pb-5 mb-10">
            <h2 className="font-secondary text-3xl md:text-5xl font-semibold text-[var(--text-primary)] leading-none">
              Readings &amp; Services
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              04 offerings
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                num: "01 —",
                name: "Personal Relocation Reading",
                desc: "A comprehensive 90-minute reading of your ACG map, local space lines, geodetic chart, and current transit overlays. Know exactly where to go — and why.",
                link: "https://calendly.com/astronat/60min-acg-reading",
                linkLabel: "Book a Session →",
                bg: "var(--color-charcoal)",
                light: false,
                glyph: "♈",
              },
              {
                num: "02 —",
                name: "Annual Travel Electional",
                desc: "The right day to depart, arrive, or sign contracts abroad changes everything. Precision timing meets cosmic timing — your travels, optimised by the chart.",
                link: "/map-from-home",
                linkLabel: "Learn More →",
                bg: "var(--bg)",
                light: true,
                glyph: "♎",
              },
              {
                num: "03 —",
                name: "B2B & VIP Intelligence",
                desc: "Strategic relocated intelligence for corporate expansion, global hiring, and high-frequency travel calendars. Data-driven celestial mapping for leaders.",
                link: "/b2b",
                linkLabel: "Explore →",
                bg: "var(--color-y2k-blue)",
                light: false,
                glyph: "☉",
              },
              {
                num: "04 —",
                name: "AstroNat Planner App",
                desc: "High-precision ACG maps and travel planning software in your pocket. Calculate lines, timing, and score destinations on the go with our proprietary engine.",
                link: "/app",
                linkLabel: "Get the App →",
                bg: "var(--color-black)",
                light: false,
                glyph: "♅",
              },
            ].map((svc) => (
              <div
                key={svc.num}
                className={`relative p-10 overflow-hidden flex flex-col justify-between min-h-[420px] border border-[var(--surface-border)] rounded-[2rem]`}
                style={{ background: svc.bg }}
              >
                <div>
                  <div
                    className="font-mono text-[10px] uppercase tracking-[0.18em] mb-6"
                    style={{ color: svc.light ? "var(--text-tertiary)" : "rgba(248,245,236,0.3)" }}
                  >
                    {svc.num}
                  </div>
                  <h3
                    className="font-secondary text-2xl md:text-3xl font-semibold leading-tight mb-4"
                    style={{ color: svc.light ? "var(--text-primary)" : "var(--color-eggshell)" }}
                  >
                    {svc.name}
                  </h3>
                  <p
                    className="text-[0.85rem] font-light leading-[1.75] mb-6"
                    style={{ color: svc.light ? "var(--text-secondary)" : "rgba(248,245,236,0.55)" }}
                  >
                    {svc.desc}
                  </p>
                </div>

                <Link
                  href={svc.link}
                  className="font-mono text-[11px] font-medium uppercase tracking-[0.15em]"
                  style={{ color: svc.light ? "var(--color-y2k-blue)" : "var(--color-acqua)" }}
                >
                  {svc.linkLabel}
                </Link>

                {/* Decorative glyph */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-6 right-8 font-secondary pointer-events-none select-none opacity-20"
                  style={{
                    fontSize: "6rem",
                    lineHeight: 1,
                    color: svc.light ? "var(--surface-border)" : "rgba(248,245,236,0.05)",
                  }}
                >
                  {svc.glyph}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-spiced-life)] border-y border-[var(--surface-border)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_420px] lg:items-stretch">
          {/* Text */}
          <div className="py-20 lg:pr-16">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[rgba(27,27,27,0.45)] mb-3">
              Featured Workshop · May 2026
            </div>
            <h2 className="font-secondary font-semibold leading-[0.9] mb-8 text-[var(--color-eggshell)]"
              style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}>
              <span className="block mb-2" style={{ fontFamily: "var(--font-display-alt-2)", fontSize: "clamp(2rem, 3vw, 3rem)", color: "var(--color-charcoal)", fontWeight: 400 }}>
                The Course
              </span>
              AstroNat <em className="italic font-light">Travel Astrology</em> Intensive
            </h2>

            <p className="text-[0.95rem] font-light leading-[1.75] text-[var(--color-charcoal)] opacity-80 max-w-md mb-10">
              A 4-part deep dive into astrocartography, local space charts, geodetic frameworks, and how 2026&apos;s outer planet shifts shape your ideal destinations.
            </p>

            <div className="flex flex-wrap gap-8 mb-10">
              {[
                { label: "Format", value: "4 Live Sessions" },
                { label: "Includes", value: "Workbook + Replay" },
                { label: "Launch", value: "19–20 May 2026" },
              ].map((d) => (
                <div key={d.label} className="flex flex-col gap-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[rgba(27,27,27,0.4)]">
                    {d.label}
                  </span>
                  <span className="font-secondary text-lg font-semibold text-[var(--color-charcoal)]">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/map-from-home"
              className="inline-block font-mono text-[11px] uppercase tracking-[0.12em] px-10 py-5 bg-[var(--color-charcoal)] text-[var(--color-eggshell)] transition-all hover:bg-[var(--color-black)]"
            >
              Waitlist Now →
            </Link>
          </div>

          {/* Image + badge */}
          <div className="relative overflow-hidden min-h-[500px] lg:min-h-0 rounded-[2rem]">
            <Image
              src="/workshop-promo-1.jpg"
              alt="AstroNat Travel Astrology Intensive"
              fill
              style={{ objectFit: "cover", objectPosition: "center 20%" }}
            />
            {/* Price badge */}
            <div className="absolute bottom-8 right-8 w-28 h-28 rounded-full bg-[var(--color-charcoal)] flex flex-col items-center justify-center text-center gap-0.5 shadow-2xl">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-acqua)] leading-tight">
                Enrol
                <br />
                Now
              </span>
              <span className="font-secondary text-xl font-bold text-[var(--color-eggshell)] leading-tight">
                SGD
                <br />
                $297
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── About / Methodology ─────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-b border-[var(--surface-border)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-12 md:gap-20 items-start">
          {/* Image */}
          <div className="relative">
            <div className="relative w-full aspect-[3/4] overflow-hidden rounded-[2rem]">
              <Image
                src="/nat-2.jpg"
                alt="Nat H — Astrocartographer"
                fill
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
            </div>
            <div className="absolute bottom-[-1.5rem] right-[-1.5rem] w-20 h-20 bg-[var(--bg)] border border-[var(--surface-border)] flex items-center justify-center p-3 hidden md:flex">
              <Image src="/avatar/saturn-monogram.svg" alt="AstroNat monogram" width={56} height={56} />
            </div>
          </div>

          {/* Text */}
          <div className="pt-0 md:pt-4">
            <h2 className="font-secondary font-semibold leading-[1.1] text-[var(--text-primary)] mb-8"
              style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)" }}>
              A Multi-Layer{" "}
              <em className="italic text-[var(--color-y2k-blue)]">Methodology</em>{" "}
              That Goes Deeper
            </h2>

            <p className="text-[0.95rem] font-light text-[var(--text-secondary)] leading-[1.8] mb-10 max-w-2xl">
              Every reading integrates multiple techniques — traditional, modern, and heliocentric — so you receive a complete picture, not just one line on a map. I read charts the way I navigate: with precision, with evidence, and with genuine curiosity about where the sky wants you to be.
            </p>

            <ul className="mb-10">
              {[
                { glyph: "☽", title: "ACG + Local Space Lines", desc: "Primary map and angular overlay analysis" },
                { glyph: "♄", title: "Geodetic Equivalents", desc: "Fixed earth-sign correspondence per location" },
                { glyph: "☉", title: "Solar Return Relocation", desc: "Annual chart cast for your destination city" },
                { glyph: "★", title: "Eclipse & Ingress Timing", desc: "Detonators overlaid on your personal map" },
                { glyph: "⊙", title: "Fixed Stars", desc: "Scheat, Antares, Regulus in geographic context" },
              ].map((item, idx) => (
                <li
                  key={item.title}
                  className="grid items-center py-5 border-t border-[var(--surface-border)]"
                  style={{ gridTemplateColumns: "3rem 1fr", gap: "1.5rem", ...(idx === 4 ? { borderBottom: "1px solid var(--surface-border)" } : {}) }}
                >
                  <span className="font-secondary text-3xl text-[var(--color-y2k-blue)] text-center leading-none">
                    {item.glyph}
                  </span>
                  <div className="text-[0.9rem] text-[var(--text-primary)] leading-snug">
                    <strong className="font-semibold">{item.title}</strong>
                    {" — "}
                    <span className="text-[var(--text-secondary)]">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/flow"
              className="px-8 py-4 bg-[var(--color-y2k-blue)] text-[var(--color-eggshell)] font-mono text-[10px] uppercase tracking-widest inline-block transition-all hover:bg-[var(--color-charcoal)]"
            >
              Learn About the Method →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────── */}
      <section className="py-24 bg-[var(--color-charcoal)]">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex justify-between items-baseline border-b border-[rgba(248,245,236,0.1)] pb-6 mb-16">
            <h2 className="font-secondary text-3xl md:text-5xl font-semibold text-[var(--color-eggshell)] leading-none">
              Client Stories
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(248,245,236,0.25)]">
              03 voices
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="border-t border-[rgba(248,245,236,0.12)] pt-8">
                <p className="font-secondary text-xl italic text-[var(--color-eggshell)] leading-snug mb-8 opacity-90">
                  {t.quote}
                </p>
                <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-acqua)] mb-1">
                  {t.name}
                </div>
                <div className="font-mono text-[10px] text-[rgba(248,245,236,0.3)]">
                  {t.location}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-16 opacity-30">
            <Image src="/avatar/saturn-o.svg" alt="" width={60} height={60} />
          </div>
        </div>
      </section>

      {/* ── Newsletter ─────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-b border-[var(--surface-border)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <span
              className="block mb-2 text-[var(--color-y2k-blue)]"
              style={{ fontFamily: "var(--font-display-alt-2)", fontSize: "clamp(1.8rem, 3vw, 3rem)", lineHeight: 0.95 }}
            >
              Stay Cosmic
            </span>
            <h2 className="font-secondary text-4xl md:text-5xl font-semibold leading-tight text-[var(--text-primary)]">
              The AstroNat
              <br />
              Dispatch
            </h2>
          </div>

          <div>
            <p className="text-[0.95rem] font-light text-[var(--text-secondary)] leading-[1.75] mb-8 max-w-sm">
              Monthly mundane forecasts, travel astrology tips, and early access to new workshops. No spam — just clear signal from the sky.
            </p>

            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-0">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 min-w-0 text-[0.9rem] px-6 py-5 border border-[var(--surface-border)] sm:border-r-0 bg-transparent text-[var(--text-primary)] outline-none font-body placeholder:text-[var(--text-tertiary)]"
              />
              <button
                type="submit"
                className="font-mono text-[11px] uppercase tracking-[0.12em] px-8 py-5 bg-[var(--color-charcoal)] text-[var(--color-eggshell)] border border-[var(--color-charcoal)] transition-all hover:bg-[var(--color-black)] cursor-pointer"
              >
                Subscribe
              </button>
            </form>
            <p className="font-mono text-[10px] text-[var(--text-tertiary)] mt-3 tracking-[0.06em]">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <Footer />

      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
