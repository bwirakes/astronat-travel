"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";
import styles from "./page.module.css";

export default function CelestialEditorialPage() {
    return (
        <>
            {/* Grainy deep-space background layer */}
            <div className={styles.atmosphericBg} aria-hidden="true">
                <div className={styles.radialGlow} />
                <div className={styles.grainOverlay} />
            </div>

            {/* Starfield (CSS-only, no hydration issue) */}
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

            <main className={styles.hero}>
                <div className={styles.container}>
                    <div className={styles.heroGrid}>
                        {/* Left: Content */}
                        <motion.div
                            className={styles.heroContent}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                        >
                            {/* Eyebrow label */}
                            <span className={styles.eyebrow}>Astrocartography · Locational Astrology</span>

                            <h1 className={styles.headline}>
                                Where should you{" "}
                                <em>travel</em> next?
                            </h1>

                            <p className={styles.subline}>
                                You deserve the best possible environment to thrive in and fulfil your natal promise.
                                Use our astrocartography travel planner to figure out where to go — and{" "}
                                <em>when</em>.
                            </p>

                            <Link href="/flow" className={styles.ctaBtn} id="cta-celestial-start">
                                Begin your reading <ArrowRight size={15} />
                            </Link>

                            {/* Trust line */}
                            <div className={styles.trustLine}>
                                <span className={styles.trustDot} />
                                <span>Swiss Ephemeris · Precision Natal Mapping</span>
                            </div>
                        </motion.div>

                        {/* Right: Archway-framed image */}
                        <motion.div
                            className={styles.heroImageWrap}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.1, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        >
                            <div className={styles.archwayFrame}>
                                <div className={styles.archwayInner}>
                                    <Image
                                        src="/astronat-hero.jpg"
                                        alt="Astro Nat on a red Vespa surrounded by cypress trees"
                                        fill
                                        className={styles.heroImg}
                                        priority
                                    />
                                    {/* Bottom gradient fade */}
                                    <div className={styles.imageGradient} />
                                </div>
                            </div>
                            {/* Decorative orbital ring */}
                            <div className={styles.orbitalRing} aria-hidden="true" />
                        </motion.div>
                    </div>
                </div>
            </main>

            {/* Process section */}
            <section className={styles.process}>
                <div className={styles.container}>
                    <h5 className={styles.sectionLabel}>How it works</h5>
                    <div className={styles.steps}>
                        {[
                            {
                                number: "01",
                                title: "Your chart",
                                desc: "Enter your birth details. We calculate your natal chart and project it across the globe using Swiss Ephemeris.",
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
                                <span className={styles.stepNum}>{step.number}</span>
                                <h3 className={styles.stepTitle}>{step.title}</h3>
                                <p className={styles.stepDesc}>{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

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

            <footer className={styles.footer}>
                <div className={styles.container}>
                    <div className={styles.footerInner}>
                        <span>Astro Nat © 2026</span>
                        <span>Swiss Ephemeris · Locational Astrology</span>
                    </div>
                </div>
            </footer>
        </>
    );
}
