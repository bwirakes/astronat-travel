"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import StarBackground from "../components/StarBackground";
import Navbar from "../components/Navbar";
import ExpandableCard from "../components/ExpandableCard";
import GeodeticZoneCard from "../components/GeodeticZoneCard";
import WorldSkyCard from "../components/WorldSkyCard";
import AcgLinesCard from "../components/AcgLinesCard";
import CountryChartCard from "../components/CountryChartCard";
import ActiveTransitsCard from "../components/ActiveTransitsCard";
import TravelWindowsCard from "../components/TravelWindowsCard";
import {
    getSunSign,
    generateTravelWindows,
    generateWindowsFromTransits,
    SIGN_GLYPHS,
    TravelWindow,
} from "../lib/planet-data";
import { computeTripScore } from "../lib/scoring";
import { computeChartRulerContext } from "../lib/chart-ruler";
import styles from "./flow.module.css";

// Lazy load heavy components
const AstroMap = dynamic(() => import("../components/AstroMap"), { ssr: false });
const NatalChart = dynamic(() => import("../components/NatalChart"), { ssr: false });
const TripScoreCard = dynamic(() => import("../components/TripScoreCard"), { ssr: false });
const HouseMatrixCard = dynamic(() => import("../components/HouseMatrixCard"), { ssr: false });

// ── Animation variants ────────────────────────────────────────────────────
const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};

// ── Interfaces ────────────────────────────────────────────────────────────
interface BirthData { name: string; date: string; time: string; city: string; }
interface TravelData { destination: string; travelDate: string; }
interface PlanetLine { planet: string; angle: string; distance_km: number; orb?: number; is_paran?: boolean; meaning?: { badge: string } }
interface NatalPlanet { planet: string; sign: string; degree: number; longitude: number; retrograde: boolean; house: number; condition?: string; dignity?: string; }
interface WorldTransit { p1: string; p2: string; aspect: string; symbol: string; orb: number; p1Sign: string; p1Deg: number; p2Sign: string; p2Deg: number; applying: boolean; isTense: boolean; }
interface MundaneResult { worldTransits: WorldTransit[]; angularPlanets: { planet: string; angle: string; distFromLocation: number; sign: string; degree: number }[]; parans: { p1: string; p2: string; type: string; lat: number }[]; planets?: { name: string; longitude: number; sign: string; degree: number; ra: number }[]; }
import type { HouseMatrixResult } from "../lib/house-matrix";

/** Quick mundane sub-score (max 30) from mundane result — used when AI score drives the trip score */
function scoreMundaneFromData(m: MundaneResult | null): number {
    if (!m) return 18;
    const BENEFICS = ["venus", "jupiter", "sun"];
    const MALEFICS = ["mars", "saturn", "pluto", "uranus", "neptune"];
    let s = 20;
    let softGains = 0;
    const SOFT_CAP = 6;
    for (const t of m.worldTransits) {
        const orb = t.orb ?? 5;
        const p = (t.p1 + " " + t.p2).toLowerCase();
        const aspect = (t.aspect || "").toLowerCase();
        const soft = aspect.includes("trine") || aspect.includes("sextile");
        const hasMalefic = MALEFICS.some(x => p.includes(x));
        const hasBenefic = BENEFICS.some(x => p.includes(x));
        if (t.isTense) {
            if (orb <= 1) s -= hasMalefic ? 8 : 5;
            else if (orb <= 2) s -= hasMalefic ? 6 : 4;
            else if (orb <= 5) s -= hasMalefic ? 4 : 2;
            else s -= 1;
        } else if (soft && softGains < SOFT_CAP) {
            const gain = (hasBenefic && orb <= 3) ? 2 : (hasBenefic || orb <= 3) ? 1 : 0;
            softGains += gain;
            s += gain;
        }
    }
    for (const ap of m.angularPlanets || []) {
        if (BENEFICS.some(b => ap.planet.toLowerCase().includes(b))) s += 2;
        else if (MALEFICS.some(b => ap.planet.toLowerCase().includes(b))) s -= 3;
    }
    return Math.max(0, Math.min(30, s));
}

