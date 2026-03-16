"use client";

import { useState, useCallback } from "react";
import styles from "./backtest.module.css";
import PlanetIcon from "../components/PlanetIcon";
import { PLANET_COLORS } from "../lib/planet-data";

// ─── Types ─────────────────────────────────────────────────────────────────

interface WorldTransit {
    p1: string; p2: string; aspect: string; symbol: string;
    orb: number; p1Sign: string; p1Deg: number; p2Sign: string; p2Deg: number;
    applying: boolean; isTense: boolean;
}

interface AngularPlanet {
    planet: string; angle: string; mcLonDeg: number;
    distFromLocation: number; sign: string; degree: number;
}

interface Paran {
    p1: string; p2: string; type: string; lat: number;
}

interface Planet {
    name: string; longitude: number; sign: string; degree: number; ra: number;
}

interface MundaneResult {
    date: string; time: string;
    location: { lat: number; lon: number; city: string };
    planets: Planet[];
    worldTransits: WorldTransit[];
    angularPlanets: AngularPlanet[];
    parans: Paran[];
    meta: { RAMC: number; planetCount: number; aspectCount: number };
}

// ─── Known backtest cases ───────────────────────────────────────────────────

const BACKTEST_PRESETS = [
    {
        label: "Mars □ Uranus — Dubai, 27 Feb 2026",
        description: "Expert: Mars in Aquarius squares Uranus in Taurus (27°42'). Signifies conflicts, violence, disruptions to land/territory/collective unrest.",
        date: "2026-02-27",
        time: "12:00",
        city: "Dubai, UAE",
        lat: 25.2048,
        lon: 55.2708,
        expertText: `Mars in Aquarius squares Uranus (27°42 Taurus) on February 27 till March 2. A tense, potentially volatile aspect. Mars-Uranus squares are known for sudden, disruptive events — unexpected conflicts, civil unrest, territorial disputes, and volatile energy tied to collective movements and land. In Aquarius/Taurus (fixed signs), the tension is especially stubborn and slow to resolve. Mars rules aggression and assertion; Uranus rules shocks and sudden change. In Dubai, this may manifest as heightened geopolitical tensions nearby (the Middle East region), disruptions to real estate/land markets, or sudden shifts in collective mood.`,
    },
];

// ─── Aspect quality config ──────────────────────────────────────────────────

