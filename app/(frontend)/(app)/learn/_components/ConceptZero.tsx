import React from "react";

type ConceptZeroProps = {
  children: React.ReactNode;
};

/**
 * The plain-language anchor that opens Act 2 (Teach) on every lesson.
 * One paragraph. Astronomy voice when possible. Defines what's about to be
 * taught in language a first-time reader can hold without prerequisites.
 *
 * Visual: large, generous, no card chrome — distinct from concept cards which
 * are smaller and structured. ConceptZero is "the lesson in one breath."
 */
export function ConceptZero({ children }: ConceptZeroProps) {
  return (
    <section className="px-6 md:px-12 lg:px-20 py-16 md:py-24 max-w-7xl mx-auto">
      <div className="max-w-3xl">
        <div className="flex items-baseline gap-4 mb-6">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.3em]"
            style={{ color: "var(--lesson-accent)" }}
          >
            Concept Zero
          </span>
          <span className="flex-1 h-px bg-[var(--surface-border)]" />
        </div>
        <p className="font-primary text-2xl md:text-3xl lg:text-4xl leading-[1.25] tracking-tight">
          {children}
        </p>
      </div>
    </section>
  );
}
