"use client";

import { Suspense } from "react";
import ReadingFlow from "@/app/components/ReadingFlow";
import { PageHeader } from "@/components/app/page-header-context";

export default function CouplesClient() {
  return (
    <>
      <PageHeader title="Couples & Family" />
      <div style={{
        maxWidth: "960px",
        margin: "0 auto",
        width: "100%",
        padding: "var(--space-lg) var(--space-md) var(--space-3xl)",
        display: "flex",
        flexDirection: "column",
      }}>
        <Suspense fallback={null}>
          <ReadingFlow defaultType="couples" />
        </Suspense>
      </div>
    </>
  );
}
