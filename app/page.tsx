"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "./components/Navbar";
import styles from "./page.module.css";

// ─── Astro Nat — Unified Landing Page ────────────────────────────────────────
// Canonical: anchored on astro_brand_guidelines.md + globals.css + SKILL.md
// Rules:
//   - All colors via CSS vars (var(--*)). Zero hardcoded hex values.
//   - Fonts: --font-primary (BETTER DAYS) for hero, --font-secondary (PERFECTLY
//     NINETIES) for editorial, --font-display-alt-2 (SLOOP SCRIPT) for overlaps.
//   - CTA: Y2K Blue (--color-y2k-blue) with asymmetric M3 cut shape (--cut-xl).
//   - Image: M3 cut-path frame (--cut-xl) — per SKILL §3 Option B.
//   - Process section: stark Eggshell / Charcoal color block inversion.

export default function Home() {
  return (
    <>
      {/* ── Atmospheric Background ─────────────────────────────────── */}
      <div className={styles.atmosphericBg} aria-hidden="true">
        <div className={styles.grainOverlay} />
      </div>

      {/* ── Starfield — blocky Y2K pixel stars ───────────────────── */}
      <div className={styles.starField} aria-hidden="true">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className={styles.star}
            style={{
              left: `${(i * 17.3 + 11) % 100}%`,
              top: `${(i * 13.7 + 7) % 100}%`,
              width: `${(i % 3) * 0.6 + 0.4}px`,
              height: `${(i % 3) * 0.6 + 0.4}px`,
              animationDelay: `${(i * 0.37) % 7}s`,
              animationDuration: `${4 + (i % 5)}s`,
              opacity: 0.15 + (i % 4) * 0.08,
            }}
          />
        ))}
      </div>

      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <main className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>

            {/* Left: Content — typographic hierarchy from brand guidelines */}
            <motion.div
              className={styles.heroContent}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* H1 — BETTER DAYS (--font-primary), uppercase structural text */}
              <h1 className={styles.headline}>
                Where should you{" "}
                <em>travel</em> next?
              </h1>

              {/* Body — GARET (--font-body) */}
              <p className={styles.subline}>
                You deserve the best possible environment to thrive in and fulfil your natal promise.
                Use our astrocartography travel planner to figure out where to go — and{" "}
                <em>when</em>.
              </p>

              {/* CTA — Y2K Blue + M3 asymmetric shape per SKILL §3 Option A */}
              <Link href="/flow" className={styles.ctaBtn} id="cta-start">
                Begin your Travels <ArrowRight className={styles.ctaIcon} />
              </Link>


            </motion.div>

            {/* Right: M3 cut-path image frame per brand SKILL §3 Option B */}
            <motion.div
              className={styles.heroImageWrap}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >


              <div className={styles.astroCutout}>
                <Image
                  src="/astronat-hero.jpg"
                  alt="Astro Nat on a red Vespa surrounded by cypress trees"
                  fill
                  className={styles.heroImg}
                  priority
                />
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      {/* ── Process — stark Eggshell/Charcoal color block inversion ── */}
      <section className={styles.process}>
        <div className={styles.container}>
          <h5 className={styles.sectionLabel}>How it works</h5>
          <div className={styles.steps}>
            {[
              {
                number: "01",
                title: "Your chart",
                desc: "Enter your birth details. We calculate your natal chart and project it across the globe using high-precision data.",
              },
              {
                number: "02",
                title: "Your destination",
                desc: "Choose where you're going. We'll show which planetary lines are active and what they mean for that city.",
              },
              {
                number: "03",
                title: "Your timing",
                desc: "See the next 12 months of transits mapped to your houses. Travel when the planets support it — not against them.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                className={styles.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                {/* Step number — BETTER DAYS ghost text */}
                <span className={styles.stepNum}>{step.number}</span>
                {/* Step title — PERFECTLY NINETIES serif */}
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pull Quote ────────────────────────────────────────────── */}
      <section className={styles.quote}>
        <div className={styles.container}>
          <blockquote className={styles.blockquote}>
            <p>
              &ldquo;Astrocartography isn&rsquo;t about luck. It&rsquo;s about understanding which locations
              activate your chart — and planning around that.&rdquo;
            </p>
            <cite className={styles.cite}>— Astro Nat</cite>
          </blockquote>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerInner}>
            <span>Astro Nat © 2026</span>
            <span>Precision Natal Mapping · Locational Astrology</span>
          </div>
        </div>
      </footer>
    </>
  );
}
