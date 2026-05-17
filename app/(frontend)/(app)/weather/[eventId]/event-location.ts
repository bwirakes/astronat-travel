/**
 * event-location.ts — derives a clean, human-readable location string for
 * a weather event.
 *
 * Forecast events come with parsed geodetic zones (e.g. "UK / Ghana / Nigeria").
 * Historical events have no zones field but the location is encoded in the
 * title and notes ("Hurricane Helene", "LA Palisades & Eaton fires", etc.).
 * This module extracts a friendly label for the WHERE card so the page never
 * has to fall back to the misleading "Worldwide" claim.
 */

import type { GeodeticWeatherEvent } from "@/app/lib/geodetic/weather-types";

interface ParsedLocation {
    label: string;
    /** Optional secondary line ("California, USA" / "3 regions"). */
    detail: string | null;
    /** True if we're confident this is the actual impact site, false if it's a fallback guess. */
    confident: boolean;
}

/**
 * Patterns that match against an event's title, combo, and notes fields
 * to extract a specific impact location for historical events. Ordered:
 * more specific patterns first.
 *
 * Each entry maps a regex test → human label.
 */
const TITLE_LOCATION_PATTERNS: Array<{ test: RegExp; label: string }> = [
    // Most specific — city/region mentions
    { test: /\b(LA |Los Angeles|Palisades|Eaton)\b/i,                label: "Los Angeles, USA" },
    { test: /\bValencia\b/i,                                          label: "Valencia, Spain" },
    { test: /\bAhr Valley|Ahr-Valley\b/i,                            label: "Ahr Valley, Germany" },
    { test: /\bTexas Hill Country|Hill Country/i,                    label: "Hill Country, Texas" },
    { test: /\bSt\.?\s?Louis\b/i,                                    label: "St. Louis, USA" },
    { test: /\bKentucky\b/i,                                          label: "Kentucky, USA" },
    { test: /\bN(orth)?\s?Wales\b/i,                                 label: "North Wales, UK" },
    { test: /\bN(orth)?\s?Dakota|Enderlin\b/i,                       label: "North Dakota, USA" },
    { test: /\bJamaica\b/i,                                           label: "Jamaica" },
    { test: /\bSri Lanka\b/i,                                         label: "Sri Lanka" },
    { test: /\bMyanmar\b/i,                                           label: "Myanmar" },
    { test: /\bTampa\b/i,                                             label: "Tampa, USA" },
    { test: /\bGulf Coast\b/i,                                        label: "Gulf Coast, USA" },
    // Multi-country patterns
    { test: /\bIndonesia\b.*\bMalaysia\b|\bMalaysia\b.*\bIndonesia\b/i, label: "Indonesia / Malaysia" },
    { test: /\bThailand\b.*\bIndonesia\b|\bIndonesia\b.*\bThailand\b/i, label: "Thailand / Indonesia" },
    // Broader regions
    { test: /\bEuropean?\b/i,                                         label: "Europe" },
    { test: /\bUK\/Europe|UK and Europe\b/i,                         label: "UK / Europe" },
    { test: /\bUS South|US Midwest|South\/Midwest/i,                  label: "US South / Midwest" },
    // Country-only
    { test: /\bUK\b/i,                                                label: "United Kingdom" },
    { test: /\bUS(A|\b)/i,                                            label: "United States" },
    { test: /\bChina\b/i,                                             label: "China" },
    { test: /\bJapan\b/i,                                             label: "Japan" },
    { test: /\bIndia\b/i,                                             label: "India" },
    { test: /\bSpain\b/i,                                             label: "Spain" },
    { test: /\bAtlantic|hurricane|cyclone\b/i,                       label: "Atlantic basin" },
];

/**
 * Parse a location string for a weather event. Tries multiple sources in
 * order of specificity:
 *
 *  1. event.zones[0] (most specific — explicit forecast zone)
 *  2. event.title pattern-match (covers most historical events)
 *  3. event.notes / combo pattern-match (fallback)
 *  4. The word "Global" as a last resort (rare)
 */
export function parseEventLocation(event: GeodeticWeatherEvent): ParsedLocation {
    // 1. Zones (forecasts)
    if (event.zones.length > 0) {
        const primary = event.zones[0].split("(")[0].trim();
        const detail = event.zones.length > 1
            ? `+${event.zones.length - 1} more region${event.zones.length > 2 ? "s" : ""}`
            : null;
        return { label: primary, detail, confident: true };
    }

    // 2/3. Pattern match against the joined text fields (title + combo + notes).
    const text = [event.title, event.combo, event.notes].filter(Boolean).join(" ");
    for (const { test, label } of TITLE_LOCATION_PATTERNS) {
        if (test.test(text)) {
            return { label, detail: "historical event", confident: true };
        }
    }

    // 4. Fallback — we genuinely don't know.
    return {
        label: event.kind === "historical" ? "Region unknown" : "Worldwide",
        detail: event.kind === "historical" ? "see notes for detail" : "no specific zone",
        confident: false,
    };
}
