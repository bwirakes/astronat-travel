"use client";

import React from "react";
import { GlossaryTerm } from "./GlossaryTerm";
import {
  getAllGlossaryPatterns,
  type GlossaryEntry,
} from "./glossary-data";
import { useGlossaryScope } from "./glossary-scope";

type GlossifyProps = {
  /**
   * Children may be a string, a single React element (paragraph etc.), or an
   * array of these. We walk the tree and wrap text nodes; non-text content is
   * passed through untouched.
   */
  children: React.ReactNode;
};

/**
 * Tags whose text content should never be glossified.
 * (Either because it's already a link, code, or marker text.)
 */
const SKIP_TAGS = new Set(["a", "code", "pre", "kbd", "abbr", "dfn"]);

/**
 * Wraps the first appearance per page of every glossary term/alias inside
 * `children` with <GlossaryTerm>. Reads the wrapped-slugs Set from
 * GlossaryScopeContext (provided by LessonShell), so multiple <Glossify>
 * blocks on the same page share state.
 *
 * Non-string content is walked recursively; strings are scanned with regexes
 * built from glossary patterns. Patterns are sorted longest-first so
 * "tropical zodiac" wins over "zodiac" when both could match.
 */
export function Glossify({ children }: GlossifyProps) {
  const wrapped = useGlossaryScope();
  const patterns = getAllGlossaryPatterns();
  return <>{walk(children, wrapped, patterns)}</>;
}

/** Opt-out wrapper. Children inside are not glossified. */
export function NoGloss({ children }: { children: React.ReactNode }) {
  return <span data-no-gloss="true">{children}</span>;
}

function walk(
  node: React.ReactNode,
  wrapped: Set<string>,
  patterns: { pattern: string; entry: GlossaryEntry }[]
): React.ReactNode {
  if (node === null || node === undefined || node === false) return node;

  if (typeof node === "string") {
    return glossifyString(node, wrapped, patterns);
  }

  if (typeof node === "number" || typeof node === "boolean") return node;

  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <React.Fragment key={i}>{walk(child, wrapped, patterns)}</React.Fragment>
    ));
  }

  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>;

    // Skip <NoGloss> via data attribute (it's a real DOM span).
    if (
      typeof el.type === "string" &&
      el.type === "span" &&
      (el.props as Record<string, unknown>)["data-no-gloss"] === "true"
    ) {
      return node;
    }

    // Skip if the element type is in the skip-tag list.
    if (typeof el.type === "string" && SKIP_TAGS.has(el.type)) return node;

    // Skip nested Glossify and existing GlossaryTerm.
    const elTypeName =
      typeof el.type === "function"
        ? (el.type as { displayName?: string; name?: string }).displayName ??
          (el.type as { name?: string }).name
        : null;
    if (elTypeName === "Glossify" || elTypeName === "GlossaryTerm") return node;

    const children = el.props?.children;
    if (children === undefined) return node;

    return React.cloneElement(el, el.props, walk(children, wrapped, patterns));
  }

  return node;
}

/**
 * Scans a string for the earliest unwrapped glossary term/alias and emits a
 * fragment with the term wrapped in <GlossaryTerm>. Recurses on the tail so
 * a single string can host multiple wraps.
 */
function glossifyString(
  text: string,
  wrapped: Set<string>,
  patterns: { pattern: string; entry: GlossaryEntry }[]
): React.ReactNode {
  if (!text) return text;

  const candidates = patterns.filter((p) => !wrapped.has(p.entry.slug));
  if (candidates.length === 0) return text;

  // Earliest match across all candidate patterns. Ties broken by longer
  // pattern (patterns list is already sorted longest-first).
  let bestStart = -1;
  let bestEntry: GlossaryEntry | null = null;
  let bestMatchedText = "";

  for (const { pattern, entry } of candidates) {
    const re = new RegExp(`\\b${escapeRegex(pattern)}\\b`, "i");
    const m = re.exec(text);
    if (!m) continue;
    const start = m.index;
    if (bestStart === -1 || start < bestStart) {
      bestStart = start;
      bestEntry = entry;
      bestMatchedText = m[0];
    }
  }

  if (!bestEntry || bestStart === -1) return text;

  wrapped.add(bestEntry.slug);

  const before = text.slice(0, bestStart);
  const after = text.slice(bestStart + bestMatchedText.length);

  return (
    <>
      {before}
      <GlossaryTerm term={bestEntry.slug} definition={bestEntry.definition}>
        {bestMatchedText}
      </GlossaryTerm>
      {glossifyString(after, wrapped, patterns)}
    </>
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Set displayName so the walker can detect nested <Glossify>.
Glossify.displayName = "Glossify";
