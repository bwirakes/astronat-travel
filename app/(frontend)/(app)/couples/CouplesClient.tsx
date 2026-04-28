"use client";

import { Suspense } from "react";
import ReadingFlow from "@/app/components/ReadingFlow";
import { PageHeader } from "@/components/app/page-header-context";

export default function CouplesClient() {
  return (
    <>
      <PageHeader title="Couples & Family" />
      <div style={{ width: "100%", padding: "var(--space-lg) var(--space-md) var(--space-3xl)" }}>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "var(--space-lg)", maxWidth: "65ch" }}>
          Compare destination scores for you and your partner side-by-side. We&apos;ll surface areas of overlap, asymmetric excitement, and friction.
        </p>
        <Suspense fallback={null}>
          <ReadingFlow defaultType="couples" />
        </Suspense>
      </div>
    </>
  );
}
