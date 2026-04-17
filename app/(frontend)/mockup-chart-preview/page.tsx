import { Suspense } from "react";
import MockupChartPreviewClient from "./MockupChartPreviewClient";
import sampleNatal from "./sample-natal-data.json";

// Public, no-auth preview of the /mockup-chart design variant.
// Uses a pre-exported natal payload so the route can be linked and reviewed
// without logging in. Data is a real natal chart (Brandon's birth chart with
// a pre-computed interpretation) snapshotted at build time.

export const metadata = {
  title: "Mockup Chart Preview · AstroNat",
  description: "Public preview of the natal chart design variant.",
};

export default function MockupChartPreviewPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>
          LOADING PREVIEW...
        </span>
      </div>
    }>
      <MockupChartPreviewClient staticData={sampleNatal as any} />
    </Suspense>
  );
}
