import React from "react";

type AsideProps = {
  /** Short label shown at the top, e.g. "See also" or "Note". */
  label?: string;
  children: React.ReactNode;
};

/**
 * Left-bordered editorial aside. Use for parenthetical material that would
 * otherwise crowd the main flow: "see also" notes, footnotes, methodology
 * remarks, system caveats.
 *
 * Replaces the today's-pages habit of jamming asides directly into prose.
 */
export function Aside({ label = "Note", children }: AsideProps) {
  return (
    <aside
      className="border-l-2 pl-5 my-6 max-w-2xl"
      style={{ borderColor: "var(--lesson-accent)" }}
    >
      <div
        className="font-mono text-[9px] uppercase tracking-[0.3em] mb-2 opacity-70"
        style={{ color: "var(--lesson-accent)" }}
      >
        {label}
      </div>
      <div className="font-body text-sm md:text-base leading-relaxed opacity-80">
        {children}
      </div>
    </aside>
  );
}
