"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sun, Moon, Menu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import styles from "./page.module.css";

export default function ModernMinimalistPage() {
    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("theme-v2") as "dark" | "light" | null;
        if (saved) setTheme(saved);
    }, []);

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        localStorage.setItem("theme-v2", next);
    };

    return (
        <div className={`${styles.root} ${theme === "light" ? styles.light : ""}`}>
            {/* ── Nav ─────────────────────────────────────────────── */}
            <nav className={styles.nav}>
                <div className={styles.navInner}>
                    {/* Logo */}
                    <Link href="/" className={styles.logo}>
                        Astro Nat
                    </Link>

                    {/* Desktop links — centered / breathable space */}
                    <div className={styles.navLinks}>
                        <Link href="/about">About</Link>
                        <a href="https://calendly.com/astronat/60min-acg-reading" target="_blank" rel="noopener noreferrer">
                            Book a reading
                        </a>
                    </div>

                    {/* Unified control center: theme toggle + hamburger grouped */}
                    <div className={styles.controlCenter}>
                        <button
                            className={styles.iconBtn}
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            id="v2-theme-toggle"
                        >
                            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                        </button>
                        <button
                            className={styles.iconBtn}
                            onClick={() => setMenuOpen((v) => !v)}
                            aria-label="Open menu"
                            id="v2-menu-toggle"
                        >
                            <Menu size={15} />
                        </button>
                    </div>
                </div>

                {/* Mobile drawer */}
                {menuOpen && (
                    <div className={styles.drawer}>
                        <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
                        <a href="https://calendly.com/astronat/60min-acg-reading" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>
                            Book a reading
                        </a>
                    </div>
                )}
            </nav>

            {/* ── Hero ─────────────────────────────────────────────── */}
            <main className={styles.hero}>
                <div className={styles.container}>
                    <div className={styles.heroGrid}>
                        {/* Left: Content with strict typographic hierarchy */}
                        <motion.div
                            className={styles.heroContent}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
                        >
                            {/* 1st: Headline */}
                            <h1 className={styles.headline}>
                                Where should<br />
                                you travel<br />
                                next?
                            </h1>

                            {/* 2nd: CTA — high-contrast pill */}
                            <Link href="/flow" className={styles.ctaBtn} id="cta-minimalist-start">
                                Start planning <ArrowRight size={14} />
                            </Link>

                            {/* 3rd: Body (softer, intentionally below CTA) */}
                            <p className={styles.subline}>
                                You deserve the best possible environment to thrive in and fulfil your natal promise.
                                Use our astrocartography travel planner to figure out where to go — and when.
                            </p>
                        </motion.div>

                        {/* Right: Moody landscape with constellation overlay */}
                        <motion.div
                            className={styles.heroImageWrap}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1.2, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
                        >
                            <Image
                                src="/moody-landscape.jpg"
                                alt="Misty mountains at dusk with constellation lines overhead"
                                fill
                                className={styles.heroImg}
                                priority
                            />
                        </motion.div>
                    </div>
                </div>
            </main>

            {/* ── Process ──────────────────────────────────────────── */}
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
                                initial={{ opacity: 0, y: 14 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
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
        </div>
    );
}
