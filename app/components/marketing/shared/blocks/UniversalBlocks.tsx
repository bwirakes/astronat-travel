import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Moon, Sun, AlertCircle, Compass, FileText } from "lucide-react";

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

  // Basic styling for Hero
  return (
    <section className="pt-32 pb-14 md:pt-40 md:pb-24 relative overflow-hidden">
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
            {/* The Payload HTML blocks usually come back as strings if formatted properly */}
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
          <div key={i} className="flex flex-col">
            <span className="font-secondary text-3xl font-semibold text-[var(--text-primary)] leading-none">{s.n}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] mt-2">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatementBand: React.FC<any> = ({ block }) => {
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
    <section id={block.anchorId ?? undefined} className={`py-16 md:py-24 theme-block-h ${sectionTheme.bgClass} ${sectionTheme.textClass}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`flex justify-between items-end mb-16 border-b ${sectionTheme.borderClass} pb-4`}>
          <div>
            <div className={`font-mono text-[10px] uppercase tracking-[0.2em] mb-4 ${sectionTheme.isDark ? 'text-[var(--color-acqua)]' : 'text-[var(--color-y2k-blue)]'}`}>{block.kicker}</div>
            <h2 className="font-primary text-3xl md:text-5xl uppercase leading-none">
              {block.headingHtml ? (
                 <div dangerouslySetInnerHTML={{ __html: renderHtml(block.headingHtml) }} />
              ) : (
                block.heading
              )}
            </h2>
          </div>
          {block.sidebarText && (
            <p className={`hidden md:block font-body text-sm leading-relaxed ${sectionTheme.mutedClass} max-w-lg`}>
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
                <div key={i} className={`relative p-8 border flex flex-col h-full bg-[var(--surface)] ${p.primary ? 'border-[var(--color-y2k-blue)] shadow-[8px_8px_0px_var(--color-y2k-blue)]' : 'border-[var(--surface-border)]'} rounded-[2rem]`}>
                  {p.primary && <div className="absolute top-0 right-0 bg-[var(--color-spiced-life)] text-white text-[8px] uppercase tracking-widest px-3 py-1 font-mono">Popular</div>}
                  <div className="font-mono text-[9px] uppercase tracking-[0.15em] opacity-40 mb-2 text-[var(--text-tertiary)]">{p.tier}</div>
                  <h3 className="font-secondary text-2xl md:text-3xl border-b border-[var(--surface-border)] pb-4 mb-4 leading-none text-[var(--text-primary)]">{p.title}</h3>
                  <p className="text-[10px] leading-relaxed opacity-60 mb-8 italic text-[var(--text-secondary)]">{p.tagline}</p>
                  <div className="mb-8">
                     <span className="block font-mono text-[8px] uppercase opacity-30 mb-1 text-[var(--text-tertiary)]">Starting from</span>
                     <span className="font-primary text-3xl font-semibold text-[var(--text-primary)]">{p.price}</span>
                  </div>
                  <ul className="space-y-3 mb-12 flex-1">
                    {p.includes?.map((inc: any, idx: number) => (
                       <li key={idx} className="text-xs opacity-80 flex items-start gap-2 text-[var(--text-secondary)]">
                          <span className="text-[var(--color-spiced-life)]">✦</span> {inc.line || inc}
                       </li>
                    ))}
                  </ul>
                  {p.ctaLabel && (
                    <Link href={p.ctaHref || "#"} className={`w-full py-4 text-center font-mono text-[9px] uppercase tracking-widest transition-colors ${p.primary ? 'bg-[var(--color-y2k-blue)] text-white hover:bg-[var(--color-charcoal)]' : 'bg-[var(--color-charcoal)] text-white hover:bg-[var(--color-y2k-blue)]'}`}>
                      {p.ctaLabel} <ArrowRight size={12} className="inline-block ml-1 opacity-50" />
                    </Link>
                  )}
                  {p.glyph && <div className="absolute -bottom-6 -right-2 font-primary text-8xl opacity-5 pointer-events-none select-none text-[var(--text-primary)]">{p.glyph}</div>}
                </div>
              );
            }

            // Standard / Numbered with theme-aware colors
            const cardTheme = getBlockTheme(p.bgToken);
            
            return (
              <div key={i} className={`p-10 md:p-12 min-h-[360px] flex flex-col rounded-[2rem] theme-block-h ${cardTheme.bgClass} ${cardTheme.textClass}`} style={p.bgToken === 'acqua' ? { backgroundColor: '#CAF1F0', color: '#111b2e' } : undefined}>
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
      <section className="py-24 md:py-32 border-y border-[var(--surface-border)] bg-[var(--bg)] overflow-hidden relative">
        {block.monogram && (
          <div className="absolute top-0 right-0 -mr-32 -mt-32 opacity-5 pointer-events-none w-[600px] h-[600px] select-none text-[var(--color-y2k-blue)]">
            <Image src={block.monogram} alt="Background monogram" width={600} height={600} />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-16 md:gap-20 items-center relative z-10">
           <div className="relative aspect-[4/5] md:aspect-square w-full rounded-[2rem] overflow-hidden">
             {block.image && <Image src={block.image} alt={block.heading} fill className="object-cover" />}
           </div>
           <div>
             <h2 className="font-primary text-4xl md:text-5xl uppercase leading-[0.9] mb-8 text-[var(--text-primary)]">{block.heading}</h2>
             {block.intro && <p className="font-body text-sm md:text-base leading-relaxed opacity-80 text-[var(--text-secondary)] mb-12">{block.intro}</p>}
             {block.numberedItems && (
                <div className="space-y-6 mb-12">
                   {block.numberedItems.map((item: any, i: number) => (
                      <div key={i} className="flex gap-6">
                        {item.glyph && <div className="font-primary text-2xl text-[var(--color-y2k-blue)] pt-1">{item.glyph}</div>}
                        <div>
                           <h4 className="font-primary text-sm tracking-widest uppercase mb-1 text-[var(--text-primary)]">{item.title}</h4>
                           <p className="font-body text-[13px] opacity-70 text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                   ))}
                </div>
             )}
             {block.primaryCta?.label && (
                <Link href={block.primaryCta.href || "#"} className="inline-block border border-[var(--surface-border)] text-[var(--text-primary)] hover:border-[var(--color-y2k-blue)] hover:text-[var(--color-y2k-blue)] px-8 py-4 font-mono text-[10px] tracking-widest uppercase transition-colors">
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
    <section className={`border-y theme-block-h ${theme.bgClass} ${theme.borderClass} ${theme.textClass}`} style={block.bgToken === 'acqua' ? { backgroundColor: '#CAF1F0', color: '#111b2e' } : undefined}>
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
            <div className="flex flex-col h-full w-full pt-16 md:pt-32 pb-16 px-6 lg:pr-[max(1.5rem,calc((100vw-80rem)/2))] lg:pl-16 border-l border-black/10 relative" style={{ backgroundColor: '#CAF1F0', color: '#111b2e' }}>
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
                      <p className="font-secondary italic text-base md:text-lg leading-snug text-[#111b2e] mb-6">&ldquo;{block.rightPanel.testimonialQuote}&rdquo;</p>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#111b2e] opacity-60">{block.rightPanel.testimonialKicker} · {block.rightPanel.testimonialMeta}</p>
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
  return (
    <section className="py-16 md:py-24 border-t border-[var(--surface-border)] bg-[var(--bg-raised)]">
      <div className="max-w-7xl mx-auto px-6">
         <div className="text-center mb-16 max-w-lg mx-auto">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-4">{block.kicker}</div>
            <h2 className="font-primary text-4xl md:text-5xl uppercase text-[var(--text-primary)]">
               <div dangerouslySetInnerHTML={{ __html: renderHtml(block.headingHtml) }} />
            </h2>
         </div>
         
          {(() => {
            const stepsLen = block.steps?.length || 5;
            const cols = stepsLen === 3 ? "md:grid-cols-3" : 
                         stepsLen === 4 ? "md:grid-cols-4" : 
                         stepsLen === 5 ? "md:grid-cols-5" : 
                         stepsLen === 6 ? "md:grid-cols-6" : 
                         "md:grid-cols-5";
            
            return (
              <div className={`grid grid-cols-1 ${cols} gap-8 overflow-hidden relative`}>
                <div className="absolute top-8 left-0 right-0 h-px bg-[var(--color-y2k-blue)] opacity-10 md:block hidden" />
                {block.steps?.map((step: any, i: number) => (
                  <div key={i} className="relative text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border border-[var(--color-y2k-blue)] bg-[var(--bg)] flex items-center justify-center font-primary text-xl mb-6 relative z-10 text-[var(--color-y2k-blue)]">
                       {step.n}
                    </div>
                    <h4 className="font-mono text-[10px] uppercase tracking-widest mb-2 text-[var(--text-primary)]">{step.title}</h4>
                    <p className="text-[10px] opacity-60 leading-relaxed px-4 text-[var(--text-secondary)]">{step.body}</p>
                  </div>
                ))}
              </div>
            );
          })()}
      </div>
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
                <Link href={block.primaryCta.href || "#"} className={`inline-block px-10 py-5 font-mono text-[10px] uppercase tracking-widest transition-colors ${theme.isDark ? "bg-[var(--color-acqua)] text-[#111b2e] hover:bg-white" : "bg-[var(--color-y2k-blue)] text-white hover:bg-[var(--color-charcoal)]"}`}>
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
      <section className="py-24 md:py-32 bg-[var(--color-y2k-blue)] relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-16 relative z-10">
            <div>
               {block.kicker && <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-eggshell)] opacity-60 mb-6">{block.kicker}</div>}
               <h2 className="font-primary text-5xl md:text-6xl uppercase leading-[0.9] text-white mb-8" dangerouslySetInnerHTML={{ __html: renderHtml(block.headingHtml) }} />
               <p className="font-body text-sm md:text-base leading-relaxed text-white/80 max-w-sm">{block.body}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {block.primaryCard && (
                  <Link href={block.primaryCard.href || "#"} className="bg-[var(--color-acqua)] p-8 md:p-10 rounded-[2rem] flex flex-col hover:opacity-90 transition-opacity md:col-span-2 group">
                     <div className="font-mono text-[9px] uppercase tracking-widest text-[#111b2e] opacity-60 mb-4">{block.primaryCard.kicker}</div>
                     <h3 className="font-secondary text-3xl md:text-4xl text-[#111b2e] leading-tight flex-1" dangerouslySetInnerHTML={{ __html: renderHtml(block.primaryCard.titleHtml) }} />
                     <div className="mt-8 flex justify-end">
                        <div className="w-12 h-12 rounded-full border border-[#111b2e] flex items-center justify-center group-hover:bg-[#111b2e] group-hover:text-[var(--color-acqua)] transition-colors">
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
          <h2 className="font-primary text-5xl md:text-6xl lg:text-7xl uppercase leading-[0.85] mb-8 text-[#fcfaf1]">
            {block.headingHtml ? (
               <div dangerouslySetInnerHTML={{ __html: renderHtml(block.headingHtml) }} />
            ) : block.heading}
          </h2>
          <p className="text-sm md:text-base opacity-70 leading-relaxed mb-12 text-[#fcfaf1] max-w-lg mx-auto">{block.body}</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {block.primaryCta?.label && (
              <Link
                href={block.primaryCta.href || "#"}
                className="inline-flex items-center gap-3 bg-[#fcfaf1] text-[#111b2e] px-10 py-5 font-mono text-[10px] uppercase tracking-widest transition-transform duration-200 hover:scale-105 active:scale-95"
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
