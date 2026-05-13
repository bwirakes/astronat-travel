"use client";

import dynamic from "next/dynamic";
import posthog from "posthog-js";
import { useEffect, useState, type ReactElement } from "react";
import { hasV4TeacherReading } from "@/app/lib/reading-viewmodel";
import { AstroAppLoader } from "@/app/components/ui/app-loader-shell";

function LoadingWeatherReading(): ReactElement {
  return <AstroAppLoader label="Loading weather reading..." />;
}

function LoadingReading(): ReactElement {
  return <AstroAppLoader label="Loading reading..." />;
}

function LoadingCouplesReading(): ReactElement {
  return <AstroAppLoader label="Loading couples reading..." />;
}

const WeatherReading = dynamic(() => import("./components/weather/WeatherReading"), {
  loading: LoadingWeatherReading,
});

const HundredOneReadingView = dynamic(() => import("./components/v4/HundredOneReadingView"), {
  loading: LoadingReading,
});

const CouplesReadingRouteView = dynamic(() => import("./components/couples/CouplesReadingRouteView"), {
  loading: LoadingCouplesReading,
});

interface Props {
  reading: Record<string, unknown> & { category?: string; weatherForecast?: unknown; teacherReading?: unknown; narrative?: unknown };
  readingId: string;
  isDemo: boolean;
  showUpsell: boolean;
}

export function ReadingClient({ reading, readingId, isDemo, showUpsell }: Props) {
  const [narrative, setNarrative] = useState<Record<string, unknown> | null>(
    (reading.narrative as Record<string, unknown> | null) ?? null
  );
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  // Analytics: emit `reading_viewed` once per route entry; emit
  // `upsell_shown` if the server determined the user is gated. Both used
  // to fire from useEffect after a client-side fetch settled — now they
  // fire as soon as the server-provided props are available.
  useEffect(() => {
    if (isDemo) return;
    const destination = typeof reading.destination === "string" ? reading.destination : "Unknown Destination";
    const macroScore = typeof reading.macroScore === "number" ? reading.macroScore : 0;
    const travelType = typeof reading.travelType === "string" ? reading.travelType : "trip";
    posthog.capture("reading_viewed", {
      reading_id: readingId,
      category: (reading.category as string) || "astrocartography",
      destination,
      macro_score: macroScore,
      travel_type: travelType,
    });
  }, [isDemo, readingId, reading]);

  useEffect(() => {
    if (showUpsell) posthog.capture("upsell_shown", { reading_id: readingId });
  }, [showUpsell, readingId]);

  // Stream the narrative client-side. Server gives us the reading row up
  // front; the narrative is an NDJSON stream of teacher-copy sections that
  // arrive progressively. Kept client-side per design — streaming UI lives
  // here, not on the server.
  useEffect(() => {
    if (isDemo || readingId.length < 30) return;
    if (reading.weatherForecast) return;
    if (reading.teacherReading) {
      if (!hasV4TeacherReading(reading.teacherReading)) {
        // Reading row exists but the V4 payload is incomplete; deterministic
        // fallbacks render in place. No stream needed.
        console.info("[reading-page] teacherReading is incomplete for V4; using deterministic V4 fallbacks.");
      }
      return;
    }
    if (reading.narrative) {
      setNarrative(reading.narrative as Record<string, unknown>);
      return;
    }

    let cancelled = false;
    setNarrativeLoading(true);
    setNarrative(null);

    (async () => {
      try {
        const res = await fetch(`/api/readings/${readingId}/narrative`, { method: "POST" });
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const accumulated: Record<string, unknown> = {};

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const msg = JSON.parse(line);
              if (msg.section && msg.data) {
                accumulated[msg.section] = msg.data;
                setNarrative({ ...accumulated });
              } else if (msg.done) {
                setNarrativeLoading(false);
              } else if (msg.error) {
                console.warn("Narrative partial error:", msg.error);
              }
            } catch {
              console.warn("Failed to parse NDJSON line:", line);
            }
          }
        }
      } catch (err) {
        console.error("Narrative stream failed:", err);
      } finally {
        if (!cancelled) setNarrativeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reading, readingId, isDemo]);

  const isSynastry = reading.category === "synastry";
  // Geodetic weather readings live under category "mundane" (enum constraint)
  // and are discriminated by the presence of details.weatherForecast.
  const isWeather = !!reading.weatherForecast;

  if (isWeather) {
    return <WeatherReading forecast={reading.weatherForecast as never} readingId={readingId || undefined} />;
  }

  if (isSynastry) {
    return (
      <CouplesReadingRouteView
        reading={reading as never}
        narrative={narrative as never}
        paramId={readingId || undefined}
      />
    );
  }

  return (
    <HundredOneReadingView
      reading={reading as never}
      narrative={narrative as never}
      narrativeLoading={narrativeLoading}
      showUpsell={showUpsell}
      paramId={readingId || undefined}
    />
  );
}
