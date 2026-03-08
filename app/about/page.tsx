"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import StarBackground from "../components/StarBackground";
import Navbar from "../components/Navbar";
import styles from "./about.module.css";

export default function AboutPage() {
    return (
        <>
            <StarBackground />

            <Navbar activeHref="/about" />

            <main>
                <div className="container">
                    {/* Hero */}
                    <motion.div
                        className={styles.hero}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className={styles.heroText}>
                            <h5>About this project</h5>
                            <h1 className={styles.headline}>Plan your travels<br />by the stars</h1>
                            <p className={styles.intro}>
                                We built this tool to help people make better decisions about when and where to travel,
                                using the same locational astrology that Astro Nat has practised with thousands of clients worldwide.
                            </p>
                        </div>
                        <div className={styles.heroImage}>
                            <Image
                                src="/astronat-hero.jpg"
                                alt="Astro Nat on a red Vespa"
                                fill
                                className={styles.heroImg}
                                priority
                            />
                        </div>
                    </motion.div>

                    {/* Story */}
                    <motion.section
                        className={styles.story}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <div className={styles.storyContent}>
                            <h2 className={styles.storyHeading}>How this started</h2>
                            <div className={styles.storyBody}>
                                <p>
                                    It began with a warning. In late February, Astro Nat advised her friend — a free-spirited surfer named Brandy —
                                    not to travel to Dubai. The reason: <em>Mars in Aquarius squaring Uranus in Taurus</em>.
                                    The kind of transit that makes the unexpected not just possible, but likely.
                                </p>
                                <p>
                                    Brandy, being Brandy, ignored her. He flew to Dubai.
                                </p>
                                <p>
                                    Days later, Iranian missile strikes shook the region. Brandy spent weeks stranded — booking twelve flights
                                    before finally making it home. He was fortunate to get out. Not everyone was.
                                </p>
                                <p>
                                    Meanwhile, the hundreds of thousands of people who had followed Astro Nat's calendar and readings stayed safe,
                                    redirected their plans, and avoided the disruption entirely. Not because of luck. Because of timing.
                                </p>
                                <p>
                                    That's when we knew this needed to exist in a form that anyone could access quickly —
                                    without needing to book a reading, without waiting, without having to know the terminology.
                                    Astro Nat can't personally speak to everyone. So we took her years of research and built a tool that comes close.
                                </p>
                                <p>
                                    This is a guide for smarter travel. Know your map. Know your timing. Plan accordingly.
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Values */}
                    <motion.section
                        className={styles.values}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className={styles.valueCard}>
                            <h3 className={styles.valueHeading}>20% for causes we care about</h3>
                            <p>
                                A fifth of all proceeds goes directly to causes we believe in.
                                This is an independent project built with care, not a company.
                                We hope you find it useful — and we hope you enjoy using it.
                            </p>
                        </div>
                    </motion.section>

                    {/* CTA */}
                    <div className={styles.cta}>
                        <Link href="/flow" className={styles.ctaBtn}>
                            Start planning your next trip
                        </Link>
                        <a
                            href="https://calendly.com/astronat/60min-acg-reading"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.ctaBtnSecondary}
                        >
                            Book a 1:1 reading with Astro Nat
                        </a>
                    </div>
                </div>
            </main>

            <footer className={styles.footer}>
                <div className="container">
                    <div className={styles.footerInner}>
                        <span>Astro Nat © 2026</span>
                        <span>Swiss Ephemeris · Locational Astrology</span>
                    </div>
                </div>
            </footer>
        </>
    );
}
