"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type CheckoutOffer = "single" | "monthly" | "lifetime";

type UpsellCelebrationCardProps = {
  returnTo?: string;
};

const UPSELL_TIERS: Array<{
  offer: CheckoutOffer;
  label: string;
  eyebrow: string;
  value: string;
  note: string;
  benefit: string;
  cta: string;
}> = [
  {
    offer: "single",
    label: "Single",
    eyebrow: "One decision",
    value: "$9.97",
    note: "One more city",
    benefit: "Run a full report when one trip, move, or date matters.",
    cta: "Unlock one more city",
  },
  {
    offer: "monthly",
    label: "Explorer",
    eyebrow: "Best for comparing",
    value: "$19.99/mo",
    note: "Unlimited readings",
    benefit: "Compare places for travel, timing, relationships, and momentum.",
    cta: "Start comparing cities",
  },
  {
    offer: "lifetime",
    label: "Founder",
    eyebrow: "Own the map",
    value: "$397",
    note: "Lifetime access",
    benefit: "Keep AstroNat open as your long-term location planning tool.",
    cta: "Get lifetime access",
  },
];

const BENEFITS = [
  "Compare cities without starting over",
  "Save the places that feel electric",
  "Plan trips, moves, and relationship timing",
  "Re-read your reports whenever the decision comes back",
];

/**
 * Inline post-reading upsell. Editorial commerce panel with in-app planet SVGs,
 * benefit-led copy, tier selection, and primary Y2K-blue checkout CTA.
 * Shown only to logged-in users who have used their free reading and aren't yet
 * subscribed — the parent is responsible for that gate.
 */
