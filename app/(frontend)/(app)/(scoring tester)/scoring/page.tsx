import DashboardLayout from "@/app/components/DashboardLayout";
import ScoringTesterClient from "./ScoringTesterClient";

export default function ScoringPage() {
  return (
    <DashboardLayout
      title="Scoring Tester"
      kicker="HOUSE MATRIX"
      backLabel="Home"
      backHref="/dashboard"
      maxWidth="1440px"
    >
      <ScoringTesterClient />
    </DashboardLayout>
  );
}
