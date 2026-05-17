"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AstronatCard } from "@/app/components/ui/astronat-card";

type CheckoutOffer = "single" | "monthly" | "lifetime";

type LockedReadingViewProps = {
  kicker?: string;
  title?: string;
  description?: string;
  returnTo?: string;
};

const TIERS: Array<{
  offer: CheckoutOffer;
  label: string;
  value: string;
  note: string;
  cta: string;
}> = [
  { offer: "single", label: "Single", value: "$9.97", note: "One more city", cta: "Unlock one more city" },
  { offer: "monthly", label: "Explorer", value: "$19.99/mo", note: "Unlimited comparisons", cta: "Start comparing" },
  { offer: "lifetime", label: "Founder", value: "$397", note: "Lifetime access", cta: "Get lifetime access" },
];

export default function LockedReadingView({
  kicker = "FREE READING SAVED",
  returnTo,
}: LockedReadingViewProps) {
  const [loading, setLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<CheckoutOffer>("monthly");
  const selectedTier = TIERS.find((tier) => tier.offer === selectedOffer) ?? TIERS[1];

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
    <div className="locked-shell" style={{ maxWidth: 820, margin: "0 auto", padding: "var(--space-sm) 0" }}>
      <AstronatCard variant="surface" shape="asymmetric-md" className="locked-panel">
        <div className="locked-brand-side" aria-hidden>
          <div className="locked-orbit">
            <svg viewBox="0 0 220 220" fill="none">
              <circle cx="110" cy="110" r="105" stroke="currentColor" strokeWidth="0.8" />
              <ellipse cx="110" cy="110" rx="60" ry="105" stroke="currentColor" strokeWidth="0.7" />
              <ellipse cx="110" cy="110" rx="105" ry="34" stroke="currentColor" strokeWidth="0.6" />
              <line x1="8" y1="110" x2="212" y2="110" stroke="currentColor" strokeWidth="0.5" />
              <line x1="110" y1="8" x2="110" y2="212" stroke="currentColor" strokeWidth="0.5" />
            </svg>
          </div>

          <div className="locked-planet locked-saturn">
            <SaturnGlyph />
          </div>
          <div className="locked-planet locked-moon">
            <MoonGlyph />
          </div>
          <div className="locked-star locked-star-a">✦</div>
          <div className="locked-star locked-star-b">✦</div>

          <div className="locked-quote">
            <SaturnMini />
            <blockquote>
              “The location strategies helped me find the exact city where my Venus line is active.”
            </blockquote>
            <div>
              <strong>M.C.</strong>
              <span>Los Angeles via AstroNat</span>
            </div>
          </div>
        </div>

        <div className="locked-action-side">
          <span className="locked-action-bg" aria-hidden>compare</span>
          <div className="locked-mobile-mark" aria-hidden>
            <SaturnMini />
          </div>

          <div className="locked-kicker">{kicker}</div>

          <h2>
            <span>Don’t marry the</span>
            <br />
            <span>first city</span>
            <span className="locked-title-emoji" aria-hidden>💍</span>
          </h2>

          <p>
            One reading is a first date, <strong>not a life plan</strong>. Compare a few places before you let one pretty score boss you around.
          </p>

          <div className="locked-tier-list">
            {TIERS.map((tier) => {
              const active = selectedOffer === tier.offer;
              return (
                <button
                  key={tier.offer}
                  type="button"
                  onClick={() => setSelectedOffer(tier.offer)}
                  aria-pressed={active}
                  className={active ? "locked-tier locked-tier-active" : "locked-tier"}
                >
                  <span className="locked-tier-left">
                    <TierIcon offer={tier.offer} />
                    <span>
                      <strong>{tier.label}</strong>
                      {tier.offer === "lifetime" && <b>Limited Slots</b>}
                    </span>
                  </span>
                  <span>
                    <strong>{tier.value}</strong>
                    <small>{tier.note}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn btn-primary locked-cta"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={15} /> Redirecting…
              </>
            ) : (
              <>{selectedTier.cta}</>
            )}
          </button>

          <a href={returnTo || "/readings"} className="locked-return">
            Re-read your free reading →
          </a>
        </div>
      </AstronatCard>

      <style jsx>{`
        :global(.locked-panel) {
          display: grid;
          grid-template-columns: 1fr;
          min-height: 0;
          overflow: hidden;
        }

        .locked-brand-side {
          position: relative;
          min-height: 460px;
          border-right: 1px solid var(--surface-border);
          background: var(--color-eggshell);
          color: var(--color-charcoal);
          display: none;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 2rem;
        }

        .locked-orbit {
          position: absolute;
          inset: 50% auto auto 50%;
          width: min(72%, 320px);
          aspect-ratio: 1;
          color: var(--color-charcoal);
          opacity: 0.07;
          transform: translate(-50%, -50%);
          animation: locked-spin 120s linear infinite;
        }

        .locked-orbit svg {
          width: 100%;
          height: 100%;
        }

        .locked-quote {
          position: relative;
          z-index: 2;
          max-width: 310px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.9rem;
        }

        .locked-quote blockquote {
          margin: 0;
          font-family: var(--font-secondary);
          font-style: italic;
          font-size: clamp(1.05rem, 2vw, 1.32rem);
          line-height: 1.25;
          color: var(--color-charcoal);
        }

        .locked-quote strong {
          display: block;
          font-family: var(--font-body);
          font-size: 0.78rem;
          color: var(--color-charcoal);
        }

        .locked-quote span {
          display: block;
          margin-top: 0.25rem;
          font-family: var(--font-mono);
          font-size: 0.52rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: color-mix(in srgb, var(--color-charcoal) 58%, transparent);
        }

        .locked-planet {
          position: absolute;
          z-index: 1;
          opacity: 0.82;
          animation: locked-float 6s ease-in-out infinite;
          pointer-events: none;
        }

        .locked-saturn {
          top: 16%;
          left: 17%;
          color: var(--color-y2k-blue);
        }

        .locked-moon {
          right: 17%;
          top: 23%;
          color: var(--color-acqua);
          animation-delay: -2s;
        }

        .locked-star {
          position: absolute;
          z-index: 1;
          pointer-events: none;
          animation: locked-float 7s ease-in-out infinite;
        }

        .locked-star-a {
          left: 18%;
          bottom: 26%;
          color: var(--gold);
          font-size: 1.7rem;
        }

        .locked-star-b {
          right: 20%;
          bottom: 20%;
          color: var(--color-spiced-life);
          font-size: 1rem;
          animation-delay: -3s;
        }

        .locked-action-side {
          position: relative;
          background: var(--color-y2k-blue);
          padding: clamp(1.25rem, 3vw, 2.25rem);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.9rem;
          overflow: hidden;
        }

        @media (min-width: 1181px) {
          :global(.locked-panel) {
            grid-template-columns: minmax(0, 0.9fr) minmax(340px, 1fr);
            min-height: 460px;
          }

          .locked-brand-side {
            display: flex;
          }
        }

        .locked-action-side > :not(.locked-action-bg) {
          position: relative;
          z-index: 2;
        }

        .locked-action-bg {
          position: absolute;
          right: -0.35em;
          top: 0.12em;
          z-index: 1;
          font-family: var(--font-display-alt-2);
          font-size: clamp(6rem, 15vw, 12rem);
          line-height: 0.75;
          color: white;
          opacity: 0.09;
          pointer-events: none;
        }

        .locked-mobile-mark {
          display: none;
        }

        .locked-kicker {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: color-mix(in srgb, white 74%, transparent);
        }

        h2 {
          margin: 0;
          font-family: var(--font-primary);
          font-size: clamp(2.1rem, 3.6vw, 3.05rem);
          line-height: 0.9;
          text-transform: uppercase;
          color: white;
        }

        .locked-title-emoji {
          display: inline-block;
          margin-left: 0.15em;
          font-size: 0.58em;
          line-height: 1;
          vertical-align: -0.08em;
        }

        p {
          margin: 0;
          max-width: 380px;
          font-family: var(--font-body);
          font-size: 0.86rem;
          line-height: 1.45;
          color: color-mix(in srgb, white 82%, transparent);
        }

        p strong {
          color: white;
          font-weight: 800;
        }

        .locked-tier-list {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          margin-top: 0.25rem;
        }

        .locked-tier {
          width: 100%;
          border: 1.5px solid color-mix(in srgb, white 72%, transparent);
          background: color-mix(in srgb, var(--color-y2k-blue) 78%, black 22%);
          color: white;
          cursor: pointer;
          padding: 0.72rem 0.85rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          text-align: left;
          transition: border-color 0.18s var(--ease), background 0.18s var(--ease), transform 0.18s var(--ease);
        }

        .locked-tier:hover {
          transform: translateY(-1px);
        }

        .locked-tier-active {
          border-color: white;
          background: white;
          color: var(--color-charcoal);
          box-shadow: 0 10px 0 color-mix(in srgb, black 18%, transparent);
        }

        .locked-tier span {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
        }

        .locked-tier > span:last-child {
          align-items: flex-end;
          text-align: right;
          flex-shrink: 0;
        }

        .locked-tier-left {
          flex-direction: row !important;
          align-items: center;
          gap: 0.65rem !important;
        }

        .locked-tier-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          background: color-mix(in srgb, white 18%, transparent);
          color: white;
          border: 1px solid color-mix(in srgb, white 34%, transparent);
        }

        .locked-tier-active .locked-tier-icon {
          background: color-mix(in srgb, var(--color-y2k-blue) 10%, white 90%);
          border-color: color-mix(in srgb, var(--color-y2k-blue) 28%, white 72%);
          color: var(--color-y2k-blue);
        }

        .locked-tier strong {
          font-family: var(--font-body);
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          color: inherit;
        }

        .locked-tier > span:last-child strong {
          font-family: var(--font-primary);
          font-size: 0.98rem;
          font-weight: 400;
          line-height: 1;
        }

        .locked-tier small {
          font-family: var(--font-body);
          font-size: 0.7rem;
          color: color-mix(in srgb, currentColor 70%, transparent);
        }

        .locked-tier b {
          align-self: flex-start;
          width: fit-content;
          border-radius: var(--radius-full);
          background: #16a34a;
          color: white;
          padding: 0.2rem 0.42rem;
          font-family: var(--font-mono);
          font-size: 0.46rem;
          letter-spacing: 0.11em;
          text-transform: uppercase;
        }

        .locked-cta {
          width: 100%;
          min-height: 48px;
          justify-content: center;
          margin-top: 0.2rem;
          border-radius: var(--shape-asymmetric-md);
          background: white !important;
          border-color: white !important;
          color: var(--color-y2k-blue) !important;
          box-shadow: 0 12px 0 color-mix(in srgb, black 18%, transparent);
          font-weight: 800;
        }

        .locked-return {
          align-self: center;
          font-family: var(--font-mono);
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: color-mix(in srgb, white 70%, transparent);
          text-decoration: none;
        }

        .locked-return:hover {
          color: white;
        }

        @keyframes locked-spin {
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        @keyframes locked-float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(3deg);
          }
        }

        @media (max-width: 1180px) {
          .locked-shell {
            width: 100vw;
            height: calc(100dvh - var(--page-header-height, 64px));
            min-height: calc(100dvh - var(--page-header-height, 64px));
            max-width: none !important;
            margin-left: calc(50% - 50vw) !important;
            margin-right: calc(50% - 50vw) !important;
            padding: 0 !important;
            overflow: hidden;
          }

          :global(.locked-panel) {
            width: 100%;
            grid-template-columns: 1fr;
            height: 100%;
            min-height: 0;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
          }

          .locked-brand-side {
            display: none;
          }

          .locked-action-side {
            height: 100%;
            min-height: 0;
            box-sizing: border-box;
            padding: clamp(1rem, 5vw, 1.35rem);
            background: var(--color-y2k-blue);
            border-radius: 0;
            gap: 0.62rem;
            justify-content: center;
          }

          .locked-mobile-mark {
            display: none;
          }

          .locked-action-bg {
            top: 0.05em;
            font-size: clamp(5rem, 26vw, 8rem);
          }

          .locked-kicker {
            font-size: 0.56rem;
          }

          h2 {
            font-size: clamp(2rem, 10vw, 2.55rem);
          }

          p {
            font-size: 0.82rem;
            line-height: 1.35;
          }

          .locked-tier-list {
            gap: 0.42rem;
          }

          .locked-tier {
            padding: 0.55rem 0.65rem;
            min-height: 68px;
          }

          .locked-tier-icon {
            width: 28px;
            height: 28px;
          }

          .locked-tier strong {
            font-size: 0.74rem;
          }

          .locked-tier > span:last-child strong {
            font-size: 0.9rem;
          }

          .locked-tier small {
            font-size: 0.66rem;
          }

          .locked-tier b {
            font-size: 0.42rem;
            padding: 0.17rem 0.36rem;
          }

          .locked-cta {
            min-height: 44px;
            box-shadow: 0 8px 0 color-mix(in srgb, black 18%, transparent);
          }

          .locked-return {
            font-size: 0.56rem;
          }

          .locked-tier {
            background: color-mix(in srgb, var(--color-y2k-blue) 78%, black 22%);
          }

          .locked-tier-active {
            background: white;
          }
        }
      `}</style>
    </div>
  );
}

function SaturnMini() {
  return (
    <svg viewBox="0 0 80 80" width="48" height="48" fill="none" aria-hidden>
      <circle cx="40" cy="40" r="36" stroke="var(--color-y2k-blue)" strokeWidth="1.8" />
      <ellipse cx="40" cy="40" rx="25" ry="7" transform="rotate(-18 40 40)" stroke="var(--color-y2k-blue)" strokeWidth="1.2" strokeDasharray="4 3" />
      <text x="40" y="52" fontFamily="var(--font-secondary)" fontSize="30" fill="var(--color-y2k-blue)" textAnchor="middle">♄</text>
    </svg>
  );
}

function TierIcon({ offer }: { offer: CheckoutOffer }) {
  if (offer === "single") {
    return (
      <span className="locked-tier-icon" aria-hidden>
        <svg viewBox="0 0 32 32" width="20" height="20" fill="none">
          <path d="M16 3L18.8 13.2L29 16L18.8 18.8L16 29L13.2 18.8L3 16L13.2 13.2L16 3Z" fill="currentColor" />
        </svg>
      </span>
    );
  }

  if (offer === "monthly") {
    return (
      <span className="locked-tier-icon" aria-hidden>
        <svg viewBox="0 0 36 36" width="23" height="23" fill="none">
          <circle cx="18" cy="18" r="8" stroke="currentColor" strokeWidth="3" />
          <ellipse cx="18" cy="18" rx="15" ry="4.5" transform="rotate(-16 18 18)" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      </span>
    );
  }

  return (
    <span className="locked-tier-icon" aria-hidden>
      <svg viewBox="0 0 36 36" width="22" height="22" fill="none">
        <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="2" />
        <path d="M22.5 8.5C17 10 13.5 14.8 14.3 20.1C15 25 19.1 28 24 27.3C21.7 29.2 18.5 30 15.4 29.1C9.4 27.3 6.1 21 8.2 15.2C10.1 9.9 15.8 6.9 21.1 8.2C21.6 8.3 22.1 8.4 22.5 8.5Z" fill="currentColor" />
      </svg>
    </span>
  );
}

function SaturnGlyph() {
  return (
    <svg viewBox="0 0 96 96" width="76" height="76" fill="none" aria-hidden>
      <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="1.8" />
      <ellipse cx="48" cy="48" rx="31" ry="8" transform="rotate(-18 48 48)" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3" />
      <text x="48" y="61" fontFamily="var(--font-secondary)" fontSize="38" fill="currentColor" textAnchor="middle">♄</text>
    </svg>
  );
}

function MoonGlyph() {
  return (
    <svg viewBox="0 0 90 90" width="66" height="66" fill="none" aria-hidden>
      <circle cx="45" cy="45" r="41" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="45" cy="45" r="33" fill="currentColor" opacity="0.1" />
      <text x="45" y="59" fontFamily="var(--font-secondary)" fontSize="36" fill="currentColor" textAnchor="middle">☽</text>
    </svg>
  );
}
