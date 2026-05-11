"use client";
import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Moon, Sun, AlertCircle, Compass, FileText } from "lucide-react";
import { NatalWheelSVG } from "@/app/components/natal/NatalWheelSVG";
import { AcgMap } from "@/app/components/AcgMap";
import InteractiveGeodeticWorldMap from "@/app/geodetic/components/InteractiveGeodeticWorldMap";

// Helper for Payload Rich Text mapping if needed, though for now we can assume
// Payload sends down raw HTML (if using Lexical HTML converter) or we handle basic mapping.
// For safety, assuming block.xxxHtml might be a pre-rendered string or slate structure.
const renderHtml = (htmlContent: any) => {
  if (typeof htmlContent === "string") return htmlContent;
  return String(htmlContent || "");
};

/**
 * Astro-Brand theme resolver for Payload blocks.
 * Maps bgToken labels to appropriate CSS classes and semantic text variables.
 */
const getBlockTheme = (bgToken: string | undefined) => {
  const token = bgToken?.toLowerCase();
  
  // BRAND COLORS
  if (token === 'y2k-blue' || token === 'y2kblue') {
    return {
      bgClass: "bg-[var(--color-y2k-blue)]",
      textClass: "text-[var(--text-on-y2k-blue)]",
      mutedClass: "text-[var(--text-on-y2k-blue)] opacity-70",
      borderClass: "border-white/20",
      isDark: true
    };
  }
  
  if (token === 'acqua') {
    return {
      bgClass: "bg-[var(--color-acqua)]",
      textClass: "text-[var(--text-on-acqua)]",
      mutedClass: "text-[var(--text-on-acqua)] opacity-70",
      borderClass: "border-[var(--surface-border)]",
      isDark: false
    };
  }

  if (token === 'spiced-life' || token === 'spiced') {
    return {
      bgClass: "bg-[var(--color-spiced-life)]",
      textClass: "text-[#FCFAF1]", 
      mutedClass: "text-[#FCFAF1] opacity-70",
      borderClass: "border-white/20",
      isDark: true
    };
  }

  // NEUTRAL / EDITORIAL COLORS
  if (token === 'eggshell') {
    return {
      bgClass: "bg-[var(--color-eggshell)]",
      textClass: "text-[var(--color-charcoal)]",
      mutedClass: "text-[var(--color-charcoal)] opacity-70",
      borderClass: "border-black/5",
      isDark: false
    };
  }
  
  // SAFE BRAND DARKS (Remapping Charcoal/Black to Venus Pink)
  if (token === 'charcoal' || token === 'black') {
    return {
      bgClass: "bg-[var(--color-spiced-life)]",
      textClass: "text-[#FCFAF1]",
      mutedClass: "text-[#FCFAF1] opacity-70",
      borderClass: "border-white/20",
      isDark: true
    };
  }

  // NEUTRAL EDITORIAL
  if (token === 'raised') {
    return {
      bgClass: "bg-[var(--bg-raised)]",
      textClass: "text-[var(--text-primary)]",
      mutedClass: "text-[var(--text-secondary)]",
      borderClass: "border-[var(--surface-border)]",
      isDark: false 
    };
  }

  // DEFAULT SAFE FALLBACK (No more transparent cards)
  return {
    bgClass: "bg-[var(--bg-raised)]",
    textClass: "text-[var(--text-primary)]",
    mutedClass: "text-[var(--text-secondary)]",
    borderClass: "border-[var(--surface-border)]",
    isDark: false
  };
};

// --- ICON MAP ---
const iconMap = {
  moon: <Moon size={20} />,
  sun: <Sun size={20} />,
  alert: <AlertCircle size={20} />,
  compass: <Compass size={20} />,
  file: <FileText size={20} />
};

