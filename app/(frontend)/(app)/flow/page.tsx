"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sun, Moon, TrendingUp, Loader2 } from "lucide-react";
import Image from "next/image";
import ThemeToggle from "@/app/components/ThemeToggle";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import { Suspense } from "react";
import { createClient } from '@/lib/supabase/client';
import coupleHero from "@/public/couples_flow_hero.png";

const SCREENS = ["Sign Up", "Birth", "Aha"];

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

export default function FlowPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }}></div>}>
      <FlowPageInner />
    </Suspense>
  );
}

function FlowPageInner() {
  const searchParams = useSearchParams();
  const store = useOnboardingStore();

  const [screen, setScreen] = useState(0);
  const [dir, setDir] = useState(1);
  const [loadingChart, setLoadingChart] = useState(false);
  const [finishLoading, setFinishLoading] = useState(false);

  // Auth State
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam) {
      const stepInt = parseInt(stepParam, 10);
      if (!isNaN(stepInt) && stepInt >= 0 && stepInt < SCREENS.length) {
        setScreen(stepInt);
      }
    }
  }, [searchParams]);

  const handleGoogleSignup = async () => {
    localStorage.setItem('onboardingData', JSON.stringify(store));
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/flow?step=1')}`,
        queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
        }
      },
    });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    localStorage.setItem('onboardingData', JSON.stringify(store));
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/flow?step=1')}` },
    });
    if (error) {
      setAuthMessage(`Error: ${error.message}`);
    } else {
      setAuthMessage("Check your email ✨");
    }
    setAuthLoading(false);
  };

  useEffect(() => {
    const n = searchParams.get("name");    if (n) store.setFirstName(n);
    const d = searchParams.get("date");    if (d) store.setBirthDate(d);
    const c = searchParams.get("city");    if (c) store.setBirthCity(c);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sunSign = store.birthDate ? (() => {
    const d = new Date(store.birthDate + "T00:00:00");
    return getSunSign(d.getMonth() + 1, d.getDate());
  })() : null;

  const go = (n: number) => { setDir(n > screen ? 1 : -1); setScreen(n); };
  const next = () => go(Math.min(screen + 1, SCREENS.length - 1));
  const back = () => go(Math.max(screen - 1, 0));

  const handleChartSubmit = async () => {
    setLoadingChart(true);
    try {
      await fetch("/api/natal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dob: store.birthDate, time: store.birthTime, birthplace: store.birthCity }),
      });
      // Backstop geocode for users who typed a city without picking a suggestion.
      if (store.birthLat == null || store.birthLon == null) {
        fetch(`/api/geocode?city=${encodeURIComponent(store.birthCity)}`)
          .then(r => r.json())
          .then(geo => { if (geo?.lat) store.setBirthCoords(parseFloat(geo.lat), parseFloat(geo.lon)); })
          .catch(() => {});
      }
    } catch {
      // Allow proceeding even if mock fails
    }
    setLoadingChart(false);
    next();
  };

  const handleFinishOnboarding = async () => {
    setFinishLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          first_name: store.firstName || null,
          birth_date: store.birthDate || null,
          birth_time: store.birthTime || '12:00:00',
          birth_time_known: store.birthTimeKnown,
          birth_city: store.birthCity || null,
          birth_lat: store.birthLat || null,
          birth_lon: store.birthLon || null,
        });
      }
    } catch (err) {
      console.error("Failed to sync profile:", err);
    }
    window.location.href = "/dashboard";
  };

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
              {/* Mobile stacked / Desktop split layout */}
              <div className="flex-1 flex flex-col md:flex-row items-center justify-center w-full max-w-[1080px] mx-auto min-h-0">

                {/* ── Photo section with 80% aesthetic container ── */}
                <div style={{
                  position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "var(--bg)",
                }} className="w-full md:w-1/2 h-[32vh] md:h-[65vh] min-h-[220px] p-2 md:p-6">

                  {/* Photo with rounded organic border-radius */}
                  <div style={{
                    position: "relative", width: "75%", height: "90%",
                    borderRadius: "var(--shape-organic-1)",
                    overflow: "hidden",
                    border: "1px solid var(--surface-border)",
                  }}>
                    <Image
                      src={coupleHero}
                      alt="Astronat couple"
                      fill
                      style={{ objectFit: "cover", objectPosition: "center top" }}
                      priority
                    />
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4) 100%)",
                    }} />
                  </div>

                  {/* Venus SVG Overlay - Left */}
                  <div style={{ position: "absolute", top: "50%", left: "6%", opacity: 0.85, color: "var(--color-y2k-blue)", transform: "translateY(-50%)" }}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0px 0px 8px rgba(4,86,251,0.3))" }}>
                      <circle cx="12" cy="10" r="5" />
                      <line x1="12" y1="15" x2="12" y2="21" />
                      <line x1="9" y1="18" x2="15" y2="18" />
                    </svg>
                  </div>

                  {/* Mars SVG Overlay - Right */}
                  <div style={{ position: "absolute", bottom: "10%", right: "8%", opacity: 0.85, color: "var(--color-y2k-blue)" }}>
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0px 0px 8px rgba(4,86,251,0.3))" }}>
                      <circle cx="10" cy="14" r="5" />
                      <line x1="13.5" y1="10.5" x2="19" y2="5" />
                      <polyline points="14 5 19 5 19 10" />
                    </svg>
                  </div>
                </div>

                {/* ── Content section ── */}
                <div style={{
                  flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
                  padding: "clamp(0.8rem, 3vw, 2.5rem) clamp(1rem, 3vw, 2.5rem)",
                  gap: "0.8rem",
                  maxWidth: "540px",
                }}>
                  <h1 style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "clamp(2rem, 4.5vw, 4rem)",
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
                    fontFamily: "var(--font-body)", fontSize: "0.9rem",
                    lineHeight: 1.6, color: "var(--text-secondary)",
                    maxWidth: "420px",
                  }}>
                    Your natal chart projected across the globe. Discover where to go — and <em style={{ color: "var(--text-primary)", fontStyle: "italic" }}>when</em>.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                    <button onClick={handleGoogleSignup} className="btn" style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                      padding: "0.85rem", border: "1px solid var(--surface-border)", borderRadius: "var(--shape-asymmetric-md)",
                      background: "var(--surface)", color: "var(--text-primary)",
                      fontFamily: "var(--font-body)", fontSize: "0.85rem", cursor: "pointer", fontWeight: 600,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                      Continue with Google
                    </button>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "0.5rem 0" }}>
                      <div style={{ flex: 1, height: "1px", background: "var(--surface-border)" }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>or</span>
                      <div style={{ flex: 1, height: "1px", background: "var(--surface-border)" }} />
                    </div>

                    <form onSubmit={handleMagicLink} style={{ display: "flex", gap: "0.5rem" }}>
                      <input className="input-field" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ flex: 1, borderRadius: "var(--shape-asymmetric-md)" }} />
                      <button type="submit" disabled={authLoading} className="btn btn-primary" style={{ padding: "0 1.25rem", whiteSpace: "nowrap", borderRadius: "var(--shape-asymmetric-md)" }}>
                        {authLoading ? <Loader2 className="animate-spin" size={15}/> : "Send Link"}
                      </button>
                    </form>
                    {authMessage && (
                      <div style={{ fontSize: "0.75rem", color: "var(--color-y2k-blue)", marginTop: "0.25rem" }}>
                        {authMessage}
                      </div>
                    )}
                  </div>
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
                  <h5 style={{ marginBottom: "0.35rem" }}>Step 2 of 3</h5>
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
                        value={store.firstName} onChange={e => store.setFirstName(e.target.value)} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div className="input-group">
                        <label className="input-label">Date of birth</label>
                        <input className="input-field" type="date" value={store.birthDate}
                          onChange={e => store.setBirthDate(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">
                          Time of birth
                          {!store.birthTimeKnown && <span style={{ color: "var(--color-spiced-life)", marginLeft: "0.3rem" }}>~approx</span>}
                        </label>
                        <input className="input-field" type="time" disabled={!store.birthTimeKnown}
                          value={store.birthTime} onChange={e => store.setBirthTime(e.target.value)}
                          style={{ opacity: store.birthTimeKnown ? 1 : 0.4 }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {(() => {
                        const unknown = !store.birthTimeKnown;
                        return (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={unknown}
                            aria-label="I don't know my birth time"
                            onClick={() => store.setBirthTimeKnown(!store.birthTimeKnown)}
                            style={{
                              width: "32px", height: "18px", borderRadius: "9px", border: "none", cursor: "pointer",
                              background: unknown ? "var(--color-y2k-blue)" : "var(--surface-border)",
                              position: "relative", transition: "all 0.2s ease",
                            }}>
                            <div style={{
                              position: "absolute", top: "2px", left: unknown ? "16px" : "2px", width: "14px", height: "14px",
                              borderRadius: "50%", background: "white", transition: "all 0.2s ease",
                            }} />
                          </button>
                        );
                      })()}
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
                        I don&apos;t know my birth time
                      </span>
                    </div>

                    <CityAutocomplete
                      id="birth-city"
                      label="City of birth"
                      value={store.birthCity}
                      onChange={(val) => store.setBirthCity(val)}
                      onSelect={(s) => { store.setBirthCity(s.label); store.setBirthCoords(s.lat, s.lon); }}
                      placeholder="e.g. Jakarta, Indonesia"
                    />

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
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "0.75rem", opacity: (store.firstName && store.birthDate && store.birthCity) ? 1 : 0.3 }}
                      disabled={!store.firstName || !store.birthDate || !store.birthCity || loadingChart}
                      onClick={handleChartSubmit}>
                      {loadingChart ? <><Loader2 className="animate-spin" size={15}/> Calculating...</> : <>Calculate Chart <ArrowRight size={15} /></>}
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
                      {store.firstName ? store.firstName.toUpperCase() : "YOU"},{" "}
                      <span style={{ color: "var(--color-y2k-blue)" }}>the {(sunSign || "Leo").toUpperCase()}</span>
                    </h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                      {[
                        { icon: <Sun size={14} />, planet: "Sun", sign: sunSign || "Leo", insight: "Your core motivation — what you radiate when you're at your most yourself." },
                        { icon: <Moon size={14} />, planet: "Moon", sign: "—", insight: "Computed once your full chart is calculated. Reveals your emotional baseline." },
                        { icon: <TrendingUp size={14} />, planet: "Rising", sign: "—", insight: "Computed from your exact birth time and place. Shapes how the world meets you." },
                      ].map(({ icon, planet, sign, insight }) => (
                        <motion.div key={planet} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: "0.75rem",
                            padding: "0.75rem 1rem", textAlign: "left",
                            background: "var(--surface)",
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

                    <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.5rem", justifyContent: "center" }}>
                      <button className="btn btn-secondary" onClick={back} style={{ padding: "0.75rem 1.25rem" }} disabled={finishLoading}>
                        <ArrowLeft size={14} /> Back
                      </button>
                      <button className="btn btn-primary" onClick={handleFinishOnboarding} style={{ padding: "0.9rem 2.5rem" }} disabled={finishLoading}>
                        {finishLoading ? <><Loader2 className="animate-spin" size={15}/> Entering…</> : <>Enter Astronat <ArrowRight size={15} /></>}
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Goals and destination are now collected per-reading inside ReadingFlow. */}
        </AnimatePresence>
      </div>
    </div>
  );
}
