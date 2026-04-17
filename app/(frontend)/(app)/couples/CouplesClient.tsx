"use client";

import { Suspense } from "react";
import DashboardLayout from "@/app/components/DashboardLayout";
import ReadingFlow from "@/app/components/ReadingFlow";

export default function CouplesClient() {
  return (
    <DashboardLayout title="Couples & Family" kicker="SYNASTRY" backLabel="Home" backHref="/dashboard">
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "var(--space-lg)" }}>
          Compare destination scores for you and your partner side-by-side. We&apos;ll surface areas of overlap, asymmetric excitement, and friction.
        </p>
        <Suspense fallback={null}>
          <ReadingFlow defaultType="couples" />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
