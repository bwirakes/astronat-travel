"use client";

import type { ReactNode } from "react";
import { APP_SHELL_LOADER_MIN_HEIGHT, AstroLoader } from "@/app/components/ui/astro-loader";

const APP_LOADER_SHELL_PADDING = "var(--space-lg) var(--space-md) var(--space-3xl)";
const APP_LOADER_VISUAL_PADDING = "var(--space-lg) var(--space-md)";
const APP_LOADER_SHELL_MAX_WIDTH = "960px";

interface AppLoaderShellProps {
  children: ReactNode;
  minHeight?: string;
  padding?: string;
}

export function AppLoaderShell({
  children,
  minHeight = APP_SHELL_LOADER_MIN_HEIGHT,
  padding = APP_LOADER_SHELL_PADDING,
}: AppLoaderShellProps) {
  return (
    <div
      style={{
        maxWidth: APP_LOADER_SHELL_MAX_WIDTH,
        margin: "0 auto",
        width: "100%",
        padding,
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight,
      }}
    >
      {children}
    </div>
  );
}

interface AstroAppLoaderProps {
  label?: string;
  minHeight?: string;
}

export function AstroAppLoader({ label, minHeight = APP_SHELL_LOADER_MIN_HEIGHT }: AstroAppLoaderProps) {
  return (
    <AppLoaderShell minHeight={minHeight} padding={APP_LOADER_VISUAL_PADDING}>
      <AstroLoader label={label} minHeight={minHeight} />
    </AppLoaderShell>
  );
}
