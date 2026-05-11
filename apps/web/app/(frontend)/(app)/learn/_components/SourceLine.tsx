import React from "react";

type SourceLineProps = {
  author: string;
  year: number | string;
  /** Inline lead-in. Together they read like:
   *  "Astrocartography was systematized by Lewis (1976)." */
  children: React.ReactNode;
};

/**
 * In-prose attribution. The cheap, repeating phrase that turns unsourced
 * authority into traceable claim. Use it inside ConceptCard body content.
 *
 * Renders as: [children]{author} ({year}).
 *
 * Example:
 *   <SourceLine author="Lewis" year={1976}>
 *     Astrocartography was systematized by
 *   </SourceLine>
 */
export function SourceLine({ author, year, children }: SourceLineProps) {
  return (
    <span>
      {children}{" "}
      <span className="italic opacity-90">{author}</span>
      <span className="font-mono text-xs opacity-60 ml-1">({year})</span>.
    </span>
  );
}
