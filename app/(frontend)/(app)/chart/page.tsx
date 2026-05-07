import { Suspense } from "react";
import ChartClient from "./ChartClient";
import { AstroLoader } from "@/app/components/ui/astro-loader";

export default function ChartPage() {
    return (
        <Suspense fallback={
            <AstroLoader label="Loading chart..." />
        }>
            <ChartClient />
        </Suspense>
    );
}
