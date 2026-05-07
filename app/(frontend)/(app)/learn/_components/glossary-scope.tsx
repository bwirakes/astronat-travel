"use client";

import React, { createContext, useContext, useMemo } from "react";

/**
 * GlossaryScope tracks which glossary terms have already been wrapped on the
 * current page. <Glossify> reads from this context and updates the Set as it
 * walks prose, ensuring each term is wrapped exactly once per scope (the
 * first-use-per-page rule).
 *
 * Why a context (not module-level state):
 *   On the server, a module-level Set would leak across requests. A context
 *   bound to the LessonShell instance gives each page its own scope, both on
 *   the server and the client.
 *
 * Why useMemo (not useRef):
 *   We need a stable Set across renders that we can mutate without triggering
 *   re-renders. useRef would also work, but React's refs lint rule rejects
 *   reading `ref.current` during render. useMemo with [] deps gives us the
 *   same single-instance-per-mount behavior with no lint friction. Mutating
 *   the Set's contents doesn't change the Set's identity, so no re-render.
 */

const GlossaryScopeContext = createContext<Set<string> | null>(null);

export function GlossaryScopeProvider({ children }: { children: React.ReactNode }) {
  const set = useMemo(() => new Set<string>(), []);
  return (
    <GlossaryScopeContext.Provider value={set}>
      {children}
    </GlossaryScopeContext.Provider>
  );
}

/**
 * Returns the wrapped-slugs Set for the current scope. If called outside a
 * provider, returns a transient Set scoped to the calling component's lifetime
 * — useful for ad-hoc <Glossify> usage outside a LessonShell.
 */
export function useGlossaryScope(): Set<string> {
  const ctx = useContext(GlossaryScopeContext);
  const fallback = useMemo(() => new Set<string>(), []);
  return ctx ?? fallback;
}
