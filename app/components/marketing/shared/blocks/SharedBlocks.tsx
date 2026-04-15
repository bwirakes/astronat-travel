import React from "react";
import Image from "next/image";

const renderHtml = (htmlContent: any) => {
  if (typeof htmlContent === "string") return htmlContent;
  return String(htmlContent || "");
};

export const TickerMarquee: React.FC<any> = ({ block }) => {
  const duration = typeof block.durationSec === "number" ? block.durationSec : 28;
  const items = block.items || [];
  
  if (items.length === 0) return null;

  return (
    <div className="w-full bg-[var(--color-y2k-blue)] py-3 overflow-hidden flex whitespace-nowrap border-y border-[rgba(252,250,241,0.1)]">
      <div 
        className="flex gap-8 items-center" 
        style={{ animation: `marquee ${duration}s linear infinite` }}
      >
        {items.map((item: any, i: number) => (
           <span key={i} className="font-mono text-[9px] md:text-[10px] uppercase tracking-widest text-[var(--color-eggshell)] flex items-center gap-8">
             {item.text}
             <span className="text-[var(--color-spiced-life)] font-primary text-sm opacity-50">✦</span>
           </span>
        ))}
        {/* Duplicate for seamless infinite loop */}
        {items.map((item: any, i: number) => (
           <span key={`dup-${i}`} className="font-mono text-[9px] md:text-[10px] uppercase tracking-widest text-[var(--color-eggshell)] flex items-center gap-8">
             {item.text}
             <span className="text-[var(--color-spiced-life)] font-primary text-sm opacity-50">✦</span>
           </span>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}}/>
    </div>
  );
};

export const TestimonialGrid: React.FC<any> = ({ block }) => {
  return (
    <section className="py-16 md:py-24 bg-[var(--bg-raised)] border-t border-[var(--surface-border)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          {block.subheading && <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-spiced-life)] mb-4">{block.subheading}</div>}
          <h2 className="font-primary text-4xl md:text-5xl uppercase text-[var(--text-primary)]">{block.heading}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {block.items?.map((item: any, i: number) => (
            <div key={i} className="p-8 md:p-10 border border-[var(--surface-border)] rounded-[2rem] bg-[var(--bg)] flex flex-col h-full hover:border-[var(--color-y2k-blue)] transition-colors group">
               <div className="text-[var(--color-y2k-blue)] font-primary text-5xl opacity-40 mb-4 leading-none">“</div>
               <p className="font-body text-sm md:text-base leading-relaxed opacity-90 text-[var(--text-secondary)] mb-8 flex-1">
                 {item.quote}
               </p>
               <div className="flex flex-col border-t border-[var(--surface-border)] pt-4 mt-auto group-hover:border-[rgba(26,54,93,0.1)] transition-colors">
                 <span className="font-primary font-semibold text-sm tracking-widest uppercase text-[var(--text-primary)]">{item.name}</span>
                 <span className="font-mono text-[9px] opacity-50 mt-1 uppercase text-[var(--text-tertiary)]">{item.location}</span>
               </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const FaqAccordion: React.FC<any> = ({ block }) => {
  return (
    <section className="py-16 md:py-24 border-t border-[var(--surface-border)]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12 text-center">
           {block.kicker && <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-y2k-blue)] mb-4">{block.kicker}</div>}
           <h2 className="font-primary text-3xl md:text-5xl uppercase text-[var(--text-primary)]">{block.heading}</h2>
        </div>
        <div className="space-y-4">
          {block.items?.map((item: any, i: number) => (
            <details key={i} className="group border border-[var(--surface-border)] rounded-2xl bg-[var(--bg-raised)] overflow-hidden cursor-pointer">
              <summary className="flex items-center justify-between p-6 font-secondary text-lg md:text-xl font-medium list-none outline-none select-none text-[var(--text-primary)]">
                {item.question}
                <span className="transition-transform duration-300 group-open:-rotate-45 text-[var(--color-y2k-blue)] ml-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </span>
              </summary>
              <div className="px-6 pb-6 pt-2 font-body text-sm md:text-base leading-relaxed opacity-80 text-[var(--text-secondary)]">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export const PullQuote: React.FC<any> = ({ block }) => {
  const bg = block.bgToken === "black" ? "#111b2e" : "var(--bg-raised)";
  const color = block.bgToken === "black" ? "#fcfaf1" : "var(--text-primary)";
  const accent = block.bgToken === "black" ? "var(--color-acqua)" : "var(--color-y2k-blue)";

  return (
    <section className="py-24 md:py-32 border-y border-[var(--surface-border)]" style={{ background: bg, color }}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div style={{ color: accent }} className="font-secondary italic text-6xl md:text-8xl mb-8 leading-none opacity-40">“</div>
        <div className="font-secondary text-2xl md:text-4xl lg:text-5xl leading-tight mb-8" dangerouslySetInnerHTML={{ __html: renderHtml(block.quote) }} />
        {block.attribution && (
           <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">
             — {block.attribution}
           </div>
        )}
      </div>
    </section>
  );
};
