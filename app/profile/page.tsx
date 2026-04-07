"use client";

import { useState, useEffect } from "react";
import { LogOut, Save, ArrowLeft, Loader2, CreditCard } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "../components/ThemeToggle";
import DashboardLayout from "../components/DashboardLayout";
import CityAutocomplete from "../components/CityAutocomplete";


export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    firstName: "",
    birthDate: "",
    birthTime: "",
    birthTimeKnown: true,
    birthCity: "",
    birthLat: null as number | null,
    birthLon: null as number | null,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [subscription, setSubscription] = useState<{status: string, current_period_end: number | string} | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch real profile and unified subscription status from our profiles table
    const fetchProfileData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      if (user.email) setUserEmail(user.email);
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (data) {
        setProfile({
          firstName: data.first_name || "",
          birthDate: data.birth_date || "",
          birthTime: data.birth_time || "12:00",
          birthTimeKnown: data.birth_time_known ?? true,
          birthCity: data.birth_city || "",
          birthLat: data.birth_lat ?? null,
          birthLon: data.birth_lon ?? null,
        });
        
        if (data.is_subscribed) {
          setSubscription({
            status: data.subscription_status || 'active',
            current_period_end: data.subscription_ends_at || new Date().toISOString()
          });
        }
      }
    };
    fetchProfileData();
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setToast("");
    
    let lat: number | null = profile.birthLat;
    let lon: number | null = profile.birthLon;
    
    // Only re-geocode if city text changed from what we already resolved
    if (profile.birthCity && lat === null) {
      try {
        const res = await fetch(`/api/geocode?city=${encodeURIComponent(profile.birthCity)}`);
        if (!res.ok) {
           setToast("City not found. Please spell it correctly (e.g. Jakarta, Indonesia)");
           setSaving(false);
           return;
        }
        const geo = await res.json();
        if (geo && geo.lat) {
           lat = geo.lat;
           lon = geo.lon;
        }
      } catch (e) {
        setToast("Error finding city coordinates.");
        setSaving(false);
        return;
      }
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profile.firstName || null,
        birth_date: profile.birthDate || null,
        birth_time: profile.birthTime || '12:00:00',
        birth_time_known: profile.birthTimeKnown,
        birth_city: profile.birthCity || null,
        birth_lat: lat,
        birth_lon: lon,
      })
      .eq('id', userId);
      
    setSaving(false);
    if (error) {
      console.error(error);
      setToast("Error saving profile");
    } else {
      setToast("Profile saved");
    }
    setTimeout(() => setToast(""), 4000);
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/billing', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Unable to open billing portal');
        setBillingLoading(false);
      }
    } catch {
      setBillingLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <DashboardLayout title="Your Profile" backLabel="Home">
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", marginBottom: "var(--space-md)" }}>
          Manage your birth data and account settings.
        </p>


        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {/* Birth Data Section */}
          <section style={{ background: "var(--surface)", padding: "var(--space-lg)", border: "1px solid var(--surface-border)", borderRadius: "var(--shape-asymmetric-md)" }}>
            <div className="input-group" style={{ marginBottom: "1.25rem" }}>
              <label className="input-label">First name</label>
              <input className="input-field" type="text" value={profile.firstName}
                onChange={(e) => setProfile(p => ({ ...p, firstName: e.target.value }))} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div className="input-group">
                <label className="input-label">Date of birth</label>
                <input className="input-field" type="date" value={profile.birthDate}
                  onChange={(e) => setProfile(p => ({ ...p, birthDate: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">
                  Time of birth
                  {!profile.birthTimeKnown && <span style={{ color: "var(--color-spiced-life)", marginLeft: "0.3rem" }}>~approx</span>}
                </label>
                <input className="input-field" type="time" value={profile.birthTime}
                  disabled={!profile.birthTimeKnown}
                  style={{ opacity: profile.birthTimeKnown ? 1 : 0.4 }}
                  onChange={(e) => setProfile(p => ({ ...p, birthTime: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
              <button onClick={() => setProfile(p => ({ ...p, birthTimeKnown: !p.birthTimeKnown }))} style={{
                width: "32px", height: "18px", borderRadius: "9px", border: "none", cursor: "pointer",
                background: profile.birthTimeKnown ? "var(--text-primary)" : "var(--surface-border)",
                position: "relative", transition: "all 0.2s ease",
              }}>
                <div style={{
                  position: "absolute", top: "2px", left: profile.birthTimeKnown ? "16px" : "2px",
                  width: "14px", height: "14px", borderRadius: "50%", background: "var(--bg)", transition: "all 0.2s ease",
                }} />
              </button>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                I don&apos;t know my exact birth time
              </span>
            </div>

            <div className="input-group" style={{ marginBottom: "1.75rem" }}>
              <CityAutocomplete
                id="birth-city"
                label="City of birth"
                value={profile.birthCity}
                onChange={(val) => setProfile(p => ({ ...p, birthCity: val, birthLat: null, birthLon: null }))}
                onSelect={(s) => setProfile(p => ({ ...p, birthCity: s.label, birthLat: s.lat, birthLon: s.lon }))}
                placeholder="e.g. Jakarta, Indonesia"
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              <button className="btn btn-primary" style={{ padding: "0.8rem 1.75rem", borderRadius: "var(--radius-full)" }} onClick={handleSave} disabled={saving}>
                <Save size={14} style={{ marginRight: "0.4rem" }} /> {saving ? "Saving..." : "Save changes"}
              </button>
              {toast && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--sage)" }}>{toast}</span>}
            </div>
          </section>

          {/* Subscription Section */}
          <section style={{ paddingTop: "var(--space-md)" }}>
            <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.25rem", marginBottom: "var(--space-md)" }}>Subscription</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ padding: "1.25rem", background: "rgba(4,86,251,0.06)", border: "1px solid rgba(4,86,251,0.12)", borderRadius: "var(--radius-md)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div>
                     <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>Astronat Pro</span>
                     <p style={{ margin: "0.2rem 0 0", fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                        {subscription ? `Active — Renews ${new Date(subscription.current_period_end).toLocaleDateString()}` : "Free Tier"}
                     </p>
                   </div>
                   {subscription ? (
                     <button 
                        className="btn" 
                        onClick={handleManageBilling}
                        disabled={billingLoading}
                        style={{ padding: "0.5rem 1rem", background: "var(--surface)", border: "1px solid var(--surface-border)", fontSize: "0.75rem", borderRadius: "var(--radius-sm)" }}
                     >
                        {billingLoading ? <Loader2 className="animate-spin" size={14}/> : <><CreditCard size={14} style={{ marginRight: '0.3rem' }}/> Manage</>}
                     </button>
                   ) : (
                     <button className="btn btn-primary" onClick={() => router.push('/flow?demo=true')} style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", borderRadius: "var(--radius-sm)" }}>
                        Upgrade
                     </button>
                   )}
                </div>
              </div>
            </div>
          </section>

          {/* Account Section */}
          <section style={{ paddingTop: "var(--space-lg)" }}>
            <h3 style={{ fontFamily: "var(--font-secondary)", fontSize: "1.25rem", marginBottom: "var(--space-md)" }}>Account</h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)", border: "1px solid var(--surface-border)", padding: "1.25rem", borderRadius: "var(--shape-asymmetric-md)" }}>
                <div>
                   <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Registered Email</p>
                   <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0.25rem 0 0", letterSpacing: "0.02em" }}>{userEmail}</p>
                </div>
                <button onClick={handleSignOut} style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    background: "transparent", color: "var(--color-spiced-life)", border: "1px solid currentColor",
                    padding: "0.6rem 1.25rem", borderRadius: "var(--radius-full)",
                    fontFamily: "var(--font-body)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease"
                }}>
                    <LogOut size={14} /> Sign out
                </button>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