export const HeroSection: React.FC<any> = ({ block }) => {
  const kickerColor = block.kickerColor === "spiced-life" ? "var(--color-spiced-life)" : 
                      block.kickerColor === "acqua" ? "var(--color-acqua)" : 
                      "var(--color-y2k-blue)";

  // ── Full-Bleed Layout (desktop dominant, stacked on mobile) ───────────
  if (block.layout === "fullbleed") {
    return (
      <section className="relative w-full flex flex-col lg:grid lg:grid-rows-1 overflow-hidden bg-[var(--bg)] lg:h-screen">
        
        {/* Left: Typography Content Column */}
        <div className="relative z-10 flex flex-col lg:justify-start lg:w-[48%] xl:w-[46%] px-6 md:px-12 lg:px-16 xl:px-20 pt-4 pb-8 lg:pt-[3.5vh] lg:pb-0 lg:h-screen flex-none">

          {/* Kicker mono line */}
          {block.kicker && (
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-px shrink-0" style={{ backgroundColor: kickerColor }} />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: kickerColor }}>
                {block.kicker}
              </span>
            </div>
          )}

          {/* Main H1 */}
          <h1
            className="font-primary uppercase leading-[0.85] tracking-tight text-[var(--text-primary)] mb-6"
            style={{ fontSize: "clamp(2.6rem, 5.2vw, 6rem)" }}
          >
            {block.titleAccent && (
              <span
                className="block text-[var(--color-spiced-life)]"
                style={{ fontFamily: "var(--font-display-alt-2)", fontSize: "clamp(2.2rem, 4.8vw, 4.8rem)", fontWeight: 400, lineHeight: 1, textTransform: "none", marginTop: "-0.1em" }}
              >
                {block.titleAccent}
              </span>
            )}
            <span dangerouslySetInnerHTML={{ __html: renderHtml(block.titleHtml) }} />
          </h1>

          {/* Subtitle */}
          <p className="font-body text-base md:text-lg leading-relaxed text-[var(--text-secondary)] max-w-[440px] mb-7 opacity-85">
            {block.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center mb-10">
            {block.primaryCta?.label && (
              <Link
                href={block.primaryCta.href || "#"}
                className="inline-flex justify-center items-center gap-3 bg-[var(--color-y2k-blue)] text-[var(--color-eggshell)] px-10 py-5 font-mono text-[13px] uppercase tracking-[0.16em] transition-all hover:bg-[var(--color-charcoal)] min-h-[60px] w-full sm:w-auto"
              >
                {block.primaryCta.label} <ArrowRight size={14} className="shrink-0" />
              </Link>
            )}
            {block.secondaryCta?.label && (
              <Link
                href={block.secondaryCta.href || "#"}
                className="inline-flex justify-center items-center gap-3 border border-[var(--surface-border)] px-10 py-5 font-mono text-[13px] uppercase tracking-[0.16em] transition-all hover:bg-[var(--bg-raised)] min-h-[60px] text-[var(--text-primary)] w-full sm:w-auto"
              >
                {block.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>

        {/* Right-side — Phone mockup with floating widgets */}
        {block.heroImage && (
          <div className="relative lg:absolute lg:right-0 lg:top-0 lg:bottom-0 w-full lg:w-[58%] xl:w-[60%] z-0 flex items-center justify-center py-10 lg:py-0 lg:-translate-y-[5vh] overflow-hidden">
            {/* Left-fade blend on desktop */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[var(--bg)] to-transparent z-10 hidden lg:block pointer-events-none" />

            {/* ── Floating planet SVGs ──────────────────────────────── */}
            <style>{`
              @keyframes hero-float { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-12px) rotate(3deg)} }
              @keyframes hero-float-slow { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-8px) rotate(-2deg)} }
              .hero-float { animation: hero-float 5s ease-in-out infinite; }
              .hero-float-slow { animation: hero-float-slow 7s ease-in-out infinite; }
            `}</style>

            {/* Saturn — top left */}
            <div className="absolute top-[8%] left-[6%] w-16 h-16 md:w-20 md:h-20 hero-float opacity-80 z-20 pointer-events-none">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="46" stroke="var(--color-y2k-blue)" strokeWidth="1.5"/>
                <ellipse cx="50" cy="50" rx="34" ry="9" transform="rotate(-18 50 50)" stroke="var(--color-y2k-blue)" strokeWidth="1" strokeDasharray="4 2"/>
                <text x="50" y="65" fontFamily="var(--font-secondary)" fontSize="40" fill="var(--color-y2k-blue)" textAnchor="middle">♄</text>
              </svg>
            </div>

            {/* Jupiter - bottom left */}
            <div className="absolute bottom-[12%] left-[4%] w-12 h-12 md:w-16 md:h-16 hero-float-slow opacity-70 z-20 pointer-events-none" style={{animationDelay:"-2s"}}>
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="46" stroke="var(--color-spiced-life)" strokeWidth="1.5"/>
                <text x="50" y="65" fontFamily="var(--font-secondary)" fontSize="40" fill="var(--color-spiced-life)" textAnchor="middle">♃</text>
              </svg>
            </div>

            {/* Moon - top right */}
            <div className="absolute top-[6%] right-[4%] w-14 h-14 md:w-18 md:h-18 hero-float opacity-75 z-20 pointer-events-none" style={{animationDelay:"-1.5s"}}>
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="46" stroke="var(--color-acqua)" strokeWidth="1.5"/>
                <circle cx="50" cy="50" r="38" fill="var(--color-acqua)" opacity="0.1"/>
                <text x="50" y="65" fontFamily="var(--font-secondary)" fontSize="40" fill="var(--color-acqua)" textAnchor="middle">☽</text>
              </svg>
            </div>

            {/* 4-point star decorations */}
            <div className="absolute top-[28%] right-[8%] text-[var(--gold)] text-2xl hero-float pointer-events-none z-20" style={{animationDelay:"-0.8s"}}>✦</div>
            <div className="absolute bottom-[28%] left-[16%] text-[var(--color-spiced-life)] text-lg hero-float-slow pointer-events-none z-20" style={{animationDelay:"-3s"}}>✦</div>

            {/* ── Floating Explore Widgets ──────────────────────────── */}
            {/* Life Goals widget — floats top-left of phone */}
            <div className="absolute top-[18%] left-[2%] lg:left-[4%] z-30 hero-float-slow" style={{animationDelay:"-1s"}}>
              <div className="bg-[var(--color-charcoal)] text-[var(--color-eggshell)] border border-white/10 px-4 py-3 flex items-center gap-3 shadow-lg" style={{borderRadius:"var(--shape-asymmetric-md)", minWidth:"130px"}}>
                <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="16" stroke="currentColor" strokeWidth="6"/>
                  <path d="M50 10L50 22M50 78L50 90M10 50L22 50M78 50L90 50M22 22L29 29M71 71L78 78M22 78L29 71M71 22L78 29" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
                </svg>
                <div>
                  <div className="font-mono text-[8px] uppercase tracking-widest opacity-50 leading-tight">Explore</div>
                  <div className="font-primary text-sm uppercase leading-none mt-0.5">Life Goals</div>
                </div>
              </div>
            </div>

            {/* Transits widget — floats bottom-right of phone */}
            <div className="absolute bottom-[22%] right-[2%] lg:right-[3%] z-30 hero-float" style={{animationDelay:"-2.5s"}}>
              <div className="bg-[var(--color-y2k-blue)] text-white border border-white/20 px-4 py-3 shadow-lg" style={{borderRadius:"var(--shape-asymmetric-md)", minWidth:"140px"}}>
                <div className="font-mono text-[7px] uppercase tracking-widest opacity-70 leading-tight">Current Astro Weather</div>
                <div className="font-primary text-sm uppercase leading-tight mt-0.5">Transits</div>
                <div className="font-mono text-[7px] opacity-60 mt-1 leading-tight">Your cosmic weather now</div>
              </div>
            </div>

            {/* Mundane Astrology chip — top right of phone */}
            <div className="absolute top-[40%] right-[1%] z-30 hero-float-slow" style={{animationDelay:"-0.5s"}}>
              <div className="bg-[var(--color-eggshell)] text-[var(--color-charcoal)] border border-black/10 px-3 py-2 shadow-md" style={{borderRadius:"20px"}}>
                <div className="font-mono text-[8px] uppercase tracking-widest leading-none">Mundane</div>
                <div className="font-primary text-xs uppercase leading-tight">Astrology</div>
              </div>
            </div>

            {/* ── Phone Mockup ─────────────────────────────────────── */}
            <div className="relative z-20 flex items-center justify-center">
              {/* Phone outer shell */}
              <div
                className="relative shadow-2xl overflow-hidden shrink-0"
                style={{
                  height: "clamp(450px, 72vh, 670px)",
                  width: "auto",
                  aspectRatio: "414/896",
                  borderRadius: "2.8rem",
                  border: "8px solid #1a1a1a",
                  backgroundColor: "#1a1a1a",
                  boxShadow: "0 0 0 1px #333, 0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[45%] h-5 bg-[#1a1a1a] z-10" style={{borderRadius:"0 0 1rem 1rem"}} />
                {/* Screen */}
                <div className="relative w-full h-full overflow-hidden" style={{borderRadius:"2.2rem", backgroundColor:"#F8F5EC"}}>
                  <Image
                    src={block.heroImage?.url || block.heroImage || "/dashboard-mobile.png"}
                    alt={block.heroImage?.alt || "AstroNat App Mobile"}
                    fill
                    priority
                    style={{ objectFit: "cover", objectPosition: "top center" }}
                  />
                </div>
                {/* Home indicator bar */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-black/20 rounded-full z-10" />
              </div>

              {/* Second phone (shadow/layered) — visible only on large screens */}
              <div
                className="absolute -z-10 hidden xl:block opacity-40 overflow-hidden"
                style={{
                  height: "clamp(400px, 60vh, 550px)",
                  width: "auto",
                  aspectRatio: "414/896",
                  borderRadius: "2.8rem",
                  border: "8px solid #1a1a1a",
                  backgroundColor: "#1B1B1B",
                  transform: "translateX(60%) translateY(4%) rotate(8deg)",
                  boxShadow: "0 0 0 1px #333",
                }}
              >
                <div className="relative w-full h-full overflow-hidden" style={{borderRadius:"2.2rem", backgroundColor:"#1B1B1B"}}>
                  <Image
                    src="/dashboard-mobile.png"
                    alt="AstroNat Dark Mode"
                    fill
                    style={{ objectFit: "cover", objectPosition: "top center" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Decorative rotating orrery */}
        <div className="absolute left-[-180px] top-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.06] pointer-events-none animate-[spin_120s_linear_infinite] z-0 hidden xl:block">
          <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
            <circle cx="100" cy="100" r="96" stroke="var(--color-y2k-blue)" strokeWidth=".6"/>
            <ellipse cx="100" cy="100" rx="56" ry="96" stroke="var(--color-y2k-blue)" strokeWidth=".4"/>
            <ellipse cx="100" cy="100" rx="96" ry="28" stroke="var(--color-y2k-blue)" strokeWidth=".3"/>
            <line x1="4" y1="100" x2="196" y2="100" stroke="var(--color-y2k-blue)" strokeWidth=".3"/>
            <line x1="100" y1="4" x2="100" y2="196" stroke="var(--color-y2k-blue)" strokeWidth=".3"/>
          </svg>
        </div>
      </section>
    );
  }

  // ── Standard Layout (original) ────────────────────────────────────────
  return (
    <section className="pt-16 pb-14 md:pt-20 md:pb-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(var(--text-primary)_1px,transparent_1px),linear-gradient(90deg,var(--text-primary)_1px,transparent_1px)]" style={{ backgroundSize: "60px 60px" }} />
      {block.decorativeElement === "rotating-svg" && (
        <div className="absolute right-[-10vw] top-1/2 -translate-y-1/2 w-[min(580px,48vw)] h-[min(580px,48vw)] opacity-10 pointer-events-none mix-blend-multiply flex items-center justify-center z-0 hidden lg:flex animate-[spin_100s_linear_infinite]">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="100" cy="100" r="96" stroke="var(--color-y2k-blue)" strokeWidth=".6"/>
            <ellipse cx="100" cy="100" rx="56" ry="96" stroke="var(--color-y2k-blue)" strokeWidth=".4"/>
            <ellipse cx="100" cy="100" rx="96" ry="28" stroke="var(--color-y2k-blue)" strokeWidth=".4"/>
          </svg>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] items-center gap-12 md:gap-14">
        <div className="flex flex-col justify-center">
          {block.kicker && (
            <div className="flex items-center gap-3 mb-6">
              <span className="w-12 h-px" style={{ backgroundColor: kickerColor }} />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: kickerColor }}>
                {block.kicker}
              </span>
            </div>
          )}
          
          <h1 className="font-secondary leading-[0.88] tracking-tight text-[var(--text-primary)] mb-6" style={{ fontSize: "clamp(2.8rem, 7vw, 6rem)" }}>
            {block.titleAccent && (
              <span className="block mb-1 text-[var(--color-spiced-life)]" style={{ fontFamily: "var(--font-display-alt-2)", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 400 }}>
                {block.titleAccent}
              </span>
            )}
            <div dangerouslySetInnerHTML={{ __html: renderHtml(block.titleHtml) }} />
          </h1>

          <p className="text-xs font-light text-[var(--text-secondary)] leading-[1.65] max-w-sm mb-8 opacity-80 whitespace-pre-wrap">
            {block.subtitle}
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            {block.primaryCta?.label && (
              <Link href={block.primaryCta.href || "#"} className="bg-[var(--color-y2k-blue)] text-[var(--color-eggshell)] px-8 py-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-all hover:bg-[var(--color-charcoal)]">
                {block.primaryCta.label}
              </Link>
            )}
            {block.secondaryCta?.label && (
              <Link href={block.secondaryCta.href || "#"} className="border border-[var(--surface-border)] px-8 py-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-all hover:bg-[var(--color-charcoal)] hover:text-[var(--color-eggshell)]">
                {block.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>
        
        {block.heroImage && (
          <div className="relative">
            <div className="relative w-full aspect-[4/5] md:aspect-auto md:h-[620px] overflow-hidden rounded-[2rem]">
              <Image src={block.heroImage?.url || block.heroImage || "/nat-1.jpg"} alt={block.heroImage?.alt || "Hero Element"} fill priority style={{ objectFit: "cover", objectPosition: "center top" }} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// ── Parses a stat string like "700+", "847", "4.3M+", "26" into { target, suffix }
function parseStatValue(raw: string): { target: number; suffix: string; prefix: string } {
  const str = String(raw).trim();
  const prefix = str.match(/^[^\d]*/)?.[0] ?? "";
  const rest = str.slice(prefix.length);
  const suffix = rest.match(/[^\d\.]+$/)?.[0] ?? "";
  const numStr = rest.slice(0, rest.length - suffix.length);
  // Handle decimals like "4.3"
  const target = parseFloat(numStr) || 0;
  return { target, suffix, prefix };
}

function AnimatedStat({ raw, label }: { raw: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState("0");
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { target, suffix, prefix } = parseStatValue(raw);
    const isDecimal = !Number.isInteger(target);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1400;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;
            const formatted = isDecimal
              ? current.toFixed(1)
              : Math.round(current).toLocaleString();
            setDisplayed(`${prefix}${formatted}${suffix}`);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [raw]);

  return (
    <div ref={ref} className="flex flex-col">
      <span className="font-secondary text-3xl font-semibold text-[var(--text-primary)] leading-none tabular-nums">
        {displayed || raw}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mt-2">{label}</span>
    </div>
  );
}

export const StatsStrip: React.FC<any> = ({ block }) => {
  const cols = block.columns === "2" ? "md:grid-cols-2" : 
               block.columns === "3" ? "md:grid-cols-3" : 
               block.columns === "4" ? "md:grid-cols-4" : 
               block.columns === "5" ? "md:grid-cols-5" : 
               "md:grid-cols-4";

  return (
    <div className="max-w-7xl mx-auto px-6 pt-5 mb-10 border-t border-[var(--surface-border)] relative z-10">
      <div className={`grid grid-cols-2 ${cols} gap-8`}>
        {block.stats?.map((s: any, i: number) => (
          <AnimatedStat key={i} raw={s.n} label={s.label} />
        ))}
      </div>
    </div>
  );
};

// ── Animated progress bar for scarcity section ─────────────────────────────
function ProgressBar({ pct, spotsLeft, totalSpots, claimed }: { pct: number; spotsLeft: number; totalSpots: number; claimed: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          // Start at 0, animate to pct over 1.2s
          let start: number | null = null;
          const duration = 1200;
          const animate = (ts: number) => {
            if (!start) start = ts;
            const elapsed = ts - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.style.width = `${pct * eased}%`;
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pct]);

  return (
    <div className="max-w-sm mx-auto mb-10">
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-eggshell)] opacity-40">
          {claimed} of {totalSpots} spots claimed
        </span>
        <span
          className="font-mono text-[10px] uppercase tracking-widest font-bold"
          style={{ color: "var(--color-acqua)" }}
        >
          {spotsLeft} left
        </span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{ width: "0%", backgroundColor: "var(--color-spiced-life)", transition: "none" }}
        />
      </div>
    </div>
  );
}

export const StatementBand: React.FC<any> = ({ block }) => {
  // ── Testimonial Floating (Headspace Style) ─────────────────────────────────
  if (block.variant === "testimonial-floating") {
    return (
      <section className="py-20 md:py-32 bg-[var(--bg)] border-y border-[var(--surface-border)] relative overflow-hidden">
        <style>{`
          @keyframes float-orb {
            0% { transform: translateY(0px) rotate(0deg); }
            100% { transform: translateY(-15px) rotate(5deg); }
          }
          .float-anim {
            animation: float-orb 4s ease-in-out infinite alternate;
          }
        `}</style>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          {/* Header Area with Floating SVGs */}
          <div className="relative text-center mb-16 md:mb-28 min-h-[180px] md:min-h-[220px] flex items-center justify-center">
            
            <h2 className="font-primary text-4xl md:text-5xl lg:text-6xl text-[var(--text-primary)] leading-[0.95] max-w-2xl relative z-10 px-4">
              {block.heading}
            </h2>

            {/* Floating Element 1 - Top Left (Saturn) */}
            <div className="absolute top-[-10%] md:top-[0%] left-[5%] md:left-[15%] w-16 h-16 md:w-24 md:h-24 float-anim" style={{ zIndex: 0 }}>
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" stroke="var(--color-y2k-blue, #0456fb)" strokeWidth="1.5"/>
                <circle cx="50" cy="50" r="40" fill="var(--color-y2k-blue, #0456fb)" opacity="0.05"/>
                <ellipse cx="50" cy="50" rx="35" ry="10" transform="rotate(-20 50 50)" stroke="var(--color-y2k-blue, #0456fb)" strokeWidth="1" strokeDasharray="4 2"/>
                <text x="50" y="65" fontFamily="var(--font-secondary)" fontSize="42" fill="var(--color-y2k-blue, #0456fb)" textAnchor="middle">♄</text>
              </svg>
            </div>

            {/* Floating Element 2 - Bottom Center Left (Jupiter) */}
            <div className="absolute bottom-[-30%] md:bottom-[-40%] left-[20%] md:left-[30%] w-14 h-14 md:w-20 md:h-20 float-anim" style={{ animationDelay: '-1s', zIndex: 0 }}>
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" stroke="var(--color-spiced-life, #E67A7A)" strokeWidth="1.5"/>
                <circle cx="50" cy="50" r="38" stroke="var(--color-spiced-life, #E67A7A)" strokeWidth="1" strokeDasharray="2 4"/>
                <text x="50" y="65" fontFamily="var(--font-secondary)" fontSize="42" fill="var(--color-spiced-life, #E67A7A)" textAnchor="middle">♃</text>
              </svg>
            </div>

            {/* Floating Element 3 - Top Right (Moon) */}
            <div className="absolute top-[-30%] md:top-[-10%] right-[10%] md:right-[15%] w-16 h-16 md:w-24 md:h-24 float-anim" style={{ animationDelay: '-2s', zIndex: 0 }}>
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" stroke="var(--color-acqua, #CAF1F0)" strokeWidth="1.5"/>
                <circle cx="50" cy="50" r="40" fill="var(--color-acqua, #CAF1F0)" opacity="0.1"/>
                <text x="50" y="65" fontFamily="var(--font-secondary)" fontSize="42" fill="var(--color-acqua, #CAF1F0)" textAnchor="middle">☽</text>
              </svg>
            </div>

            {/* Floating Element 4 - Bottom Right (Sun) */}
            <div className="absolute bottom-[-20%] md:bottom-[-30%] right-[25%] md:right-[30%] w-12 h-12 md:w-16 md:h-16 float-anim" style={{ animationDelay: '-1.5s', zIndex: 0 }}>
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" stroke="var(--color-charcoal, #1B1B1B)" strokeWidth="1.5"/>
                <path d="M50 10 L50 90 M10 50 L90 50" stroke="var(--color-charcoal, #1B1B1B)" strokeWidth="1" strokeDasharray="2 6"/>
                <text x="50" y="65" fontFamily="var(--font-secondary)" fontSize="42" fill="var(--color-charcoal, #1B1B1B)" textAnchor="middle">☉</text>
              </svg>
            </div>
            
            {/* Tiny stars */}
            <div className="absolute top-[80%] left-[10%] text-[#C9A96E] text-2xl float-anim" style={{ animationDelay: '-0.3s' }}>✦</div>
            <div className="absolute top-[30%] right-[35%] text-[var(--color-spiced-life)] text-lg float-anim" style={{ animationDelay: '-1.2s' }}>✦</div>

          </div>

          {/* Quote grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {block.quotes?.map((q: any, i: number) => {
              return (
                <div
                  key={i}
                  className="bg-[var(--color-eggshell)] p-8 md:p-10 rounded-[1.5rem]"
                >
                  <blockquote className="font-body text-base md:text-[17px] font-medium leading-relaxed text-[var(--color-charcoal)] relative mb-8">
                    <span className="absolute -top-2 -left-3 font-secondary text-[2.5rem] opacity-[0.15] leading-none text-[var(--color-y2k-blue)]">"</span>
                    {q.body}
                    <span className="absolute bottom-0 translate-y-3 font-secondary text-[2.5rem] opacity-[0.15] leading-none ml-1 text-[var(--color-y2k-blue)]">"</span>
                  </blockquote>
                  {q.author && (
                    <div className="flex items-center gap-4 pt-6 border-t border-black/5 mt-auto">
                      <div className="flex flex-col justify-center">
                        <div className="font-body font-semibold text-sm capitalize text-[var(--color-charcoal)]">{q.author}</div>
                        {q.signs && <div className="font-secondary italic text-[11px] text-[var(--color-charcoal)] opacity-70 mt-0.5">{q.signs}</div>}
                        {q.meta && <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-charcoal)] opacity-30 mt-1">{q.meta}</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>
    );
  }

  // ── Testimonial Triple ─────────────────────────────────────────────────────
  if (block.variant === "testimonial-triple") {
    return (
      <section className="py-16 md:py-24 bg-[var(--bg)] border-y border-[var(--surface-border)] relative overflow-hidden">
        {/* Large decorative background glyph */}
        <span
          aria-hidden="true"
          className="pointer-events-none select-none absolute -top-8 right-0 font-secondary text-[18rem] md:text-[26rem] leading-none opacity-[0.025] text-[var(--color-y2k-blue)] -translate-x-8 hidden xl:block"
        >
          ♀
        </span>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            {block.kicker && (
              <div className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--color-y2k-blue)] mb-3">
                {block.kicker}
              </div>
            )}
            {block.subKicker && (
              <p
                className="font-secondary text-3xl md:text-4xl text-[var(--text-primary)] italic leading-snug"
                style={{ fontFamily: "var(--font-secondary)" }}
              >
                {block.subKicker}
              </p>
            )}
          </div>

          {/* Quote grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {block.quotes?.map((q: any, i: number) => {
              const accentColors = [
                "var(--color-y2k-blue)",
                "var(--color-spiced-life)",
                "var(--color-acqua)",
              ];
              const accent = accentColors[i % accentColors.length];
              return (
                <div
                  key={i}
                  className="flex flex-col bg-[var(--surface)] border border-[var(--surface-border)] p-8 md:p-10 relative"
                  style={{ borderTop: `3px solid ${accent}` }}
                >
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-5">
                    {[...Array(5)].map((_, si) => (
                      <svg key={si} viewBox="0 0 12 12" width="12" height="12">
                        <path d="M6 0l1.5 4h4l-3.2 2.4 1.2 4L6 8.1 2.5 10.4l1.2-4L.5 4h4z" fill={accent} />
                      </svg>
                    ))}
                  </div>

                  <blockquote className="font-secondary italic text-xl md:text-2xl leading-snug text-[var(--text-primary)] flex-1 mb-6">
                    &ldquo;{q.body}&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-3 border-t border-[var(--surface-border)] pt-5">
                    {/* Avatar placeholder — initials badge */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0"
                      style={{ backgroundColor: accent, color: accent === "var(--color-acqua)" ? "var(--color-charcoal)" : "#fff" }}
                    >
                      {q.author?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-body text-base font-semibold text-[var(--text-primary)]">{q.author}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] opacity-60 mt-0.5">
                        {q.meta}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Social proof total */}
          <div className="mt-10 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)] opacity-50">
              Join 700+ travelers who changed their lives by changing their location.
            </span>
          </div>
        </div>
      </section>
    );
  }

  // ── Scarcity Hero ──────────────────────────────────────────────────────────
  if (block.variant === "scarcity-hero") {
    const pct = block.spotsLeft && block.totalSpots
      ? Math.round(((block.totalSpots - block.spotsLeft) / block.totalSpots) * 100)
      : 87;
    return (
      <section className="py-20 md:py-28 relative overflow-hidden" style={{ backgroundColor: "var(--color-charcoal)" }}>
        {/* Background orrery watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,700px)] h-[min(90vw,700px)] opacity-[0.06] pointer-events-none animate-[spin_120s_linear_infinite] z-0">
          <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
            <circle cx="100" cy="100" r="96" stroke="#F8F5EC" strokeWidth=".5"/>
            <ellipse cx="100" cy="100" rx="56" ry="96" stroke="#F8F5EC" strokeWidth=".4"/>
            <ellipse cx="100" cy="100" rx="96" ry="28" stroke="#F8F5EC" strokeWidth=".3"/>
            <line x1="4" y1="100" x2="196" y2="100" stroke="#F8F5EC" strokeWidth=".3"/>
            <line x1="100" y1="4" x2="100" y2="196" stroke="#F8F5EC" strokeWidth=".3"/>
          </svg>
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          {/* Kicker */}
          <div
            className="inline-block font-mono text-[9px] uppercase tracking-[0.3em] px-4 py-2 mb-8 border"
            style={{ borderColor: "var(--color-acqua)", color: "var(--color-acqua)" }}
          >
            ✦ Limited Access
          </div>

          {/* Heading */}
          <h2
            className="font-primary uppercase leading-[0.88] mb-4 text-[var(--color-eggshell)]"
            style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
          >
            {block.heading || "FOUNDER'S CLUB"}
          </h2>

          {block.subheading && (
            <p
              className="font-secondary italic text-2xl md:text-3xl mb-8 leading-snug"
              style={{ color: "var(--color-spiced-life)" }}
            >
              {block.subheading}
            </p>
          )}

          {block.body && (
            <p className="font-body text-base md:text-lg leading-relaxed opacity-70 text-[var(--color-eggshell)] max-w-2xl mx-auto mb-12">
              {block.body}
            </p>
          )}

          {/* Progress bar — animates on scroll-enter */}
          <ProgressBar pct={pct} spotsLeft={block.spotsLeft || 13} totalSpots={block.totalSpots || 100} claimed={block.totalSpots - block.spotsLeft || 87} />

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            {block.ctaLabel && (
              <a
                href={block.ctaHref || "/flow"}
                className="inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest px-10 py-5 transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: "var(--color-y2k-blue)", color: "var(--color-eggshell)" }}
              >
                {block.ctaLabel}
              </a>
            )}
            <a
              href="#pricing-section"
              className="font-mono text-[10px] uppercase tracking-widest opacity-40 hover:opacity-70 transition-opacity text-[var(--color-eggshell)] underline underline-offset-4"
            >
              Compare all plans
            </a>
          </div>

          {/* Guarantee */}
          {block.guarantee && (
            <p className="font-mono text-[9px] uppercase tracking-widest opacity-30 text-[var(--color-eggshell)] max-w-xs mx-auto leading-relaxed">
              {block.guarantee}
            </p>
          )}
        </div>
      </section>
    );
  }

  if (block.variant === "disclaimer") {
    return (
      <section className="bg-[var(--surface)] border-y border-[var(--surface-border)] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
          <div className="font-mono text-[9px] uppercase tracking-widest opacity-40 shrink-0 text-[var(--text-tertiary)]">{block.kicker}</div>
          <div className="text-[10px] opacity-50 italic leading-relaxed text-[var(--text-secondary)]" dangerouslySetInnerHTML={{ __html: renderHtml(block.bodyHtml) }} />
        </div>
      </section>
    );
  }

  if (block.variant === "full-width") {
    return (
      <section className="relative overflow-hidden py-20 md:py-32 border-t-2 border-b border-[var(--surface-border)]">
        {/* Decorative background monogram */}
        <span
          aria-hidden="true"
          className="pointer-events-none select-none absolute -top-8 right-0 font-secondary text-[22rem] md:text-[32rem] leading-none text-[var(--text-primary)] opacity-[0.035] -translate-x-16"
        >
          ♄
        </span>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {block.kicker && (
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-tertiary)] mb-12">
              {block.kicker}
            </div>
          )}
          <div
            className="font-secondary text-2xl leading-relaxed text-[var(--text-primary)] max-w-4xl"
            dangerouslySetInnerHTML={{ __html: renderHtml(block.bodyHtml) }}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 border-b border-[var(--surface-border)]">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[1fr_2.5fr] gap-8 md:gap-20 items-center">
        {block.kicker && <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-tertiary)]">{block.kicker}</div>}
        <div className="font-secondary text-2xl md:text-4xl leading-snug text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: renderHtml(block.bodyHtml) }} />
      </div>
    </section>
  );
};

export const CardGrid: React.FC<any> = ({ block }) => {
  const isPricing = block.variant === "pricing";
  const sectionTheme = getBlockTheme(block.sectionBg);

  return (
    <section id={block.anchorId ?? undefined} className={`py-14 md:py-20 theme-block-h ${sectionTheme.bgClass} ${sectionTheme.textClass}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`flex justify-between items-end mb-12 border-b ${sectionTheme.borderClass} pb-4`}>
          <div>
            <div className={`font-mono text-xs uppercase tracking-[0.2em] mb-4 ${sectionTheme.isDark ? 'text-[var(--color-acqua)]' : 'text-[var(--color-y2k-blue)]'}`}>{block.kicker}</div>
            <h2 className="font-primary text-4xl md:text-6xl uppercase leading-none">
              {block.headingHtml ? (
                 <div dangerouslySetInnerHTML={{ __html: renderHtml(block.headingHtml) }} />
              ) : (
                block.heading
              )}
            </h2>
          </div>
          {block.sidebarText && (
            <p className={`hidden md:block font-body text-base leading-relaxed ${sectionTheme.mutedClass} max-w-lg`}>
              {block.sidebarText}
            </p>
          )}
        </div>
        
        {/* Helper to ensure Tailwind doesn't purge dynamic grid classes */}
        {(() => {
          const cols = block.columns === "1" ? "md:grid-cols-1" : 
                       block.columns === "2" ? "md:grid-cols-2" : 
                       block.columns === "3" ? "md:grid-cols-3" : 
                       block.columns === "4" ? "md:grid-cols-4" : 
                       "md:grid-cols-2";
          
          return (
            <div className={`grid grid-cols-1 ${cols} gap-6`}>
              {block.cards?.map((p: any, i: number) => {
            if (isPricing) {
              return (
                <div key={i} className={`relative p-8 border flex flex-col h-full bg-[var(--surface)] ${
                  p.primary
                    ? 'border-[var(--color-y2k-blue)] shadow-[8px_8px_0px_var(--color-y2k-blue)]'
                    : p.urgencyNote
                    ? 'border-[var(--color-spiced-life)] shadow-[8px_8px_0px_var(--color-spiced-life)]'
                    : 'border-[var(--surface-border)]'
                } rounded-[2rem]`}>
                  {/* Badge */}
                  {p.primary && (
                    <div className="absolute top-0 right-0 bg-[var(--color-y2k-blue)] text-white text-[8px] uppercase tracking-widest px-3 py-1 font-mono">
                      Most Popular
                    </div>
                  )}
                  {p.badge && !p.primary && (
                    <div className="absolute top-0 right-0 bg-[var(--color-acqua)] text-[var(--color-charcoal)] text-[8px] uppercase tracking-widest px-3 py-1 font-mono shadow-md">
                      {p.badge}
                    </div>
                  )}
                  {p.urgencyNote && (
                    <div className="absolute top-0 right-0 bg-[var(--color-spiced-life)] text-white text-[8px] uppercase tracking-widest px-3 py-1 font-mono">
                      {p.urgencyNote}
                    </div>
                  )}

                  <div className="font-mono text-[10px] uppercase tracking-[0.15em] opacity-50 mb-2 text-[var(--text-tertiary)]">{p.tier}</div>
                  <h3 className="font-secondary text-2xl md:text-3xl border-b border-[var(--surface-border)] pb-4 mb-4 leading-none text-[var(--text-primary)]">{p.title}</h3>
                  <p className="text-sm leading-relaxed opacity-70 mb-6 italic text-[var(--text-secondary)]">{p.tagline}</p>
                  <div className="mb-6">
                     <span className="block font-mono text-[10px] uppercase opacity-40 mb-1 text-[var(--text-tertiary)]">Starting from</span>
                     <span className="font-primary text-4xl font-semibold text-[var(--text-primary)]">{p.price}</span>
                  </div>
                  <ul className="space-y-3 mb-10 flex-1">
                    {p.includes?.map((inc: any, idx: number) => (
                       <li key={idx} className="text-sm opacity-85 flex items-start gap-2 text-[var(--text-secondary)]">
                          <span className="text-[var(--color-spiced-life)] shrink-0">✦</span> {inc.line || inc}
                       </li>
                    ))}
                  </ul>
                  {p.ctaLabel && (
                    <Link
                      href={p.ctaHref || "#"}
                      className={`w-full py-4 text-center font-mono text-[9px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
                        p.primary
                          ? 'bg-[var(--color-y2k-blue)] text-white hover:bg-[var(--color-charcoal)]'
                          : p.urgencyNote
                          ? 'bg-[var(--color-spiced-life)] text-white hover:opacity-90'
                          : 'bg-[var(--color-charcoal)] text-white hover:bg-[var(--color-y2k-blue)]'
                      }`}
                    >
                      {p.ctaLabel} <ArrowRight size={12} className="opacity-70" />
                    </Link>
                  )}
                  {p.glyph && <div className="absolute -bottom-6 -right-2 font-primary text-8xl opacity-5 pointer-events-none select-none text-[var(--text-primary)]">{p.glyph}</div>}
                </div>
              );
            }

            // Standard / Numbered with theme-aware colors
            const cardTheme = getBlockTheme(p.bgToken);
            
            return (
              <div key={i} className={`p-10 md:p-12 min-h-[360px] flex flex-col rounded-[2rem] theme-block-h ${cardTheme.bgClass} ${cardTheme.textClass}`} style={p.bgToken === 'acqua' ? { backgroundColor: 'var(--color-acqua)', color: 'var(--color-charcoal)' } : undefined}>
                {p.num && <div className="font-primary text-5xl mb-8 leading-none opacity-40 shrink-0">{p.num}</div>}
                <h3 className="font-secondary text-2xl md:text-3xl mb-4 leading-tight lowercase">{p.title}</h3>
                <p className={`font-body text-sm leading-relaxed ${cardTheme.mutedClass} flex-1`}>{p.desc}</p>
                {p.tag && (
                  <div className={`font-mono text-[9px] uppercase tracking-widest mt-8 border-t pt-4 ${cardTheme.borderClass}`}>
                    {p.tag}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    })()}
      </div>
    </section>
  );
};

export const SplitContent: React.FC<any> = ({ block }) => {
  const layout = block.layout || "standard";

  if (layout === "methodology") {
    return (
      <section className="py-16 md:py-24 border-y border-[var(--surface-border)] bg-[var(--bg)] overflow-hidden relative">
        {block.monogram && (
          <div className="absolute top-0 right-0 -mr-32 -mt-32 opacity-5 pointer-events-none w-[600px] h-[600px] select-none text-[var(--color-y2k-blue)]">
            <Image src={block.monogram} alt="Background monogram" width={600} height={600} />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-16 items-center relative z-10">
           <div className="relative aspect-[4/5] md:aspect-square w-full rounded-[2rem] overflow-hidden">
             {block.image && <Image src={block.image} alt={block.heading} fill className="object-cover" />}
           </div>
           <div>
             <h2 className="font-primary text-5xl md:text-6xl uppercase leading-[0.88] mb-6 text-[var(--text-primary)]">{block.heading}</h2>
             {block.intro && <p className="font-body text-base md:text-lg leading-relaxed opacity-80 text-[var(--text-secondary)] mb-10">{block.intro}</p>}
             {block.numberedItems && (
                <div className="space-y-6 mb-10">
                   {block.numberedItems.map((item: any, i: number) => (
                      <div key={i} className="flex gap-5">
                        {item.glyph && <div className="font-primary text-2xl text-[var(--color-y2k-blue)] pt-1 shrink-0">{item.glyph}</div>}
                        <div>
                           <h4 className="font-primary text-sm md:text-base tracking-widest uppercase mb-1.5 text-[var(--text-primary)]">{item.title}</h4>
                           <p className="font-body text-sm md:text-base opacity-70 text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                   ))}
                </div>
             )}
             {block.primaryCta?.label && (
                <Link href={block.primaryCta.href || "#"} className="inline-block border border-[var(--surface-border)] text-[var(--text-primary)] hover:border-[var(--color-y2k-blue)] hover:text-[var(--color-y2k-blue)] px-8 py-4 font-mono text-xs tracking-widest uppercase transition-colors">
                  {block.primaryCta.label}
                </Link>
             )}
           </div>
        </div>
      </section>
    );
  }

  if (layout === "two-column-text") {
    return (
      <section className="py-24 md:py-32 bg-[var(--bg)] border-t border-[var(--surface-border)] relative">
         <div className="max-w-7xl mx-auto px-6">
           <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-[var(--surface-border)] gap-6">
             <h2 className="font-primary text-4xl md:text-5xl md:max-w-xl uppercase leading-none text-[var(--text-primary)]">{block.heading}</h2>
             {block.sectionLabel && <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-40 shrink-0 text-[var(--text-tertiary)]">{block.sectionLabel}</div>}
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
             {block.leftCol && (
               <div className="space-y-6">
                  <h3 className="font-secondary text-2xl md:text-3xl text-[var(--text-primary)] mb-6">{block.leftCol.title}</h3>
                  <div className="font-body text-sm md:text-base leading-relaxed space-y-6 opacity-80 text-[var(--text-secondary)] prose-editorial" dangerouslySetInnerHTML={{ __html: renderHtml(block.leftCol.body) }} />
               </div>
             )}
             {block.rightCol && (
               <div className="space-y-6">
                  <h3 className="font-secondary text-2xl md:text-3xl text-[var(--text-primary)] mb-6">{block.rightCol.title}</h3>
                  <div className="font-body text-sm md:text-base leading-relaxed space-y-6 opacity-80 text-[var(--text-secondary)] prose-editorial" dangerouslySetInnerHTML={{ __html: renderHtml(block.rightCol.body) }} />
               </div>
             )}
           </div>
         </div>
      </section>
    );
  }

  const theme = getBlockTheme(block.bgToken);
  const isImageLeft = block.imageSide === "left";
  const textPaddingClass = isImageLeft 
    ? `lg:pr-[max(1.5rem,calc((100vw-80rem)/2))] lg:pl-16` // Text on Right (80rem = 1280px)
    : `lg:pl-[max(1.5rem,calc((100vw-80rem)/2))] lg:pr-16`; // Text on Left

  const gridColsClass = block.image && !block.rightPanel 
    ? (isImageLeft ? 'lg:grid-cols-[1.1fr_0.9fr]' : 'lg:grid-cols-[0.9fr_1.1fr]')
    : 'lg:grid-cols-2';

  return (
    <section className={`border-y theme-block-h ${theme.bgClass} ${theme.borderClass} ${theme.textClass}`} style={block.bgToken === 'acqua' ? { backgroundColor: 'var(--color-acqua)', color: 'var(--color-charcoal)' } : undefined}>
      <div className="max-w-7xl mx-auto w-full">
      <div className={`grid grid-cols-1 ${gridColsClass} min-h-[500px]`}>
         {/* TEXT COLUMN */}
         <div className={`flex flex-col py-16 md:py-24 px-6 ${textPaddingClass} ${isImageLeft && block.image ? 'lg:order-2' : ''}`}>
            {block.kicker && <div className={`font-mono text-[10px] uppercase tracking-[0.2em] mb-4 ${theme.isDark ? 'text-[var(--color-acqua)]' : 'text-[var(--color-spiced-life)]'}`}>{block.kicker}</div>}
            
            {(block.headingHtml || block.heading) && (
              <h2 className="font-primary text-4xl md:text-6xl uppercase leading-[0.9] mb-8">
                {block.headingHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: renderHtml(block.headingHtml) }} />
                ) : (
                  block.heading
                )}
              </h2>
            )}

            {block.body && <div className={`text-sm md:text-base leading-relaxed mb-4 ${theme.mutedClass} prose-editorial prose-editorial-p:mb-4`} dangerouslySetInnerHTML={{ __html: renderHtml(block.body) }} />}
            {block.bodyHtml && <div className={`text-sm md:text-base leading-relaxed mb-4 ${theme.mutedClass} prose-editorial prose-editorial-p:mb-4`} dangerouslySetInnerHTML={{ __html: renderHtml(block.bodyHtml) }} />}
            
            {block.features && block.features.length > 0 && (
              <>
                <div className={`font-mono text-[10px] uppercase tracking-widest opacity-60 mb-6 border-b ${theme.borderClass} pb-2`}>What's Included</div>
                <div className="flex flex-col gap-6 mb-12">
                   {block.features.map((item: any, i: number) => (
                      <div key={i} className="flex gap-4">
                         <div className="text-[var(--color-y2k-blue)] shrink-0 mt-1">{(iconMap as any)[item.icon] || <ArrowRight size={20}/>}</div>
                         <div>
                            <h4 className={`font-primary text-sm font-semibold mb-1 tracking-widest uppercase`}>{item.title}</h4>
                            <p className={`text-[13px] leading-relaxed ${theme.mutedClass}`}>{item.desc}</p>
                         </div>
                      </div>
                   ))}
                </div>
              </>
            )}

            {block.metaItems && block.metaItems.length > 0 && (
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 mt-8 border-t ${theme.borderClass} mb-12`}>
                {block.metaItems.map((meta: any, i: number) => (
                   <div key={i} className="flex flex-col">
                      <span className={`font-mono text-[9px] uppercase tracking-[0.2em] opacity-50 mb-2`}>{meta.label}</span>
                      <span className={`font-secondary font-medium tracking-wide`}>{meta.value}</span>
                   </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-4 flex-wrap mt-auto">
              {block.primaryCta?.label && (
                <Link href={block.primaryCta.href || "#"} className="self-start px-8 py-4 font-mono text-[11px] font-semibold uppercase tracking-widest rounded-full hover:opacity-80 transition-opacity bg-[var(--color-y2k-blue)] text-white">
                  {block.primaryCta.label} <ArrowRight size={14} className="inline-block flex-shrink-0" />
                </Link>
              )}
            </div>
         </div>

         {/* RIGHT COLUMN - IMAGE OR RETAINER PANEL */}
         {block.image ? (
            <div className={`relative h-full w-full min-h-[400px] lg:min-h-full ${block.imageSide === "left" ? 'lg:order-1 border-r' : 'border-l'} ${theme.borderClass} overflow-hidden`}>
               <Image src={block.image} alt="Section visual" fill className="object-cover" />
               {block.priceBadge && (
                 <div className="absolute bottom-8 right-8 w-32 h-32 rounded-full bg-[var(--color-charcoal)] flex flex-col items-center justify-center text-center shadow-xl">
                   <span className="font-mono text-[8px] uppercase tracking-widest text-[var(--color-acqua)] leading-tight whitespace-pre-wrap mb-1">{block.priceBadge.kicker}</span>
                   <span className="font-primary text-2xl font-medium tracking-tight text-[var(--color-eggshell)]">{block.priceBadge.line2}</span>
                 </div>
               )}
            </div>
         ) : block.rightPanel ? (
            <div className="flex flex-col h-full w-full pt-16 md:pt-32 pb-16 px-6 lg:pr-[max(1.5rem,calc((100vw-80rem)/2))] lg:pl-16 border-l border-black/10 relative" style={{ backgroundColor: 'var(--color-acqua)', color: 'var(--color-charcoal)' }}>
              <div className="sticky top-24">
                 <div className="mb-4">
                   <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-50 mb-2 text-[var(--text-on-acqua)]">{block.rightPanel.kicker || "Engagement"}</div>
                   <div className="font-primary text-4xl md:text-5xl font-semibold leading-none text-[var(--color-y2k-blue)]">
                     {block.rightPanel.priceLine || "By Engagement"}
                   </div>
                   <div className="font-body text-xs opacity-60 mt-4 font-light leading-relaxed max-w-[280px] text-[var(--text-on-acqua)]">{block.rightPanel.priceNote}</div>
                 </div>

                 <div className="flex items-center gap-3 mt-8 mb-10 font-mono text-[9px] uppercase tracking-widest max-w-[240px] leading-relaxed text-[var(--text-on-acqua)] opacity-60">
                   <div className="w-2 h-2 rounded-full bg-[#3fb950] shrink-0 mt-0.5 opacity-100"></div>
                   <span>{block.rightPanel.limitNote}</span>
                 </div>

                 {block.rightPanel.ctaLabel && (
                   <Link href={block.rightPanel.ctaHref || "#"} className="w-full text-center py-5 px-6 font-semibold font-mono text-[10px] uppercase tracking-widest transition-opacity hover:opacity-80 mb-24 block bg-[var(--color-charcoal)] text-[var(--color-eggshell)]">
                      {block.rightPanel.ctaLabel}
                   </Link>
                 )}

                 {block.rightPanel.testimonialQuote && (
                   <div className="mt-20 border-t border-black/10 w-full pt-8">
                      <p className="font-secondary italic text-base md:text-lg leading-snug text-[var(--color-charcoal)] mb-6">&ldquo;{block.rightPanel.testimonialQuote}&rdquo;</p>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-charcoal)] opacity-60">{block.rightPanel.testimonialKicker} · {block.rightPanel.testimonialMeta}</p>
                   </div>
                 )}
              </div>
            </div>
         ) : <div />}
      </div>
      </div>
    </section>
  );
};

export const ProcessTimeline: React.FC<any> = ({ block }) => {
  // AstroBrand editorial color-band alternation
  const stepColors = [
    { bg: 'var(--color-eggshell)',   text: 'var(--color-charcoal)', accent: 'var(--color-y2k-blue)',    muted: 'rgba(27,27,27,0.55)' },
    { bg: 'var(--color-charcoal)',   text: 'var(--color-eggshell)', accent: 'var(--color-acqua)',        muted: 'rgba(248,245,236,0.55)' },
    { bg: 'var(--color-y2k-blue)',   text: '#fcfaf1',               accent: 'var(--color-acqua)',        muted: 'rgba(252,250,241,0.60)' },
    { bg: 'var(--color-eggshell)',   text: 'var(--color-charcoal)', accent: 'var(--color-spiced-life)', muted: 'rgba(27,27,27,0.55)' },
    { bg: 'var(--color-spiced-life)',text: '#fcfaf1',               accent: '#fcfaf1',                  muted: 'rgba(252,250,241,0.65)' },
  ];

  return (
    <section id={block.anchorId} className="border-t border-[var(--surface-border)]">
      {/* Section heading slab */}
      <div className="py-12 md:py-16 px-6 md:px-16 text-center bg-[var(--bg-raised)] border-b border-[var(--surface-border)]">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-4">{block.kicker}</div>
        <h2
          className="font-primary uppercase leading-[0.9] text-[var(--text-primary)]"
          style={{ fontSize: "clamp(2.8rem, 6vw, 7rem)" }}
        >
          <div dangerouslySetInnerHTML={{ __html: renderHtml(block.headingHtml) }} />
        </h2>
      </div>

      {/* Step bands — one per row, alternating color blocks */}
      {block.steps?.map((step: any, i: number) => {
        const colors = stepColors[i % stepColors.length];
        return (
          <div
            key={i}
            className="relative flex items-center gap-8 md:gap-16 px-6 md:px-16 lg:px-24 py-10 md:py-12 border-b border-black/8 overflow-hidden"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {/* Giant watermark step number */}
            <span
              className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 font-primary leading-none pointer-events-none select-none"
              style={{ fontSize: 'clamp(6rem, 14vw, 11rem)', opacity: 0.07, color: colors.text }}
              aria-hidden="true"
            >
              {step.n}
            </span>

            {/* Step number badge */}
            <div
              className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full border-2 flex items-center justify-center font-primary text-xl md:text-2xl"
              style={{ borderColor: colors.accent, color: colors.accent }}
            >
              {step.n}
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1">
              <h3
                className="font-primary uppercase tracking-tight leading-none mb-2 md:mb-3"
                style={{ fontSize: 'clamp(1.4rem, 3vw, 2.8rem)', color: colors.text }}
              >
                {step.title}
              </h3>
              <p
                className="font-body text-base md:text-lg leading-relaxed max-w-xl"
                style={{ color: colors.muted }}
              >
                {step.body}
              </p>
            </div>

            {/* Right arrow */}
            <div className="shrink-0 hidden md:flex" style={{ color: colors.accent, opacity: 0.35 }}>
              <ArrowRight size={36} />
            </div>
          </div>
        );
      })}
    </section>
  );
};

export const CtaBand: React.FC<any> = ({ block }) => {
  const layout = block.layout || "standard";
  const theme = getBlockTheme(block.bgToken);

  if (layout === "newsletter") {
    return (
      <section className="py-24 md:py-32 bg-[var(--color-acqua)] border-t border-[var(--surface-border)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            {block.accent && <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-on-acqua)] opacity-60 mb-6">{block.accent}</div>}
            <h2 className="font-primary text-5xl md:text-7xl uppercase leading-[0.85] text-[var(--text-on-acqua)] mb-6">
              {block.titleLine1}<br/>
              <span className="font-secondary italic lowercase" style={{ color: 'var(--dispatch-color)' }}>{block.titleLine2}</span>
            </h2>
            <p className="font-body text-sm md:text-base leading-relaxed opacity-80 text-[var(--text-on-acqua)] max-w-md">{block.newsletterBody}</p>
          </div>
          <div className="bg-[var(--color-y2k-blue)] p-8 md:p-12 rounded-[2rem] flex flex-col items-center justify-center text-center gap-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60 mb-2">Newsletter</div>
            <div className="font-primary text-4xl md:text-5xl uppercase leading-none text-white">Coming<br/>Soon</div>
            <p className="font-body text-xs leading-relaxed text-white/70 max-w-[220px] mt-2">Launching shortly — stay tuned for the first dispatch.</p>
          </div>
        </div>
      </section>
    );
  }

  if (layout === "two-column") {
    return (
      <section className={`py-24 md:py-32 border-t theme-block-h ${theme.borderClass} ${theme.bgClass} ${theme.textClass}`}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
           <div>
             {block.kicker && <div className={`font-mono text-[10px] uppercase tracking-[0.2em] mb-6 opacity-60`}>{block.kicker}</div>}
             <h2 className={`font-primary text-5xl md:text-7xl uppercase leading-[0.9] mb-8`}>
               {block.headingHtml ? (
                 <div dangerouslySetInnerHTML={{ __html: renderHtml(block.headingHtml) }} />
               ) : block.heading}
             </h2>
             {block.priceLine && <div className={`font-secondary italic text-4xl mb-12`}>{block.priceLine}</div>}
             {block.primaryCta?.label && (
                <Link href={block.primaryCta.href || "#"} className={`inline-block px-10 py-5 font-mono text-[10px] uppercase tracking-widest transition-colors ${theme.isDark ? "bg-[var(--color-acqua)] text-[var(--color-charcoal)] hover:bg-white" : "bg-[var(--color-y2k-blue)] text-white hover:bg-[var(--color-charcoal)]"}`}>
                   {block.primaryCta.label} <ArrowRight size={14} className="inline-block ml-1" />
                </Link>
             )}
           </div>
            {block.perks && (
              <div className={`${theme.isDark ? 'bg-white/5' : 'bg-[var(--bg-raised)]'} ${theme.isDark ? 'text-white' : 'text-[var(--text-primary)]'} p-10 md:p-12 rounded-[2rem]`}>
                 <ul className="space-y-6">
                   {block.perks.map((p: any, i: number) => (
                      <li key={i} className="flex gap-4">
                         <span className="text-[var(--color-y2k-blue)] shrink-0">✦</span>
                         <span className="font-body text-sm leading-relaxed opacity-90 prose-editorial">{p.line}</span>
                      </li>
                   ))}
                 </ul>
              </div>
           )}
        </div>
      </section>
    );
  }

  if (layout === "centered") {
    return (
      <section className={`py-24 md:py-32 border-y theme-block-h ${theme.borderClass} text-center ${theme.bgClass} ${theme.textClass}`}>
         <div className="max-w-3xl mx-auto px-6">
            <h2 className="font-primary text-3xl md:text-5xl uppercase leading-tight mb-8">{block.heading}</h2>
            <div className={`font-body text-sm md:text-base leading-relaxed ${theme.mutedClass} mb-10 space-y-6 prose-editorial prose-editorial-p:mb-4 mx-auto`} dangerouslySetInnerHTML={{ __html: renderHtml(block.body) }} />
            {block.closing && <p className="font-secondary text-xl md:text-2xl italic">{block.closing}</p>}
         </div>
      </section>
    );
  }

  if (layout === "cta-cards") {
    return (
      <section className="py-16 md:py-24 bg-[var(--color-y2k-blue)] relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 relative z-10">
            <div>
               {block.kicker && <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-eggshell)] opacity-60 mb-6">{block.kicker}</div>}
               <h2 className="font-primary text-5xl md:text-7xl uppercase leading-[0.9] text-white mb-8" dangerouslySetInnerHTML={{ __html: renderHtml(block.headingHtml) }} />
               <p className="font-body text-base md:text-lg leading-relaxed text-white/80 max-w-sm">{block.body}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {block.primaryCard && (
                  <Link href={block.primaryCard.href || "#"} className="bg-[var(--color-acqua)] p-8 md:p-10 rounded-[2rem] flex flex-col hover:opacity-90 transition-opacity md:col-span-2 group">
                     <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-charcoal)] opacity-60 mb-4">{block.primaryCard.kicker}</div>
                     <h3 className="font-secondary text-3xl md:text-4xl text-[var(--color-charcoal)] leading-tight flex-1" dangerouslySetInnerHTML={{ __html: renderHtml(block.primaryCard.titleHtml) }} />
                     <div className="flex justify-between items-end mt-12 w-full">
                        <div className="w-12 h-12 rounded-full border border-[var(--color-charcoal)] flex items-center justify-center group-hover:bg-[var(--color-charcoal)] group-hover:text-[var(--color-acqua)] transition-colors">
                           <ArrowRight size={20} />
                        </div>
                     </div>
                  </Link>
               )}
               {block.secondaryCards?.map((c: any, i: number) => (
                  <Link key={i} href={c.href || "#"} className="bg-[var(--bg-raised)] p-8 md:p-10 rounded-[2rem] flex flex-col hover:bg-[var(--color-charcoal)] transition-colors group border border-white/5">
                     <div className="font-mono text-[9px] uppercase tracking-widest text-white/60 mb-4">{c.kicker}</div>
                     <h3 className="font-secondary text-2xl text-white leading-tight flex-1" dangerouslySetInnerHTML={{ __html: renderHtml(c.titleHtml) }} />
                     <div className="mt-8 flex justify-end">
                        <ArrowRight size={20} className="text-[var(--color-y2k-blue)] group-hover:block hidden" />
                     </div>
                  </Link>
               ))}
            </div>
         </div>
      </section>
    );
  }

  return (
    <section className="py-24 md:py-32 bg-[var(--color-y2k-blue)] overflow-hidden border-t border-white/5 relative">
      {block.decorativeElement === "rotating-svg" && (
        <>
          {/* Large centered globe — main watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,900px)] h-[min(90vw,900px)] opacity-[0.12] pointer-events-none animate-[spin_120s_linear_infinite] z-0">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full"><circle cx="100" cy="100" r="96" stroke="#F8F5EC" strokeWidth=".5"/><ellipse cx="100" cy="100" rx="56" ry="96" stroke="#F8F5EC" strokeWidth=".4"/><ellipse cx="100" cy="100" rx="30" ry="96" stroke="#F8F5EC" strokeWidth=".3"/><ellipse cx="100" cy="100" rx="96" ry="28" stroke="#F8F5EC" strokeWidth=".3"/><ellipse cx="100" cy="100" rx="96" ry="58" stroke="#F8F5EC" strokeWidth=".3"/><ellipse cx="100" cy="100" rx="96" ry="75" stroke="#F8F5EC" strokeWidth=".25"/><line x1="4" y1="100" x2="196" y2="100" stroke="#F8F5EC" strokeWidth=".35"/><line x1="100" y1="4" x2="100" y2="196" stroke="#F8F5EC" strokeWidth=".35"/></svg>
          </div>
          {/* Smaller offset globe — right side depth layer */}
          <div className="absolute top-1/2 right-[-180px] -translate-y-1/2 w-[500px] h-[500px] opacity-[0.07] pointer-events-none animate-[spin_80s_reverse_linear_infinite] z-0 hidden lg:block">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full"><circle cx="100" cy="100" r="96" stroke="#F8F5EC" strokeWidth=".5"/><ellipse cx="100" cy="100" rx="56" ry="96" stroke="#F8F5EC" strokeWidth=".4"/><ellipse cx="100" cy="100" rx="96" ry="28" stroke="#F8F5EC" strokeWidth=".3"/><ellipse cx="100" cy="100" rx="96" ry="58" stroke="#F8F5EC" strokeWidth=".3"/><line x1="4" y1="100" x2="196" y2="100" stroke="#F8F5EC" strokeWidth=".35"/><line x1="100" y1="4" x2="100" y2="196" stroke="#F8F5EC" strokeWidth=".35"/></svg>
          </div>
        </>
      )}

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 gap-12 items-center relative z-10 text-center">
        <div className="flex flex-col items-center justify-center">
          {block.accent && <div className="font-secondary text-5xl md:text-7xl lowercase italic text-[var(--color-spiced-life)] block mb-4">{block.accent}</div>}
          <h2 className="font-primary text-5xl md:text-6xl lg:text-7xl uppercase leading-[0.85] mb-8 text-[var(--color-eggshell)]">
            {block.headingHtml ? (
               <div dangerouslySetInnerHTML={{ __html: renderHtml(block.headingHtml) }} />
            ) : block.heading}
          </h2>
          {block.body && (
            <p className="text-sm md:text-base opacity-70 leading-relaxed mb-12 text-[var(--color-eggshell)] max-w-lg mx-auto">{block.body}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {block.primaryCta?.label && (
              <Link
                href={block.primaryCta.href || "#"}
                className="inline-flex items-center gap-3 bg-[var(--color-eggshell)] text-[var(--color-charcoal)] px-10 py-5 font-mono text-[10px] uppercase tracking-widest transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                {block.primaryCta.label} <ArrowRight size={14} className="flex-shrink-0" />
              </Link>
            )}
            {block.secondaryCta?.label && (
              <Link
                href={block.secondaryCta.href || "#"}
                className="font-mono text-[10px] uppercase tracking-widest text-[#fcfaf1] opacity-60 hover:opacity-100 underline underline-offset-4 transition-opacity duration-200"
              >
                {block.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PressStrip — "As Seen In" press logos using SVG text lockups
// Block shape: { kicker, publications: [{ name, href, blurb, accentColor }] }
// ─────────────────────────────────────────────────────────────────────────────
export const PressStrip: React.FC<any> = ({ block }) => {
  return (
    <section className="bg-[var(--color-eggshell)] border-y border-black/8 py-16 md:py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* Section kicker */}
        <div className="flex items-center justify-center gap-6 mb-12">
          <span className="w-16 md:flex-1 h-[2px] bg-black/10" />
          <span className="font-primary uppercase text-lg md:text-2xl tracking-[0.08em] text-[var(--color-charcoal)] opacity-90 relative top-px">
            {block.kicker || "As Seen In"}
          </span>
          <span className="w-16 md:flex-1 h-[2px] bg-black/10" />
        </div>

        {/* Viral credibility note */}
        {block.viralNote && (
          <p className="font-secondary italic text-xl md:text-2xl text-[var(--color-charcoal)] mb-16 max-w-2xl opacity-80 mx-auto">
            &ldquo;{block.viralNote}&rdquo;
          </p>
        )}

        {/* Logo row — image + blurb */}
        <div className="flex flex-col md:flex-row items-stretch justify-between gap-6 md:gap-4 w-full">
          {(block.publications || []).map((pub: any, i: number) => (
            <a
              key={i}
              href={pub.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex flex-col items-center gap-4 px-6 py-6 border border-transparent hover:border-black/10 hover:-translate-y-1 transition-all duration-300 group"
              aria-label={pub.name}
            >
              {/* Logo image — restored */}
              <img
                src={pub.logoUrl || ""}
                alt={pub.name}
                className={`object-contain object-center mix-blend-multiply ${i === 0 ? "h-12 md:h-16 max-w-[260px] md:max-w-[300px]" : "h-10 md:h-14 max-w-[180px] md:max-w-[220px]"} w-full`}
                loading="lazy"
              />
              {/* Blurb — credibility hook below the logo */}
              {pub.blurb && (
                <span className="font-body text-xs md:text-sm text-[var(--color-charcoal)] opacity-50 leading-snug max-w-[220px] text-center italic group-hover:opacity-75 transition-opacity">
                  {pub.blurb}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// InstagramReels — Curated static reel cards in polaroid/stacked Y2K aesthetic
// Block shape: { kicker, heading, reels: [{ caption, image, href, views }], profileHref }
// ─────────────────────────────────────────────────────────────────────────────
export const InstagramReels: React.FC<any> = ({ block }) => {
  const reels = block.reels || [];

  return (
    <section className="py-14 md:py-20 bg-[var(--color-charcoal)] relative overflow-hidden border-t border-white/5">
      {/* Subtle tiled grain texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundSize: "256px 256px"
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            {block.kicker && (
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-acqua)] opacity-70 mb-4">
                {block.kicker}
              </div>
            )}
            <h2
              className="font-primary uppercase leading-[0.88] text-[var(--color-eggshell)]"
              style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}
            >
              {block.heading || "THE OFFICIAL FEED"}
            </h2>
          </div>
          {block.profileHref && (
            <a
              href={block.profileHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/20 px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-[var(--color-eggshell)] hover:border-[var(--color-acqua)] hover:text-[var(--color-acqua)] transition-all duration-300 self-start"
            >
              <InstagramIcon /> @astronatofficial
            </a>
          )}
        </div>

        {/* Reel card grid — polaroid stacked aesthetic */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
            {reels.map((reel: any, i: number) => {
              // Slight rotation alternation for polaroid feel
              const rotations = ["-rotate-[1deg]", "rotate-[0.5deg]", "-rotate-[0.8deg]"];
              const rotation = rotations[i % rotations.length];

              return (
                <a
                  key={i}
                  href={reel.href || block.profileHref || "https://www.instagram.com/astronatofficial/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group block bg-[var(--color-eggshell)] transition-all duration-500 hover:rotate-0 hover:scale-[1.02] hover:z-10 relative ${rotation} shadow-[8px_8px_24px_rgba(0,0,0,0.4)]`}
                >
                  {/* Image area */}
                  <div className="relative w-full aspect-[9/16] overflow-hidden bg-[var(--color-charcoal)]">
                    {reel.image ? (
                      reel.image.endsWith('.mp4') ? (
                        <video src={reel.image} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                      ) : (
                        <div className="absolute inset-x-0 -top-[5%] -bottom-[5%]">
                          <Image
                            src={reel.image}
                            alt={reel.caption || "Instagram Reel"}
                            fill
                            unoptimized={true}
                            style={{ objectFit: "cover", objectPosition: "center" }}
                          />
                        </div>
                      )
                    ) : (
                      // Placeholder: Y2K-styled gradient + icon when no image
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[var(--color-y2k-blue)] to-[var(--color-charcoal)]">
                        <InstagramIcon className="w-10 h-10 text-white opacity-30 mb-3" />
                        <span className="font-mono text-[8px] uppercase tracking-widest text-white/40">Reel</span>
                      </div>
                    )}
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                      <div className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-1">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>

                    {/* Views badge */}
                    {reel.views && (
                      <div className="absolute top-3 right-3 bg-black/60 text-white font-mono text-[8px] uppercase tracking-widest px-2 py-1">
                        {reel.views}
                      </div>
                    )}
                  </div>

                  {/* Polaroid bottom strip */}
                  <div className="px-4 py-4 bg-[var(--color-eggshell)]">
                    <p className="font-body text-[13px] text-[var(--color-charcoal)] leading-snug opacity-85 line-clamp-2">
                      {reel.caption}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FeatureCarousel — Headspace-style interactive feature preview with auto-play
// Block shape: { kicker, headingHtml, tabs: [{ id, label, title, desc, ctaLabel, ctaHref }] }
// ─────────────────────────────────────────────────────────────────────────────
export const FeatureCarousel: React.FC<any> = ({ block }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const tabs = block.tabs || [];
  const duration = 6000;

  useEffect(() => {
    // Reveal all planets explicitly since they default to opacity 0 for GSAP
    if (activeIdx === 0) {
       setTimeout(() => {
         const planets = document.querySelectorAll('[id^="planet-"]');
         planets.forEach((el) => ((el as HTMLElement).style.opacity = '1'));
       }, 50);
    }

    if (tabs.length === 0) return;
    if (isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % tabs.length);
    }, duration);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeIdx, isHovered, tabs.length]);

  if (tabs.length === 0) return null;

  const activeTab = tabs[activeIdx];

  // Visual Renderer based on Tab ID
  const renderVisual = (id: string) => {
    switch(id) {
      case "natal":
        return (
          <div className="absolute inset-0 flex items-center justify-center p-4">
             <div className="relative w-full aspect-square max-w-[360px] animate-[spin_100s_linear_infinite]">
                <NatalWheelSVG 
                  isDark={true}
                  planets={[
                    { id: "sun", glyph: "☉", color: "var(--color-eggshell)", lon: 45 },
                    { id: "moon", glyph: "☽", color: "var(--color-acqua)", lon: 130 },
                    { id: "mercury", glyph: "☿", color: "var(--color-y2k-blue)", lon: 20 },
                    { id: "venus", glyph: "♀", color: "var(--color-spiced-life)", lon: 200 },
                    { id: "mars", glyph: "♂", color: "var(--color-planet-mars)", lon: 70 },
                    { id: "jupiter", glyph: "♃", color: "var(--sage)", lon: 310 },
                    { id: "saturn", glyph: "♄", color: "#a5a5a5", lon: 250 },
                    { id: "uranus", glyph: "♅", color: "var(--color-acqua)", lon: 15 },
                    { id: "neptune", glyph: "♆", color: "var(--color-y2k-blue)", lon: 180 },
                    { id: "pluto", glyph: "♇", color: "var(--color-charcoal)", lon: 280 }
                  ]}
                  aspectLines={[
                    { id: "a1", x1: 400, y1: 400, x2: 500, y2: 300, color: "var(--color-acqua)", length: 50, type: "Trine" },
                    { id: "a2", x1: 400, y1: 400, x2: 240, y2: 390, color: "var(--color-spiced-life)", length: 50, type: "Square" },
                    { id: "a3", x1: 400, y1: 400, x2: 380, y2: 550, color: "var(--color-planet-mars)", length: 50, type: "Opposition" },
                    { id: "a4", x1: 400, y1: 400, x2: 550, y2: 450, color: "var(--sage)", length: 50, type: "Sextile" }
                  ]}
                />
             </div>
          </div>
        );
      case "acg":
        return (
          <div className="absolute inset-0 flex flex-col justify-center overflow-hidden bg-[var(--text-primary)]">
             <div className="relative w-[180%] md:w-[140%] left-1/2 -translate-x-1/2 opacity-80 mix-blend-screen -ml-[5%]">
                <AcgMap 
                  compact={true}
                  natal={{
                    sun: { longitude: 40 }, moon: { longitude: 60 }, mercury: { longitude: 80 },
                    venus: { longitude: 120 }, mars: { longitude: 160 }, jupiter: { longitude: 200 },
                    saturn: { longitude: 240 }, uranus: { longitude: 280 }, neptune: { longitude: 320 },
                    pluto: { longitude: 0 }, houses: []
                  }}
                  birthDateTimeUTC="1990-01-01T12:00:00Z"
                  birthLon={0}
                />
             </div>
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none"></div>
          </div>
        );
      case "geodetic":
        return (
           <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black">
               <div className="relative w-[180%] md:w-[150%] left-1/2 -translate-x-1/2">
                   <InteractiveGeodeticWorldMap className="w-full h-auto opacity-90" />
               </div>
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none"></div>
           </div>
        );
      case "transit":
        return (
           <div className="absolute inset-0 flex items-center justify-center p-8">
               {/* Calendar UI Mockup */}
               <div className="w-full max-w-sm bg-[var(--surface)] text-[var(--text-primary)] rounded-[1.5rem] shadow-2xl overflow-hidden border border-white/10">
                  <div className="p-4 border-b border-black/5 bg-[#F9F7EF] flex justify-between items-center">
                     <span className="font-mono text-[9px] uppercase tracking-widest text-black/40">Aug 2026</span>
                     <span className="font-mono text-[9px] uppercase tracking-widest bg-[var(--color-y2k-blue)] text-white px-2 py-0.5 rounded-full shadow-sm">Peak Window</span>
                  </div>
                  <div className="p-6 space-y-4">
                      {/* Timeline bars */}
                      <div className="space-y-1">
                          <div className="flex justify-between font-mono text-[8px] uppercase tracking-widest opacity-60"><span>Venus</span><span>Tulum</span></div>
                          <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                              <div className="w-full h-full bg-gradient-to-r from-[var(--color-spiced-life)]/40 to-[var(--color-spiced-life)] ml-[20%] w-[60%] rounded-full shadow-sm"></div>
                          </div>
                      </div>
                      <div className="space-y-1">
                          <div className="flex justify-between font-mono text-[8px] uppercase tracking-widest opacity-60"><span>Jupiter</span><span>Tokyo</span></div>
                          <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                              <div className="w-full h-full bg-gradient-to-r from-[var(--color-y2k-blue)]/40 to-[var(--color-y2k-blue)] ml-[40%] w-[50%] rounded-full shadow-sm"></div>
                          </div>
                      </div>
                      <div className="space-y-1 pt-2">
                         <div className="w-8 h-8 rounded-full bg-[var(--color-acqua)] flex items-center justify-center mx-auto shadow-[0_0_20px_var(--color-acqua)] text-[var(--color-charcoal)] animate-bounce font-primary text-xs mt-4">go</div>
                      </div>
                  </div>
               </div>
           </div>
        );
      default:
        return null;
    }
  };

  return (
    <section 
      id={block.anchorId} 
      className="py-20 md:py-28 bg-[var(--bg-raised)] border-y border-[var(--surface-border)] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Title Header */}
        <div className="text-center mb-16">
           {block.kicker && <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-4">{block.kicker}</div>}
           <h2
            className="font-primary uppercase leading-[0.9] text-[var(--text-primary)] md:max-w-2xl mx-auto"
            style={{ fontSize: "clamp(2.5rem, 5vw, 6rem)" }}
          >
            <div dangerouslySetInnerHTML={{ __html: renderHtml(block.headingHtml) }} />
          </h2>
        </div>

        {/* --- Pills Navigation Container --- */}
        <div className="flex flex-nowrap md:flex-wrap overflow-x-auto no-scrollbar gap-3 md:gap-4 justify-start md:justify-center mb-10 pb-4 md:pb-0 px-2">
           {tabs.map((tab: any, i: number) => {
              const isActive = i === activeIdx;
              const progressWidth = isActive ? "100%" : "0%";
              
              return (
                 <button
                    key={tab.id}
                    onClick={() => setActiveIdx(i)}
                    className={`relative px-5 md:px-7 py-3 rounded-full font-mono text-[10px] uppercase tracking-widest whitespace-nowrap overflow-hidden transition-all duration-300 border
                       ${isActive 
                         ? "bg-[var(--color-charcoal)] text-[var(--color-eggshell)] border-[var(--color-charcoal)] shadow-[0_4px_16px_rgba(0,0,0,0.15)]" 
                         : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--surface-border)] hover:border-[var(--color-y2k-blue)] hover:text-[var(--text-primary)]"
                       }
                    `}
                 >
                    <span className="relative z-10">{tab.label}</span>
                    {/* Auto-play progress bar background on active pill */}
                    {isActive && (
                      <div 
                        className="absolute bottom-0 left-0 h-[2px] bg-[var(--color-acqua)] transition-all ease-linear"
                        style={{ width: progressWidth, transitionDuration: `${duration}ms` }}
                      ></div>
                    )}
                 </button>
              );
           })}
        </div>

        {/* --- Setup Split Screen Area --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 md:gap-14 bg-[var(--surface)] rounded-[2.5rem] border border-[var(--surface-border)] shadow-sm min-h-[440px] md:min-h-[500px]">
           
           {/* Left/Visual Content - Dynamic rendering */}
           <div className="relative w-full h-[320px] lg:h-auto bg-[var(--color-charcoal)] rounded-t-[2.5rem] lg:rounded-tr-none lg:rounded-l-[2.5rem] overflow-hidden">
               {/* Background subtle noise to make it feel rich */}
               <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
               
               {/* Dynamic Cards Rendering with fade overlay */}
               {tabs.map((tab: any, i: number) => (
                 <div 
                   key={tab.id}
                   className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                   style={{ 
                      opacity: activeIdx === i ? 1 : 0, 
                      visibility: activeIdx === i ? "visible" : "hidden",
                      zIndex: activeIdx === i ? 10 : 0
                   }}
                 >
                   {renderVisual(tab.id)}
                 </div>
               ))}
           </div>

           {/* Right/Text Content */}
           <div className="px-8 py-10 lg:p-16 flex flex-col justify-center relative">
              <div 
                className="relative"
                style={{ height: 'auto', minHeight: '180px' }}
              >
                  {/* Using relative position with absolute tabs for crossfading text to maintain height */}
                  {tabs.map((tab: any, i: number) => {
                     const isCurrent = activeIdx === i;
                     return (
                        <div 
                           key={tab.id} 
                           className="transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                           style={{ 
                             position: isCurrent ? 'relative' : 'absolute',
                             top: 0, left: 0,
                             opacity: isCurrent ? 1 : 0,
                             transform: isCurrent ? 'translateY(0)' : 'translateY(16px)',
                             pointerEvents: isCurrent ? 'auto' : 'none',
                             visibility: isCurrent ? "visible" : "hidden"
                           }}
                        >
                           <h3 className="font-secondary text-3xl md:text-5xl text-[var(--text-primary)] mb-6 leading-thight tracking-tight" style={{ fontFamily: "var(--font-secondary)" }}>
                              {tab.title}
                           </h3>
                           <p className="font-body text-base md:text-[1.1rem] leading-[1.6] opacity-75 text-[var(--text-primary)] mb-10 md:mb-12 max-w-lg">
                              {tab.desc}
                           </p>
                           {tab.ctaLabel && (
                              <Link 
                                href={tab.ctaHref || "#"} 
                                className="inline-flex items-center gap-3 border border-[var(--surface-border)] text-[var(--text-primary)] hover:bg-[var(--color-y2k-blue)] hover:text-white hover:border-[var(--color-y2k-blue)] transition-colors rounded-full px-8 py-4 font-mono text-[10px] uppercase tracking-widest"
                              >
                                {tab.ctaLabel} <ArrowRight size={14} className="opacity-70" />
                              </Link>
                           )}
                        </div>
                     )
                  })}
              </div>
           </div>

        </div>
      </div>
    </section>
  );
};

// ── Founder Section (About Natalia) ────────────────────────────────────────
export const FounderSection: React.FC<any> = ({ block }) => {
  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      style={{ backgroundColor: "var(--color-black)" }}
    >
      {/* Decorative orrery watermark */}
      <div className="absolute top-1/2 right-[-12%] -translate-y-1/2 w-[min(80vw,600px)] h-[min(80vw,600px)] opacity-[0.05] pointer-events-none animate-[spin_120s_linear_infinite] z-0">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
          <circle cx="100" cy="100" r="96" stroke="#F8F5EC" strokeWidth=".5"/>
          <ellipse cx="100" cy="100" rx="56" ry="96" stroke="#F8F5EC" strokeWidth=".4"/>
          <ellipse cx="100" cy="100" rx="96" ry="28" stroke="#F8F5EC" strokeWidth=".3"/>
          <line x1="4" y1="100" x2="196" y2="100" stroke="#F8F5EC" strokeWidth=".3"/>
          <line x1="100" y1="4" x2="100" y2="196" stroke="#F8F5EC" strokeWidth=".3"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Kicker */}
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-acqua)] mb-12 opacity-100">
          ✦ The Mind Behind The Method
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-center">
          {/* Left: Photo with organic blob + script overlap */}
          <div className="relative flex items-center justify-center lg:justify-start">
            {/* Oversized decorative script letter */}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                fontFamily: "var(--font-display-alt-2)",
                fontSize: "clamp(10rem, 20vw, 18rem)",
                color: "var(--color-y2k-blue)",
                opacity: 0.4,
                bottom: "-8%",
                right: "-5%",
                pointerEvents: "none",
                lineHeight: "0.8",
                zIndex: 0,
              }}
            >
              N
            </span>

            {/* Blob image container */}
            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: "var(--shape-organic-1, 40% 60% 70% 30% / 40% 50% 60% 50%)",
                width: "clamp(260px, 36vw, 440px)",
                aspectRatio: "0.85",
                zIndex: 1,
              }}
            >
              <Image
                src={block?.founderImage || "/nat-1.jpg"}
                alt="Natalia — Founder of AstroNat"
                fill
                style={{ objectFit: "cover", objectPosition: "center top" }}
              />
            </div>

            {/* Pill tag overlay */}
            <div
              className="absolute bottom-[6%] left-0 z-20"
              style={{
                backgroundColor: "var(--color-y2k-blue)",
                color: "white",
                borderRadius: "20px",
                padding: "0.35rem 0.9rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
              }}
            >
              Founder · AstroNat
            </div>
          </div>

          {/* Right: Bio copy */}
          <div className="flex flex-col justify-center">
            {/* MONIGUE name header */}
            <h2
              style={{
                fontFamily: "var(--font-display-alt-1)",
                fontSize: "clamp(2.8rem, 5vw, 5rem)",
                color: "var(--color-eggshell)",
                lineHeight: 0.9,
                marginBottom: "0.5rem",
              }}
            >
              {block?.founderName || "NATALIA H."}
            </h2>

            {/* Secondary script subtitle */}
            <p
              style={{
                fontFamily: "var(--font-display-alt-2)",
                fontSize: "clamp(1.4rem, 2.5vw, 2.2rem)",
                color: "var(--color-spiced-life)",
                fontStyle: "italic",
                marginBottom: "2rem",
                lineHeight: 1,
              }}
            >
              {block?.founderTitle || "Astrocartographer & Traveler"}
            </p>

            {/* Divider */}
            <div style={{ width: "3rem", height: "1px", backgroundColor: "var(--color-acqua)", marginBottom: "2rem", opacity: 0.5 }} />

            {/* Bio text */}
            <p
              className="font-body text-base md:text-lg leading-relaxed mb-6"
              style={{ color: "var(--color-eggshell)", opacity: 0.9, maxWidth: "520px" }}
            >
              {block?.bio || "Natalia built AstroNat after years of consulting clients on location-based astrology. Her viral geopolitical predictions—watched by 2.1M people—are the result of one core belief: the stars don't lie about geography."}
            </p>

            <p
              className="font-body text-base leading-relaxed"
              style={{ color: "var(--color-eggshell)", opacity: 0.8, maxWidth: "480px" }}
            >
              {block?.bio2 || "The app runs the same methodology she uses with private clients — 847 calculations, every city on Earth, built for the traveler who wants to stop guessing and start living aligned."}
            </p>

            {/* Social proof pill */}
            <div className="flex items-center gap-4 mt-10">
              <div
                className="font-mono text-[9px] uppercase tracking-[0.2em] border px-4 py-2"
                style={{ borderColor: "var(--color-acqua)", color: "var(--color-acqua)", opacity: 1 }}
              >
                ✦ 4.3M+ Content Views
              </div>
              <div
                className="font-mono text-[9px] uppercase tracking-[0.2em] border px-4 py-2"
                style={{ borderColor: "var(--color-eggshell)", color: "var(--color-eggshell)", opacity: 0.7 }}
              >
                700+ Clients Guided
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
