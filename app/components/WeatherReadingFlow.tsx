"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, X, Droplets, Flame, Mountain, Wind, Users2, Sparkles, Heart, Rocket, Leaf, Coffee, Handshake } from "lucide-react";
import CityAutocomplete from "./CityAutocomplete";
import { WEATHER_GOALS, formatAngle } from "@/app/lib/geodetic-weather-types";
import { mockFixedAngles } from "@/app/lib/geodetic-weather-mock";

interface PickedCity {
    label: string;
    lat: number;
    lon: number;
}

const WINDOW_OPTIONS: Array<{ days: 7 | 30 | 90; label: string; sub: string }> = [
    { days: 7, label: "7 days", sub: "next week. short-term triggers." },
    { days: 30, label: "30 days", sub: "the month ahead. most reading types." },
    { days: 90, label: "90 days", sub: "the quarter. catches station cycles and eclipse windows." },
];

const GOAL_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
    // mundane
    floods: Droplets,
    fires: Flame,
    quakes: Mountain,
    atmospheric: Wind,
    civil: Users2,
    all: Sparkles,
    // personal
    rest: Leaf,
    connect: Heart,
    launch: Rocket,
    retreat: Coffee,
    reconcile: Handshake,
};

const GOAL_COLORS: Record<string, string> = {
    // mundane
    floods: "var(--color-y2k-blue)",
    fires: "var(--color-spiced-life)",
    quakes: "var(--gold)",
    atmospheric: "var(--color-acqua)",
    civil: "var(--color-spiced-life)",
    all: "var(--sage)",
    // personal
    rest: "var(--sage)",
    connect: "var(--color-spiced-life)",
    launch: "var(--color-y2k-blue)",
    retreat: "var(--color-acqua)",
    reconcile: "var(--gold)",
};

/**
 * Personal-intent goals — life-domain questions driving travel timing.
 * Distinct from WEATHER_GOALS which are mundane/physical categories.
 */
const PERSONAL_GOALS: Array<{ id: string; label: string; sub: string }> = [
    { id: "rest", label: "Rest & recover", sub: "Downweight Mars/Uranus on angles, favour Moon/Venus on IC" },
    { id: "connect", label: "Meet people", sub: "Venus/Jupiter on Descendant, soft aspects to partnership angle" },
    { id: "launch", label: "Launch or announce", sub: "Sun/Mercury on Midheaven, avoid Mercury retrograde" },
    { id: "retreat", label: "Quiet retreat", sub: "12th house activations, Neptune on angles" },
    { id: "reconcile", label: "Reconcile / repair", sub: "Venus returns, soft aspects to personal planets" },
    { id: "all", label: "Just show everything", sub: "No filter — surface every layer that fires" },
];

const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

