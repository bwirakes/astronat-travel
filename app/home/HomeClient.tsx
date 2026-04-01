"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Heart, Users, Star, Cake, User, Globe } from "lucide-react";
import Image from "next/image";
import styles from "./home.module.css";
import { ScoreRing, getVerdict } from "../components/ScoreRing";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";

export default function HomeClient({ profile, sunSignData, recentSearches }: any) {
    const router = useRouter();
    const container = useRef<HTMLDivElement>(null);

    const features = [
        { title: "Life Goals", icon: <Heart size={18} />, description: "What are you seeking?", url: "/goals?demo=true", accent: "var(--color-spiced-life)" },
        { title: "Couples", icon: <Users size={18} />, description: "Read for two", url: "/couples?demo=true", accent: "var(--gold)" },
        { title: "My Chart", icon: <Star size={18} />, description: "Your natal chart", url: "/chart?demo=true", accent: "var(--color-y2k-blue)" },
        { title: "World Charts", icon: <Globe size={18} />, description: "Natal charts of nations", url: "/mundane?demo=true", accent: "var(--color-acqua)" },
    ];

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
            ".explore-card",
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

        // Floating Action Button (FAB)
        tl.fromTo(
            ".dashboard-fab",
            { scale: 0, opacity: 0, rotation: -45 },
            { scale: 1, opacity: 1, rotation: 0, duration: 0.8, ease: "back.out(1.7)" },
            "-=0.4"
        );

        // ── Continuous floating animation for Birthday icon ──
        gsap.to(".cake-anim", {
            y: -6,
            rotation: 4,
            duration: 2.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // ── Interactive Hover state for Explore cards ──
        const exploreCards = gsap.utils.toArray(".explore-card") as HTMLElement[];
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
        <div className={styles.page} ref={container}>
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

                    {/* Birthday Optimizer — slim banner */}
                    <div
                        className={`${styles.banner} dashboard-banner`}
                        style={{ opacity: 0 }}
                        onClick={() => router.push("/birthday?demo=true")}
                    >
                        <div className={styles.bannerText}>
                            <span className={styles.bannerTag}>BIRTHDAY OPTIMIZER</span>
                            <span className={styles.bannerTitle}>Where should you be on your birthday?</span>
                            <span className={styles.bannerSub}>Find your most cosmically aligned destination for your next solar return.</span>
                        </div>
                        <div className={styles.bannerRight}>
                            <span className={`${styles.bannerEmoji} cake-anim`}><Cake size={40} strokeWidth={1} /></span>
                            <button className={styles.bannerBtn}>Find out &rarr;</button>
                        </div>
                    </div>

                    {/* Explore — tight grid */}
                    <section className={styles.exploreSection}>
                        <h4 className={styles.sectionKicker}>EXPLORE</h4>
                        <div className={styles.exploreGrid}>
                            {features.map((f, i) => (
                                <div
                                    key={i}
                                    className={`${styles.exploreCard} explore-card`}
                                    style={{ opacity: 0 }}
                                    onClick={() => router.push(f.url)}
                                >
                                    <div className={styles.exploreIcon} style={{ background: f.accent, color: '#fff' }}>{f.icon}</div>
                                    <span className={styles.exploreName}>{f.title}</span>
                                    <span className={styles.exploreDesc}>{f.description}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* ── Right / Bottom column ── */}
                <div className={styles.secondary}>
                    <section>
                        <h4 className={styles.sectionKicker}>YOUR READINGS</h4>
                        <div
                            className={`${styles.readingsList} dashboard-readings`}
                            style={{ opacity: 0 }}
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
                        </div>
                    </section>
                </div>
            </div>

            {/* Floating CTA */}
            <button
                className={`${styles.fab} dashboard-fab`}
                style={{ opacity: 0, scale: 0 }}
                onClick={() => router.push("/flow")}
            >
                + New Reading
            </button>


        </div>
    );
}
