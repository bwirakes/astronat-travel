"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import StarBackground from "../components/StarBackground";
import Navbar from "../components/Navbar";
import {
    getSunSign,
    MOCK_PLANET_LINES,
    MOCK_TRANSITS,
    MOCK_HOROSCOPE,
    MOCK_12_MONTH_WINDOWS,
    generateTravelWindows,
    PLANET_COLORS,
    PLANET_GLYPHS,
    PLANET_EMOJI,
    SIGN_GLYPHS,
    TravelWindow,
    getDistanceRanking,
} from "../lib/planet-data";
import styles from "./flow.module.css";

// Lazy load the map to avoid SSR issues with Leaflet
const AstroMap = dynamic(() => import("../components/AstroMap"), { ssr: false });
// Lazy load natal chart (SVG, fine with SSR but keep consistent with map)
const NatalChart = dynamic(() => import("../components/NatalChart"), { ssr: false });
// Verdict card (summary + best/avoid windows)
const VerdictCard = dynamic(() => import("../components/VerdictCard"), { ssr: false });

const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};

interface BirthData { name: string; date: string; time: string; city: string; }
interface TravelData { destination: string; travelDate: string; }
interface PlanetLine { planet: string; angle: string; distance_km: number; orb?: number; is_paran?: boolean; meaning?: { badge: string } }
interface NatalPlanet { planet: string; sign: string; degree: number; longitude: number; retrograde: boolean; house: number; condition?: string; dignity?: string; }

