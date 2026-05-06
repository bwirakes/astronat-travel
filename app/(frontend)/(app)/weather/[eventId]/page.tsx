import { notFound } from "next/navigation";
import { ALL_GEODETIC_WEATHER_EVENTS, getWeatherEventById } from "@/app/lib/geodetic/weather-predictions";
import { buildGeodeticMatrixResponse } from "@/app/lib/geodetic/weather-matrix";
import WeatherEventPageClient from "./WeatherEventPageClient";

type WeatherEventPageProps = {
    params: Promise<{ eventId: string }>;
};

export function generateStaticParams(): Array<{ eventId: string }> {
    return ALL_GEODETIC_WEATHER_EVENTS.map((event) => ({ eventId: event.id }));
}

export const dynamicParams = false;

export default async function WeatherEventPage({ params }: WeatherEventPageProps) {
    const { eventId } = await params;
    const event = getWeatherEventById(eventId);
    if (!event) notFound();
    const matrix = buildGeodeticMatrixResponse({ includeHistorical: true, longitudeResolution: 2 });
    return <WeatherEventPageClient event={event} matrix={matrix} />;
}
