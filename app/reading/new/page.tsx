import ReadingFlow from "@/app/components/ReadingFlow";
import DashboardLayout from "@/app/components/DashboardLayout";

export default function NewReadingPage() {
    return (
        <DashboardLayout showBack backLabel="Home">
            <ReadingFlow />
        </DashboardLayout>
    );
}
