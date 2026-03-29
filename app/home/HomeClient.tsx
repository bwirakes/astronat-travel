"use client";

import { motion } from "framer-motion";
import { Heart, Users, Star, Cake, User, Globe } from "lucide-react";
import Image from "next/image";
import styles from "./home.module.css";
import { ScoreRing, getVerdict } from "../components/ScoreRing";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";

export default function HomeClient({ profile, sunSignData, recentSearches }: any) {
    const router = useRouter();

    const features = [
        { title: "Life Goals", icon: <Heart size={18} />, description: "What are you seeking?", url: "/goals?demo=true", accent: "var(--color-spiced-life)" },
        { title: "Couples", icon: <Users size={18} />, description: "Read for two", url: "/couples?demo=true", accent: "var(--gold)" },
        { title: "My Chart", icon: <Star size={18} />, description: "Your natal chart", url: "/chart?demo=true", accent: "var(--color-y2k-blue)" },
        { title: "World Charts", icon: <Globe size={18} />, description: "Natal charts of nations", url: "/mundane?demo=true", accent: "var(--color-acqua)" },
    ];

    return (
        <div className={styles.page}>
            {/* Header — matches onboarding pattern */}
            <header className={styles.header}>
                <Image src="/logo-stacked.svg" alt="ASTRONAT" width={110} height={36} priority
                    className="onboarding-logo" />
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <button onClick={() => router.push("/profile?demo=true")} style={{
                        background: "var(--surface)", border: "1px solid var(--surface-border)",
                        width: "36px", height: "36px", borderRadius: "18px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", color: "var(--text-secondary)", transition: "all 0.2s ease"
                    }}>
                        <User size={16} />
                    </button>
                    <ThemeToggle />
                </div>
            </header>

            <div className={styles.content}>
                {/* ── Left / Top column ── */}
                <div className={styles.primary}>
                    {/* Compact Hero */}
                    <motion.div className={styles.hero} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <span className={styles.pill}>{sunSignData?.emoji} {sunSignData?.name} Sun</span>
                        <h1 className={styles.greeting}>
                            Hello, <em className={styles.greetingName}>{profile.first_name}</em>
                        </h1>
                    </motion.div>

                    {/* Birthday Optimizer — slim banner */}
                    <motion.div
                        className={styles.banner}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        onClick={() => router.push("/birthday?demo=true")}
                    >
                        <div className={styles.bannerText}>
                            <span className={styles.bannerTag}>BIRTHDAY OPTIMIZER</span>
                            <span className={styles.bannerTitle}>Where should you be on your birthday?</span>
                            <span className={styles.bannerSub}>Find your most cosmically aligned destination for your next solar return.</span>
                        </div>
                        <div className={styles.bannerRight}>
                            <span className={styles.bannerEmoji}><Cake size={40} strokeWidth={1} /></span>
                            <button className={styles.bannerBtn}>Find out &rarr;</button>
                        </div>
                    </motion.div>

                    {/* Explore — tight grid */}
                    <section className={styles.exploreSection}>
                        <h4 className={styles.sectionKicker}>EXPLORE</h4>
                        <div className={styles.exploreGrid}>
                            {features.map((f, i) => (
                                <motion.div
                                    key={i}
                                    className={styles.exploreCard}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + i * 0.08 }}
                                    onClick={() => router.push(f.url)}
                                >
                                    <div className={styles.exploreIcon} style={{ background: f.accent, color: '#fff' }}>{f.icon}</div>
                                    <span className={styles.exploreName}>{f.title}</span>
                                    <span className={styles.exploreDesc}>{f.description}</span>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* ── Right / Bottom column ── */}
                <div className={styles.secondary}>
                    <section>
                        <h4 className={styles.sectionKicker}>YOUR READINGS</h4>
                        <motion.div
                            className={styles.readingsList}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            {recentSearches.length > 0 ? (
                                recentSearches.map((s: any) => (
                                    <div key={s.id} className={styles.readingRow}>
                                        <div className={styles.readingLeft}>
                                            <div className={styles.miniRing}>
                                                <ScoreRing score={s.score} verdict={getVerdict(s.score)} />
                                            </div>
                                            <div>
                                                <span className={styles.readingDest}>{s.destination}</span>
                                                <span className={styles.readingDate}>
                                                    {new Date(s.travel_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                                </span>
                                            </div>
                                        </div>
                                        <button className={styles.viewBtn} onClick={(e) => { e.stopPropagation(); router.push(`/reading/${s.id}?demo=true`); }}>View &rsaquo;</button>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.emptyState}>
                                    <p>No readings yet</p>
                                    <button className="btn btn-primary" onClick={() => router.push("/flow")}>Start a reading</button>
                                </div>
                            )}
                        </motion.div>
                    </section>
                </div>
            </div>

            {/* Floating CTA */}
            <motion.button
                className={styles.fab}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.5 }}
                onClick={() => router.push("/flow")}
            >
                + New Reading
            </motion.button>

            {/* Reuse onboarding logo filter styles */}
            <style jsx global>{`
                .onboarding-logo {
                    filter: invert(1) brightness(1.2);
                    display: block;
                }
                [data-theme="light"] .onboarding-logo {
                    filter: none;
                }
            `}</style>
        </div>
    );
}
