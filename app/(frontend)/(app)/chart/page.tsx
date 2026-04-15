import { Suspense } from "react";
import ChartClient from "./ChartClient";

export default function ChartPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-tertiary)", letterSpacing: "0.1em" }}>
                    LOADING CHART...
                </span>
            </div>
        }>
            <ChartClient />
        </Suspense>
    );
}
