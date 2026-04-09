"use client";

import React from 'react';
import PlanetIcon from './PlanetIcon';
import { PLANET_COLORS } from '@/app/lib/planet-data';

export default function GeodeticGridCard({ destination = "This City" }: { destination?: string }) {

  // MOCK DATA for the Geodetic grid overlay
  const angles = [
    { name: "ASCENDANT", abrv: "ASC", sign: "Sagittarius", deg: "10°", desc: "Rising energy, personal projection, and the face you show the world here.", hit: { p: "Jupiter", type: "conjunct"} },
    { name: "NADIR", abrv: "IC", sign: "Pisces", deg: "14°", desc: "Roots, home, and internal base. Represents physical anchoring.", hit: null },
    { name: "DESCENDANT", abrv: "DSC", sign: "Gemini", deg: "10°", desc: "Partnerships and outward reflection. Who you attract in this location.", hit: { p: "Mercury", type: "trine"} },
    { name: "MIDHEAVEN", abrv: "MH", sign: "Virgo", deg: "14°", desc: "Career, authority, and public legacy. How your work is received.", hit: { p: "Venus", type: "square"} },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {angles.map((a, i) => (
          <div key={i} className="flex flex-col bg-[var(--surface)] border border-[var(--surface-border)] rounded-[var(--shape-asymmetric-md)] p-6 relative group transition-colors hover:border-[var(--text-tertiary)]">
            <div className="flex justify-between items-start mb-8">
              <span className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--text-primary)] border border-current rounded-full px-3 py-1">
                {a.abrv}
              </span>
              <div className="text-right">
                <div className="font-primary text-2xl" style={{color: "var(--text-primary)"}}>{a.deg}</div>
                <div className="font-mono text-[0.65rem] text-[var(--text-tertiary)] uppercase tracking-widest">{a.sign}</div>
              </div>
            </div>
            
            <h4 className="font-primary text-xl uppercase tracking-tight text-[var(--text-primary)] mb-3">{a.name}</h4>
            <p className="font-body text-[0.8rem] text-[var(--text-secondary)] leading-relaxed mb-8 flex-1">
              {a.desc}
            </p>

            <div className="mt-auto pt-4 border-t border-[var(--surface-border)]">
              {a.hit ? (
                <div className="flex items-center gap-3">
                   <PlanetIcon planet={a.hit.p} color={PLANET_COLORS[a.hit.p]} size={18} />
                   <div className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-secondary)]">
                     {a.hit.type} <strong style={{color: PLANET_COLORS[a.hit.p]}}>{a.hit.p}</strong>
                   </div>
                </div>
              ) : (
                <div className="font-mono text-[0.65rem] text-[var(--text-tertiary)] opacity-50 uppercase tracking-widest">
                   Null Contact
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex justify-between font-mono text-[0.6rem] text-[var(--text-tertiary)] uppercase tracking-[0.1em]">
        <span>STATIC EARTH GRID OVERLAY</span>
        <span>{destination}</span>
      </div>
    </div>
  )
}
