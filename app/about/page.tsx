"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import StarBackground from "../components/StarBackground";
import Navbar from "../components/Navbar";
import styles from "./about.module.css";

export default function AboutPage() {
    return (
        <div className={styles.pageRoot}>
            <StarBackground />
            <Navbar activeHref="/about" />

            <main>
                {/* Hero Section — Eggshell / High Contrast Editorial */}
                <section className={styles.heroSection}>
                    <div className="container">
                        <motion.div
                            className={styles.heroGrid}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className={styles.heroContent}>
                                <h5 className={styles.kicker}>THE VISION</h5>
                                <h1 className={styles.headline}>
                                    Plan your travels <br />
                                    <span className={styles.headlineAccent}>by the stars</span>
                                </h1>
                                <p className={styles.lead}>
                                    We built this tool to help people make better decisions about when and where to travel, 
                                    using the same locational astrology that Astro Nat has practiced with thousands of clients worldwide.
                                </p>
                                
                                <div className={styles.avatarGroup}>
                                    <div className={styles.avatar}>
                                        <Image 
                                            src="/saturn-o-stars.svg" 
                                            alt="Saturn Logo" 
                                            width={40} 
                                            height={40} 
                                            className={styles.avatarIcon}
                                        />
                                    </div>
                                    <span className={styles.avatarLabel}>EST. 2026</span>
                                </div>
                            </div>

                            <div className={styles.heroImageContainer}>
                                <div className={styles.organicImage}>
                                    <Image
                                        src="/astronat-hero.jpg"
                                        alt="Astro Nat"
                                        fill
                                        className={styles.objectCover}
                                        priority
                                    />
                                </div>
                                {/* Decorative script overlap */}
                                <span className={styles.heroScript}>A</span>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Story Section — Charcoal Block */}
                <section className={styles.storySection}>
                    <div className="container">
                        <motion.div 
                            className={styles.storyGrid}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                        >
                            <div className={styles.storyText}>
                                <h2 className={styles.sectionHeading}>The Warning</h2>
                                <div className={styles.bodyCopy}>
                                    <p>
                                        It began with a warning. In late February, Astro Nat advised her friend — a free-spirited surfer named Brandy — 
                                        not to travel to Dubai. The reason: <em>Mars in Aquarius squaring Uranus in Taurus</em>. 
                                        The kind of transit that makes the unexpected not just possible, but likely.
                                    </p>
                                    <p>
                                        Brandy, being Brandy, ignored her. He flew to Dubai.
                                    </p>
                                    <p>
                                        Days later, Iranian missile strikes shook the region. Brandy spent weeks stranded — 
                                        booking twelve flights before finally making it home. He was fortunate.
                                    </p>
                                </div>
                            </div>
                            
                            <div className={styles.storyGraphic}>
                                <div className={styles.cutImage}>
                                    <Image
                                        src="/girl_sunglasses.png"
                                        alt="Editorial Image"
                                        fill
                                        className={styles.objectCover}
                                    />
                                </div>
                                <span className={styles.sideScript}>S</span>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Values Section — Black Block */}
                <section className={styles.valuesSection}>
                    <div className="container">
                        <div className={styles.valuesContent}>
                            <h2 className={styles.valueTitle}>20% FOR THE PLANET</h2>
                            <p className={styles.valueDescription}>
                                A fifth of all proceeds goes directly to causes we believe in. 
                                This is an independent project built with care, not a corporation. 
                                We hope you find it useful — and we hope you enjoy using it.
                            </p>

                            <div className={styles.ctaGroup}>
                                <Link href="/flow" className="btn btn-primary">
                                    Start planning your trip
                                </Link>
                                <a
                                    href="https://calendly.com/astronat/60min-acg-reading"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                >
                                    Book a 1:1 reading
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className={styles.footer}>
                <div className="container">
                    <div className={styles.footerInner}>
                        <div className={styles.footerLeft}>
                            <span>ASTRO NAT © 2026</span>
                        </div>
                        <div className={styles.footerRight}>
                            <span className={styles.monoLabel}>LOCATIONAL ASTROLOGY • SWISS EPHEMERIS</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
