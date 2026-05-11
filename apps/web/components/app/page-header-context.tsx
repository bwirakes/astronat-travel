"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PageHeaderState = {
  title?: string;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
};

type Ctx = {
  header: PageHeaderState;
  setHeader: (next: PageHeaderState) => void;
  clearHeader: () => void;
};

const PageHeaderContext = createContext<Ctx | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeaderState] = useState<PageHeaderState>({});

  const setHeader = useCallback((next: PageHeaderState) => {
    setHeaderState(next);
  }, []);
  const clearHeader = useCallback(() => setHeaderState({}), []);

  const value = useMemo(() => ({ header, setHeader, clearHeader }), [header, setHeader, clearHeader]);
  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function usePageHeader() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error("usePageHeader must be used inside PageHeaderProvider");
  return ctx;
}

/**
 * Declarative slot pages render to register their title / back target with the
 * parent (app) layout. Renders nothing itself.
 */
export function PageHeader(props: PageHeaderState) {
  const { setHeader, clearHeader } = usePageHeader();
  const { title, backTo, backLabel, actions } = props;

  useEffect(() => {
    setHeader({ title, backTo, backLabel, actions });
    return () => clearHeader();
  }, [title, backTo, backLabel, actions, setHeader, clearHeader]);

  return null;
}
