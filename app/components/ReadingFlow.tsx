"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Heart, Briefcase, Users, Clock, Sprout, Home, Plane, Building, Loader2 } from "lucide-react";
import CityAutocomplete from "./CityAutocomplete";

const LIFE_GOALS = [
  { id: "love", label: "Love & Relationships", icon: Heart, color: "var(--color-spiced-life)", sub: "Venus lines · 5th & 7th house" },
  { id: "career", label: "Career & Ambition", icon: Briefcase, color: "var(--color-y2k-blue)", sub: "MC lines · 10th & 6th house" },
  { id: "community", label: "Community & Friends", icon: Users, color: "var(--color-acqua)", sub: "Jupiter lines · 11th & 3rd house" },
  { id: "timing", label: "Timing & Transitions", icon: Clock, color: "var(--gold)", sub: "Personal transits · travel windows" },
  { id: "growth", label: "Personal Growth", icon: Sprout, color: "var(--sage)", sub: "Neptune lines · 9th & 12th house" },
  { id: "relocation", label: "Relocation / Living", icon: Home, color: "var(--gold)", sub: "IC lines · 4th house patterns" },
];

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

export default function ReadingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [screen, setScreen] = useState(0);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [type, setType] = useState<"travel" | "relocation" | "couples">("travel");
  const [goals, setGoals] = useState<string[]>([]);
  const [destination, setDestination] = useState("");
  const [destLat, setDestLat] = useState<number | null>(null);
  const [destLon, setDestLon] = useState<number | null>(null);
  const [date, setDate] = useState("");

  useEffect(() => {
    const qType = searchParams.get("type");
    if (qType === "couples") setType("couples");
    else if (qType === "relocation") setType("relocation");
    else if (qType === "travel") setType("travel");
  }, [searchParams]);

  const go = (n: number) => { setDir(n > screen ? 1 : -1); setScreen(n); };
  const next = () => go(Math.min(screen + 1, 3));
  const back = () => go(Math.max(screen - 1, 0));

  const toggleGoal = (id: string) => {
    if (goals.includes(id)) {
      setGoals(goals.filter(g => g !== id));
    } else {
      if (goals.length < 3) setGoals([...goals, id]);
    }
  };

  const isDemo = searchParams.get("demo") === "true";
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg("");
    
    if (isDemo) {
      setTimeout(() => {
        setLoading(false);
        router.push("/reading/1?demo=true");
      }, 1200);
      return;
    }
    
    try {
      // Use already-resolved coords if user selected from dropdown, otherwise geocode
      let targetLat = destLat ?? 0;
      let targetLon = destLon ?? 0;
      
      if (targetLat === 0 && targetLon === 0 && destination) {
        try {
          const destGeo = await fetch(`/api/geocode?city=${encodeURIComponent(destination)}`).then(r => r.json());
          if (destGeo?.lat) {
            targetLat = parseFloat(destGeo.lat);
            targetLon = parseFloat(destGeo.lon);
          } else {
            setErrorMsg("Could not geocode destination. Please select from the dropdown.");
            setLoading(false);
            return;
          }
        } catch (e) {
          setErrorMsg("Failed to find location coordinates.");
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/readings/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          travelType: type === "couples" ? "trip" : type === "travel" ? "trip" : "relocation",
          readingCategory: type === "couples" ? "synastry" : "astrocartography",
          targetLat,
          targetLon,
          travelDate: date || new Date().toISOString().split('T')[0],
          goals
        })
      });

      const data = await res.json();
      if (data.readingId) {
        router.push(`/reading/${data.readingId}`);
      } else {
        const errorMsg = data.message ? `${data.error}: ${data.message}` : (data.error || "An unknown error occurred during generation.");
        setErrorMsg(errorMsg);
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to connect to generation service.");
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "75vh", overflow: "hidden" }}>
      <AnimatePresence mode="wait" custom={dir}>
        {screen === 0 && (
          <motion.div key="type" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.25rem, 3vw, 3rem)", overflow: "auto" }}>
              <div style={{ maxWidth: "480px", width: "100%" }}>
                <h5 style={{ marginBottom: "0.35rem" }}>Step 1 of 3</h5>
                <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--text-primary)", lineHeight: 0.9, marginBottom: "0.5rem", textTransform: "uppercase" }}>
                  What kind of <span style={{ color: "var(--color-acqua)" }}>reading</span>?
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                  Choose the reading engine calculation mode.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {(["travel", "relocation", "couples"] as const).map(t => (
                    <button key={t} onClick={() => setType(t)} style={{
                      display: "flex", alignItems: "center", gap: "0.8rem", padding: "1rem",
                      border: `1px solid ${type === t ? "var(--color-y2k-blue)" : "var(--surface-border)"}`,
                      borderRadius: "var(--radius-sm)",
                      background: type === t ? "rgba(4,86,251,0.06)" : "var(--surface)",
                      cursor: "pointer", transition: "all 0.2s ease"
                    }}>
                      <div style={{ color: type === t ? "var(--color-y2k-blue)" : "var(--text-tertiary)" }}>
                        {t === "travel" ? <Plane size={18} /> : t === "relocation" ? <Building size={18} /> : <Users size={18} />}
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.85rem", color: type === t ? "var(--text-primary)" : "var(--text-secondary)" }}>
                          {t === "travel" ? "Travel Reading" : t === "relocation" ? "Relocation Reading" : "Couples Reading"}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-tertiary)", marginTop: "0.1rem" }}>
                          {t === "travel" ? "Short-term transits & lines" : t === "relocation" ? "Long-term house shifts & IC lines" : "Synastry composite lines"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                  <button className="btn btn-primary" style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--shape-asymmetric-md)" }} onClick={next}>
                    Continue <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 1 && (
          <motion.div key="goals" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.25rem, 3vw, 3rem)", overflow: "auto" }}>
              <div style={{ maxWidth: "540px", width: "100%" }}>
                <h5 style={{ marginBottom: "0.35rem" }}>Step 2 of 3</h5>
                <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "var(--text-primary)", lineHeight: 0.9, marginBottom: "0.5rem", textTransform: "uppercase" }}>
                  What are you <span style={{ color: "var(--color-spiced-life)" }}>looking for?</span>
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.8rem" }}>
                  Select up to 3 goals. We'll prioritize the planetary lines that matter most to your intention.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  {LIFE_GOALS.map(({ id, label, icon: Icon, color, sub }) => {
                    const active = goals.includes(id);
                    return (
                      <motion.button key={id} onClick={() => toggleGoal(id)} whileTap={{ scale: 0.97 }}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: "0.5rem",
                          padding: "0.65rem 0.75rem", textAlign: "left",
                          background: active ? `${color}15` : "var(--surface)",
                          border: `1px solid ${active ? color : "var(--surface-border)"}`,
                          borderRadius: active ? "var(--shape-asymmetric-md)" : "var(--radius-sm)",
                          cursor: "pointer", transition: "all 0.2s ease",
                          opacity: (!active && goals.length >= 3) ? 0.3 : 1,
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
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "0.75rem", borderRadius: "var(--shape-asymmetric-md)", opacity: goals.length > 0 ? 1 : 0.3 }}
                    disabled={goals.length === 0}
                    onClick={next}>
                    Continue <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 2 && (
          <motion.div key="dest" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.25rem, 3vw, 3rem)", overflow: "auto" }}>
              <div style={{ maxWidth: "480px", width: "100%" }}>
                <h5 style={{ marginBottom: "0.35rem" }}>Step 3 of 3</h5>
                <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--text-primary)", lineHeight: 0.9, marginBottom: "0.5rem", textTransform: "uppercase" }}>
                  Where are <span style={{ color: "var(--gold)" }}>you going?</span>
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                  Calculate the final shifted {type === "couples" ? "synastry" : "chart"}.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                  <CityAutocomplete
                    id="destination-city"
                    label="Destination city"
                    value={destination}
                    onChange={(val) => { setDestination(val); setDestLat(null); setDestLon(null); }}
                    onSelect={(s) => { setDestination(s.label); setDestLat(s.lat); setDestLon(s.lon); }}
                    placeholder="e.g. Tokyo, Japan"
                  />
                  <div className="input-group">
                    <label className="input-label">
                      Target date <span style={{ color: "var(--text-tertiary)", textTransform: "none", fontFamily: "var(--font-body)" }}>(optional)</span>
                    </label>
                    <input className="input-field" type="date" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                </div>

                {errorMsg && (
                  <div style={{ padding: "0.75rem", marginBottom: "1rem", borderRadius: "var(--radius-sm)", backgroundColor: "rgba(255, 60, 60, 0.1)", border: "1px solid rgba(255, 60, 60, 0.3)", color: "var(--color-spiced-life)", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                    {errorMsg}
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <button className="btn btn-secondary" onClick={back} style={{ padding: "0.75rem 1.25rem" }}><ArrowLeft size={14} /> Back</button>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "0.75rem", borderRadius: "var(--shape-asymmetric-md)", opacity: destination ? 1 : 0.3 }}
                    disabled={!destination || loading}
                    onClick={handleGenerate}>
                    {loading ? <><Loader2 className="animate-spin" size={15}/> Computing...</> : <>Generate Reading <ArrowRight size={15} /></>}
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
