"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function MockupReadingVersion2() {
  const [mounted, setMounted] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[var(--color-charcoal)] text-[var(--color-eggshell)] font-body selection:bg-[var(--color-y2k-blue)]">
      
      {/* SECTION 1: The Human Feeling (Hero) */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center p-6 text-center border-b border-[var(--surface-border)]">
        
        {/* Massive Background Text Overlap */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none mix-blend-overlay overflow-hidden">
          <span className="font-primary whitespace-nowrap text-[var(--color-y2k-blue)] text-[20vw] leading-[0.8] tracking-tighter">
            PARIS
          </span>
        </div>

        <div className="relative z-10 max-w-3xl flex flex-col items-center space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-[var(--color-y2k-blue)]/50 bg-[var(--color-y2k-blue)]/10 text-[var(--color-y2k-blue)] mb-4">
            <span className="font-mono text-xs uppercase tracking-[0.2em]">The Astrological Verdict</span>
          </div>

          <h1 className="font-secondary text-5xl md:text-7xl leading-tight">
            Creative isolation,<br/>fueled by ambition.
          </h1>

          <p className="font-body text-xl md:text-2xl text-[var(--text-secondary)] max-w-2xl leading-relaxed mt-4">
            Paris will dramatically pull on your 12th House, bringing subconscious themes to the surface. It will act as a creative cocoon, but you must fight the urge to withdraw from reality entirely.
          </p>

          <div className="mt-12 flex flex-col md:flex-row items-center gap-6">
             <div className="flex flex-col items-center border border-[var(--color-eggshell)] p-6" style={{ borderRadius: 'var(--shape-asymmetric-lg)' }}>
               <span className="font-mono text-[var(--color-eggshell)] text-sm mb-2 uppercase">Overall Flow</span>
               <span className="font-primary text-6xl text-[var(--color-y2k-blue)]">62</span>
             </div>
             
             <div className="text-left font-mono text-sm leading-loose max-w-sm">
                <span className="text-[var(--sage)]">↑ Elevated: H12 (Isolation), H9 (Study)</span><br/>
                <span className="text-[var(--color-spiced-life)]">↓ Afflicted: H7 (Romance), H3 (Community)</span>
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Geographic Geometry & Astrodynes */}
      <section className="py-24 px-6 md:px-12 bg-black border-b border-[var(--surface-border)]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8">
            <h2 className="font-primary text-5xl uppercase">The Geographic<br/>Geometry</h2>
            <p className="font-body text-lg text-gray-400">
              The planetary lines crossing France intersect perfectly with your natal Venus. Notice how the ACG Line acts as an amplifier to your natural 12th house placements.
            </p>
            
            <div className="bg-[var(--color-charcoal)] p-6 border-l-4 border-[var(--color-y2k-blue)]">
               <h4 className="font-mono uppercase text-xs text-[var(--color-y2k-blue)] tracking-[0.12em] mb-2">Transit Weather Forecast</h4>
               <p className="font-body text-sm mb-4">
                 Your travel dates (April 10-24) coincide with a powerful Jupiter trine. Use this window to publish, write, or finalize deals.
               </p>
               <div className="h-12 w-full flex items-end gap-1 opacity-70">
                 {/* Fake Sparkline Graph */}
                 {[20, 30, 25, 40, 80, 95, 60, 45, 30, 25].map((h, i) => (
                   <div key={i} className="flex-1 bg-[var(--color-y2k-blue)]" style={{ height: `${h}%` }} />
                 ))}
               </div>
               <div className="flex justify-between mt-2 font-mono text-[0.6rem] uppercase text-gray-500">
                  <span>April 10</span>
                  <span>Peak: April 15</span>
                  <span>April 24</span>
               </div>
            </div>
          </div>

          <div className="relative aspect-square bg-[var(--color-charcoal)] overflow-hidden" style={{ clipPath: 'var(--cut-xl)' }}>
             {/* Mock Map Image */}
             <Image src="/moody-landscape.jpg" alt="Map Data Graphic" fill style={{ objectFit: 'cover', opacity: 0.5, mixBlendMode: 'luminosity' }} />
             
             {/* Abstract Line overlay */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[120%] h-[2px] bg-[var(--color-planet-venus)] transform rotate-12 shadow-[0_0_20px_#FFAFAF]" />
                <div className="absolute bg-[var(--color-black)] px-3 py-1 font-mono text-xs uppercase" style={{ top: '40%', left: '30%' }}>Venus Ascending Line</div>
             </div>
          </div>
          
        </div>
      </section>

      {/* SECTION 3: The Matrix (Power Users Math) */}
      <section className="py-24 px-6 md:px-12 bg-[var(--color-eggshell)] text-[var(--color-charcoal)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between cursor-pointer border-b-2 border-[var(--color-charcoal)] pb-4 mb-8" onClick={() => setShowMatrix(!showMatrix)}>
            <h2 className="font-secondary text-4xl">Open The Matrix</h2>
            <span className="font-primary text-4xl">{showMatrix ? '-' : '+'}</span>
          </div>

          {showMatrix && (
            <div className="space-y-6 font-mono text-xs bg-[var(--color-charcoal)] text-[var(--color-eggshell)] p-8" style={{ borderRadius: 'var(--shape-asymmetric-md)' }}>
              <p className="opacity-50 mb-4">// ASTRO-NAT V4 RUNTIME .LOG</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[var(--color-y2k-blue)] uppercase mb-2">Bucket 1: Natal Frame (30%)</h4>
                  <pre className="text-gray-400">
                    H12 Base Score: 55{'\n'}
                    Venus Essential Dignity: -5 (Deregrine){'\n'}
                    Lilly Angle Mod: -2 (Cadent){'\n'}
                    Subtotal = 48 pts
                  </pre>
                </div>
                <div>
                  <h4 className="text-[var(--color-y2k-blue)] uppercase mb-2">Bucket 2: Occupants (25%)</h4>
                  <pre className="text-gray-400">
                    Mars Natal H4 → Relocated H12{'\n'}
                    Sect: Night (Out of Sect Malefic){'\n'}
                    Multiplier: x1.4 Harm{'\n'}
                    Subtotal = 32 pts
                  </pre>
                </div>
                <div>
                  <h4 className="text-[var(--color-y2k-blue)] uppercase mb-2">Bucket 3: Transits (30%)</h4>
                  <pre className="text-gray-400">
                    Jupiter Trine Relocated Mars{'\n'}
                    Astrodyne Form: 35 * 0.8 * 1.0 = +28{'\n'}
                    Subtotal = 76 pts
                  </pre>
                </div>
                <div>
                  <h4 className="text-[var(--color-y2k-blue)] uppercase mb-2">Bucket 4: Geographic (15%)</h4>
                  <pre className="text-gray-400">
                    ACG Venus Line 50km{'\n'}
                    Decay: e^(-50^2 / 125000) = 0.98{'\n'}
                    Subtotal = 81 pts
                  </pre>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-[var(--surface-border)]">
                <span className="text-[var(--sage)]">Math Synthesis: ((0.3*48) + (0.25*32) + (0.3*76) + (0.15*81)) = 57.35</span>
                <br/>
                <span className="text-[var(--sage)]">Variance Extrapolation = 61.8 (Rounded 62/100)</span>
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
