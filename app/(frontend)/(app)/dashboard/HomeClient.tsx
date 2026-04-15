"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./home.module.css";
import { ScoreRing, getVerdict } from "@/app/components/ScoreRing";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/app/components/ThemeToggle";
import DashboardLayout from "@/app/components/DashboardLayout";
import { LifeGoalsButton, CouplesButton, MyChartButton, WorldChartsButton } from "@/app/components/ExploreButtons";


export default function HomeClient({ profile, sunSignData, recentSearches }: any) {
    const router = useRouter();
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

        // Hero greeting
        tl.fromTo(
            ".dashboard-hero",
            { opacity: 0, scale: 0.95, y: 20 },
            { opacity: 1, scale: 1, y: 0, duration: 1, ease: "back.out(1.2)" }
        );

        // Character-by-character Text Animation for the name
        tl.fromTo(
            ".greeting-char",
            { opacity: 0, y: 20, rotationX: -90 },
            { opacity: 1, y: 0, rotationX: 0, duration: 0.6, stagger: 0.04, ease: "back.out(2)" },
            "-=0.7"
        );

        // Banner
        tl.fromTo(
            ".dashboard-banner",
            { opacity: 0, y: 30, rotationX: -10 },
            { opacity: 1, y: 0, rotationX: 0, duration: 0.8 },
            "-=0.6"
        );

        // Explore cards stagger
        tl.fromTo(
            ".editorial-btn",
            { opacity: 0, y: 40, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1, ease: "elastic.out(1, 0.8)" },
            "-=0.5"
        );

        // Readings list
        tl.fromTo(
            ".dashboard-readings",
            { opacity: 0, x: 20 },
            { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" },
            "-=0.6"
        );

        // Inline action button
        tl.fromTo(
            ".dashboard-fab",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
            "-=0.4"
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

        // ── Interactive Hover state for Dashboard Banner ──
        const banner = document.querySelector(".dashboard-banner");
        if (banner) {
             banner.addEventListener("mouseenter", () => {
                  gsap.to(banner, { scale: 1.01, duration: 0.4, ease: "power2.out" });
             });
             banner.addEventListener("mouseleave", () => {
                  gsap.to(banner, { scale: 1, duration: 0.4, ease: "power2.out" });
             });
        }
    }, { scope: container });

    return (
        <DashboardLayout showBack={false} maxWidth="100%">
            <div className={styles.page} ref={container}>


            <div className={styles.content}>
                {/* ── 2-Column Grid fills full height ── */}
                <div className={styles.dashboardGrid}>
                    <section className={styles.exploreSection}>
                        {/* Hero lives inside left col so readings align to top */}
                        <div className={`${styles.hero} dashboard-hero`} style={{ opacity: 0 }}>
                            <span className={styles.pill}>{sunSignData?.emoji} {sunSignData?.name} Sun</span>
                            <h1 className={styles.greeting}>
                                Hello, <em className={styles.greetingName} style={{ display: "inline-block", perspective: "400px" }}>
                                    {profile.first_name.split("").map((char: string, i: number) => (
                                        <span key={i} className="greeting-char" style={{ display: "inline-block", opacity: 0 }}>
                                            {char === " " ? "\u00A0" : char}
                                        </span>
                                    ))}
                                </em>
                            </h1>
                        </div>

                        {/* Birthday Optimizer — flat strip */}
                        <button
                            className={`${styles.banner} dashboard-banner`}
                            style={{ opacity: 0 }}
                            onClick={() => router.push("/birthday?demo=true")}
                        >
                            <svg className={styles.bannerSpiral} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                                {[...Array(12)].map((_, i) => (
                                    <path key={i} d="M50 50 C 40 10, 90 10, 100 50" transform={`rotate(${i * 30} 50 50)`} />
                                ))}
                            </svg>
                            <div className={styles.bannerTag}>BIRTHDAY OPTIMIZER</div>
                            <div>
                                <span className={styles.bannerTitleMain}>SOLAR</span>
                                <span className={styles.bannerTitleScript}>Return</span>
                            </div>
                            <div className={styles.bannerSub}>How will you make the best of your solar return?</div>
                        </button>

                        <div className={styles.exploreHeader}>
                            <h4 className={styles.sectionKicker}>EXPLORE</h4>
                        </div>
                        <div className={styles.exploreGrid}>
                            <LifeGoalsButton onClick={() => router.push("/goals?demo=true")} />
                            <CouplesButton onClick={() => router.push("/reading/new?type=couples")} />
                            <MyChartButton onClick={() => router.push("/chart?demo=true")} />
                            <WorldChartsButton onClick={() => router.push("/mundane?demo=true")} />
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
                                {recentSearches.slice(0, 3).map((s: any) => (
                                    <div key={s.id} className={styles.readingRow}>
                                        <div className={styles.readingLeft}>
                                            <div className={styles.miniRing}>
                                                <ScoreRing score={s.score} verdict={getVerdict(s.score)} />
                                            </div>
                                            <div>
                                                <span className={styles.readingDest}>{s.destination}</span>
                                                <span className={styles.readingDate}>
                                                    {new Date(s.travel_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                                    {s.score > 80 ? " • High Energy" : s.score > 60 ? " • Balanced" : " • Challenging"}
                                                </span>
                                            </div>
                                        </div>
                                        <button className={styles.viewBtn} onClick={(e) => { e.stopPropagation(); router.push(`/reading/${s.id}?demo=true`); }}>View &rsaquo;</button>
                                    </div>
                                ))}
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
