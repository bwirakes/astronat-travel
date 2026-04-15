"use client";

import React from "react";
import { AstronatCard } from "@/app/components/ui/astronat-card";
import { cn } from "@/lib/utils";

interface ScrollyCardProps {
  children?: React.ReactNode;
  className?: string;
  category?: string;
  title: React.ReactNode;
  description: string;
}

/** Intro Card for Scrollytelling Sections */
export function LearnIntroCard({ category, title, description, className }: ScrollyCardProps) {
  return (
    <div id="intro-card" className={cn("max-w-4xl mx-auto text-center px-6 relative z-10", className)}>
      {category && (
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-y2k-blue)] mb-8 block font-bold">
          {category}
        </span>
      )}
      <h1 className="font-primary text-[clamp(3.5rem,10vw,8rem)] leading-[0.82] mb-12 uppercase tracking-tighter text-[var(--text-primary)]">
        {title}
      </h1>
      <p className="text-xl md:text-2xl text-[var(--text-secondary)] leading-relaxed font-body max-w-2xl mx-auto opacity-90">
        {description}
      </p>
      <div className="mt-16 animate-bounce opacity-40 text-[var(--text-tertiary)] font-mono text-[9px] uppercase tracking-[0.4em]">
        Scroll to Begin
      </div>
    </div>
  );
}

/** Standard Side-Card for Scrollytelling Sections */
export function LearnSectionCard({ title, description, className }: ScrollyCardProps) {
  return (
    <AstronatCard 
      variant="black" 
      shape="cut-md" 
      className={cn("p-10 md:p-14 shadow-2xl border-white/10 max-w-xl", className)}
    >
      <h3 className="font-primary text-4xl md:text-6xl uppercase mb-8 text-[var(--color-eggshell)] leading-[0.85] tracking-tight">
        {title}
      </h3>
      <p className="text-lg text-[var(--color-eggshell)]/80 leading-relaxed font-body">
        {description}
      </p>
    </AstronatCard>
  );
}

/** Outro Card for Scrollytelling Sections */
export function LearnOutroCard({ title, description, buttonText = "Next Lesson", buttonHref = "/learn", className }: ScrollyCardProps & { buttonText?: string, buttonHref?: string }) {
  return (
    <div id="outro-card" className={cn("max-w-3xl mx-auto text-center px-6", className)}>
      <h2 className="font-primary text-6xl md:text-8xl leading-[0.8] mb-8 uppercase text-white">
        {title}
      </h2>
      <p className="text-lg md:text-xl text-white/60 leading-relaxed font-body mb-12">
        {description}
      </p>
      <a 
        href={buttonHref}
        className="inline-block bg-white text-black font-mono uppercase text-xs tracking-widest px-10 py-5 rounded-full hover:bg-[var(--color-y2k-blue)] hover:text-white transition-colors"
      >
        {buttonText}
      </a>
    </div>
  );
}
