"use client";

import { useRef, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import styles from "./page.module.css";

// ─── Astro Nat — Unified Landing Page ────────────────────────────────────────
// Canonical: anchored on astro_brand_guidelines.md + globals.css + SKILL.md
// Rules:
//   - All colors via CSS vars (var(--*)). Zero hardcoded hex values.
//   - Fonts: --font-primary (BETTER DAYS) for hero, --font-secondary (PERFECTLY
//     NINETIES) for editorial, --font-display-alt-2 (SLOOP SCRIPT) for overlaps.
//   - CTA: Y2K Blue (--color-y2k-blue) with asymmetric M3 cut shape (--cut-xl).
//   - Image: M3 cut-path frame (--cut-xl) — per SKILL §3 Option B.
//   - Process section: stark Eggshell / Charcoal color block inversion.

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const container = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
      const getUser = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user);
      };
      getUser();

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useGSAP(() => {
    // ── Starfield Animation ───────────────────────────────────
    gsap.utils.toArray(".star-anim").forEach((star: any) => {
      // Randomize initial position slightly
      gsap.to(star, {
        y: "random(-20, 20)",
        x: "random(-20, 20)",
        opacity: "random(0.1, 0.8)",
        duration: "random(3, 7)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      // Add a subtle parallax on scroll
      gsap.to(star, {
        yPercent: "random(-50, 50)",
        ease: "none",
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    });

    // ── Hero Timeline ──────────────────────────────────────────
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // Animate the text container
    tl.fromTo(
      ".hero-anim",
      { y: 60, opacity: 0, rotationX: -15, skewY: 2 },
      { y: 0, opacity: 1, rotationX: 0, skewY: 0, duration: 1.2, stagger: 0.15 }
    );

    // Animate the image frame with levitation follow-up
    tl.fromTo(
      ".hero-img-anim",
      { scale: 0.9, opacity: 0, rotation: 5, x: 20 },
      { scale: 1, opacity: 1, rotation: 0, x: 0, duration: 1.4, ease: "elastic.out(1, 0.8)",
        onComplete: () => {
          gsap.to(".hero-img-anim", {
            y: -15,
            rotation: 1,
            duration: 4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
        }
      },
      "-=0.8"
    );

    // ── Hover interaction for CTA ──────────────────────────────
    const ctaBtn = document.querySelector("#cta-start");
    if (ctaBtn) {
      ctaBtn.addEventListener("mouseenter", () => {
        gsap.to(ctaBtn, { scale: 1.05, duration: 0.3, ease: "back.out(2)" });
        gsap.to(".cta-icon", { x: 5, duration: 0.3, ease: "power2.out" });
      });
      ctaBtn.addEventListener("mouseleave", () => {
        gsap.to(ctaBtn, { scale: 1, duration: 0.3, ease: "power2.out" });
        gsap.to(".cta-icon", { x: 0, duration: 0.3, ease: "power2.out" });
      });
    }

    // ── Animate the process steps on scroll ───────────────────
    gsap.utils.toArray(".process-step").forEach((step: any, i) => {
      gsap.fromTo(
        step,
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.5)",
          scrollTrigger: {
            trigger: step,
            start: "top 85%",
          }
        }
      );
    });
  }, { scope: container });

  return (
    <div ref={container}>
      {/* ── Atmospheric Background ─────────────────────────────────── */}
      <div className={styles.atmosphericBg} aria-hidden="true">
        <div className={styles.grainOverlay} />
      </div>

      {/* ── Starfield — blocky Y2K pixel stars ───────────────────── */}
      <div className={styles.starField} aria-hidden="true">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className={`${styles.star} star-anim`}
            style={{
              left: `${(i * 17.3 + 11) % 100}%`,
              top: `${(i * 13.7 + 7) % 100}%`,
              width: `${(i % 3) * 0.6 + 0.4}px`,
              height: `${(i % 3) * 0.6 + 0.4}px`,
              opacity: 0.15 + (i % 4) * 0.08,
            }}
          />
        ))}
      </div>

      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <main className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>

            {/* Left: Content — typographic hierarchy from brand guidelines */}
            <div className={styles.heroContent} style={{ perspective: "1000px" }}>
              {/* H1 — BETTER DAYS (--font-primary), uppercase structural text */}
              <h1 className={`${styles.headline} hero-anim`} style={{ opacity: 0 }}>
                Where should you{" "}
                <em>travel</em> next?
              </h1>

              {/* Body — GARET (--font-body) */}
              <p className={`${styles.subline} hero-anim`} style={{ opacity: 0 }}>
                You deserve the best possible environment to thrive in and fulfil your natal promise.
                Use our astrocartography travel planner to figure out where to go — and{" "}
                <em>when</em>.
              </p>

              {/* CTA — Y2K Blue + M3 asymmetric shape per SKILL §3 Option A */}
              <div className="hero-anim" style={{ opacity: 0 }}>
                <Link href={user ? "/home" : "/flow"} className={styles.ctaBtn} id="cta-start">
                  {user ? "Enter Astronat Portal" : "Begin your Travels"} <ArrowRight className={`${styles.ctaIcon} cta-icon`} />
                </Link>
              </div>
            </div>

            {/* Right: M3 cut-path image frame per brand SKILL §3 Option B */}
            <div className={`${styles.heroImageWrap} hero-img-anim`} style={{ opacity: 0 }}>
              <div className={styles.astroCutout}>
                <Image
                  src="/astronat-hero.jpg"
                  alt="Astro Nat on a red Vespa surrounded by cypress trees"
                  fill
                  className={styles.heroImg}
                  priority
                />
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── Process — stark Eggshell/Charcoal color block inversion ── */}
      <section className={styles.process}>
        <div className={styles.container}>
          <h5 className={styles.sectionLabel}>How it works</h5>
          <div className={styles.steps}>
            {[
              {
                number: "01",
                title: "Your chart",
                desc: "Enter your birth details. We calculate your natal chart and project it across the globe using high-precision data.",
              },
              {
                number: "02",
                title: "Your destination",
                desc: "Choose where you're going. We'll show which planetary lines are active and what they mean for that city.",
              },
              {
                number: "03",
                title: "Your timing",
                desc: "See the next 12 months of transits mapped to your houses. Travel when the planets support it — not against them.",
              },
            ].map((step, i) => (
              <div key={i} className={`${styles.step} process-step`} style={{ opacity: 0 }}>
                <span className={styles.stepNum}>{step.number} —</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pull Quote ────────────────────────────────────────────── */}
      <section className={styles.quote}>
        <div className={styles.container}>
          <blockquote className={styles.blockquote}>
            <p>
              &ldquo;Astrocartography isn&rsquo;t about luck. It&rsquo;s about understanding which locations
              activate your chart — and planning around that.&rdquo;
            </p>
            <cite className={styles.cite}>— Astro Nat</cite>
          </blockquote>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