export default function UpsellCelebrationCard({ returnTo }: UpsellCelebrationCardProps) {
  const [loading, setLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<CheckoutOffer>("monthly");
  const selectedTier = UPSELL_TIERS.find((tier) => tier.offer === selectedOffer) ?? UPSELL_TIERS[1];

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const body = JSON.stringify({ offer: selectedOffer, ...(returnTo ? { returnTo } : {}) });
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data.error || "Unable to start checkout.");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      style={{
        position: "relative",
        background: "var(--color-eggshell)",
        color: "var(--color-charcoal)",
        borderRadius: "var(--shape-asymmetric-lg)",
        overflow: "hidden",
        marginTop: "var(--space-2xl)",
        border: "1px solid var(--surface-border)",
        boxShadow: "0 24px 80px color-mix(in srgb, var(--color-charcoal) 10%, transparent)",
      }}
    >
      <PlanetMedallion
        type="saturn"
        style={{
          position: "absolute",
          top: "clamp(1.4rem, 5vw, 3.4rem)",
          left: "clamp(1.25rem, 9vw, 7rem)",
          zIndex: 1,
        }}
      />
      <PlanetMedallion
        type="moon"
        style={{
          position: "absolute",
          top: "clamp(1.5rem, 4vw, 2.5rem)",
          right: "clamp(1rem, 8vw, 6rem)",
          zIndex: 1,
        }}
      />
      <PlanetMedallion
        type="jupiter"
        style={{
          position: "absolute",
          left: "clamp(1.5rem, 19vw, 13rem)",
          bottom: "clamp(14rem, 23vw, 18rem)",
          zIndex: 1,
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: "23%",
          right: "7%",
          fontFamily: "var(--font-display-alt-2)",
          fontSize: "clamp(6rem, 18vw, 14rem)",
          lineHeight: 0.5,
          color: "var(--color-y2k-blue)",
          opacity: 0.08,
          pointerEvents: "none",
          letterSpacing: 0,
        }}
      >
        more cities
      </span>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "clamp(1.25rem, 3vw, 2rem)",
          padding: "clamp(2rem, 6vw, 5rem) clamp(1.25rem, 6vw, 5rem)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.55rem",
            flexWrap: "wrap",
            marginTop: "clamp(1rem, 3vw, 2.25rem)",
          }}
        >
          <span style={pillStyle}>Free reading saved</span>
          <span style={{ ...pillStyle, background: "var(--color-y2k-blue)", borderColor: "var(--color-y2k-blue)", color: "white" }}>
            3 access tiers
          </span>
        </div>

        <div style={{ textAlign: "center", maxWidth: 960, margin: "0 auto" }}>
          <h3
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: "clamp(2.4rem, 7vw, 5.4rem)",
              textTransform: "uppercase",
              lineHeight: 0.9,
              letterSpacing: 0,
              margin: 0,
            }}
          >
            One city is a signal.
            <br className="upsell-title-break" />
            <span
              style={{
                fontFamily: "var(--font-display-alt-2)",
                fontStyle: "italic",
                textTransform: "none",
                color: "var(--color-y2k-blue)",
                fontSize: "1.1em",
                whiteSpace: "nowrap",
              }}
            >
              More cities reveal the pattern.
            </span>
          </h3>

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              lineHeight: 1.6,
              color: "color-mix(in srgb, var(--color-charcoal) 76%, transparent)",
              margin: "clamp(1rem, 2vw, 1.3rem) auto 0",
              maxWidth: 740,
            }}
          >
            Your first reading is saved. Keep the map open to compare the places pulling on
            your work, love, rest, and timing — without guessing from one report alone.
          </p>
        </div>

        <div className="upsell-benefit-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "0.65rem",
        }}>
          {BENEFITS.map((benefit, index) => (
            <div
              key={benefit}
              style={{
                minHeight: 90,
                border: "1px solid var(--surface-border)",
                borderRadius: "var(--radius-md)",
                background: index % 2 === 0 ? "rgba(255,255,255,0.42)" : "color-mix(in srgb, var(--color-acqua) 24%, transparent)",
                padding: "0.85rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "0.75rem",
              }}
            >
              <span style={{ color: index === 1 ? "var(--color-spiced-life)" : "var(--color-y2k-blue)", lineHeight: 1 }}>
                {index === 0 ? "✦" : index === 1 ? "♃" : index === 2 ? "☽" : "♄"}
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 700, lineHeight: 1.25 }}>
                {benefit}
              </span>
            </div>
          ))}
        </div>

        <div className="upsell-tier-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "0.7rem",
        }}>
          {UPSELL_TIERS.map((tier) => {
            const active = selectedOffer === tier.offer;
            return (
              <button
                key={tier.offer}
                type="button"
                onClick={() => setSelectedOffer(tier.offer)}
                aria-pressed={active}
                style={{
                  minHeight: 190,
                  border: `1.5px solid ${active ? "var(--color-y2k-blue)" : "var(--surface-border)"}`,
                  borderRadius: "var(--radius-sm)",
                  background: active ? "color-mix(in srgb, var(--color-y2k-blue) 10%, white 90%)" : "rgba(255,255,255,0.34)",
                  color: "var(--color-charcoal)",
                  cursor: "pointer",
                  padding: "1rem",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.55rem",
                  boxShadow: active ? "0 14px 0 color-mix(in srgb, var(--color-y2k-blue) 12%, transparent)" : "none",
                  transition: "transform 0.18s var(--ease), box-shadow 0.18s var(--ease), border-color 0.18s var(--ease)",
                }}
              >
                <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.7rem" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-charcoal) 58%, transparent)" }}>
                    {tier.eyebrow}
                  </span>
                  {tier.offer === "monthly" && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.48rem", letterSpacing: "0.12em", textTransform: "uppercase", background: "var(--color-y2k-blue)", color: "white", borderRadius: "var(--radius-full)", padding: "0.25rem 0.45rem", whiteSpace: "nowrap" }}>
                      Recommended
                    </span>
                  )}
                </span>
                <span style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "0.76rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {tier.label}
                </span>
                <span style={{ display: "block", fontFamily: "var(--font-primary)", fontSize: "clamp(1.6rem, 3vw, 2.3rem)", lineHeight: 0.95 }}>
                  {tier.value}
                </span>
                <span style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 700 }}>
                  {tier.note}
                </span>
                <span style={{ display: "block", marginTop: "auto", fontFamily: "var(--font-body)", fontSize: "0.75rem", lineHeight: 1.35, color: "color-mix(in srgb, var(--color-charcoal) 68%, transparent)" }}>
                  {tier.benefit}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.1rem", marginTop: "0.25rem" }}>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: "min(100%, 440px)",
              minHeight: 64,
              borderRadius: "var(--shape-asymmetric-md)",
              padding: "1rem 1.75rem",
              fontSize: "1rem",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={15} /> Redirecting…
              </>
            ) : (
              <>{selectedTier.cta}</>
            )}
          </button>

          {returnTo && (
            <a
              href={returnTo}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "color-mix(in srgb, var(--color-charcoal) 62%, transparent)",
                textDecoration: "none",
              }}
            >
              Re-read your free reading →
            </a>
          )}
        </div>
      </div>

      <style jsx>{`
        :global(.upsell-tier-grid button:hover) {
          transform: translateY(-2px);
        }

        @media (max-width: 900px) {
          :global(.upsell-benefit-grid) {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 700px) {
          :global(.upsell-benefit-grid),
          :global(.upsell-tier-grid) {
            grid-template-columns: 1fr !important;
          }

          .upsell-title-break {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 34,
  border: "1px solid var(--surface-border)",
  borderRadius: "var(--radius-full)",
  padding: "0.45rem 0.85rem",
  fontFamily: "var(--font-mono)",
  fontSize: "0.62rem",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  background: "rgba(255,255,255,0.38)",
  color: "var(--color-charcoal)",
};

function PlanetMedallion({
  type,
  style,
}: {
  type: "saturn" | "moon" | "jupiter";
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      style={{
        width: type === "saturn" ? 92 : 74,
        height: type === "saturn" ? 92 : 74,
        borderRadius: "50%",
        background: type === "moon" ? "color-mix(in srgb, var(--sage) 24%, white 76%)" : "color-mix(in srgb, var(--color-acqua) 18%, white 82%)",
        border: `2px solid ${type === "jupiter" ? "var(--color-spiced-life)" : type === "moon" ? "var(--sage)" : "var(--color-y2k-blue)"}`,
        display: "grid",
        placeItems: "center",
        boxShadow: "0 16px 40px color-mix(in srgb, var(--color-charcoal) 10%, transparent)",
        ...style,
      }}
    >
      {type === "saturn" && (
        <svg viewBox="0 0 100 100" width="68" height="68" fill="none">
          <circle cx="50" cy="50" r="18" stroke="var(--color-charcoal)" strokeWidth="7" />
          <path d="M17 55C34 40 68 39 86 47" stroke="var(--color-y2k-blue)" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 5" />
          <path d="M19 56C38 68 69 66 84 50" stroke="var(--color-spiced-life)" strokeWidth="4" strokeLinecap="round" />
          <circle cx="18" cy="55" r="4" fill="var(--color-y2k-blue)" />
          <circle cx="86" cy="47" r="4" fill="var(--color-y2k-blue)" />
        </svg>
      )}
      {type === "moon" && (
        <svg viewBox="0 0 80 80" width="46" height="46" fill="none">
          <path d="M48 16C38 19 30 29 30 41C30 53 38 62 49 65C43 69 35 70 28 67C17 63 10 52 12 40C14 25 27 15 42 15C44 15 46 15 48 16Z" stroke="var(--sage)" strokeWidth="4" />
        </svg>
      )}
      {type === "jupiter" && (
        <svg viewBox="0 0 80 80" width="44" height="44" fill="none">
          <circle cx="40" cy="40" r="26" stroke="var(--color-spiced-life)" strokeWidth="3" strokeDasharray="3 5" />
          <text x="40" y="51" textAnchor="middle" fontFamily="serif" fontSize="38" fill="var(--color-spiced-life)">♃</text>
        </svg>
      )}
    </div>
  );
}