export default function WeatherReadingFlow() {
    const router = useRouter();
    const [dir, setDir] = useState(1);
    const [screen, setScreen] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    /**
     * Intent gate added step-0. Two separate products share the same engine:
     *   "personal" — relocation + travel timing, needs the user's natal chart
     *   "mundane"  — impersonal earth-weather report (floods, fires, etc.)
     */
    const [intent, setIntent] = useState<"personal" | "mundane" | null>(null);
    const [cities, setCities] = useState<PickedCity[]>([]);
    const [currentCityInput, setCurrentCityInput] = useState("");
    const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);
    const [goal, setGoal] = useState<string | null>(null);

    const total = 4;
    const go = (n: number) => {
        setDir(n > screen ? 1 : -1);
        setScreen(n);
    };
    const next = () => go(Math.min(screen + 1, 3));
    const back = () => go(Math.max(screen - 1, 0));

    const startDate = useMemo(() => new Date(), []);
    const endDate = useMemo(() => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + windowDays);
        return d;
    }, [startDate, windowDays]);

    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const addCity = (s: { label: string; lat: number; lon: number }) => {
        if (cities.find((c) => c.label === s.label)) return;
        if (cities.length >= 3) return;
        setCities([...cities, { label: s.label, lat: s.lat, lon: s.lon }]);
        setCurrentCityInput("");
    };

    const removeCity = (label: string) => {
        setCities(cities.filter((c) => c.label !== label));
    };

    const canGenerate = cities.length > 0;

    const handleGenerate = async () => {
        setLoading(true);
        setErrorMsg("");
        try {
            const res = await fetch("/api/readings/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    destination: cities[0].label,
                    travelType: "trip",
                    readingCategory: "geodetic-weather",
                    targetLat: cities[0].lat,
                    targetLon: cities[0].lon,
                    travelDate: fmt(startDate),
                    goals: goal ? [goal] : [],
                    weather: {
                        cities,
                        windowDays,
                        startDate: fmt(startDate),
                        endDate: fmt(endDate),
                        goalFilter: goal,
                        intent: intent ?? "personal",
                    },
                }),
            });
            const data = await res.json();
            if (data.readingId) {
                router.push(`/reading/${data.readingId}?type=weather`);
            } else {
                setErrorMsg(data.message ? `${data.error}: ${data.message}` : data.error || "Unknown error.");
                setLoading(false);
            }
        } catch (err: any) {
            setErrorMsg(err.message || "Failed to reach generation service.");
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "75vh", overflow: "hidden", position: "relative" }}>
            {/* SLOOP SCRIPT overlap — one per wizard surface */}
            <span
                aria-hidden
                style={{
                    position: "absolute",
                    fontFamily: "var(--font-display-alt-2)",
                    fontSize: "clamp(8rem, 16vw, 14rem)",
                    color: "var(--color-y2k-blue)",
                    opacity: 0.12,
                    top: "8%",
                    right: "-4%",
                    pointerEvents: "none",
                    lineHeight: 0.7,
                    zIndex: 0,
                }}
            >
                watching
            </span>

            <AnimatePresence mode="wait" custom={dir}>
                {screen === 0 && (
                    <motion.div
                        key="intent"
                        custom={dir}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        style={{ flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}
                    >
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.25rem, 3vw, 3rem)", overflow: "auto" }}>
                            <div style={{ maxWidth: "540px", width: "100%" }}>
                                <h5 style={{ marginBottom: "0.35rem" }}>Step 1 of {total}</h5>
                                <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--text-primary)", lineHeight: 0.9, marginBottom: "0.5rem", textTransform: "uppercase" }}>
                                    What do you want <span style={{ color: "var(--color-y2k-blue)" }}>to know?</span>
                                </h2>
                                <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                                    Two separate readings share one engine.
                                </p>

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.5rem" }}>
                                    {[
                                        {
                                            id: "personal" as const,
                                            title: "What this place does to me",
                                            sub: "Travel timing. Chart-ruler relocation, best dates, personal lines. Needs your birth chart.",
                                        },
                                        {
                                            id: "mundane" as const,
                                            title: "What the sky is doing here",
                                            sub: "Earth-weather forecast. Floods, fires, seismic, atmospheric pressure. No personal chart required.",
                                        },
                                    ].map((opt) => {
                                        const active = intent === opt.id;
                                        return (
                                            <motion.button
                                                key={opt.id}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setIntent(opt.id)}
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "flex-start",
                                                    gap: "0.4rem",
                                                    padding: "1rem 1.25rem",
                                                    textAlign: "left",
                                                    background: active ? "var(--color-acqua)" : "var(--surface)",
                                                    color: active ? "var(--color-charcoal)" : "var(--text-primary)",
                                                    border: `1px solid ${active ? "var(--color-y2k-blue)" : "var(--surface-border)"}`,
                                                    clipPath: "var(--cut-md)",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <div style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1.05rem, 2vw, 1.25rem)", lineHeight: 1.1, textTransform: "uppercase" }}>
                                                    {opt.title}
                                                </div>
                                                <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", opacity: active ? 1 : 0.85, lineHeight: 1.4, fontWeight: 300 }}>
                                                    {opt.sub}
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button
                                        className="btn btn-primary"
                                        disabled={!intent}
                                        style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--shape-asymmetric-md)", opacity: intent ? 1 : 0.35 }}
                                        onClick={next}
                                    >
                                        Continue <ArrowRight size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {screen === 1 && (
                    <motion.div
                        key="where"
                        custom={dir}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        style={{ flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}
                    >
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.25rem, 3vw, 3rem)", overflow: "auto" }}>
                            <div style={{ maxWidth: "540px", width: "100%" }}>
                                <h5 style={{ marginBottom: "0.35rem" }}>Step 2 of {total}</h5>
                                <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--text-primary)", lineHeight: 0.9, marginBottom: "0.5rem", textTransform: "uppercase" }}>
                                    Where should <span style={{ color: "var(--color-spiced-life)" }}>the sky watch?</span>
                                </h2>
                                <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                                    Pick a city — or up to 3 to compare.
                                </p>

                                {cities.length < 3 && (
                                    <CityAutocomplete
                                        id="weather-city"
                                        label={cities.length === 0 ? "City" : "Add another place"}
                                        value={currentCityInput}
                                        onChange={setCurrentCityInput}
                                        onSelect={addCity}
                                        placeholder="e.g. Valencia, Spain"
                                    />
                                )}

                                {cities.length > 0 && (
                                    <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {cities.map((c) => {
                                            const fa = mockFixedAngles(c.lat, c.lon);
                                            return (
                                                <div
                                                    key={c.label}
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        padding: "0.75rem 1rem",
                                                        border: "1px solid var(--color-y2k-blue)",
                                                        background: "rgba(4,86,251,0.06)",
                                                        clipPath: "var(--cut-md)",
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                                                            {c.label}
                                                        </div>
                                                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.12em", color: "var(--color-y2k-blue)", marginTop: "0.2rem", textTransform: "uppercase" }}>
                                                            MC {formatAngle(fa.mc)} · ASC {formatAngle(fa.asc)}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeCity(c.label)}
                                                        aria-label={`Remove ${c.label}`}
                                                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: "0.2rem" }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {cities.length >= 3 && (
                                    <p style={{ marginTop: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                                        Max 3 places. Remove one to swap.
                                    </p>
                                )}

                                <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.5rem" }}>
                                    <button className="btn btn-secondary" onClick={back} style={{ padding: "0.75rem 1.25rem" }}>
                                        <ArrowLeft size={14} /> Back
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        disabled={cities.length === 0}
                                        style={{ flex: 1, justifyContent: "center", padding: "0.75rem", borderRadius: "var(--shape-asymmetric-md)", opacity: cities.length === 0 ? 0.35 : 1 }}
                                        onClick={next}
                                    >
                                        Continue <ArrowRight size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {screen === 2 && (
                    <motion.div
                        key="window"
                        custom={dir}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        style={{ flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}
                    >
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.25rem, 3vw, 3rem)", overflow: "auto" }}>
                            <div style={{ maxWidth: "540px", width: "100%" }}>
                                <h5 style={{ marginBottom: "0.35rem" }}>Step 3 of {total}</h5>
                                <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--text-primary)", lineHeight: 0.9, marginBottom: "0.5rem", textTransform: "uppercase" }}>
                                    For how many <span style={{ color: "var(--color-y2k-blue)" }}>days ahead?</span>
                                </h2>
                                <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                                    Pick the forecast window. The engine snapshots the sky once per day.
                                </p>

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem" }}>
                                    {WINDOW_OPTIONS.map((w) => {
                                        const active = windowDays === w.days;
                                        return (
                                            <motion.button
                                                key={w.days}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setWindowDays(w.days)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "1rem",
                                                    padding: "1rem 1.25rem",
                                                    textAlign: "left",
                                                    background: active ? "var(--color-acqua)" : "var(--surface)",
                                                    color: active ? "var(--color-charcoal)" : "var(--text-primary)",
                                                    border: `1px solid ${active ? "var(--color-y2k-blue)" : "var(--surface-border)"}`,
                                                    clipPath: "var(--cut-md)",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <div style={{ fontFamily: "var(--font-primary)", fontSize: "2rem", lineHeight: 0.9, letterSpacing: "-0.02em", textTransform: "uppercase", minWidth: "5.5rem" }}>
                                                    {w.days}d
                                                </div>
                                                <div style={{ fontFamily: "var(--font-secondary)", fontSize: "0.9rem", opacity: active ? 1 : 0.8, lineHeight: 1.3 }}>
                                                    {w.sub}
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "1.5rem" }}>
                                    {fmt(startDate)} → {fmt(endDate)} · {windowDays} daily snapshots
                                </div>

                                <div style={{ display: "flex", gap: "0.6rem" }}>
                                    <button className="btn btn-secondary" onClick={back} style={{ padding: "0.75rem 1.25rem" }}>
                                        <ArrowLeft size={14} /> Back
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={next}
                                        style={{ flex: 1, justifyContent: "center", padding: "0.75rem", borderRadius: "var(--shape-asymmetric-md)" }}
                                    >
                                        Continue <ArrowRight size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {screen === 3 && (
                    <motion.div
                        key="goal"
                        custom={dir}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        style={{ flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}
                    >
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.25rem, 3vw, 3rem)", overflow: "auto" }}>
                            <div style={{ maxWidth: "560px", width: "100%" }}>
                                <h5 style={{ marginBottom: "0.35rem" }}>Step 4 of {total}</h5>
                                <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "var(--text-primary)", lineHeight: 0.9, marginBottom: "0.5rem", textTransform: "uppercase" }}>
                                    Anything <span style={{ color: "var(--gold)" }}>specific</span> to watch for?
                                </h2>
                                <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                                    Optional. Filters which layers get surfaced in the reading — the engine still computes everything.
                                </p>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.5rem" }}>
                                    {(intent === "mundane" ? WEATHER_GOALS : PERSONAL_GOALS).map(({ id, label, sub }) => {
                                        const Icon = GOAL_ICONS[id] ?? Sparkles;
                                        const color = GOAL_COLORS[id];
                                        const active = goal === id;
                                        return (
                                            <motion.button
                                                key={id}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => setGoal(active ? null : id)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: "0.5rem",
                                                    padding: "0.65rem 0.75rem",
                                                    textAlign: "left",
                                                    background: active ? `${color}15` : "var(--surface)",
                                                    border: `1px solid ${active ? color : "var(--surface-border)"}`,
                                                    borderRadius: active ? "var(--shape-asymmetric-md)" : "var(--radius-sm)",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                }}
                                            >
                                                <Icon size={15} color={active ? color : "var(--text-tertiary)"} />
                                                <div>
                                                    <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.75rem", color: active ? "var(--text-primary)" : "var(--text-secondary)", marginBottom: "0.1rem" }}>
                                                        {label}
                                                    </div>
                                                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", color: active ? color : "var(--text-tertiary)", letterSpacing: "0.05em" }}>
                                                        {sub}
                                                    </div>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {errorMsg && (
                                    <div style={{ padding: "0.75rem", marginBottom: "1rem", borderRadius: "var(--radius-sm)", backgroundColor: "rgba(255, 60, 60, 0.1)", border: "1px solid rgba(255, 60, 60, 0.3)", color: "var(--color-spiced-life)", fontSize: "0.85rem", textAlign: "center" }}>
                                        {errorMsg}
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: "0.6rem" }}>
                                    <button className="btn btn-secondary" onClick={back} style={{ padding: "0.75rem 1.25rem" }}>
                                        <ArrowLeft size={14} /> Back
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        disabled={!canGenerate || loading}
                                        onClick={handleGenerate}
                                        style={{ flex: 1, justifyContent: "center", padding: "0.75rem", borderRadius: "var(--shape-asymmetric-md)", opacity: canGenerate ? 1 : 0.3 }}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={15} /> Computing {windowDays} days...
                                            </>
                                        ) : (
                                            <>
                                                Generate Forecast <ArrowRight size={15} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