const ASPECT_COLORS: Record<string, string> = {
    Square: "#f59e0b",
    Opposition: "#ef4444",
    Conjunction: "#c9a96e",
    Trine: "#10b981",
    Sextile: "#06b6d4",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function BacktestPage() {
    const [date, setDate] = useState("2026-02-27");
    const [time, setTime] = useState("12:00");
    const [city, setCity] = useState("Dubai, UAE");
    const [lat, setLat] = useState(25.2048);
    const [lon, setLon] = useState(55.2708);
    const [expertText, setExpertText] = useState(BACKTEST_PRESETS[0].expertText);
    const [presetDesc, setPresetDesc] = useState(BACKTEST_PRESETS[0].description);

    const [result, setResult] = useState<MundaneResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [geocoding, setGeocoding] = useState(false);

    // Geocode city string to lat/lon
    const geocodeCity = useCallback(async (cityStr: string) => {
        setGeocoding(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityStr)}&format=json&limit=1`,
                { headers: { "User-Agent": "AstroNat-Travel-App/1.0" } }
            );
            const data = await res.json();
            if (data?.[0]) {
                setLat(parseFloat(data[0].lat));
                setLon(parseFloat(data[0].lon));
            }
        } catch { /* silent */ }
        setGeocoding(false);
    }, []);

    const loadPreset = useCallback((p: typeof BACKTEST_PRESETS[0]) => {
        setDate(p.date);
        setTime(p.time);
        setCity(p.city);
        setLat(p.lat);
        setLon(p.lon);
        setExpertText(p.expertText);
        setPresetDesc(p.description);
        setResult(null);
    }, []);

    const runBacktest = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/mundane", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date, time, lat, lon, city }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data);
        } catch (e) {
            setError(String(e));
        }
        setLoading(false);
    }, [date, time, lat, lon, city]);

    return (
        <main className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Mundane Backtest</h1>
                <p className={styles.subtitle}>
                    Run any date + location through the system and compare against an expert interpretation.
                </p>
            </div>

            {/* ── Presets ─────────────────────────────────────────────────── */}
            <section className={styles.presets}>
                {BACKTEST_PRESETS.map((p) => (
                    <button key={p.label} className={styles.presetBtn} onClick={() => loadPreset(p)}>
                        <span className={styles.presetLabel}>{p.label}</span>
                        <span className={styles.presetDesc}>{p.description}</span>
                    </button>
                ))}
            </section>

            {/* ── Inputs ──────────────────────────────────────────────────── */}
            <section className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Date</label>
                    <input
                        id="backtest-date"
                        type="date"
                        className={styles.input}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Time (UTC)</label>
                    <input
                        id="backtest-time"
                        type="time"
                        className={styles.input}
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>City / Location</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                            id="backtest-city"
                            type="text"
                            className={styles.input}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            onBlur={(e) => geocodeCity(e.target.value)}
                            placeholder="Dubai, UAE"
                        />
                        {geocoding && <span className={styles.geocodingSpinner}>⟳</span>}
                    </div>
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Lat / Lon</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                            id="backtest-lat"
                            type="number" step="0.0001"
                            className={styles.input}
                            value={lat}
                            onChange={(e) => setLat(parseFloat(e.target.value))}
                        />
                        <input
                            id="backtest-lon"
                            type="number" step="0.0001"
                            className={styles.input}
                            value={lon}
                            onChange={(e) => setLon(parseFloat(e.target.value))}
                        />
                    </div>
                </div>
            </section>

            <button
                id="backtest-run"
                className={styles.runBtn}
                onClick={runBacktest}
                disabled={loading}
            >
                {loading ? "Computing…" : "▶ Run Backtest"}
            </button>

            {error && <p className={styles.error}>Error: {error}</p>}

            {/* ── Results ─────────────────────────────────────────────────── */}
            {result && (
                <div className={styles.results}>
                    {/* Meta bar */}
                    <div className={styles.metaBar}>
                        <span>📅 {result.date} {result.time} UTC</span>
                        <span>📍 {result.location.city} ({result.location.lat.toFixed(2)}°N, {result.location.lon.toFixed(2)}°E)</span>
                        <span>RAMC {result.meta.RAMC}°</span>
                        <span>{result.meta.aspectCount} aspects</span>
                    </div>

                    <div className={styles.columns}>
                        {/* LEFT: System output */}
                        <div className={styles.column}>
                            <h2 className={styles.colTitle}>System Analysis</h2>

                            {/* World transits */}
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Sky-to-Sky Aspects (World Transits)</h3>
                                {result.worldTransits.length === 0 ? (
                                    <p className={styles.empty}>No major aspects within orb on this date.</p>
                                ) : (
                                    <div className={styles.transitList}>
                                        {result.worldTransits.map((t, i) => (
                                            <div key={i} className={`${styles.transitRow} ${t.isTense ? styles.tense : styles.easy}`}>
                                                <div className={styles.transitPlanets}>
                                                    <span className={styles.transitP1} style={{ color: PLANET_COLORS[t.p1] || "#fff" }}>
                                                        <PlanetIcon planet={t.p1} color={PLANET_COLORS[t.p1] || "#fff"} size={14} />
                                                        {t.p1}
                                                    </span>
                                                    <span
                                                        className={styles.aspectSymbol}
                                                        style={{ color: ASPECT_COLORS[t.aspect] || "#aaa" }}
                                                        title={t.aspect}
                                                    >
                                                        {t.symbol}
                                                    </span>
                                                    <span className={styles.transitP2} style={{ color: PLANET_COLORS[t.p2] || "#fff" }}>
                                                        <PlanetIcon planet={t.p2} color={PLANET_COLORS[t.p2] || "#fff"} size={14} />
                                                        {t.p2}
                                                    </span>
                                                </div>
                                                <div className={styles.transitMeta}>
                                                    <span className={styles.transitAspect}
                                                        style={{ color: ASPECT_COLORS[t.aspect] || "#aaa" }}>
                                                        {t.aspect}
                                                    </span>
                                                    <span className={styles.orb}>{t.orb.toFixed(2)}°</span>
                                                    <span className={styles.applyTag}>{t.applying ? "APL" : "SEP"}</span>
                                                </div>
                                                <div className={styles.transitPositions}>
                                                    {t.p1} {t.p1Deg}° {t.p1Sign} — {t.p2} {t.p2Deg}° {t.p2Sign}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Angular planets */}
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Angular Planets over {city}</h3>
                                {result.angularPlanets.length === 0 ? (
                                    <p className={styles.empty}>No transiting planets are angular over this location (±3° lon).</p>
                                ) : (
                                    <div className={styles.angularList}>
                                        {result.angularPlanets.map((a, i) => (
                                            <div key={i} className={styles.angularRow}>
                                                <PlanetIcon planet={a.planet} color={PLANET_COLORS[a.planet] || "#fff"} size={16} />
                                                <span style={{ color: PLANET_COLORS[a.planet] || "#fff", fontWeight: 600 }}>{a.planet}</span>
                                                <span className={styles.angleTag}>{a.angle}</span>
                                                <span className={styles.angularSign}>{a.degree}° {a.sign}</span>
                                                <span className={styles.angularDist}>~{a.distFromLocation} km</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Parans */}
                            {result.parans.length > 0 && (
                                <section className={styles.section}>
                                    <h3 className={styles.sectionTitle}>Paran Crossings near {lat.toFixed(1)}°N</h3>
                                    <div className={styles.paranList}>
                                        {result.parans.map((p, i) => (
                                            <div key={i} className={styles.paranRow}>
                                                <span style={{ color: PLANET_COLORS[p.p1] || "#fff" }}>{p.p1}</span>
                                                <span className={styles.paranType}>{p.type}</span>
                                                <span style={{ color: PLANET_COLORS[p.p2] || "#fff" }}>{p.p2}</span>
                                                <span className={styles.paranLat}>at {p.lat}°</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Raw planet positions */}
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Transit Planet Positions</h3>
                                <div className={styles.planetGrid}>
                                    {result.planets.map((p) => (
                                        <div key={p.name} className={styles.planetCell}>
                                            <PlanetIcon planet={p.name} color={PLANET_COLORS[p.name] || "#aaa"} size={13} />
                                            <span style={{ color: PLANET_COLORS[p.name] || "#ccc", fontSize: "0.78rem" }}>{p.name}</span>
                                            <span className={styles.planetPos}>{p.degree}° {p.sign}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* RIGHT: Expert interpretation */}
                        <div className={styles.column}>
                            <h2 className={styles.colTitle}>Expert Interpretation</h2>
                            {presetDesc && (
                                <div className={styles.presetNote}>{presetDesc}</div>
                            )}
                            <textarea
                                id="backtest-expert"
                                className={styles.expertArea}
                                value={expertText}
                                onChange={(e) => setExpertText(e.target.value)}
                                placeholder="Paste an expert astrologer's interpretation here for comparison..."
                                rows={14}
                            />

                            {/* Comparison notes */}
                            <div className={styles.comparisonBox}>
                                <h3 className={styles.sectionTitle}>Gap Analysis</h3>
                                {(() => {
                                    const marsUranus = result.worldTransits.find(
                                        t => (t.p1 === "Mars" && t.p2 === "Uranus") ||
                                             (t.p1 === "Uranus" && t.p2 === "Mars")
                                    );
                                    const angularMars = result.angularPlanets.find(a => a.planet === "Mars");
                                    const angularUranus = result.angularPlanets.find(a => a.planet === "Uranus");

                                    return (
                                        <div className={styles.gaps}>
                                            <div className={`${styles.gapRow} ${marsUranus ? styles.gapFound : styles.gapMissed}`}>
                                                <span className={styles.gapIcon}>{marsUranus ? "✅" : "❌"}</span>
                                                <div>
                                                    <strong>Mars □ Uranus world transit</strong>
                                                    {marsUranus
                                                        ? <span> — Found! {marsUranus.aspect} {marsUranus.orb.toFixed(2)}° orb ({marsUranus.applying ? "Applying" : "Separating"}). {marsUranus.p1} {marsUranus.p1Deg}°{marsUranus.p1Sign} □ {marsUranus.p2} {marsUranus.p2Deg}°{marsUranus.p2Sign}</span>
                                                        : <span> — Not detected. Check if orb exceeds threshold or date is outside exact aspect window.</span>
                                                    }
                                                </div>
                                            </div>
                                            <div className={`${styles.gapRow} ${angularMars ? styles.gapFound : styles.gapMissed}`}>
                                                <span className={styles.gapIcon}>{angularMars ? "✅" : "❌"}</span>
                                                <div>
                                                    <strong>Mars angular over {city}</strong>
                                                    {angularMars
                                                        ? <span> — {angularMars.angle} line passes ~{angularMars.distFromLocation} km away</span>
                                                        : <span> — Mars not angular here (lines are elsewhere on the globe this date)</span>
                                                    }
                                                </div>
                                            </div>
                                            <div className={`${styles.gapRow} ${angularUranus ? styles.gapFound : styles.gapMissed}`}>
                                                <span className={styles.gapIcon}>{angularUranus ? "✅" : "❌"}</span>
                                                <div>
                                                    <strong>Uranus angular over {city}</strong>
                                                    {angularUranus
                                                        ? <span> — {angularUranus.angle} line passes ~{angularUranus.distFromLocation} km away</span>
                                                        : <span> — Uranus not angular here on this date</span>
                                                    }
                                                </div>
                                            </div>
                                            <div className={styles.gapNote}>
                                                <strong>What the current system would miss:</strong> The transit module only
                                                reports sky→<em>natal</em> aspects (transiting planet aspecting YOUR birth planet).
                                                The Mars □ Uranus event above is a <em>world transit</em> — sky→sky — and would
                                                only appear in your reading if you happened to have a natal planet at 27°
                                                fixed signs. This backtest confirms the gap.
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
