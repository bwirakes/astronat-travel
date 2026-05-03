"use client";

import Link from "next/link";
import styles from "./learn-footer.module.css";

const FONT_PRIMARY = "var(--font-primary, serif)";
const FONT_BODY = "var(--font-body, system-ui)";
const FONT_MONO = "var(--font-mono, monospace)";

const ARTICLES = [
    {
        id: "acg",
        title: "Astrocartography",
        kicker: "GEOGRAPHY",
        time: "8 MIN READ",
        link: "/learn/astrocartography",
        thumbnail: (
            <>
                <div className={styles.acgScript}>Power</div>
                <div className={styles.acgMain}>LINES</div>
            </>
        )
    },
    {
        id: "geodetic",
        title: "Geodetic Astrology",
        kicker: "SYSTEMS",
        time: "12 MIN READ",
        link: "/learn/geodetic-astrology",
        thumbnail: (
            <>
                <div className={styles.geoHeader}>GLOBAL</div>
                <div className={styles.geoMain}>GRID</div>
            </>
        )
    },
    {
        id: "houses",
        title: "The 12 Houses",
        kicker: "FOUNDATION",
        time: "15 MIN READ",
        link: "/learn/houses",
        thumbnail: (
            <>
                <span className={styles.housesPill}>12</span>
                <div className={styles.housesMain}>HOUSES</div>
            </>
        )
    },
    {
        id: "divide",
        title: "The Great Divide",
        kicker: "ENERGY",
        time: "6 MIN READ",
        link: "/learn/malefic-benefic",
        thumbnail: (
            <>
                <div className={styles.divideScript}>The</div>
                <div className={styles.divideMain}>DIVIDE</div>
            </>
        )
    },
];

export default function LearnFooter() {
    return (
        <section className="w-full mt-[clamp(40px,6vw,80px)] border-t-[3px] pt-[clamp(20px,3vw,32px)]" style={{ borderColor: "var(--text-primary)" }}>
            <div className="flex justify-between items-end mb-[clamp(32px,5vw,48px)]">
                <h2
                    className="m-0 leading-none tracking-[-0.01em] uppercase"
                    style={{ fontFamily: FONT_PRIMARY, fontSize: "clamp(24px, 4vw, 36px)", color: "var(--text-primary)" }}
                >
                    Academy
                </h2>
                <Link
                    href="/learn"
                    className="text-[12px] tracking-[0.1em] uppercase hover:underline"
                    style={{ fontFamily: FONT_MONO, color: "var(--text-secondary)" }}
                >
                    See All
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-[40px] border-l" style={{ borderColor: "var(--surface-border)" }}>
                {ARTICLES.map((article) => (
                    <Link
                        key={article.id}
                        href={article.link}
                        className={styles.card}
                    >
                        <div className={`${styles.thumbnail} ${styles[article.id]}`}>
                            {article.thumbnail}
                        </div>
                        
                        <div className="flex flex-col flex-1">
                            <span
                                className="text-[11px] tracking-[0.15em] uppercase mb-[12px]"
                                style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                            >
                                {article.kicker}
                            </span>
                            <h3
                                className="m-0 text-[clamp(20px,2vw,24px)] leading-[1.3] mb-[24px] [text-wrap:balance]"
                                style={{ fontFamily: FONT_PRIMARY, color: "var(--text-primary)" }}
                            >
                                {article.title}
                            </h3>
                            
                            <div className="mt-auto pt-[24px] flex items-center gap-[12px]">
                                <svg width="12" height="16" viewBox="0 0 12 16" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5">
                                    <rect x="3" y="1" width="6" height="9" rx="3" />
                                    <path d="M6 10V15" />
                                    <path d="M4 15H8" />
                                    <path d="M1 7V8A5 5 0 0011 8V7" />
                                </svg>
                                <span
                                    className="text-[10px] tracking-[0.15em] uppercase"
                                    style={{ fontFamily: FONT_MONO, color: "var(--text-tertiary)" }}
                                >
                                    ASTRONAT | {article.time}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
