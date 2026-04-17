"use client";

import Image from "next/image";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AstronatCard } from "@/app/components/ui/astronat-card";
import { AstroPill } from "@/app/components/ui/astro-pill";

type LockedReadingViewProps = {
  kicker?: string;
  title?: string;
  description?: string;
  returnTo?: string;
};

export default function LockedReadingView({
  kicker = "ONE READING DOWN",
  title = "Unlock Unlimited",
  description = "Your free reading has been used. Subscribe to generate unlimited travel, couples, solar-return, and mundane readings.",
  returnTo,
}: LockedReadingViewProps) {
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
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "var(--space-lg) 0" }}>
      <AstronatCard
        variant="surface"
        shape="asymmetric-md"
        className="relative overflow-hidden"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "clamp(1.5rem, 5vw, 3rem) clamp(1.25rem, 4vw, 2.5rem)",
            gap: "var(--space-md)",
          }}
        >
          {/* Saturn lock mark */}
          <div
            style={{
              position: "relative",
              width: 120,
              height: 120,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(4,86,251,0.18) 0%, transparent 72%)",
              border: "1px solid rgba(4,86,251,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 40px rgba(4,86,251,0.15)",
            }}
          >
            <Image
              src="/saturn-o.svg"
              alt=""
              width={64}
              height={64}
              className="saturn-lock-icon"
              style={{ opacity: 0.95 }}
            />
            {/* Small lock glyph tucked on Saturn's ring */}
            <span
              aria-hidden
              style={{
                position: "absolute",
                right: "calc(50% - 46px)",
                bottom: "calc(50% - 46px)",
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "var(--color-y2k-blue)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                border: "2px solid var(--bg)",
              }}
            >
              ♄
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", justifyContent: "center" }}>
            <AstroPill variant="ghost" size="xs" shape="pill">
              {kicker}
            </AstroPill>
            <AstroPill variant="accent" size="xs" shape="pill">
              $19.99/MO
            </AstroPill>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              textTransform: "uppercase",
              lineHeight: 0.9,
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {title.split(" ")[0]}{" "}
            <em
              style={{
                fontStyle: "italic",
                fontFamily: "var(--font-display-alt-2)",
                textTransform: "lowercase",
                color: "var(--color-y2k-blue)",
                fontSize: "1.25em",
              }}
            >
              {title.split(" ").slice(1).join(" ") || "unlimited"}
            </em>
          </h2>

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
              maxWidth: 420,
              margin: 0,
            }}
          >
            {description}
          </p>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn btn-primary"
            style={{
              marginTop: "var(--space-sm)",
              padding: "0.9rem 2rem",
              fontSize: "0.9rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              justifyContent: "center",
              minWidth: 220,
            }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={15} /> Redirecting…
              </>
            ) : (
              <>Unlock Pro — $19.99/mo</>
            )}
          </button>

          <a
            href="/readings"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.62rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              textDecoration: "none",
              marginTop: "0.25rem",
            }}
          >
            Re-read your free reading &rarr;
          </a>
        </div>
      </AstronatCard>

      <style jsx>{`
        :global([data-theme="light"]) .saturn-lock-icon {
          filter: none;
        }
        :global(:not([data-theme="light"])) .saturn-lock-icon {
          filter: invert(1);
        }
      `}</style>
    </div>
  );
}
