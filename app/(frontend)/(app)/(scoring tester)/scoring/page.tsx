import { PageHeader } from "@/components/app/page-header-context";
import ScoringTesterClient from "./ScoringTesterClient";

export default function ScoringPage() {
  return (
    <>
      <PageHeader title="Scoring Tester" />
      <div style={{ width: "100%", padding: "var(--space-lg) var(--space-md) var(--space-3xl)" }}>
        <ScoringTesterClient />
      </div>
    </>
  );
}
