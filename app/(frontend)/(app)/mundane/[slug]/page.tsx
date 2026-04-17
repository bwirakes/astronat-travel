import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getMundaneChartData } from "@/app/lib/astro/extract-mundane";
import { COUNTRY_CHARTS } from "@/lib/astro/mundane-charts";
import ChartClient from "../../chart/ChartClient";

export function generateStaticParams() {
  return COUNTRY_CHARTS.map((c) => ({
    slug: c.slug,
  }));
}

export const dynamicParams = false;

export default async function MundaneSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const country = COUNTRY_CHARTS.find((c) => c.slug === slug);

  if (!country) {
    notFound();
  }

  const initialNatalData = await getMundaneChartData(slug);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChartClient 
        isMundane={true} 
        countrySlug={country.slug} 
        countryName={country.name} 
        initialNatalData={initialNatalData} 
      />
    </Suspense>
  );
}
