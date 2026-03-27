"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Heart, Briefcase, Users, Clock, Sprout, Home, Lock, Sun, Moon, TrendingUp, Plane, Building } from "lucide-react";
import Image from "next/image";
import ThemeToggle from "../components/ThemeToggle";

const SCREENS = ["Welcome", "Birth", "Aha", "Goals", "Destination", "Gate"];

const LIFE_GOALS = [
  { id: "love", label: "Love & Relationships", icon: Heart, color: "var(--color-spiced-life)", sub: "Venus lines · 5th & 7th house" },
  { id: "career", label: "Career & Ambition", icon: Briefcase, color: "var(--color-y2k-blue)", sub: "MC lines · 10th & 6th house" },
  { id: "community", label: "Community & Friends", icon: Users, color: "var(--color-acqua)", sub: "Jupiter lines · 11th & 3rd house" },
  { id: "timing", label: "Timing & Transitions", icon: Clock, color: "var(--gold)", sub: "Personal transits · travel windows" },
  { id: "growth", label: "Personal Growth", icon: Sprout, color: "var(--sage)", sub: "Neptune lines · 9th & 12th house" },
  { id: "relocation", label: "Relocation / Living", icon: Home, color: "var(--gold)", sub: "IC lines · 4th house patterns" },
];

const SIGN_GLYPHS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

function getSunSign(month: number, day: number) {
  const dates = [
    [3, 21, "Aries"], [4, 20, "Taurus"], [5, 21, "Gemini"], [6, 21, "Cancer"],
    [7, 23, "Leo"], [8, 23, "Virgo"], [9, 23, "Libra"], [10, 23, "Scorpio"],
    [11, 22, "Sagittarius"], [12, 22, "Capricorn"], [1, 20, "Aquarius"], [2, 19, "Pisces"],
  ] as const;
  for (const [m, d, sign] of dates) {
    if (month === m && day >= d) return sign;
    if (month === (m + 1) && day < d) return sign;
    if (month === 1 && m === 12 && day < d) return "Capricorn";
  }
  return "Aries";
}

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

/* ── Y2K Starburst accent SVG ── */
const Starburst = ({ size = 48, color = "var(--color-y2k-blue)", style = {} }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <polygon
      points="50,0 58,35 95,25 65,50 95,75 58,65 50,100 42,65 5,75 35,50 5,25 42,35"
      fill={color} opacity={0.8}
    />
  </svg>
);

