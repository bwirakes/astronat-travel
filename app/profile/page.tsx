"use client";

import { useState, useEffect } from "react";
import { LogOut, Save, ArrowLeft, Loader2, CreditCard } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "../components/ThemeToggle";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    firstName: "Brandon",
    birthDate: "1995-08-15",
    birthTime: "14:30",
    birthTimeKnown: true,
    birthCity: "Jakarta, Indonesia",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [subscription, setSubscription] = useState<{status: string, current_period_end: number | string} | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("demo@astronat.com");

  useEffect(() => {
    // Fetch subscription status directly via Supabase using our new FDW view
    const fetchSub = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (user.email) setUserEmail(user.email);
      
      const { data } = await supabase
        .from('user_subscription_status')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (data) setSubscription(data);
    };
    fetchSub();
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setToast("Profile saved");
      setTimeout(() => setToast(""), 3000);
    }, 600);
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
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-primary)" }}>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.75rem clamp(1.25rem, 3vw, 3rem)",
        borderBottom: "1px solid var(--surface-border)",
        maxWidth: "1400px", width: "100%", margin: "0 auto",
      }}>
        <Image src="/logo-stacked.svg" alt="ASTRONAT" width={110} height={36} priority className="onboarding-logo" />
        <ThemeToggle />
      </header>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "var(--space-lg) clamp(1.25rem, 3vw, 3rem) var(--space-3xl)" }}>
        <button onClick={() => router.push("/home")} style={{
          background: "none", border: "none", color: "var(--text-tertiary)",
          fontFamily: "var(--font-mono)", fontSize: "0.6rem", cursor: "pointer",
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "var(--space-md)",
          display: "flex", alignItems: "center", gap: "0.3rem",
        }}>
          <ArrowLeft size={12} /> Home
        </button>

        <div style={{ marginBottom: "var(--space-xl)" }}>
          <h1 style={{ fontFamily: "var(--font-primary)", textTransform: "uppercase", fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 0.9 }}>
            Your Profile
          </h1>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", marginTop: "var(--space-xs)" }}>
            Manage your birth data and account settings.
          </p>
        </div>

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
              <label className="input-label">City of birth</label>
              <input className="input-field" type="text" value={profile.birthCity}
                onChange={(e) => setProfile(p => ({ ...p, birthCity: e.target.value }))} />
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
    </div>
  );
}
