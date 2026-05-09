import { Suspense } from "react";
import ChartClient from "./ChartClient";
import { AstroAppLoader } from "@/app/components/ui/app-loader-shell";

export default function ChartPage() {
    return (
        <Suspense fallback={
            <AstroAppLoader label="Loading chart..." />
        }>
            <ChartClient />
        </Suspense>
    );
}