export default function MockupOnboarding() {
  const [screen, setScreen] = useState(0);
  const [dir, setDir] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [birthTimeKnown, setBirthTimeKnown] = useState(true);
  const [travelType, setTravelType] = useState<"trip" | "relocation">("trip");

  const [birth, setBirth] = useState({ name: "", date: "", time: "", city: "" });
  const [destination, setDestination] = useState({ city: "", date: "" });

  const sunSign = birth.date ? (() => {
    const d = new Date(birth.date + "T00:00:00");
    return getSunSign(d.getMonth() + 1, d.getDate());
  })() : null;

  const go = (n: number) => { setDir(n > screen ? 1 : -1); setScreen(n); };
  const next = () => go(Math.min(screen + 1, SCREENS.length - 1));
  const back = () => go(Math.max(screen - 1, 0));
  const toggleGoal = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  /* ─── Pill badge component ─── */
  const Pill = ({ label, filled = false }: { label: string; filled?: boolean }) => (
    <span style={{
      display: "inline-block",
      padding: "0.3rem 1rem",
      fontFamily: "var(--font-mono)", fontSize: "0.55rem",
      letterSpacing: "0.12em", textTransform: "uppercase",
      color: filled ? "var(--color-eggshell)" : "var(--color-y2k-blue)",
      background: filled ? "var(--color-y2k-blue)" : "transparent",
      border: `1.5px solid var(--color-y2k-blue)`,
      borderRadius: "var(--radius-full)",
      whiteSpace: "nowrap",
    }}>{label}</span>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

      {/* ── Top Bar ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.75rem clamp(1.25rem, 3vw, 3rem)",
        borderBottom: "1px solid var(--surface-border)",
        background: "var(--bg)", zIndex: 10,
        maxWidth: "1080px", width: "100%", margin: "0 auto",
      }}>
        {/* Logo — uses same invert filter as homepage Navbar */}
        <Image src="/logo-stacked.svg" alt="ASTRONAT" width={110} height={36} priority
          className="onboarding-logo" />

        {/* Progress pips */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          {SCREENS.map((_, i) => (
            <div key={i} style={{
              width: i === screen ? "24px" : i < screen ? "12px" : "5px",
              height: "3px", borderRadius: "1.5px",
              background: i < screen ? "var(--color-y2k-blue)" : i === screen ? "var(--text-primary)" : "var(--surface-border)",
              transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
            }} />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ThemeToggle />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>
            {String(screen + 1).padStart(2, "0")}/{String(SCREENS.length).padStart(2, "0")}
          </span>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <AnimatePresence mode="wait" custom={dir}>

          {/* ════════════════ SCREEN 0: WELCOME ════════════════ */}
          {screen === 0 && (
            <motion.div key="welcome" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              {/* Desktop: side-by-side / Mobile: stacked */}
              <div style={{ flex: 1, display: "flex", minHeight: 0 }} className="flex-col md:flex-row">

                {/* ── Photo section with organic shape + accents ── */}
                <div style={{
                  position: "relative", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "var(--bg)",
                }} className="w-full md:w-[55%] h-[44vh] md:h-auto">

                  {/* Photo with rounded organic border-radius */}
                  <div style={{
                    position: "relative", width: "85%", height: "85%",
                    borderRadius: "var(--radius-full) var(--radius-lg) var(--radius-full) var(--radius-md)",
                    overflow: "hidden",
                  }}>
                    <Image
                      src="/pastel_suits.png"
                      alt="Astronat editorial"
                      fill
                      style={{ objectFit: "cover", objectPosition: "center top" }}
                      priority
                    />
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 100%)",
                    }} />

                    {/* Pill badges overlaid on photo bottom */}
                    <div style={{
                      position: "absolute", bottom: "1.25rem", left: "50%", transform: "translateX(-50%)",
                      display: "flex", gap: "0.4rem", zIndex: 2,
                    }}>
                      <Pill label="1ST" />
                      <Pill label="MC RULER" filled />
                      <Pill label="SUN" />
                    </div>
                  </div>

                  {/* Starburst accent — bottom left */}
                  <Starburst size={56} style={{ position: "absolute", bottom: "8%", left: "3%", opacity: 0.7 }} />
                  {/* Small starburst — top right */}
                  <Starburst size={28} color="var(--gold)" style={{ position: "absolute", top: "12%", right: "8%", opacity: 0.5 }} />
                </div>

                {/* ── Content section ── */}
                <div style={{
                  flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
                  padding: "clamp(1.5rem, 4vw, 3.5rem) clamp(1.25rem, 4vw, 3.5rem)",
                  gap: "1.5rem",
                  maxWidth: "540px",
                }}>
                  <h1 style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "clamp(2.8rem, 5vw, 5rem)",
                    color: "var(--text-primary)",
                    lineHeight: 0.82,
                    letterSpacing: "-0.01em",
                    textTransform: "uppercase",
                  }}>
                    Where should you{" "}
                    <em style={{
                      fontStyle: "italic", fontFamily: "var(--font-display-alt-2)",
                      textTransform: "lowercase", fontSize: "1.3em",
                      color: "var(--gold)", position: "relative", top: "-0.02em",
                    }}>travel</em>{" "}
                    next?
                  </h1>

                  <p style={{
                    fontFamily: "var(--font-body)", fontSize: "1rem",
                    lineHeight: 1.75, color: "var(--text-secondary)",
                    maxWidth: "420px",
                  }}>
                    Your natal chart projected across the globe. Discover where to go — and <em style={{ color: "var(--text-primary)", fontStyle: "italic" }}>when</em>.
                  </p>

                  <button
                    className="btn btn-primary"
                    onClick={next}
                    style={{
                      alignSelf: "flex-start",
                      padding: "0.9rem 2.2rem",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                    }}
                  >
                    Begin your Travels <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════ SCREEN 1: BIRTH DATA ════════════════ */}
          {screen === 1 && (
            <motion.div key="birth" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.25rem, 3vw, 3rem)", overflow: "auto" }}>
                <div style={{ maxWidth: "480px", width: "100%" }}>
                  <h5 style={{ marginBottom: "0.35rem" }}>Step 1 of 5</h5>
                  <h2 style={{
                    fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 4vw, 3rem)",
                    color: "var(--text-primary)", lineHeight: 0.9, marginBottom: "0.5rem", textTransform: "uppercase",
                  }}>
                    Your <span style={{ color: "var(--color-y2k-blue)" }}>birth</span> details
                  </h2>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.85rem", lineHeight: 1.6 }}>
                    Precise birth data powers every planetary calculation.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="input-group">
                      <label className="input-label">First name</label>
                      <input className="input-field" type="text" placeholder="e.g. Natalia"
                        value={birth.name} onChange={e => setBirth(p => ({ ...p, name: e.target.value }))} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div className="input-group">
                        <label className="input-label">Date of birth</label>
                        <input className="input-field" type="date" value={birth.date}
                          onChange={e => setBirth(p => ({ ...p, date: e.target.value }))} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">
                          Time of birth
                          {!birthTimeKnown && <span style={{ color: "var(--color-spiced-life)", marginLeft: "0.3rem" }}>~approx</span>}
                        </label>
                        <input className="input-field" type="time" disabled={!birthTimeKnown}
                          value={birth.time} onChange={e => setBirth(p => ({ ...p, time: e.target.value }))}
                          style={{ opacity: birthTimeKnown ? 1 : 0.4 }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button onClick={() => setBirthTimeKnown(p => !p)} style={{
                        width: "32px", height: "18px", borderRadius: "9px", border: "none", cursor: "pointer",
                        background: birthTimeKnown ? "var(--surface-border)" : "var(--color-y2k-blue)",
                        position: "relative", transition: "all 0.2s ease",
                      }}>
                        <div style={{
                          position: "absolute", top: "2px", left: birthTimeKnown ? "2px" : "16px", width: "14px", height: "14px",
                          borderRadius: "50%", background: "white", transition: "all 0.2s ease",
                        }} />
                      </button>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
                        I don&apos;t know my birth time
                      </span>
                    </div>

                    <div className="input-group">
                      <label className="input-label">City of birth</label>
                      <input className="input-field" type="text" placeholder="e.g. Jakarta, Indonesia"
                        value={birth.city} onChange={e => setBirth(p => ({ ...p, city: e.target.value }))} />
                    </div>

                    {sunSign && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.75rem 1rem",
                        background: "rgba(4,86,251,0.08)",
                        border: "1px solid rgba(4,86,251,0.2)",
                        borderRadius: "var(--radius-md)",
                      }}>
                        <span style={{ fontSize: "1.75rem", lineHeight: 1 }}>{SIGN_GLYPHS[sunSign]}</span>
                        <div>
                          <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>{sunSign}</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Sun sign detected</div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.5rem" }}>
                    <button className="btn btn-secondary" onClick={back} style={{ padding: "0.75rem 1.25rem" }}><ArrowLeft size={14} /> Back</button>
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "0.75rem", opacity: (birth.name && birth.date && birth.city) ? 1 : 0.3 }}
                      disabled={!birth.name || !birth.date || !birth.city}
                      onClick={next}>
                      Calculate Chart <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════ SCREEN 2: AHA MOMENT ════════════════ */}
          {screen === 2 && (
            <motion.div key="aha" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.25rem, 3vw, 3rem)", overflow: "auto" }}>
                <div style={{ width: "100%", maxWidth: "500px", textAlign: "center" }}>

                  <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring" }}
                    style={{
                      width: "110px", height: "110px", margin: "0 auto 1.25rem",
                      background: "radial-gradient(circle, rgba(4,86,251,0.12) 0%, transparent 70%)",
                      border: "1px solid rgba(4,86,251,0.25)",
                      borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "3rem",
                      boxShadow: "0 0 40px rgba(4,86,251,0.1)",
                    }}>
                    {SIGN_GLYPHS[sunSign || "Leo"]}
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h6 style={{ marginBottom: "0.4rem" }}>Here&apos;s what we found</h6>
                    <h2 style={{
                      fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 4vw, 3rem)",
                      color: "var(--text-primary)", lineHeight: 0.9, marginBottom: "1.25rem", textTransform: "uppercase",
                    }}>
                      {birth.name ? birth.name.toUpperCase() : "YOU"},{" "}
                      <span style={{ color: "var(--color-y2k-blue)" }}>the {(sunSign || "Leo").toUpperCase()}</span>
                    </h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                      {[
                        { icon: <Sun size={14} />, planet: "Sun", sign: sunSign || "Leo", insight: "You radiate wherever intensity meets purpose." },
                        { icon: <Moon size={14} />, planet: "Moon", sign: "Scorpio", insight: "Your emotional home is depth — you feel what others miss." },
                        { icon: <TrendingUp size={14} />, planet: "Rising", sign: "Aries", insight: "The world sees you as bold, direct, unfiltered." },
                      ].map(({ icon, planet, sign, insight }) => (
                        <motion.div key={planet} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: "0.75rem",
                            padding: "0.75rem 1rem", textAlign: "left",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid var(--surface-border)",
                            borderRadius: "var(--radius-sm)",
                          }}>
                          <div style={{ minWidth: "72px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--text-tertiary)", marginBottom: "0.15rem" }}>
                              {icon}
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>{planet}</span>
                            </div>
                            <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: "var(--gold)", fontSize: "0.8rem" }}>{sign}</div>
                          </div>
                          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{insight}</p>
                        </motion.div>
                      ))}
                    </div>

                    <button className="btn btn-primary" onClick={next} style={{ padding: "0.9rem 2.5rem" }}>
                      Show me where <ArrowRight size={15} />
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════ SCREEN 3: LIFE GOALS ════════════════ */}
          {screen === 3 && (
            <motion.div key="goals" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.25rem, 3vw, 3rem)", overflow: "auto" }}>
                <div style={{ maxWidth: "540px", width: "100%" }}>
                  <h5 style={{ marginBottom: "0.35rem" }}>Step 2 of 5</h5>
                  <h2 style={{
                    fontFamily: "var(--font-primary)", fontSize: "clamp(1.8rem, 4vw, 3rem)",
                    color: "var(--text-primary)", lineHeight: 0.9, marginBottom: "0.5rem", textTransform: "uppercase",
                  }}>
                    What are you <span style={{ color: "var(--color-spiced-life)" }}>looking for?</span>
                  </h2>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.8rem" }}>
                    Select up to 3. We&apos;ll prioritize the planetary lines that matter most.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    {LIFE_GOALS.map(({ id, label, icon: Icon, color, sub }) => {
                      const active = selectedGoals.includes(id);
                      return (
                        <motion.button key={id} onClick={() => toggleGoal(id)} whileTap={{ scale: 0.97 }}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: "0.5rem",
                            padding: "0.65rem 0.75rem", textAlign: "left",
                            background: active ? `${color}15` : "rgba(255,255,255,0.02)",
                            border: `1px solid ${active ? color : "var(--surface-border)"}`,
                            borderRadius: active ? "var(--shape-asymmetric-md)" : "var(--radius-sm)",
                            cursor: "pointer", transition: "all 0.2s ease",
                            opacity: (!active && selectedGoals.length >= 3) ? 0.3 : 1,
                          }}>
                          <Icon size={15} color={active ? color : "var(--text-tertiary)"} style={{ flexShrink: 0, marginTop: "1px" }} />
                          <div>
                            <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: active ? "var(--text-primary)" : "var(--text-secondary)", fontSize: "0.75rem", marginBottom: "0.1rem" }}>
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

                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button className="btn btn-secondary" onClick={back} style={{ padding: "0.75rem 1.25rem" }}><ArrowLeft size={14} /> Back</button>
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "0.75rem", opacity: selectedGoals.length > 0 ? 1 : 0.3 }}
                      disabled={selectedGoals.length === 0}
                      onClick={next}>
                      Continue <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════ SCREEN 4: DESTINATION ════════════════ */}
          {screen === 4 && (
            <motion.div key="destination" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.25rem, 3vw, 3rem)", overflow: "auto" }}>
                <div style={{ maxWidth: "480px", width: "100%" }}>
                  <h5 style={{ marginBottom: "0.35rem" }}>Step 3 of 5</h5>
                  <h2 style={{
                    fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 4vw, 3rem)",
                    color: "var(--text-primary)", lineHeight: 0.9, marginBottom: "0.5rem", textTransform: "uppercase",
                  }}>
                    Where are <span style={{ color: "var(--color-acqua)" }}>you going?</span>
                  </h2>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                    We&apos;ll find the best windows around your target date.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label className="input-label" style={{ display: "block", marginBottom: "0.4rem" }}>Travel type</label>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {(["trip", "relocation"] as const).map(type => (
                          <button key={type} onClick={() => setTravelType(type)} style={{
                            flex: 1, padding: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                            border: `1px solid ${travelType === type ? "var(--color-y2k-blue)" : "var(--surface-border)"}`,
                            borderRadius: "var(--radius-sm)", background: travelType === type ? "rgba(4,86,251,0.1)" : "transparent",
                            color: travelType === type ? "var(--text-primary)" : "var(--text-tertiary)",
                            fontFamily: "var(--font-body)", fontSize: "0.78rem", cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}>
                            {type === "trip" ? <><Plane size={14} /> Short Trip</> : <><Building size={14} /> Relocation</>}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Destination city</label>
                      <input className="input-field" type="text" placeholder="e.g. Tokyo, Japan"
                        value={destination.city} onChange={e => setDestination(p => ({ ...p, city: e.target.value }))} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">
                        Target date <span style={{ color: "var(--text-tertiary)", textTransform: "none", fontFamily: "var(--font-body)" }}>(optional)</span>
                      </label>
                      <input className="input-field" type="date" value={destination.date}
                        onChange={e => setDestination(p => ({ ...p, date: e.target.value }))} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--text-tertiary)", marginTop: "0.2rem" }}>
                        Flexible — we&apos;ll find the best windows around this period
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.5rem" }}>
                    <button className="btn btn-secondary" onClick={back} style={{ padding: "0.75rem 1.25rem" }}><ArrowLeft size={14} /> Back</button>
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "0.75rem", opacity: destination.city ? 1 : 0.3 }}
                      disabled={!destination.city}
                      onClick={next}>
                      See My Reading <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════════════ SCREEN 5: PAY GATE ════════════════ */}
          {screen === 5 && (
            <motion.div key="gate" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }} style={{ flex: 1, display: "flex" }} className="flex-col md:flex-row">

              {/* Left: Blurred preview teaser */}
              <div style={{
                position: "relative",
                padding: "clamp(1.5rem, 3vw, 3rem)",
                borderBottom: "1px solid var(--surface-border)",
                minHeight: "200px", flexShrink: 0,
              }} className="w-full md:w-[50%] md:border-b-0 md:border-r md:border-r-[var(--surface-border)]">
                <h6 style={{ marginBottom: "0.75rem" }}>Your reading preview</h6>
                {[
                  { label: "Trip Score", value: "87", color: "var(--sage)", tag: "Excellent" },
                  { label: "Venus Line", value: "243km", color: "var(--color-spiced-life)", tag: "LOVE" },
                  { label: "Jupiter MC", value: "Active", color: "var(--gold)", tag: "CAREER" },
                ].map(({ label, value, color, tag }) => (
                  <div key={label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.6rem 0.75rem", marginBottom: "0.3rem",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "var(--radius-xs)",
                    filter: "blur(3px)", userSelect: "none",
                  }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: color, fontSize: "0.85rem" }}>{value}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.45rem", color: color, padding: "0.1rem 0.35rem", border: `1px solid ${color}`, borderRadius: "var(--radius-full)" }}>{tag}</span>
                  </div>
                ))}

                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 70%)",
                }}>
                  <div style={{ textAlign: "center" }}>
                    <Lock size={22} color="var(--gold)" style={{ margin: "0 auto 0.5rem" }} />
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.3 }}>
                      Unlock reading for{" "}
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {destination.city || "your destination"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Signup + Pay */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(1.5rem, 3vw, 3rem)", gap: "1.25rem" }}>
                <div>
                  <h5 style={{ marginBottom: "0.35rem" }}>Final Step</h5>
                  <h2 style={{
                    fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 4vw, 3rem)",
                    color: "var(--text-primary)", lineHeight: 0.9, marginBottom: "0.5rem", textTransform: "uppercase",
                  }}>
                    Your reading <span style={{ color: "var(--color-y2k-blue)" }}>is ready</span>
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.5 }}>
                    Sign in to save your chart, then unlock the full analysis.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <button style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    padding: "0.75rem", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-sm)",
                    background: "transparent", color: "var(--text-primary)",
                    fontFamily: "var(--font-body)", fontSize: "0.8rem", cursor: "pointer",
                  }}>
                    <svg width="16" height="16" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                    Continue with Google
                  </button>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <input className="input-field" type="email" placeholder="your@email.com" style={{ flex: 1 }} />
                    <button className="btn btn-primary" style={{ padding: "0 1rem", whiteSpace: "nowrap", borderRadius: "var(--radius-sm)" }}>
                      Send
                    </button>
                  </div>
                </div>

                <div style={{
                  padding: "1.25rem", background: "rgba(4,86,251,0.06)",
                  border: "1px solid rgba(4,86,251,0.12)",
                  borderRadius: "var(--radius-md)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>Full Reading</span>
                    <span style={{ fontFamily: "var(--font-primary)", fontSize: "1.5rem", color: "var(--color-y2k-blue)" }}>$9</span>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 0.75rem 0", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {["House analysis & goals scoring", "12-month transit windows", "Full editorial narrative"].map(item => (
                      <li key={item} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "var(--color-y2k-blue)" }} />
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--text-secondary)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "0.85rem" }}>
                    Unlock with Stripe
                  </button>
                </div>

                <button onClick={back} style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: "0.55rem", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", alignSelf: "center" }}>
                  <ArrowLeft size={12} style={{ marginRight: "0.3rem", verticalAlign: "middle" }} /> Back
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Global onboarding styles ── */}
      <style jsx global>{`
        .onboarding-logo {
          filter: invert(1) brightness(1.2);
          display: block;
        }
        [data-theme="light"] .onboarding-logo {
          filter: none;
        }
      `}</style>
    </div>
  );
}
