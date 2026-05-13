"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, User, Coins, Home, Heart, Activity, Handshake, Briefcase, Users, Sparkles, Plane, Building, Loader2 } from "lucide-react";
import CityAutocomplete from "./CityAutocomplete";
import { createClient } from "@/lib/supabase/client";
import { AstroLoader } from "@/app/components/ui/astro-loader";
import posthog from "posthog-js";

const LIFE_GOALS = [
  { id: "identity", label: "Identity & Self-Discovery", icon: User, color: "var(--color-y2k-blue)", sub: "1st + 9th house emphasis" },
  { id: "wealth", label: "Wealth & Financial Growth", icon: Coins, color: "var(--gold)", sub: "2nd + 8th house momentum" },
  { id: "home", label: "Home, Family & Roots", icon: Home, color: "var(--color-acqua)", sub: "4th house foundation" },
  { id: "romance", label: "Romance & Love", icon: Heart, color: "var(--color-spiced-life)", sub: "5th + 7th house chemistry" },
  { id: "health", label: "Health, Routine & Wellness", icon: Activity, color: "var(--sage)", sub: "6th + 12th house balance" },
  { id: "partnerships", label: "Partnerships & Marriage", icon: Handshake, color: "var(--color-spiced-life)", sub: "7th + 11th house bonds" },
  { id: "career", label: "Career & Public Recognition", icon: Briefcase, color: "var(--color-y2k-blue)", sub: "10th + 6th house visibility" },
  { id: "friendship", label: "Friendship & Networking", icon: Users, color: "var(--color-acqua)", sub: "11th + 3rd house community" },
  { id: "spirituality", label: "Spirituality & Inner Peace", icon: Sparkles, color: "var(--gold)", sub: "12th + 9th house reflection" },
];

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

type ReadingType = "travel" | "relocation" | "couples";

function normalizeReadingType(value: string | null): ReadingType | null {
  if (value === "travel" || value === "relocation" || value === "couples") return value;
  return null;
}

export default function ReadingFlow({ defaultType }: { defaultType?: "travel" | "relocation" | "couples" } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = defaultType ?? normalizeReadingType(searchParams.get("type")) ?? "travel";

  // When the wizard is embedded on a type-specific surface (e.g. /couples),
  // skip the type-picker step and land directly on the first type-relevant step.
  const [screen, setScreen] = useState(defaultType ? 1 : 0);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState<ReadingType>(initialType);
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
      posthog.capture("partner_profile_added", { partner_birth_city: newPartner.birthCity });
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

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    // Stale `?demo=true` in the URL should not override real generation for signed-in users.
    if (isDemo && !user) {
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
        } catch {
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
        posthog.capture("reading_generated", {
          reading_id: data.readingId,
          reading_type: type,
          reading_category: type === "couples" ? "synastry" : "astrocartography",
          destination,
          has_partner: type === "couples" && !!partnerId,
          goals,
        });
        router.push(`/reading/${data.readingId}`);
      } else {
        const isFreeLimit = data.code === "FREE_TIER_LIMIT";
        posthog.capture("reading_generation_failed", {
          error_code: data.code ?? "unknown",
          error: data.error ?? "unknown",
          is_free_tier_limit: isFreeLimit,
          reading_type: type,
          destination,
        });
        const errorMsg = data.message ? `${data.error}: ${data.message}` : (data.error || "An unknown error occurred during generation.");
        setErrorMsg(errorMsg);
        setLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "network_error";
      posthog.capture("reading_generation_failed", {
        error: message,
        reading_type: type,
        destination,
      });
      console.error(err);
      setErrorMsg(message === "network_error" ? "Failed to connect to generation service." : message);
      setLoading(false);
    }
  };

  if (loading) {
    return <AstroLoader label={type === "couples" ? "Generating your couples reading..." : "Generating your reading..."} />;
  }

  return (
    <div className="reading-flow">
      <AnimatePresence mode="wait" custom={dir}>
        {screen === 0 && (
          <motion.div key="type" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="reading-flow-screen">
              <div className="reading-flow-panel reading-flow-panel-narrow">
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

                <div className="reading-flow-actions reading-flow-actions-end">
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
            <div className="reading-flow-screen">
              <div className="reading-flow-panel reading-flow-panel-narrow">
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
                    <div className="form-field-grid reading-flow-field-grid">
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

                <div className="reading-flow-actions">
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
            <div className="reading-flow-screen">
              <div className="reading-flow-panel reading-flow-panel-wide">
                <h5 style={{ marginBottom: "0.35rem" }}>Step {displayStep(type === "couples" ? 2 : 1)} of {totalSteps}</h5>
                <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "var(--text-primary)", lineHeight: 0.9, marginBottom: "0.5rem", textTransform: "uppercase" }}>
                  What are you <span style={{ color: "var(--color-spiced-life)" }}>looking for?</span>
                </h2>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.8rem" }}>
                  Select up to 3 goals. We&apos;ll prioritize the planetary lines that matter most to your intention.
                </p>

                <div className="reading-flow-goals-grid">
                  {LIFE_GOALS.map(({ id, label, icon: Icon, color }) => {
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
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="reading-flow-actions">
                  <button className="btn btn-secondary" onClick={back} style={{ padding: "0.75rem 1.25rem", minHeight: "44px" }}><ArrowLeft size={14} /> Back</button>
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
            <div className="reading-flow-screen">
              <div className="reading-flow-panel reading-flow-panel-narrow">
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

                <div className="reading-flow-actions">
                  <button className="btn btn-secondary" onClick={back} style={{ padding: "0.75rem 1.25rem", minHeight: "44px" }}><ArrowLeft size={14} /> Back</button>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "0.75rem", borderRadius: "var(--shape-asymmetric-md)", opacity: destination ? 1 : 0.3 }}
                    disabled={!destination || loading}
                    onClick={handleGenerate}
                    aria-busy={loading}
                  >
                    <>Generate Reading <ArrowRight size={15} /></>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style jsx>{`
        .reading-flow {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 75vh;
          overflow: hidden;
        }

        .reading-flow-screen {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(1.25rem, 3vw, 3rem);
          overflow: auto;
        }

        .reading-flow-panel {
          width: 100%;
        }

        .reading-flow-panel-narrow {
          max-width: 480px;
        }

        .reading-flow-panel-wide {
          max-width: 540px;
        }

        .reading-flow-actions {
          display: flex;
          gap: 0.6rem;
          align-items: stretch;
        }

        .reading-flow-actions-end {
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .reading-flow-goals-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .reading-flow-field-grid {
          gap: 0.5rem;
        }

        @media (max-width: 767px) {
          .reading-flow {
            min-height: calc(100dvh - 60px);
            overflow: visible;
          }

          .reading-flow-screen {
            align-items: flex-start;
            justify-content: flex-start;
            min-height: calc(100dvh - 60px);
            padding: clamp(1rem, 5vw, 1.5rem);
            padding-top: clamp(1.5rem, 7vh, 3rem);
            padding-bottom: calc(2rem + env(safe-area-inset-bottom));
          }

          .reading-flow-panel {
            max-width: none;
          }

          .reading-flow-goals-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 0.55rem;
          }

          .reading-flow-actions {
            gap: 0.65rem;
          }

          .reading-flow-actions > :global(.btn) {
            min-height: 46px;
          }

          .reading-flow-actions-end {
            justify-content: stretch;
          }

          .reading-flow-actions-end > :global(.btn) {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 374px) {
          .reading-flow-actions {
            flex-direction: column;
          }

          .reading-flow-actions > :global(.btn),
          .reading-flow-actions > button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
