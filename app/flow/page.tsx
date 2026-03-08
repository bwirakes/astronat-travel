"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Globe, Loader2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import StarBackground from "../components/StarBackground";
import ThemeToggle from "../components/ThemeToggle";
import {
    getSunSign,
    MOCK_PLANET_LINES,
    MOCK_TRANSITS,
    MOCK_HOROSCOPE,
    MOCK_12_MONTH_WINDOWS,
    PLANET_COLORS,
    PLANET_GLYPHS,
    PLANET_EMOJI,
    SIGN_GLYPHS,
    TravelWindow,
} from "../lib/planet-data";
import styles from "./flow.module.css";

// Lazy load the map to avoid SSR issues with Leaflet
const AstroMap = dynamic(() => import("../components/AstroMap"), { ssr: false });

const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};

interface BirthData { name: string; date: string; time: string; city: string; }
interface TravelData { destination: string; travelDate: string; }
interface PlanetLine { planet: string; angle: string; distance_km: number; meaning?: { badge: string } }

export default function FlowPage() {
    const [step, setStep] = useState(0);
    const [dir, setDir] = useState(1);
    const [birth, setBirth] = useState<BirthData>({ name: "", date: "", time: "", city: "" });
    const [travel, setTravel] = useState<TravelData>({ destination: "", travelDate: "" });

    // API state
    const [userId, setUserId] = useState<string>("");
    const [natalPlanets, setNatalPlanets] = useState<object[]>([]);
    const [planetLines, setPlanetLines] = useState<PlanetLine[]>([]);
    const [travelWindows, setTravelWindows] = useState<TravelWindow[]>([]);
    const [reading, setReading] = useState<string>("");
    const [loadingChart, setLoadingChart] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);
    const [isMock, setIsMock] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const sunSign = useMemo(() => {
        if (!birth.date) return null;
        const [, m, d] = birth.date.split("-").map(Number);
        return getSunSign(m, d);
    }, [birth.date]);

    // Step 0 → Step 1: register birth chart
    const handleChartSubmit = useCallback(async () => {
        setLoadingChart(true);
        setDir(1);
        try {
            const res = await fetch("/api/chart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(birth),
            });
            const data = await res.json();
            setUserId(data.user_id || "");
            setNatalPlanets(data.natal_planets || []);
            setIsMock(data.mock === true);
        } catch {
            setIsMock(true);
        }
        setLoadingChart(false);
        setStep(1);
    }, [birth]);

    // Step 1 → Step 2: fetch planet lines, transits, then stream reading
    const handleAnalyze = useCallback(async () => {
        setLoadingResults(true);
        setDir(1);
        setStep(2);
        setReading("");

        const uid = userId || `guest_${Date.now()}`;
        const today = new Date().toISOString().split("T")[0];

        // Parallel: astrocarto + transits
        const [acRes, trRes] = await Promise.all([
            fetch("/api/astrocarto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: uid, destination: travel.destination }),
            }).then(r => r.json()).catch(() => ({ lines: MOCK_PLANET_LINES, mock: true })),

            fetch("/api/transits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: uid, start_date: travel.travelDate || today }),
            }).then(r => r.json()).catch(() => ({ windows: MOCK_12_MONTH_WINDOWS, mock: true })),
        ]);

        const lines: PlanetLine[] = acRes.lines || MOCK_PLANET_LINES;
        const windows: TravelWindow[] = trRes.windows || MOCK_12_MONTH_WINDOWS;
        setPlanetLines(lines);
        setTravelWindows(windows);
        setLoadingResults(false);

        // Stream the Gemini reading
        if (abortRef.current) abortRef.current.abort();
        const abort = new AbortController();
        abortRef.current = abort;

        try {
            const readRes = await fetch("/api/reading", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: birth.name,
                    sunSign: sunSign?.name,
                    destination: travel.destination,
                    travelDate: travel.travelDate || null,
                    planetLines: lines,
                    transits: MOCK_TRANSITS,
                    natalPlanets,
                }),
                signal: abort.signal,
            });

            if (!readRes.body) return;
            const reader = readRes.body.getReader();
            const decoder = new TextDecoder();
            let acc = "";
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                acc += decoder.decode(value, { stream: true });
                setReading(acc);
            }
        } catch (err: unknown) {
            if ((err as Error).name !== "AbortError") {
                setReading(MOCK_HOROSCOPE);
            }
        }
    }, [birth, travel, userId, natalPlanets, sunSign]);

    const back = useCallback(() => { setDir(-1); setStep((s) => Math.max(s - 1, 0)); }, []);
    const canNext0 = birth.name && birth.date && birth.time && birth.city;
    const canNext1 = !!travel.destination;

    return (
        <>
            <StarBackground />
            <div className={styles.page}>
                <header className={styles.header}>
                    <Link href="/" className={styles.logo}>Astro Nat</Link>
                    <div className={styles.headerRight}>
                        <div className={styles.progress}>
                            {["Chart", "Destination", "Analysis"].map((label, i) => (
                                <div key={i} className={styles.progressItem}>
                                    <div className={`${styles.dot} ${i === step ? styles.active : i < step ? styles.done : ""}`} />
                                    <span className={styles.progressLabel}>{label}</span>
                                </div>
                            ))}
                        </div>
                        <ThemeToggle />
                    </div>
                </header>

                <main className={styles.main}>
                    <AnimatePresence mode="wait" custom={dir}>

                        {/* ── Step 0: Birth details ── */}
                        {step === 0 && (
                            <motion.div key="birth" className={styles.stepWrap} custom={dir} variants={variants}
                                initial="enter" animate="center" exit="exit" transition={{ duration: 0.35 }}>
                                <div className={styles.stepIntro}>
                                    <h5>Step 1</h5>
                                    <h2 className={styles.stepHeading}>Your birth details</h2>
                                    <p>We need your exact birth data to calculate your natal chart. The more accurate the time, the more precise your planetary lines.</p>
                                </div>

                                <div className="card">
                                    <div className={styles.formStack}>
                                        <div className="input-group">
                                            <label className="input-label">Full name</label>
                                            <input className="input-field" type="text" placeholder="e.g. Natalia"
                                                value={birth.name} onChange={(e) => setBirth(p => ({ ...p, name: e.target.value }))} />
                                        </div>
                                        <div className={styles.formRow}>
                                            <div className="input-group">
                                                <label className="input-label">Date of birth</label>
                                                <input className="input-field" type="date" value={birth.date}
                                                    onChange={(e) => setBirth(p => ({ ...p, date: e.target.value }))} />
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">Time of birth</label>
                                                <input className="input-field" type="time" value={birth.time}
                                                    onChange={(e) => setBirth(p => ({ ...p, time: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">City of birth</label>
                                            <input className="input-field" type="text" placeholder="e.g. Singapore"
                                                value={birth.city} onChange={(e) => setBirth(p => ({ ...p, city: e.target.value }))} />
                                        </div>

                                        {sunSign && (
                                            <motion.div className={styles.signHint} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                <span className={styles.signGlyph}>{SIGN_GLYPHS[sunSign.name]}</span>
                                                <div>
                                                    <div className={styles.signName}>{sunSign.name}</div>
                                                    <div className={styles.signNote}>Sun sign detected</div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button className="btn btn-primary" disabled={!canNext0 || loadingChart} onClick={handleChartSubmit}
                                        style={{ opacity: canNext0 ? 1 : 0.3 }}>
                                        {loadingChart ? <><Loader2 size={16} className={styles.spin} /> Calculating…</> : <>Continue <ArrowRight size={16} /></>}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Step 1: Destination ── */}
                        {step === 1 && (
                            <motion.div key="travel" className={styles.stepWrap} custom={dir} variants={variants}
                                initial="enter" animate="center" exit="exit" transition={{ duration: 0.35 }}>
                                <div className={styles.stepIntro}>
                                    <h5>Step 2</h5>
                                    <h2 className={styles.stepHeading}>Where are you going</h2>
                                    <p>
                                        Enter your destination. Travel dates are optional — we{`'`}ll show you the full 12-month transit picture either way.
                                    </p>
                                    {isMock && (
                                        <p className={styles.mockNote}>⚠ Engine offline — using sample chart data</p>
                                    )}
                                </div>

                                <div className="card">
                                    <div className={styles.formStack}>
                                        <div className="input-group">
                                            <label className="input-label">Destination</label>
                                            <input className="input-field" type="text" placeholder="e.g. Tokyo, Japan"
                                                value={travel.destination} onChange={(e) => setTravel(p => ({ ...p, destination: e.target.value }))} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Travel date <span className={styles.optional}>(optional)</span></label>
                                            <input className="input-field" type="date" value={travel.travelDate}
                                                onChange={(e) => setTravel(p => ({ ...p, travelDate: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button className="btn btn-secondary" onClick={back}>
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                    <button className="btn btn-primary" disabled={!canNext1} onClick={handleAnalyze}
                                        style={{ opacity: canNext1 ? 1 : 0.3 }}>
                                        Analyze <ArrowRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Step 2: Results ── */}
                        {step === 2 && (
                            <motion.div key="results" className={styles.resultsWrap} custom={dir} variants={variants}
                                initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }}>

                                <div className={styles.resultsHeader}>
                                    <h5>Analysis</h5>
                                    <h2 className={styles.resultsHeading}>{travel.destination}</h2>
                                    <p>
                                        {birth.name}
                                        {sunSign && <span> · <span className={styles.signInline}>{SIGN_GLYPHS[sunSign.name]}</span> {sunSign.name} Sun</span>}
                                        {travel.travelDate && <span> · {new Date(travel.travelDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>}
                                    </p>
                                </div>

                                {/* Astrocartography Map */}
                                {loadingResults ? (
                                    <div className={styles.mapPlaceholder}>
                                        <Loader2 size={28} className={styles.spin} />
                                        <p>Computing planetary lines…</p>
                                    </div>
                                ) : (
                                    <div className={styles.mapContainer}>
                                        <AstroMap
                                            destination={travel.destination}
                                            planetLines={planetLines.length > 0 ? planetLines : MOCK_PLANET_LINES}
                                        />
                                    </div>
                                )}

                                <div className={styles.grid}>
                                    {/* Planet lines */}
                                    <div className="card">
                                        <h5>Planetary lines near {travel.destination}</h5>
                                        <div className={styles.lineList}>
                                            {(planetLines.length > 0 ? planetLines : MOCK_PLANET_LINES).map((line, i) => (
                                                <div key={i} className={styles.lineRow}>
                                                    <div className={styles.lineInfo}>
                                                        <span className={styles.planetEmoji}>{PLANET_EMOJI[line.planet]}</span>
                                                        <span className={styles.planetGlyph} style={{ color: PLANET_COLORS[line.planet] }}>
                                                            {PLANET_GLYPHS[line.planet]}
                                                        </span>
                                                        <span>{line.planet}</span>
                                                        <span className={styles.lineAngle}>{line.angle}</span>
                                                    </div>
                                                    <span className={styles.lineDist}>{line.distance_km} km</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Active transits */}
                                    <div className="card">
                                        <h5>{travel.travelDate ? "Active transits at time of travel" : "Current active transits"}</h5>
                                        <div className={styles.transitList}>
                                            {MOCK_TRANSITS.map((t, i) => (
                                                <div key={i} className={styles.transitRow}>
                                                    <span className={`${styles.aspectDot} ${styles[`aspect_${t.aspect}`]}`} />
                                                    <span className={styles.transitName}>{t.planets}</span>
                                                    <span className={styles.transitType}>{t.type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 12-month windows */}
                                    <div className={`card ${styles.fullSpan}`}>
                                        <h5>12-month travel windows</h5>
                                        <p className={styles.windowsNote}>Based on your transits and house activations. Plan around these.</p>
                                        <div className={styles.windowsGrid}>
                                            {(travelWindows.length > 0 ? travelWindows : MOCK_12_MONTH_WINDOWS).map((w, i) => (
                                                <div key={i} className={`${styles.windowItem} ${styles[`q_${w.quality}`]}`}>
                                                    <div className={styles.windowMonth}>{w.month}</div>
                                                    <div className={styles.windowQuality}>
                                                        <span className={`${styles.qDot} ${styles[`qd_${w.quality}`]}`} />
                                                        {w.quality}
                                                    </div>
                                                    <div className={styles.windowReason}>{w.reason}</div>
                                                    <div className={styles.windowHouse}>{w.house}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Gemini streaming reading */}
                                    <div className={`card ${styles.fullSpan} ${styles.readingCard}`}>
                                        <h5>Your travel reading</h5>
                                        {reading === "" ? (
                                            <div className={styles.readingLoading}>
                                                <Loader2 size={20} className={styles.spin} />
                                                <span>Generating your personalised reading…</span>
                                            </div>
                                        ) : (
                                            <div className={styles.readingText}>
                                                {reading.split("\n\n").filter(Boolean).map((para, i) => (
                                                    <p key={i} dangerouslySetInnerHTML={{
                                                        __html: para.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                                    }} />
                                                ))}
                                                {/* Blinking cursor while streaming */}
                                                {reading.length < 800 && <span className={styles.cursor} />}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button className="btn btn-secondary" onClick={back}>
                                        <ArrowLeft size={16} /> Adjust trip
                                    </button>
                                    <Link href="/" className="btn btn-primary">
                                        New trip <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </>
    );
}
