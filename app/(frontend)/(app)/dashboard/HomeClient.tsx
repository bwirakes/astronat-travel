"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./home.module.css";
import { ScoreRing, getVerdict } from "@/app/components/ScoreRing";
import { BUCKET_COPY, tierToBucket, type Tier } from "@/app/lib/geodetic-weather-types";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/app/components/ThemeToggle";
import DashboardLayout from "@/app/components/DashboardLayout";
import { LifeGoalsButton, CouplesButton, MyChartButton, WorldChartsButton, TransitsButton, LearnButton, SkyWeatherButton } from "@/app/components/ExploreButtons";
import ReadingCreditPill from "@/app/components/ReadingCreditPill";
import type { ReadingAccess } from "@/lib/access";


export default function HomeClient({ profile, sunSignData, recentSearches, access }: { profile: any; sunSignData: any; recentSearches: any; access?: ReadingAccess }) {
    const router = useRouter();
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        // Hero greeting
        tl.fromTo(
            ".dashboard-hero",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8 }
        );

        // Explore cards stagger
        tl.fromTo(
            ".editorial-btn",
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.05 },
            "-=0.6"
        );

        // Readings list
        tl.fromTo(
            ".dashboard-readings",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8 },
            "-=0.6"
        );

        // Inline action button
        tl.fromTo(
            ".dashboard-fab",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8 },
            "-=0.6"
        );

        // ── Interactive Hover state for Explore cards ──
        const exploreCards = gsap.utils.toArray(".editorial-btn") as HTMLElement[];
        exploreCards.forEach(card => {
            card.addEventListener("mouseenter", () => {
                gsap.to(card, { y: -4, scale: 1.02, duration: 0.3, ease: "power2.out" });
            });
            card.addEventListener("mouseleave", () => {
                gsap.to(card, { y: 0, scale: 1, duration: 0.4, ease: "power2.out" });
            });
        });
    }, { scope: container });

    return (
        <DashboardLayout showBack={false} maxWidth="100%" paddingTop="var(--space-lg)">
            <div className={styles.page} ref={container}>


            <div className={styles.content}>
                {/* Global Hero Greeting */}
                <div className={`${styles.hero} dashboard-hero`} style={{ opacity: 0 }}>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.35rem" }}>
                        <span className={styles.pill}>{sunSignData?.emoji} {sunSignData?.name} Sun</span>
                        {access && (
                            <ReadingCreditPill hasSubscription={access.hasSubscription} freeUsed={access.freeUsed} />
                        )}
                    </div>
                    <h1 className={styles.greeting}>
                        Hello, <em className={styles.greetingName}>
                            {profile.first_name}
                        </em>
                    </h1>
                </div>

                {/* ── 2-Column Grid fills full height ── */}
                <div className={styles.dashboardGrid}>
                    <section className={styles.exploreSection}>
                        <div className={styles.exploreHeader}>
                            <h4 className={styles.sectionKicker}>EXPLORE</h4>
                        </div>
                        <div className={styles.exploreGrid}>
                            <MyChartButton onClick={() => router.push("/chart")} />
                            {/* <LifeGoalsButton onClick={() => router.push("/goals?demo=true")} /> */}
                            <CouplesButton onClick={() => router.push("/couples")} />
                            <WorldChartsButton onClick={() => router.push("/mundane")} />
                            {/* <TransitsButton onClick={() => router.push("/reading/new?type=transits")} /> */}
                            <SkyWeatherButton onClick={() => router.push("/reading/new?type=weather")} />
                            <LearnButton onClick={() => router.push("/learn")} />
                        </div>
                    </section>
                    <section className={styles.readingsSection}>
                        <h4 className={styles.sectionKicker}>YOUR READINGS</h4>
                        <div
                            className={`${styles.readingsList} dashboard-readings`}
                            style={{ opacity: 0 }}
                        >
                            {recentSearches.length > 0 ? (
                                <>
                                {recentSearches.slice(0, 3).map((s: any) => {
                                    const isWeather = s.category === 'geodetic-weather';
                                    const w = s.weatherSummary as { worstTier: Tier; severeCount: number; datesToWatch: string[]; windowDays: number } | undefined;
                                    const bucket = isWeather && w ? tierToBucket(w.worstTier) : null;
                                    const palette = bucket ? BUCKET_COPY[bucket] : null;
                                    return (
                                    <div
                                        key={s.id}
                                        className={styles.readingRow}
                                        style={palette ? {
                                            borderLeft: `3px solid ${palette.accent}`,
                                            paddingLeft: 'calc(var(--space-sm) - 3px)',
                                        } : undefined}
                                    >
                                        <div className={styles.readingLeft}>
                                            {isWeather && palette ? (
                                                <div className={styles.miniRing} style={{
                                                    width: 56, height: 56, borderRadius: '50%',
                                                    background: palette.bg,
                                                    border: `2px solid ${palette.accent}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}>
                                                    <span style={{
                                                        fontFamily: 'var(--font-mono)',
                                                        fontSize: '0.55rem',
                                                        letterSpacing: '0.12em',
                                                        color: palette.accent,
                                                        textTransform: 'uppercase',
                                                        fontWeight: 800,
                                                    }}>
                                                        {palette.short}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className={styles.miniRing}>
                                                    <ScoreRing score={s.score} verdict={getVerdict(s.score)} />
                                                </div>
                                            )}
                                            <div>
                                                <span className={styles.readingDest}>{s.destination}</span>
                                                <span className={styles.readingDate}>
                                                    {isWeather && w ? (
                                                        <>Next {w.windowDays} days · {w.severeCount} rough{w.severeCount === 1 ? ' day' : ' days'}
                                                            {w.datesToWatch.length > 0 && ` · ${w.datesToWatch.slice(0, 2).join(', ')}`}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {new Date(s.travel_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                                            {s.score > 80 ? " • High Energy" : s.score > 60 ? " • Balanced" : " • Challenging"}
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <button className={styles.viewBtn} onClick={(e) => {
                                            e.stopPropagation();
                                            const suffix = isWeather ? '?type=weather' : '';
                                            router.push(`/reading/${s.id}${suffix}`);
                                        }}>View &rsaquo;</button>
                                    </div>
                                    );
                                })}
                                <button className={styles.viewAllBtn} onClick={() => router.push("/readings")}>View all readings &rarr;</button>
                                </>
                            ) : (
                                <div className={styles.emptyState}>
                                    <p>No readings yet</p>
                                </div>
                        )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Floating CTA */}
            <button
                className={`${styles.fab} dashboard-fab`}
                style={{ opacity: 0 }}
                onClick={() => router.push("/reading/new")}
            >
                + New Reading
            </button>
        </div>
        </DashboardLayout>
    );
}
