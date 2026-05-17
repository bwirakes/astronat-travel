"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";
import styles from "./home.module.css";
import { ScoreRing, getVerdict } from "@/app/components/ScoreRing";
import { BUCKET_COPY, tierToBucket, type Tier } from "@/app/lib/geodetic-weather-types";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/page-header-context";
import { CouplesButton, MyChartButton, WorldChartsButton, LearnButton, SkyWeatherButton } from "@/app/components/ExploreButtons";
import ReadingCreditPill from "@/app/components/ReadingCreditPill";
import type { ReadingAccess } from "@/lib/access";

type HomeProfile = {
    first_name: string | null;
};

type SunSignData = {
    emoji?: string;
    name?: string;
};

type WeatherSummary = {
    worstTier: Tier | string;
    severeCount: number;
    datesToWatch: string[];
    windowDays: number;
};

type RecentSearch = {
    id: string | number;
    destination: string;
    score: number;
    travel_date: string;
    category?: string | null;
    weatherSummary?: WeatherSummary;
};

export default function HomeClient({ profile, sunSignData, recentSearches, access }: { profile: HomeProfile; sunSignData: SunSignData | null; recentSearches: RecentSearch[]; access?: ReadingAccess }) {
    const router = useRouter();
    const container = useRef<HTMLDivElement>(null);
    const hasReadings = recentSearches.length > 0;
    const activationCard = (
        <div className={styles.activationCard}>
            <svg className={styles.activationWave} viewBox="0 0 800 120" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 84C166 42 344 23 528 34C646 41 738 61 800 83V120H0V84Z" />
            </svg>
            <svg className={styles.activationBigStar} viewBox="0 0 64 64" aria-hidden="true">
                <path d="M32 0L38 25L64 32L38 39L32 64L26 39L0 32L26 25L32 0Z" />
            </svg>
            <div className={styles.activationScore} aria-hidden="true">
                <span>01</span>
                <small>/ free</small>
            </div>
            <div className={styles.activationPlanet} aria-hidden="true">
                <svg viewBox="0 0 140 92">
                    <path d="M13 58C35 74 91 73 124 41" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
                    <circle cx="73" cy="45" r="30" fill="var(--color-spiced-life)" stroke="var(--color-charcoal)" strokeWidth="3" />
                    <path d="M49 45C65 47 83 41 101 29" fill="none" stroke="var(--gold)" strokeWidth="6" strokeLinecap="round" opacity="0.35" />
                    <path d="M54 61C68 54 86 54 104 61" fill="none" stroke="var(--color-charcoal)" strokeWidth="4" strokeLinecap="round" opacity="0.28" />
                    <path d="M11 59C39 48 88 45 129 39" fill="none" stroke="var(--gold)" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="112" cy="32" r="18" fill="var(--color-eggshell)" stroke="var(--color-charcoal)" strokeWidth="3" />
                </svg>
            </div>
            <div className={styles.activationContent}>
                <div className={styles.activationHeader}>
                    <svg className={styles.activationStars} viewBox="0 0 80 20" fill="currentColor" aria-hidden="true">
                        <path d="M10 0L12 8L20 10L12 12L10 20L8 12L0 10L8 8L10 0Z" />
                        <path d="M40 0L42 8L50 10L42 12L40 20L38 12L30 10L38 8L40 0Z" />
                        <path d="M70 0L72 8L80 10L72 12L70 20L68 12L60 10L68 8L70 0Z" />
                    </svg>
                    <div className={styles.activationMeta}>
                        Start here
                    </div>
                </div>
                <h3 className={styles.activationTitle}>Start with a place</h3>
                <p className={styles.activationCopy}>
                    Choose a city. See timing, fit, and what it activates.
                </p>
                <div className={styles.activationActions}>
                    <button className={styles.activationPrimary} onClick={() => router.push("/reading/new")}>
                        Start reading <ArrowRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );

    useGSAP(() => {
        // Letter-by-letter reveal on the name — signals "you've arrived"
        const letters = container.current?.querySelectorAll(`.${styles.greetingName} .letter`);
        if (letters && letters.length) {
            gsap.from(letters, {
                opacity: 0,
                y: 14,
                duration: 0.45,
                stagger: 0.06,
                ease: "power3.out",
                delay: 0.1,
            });
        }

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
        <>
            <PageHeader />
            <div className={styles.page} ref={container} style={{ width: "100%" }}>


            <div className={styles.content}>
                {/* Global Hero Greeting */}
                <div className={`${styles.hero} dashboard-hero`}>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.35rem" }}>
                        <span className={styles.pill}>{sunSignData?.emoji} {sunSignData?.name} Sun</span>
                        {access && (
                            <ReadingCreditPill hasSubscription={access.hasSubscription} freeUsed={access.freeUsed} />
                        )}
                    </div>
                    <h1 className={styles.greeting}>
                        Hello, <em className={styles.greetingName} aria-label={profile.first_name ?? undefined}>
                            {Array.from(String(profile.first_name ?? "")).map((ch, i) => (
                                <span
                                    key={i}
                                    className="letter"
                                    aria-hidden="true"
                                    style={{ display: "inline-block", whiteSpace: "pre" }}
                                >
                                    {ch === " " ? " " : ch}
                                </span>
                            ))}
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
                            {!hasReadings && (
                                <div className={styles.activationExploreItem}>
                                    {activationCard}
                                </div>
                            )}
                            <div className={styles.featuredExploreItem}>
                                <MyChartButton onClick={() => router.push("/chart")} />
                            </div>
                            {/* <LifeGoalsButton onClick={() => router.push("/goals?demo=true")} /> */}
                            <CouplesButton onClick={() => router.push("/couples")} />
                            <WorldChartsButton onClick={() => router.push("/mundane")} />
                            {/* <TransitsButton onClick={() => router.push("/reading/new?type=transits")} /> */}
                            <SkyWeatherButton onClick={() => router.push("/reading/new?type=weather")} />
                            <LearnButton onClick={() => router.push("/learn")} />
                        </div>
                    </section>
                    <section className={`${styles.readingsSection} ${!hasReadings ? styles.emptyReadingsSection : ""}`}>
                        <h4 className={styles.sectionKicker}>YOUR READINGS</h4>
                        <div className={`${styles.readingsList} dashboard-readings`}>
                            {hasReadings ? (
                                <>
                                {recentSearches.slice(0, 3).map((s) => {
                                    const isWeather = s.category === 'geodetic-weather';
                                    const w = s.weatherSummary;
                                    const bucket = isWeather && w ? tierToBucket(w.worstTier as Tier) : null;
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
                className="dashboard-fab"
                onClick={() => router.push("/reading/new")}
            >
                + New Reading
            </button>
        </div>
        </>
    );
}
