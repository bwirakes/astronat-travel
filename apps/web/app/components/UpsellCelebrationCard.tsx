"use client";

import Image from "next/image";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AstroPill } from "@/app/components/ui/astro-pill";

type UpsellCelebrationCardProps = {
  returnTo?: string;
};

/**
 * Inline post-reading upsell. Ebook-style card: black background, organic-blob
 * image, oversized SLOOP SCRIPT overlap, pill tags, primary Y2K-blue CTA.
 * Shown only to logged-in users who have used their free reading and aren't yet
 * subscribed — the parent is responsible for that gate.
 */
export default function UpsellCelebrationCard({ returnTo }: UpsellCelebrationCardProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const body = returnTo ? JSON.stringify({ returnTo }) : undefined;
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
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
        background: "var(--color-black)",
        color: "var(--color-eggshell)",
        borderRadius: "var(--shape-asymmetric-lg)",
        overflow: "hidden",
        marginTop: "var(--space-2xl)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Oversized SLOOP SCRIPT overlap — reading "more" */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: "42%",
          right: "-4%",
          fontFamily: "var(--font-display-alt-2)",
          fontSize: "clamp(8rem, 18vw, 16rem)",
          lineHeight: 0.5,
          color: "var(--color-y2k-blue)",
          opacity: 0.9,
          pointerEvents: "none",
          textShadow: "0 0 60px rgba(4,86,251,0.35)",
          letterSpacing: "-0.02em",
        }}
      >
        more
      </span>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.15fr)",
          gap: "var(--space-lg)",
          padding: "clamp(1.5rem, 4vw, 3rem)",
          alignItems: "center",
          position: "relative",
          zIndex: 2,
        }}
        className="upsell-grid"
      >
        {/* Organic-blob image */}
        <div
          style={{
            position: "relative",
            aspectRatio: "4 / 5",
            width: "100%",
            borderRadius: "var(--shape-organic-1)",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <Image
            src="/green_phone.png"
            alt=""
            fill
            style={{ objectFit: "cover", objectPosition: "center" }}
            sizes="(max-width: 700px) 90vw, 340px"
          />
        </div>

        {/* Copy + CTA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <AstroPill variant="accent" size="xs" shape="pill">
              $19.99/MO
            </AstroPill>
            <AstroPill variant="ghost" size="xs" shape="pill" style={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.2)" }}>
              CANCEL ANYTIME
            </AstroPill>
          </div>

          <h3
            style={{
              fontFamily: "var(--font-display-alt-1)",
              fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
              textTransform: "uppercase",
              lineHeight: 0.95,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            Unlimited readings,
            <br />
            <span style={{ color: "var(--color-y2k-blue)" }}>on repeat.</span>
          </h3>

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              color: "rgba(248,245,236,0.78)",
              margin: 0,
              maxWidth: 460,
            }}
          >
            That was your free reading. Subscribe for unlimited travel, couples, and
            solar-return readings — anywhere on the planet, any month you like.
          </p>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
              fontFamily: "var(--font-body)",
              fontSize: "0.82rem",
              color: "rgba(248,245,236,0.78)",
            }}
          >
            {[
              "Every reading type, unlocked",
              "12-month personal transit windows",
              "Unlimited partner charts for couples",
            ].map((feat) => (
              <li key={feat} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ color: "var(--color-y2k-blue)" }}>✦</span>
                {feat}
              </li>
            ))}
          </ul>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn btn-primary"
            style={{
              alignSelf: "flex-start",
              marginTop: "var(--space-xs)",
              padding: "0.9rem 1.75rem",
              fontSize: "0.9rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={15} /> Redirecting…
              </>
            ) : (
              <>Unlock Pro</>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 700px) {
          :global(.upsell-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
