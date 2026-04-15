import ReadingFlow from "@/app/components/ReadingFlow";
import DashboardLayout from "@/app/components/DashboardLayout";
import { Suspense } from "react";

export default function NewReadingPage() {
    return (
        <DashboardLayout showBack backLabel="Home">
            <Suspense fallback={null}>
                <ReadingFlow />
            </Suspense>
        </DashboardLayout>
    );
}