export default function FlowPage() {
    const [step, setStep] = useState(0);
    const [dir, setDir] = useState(1);
    const [birth, setBirth] = useState<BirthData>({ name: "", date: "", time: "", city: "" });
    const [travel, setTravel] = useState<TravelData>({ destination: "", travelDate: "" });

    // API state
    // We keep BOTH a state (for renders) and a ref (for immediate access in callbacks)
    const [userId, setUserId] = useState<string>("");
    const userIdRef = useRef<string>("");
    const [natalPlanets, setNatalPlanets] = useState<NatalPlanet[]>([]);
    const natalPlanetsRef = useRef<NatalPlanet[]>([]);
    const [planetLines, setPlanetLines] = useState<PlanetLine[]>([]);
    const [travelWindows, setTravelWindows] = useState<TravelWindow[]>([]);
    const [reading, setReading] = useState<string>("");
    const [loadingChart, setLoadingChart] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);
    const [isMock, setIsMock] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const [summary, setSummary] = useState<import("../components/VerdictCard").Summary | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

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
            const uid = data.user_id || "";
            const planets = data.natal_planets || [];
            // Update BOTH state and refs so handleAnalyze can read immediately
            setUserId(uid);
            userIdRef.current = uid;
            setNatalPlanets(planets);
            natalPlanetsRef.current = planets;
            setIsMock(data.mock === true);
        } catch {
            setIsMock(true);
        }
        setLoadingChart(false);
        setStep(1);

        // Fire /api/natal in background to get real planetary data
        if (birth.date && birth.city) {
            const [year, month, day] = birth.date.split("-");
            fetch("/api/natal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dob: birth.date, time: birth.time, birthplace: birth.city }),
            })
                .then(r => r.json())
                .then(data => {
                    if (data.planets && data.planets.length > 0) {
                        setNatalPlanets(data.planets);
                        natalPlanetsRef.current = data.planets;
                    }
                })
                .catch(() => {}); // fail silently, fallback to mock
        }
    }, [birth]);

    // Step 1 → Step 2: fetch planet lines, transits, then stream reading
    const handleAnalyze = useCallback(async () => {
        setLoadingResults(true);
        setDir(1);
        setStep(2);
        setReading("");

        // Use refs for immediate access — state updates from handleChartSubmit may not be
        // visible yet because React batches state updates between renders
        const uid = userIdRef.current || userId || `guest_${Date.now()}`;
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
        // Use real transit windows if available, otherwise generate mock from travel date
        const windows: TravelWindow[] = trRes.windows?.length > 0
            ? trRes.windows
            : generateTravelWindows(travel.travelDate || today);
        setPlanetLines(lines);
        setTravelWindows(windows);
        setLoadingResults(false);

        // Fire /api/summary in parallel with reading
        const planets = natalPlanetsRef.current.length > 0 ? natalPlanetsRef.current : natalPlanets;
        setLoadingSummary(true);
        setSummary(null);
        fetch("/api/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: birth.name,
                sunSign: sunSign?.name,
                destination: travel.destination,
                travelDate: travel.travelDate || null,
                planetLines: lines,
                transits: trRes.raw?.major_aspects || MOCK_TRANSITS,
                natalPlanets: planets,
            }),
        })
            .then(r => r.json())
            .then(data => { setSummary(data); setLoadingSummary(false); })
            .catch(() => setLoadingSummary(false));

        // Stream the Gemini reading
        if (abortRef.current) abortRef.current.abort();
        const abort = new AbortController();
        abortRef.current = abort;

        // Current planetary ephemeris (March 2026) for Gemini context
        const currentEphemeris = [
            "Sun in Pisces ♓", "Moon transiting Gemini ♊",
            "Mercury in Pisces ♓", "Venus in Aries ♈",
            "Mars in Cancer ♋ (retrograde)", "Jupiter in Gemini ♊",
            "Saturn in Pisces ♓", "Uranus in Taurus ♉",
            "Neptune in Aries ♈", "Pluto in Aquarius ♒",
        ];

        // planets already declared above for summary call — reuse it

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
                    transits: trRes.raw?.major_aspects || MOCK_TRANSITS,
                    natalPlanets: planets,
                    currentEphemeris,
                }),
                signal: abort.signal,
            });

            if (!readRes.ok || !readRes.body) {
                setReading(MOCK_HOROSCOPE);
                return;
            }
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
                <Navbar
                    logoHref="/"
                    centerContent={
                        <div className={styles.progress}>
                            {["Chart", "Destination", "Analysis"].map((label, i) => (
                                <div key={i} className={styles.progressItem}>
                                    <div className={`${styles.dot} ${i === step ? styles.active : i < step ? styles.done : ""}`} />
                                    <span className={styles.progressLabel}>{label}</span>
                                </div>
                            ))}
                        </div>
                    }
                />

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
                                        Enter your destination and a rough target date — we'll surface the best windows around that period and the full 12-month picture.
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
                                            <label className="input-label">Target date <span className={styles.optional}>(optional)</span></label>
                                            <input className="input-field" type="date" value={travel.travelDate}
                                                onChange={(e) => setTravel(p => ({ ...p, travelDate: e.target.value }))} />
                                            <p className={styles.dateHint}>Dates are flexible — we'll identify the best windows around this period.</p>
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

                                {/* ── Verdict Summary Card ── */}
                                <VerdictCard
                                    summary={summary}
                                    loading={loadingSummary}
                                    destination={travel.destination}
                                />

                                {/* ── Natal Chart Wheel ── */}
                                <div className={`card ${styles.natalChartCard}`}>
                                    <h5>Natal Chart</h5>
                                    <p className={styles.natalChartNote}>Your birth chart is the foundation of every transit and line reading below.</p>
                                    <div className={styles.natalChartWrap}>
                                        <NatalChart
                                            natalPlanets={(natalPlanetsRef.current.length > 0 ? natalPlanetsRef.current : natalPlanets) as NatalPlanet[]}
                                            sunSign={sunSign?.name}
                                            name={birth.name}
                                        />
                                    </div>
                                </div>

                                <div className={styles.grid}>
                                    {/* Planet lines — ACG Lines + Paran Lines separated */}
                                    <div className="card">
                                        <h5>Planetary lines near {travel.destination}</h5>
                                        {(() => {
                                            const allLines = planetLines.length > 0 ? planetLines : MOCK_PLANET_LINES;
                                            const acgLines = allLines.filter((l) => !l.is_paran);
                                            const paranLines = allLines.filter((l) => l.is_paran);
                                            const renderLine = (line: PlanetLine, i: number) => (
                                                <div key={i} className={styles.lineRow}>
                                                    <div className={styles.lineInfo}>
                                                        <span className={styles.planetEmoji}>{PLANET_EMOJI[line.planet] || "⭐"}</span>
                                                        <span className={styles.planetGlyph} style={{ color: PLANET_COLORS[line.planet] || "#ffffff" }}>
                                                            {PLANET_GLYPHS[line.planet?.split("-")[0]] || PLANET_GLYPHS[line.planet]}
                                                        </span>
                                                        <span>{line.planet}</span>
                                                        <span className={styles.lineAngle}>{line.angle}</span>
                                                    </div>
                                                    <div className={styles.lineMeta}>
                                                        <span className={styles.lineDistRanking}>{getDistanceRanking(line.distance_km)}</span>
                                                        <span className={styles.lineDist}>({line.distance_km} km)</span>
                                                    </div>
                                                </div>
                                            );
                                            return (
                                                <>
                                                    {acgLines.length > 0 && (
                                                        <div className={styles.lineSection}>
                                                            <span className={styles.lineSectionLabel}>ACG Lines</span>
                                                            <div className={styles.lineList} id="lineList">
                                                                {acgLines.map(renderLine)}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {paranLines.length > 0 && (
                                                        <div className={styles.lineSection}>
                                                            <span className={styles.lineSectionLabel} style={{ color: "var(--cyan)" }}>⊕ Paran Lines (Latitude Crossings)</span>
                                                            <p className={styles.paranNote}>Parans mark where two planetary lines cross at your latitude — they activate regardless of longitude and have a world-wide effect at that parallel.</p>
                                                            <div className={styles.lineList} id="paranList">
                                                                {paranLines.map(renderLine)}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Active transits — with Natal vs Geodetic legend */}
                                    <div className="card">
                                        <h5>{travel.travelDate ? "Active transits at time of travel" : "Current active transits"}</h5>
                                        <div className={styles.transitLegend} id="transitList">
                                            <span className={`${styles.systemBadge} ${styles.sys_natal}`}>Natal</span>
                                            <span className={styles.legendDesc}>Personal — from your birth chart</span>
                                            <span className={`${styles.systemBadge} ${styles.sys_geodetic}`}>Geodetic</span>
                                            <span className={styles.legendDesc}>Location-fixed — Earth&apos;s longitude grid</span>
                                        </div>
                                        <div className={styles.transitList}>
                                            {(MOCK_TRANSITS as Array<{ planets: string; type: string; aspect: string; system?: string; orb?: number }>).map((t, i) => (
                                                <div key={i} className={styles.transitRow}>
                                                    <span className={`${styles.aspectDot} ${styles[`aspect_${t.aspect}`]}`} />
                                                    <span className={styles.transitName}>{t.planets}</span>
                                                    <span className={styles.transitType}>{t.type} {t.orb !== undefined ? `(${t.orb}°)` : ""}</span>
                                                    {t.system && <span className={`${styles.systemBadge} ${styles[`sys_${t.system}`]}`}>{t.system === "geodetic" ? "Geodetic" : "Natal"}</span>}
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

                                    {/* Gemini streaming reading — structured 3-section */}
                                    <div className={`card ${styles.fullSpan} ${styles.readingCard}`}>
                                        <h5>Astro Nat Travel Reading</h5>
                                        <p className={styles.readingSubtitle}>{birth.name} · {travel.destination}{sunSign ? ` · ${SIGN_GLYPHS[sunSign.name]} ${sunSign.name} Sun` : ""}</p>
                                        {reading === "" ? (
                                            <div className={styles.readingLoading}>
                                                <Loader2 size={20} className={styles.spin} />
                                                <span>Generating your personalised reading…</span>
                                            </div>
                                        ) : (
                                            <div className={styles.readingText}>
                                                {/* Parse reading into sections split by ## headers */}
                                                {(() => {
                                                    // Helper: render a markdown table string → HTML table
                                                    const renderMarkdownTable = (tableText: string) => {
                                                        const rows = tableText.trim().split("\n").filter(r => r.trim().startsWith("|"));
                                                        if (rows.length < 2) return null;
                                                        const headerCells = rows[0].split("|").filter((_, i, a) => i > 0 && i < a.length - 1);
                                                        const bodyRows = rows.slice(2); // skip header + separator row
                                                        return (
                                                            <div className={styles.tableWrap}>
                                                                <table className={styles.readingTable}>
                                                                    <thead>
                                                                        <tr>
                                                                            {headerCells.map((cell, ci) => (
                                                                                <th key={ci} dangerouslySetInnerHTML={{ __html: cell.trim().replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                                                                            ))}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {bodyRows.map((row, ri) => {
                                                                            const cells = row.split("|").filter((_, i, a) => i > 0 && i < a.length - 1);
                                                                            return (
                                                                                <tr key={ri}>
                                                                                    {cells.map((cell, ci) => (
                                                                                        <td key={ci} dangerouslySetInnerHTML={{ __html: cell.trim().replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                                                                                    ))}
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        );
                                                    };

                                                    // Helper: render a body block that may contain a table
                                                    const renderBody = (body: string, sectionKey: number) => {
                                                        // Split on table blocks (starts with |)
                                                        const parts = body.split(/((?:^|\n)\|.+(?:\n\|.+)*)/m);
                                                        return parts.map((part, pi) => {
                                                            if (part.trim().startsWith("|")) {
                                                                return <div key={`${sectionKey}-t-${pi}`}>{renderMarkdownTable(part)}</div>;
                                                            }
                                                            return part.split("\n\n").filter(p => p.trim()).map((para, pi2) => (
                                                                <p key={`${sectionKey}-p-${pi}-${pi2}`} dangerouslySetInnerHTML={{
                                                                    __html: para.trim().replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                                                }} />
                                                            ));
                                                        });
                                                    };

                                                    const sections = reading.split(/(?=##\s)/g).filter(Boolean);
                                                    return sections.map((section, si) => {
                                                        const sectionLines = section.split("\n");
                                                        const firstLine = sectionLines[0].trim();
                                                        const isHeader = firstLine.startsWith("## ");
                                                        const headerText = isHeader ? firstLine.replace(/^##\s+/, "") : null;
                                                        const body = isHeader ? sectionLines.slice(1).join("\n") : section;
                                                        const sectionIcons: Record<string, string> = {
                                                            "Next 30 Days": "◎",
                                                            "Rest of Year Outlook": "◉",
                                                            "House Activations": "⬡",
                                                            "House Activations & Dignities": "⬡",
                                                            "Example of Natal Chart and ACG Lines based on real-time transits": "◈",
                                                        };
                                                        const icon = headerText ? (sectionIcons[headerText.trim()] || "◈") : null;
                                                        return (
                                                            <div key={si} className={headerText ? styles.readingSection : ""}>
                                                                {headerText && (
                                                                    <div className={styles.readingSectionHeader}>
                                                                        <span className={styles.readingSectionIcon}>{icon}</span>
                                                                        <h6 className={styles.readingSectionTitle}>{headerText}</h6>
                                                                    </div>
                                                                )}
                                                                {renderBody(body, si)}
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                                {/* Blinking cursor while streaming */}
                                                {reading.length < 1200 && <span className={styles.cursor} />}
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
