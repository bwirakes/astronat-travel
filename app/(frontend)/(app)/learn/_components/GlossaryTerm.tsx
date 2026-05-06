"use client";

import React from "react";
import Link from "next/link";

type GlossaryTermProps = {
  /** Glossary entry slug (anchor on /learn/glossary). */
  term: string;
  /** Tooltip definition. Stays in sync with the glossary page. */
  definition: string;
  children: React.ReactNode;
};

/**
 * Inline term that gets a dotted underline + a hover/focus tooltip with the
 * definition, plus a click-through to the canonical glossary entry.
 *
 * Use on first appearance of any defined term per page. Subsequent uses on
 * the same page render plain text.
 */
export function GlossaryTerm({ term, definition, children }: GlossaryTermProps) {
  return (
    <Link
      href={`/learn/glossary#${term}`}
      className="group relative inline-block"
      title={definition}
    >
      <span
        className="border-b border-dotted transition-colors group-hover:text-[var(--lesson-accent)]"
        style={{ borderColor: "var(--lesson-accent)" }}
      >
        {children}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 max-w-[80vw] p-3 rounded-md bg-[var(--bg-raised)] border border-[var(--surface-border)] text-xs leading-relaxed opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-50"
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] block mb-1 opacity-60">
          {term}
        </span>
        <span className="font-body opacity-90">{definition}</span>
      </span>
    </Link>
  );
}