// ── Relocated cusps math helper ───────────────────────────────────────────
function computeRelocatedCusps(lat: number, lon: number): number[] {
    const obliquity = 23.4393 * (Math.PI / 180);
    const φ = lat * (Math.PI / 180);
    const tanVal = Math.tan(φ) * Math.tan(obliquity);
    const dOA = Math.abs(tanVal) <= 1 ? Math.asin(tanVal) * (180 / Math.PI) : 0;
    const mcLonDeg = ((lon % 360) + 360) % 360;
    const ascLon = ((mcLonDeg - 90 + dOA + 360) % 360);
    return Array.from({ length: 12 }, (_, i) => (ascLon + i * 30) % 360);
}

import { Suspense } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
function FlowPageInner() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState(0);
    const [dir, setDir] = useState(1);
    const [birth, setBirth] = useState<BirthData>({ name: "Brandon", date: "1988-08-17", time: "22:15", city: "Jakarta, Indonesia" });
    const [travel, setTravel] = useState<TravelData>({ destination: "", travelDate: "" });
    const autoAnalyzedRef = useRef(false);
    const [showAllLines, setShowAllLines] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Natal chart state
    const [natalPlanets, setNatalPlanets] = useState<NatalPlanet[]>([]);
    const natalPlanetsRef = useRef<NatalPlanet[]>([]);
    const [natalCusps, setNatalCusps] = useState<number[]>([]);
    const natalCuspsRef = useRef<number[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);
    const [isMock, setIsMock] = useState(false);
    const [birthDateTimeUTC, setBirthDateTimeUTC] = useState<string | undefined>();
    const [birthCoords, setBirthCoords] = useState<{ lat: number; lon: number } | null>(null);

    // Results state
    const [planetLines, setPlanetLines] = useState<PlanetLine[]>([]);
    const [travelWindows, setTravelWindows] = useState<TravelWindow[]>([]);
    const [mundane, setMundane] = useState<MundaneResult | null>(null);
    const [relocatedCusps, setRelocatedCusps] = useState<number[] | null>(null);
    const [relocatedPlanets, setRelocatedPlanets] = useState<NatalPlanet[] | null>(null);
    const [loadingResults, setLoadingResults] = useState(false);
    const [chartRulerNote, setChartRulerNote] = useState<string>("");

    // Scoring & summary
    const [tripScore, setTripScore] = useState({ total: 0, acg: 0, mundane: 0, personal: 0 });
    const [summary, setSummary] = useState<{ verdict: "excellent" | "caution" | "avoid"; headline: string; bestWindows: { dates: string; transit: string; why: string }[]; avoidWindows: { dates: string; transit: string; why: string }[] } | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    // House matrix state
    const [houseMatrix, setHouseMatrix] = useState<HouseMatrixResult | null>(null);
    const [loadingMatrix, setLoadingMatrix] = useState(false);

    // AI reading
    const [reading, setReading] = useState("");
    const abortRef = useRef<AbortController | null>(null);

    // Transits state (real data from API)
    const [realTransits, setRealTransits] = useState<{ planets: string; type: string; aspect: string; system?: string; orb?: number }[]>([]);

    // Destination coordinates
    const [destLat, setDestLat] = useState<number>(0);
    const [destLon, setDestLon] = useState<number>(0);

    // ── Sun sign detection ─────────────────────────────────────────────────
    const sunSign = useMemo(() => {
        if (!birth.date) return null;
        const d = new Date(birth.date + "T00:00:00");
        return getSunSign(d.getMonth() + 1, d.getDate());
    }, [birth.date]);

    // ── Initialise from URL query params ──────────────────────────────────
    useEffect(() => {
        const s = searchParams.get("step");
        if (s) setStep(parseInt(s, 10));
        const n = searchParams.get("name");    if (n) setBirth(p => ({ ...p, name: n }));
        const d = searchParams.get("date");    if (d) setBirth(p => ({ ...p, date: d }));
        const t = searchParams.get("time");    if (t) setBirth(p => ({ ...p, time: t }));
        const latP = searchParams.get("lat");
        const lonP = searchParams.get("lon");
        const c = searchParams.get("city");    if (c) setBirth(p => ({ ...p, city: c }));
        const dest = searchParams.get("dest"); if (dest) setTravel(p => ({ ...p, destination: dest }));
        const td = searchParams.get("travelDate"); if (td) setTravel(p => ({ ...p, travelDate: td }));
        if (latP && lonP) setBirthCoords({ lat: parseFloat(latP), lon: parseFloat(lonP) });
    }, [searchParams]);

    // ── Submit natal chart ─────────────────────────────────────────────────
    const handleChartSubmit = useCallback(async () => {
        setLoadingChart(true);
        try {
            const res = await fetch("/api/natal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dob: birth.date, time: birth.time, birthplace: birth.city }),
            });
            const data = await res.json();
            setIsMock(data.mock === true);
            if (data.planets) {
                setNatalPlanets(data.planets);
                natalPlanetsRef.current = data.planets;
            }
            if (data.cusps && data.cusps.length === 12) {
                setNatalCusps(data.cusps);
                natalCuspsRef.current = data.cusps;
            }
            if (data.user_id) setUserId(data.user_id);
            if (data.utc_datetime) setBirthDateTimeUTC(data.utc_datetime);

            // Try geocoding the birth city
            fetch(`/api/geocode?city=${encodeURIComponent(birth.city)}`)
                .then(r => r.json())
                .then(geo => { if (geo?.lat) setBirthCoords({ lat: parseFloat(geo.lat), lon: parseFloat(geo.lon) }); })
                .catch(() => {});

            setDir(1);
            setStep(1);
        } catch {
            setIsMock(true);
        }
        setLoadingChart(false);
    }, [birth]);

    // ── Auto-analyze from URL ─────────────────────────────────────────────
    useEffect(() => {
        if (step >= 2 && !autoAnalyzedRef.current && birth.name && birth.date && travel.destination) {
            autoAnalyzedRef.current = true;
            if (natalPlanets.length === 0) {
                handleChartSubmit().then(() => {
                    setTimeout(() => handleAnalyze(), 200);
                });
            } else {
                handleAnalyze();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, birth, travel, natalPlanets]);

    // ── Analyze destination ────────────────────────────────────────────────
    const handleAnalyze = useCallback(async () => {
        setDir(1);
        setStep(2);
        setLoadingResults(true);
        setReading("");

        const uid = userId || "anon";
        const today = new Date().toISOString().split("T")[0];

        // Geocode destination
        const destGeo = await fetch(`/api/geocode?city=${encodeURIComponent(travel.destination)}`)
            .then(r => r.json())
            .catch(() => null);
        const dLat = destGeo?.lat ? parseFloat(destGeo.lat) : 25.0;
        const dLon = destGeo?.lon ? parseFloat(destGeo.lon) : 55.0;

        const [acRes, trRes, mundaneRes, relocatedRes] = await Promise.all([
            fetch("/api/astrocarto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: uid, destination: travel.destination }),
            }).then(r => r.json()).catch(() => ({ lines: [], mock: true })),

            fetch("/api/transits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: uid, start_date: travel.travelDate || today }),
            }).then(r => r.json()).catch(() => ({ windows: [], mock: true })),

            fetch("/api/mundane", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: travel.travelDate || today,
                    time: "12:00",
                    lat: dLat,
                    lon: dLon,
                    city: travel.destination,
                }),
            }).then(r => r.json()).catch(() => null),

            fetch("/api/natal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dob: birth.date,
                    time: birth.time,
                    birthplace: travel.destination,
                    originalBirthplace: birth.city,
                }),
            }).then(r => r.json()).catch(() => null),
        ]);

        if (mundaneRes && !mundaneRes.error) setMundane(mundaneRes as MundaneResult);
        if (relocatedRes?.cusps) {
            setRelocatedCusps(relocatedRes.cusps);
            setRelocatedPlanets(relocatedRes.planets);
        } else {
            setRelocatedCusps(null);
            setRelocatedPlanets(null);
        }
        setDestLat(dLat);
        setDestLon(dLon);

        const lines: PlanetLine[] = acRes.lines || [];
        // Store real transits early so window derivation can use them
        const transitData = trRes.raw?.major_aspects || [];
        setRealTransits(transitData);

        // Derive 12-month windows from real transit data when available,
        // falling back to static pattern only when no real data exists
        const windows: TravelWindow[] = transitData.length >= 3
            ? generateWindowsFromTransits(transitData, travel.travelDate || today)
            : trRes.windows?.length > 0
                ? trRes.windows
                : generateTravelWindows(travel.travelDate || today);
        setPlanetLines(lines);
        setTravelWindows(windows);
        setLoadingResults(false);

        // Compute chart ruler context
        const planets = natalPlanetsRef.current.length > 0 ? natalPlanetsRef.current : natalPlanets;
        const chartRulerCtx = computeChartRulerContext(
            planets, dLat, dLon,
            birthCoords?.lat || 0, birthCoords?.lon || 0,
            relocatedRes?.cusps || null,
            natalCuspsRef.current.length === 12 ? natalCuspsRef.current : null,
        );
        if (chartRulerCtx) {
            const h = chartRulerCtx.relocatedRulerHouse;
            const houseThemes: Record<number, string> = {
                1: 'Self & Identity', 2: 'Finances & Values', 3: 'Communication & Learning',
                4: 'Home & Roots', 5: 'Pleasure & Creativity', 6: 'Health & Service',
                7: 'Relationships & Partnerships', 8: 'Transformation & Shared Resources',
                9: 'Travel & Philosophy', 10: 'Career & Public Standing',
                11: 'Community & Aspirations', 12: 'Retreat & Spirituality',
            };
            const suffix = ['st','nd','rd'][h-1] || 'th';
            setChartRulerNote(`You become a ${chartRulerCtx.relocatedAscSign} rising here, ruled by ${chartRulerCtx.chartRuler}. Your chart ruler shifts to your ${h}${suffix} house — ${houseThemes[h] || 'Unknown'}.`);
        }

        // Fire /api/house-matrix
        setLoadingMatrix(true);
        setHouseMatrix(null);
        const finalCusps = relocatedRes?.cusps || computeRelocatedCusps(dLat, dLon);
        fetch("/api/house-matrix", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                natalPlanets: planets,
                relocatedCusps: finalCusps,
                acgLines: lines,
                transits: mundaneRes?.worldTransits || [],
                parans: mundaneRes?.parans || [],
                destLat: dLat,
                destLon: dLon,
            }),
        })
            .then(r => r.json())
            .then(data => {
                setHouseMatrix(data);
                setLoadingMatrix(false);
            })
            .catch(() => setLoadingMatrix(false));

        // Fire /api/summary
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
                transits: transitData,
                natalPlanets: planets,
                chartRuler: chartRulerCtx,
                worldTransits: (mundaneRes?.worldTransits || mundaneRes?.major_aspects || []).slice(0, 8),
                angularPlanets: (mundaneRes?.angularPlanets || mundaneRes?.angular_planets || []).slice(0, 4),
                travelWindows: windows?.slice(0, 6) || [],
            }),
        })
            .then(r => r.json())
            .then(data => {
                setSummary(data);
                setLoadingSummary(false);
                // The houseMatrix useEffect will set personal/collective correctly.
                // Only update total from aiScore if houseMatrix hasn't arrived yet.
                if (typeof data?.aiScore === 'number' && data.aiScore > 0 && !houseMatrix) {
                    const score = computeTripScore(lines, mundaneRes, data?.verdict ?? null, planets, dLat, dLon, transitData, windows, travel.travelDate);
                    setTripScore(score);
                }
            })
            .catch(() => {
                setLoadingSummary(false);
                const score = computeTripScore(lines, mundaneRes, null, planets, dLat, dLon, transitData, windows, travel.travelDate);
                setTripScore(score);
            });

        // ── Stream Gemini reading ──────────────────────────────────────────
        if (abortRef.current) abortRef.current.abort();
        const abort = new AbortController();
        abortRef.current = abort;

        // Build current ephemeris from mundane API data (dynamic, not hardcoded)
        const currentEphemeris = (mundaneRes?.planets || []).map(
            (p: { name: string; sign: string; degree: number }) => `${p.name} in ${p.sign} at ${p.degree.toFixed(1)}°`,
        );

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
                    transits: transitData,
                    natalPlanets: planets,
                    currentEphemeris,
                    worldTransits: mundaneRes?.worldTransits?.slice(0, 8) ?? [],
                    angularPlanets: mundaneRes?.angularPlanets ?? [],
                    chartRuler: chartRulerCtx,
                }),
                signal: abort.signal,
            });

            if (!readRes.ok || !readRes.body) {
                setReading("Unable to generate reading at this time.");
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
                setReading("Unable to generate reading at this time.");
            }
        }
    }, [birth, travel, userId, natalPlanets, sunSign, birthCoords]);

    // ── Sync scores directly from houseMatrix when it loads ──────────────────
    // personalScore (0-70) and collectiveScore (0-30) come straight from
    // the engine's 70/30 partition — no need to re-derive here.
    useEffect(() => {
        if (!houseMatrix) return;
        setTripScore(prev => ({
            ...prev,
            acg:    houseMatrix.personalScore,
            mundane: houseMatrix.collectiveScore,
            total:  houseMatrix.macroScore,
        }));
    }, [houseMatrix]);

    // ── Parse reading into sections ────────────────────────────────────────
    const readingMap = useMemo(() => {
        const map: Record<string, string> = {};
        if (!reading) return map;
        const sections = reading.split(/(?=##\s)/g).filter(Boolean);
        sections.forEach(sec => {
            const lines = sec.split("\n");
            const firstLine = lines[0].trim();
            const isHeader = firstLine.startsWith("## ");
            const headerText = isHeader ? firstLine.replace(/^##\s+/, "").trim() : "Introduction";
            const body = isHeader ? lines.slice(1).join("\n").trim() : sec.trim();

            if (headerText.includes("Verdict") || headerText.includes("Score")) map["Verdict"] = body;
            else if (headerText.includes("Permanent Map") || headerText.includes("ACG")) map["AstroMap"] = body;
            else if (headerText.includes("Collective") || headerText.includes("Mundane") || headerText.includes("World Sky")) map["Mundane"] = body;
            else if (headerText.includes("Personal Timing") || headerText.includes("Transit")) map["Personal"] = body;
            else if (headerText.includes("Relocated Chart") || headerText.includes("Relocation")) map["Relocation"] = body;
            else if (headerText.includes("Country")) map["Country"] = body;
            else map[headerText] = body;
        });
        return map;
    }, [reading]);

    // ── Navigation ─────────────────────────────────────────────────────────
    const back = useCallback(() => { setDir(-1); setStep((s) => Math.max(s - 1, 0)); }, []);
    const canNext0 = birth.name && birth.date && birth.time && birth.city;
    const canNext1 = !!travel.destination;

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════
    return (
        <>
            <div className={styles.atmosphericBg} aria-hidden="true">
                <div className={styles.radialGlow} />
                <div className={styles.grainOverlay} />
            </div>
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
                                    <h2 className={styles.stepHeading}>Your <em>birth</em> details</h2>
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
                                    <h2 className={styles.stepHeading}>Where are you <em>going?</em></h2>
                                    <p>Enter your destination and a rough target date — we'll surface the best windows around that period and the full 12-month picture.</p>
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

                                {/* ════ HERO: Score + Dates ════ */}
                                <TripScoreCard
                                    summary={summary}
                                    loading={loadingSummary}
                                    destination={travel.destination}
                                    travelDate={travel.travelDate}
                                    tripScore={houseMatrix ? houseMatrix.macroScore : tripScore.total}
                                    acgScore={tripScore.acg}
                                    mundaneScore={tripScore.mundane}
                                    readingMap={readingMap}
                                />

                                {/* ════ HOUSE PLACEMENTS ════ */}
                                <HouseMatrixCard matrix={houseMatrix} loading={loadingMatrix} />

                                {/* ════ TRAVEL WINDOWS (expanded) ════ */}
                                <ExpandableCard title="12-Month Windows" tag="Timing" defaultOpen={true}
                                    summary={`${travelWindows.filter(w => w.quality === 'excellent').length} excellent months`}
                                    description="Month-by-month forecast showing when transits favor travel to this destination and when to exercise caution.">
                                    <TravelWindowsCard
                                        windows={travelWindows}
                                        travelDate={travel.travelDate}
                                    />
                                </ExpandableCard>

                                {/* ════ DETAIL SECTIONS (all collapsed) ════ */}

                                {/* Astrocartography Map */}
                                {!loadingResults && (
                                    <ExpandableCard title="ACG Map" tag="Map"
                                        summary={`${planetLines.length} lines near ${travel.destination}`}
                                        description="Visual map of your permanent planetary lines — where each planet's energy is strongest on Earth, fixed to the moment you were born.">
                                        <div className={styles.mapContainer}>
                                            <AstroMap
                                                destination={travel.destination}
                                                planetLines={planetLines}
                                                natalPlanets={natalPlanets.length > 0 ? natalPlanets : undefined}
                                                birthDateTimeUTC={birthDateTimeUTC}
                                                birthLon={birthCoords?.lon}
                                            />
                                        </div>
                                    </ExpandableCard>
                                )}

                                {/* Natal ACG Lines */}
                                {planetLines.length > 0 && (
                                    <ExpandableCard title="Natal ACG Lines" tag="Natal ACG"
                                        summary={`${planetLines.filter(l => l.distance_km <= 300).length} lines within 300 km`}
                                        description="Planetary lines closest to your destination. The nearer a line, the stronger its influence on your experience there.">
                                        <AcgLinesCard
                                            planetLines={planetLines}
                                            natalPlanets={(natalPlanetsRef.current.length > 0 ? natalPlanetsRef.current : natalPlanets) as NatalPlanet[]}
                                            birthCity={birth.city}
                                            destination={travel.destination}
                                        />
                                    </ExpandableCard>
                                )}

                                {/* Geodetic Zones */}
                                {(destLon || destLat) && (
                                    <ExpandableCard title="Geodetic Zones" tag="Geodetic" id="geodeticZoneCard"
                                        summary={`Collective zodiac at ${Math.round(destLon)}°`}
                                        description="Earth’s fixed zodiac grid based on longitude. These collective energies affect everyone at this location, not just you.">
                                        <GeodeticZoneCard
                                            destLon={destLon || 55}
                                            destLat={destLat || 25}
                                            mundanePlanets={mundane?.planets as { name: string; degree: number; sign: string }[] | undefined}
                                        />
                                    </ExpandableCard>
                                )}

                                {/* World Sky / Mundane */}
                                {mundane && (
                                    <ExpandableCard title="World Sky" tag="Mundane"
                                        summary={`${mundane.worldTransits.length} transits · ${mundane.angularPlanets.length} angular`}
                                        description="Global planetary aspects active on your travel date. Tense aspects (squares, oppositions) can bring disruption; harmonious ones (trines, sextiles) bring ease.">
                                        <WorldSkyCard
                                            worldTransits={mundane.worldTransits}
                                            angularPlanets={mundane.angularPlanets}
                                            travelDate={travel.travelDate}
                                            destination={travel.destination}
                                        />
                                    </ExpandableCard>
                                )}

                                {/* Country Chart */}
                                {mundane && (
                                    <ExpandableCard title="Country Natal Chart" tag="Country" id="countryChartCard"
                                        description="The national chart of your destination country. When global transits hit a country’s natal planets, that nation feels it most.">
                                        <CountryChartCard
                                            destination={travel.destination}
                                            worldTransits={mundane.worldTransits}
                                        />
                                    </ExpandableCard>
                                )}

                                {/* Personal Transits */}
                                {realTransits.length > 0 && (
                                    <ExpandableCard title="Personal Transits" tag="Personal"
                                        summary={`${realTransits.length} active`}
                                        description="Transits hitting your natal chart right now. These are personal to you and shape your subjective experience at any location.">
                                        <ActiveTransitsCard
                                            transits={realTransits}
                                            travelDate={travel.travelDate}
                                        />
                                    </ExpandableCard>
                                )}

                                {/* Natal Chart */}
                                <ExpandableCard title="Natal Chart" tag="Birth Chart"
                                    summary={birth.city}
                                    description="Your birth chart — the foundation of every reading. Planet positions and house placements are fixed at your time of birth.">
                                    <div className={styles.natalChartWrap}>
                                        <NatalChart
                                            natalPlanets={(natalPlanetsRef.current.length > 0 ? natalPlanetsRef.current : natalPlanets) as NatalPlanet[]}
                                            sunSign={sunSign?.name}
                                            name={birth.name}
                                            birthDate={birth.date}
                                            birthTime={birth.time}
                                            birthPlace={birth.city}
                                            cusps={natalCuspsRef.current.length === 12 ? natalCuspsRef.current : natalCusps.length === 12 ? natalCusps : undefined}
                                        />
                                    </div>
                                </ExpandableCard>

                                {/* Relocated Chart */}
                                {travel.destination && (
                                    <ExpandableCard title={`Relocated Chart · ${travel.destination}`} tag="Relocated"
                                        summary={chartRulerNote || undefined}
                                        description="How your chart axes and house cusps shift at this destination. A new rising sign means a different planetary ruler governs your experience there.">
                                        <div className={styles.natalChartWrap}>
                                            {(() => {
                                                const basePlanets = (natalPlanetsRef.current.length > 0 ? natalPlanetsRef.current : natalPlanets) as NatalPlanet[];
                                                const finalCusps = relocatedCusps || computeRelocatedCusps(destLat || 25, destLon || 55);
                                                const planetsWithRelocatedHouses = basePlanets.map(p => {
                                                    let house = 1;
                                                    for (let h = 0; h < 12; h++) {
                                                        const start = finalCusps[h];
                                                        const end = finalCusps[(h + 1) % 12];
                                                        if (end > start) {
                                                            if (p.longitude >= start && p.longitude < end) { house = h + 1; break; }
                                                        } else {
                                                            if (p.longitude >= start || p.longitude < end) { house = h + 1; break; }
                                                        }
                                                    }
                                                    return { ...p, house };
                                                });
                                                return (
                                                    <NatalChart
                                                        natalPlanets={planetsWithRelocatedHouses}
                                                        sunSign={sunSign?.name}
                                                        name={birth.name}
                                                        birthDate={birth.date}
                                                        birthTime={birth.time}
                                                        birthPlace={travel.destination}
                                                        cusps={finalCusps}
                                                    />
                                                );
                                            })()}
                                        </div>
                                    </ExpandableCard>
                                )}

                                {/* Loading indicator */}
                                {loadingResults && (
                                    <div className={styles.mapPlaceholder}>
                                        <Loader2 size={28} className={styles.spin} />
                                        <p>Computing…</p>
                                    </div>
                                )}

                                <div className={styles.actions}>
                                    <button className="btn btn-secondary" onClick={back}>
                                        <ArrowLeft size={16} /> Adjust
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

export default function FlowPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#0b0c10" }} />}>
            <FlowPageInner />
        </Suspense>
    );
}
