"use client";

/**
 * /mockup-chart-preview — public, no-auth version of /mockup-chart.
 *
 * Identical UX to /mockup-chart, but receives a pre-computed natal payload
 * as a prop instead of fetching /api/natal + streaming /api/chart/interpret.
 * Use this to share the design over a plain URL (no login) with designers,
 * stakeholders, or for feedback sessions.
 *
 * Data seed is a real natal chart (Brandon's) with its cached interpretation
 * — same shape as /api/natal would return.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/app/components/DashboardLayout";
import NatalMockupWheel from "@/app/components/NatalMockupWheel";
import { AcgMap } from "@/app/components/AcgMap";
import PlanetIcon from "@/app/components/PlanetIcon";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/app/components/ui/accordion";
import { PLANET_COLORS } from "@/app/lib/planet-data";
import { HOUSE_DOMAINS, getOrdinal } from "@/app/lib/astro-wording";
import { SIGN_RULERS } from "@/app/lib/astro-constants";

// ─── Per-house travel implications ──────────────────────────────
const HOUSE_TRAVEL: Record<number, string> = {
  1: "How locals first read you when you arrive.",
  2: "What you spend, earn, and value abroad.",
  3: "Short trips, local excursions, and everyday errands.",
  4: "What makes a foreign place feel like home.",
  5: "Where you play, flirt, and create on the road.",
  6: "Daily rituals, health, and routine when away.",
  7: "The type of stranger you attract overseas.",
  8: "Shared resources, intimacy, and transformation abroad.",
  9: "Long journeys that amplify and expand you.",
  10: "Career opportunities outside your home base.",
  11: "The community and networks you build in transit.",
  12: "Foreign lands where you retreat or dissolve.",
};

// ─── Deterministic per-house interpretation (same as /mockup-chart) ─
function houseInterpretation({
  house, sphere, cuspSign, occupants, ruler, rulerHouse, rulerSign, rulerDignity,
}: {
  house: number;
  sphere: string;
  cuspSign: string;
  occupants: Array<{ name: string; sign: string; dignity?: string }>;
  ruler: string | null;
  rulerHouse: number | null;
  rulerSign: string | null;
  rulerDignity?: string | null;
}): string {
  const lowerSphere = sphere.toLowerCase();

  let occupantSentence: string;
  if (occupants.length === 0) {
    occupantSentence = `Empty of planets — your ${lowerSphere} runs on ${cuspSign}'s cue.`;
  } else {
    const names = occupants.map((o) => o.name);
    const joined = names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
    const verb = names.length === 1 ? "occupies" : "occupy";
    const standoutDignity = occupants.find((o) => {
      const d = (o.dignity ?? "").toLowerCase();
      return d.includes("domicile") || d.includes("exalt") || d.includes("detriment") || d.includes("fall");
    });
    const dignityTag = standoutDignity
      ? ` (${standoutDignity.name} in ${standoutDignity.dignity?.toLowerCase()})`
      : "";
    occupantSentence = `${joined} ${verb} your ${lowerSphere} in ${cuspSign}${dignityTag}.`;
  }

  let rulerSentence: string;
  if (!ruler) {
    rulerSentence = "";
  } else if (rulerHouse === house) {
    rulerSentence = `${ruler} rules here and lives here — self-contained, no translation needed.`;
  } else if (rulerHouse && rulerSign) {
    const dig = (rulerDignity ?? "").toLowerCase();
    let dignityClause = "";
    if (dig.includes("domicile")) dignityClause = ", where it operates at full strength";
    else if (dig.includes("exalt")) dignityClause = ", where it's amplified";
    else if (dig.includes("detriment")) dignityClause = ", where it sits in detriment and scatters";
    else if (dig.includes("fall")) dignityClause = ", where it's in fall";
    rulerSentence = `${ruler} rules from H${rulerHouse} in ${rulerSign}${dignityClause}.`;
  } else {
    rulerSentence = `${ruler} rules the sign on the cusp.`;
  }

  return rulerSentence ? `${occupantSentence} ${rulerSentence}` : occupantSentence;
}

type Tab = "overview" | "houses" | "aspects" | "map";

type Section = { title: string; content: string };
type Interpretation = Partial<{
  chartEssence: Section;
  houseArchitecture: Section;
  aspectWeaver: Section;
  naturalAngles: Section;
}>;

// ── Small presentational helpers ────────────────────────────────

function KeyCard({
  kicker, title, subtitle, body, accentColor, icon,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  body: string;
  accentColor?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "0.5rem",
      padding: "1rem 0", borderTop: "1px solid var(--surface-border)",
    }}>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.18em",
        textTransform: "uppercase", color: accentColor ?? "var(--text-tertiary)",
        fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem",
      }}>
        {icon}
        {kicker}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-primary)", fontSize: "1.1rem", fontWeight: 600, letterSpacing: "0.02em" }}>
          {title}
        </span>
        {subtitle && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
            {subtitle}
          </span>
        )}
      </div>
      <p style={{
        fontFamily: "var(--font-body)", fontSize: "0.9rem", lineHeight: 1.55,
        color: "var(--text-secondary)", margin: 0,
      }}>
        {body}
      </p>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────

export default function MockupChartPreviewClient({ staticData }: { staticData: any }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [isDark, setIsDark] = useState(true);

  // Theme observer
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    check();
    const obs = new MutationObserver((ms) => ms.forEach((m) => m.attributeName === "data-theme" && check()));
    obs.observe(document.documentElement, { attributes: true });
    return () => obs.disconnect();
  }, []);

  // ── Pre-hydrated from static prop ───────────────────────────
  const natalData = staticData;
  const interpretation: Interpretation | null = staticData?.interpretation ?? null;

  const planets: any[] = natalData?.planets ?? [];
  const angles: any[] = natalData?.angles ?? [];
  const aspects: any[] = natalData?.aspects ?? [];
  const cusps: number[] = natalData?.cusps ?? [];
  const firstName = natalData?.first_name ?? null;

  const combined = useMemo(() => [...planets, ...angles], [planets, angles]);
  const asc = angles.find((a) => a.name === "Ascendant");
  const sun = planets.find((p) => p.name === "Sun");
  const moon = planets.find((p) => p.name === "Moon");

  const occupantsByHouse = useMemo(() => {
    const m = new Map<number, any[]>();
    for (const p of planets) {
      if (!p.house) continue;
      const arr = m.get(p.house) ?? [];
      arr.push(p);
      m.set(p.house, arr);
    }
    return m;
  }, [planets]);

  const parseOrbDeg = (s?: string) => {
    if (!s) return 99;
    const m = s.match(/(-?\d+)°\s*(\d+)/);
    return m ? parseInt(m[1]) + parseInt(m[2]) / 60 : 99;
  };
  const signatureAspects = useMemo(() => {
    const rulerName = asc?.sign ? ({
      Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon", Leo: "Sun",
      Virgo: "Mercury", Libra: "Venus", Scorpio: "Mars", Sagittarius: "Jupiter",
      Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
    } as Record<string, string>)[asc.sign] : "Sun";
    const priority = new Set([rulerName, "Sun", "Moon"].map((s) => s.toLowerCase()));
    return [...aspects]
      .map((a) => ({
        ...a,
        _p: (priority.has((a.planet1 ?? "").toLowerCase()) || priority.has((a.planet2 ?? "").toLowerCase()) ? 0 : 1) * 10 + parseOrbDeg(a.orb),
      }))
      .sort((a, b) => a._p - b._p)
      .slice(0, 3);
  }, [aspects, asc]);

  const wheelPlanets = useMemo(() =>
    combined.map((p: any) => ({ planet: p.name, longitude: p.longitude, isAngle: p.isAngle })),
    [combined],
  );

  const natalForMap = useMemo(() => {
    if (!natalData) return null;
    const out: any = {
      houses: cusps,
      birth_city: natalData.birth_city,
      birth_date: natalData.birth_date,
      birth_time: natalData.birth_time,
      birth_lat: natalData.birth_lat,
      birth_lon: natalData.birth_lon,
      profile_time: natalData.profile_time,
    };
    for (const p of combined) {
      out[p.name.toLowerCase()] = { longitude: p.longitude, latitude: p.latitude };
    }
    return out;
  }, [natalData, cusps, combined]);

  const dominantSignal = useMemo(() => {
    if (signatureAspects.length === 0) return null;
    const a = signatureAspects[0];
    return { label: `${a.type}`, title: a.aspect, subtitle: a.orb };
  }, [signatureAspects]);

  if (!natalData) return null;

  const possessive = firstName ? `${firstName}'s` : "Your";
  const essenceText = interpretation?.chartEssence?.content;

  return (
    <DashboardLayout maxWidth="1280px" paddingTop="var(--space-md)" backLabel="AstroNat" backHref="/">

      {/* Preview badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "0.5rem",
        padding: "0.35rem 0.75rem", marginBottom: "var(--space-md)",
        background: "var(--color-y2k-blue)", color: "white",
        borderRadius: "999px", fontFamily: "var(--font-mono)", fontSize: "0.6rem",
        letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700,
      }}>
        <span>●</span> Design Preview · Sample Data
      </div>

      {/* ── HEADER (title + dek + metadata) ───────────────────── */}
      <div style={{ marginBottom: "var(--space-lg)" }}>
        <h1 style={{
          fontFamily: "var(--font-primary)",
          fontSize: "clamp(2rem, 4vw, 3.25rem)",
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          margin: "0 0 1rem 0",
          lineHeight: 1.05,
        }}>
          {possessive.toUpperCase()} BIRTH CHART
        </h1>

        {essenceText && (
          <p style={{
            fontFamily: "var(--font-secondary, var(--font-body))",
            fontSize: "clamp(1.05rem, 1.6vw, 1.2rem)",
            lineHeight: 1.5, margin: "0 0 1.5rem 0", maxWidth: "62ch",
            color: "var(--text-secondary)", fontStyle: "italic",
          }}>
            {essenceText}
          </p>
        )}

        <div style={{
          display: "flex", flexWrap: "wrap", gap: "0.4rem 1.5rem",
          fontFamily: "var(--font-mono)", fontSize: "0.7rem",
          color: "var(--text-secondary)",
        }}>
          <span><strong style={{ color: "var(--text-primary)" }}>Born</strong> · {natalData.birth_date}</span>
          <span><strong style={{ color: "var(--text-primary)" }}>At</strong> · {natalData.birth_time}</span>
          <span><strong style={{ color: "var(--text-primary)" }}>In</strong> · {natalData.birth_city}</span>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "var(--space-lg)", borderBottom: "1px solid var(--surface-border)" }}>
        {(["overview", "houses", "aspects", "map"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "0.75rem 1.25rem",
            fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.15em",
            textTransform: "uppercase", fontWeight: 600,
            background: "transparent", border: "none", cursor: "pointer",
            color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)",
            borderBottom: tab === t ? "2px solid var(--text-primary)" : "2px solid transparent",
            marginBottom: "-1px",
          }}>
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {tab === "overview" && (
          <motion.div key="overview"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-12 gap-8 items-start">
              <div className="col-span-12 md:col-span-5" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{
                  fontFamily: "var(--font-primary)", fontSize: "1rem", letterSpacing: "0.08em",
                  textTransform: "uppercase", marginBottom: "0.5rem", color: "var(--text-primary)",
                }}>
                  The Keys
                </div>

                {asc && (
                  <KeyCard
                    kicker="Ascendant · 1st House"
                    title={`${asc.sign} ${Math.floor(asc.degree_in_sign)}° ${asc.degree_minutes}′`}
                    subtitle="How locals read you abroad"
                    body={`Your ${asc.sign} rising is the mask. When you land in a new city, this is the first signal strangers pick up.`}
                    accentColor={PLANET_COLORS.Ascendant ?? "var(--text-primary)"}
                    icon={<PlanetIcon planet="Ascendant" size={14} color={PLANET_COLORS.Ascendant} />}
                  />
                )}
                {sun && (
                  <KeyCard
                    kicker={`Sun · ${getOrdinal(sun.house)} House`}
                    title={`${sun.sign} ${Math.floor(sun.degree_in_sign)}° ${sun.degree_minutes}′`}
                    subtitle="What you seek out abroad"
                    body={`Your core identity runs on ${sun.sign} fuel through the house of ${HOUSE_DOMAINS[sun.house]?.toLowerCase() ?? "life"}.`}
                    accentColor={PLANET_COLORS.Sun}
                    icon={<PlanetIcon planet="Sun" size={14} color={PLANET_COLORS.Sun} />}
                  />
                )}
                {moon && (
                  <KeyCard
                    kicker={`Moon · ${getOrdinal(moon.house)} House`}
                    title={`${moon.sign} ${Math.floor(moon.degree_in_sign)}° ${moon.degree_minutes}′`}
                    subtitle="What makes a place feel like home"
                    body={`Emotional gravity pulls toward ${moon.sign} textures — the Moon in the ${getOrdinal(moon.house)} frames your inner weather.`}
                    accentColor={PLANET_COLORS.Moon}
                    icon={<PlanetIcon planet="Moon" size={14} color={PLANET_COLORS.Moon} />}
                  />
                )}
                {dominantSignal && (
                  <KeyCard
                    kicker="Dominant Signal"
                    title={dominantSignal.title}
                    subtitle={dominantSignal.subtitle}
                    body="The tightest aspect in your chart — this is the geometry running in the background of every decision."
                    accentColor="var(--color-y2k-blue)"
                  />
                )}
              </div>

              <div className="col-span-12 md:col-span-7" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{
                  fontFamily: "var(--font-primary)", fontSize: "1rem", letterSpacing: "0.08em",
                  textTransform: "uppercase", marginBottom: "0.75rem", color: "var(--text-primary)",
                }}>
                  The Wheel
                </div>
                <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto" }}>
                  <NatalMockupWheel isDark={isDark} planets={wheelPlanets as any} cusps={cusps} />
                </div>
              </div>
            </div>

            <div style={{
              marginTop: "var(--space-xl)", paddingTop: "var(--space-lg)",
              borderTop: "1px solid var(--surface-border)",
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}>
              <TeaserCard
                kicker="House Architecture"
                title="See where your chart peaks and falters"
                cta="Explore houses →"
                onClick={() => setTab("houses")}
              />
              <TeaserCard
                kicker="Aspect Geometry"
                title={`${aspects.length} planetary relationships shaping you`}
                cta="See aspects →"
                onClick={() => setTab("aspects")}
              />
              <TeaserCard
                kicker="Natal Geography"
                title="Where planetary lines crossed your birthplace"
                cta="See map →"
                onClick={() => setTab("map")}
              />
            </div>
          </motion.div>
        )}

        {tab === "houses" && (
          <motion.div key="houses"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ maxWidth: "860px", marginBottom: "var(--space-lg)" }}>
              <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "1.75rem", textTransform: "uppercase", margin: "0 0 0.5rem 0" }}>
                Twelve Houses
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.55 }}>
                Each house is a sphere of life. When you travel, relocate, or enter a new environment, these houses rotate —
                different planets light up. Here's how each one sits in your natal configuration, and what it means on the road.
              </p>
            </div>

            {interpretation?.houseArchitecture && (
              <div style={{
                background: "var(--surface)", border: "1px solid var(--surface-border)",
                borderRadius: "var(--radius-md)", padding: "1rem 1.25rem",
                marginBottom: "var(--space-md)", maxWidth: "860px",
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "0.4rem", fontWeight: 600 }}>
                  Pattern Summary
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.5, color: "var(--text-primary)" }}>
                  {interpretation.houseArchitecture.content}
                </div>
              </div>
            )}

            <Accordion type="multiple" variant="default" className="w-full">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                const sign = cusps[h - 1] !== undefined
                  ? ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"][Math.floor((cusps[h - 1] % 360) / 30)]
                  : "?";
                const occupants = occupantsByHouse.get(h) ?? [];
                const sphere = HOUSE_DOMAINS[h] ?? "Life";

                const rulerName = SIGN_RULERS[sign] ?? null;
                const rulerPlanet = rulerName
                  ? planets.find((p: any) => (p.name ?? "").toLowerCase() === rulerName.toLowerCase())
                  : null;
                const interp = houseInterpretation({
                  house: h, sphere, cuspSign: sign,
                  occupants: occupants.map((o: any) => ({ name: o.name, sign: o.sign, dignity: o.dignity })),
                  ruler: rulerName,
                  rulerHouse: rulerPlanet?.house ?? null,
                  rulerSign: rulerPlanet?.sign ?? null,
                  rulerDignity: rulerPlanet?.dignity ?? null,
                });

                return (
                  <AccordionItem value={`house-${h}`} key={h}>
                    <AccordionTrigger
                      meta={`${sign} · ${occupants.length > 0 ? `${occupants.length} planet${occupants.length > 1 ? "s" : ""}` : "empty"}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 700,
                          letterSpacing: "0.1em", color: "var(--text-tertiary)", minWidth: "2.25rem",
                        }}>
                          H{h}
                        </span>
                        <span style={{ fontFamily: "var(--font-primary)", fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {sphere}
                        </span>
                        {occupants.length > 0 && (
                          <span style={{ display: "inline-flex", gap: "0.25rem", alignItems: "center" }}>
                            {occupants.map((o: any) => (
                              <PlanetIcon key={o.name} planet={o.name} size={12} color={PLANET_COLORS[o.name]} />
                            ))}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div style={{ padding: "0 0 1.5rem 3rem", display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "760px" }}>

                        <p style={{
                          fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.55,
                          color: "var(--text-primary)", margin: 0,
                        }}>
                          {interp}
                        </p>

                        {occupants.length > 0 && (
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-tertiary)", lineHeight: 1.7, paddingLeft: "0.5rem", borderLeft: "1px solid var(--surface-border)" }}>
                            {occupants.map((o: any, i: number) => (
                              <div key={i}>
                                <strong style={{ color: "var(--text-secondary)" }}>{o.name}</strong> · {o.sign} {o.degree_in_sign !== undefined ? `${Math.floor(o.degree_in_sign)}° ${o.degree_minutes}′` : ""}
                                {o.dignity && o.dignity !== "PEREGRINE" && (
                                  <span style={{ color: "var(--color-y2k-blue)", marginLeft: "0.5rem", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
                                    {o.dignity}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{
                          padding: "0.75rem 1rem", background: "var(--bg)",
                          border: "1px solid var(--surface-border)", borderRadius: "var(--radius-sm)",
                          borderLeft: "2px solid var(--color-y2k-blue)",
                        }}>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.2em", color: "var(--color-y2k-blue)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.35rem" }}>
                            When you travel
                          </div>
                          <div style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                            {HOUSE_TRAVEL[h]}
                          </div>
                        </div>

                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            <PreviewCTA />
          </motion.div>
        )}

        {tab === "aspects" && (
          <motion.div key="aspects"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ maxWidth: "860px", marginBottom: "var(--space-lg)" }}>
              <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "1.75rem", textTransform: "uppercase", margin: "0 0 0.5rem 0" }}>
                Aspect Geometry
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.55 }}>
                Aspects are the angular relationships between planets. These show the hidden geometry that runs through everything you do.
              </p>
            </div>

            <div style={{ marginBottom: "var(--space-xl)" }}>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em",
                color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700,
                marginBottom: "0.75rem",
              }}>
                Signature Aspects
              </div>

              {interpretation?.aspectWeaver && (
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: "0.95rem", lineHeight: 1.55,
                  color: "var(--text-primary)", margin: "0 0 1rem 0", maxWidth: "760px",
                }}>
                  {interpretation.aspectWeaver.content}
                </p>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "0.75rem" }}>
                {signatureAspects.map((a, i) => (
                  <div key={i} style={{
                    padding: "1rem 1.25rem", background: "var(--surface)",
                    border: "1px solid var(--surface-border)", borderRadius: "var(--radius-md)",
                    borderLeft: "3px solid var(--color-y2k-blue)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.3rem", gap: "0.5rem" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-tertiary)", fontWeight: 600 }}>
                        {a.type}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-tertiary)" }}>
                        orb {a.orb}
                      </span>
                    </div>
                    <div style={{ fontFamily: "var(--font-primary)", fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {a.aspect}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em",
                color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700,
                marginBottom: "0.75rem",
              }}>
                All Aspects · Reference
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.5rem" }}>
                {aspects.map((a: any, i: number) => (
                  <div key={i} style={{
                    padding: "0.6rem 0.85rem", background: "var(--surface)",
                    border: "1px solid var(--surface-border)", borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)", fontSize: "0.75rem",
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem",
                  }}>
                    <span style={{ color: "var(--text-primary)" }}>{a.aspect}</span>
                    <span style={{ color: "var(--text-tertiary)", fontSize: "0.65rem" }}>{a.orb}</span>
                  </div>
                ))}
              </div>
            </div>

            <PreviewCTA />
          </motion.div>
        )}

        {tab === "map" && (
          <motion.div key="map"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ maxWidth: "860px", marginBottom: "var(--space-lg)" }}>
              <h2 style={{ fontFamily: "var(--font-primary)", fontSize: "1.75rem", textTransform: "uppercase", margin: "0 0 0.5rem 0" }}>
                Natal Geography
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.55 }}>
                At the moment of your birth, each planet drew a line across the Earth. These lines shape the ambient field of your birthplace.
                When you travel, different lines activate.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-6 items-start">
              <div className="col-span-12 lg:col-span-8" style={{
                background: "var(--surface)", border: "1px solid var(--surface-border)",
                borderRadius: "var(--radius-md)", padding: "var(--space-sm)",
              }}>
                {natalForMap && (
                  <AcgMap
                    natal={natalForMap as any}
                    birthDateTimeUTC={natalForMap.profile_time || "1994-08-15T12:00:00Z"}
                    birthLon={natalForMap.birth_lon ?? 0}
                    highlightCity={{ lat: natalForMap.birth_lat ?? 0, lon: natalForMap.birth_lon ?? 0, name: natalForMap.birth_city ?? "" }}
                    interactive
                    onLocationClick={() => {}}
                    onLinesCalculated={() => {}}
                  />
                )}
              </div>

              <div className="col-span-12 lg:col-span-4" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{
                  padding: "1rem 1.25rem", background: "var(--surface)",
                  border: "1px solid var(--surface-border)", borderRadius: "var(--radius-md)",
                  borderLeft: "3px solid var(--text-primary)",
                }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
                    Natural Angles
                  </div>
                  {interpretation?.naturalAngles && (
                    <>
                      <div style={{ fontFamily: "var(--font-primary)", fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
                        {interpretation.naturalAngles.title}
                      </div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", lineHeight: 1.55, color: "var(--text-secondary)" }}>
                        {interpretation.naturalAngles.content}
                      </div>
                    </>
                  )}
                </div>

                <div style={{
                  padding: "1rem 1.25rem", background: "var(--text-primary)", color: "var(--bg)",
                  borderRadius: "var(--radius-md)",
                }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.35rem", opacity: 0.7 }}>
                    Different lines activate when you travel
                  </div>
                  <div style={{ fontFamily: "var(--font-primary)", fontSize: "1rem", fontWeight: 600 }}>
                    The travel map lives behind the paywall →
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </DashboardLayout>
  );
}

// ── Teaser + Preview CTA ─────────────────────────────────────────

function TeaserCard({ kicker, title, cta, onClick }: { kicker: string; title: string; cta: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: "var(--surface)", border: "1px solid var(--surface-border)",
      borderRadius: "var(--radius-md)", padding: "1rem 1.25rem",
      textAlign: "left", cursor: "pointer", transition: "all 0.15s ease",
      display: "flex", flexDirection: "column", gap: "0.5rem",
    }}>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.2em",
        color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 600,
      }}>
        {kicker}
      </div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.4 }}>
        {title}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-y2k-blue)", fontWeight: 600, marginTop: "0.25rem" }}>
        {cta}
      </div>
    </button>
  );
}

function PreviewCTA() {
  return (
    <div style={{
      marginTop: "var(--space-xl)", padding: "1.5rem 1.75rem",
      background: "var(--text-primary)", color: "var(--bg)",
      borderRadius: "var(--radius-md)", maxWidth: "860px",
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem",
      flexWrap: "wrap",
    }}>
      <div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.7, marginBottom: "0.35rem" }}>
          Your chart is the blueprint
        </div>
        <div style={{ fontFamily: "var(--font-primary)", fontSize: "1.1rem", fontWeight: 600 }}>
          See what it looks like when you travel →
        </div>
      </div>
      <Link href="/" style={{
        background: "var(--bg)", color: "var(--text-primary)",
        padding: "0.75rem 1.25rem", borderRadius: "var(--radius-sm)",
        fontFamily: "var(--font-mono)", fontSize: "0.7rem", letterSpacing: "0.15em",
        textTransform: "uppercase", fontWeight: 700, textDecoration: "none",
      }}>
        Explore AstroNat
      </Link>
    </div>
  );
}
