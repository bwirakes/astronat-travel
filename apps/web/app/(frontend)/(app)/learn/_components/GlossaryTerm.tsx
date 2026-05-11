"use client";

import React from "react";
import Link from "next/link";
import { getGlossaryEntry } from "./glossary-data";

type GlossaryTermProps = {
  /** Glossary entry slug (anchor on /learn/glossary). */
  term: string;
  /**
   * Tooltip definition. Optional — falls back to the entry's definition from
   * `glossary-data.ts` if omitted. Pass an explicit `definition` only when you
   * need to override the canonical text for a specific in-prose context.
   */
  definition?: string;
  children: React.ReactNode;
};

/**
 * Inline term that gets a dotted underline + a hover/focus tooltip with the
 * definition, plus a click-through to the canonical glossary entry.
 *
 * Three usage patterns:
 *   1. Auto-wrapped by <Glossify> (most common). Definition pulled from data.
 *   2. Hand-written with just slug+children. Definition pulled from data.
 *   3. Hand-written with explicit `definition` override.
 *
 * Uses <dfn> semantics (the HTML "defining instance" element) for SEO and
 * accessibility — search engines and screen readers recognize the role.
 */
export function GlossaryTerm({ term, definition, children }: GlossaryTermProps) {
  const entry = getGlossaryEntry(term);
  const resolvedDefinition = definition ?? entry?.definition ?? "";

  return (
    <Link
      href={`/learn/glossary#${term}`}
      className="group relative inline-block"
      title={resolvedDefinition}
    >
      <dfn
        className="not-italic border-b border-dotted transition-colors group-hover:text-[var(--lesson-accent)]"
        style={{ borderColor: "var(--lesson-accent)" }}
      >
        {children}
      </dfn>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 max-w-[80vw] p-3 rounded-md bg-[var(--bg-raised)] border border-[var(--surface-border)] text-xs leading-relaxed opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-50 shadow-lg"
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] block mb-1.5 opacity-60">
          {entry?.term ?? term}
        </span>
        <span className="font-body opacity-90 block">{resolvedDefinition}</span>
        {entry?.source && (
          <span className="block mt-2 pt-2 border-t border-[var(--surface-border)] font-mono text-[9px] uppercase tracking-widest opacity-50">
            {entry.source.author} · {entry.source.year}
          </span>
        )}
      </span>
    </Link>
  );
}

// Set displayName so <Glossify> can detect existing instances and skip them.
GlossaryTerm.displayName = "GlossaryTerm";
