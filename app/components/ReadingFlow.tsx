"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Heart, Briefcase, Users, Clock, Sprout, Home, Plane, Building, Loader2 } from "lucide-react";
import CityAutocomplete from "./CityAutocomplete";
import { createClient } from "@/lib/supabase/client";

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

export default function ReadingFlow({ defaultType }: { defaultType?: "travel" | "relocation" | "couples" } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // When the wizard is embedded on a type-specific surface (e.g. /couples),
  // skip the type-picker step and land directly on the first type-relevant step.
  const [screen, setScreen] = useState(defaultType ? 1 : 0);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState<"travel" | "relocation" | "couples">(defaultType ?? "travel");
  const [goals, setGoals] = useState<string[]>([]);
  const [destination, setDestination] = useState("");
  const [destLat, setDestLat] = useState<number | null>(null);
  const [destLon, setDestLon] = useState<number | null>(null);
  const [date, setDate] = useState("");

  // Couples / synastry state
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partners, setPartners] = useState<Array<{ id: string; first_name: string; birth_date: string; birth_city: string; label: string }>>([]);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [newPartner, setNewPartner] = useState({ firstName: "", birthDate: "", birthTime: "12:00", birthCity: "", birthLat: null as number | null, birthLon: null as number | null });
  const [partnerSaving, setPartnerSaving] = useState(false);

  useEffect(() => {
    const qType = searchParams.get("type");
    if (qType === "couples") setType("couples");
    else if (qType === "relocation") setType("relocation");
    else if (qType === "travel") setType("travel");
  }, [searchParams]);

  // Load saved partner profiles when couples type is active
  useEffect(() => {
    if (type !== "couples") return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("partner_profiles")
        .select("id, first_name, birth_date, birth_city, label")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => { if (data) setPartners(data); });
    });
  }, [type]);

  const handleSavePartner = async () => {
    if (!newPartner.firstName || !newPartner.birthDate || !newPartner.birthCity) return;
    setPartnerSaving(true);

    let lat = newPartner.birthLat;
    let lon = newPartner.birthLon;
    if (newPartner.birthCity && lat === null) {
      try {
        const geo = await fetch(`/api/geocode?city=${encodeURIComponent(newPartner.birthCity)}`).then(r => r.json());
        if (geo?.lat) { lat = parseFloat(geo.lat); lon = parseFloat(geo.lon); }
      } catch { /* coordinates will be null */ }
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPartnerSaving(false); return; }

    const { data, error } = await supabase
      .from("partner_profiles")
      .insert({
        owner_id: user.id,
        label: "Partner",
        first_name: newPartner.firstName,
        birth_date: newPartner.birthDate,
        birth_time: newPartner.birthTime + ":00",
        birth_time_known: true,
        birth_city: newPartner.birthCity,
        birth_lat: lat,
        birth_lon: lon,
      })
      .select("id, first_name, birth_date, birth_city, label")
      .single();

    if (!error && data) {
      setPartners(prev => [data, ...prev]);
      setPartnerId(data.id);
      setShowAddPartner(false);
      setNewPartner({ firstName: "", birthDate: "", birthTime: "12:00", birthCity: "", birthLat: null, birthLon: null });
    }
    setPartnerSaving(false);
  };

  const DEST_SCREEN = type === "couples" ? 3 : 2;
  const totalSteps = (type === "couples" ? 4 : 3) - (defaultType ? 1 : 0);
  const displayStep = (s: number) => defaultType ? s : s + 1;
  const minScreen = defaultType ? 1 : 0;

  const go = (n: number) => { setDir(n > screen ? 1 : -1); setScreen(n); };
  const next = () => go(Math.min(screen + 1, DEST_SCREEN));
  const back = () => go(Math.max(screen - 1, minScreen));

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
          goals,
          ...(type === "couples" && partnerId ? { partner_id: partnerId } : {}),
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
                <h5 style={{ marginBottom: "0.35rem" }}>Step {displayStep(0)} of {totalSteps}</h5>
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

        {screen === 1 && type === "couples" && (
          <motion.div key="partner" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.25rem, 3vw, 3rem)", overflow: "auto" }}>
              <div style={{ maxWidth: "480px", width: "100%" }}>
                <h5 style={{ marginBottom: "0.35rem" }}>Step {displayStep(1)} of {totalSteps}</h5>
                <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--text-primary)", lineHeight: 0.9, marginBottom: "0.5rem", textTransform: "uppercase" }}>
                  Who is your <span style={{ color: "var(--color-spiced-life)" }}>partner?</span>
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                  Select a saved partner or add a new one to compute the synastry overlay.
                </p>

                {partners.length > 0 && !showAddPartner && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                    {partners.map(p => (
                      <button key={p.id} onClick={() => setPartnerId(p.id)} style={{
                        display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.9rem 1rem",
                        border: `1px solid ${partnerId === p.id ? "var(--color-spiced-life)" : "var(--surface-border)"}`,
                        borderRadius: "var(--radius-sm)",
                        background: partnerId === p.id ? "rgba(255,60,60,0.06)" : "var(--surface)",
                        cursor: "pointer", transition: "all 0.2s ease", textAlign: "left",
                      }}>
                        <Heart size={16} color={partnerId === p.id ? "var(--color-spiced-life)" : "var(--text-tertiary)"} />
                        <div>
                          <div style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "0.85rem", color: partnerId === p.id ? "var(--text-primary)" : "var(--text-secondary)" }}>
                            {p.first_name}
                          </div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--text-tertiary)" }}>
                            {p.birth_date} · {p.birth_city}
                          </div>
                        </div>
                      </button>
                    ))}
                    <button onClick={() => setShowAddPartner(true)} style={{
                      padding: "0.75rem", border: "1px dashed var(--surface-border)",
                      borderRadius: "var(--radius-sm)", background: "transparent",
                      color: "var(--text-tertiary)", fontFamily: "var(--font-body)", fontSize: "0.8rem",
                      cursor: "pointer",
                    }}>
                      + Add new partner
                    </button>
                  </div>
                )}

                {(partners.length === 0 || showAddPartner) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem", padding: "1rem", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-sm)", background: "var(--surface)" }}>
                    <div className="input-group">
                      <label className="input-label">Partner name</label>
                      <input className="input-field" type="text" placeholder="e.g. Alex" value={newPartner.firstName}
                        onChange={e => setNewPartner(p => ({ ...p, firstName: e.target.value }))} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <div className="input-group">
                        <label className="input-label">Date of birth</label>
                        <input className="input-field" type="date" value={newPartner.birthDate}
                          onChange={e => setNewPartner(p => ({ ...p, birthDate: e.target.value }))} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Time of birth</label>
                        <input className="input-field" type="time" value={newPartner.birthTime}
                          onChange={e => setNewPartner(p => ({ ...p, birthTime: e.target.value }))} />
                      </div>
                    </div>
                    <CityAutocomplete
                      id="partner-birth-city"
                      label="City of birth"
                      value={newPartner.birthCity}
                      onChange={val => setNewPartner(p => ({ ...p, birthCity: val, birthLat: null, birthLon: null }))}
                      onSelect={s => setNewPartner(p => ({ ...p, birthCity: s.label, birthLat: s.lat, birthLon: s.lon }))}
                      placeholder="e.g. Paris, France"
                    />
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <button
                        className="btn btn-primary"
                        onClick={handleSavePartner}
                        disabled={partnerSaving || !newPartner.firstName || !newPartner.birthDate || !newPartner.birthCity}
                        style={{ padding: "0.6rem 1.25rem" }}>
                        {partnerSaving ? <Loader2 className="animate-spin" size={14} /> : "Save partner"}
                      </button>
                      {showAddPartner && (
                        <button onClick={() => setShowAddPartner(false)} style={{ background: "transparent", border: "none", color: "var(--text-tertiary)", fontSize: "0.75rem", cursor: "pointer", padding: 0 }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.6rem" }}>
                  {screen > minScreen && (
                    <button className="btn btn-secondary" onClick={back} style={{ padding: "0.75rem 1.25rem" }}><ArrowLeft size={14} /> Back</button>
                  )}
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "0.75rem", borderRadius: "var(--shape-asymmetric-md)", opacity: partnerId ? 1 : 0.3 }}
                    disabled={!partnerId}
                    onClick={next}>
                    Continue <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {screen === (type === "couples" ? 2 : 1) && (
          <motion.div key="goals" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.25rem, 3vw, 3rem)", overflow: "auto" }}>
              <div style={{ maxWidth: "540px", width: "100%" }}>
                <h5 style={{ marginBottom: "0.35rem" }}>Step {displayStep(type === "couples" ? 2 : 1)} of {totalSteps}</h5>
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

        {screen === DEST_SCREEN && (
          <motion.div key="dest" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.25rem, 3vw, 3rem)", overflow: "auto" }}>
              <div style={{ maxWidth: "480px", width: "100%" }}>
                <h5 style={{ marginBottom: "0.35rem" }}>Step {displayStep(DEST_SCREEN)} of {totalSteps}</h5>
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
