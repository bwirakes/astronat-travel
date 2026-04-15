"use client";

import { useRef, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import styles from "./page.module.css";

// ─── Astro Nat — App Branding Landing Page ──────────────────────────────────
// This page is now served at /app to act as the primary intro to the platform.
// Routing: Visitors -> /app -> (Login) -> /dashboard

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AppLanding() {
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
      gsap.to(star, {
        y: "random(-20, 20)",
        x: "random(-20, 20)",
        opacity: "random(0.1, 0.8)",
        duration: "random(3, 7)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
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

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.fromTo(
      ".hero-anim",
      { y: 60, opacity: 0, rotationX: -15, skewY: 2 },
      { y: 0, opacity: 1, rotationX: 0, skewY: 0, duration: 1.2, stagger: 0.15 }
    );

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
      <div className={styles.atmosphericBg} aria-hidden="true">
        <div className={styles.grainOverlay} />
      </div>

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

      <main className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent} style={{ perspective: "1000px" }}>
              <h1 className={`${styles.headline} hero-anim`} style={{ opacity: 0 }}>
                Where should you{" "}
                <em>travel</em> next?
              </h1>

              <p className={`${styles.subline} hero-anim`} style={{ opacity: 0 }}>
                You deserve the best possible environment to thrive in and fulfil your natal promise.
                Use our astrocartography travel planner to figure out where to go — and{" "}
                <em>when</em>.
              </p>

              <div className="hero-anim" style={{ opacity: 0 }}>
                <Link href={user ? "/dashboard" : "/flow"} className={styles.ctaBtn} id="cta-start">
                  {user ? "Enter Astronat Portal" : "Begin your Travels"} <ArrowRight className={`${styles.ctaIcon} cta-icon`} />
                </Link>
              </div>
            </div>

            <div className={`${styles.heroImageWrap} hero-img-anim`} style={{ opacity: 0 }}>
              <div className={styles.astroCutout}>
                <Image
                  src="/astronat-hero.jpg"
                  alt="Astro Nat"
                  fill
                  className={styles.heroImg}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </main>

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

      <Footer />
    </div>
  );
}
