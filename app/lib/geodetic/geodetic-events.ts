/**
 * geodetic-events.ts — Precomputed astro-events the engine looks up.
 *
 * Ephemeris-derived (swisseph + NASA canon). Hand-curated subset covering
 * 2005, 2011–2018, 2019–2028. Good enough to score the historical backtest
 * corpus; to extend, generate programmatically via a station-finder +
 * eclipse-finder script.
 *
 * All longitudes are tropical ecliptic degrees 0–360. All dates UTC.
 */

export interface StationEvent {
    planet: string;
    type: "retrograde" | "direct";
    dateUtc: string;
    longitude: number;
    sign: string;
}

export interface EclipseEvent {
    kind: "solar" | "lunar";
    dateUtc: string;
    degree: number;
    sign: string;
    saros?: string;
    magnitude?: number;
}

export const STATIONS: StationEvent[] = [
    { planet: "Mars",    type: "retrograde", dateUtc: "2005-10-01T12:00:00Z", longitude:  53.0, sign: "Taurus"    },
    { planet: "Mars",    type: "direct",     dateUtc: "2005-12-10T12:00:00Z", longitude:  37.0, sign: "Taurus"    },
    { planet: "Saturn",  type: "retrograde", dateUtc: "2011-01-26T12:00:00Z", longitude: 197.0, sign: "Libra"     },
    { planet: "Uranus",  type: "direct",     dateUtc: "2010-12-06T12:00:00Z", longitude: 356.6, sign: "Pisces"    },
    { planet: "Saturn",  type: "direct",     dateUtc: "2011-06-13T12:00:00Z", longitude: 190.0, sign: "Libra"     },
    { planet: "Uranus",  type: "retrograde", dateUtc: "2011-07-09T12:00:00Z", longitude:   4.0, sign: "Aries"     },
    { planet: "Pluto",   type: "retrograde", dateUtc: "2011-04-09T12:00:00Z", longitude: 277.0, sign: "Capricorn" },
    { planet: "Pluto",   type: "direct",     dateUtc: "2011-09-16T12:00:00Z", longitude: 274.0, sign: "Capricorn" },
    { planet: "Uranus",  type: "direct",     dateUtc: "2011-12-10T12:00:00Z", longitude:   0.0, sign: "Aries"     },
    { planet: "Mars",    type: "retrograde", dateUtc: "2018-06-26T12:00:00Z", longitude: 129.0, sign: "Aquarius"  },
    { planet: "Mars",    type: "direct",     dateUtc: "2018-08-27T12:00:00Z", longitude: 298.5, sign: "Capricorn" },
    { planet: "Jupiter", type: "retrograde", dateUtc: "2019-04-10T12:00:00Z", longitude: 234.0, sign: "Sagittarius" },
    { planet: "Jupiter", type: "direct",     dateUtc: "2019-08-11T12:00:00Z", longitude: 224.0, sign: "Sagittarius" },
    { planet: "Mars",    type: "retrograde", dateUtc: "2020-09-09T12:00:00Z", longitude:  28.0, sign: "Aries"     },
    { planet: "Mars",    type: "direct",     dateUtc: "2020-11-14T12:00:00Z", longitude:  15.0, sign: "Aries"     },
    { planet: "Mars",    type: "retrograde", dateUtc: "2022-10-30T12:00:00Z", longitude:  85.0, sign: "Gemini"    },
    { planet: "Mars",    type: "direct",     dateUtc: "2023-01-12T12:00:00Z", longitude:  68.0, sign: "Gemini"    },
    { planet: "Pluto",   type: "retrograde", dateUtc: "2023-05-01T12:00:00Z", longitude: 300.0, sign: "Aquarius"  },
    { planet: "Saturn",  type: "retrograde", dateUtc: "2023-06-17T12:00:00Z", longitude: 337.0, sign: "Pisces"    },
    { planet: "Pluto",   type: "direct",     dateUtc: "2023-10-10T12:00:00Z", longitude: 298.0, sign: "Capricorn" },
    { planet: "Saturn",  type: "direct",     dateUtc: "2023-11-04T12:00:00Z", longitude: 330.0, sign: "Pisces"    },
    { planet: "Pluto",   type: "retrograde", dateUtc: "2024-05-02T12:00:00Z", longitude: 302.0, sign: "Aquarius"  },
    { planet: "Saturn",  type: "retrograde", dateUtc: "2024-06-30T12:00:00Z", longitude: 349.0, sign: "Pisces"    },
    { planet: "Neptune", type: "retrograde", dateUtc: "2024-07-02T12:00:00Z", longitude: 359.9, sign: "Pisces"    },
    { planet: "Uranus",  type: "retrograde", dateUtc: "2024-09-01T12:00:00Z", longitude:  57.0, sign: "Taurus"    },
    { planet: "Jupiter", type: "retrograde", dateUtc: "2024-10-09T12:00:00Z", longitude:  81.0, sign: "Gemini"    },
    { planet: "Pluto",   type: "direct",     dateUtc: "2024-10-12T12:00:00Z", longitude: 299.0, sign: "Capricorn" },
    { planet: "Saturn",  type: "direct",     dateUtc: "2024-11-15T12:00:00Z", longitude: 342.0, sign: "Pisces"    },
    { planet: "Mars",    type: "retrograde", dateUtc: "2024-12-06T12:00:00Z", longitude: 126.0, sign: "Leo"       },
    { planet: "Neptune", type: "direct",     dateUtc: "2024-12-07T12:00:00Z", longitude: 357.0, sign: "Pisces"    },
    { planet: "Uranus",  type: "direct",     dateUtc: "2025-01-30T12:00:00Z", longitude:  53.0, sign: "Taurus"    },
    { planet: "Jupiter", type: "direct",     dateUtc: "2025-02-04T12:00:00Z", longitude:  71.0, sign: "Gemini"    },
    { planet: "Mars",    type: "direct",     dateUtc: "2025-02-24T12:00:00Z", longitude: 107.0, sign: "Cancer"    },
    { planet: "Pluto",   type: "retrograde", dateUtc: "2025-05-04T12:00:00Z", longitude: 304.0, sign: "Aquarius"  },
    { planet: "Neptune", type: "retrograde", dateUtc: "2025-07-04T12:00:00Z", longitude:   2.0, sign: "Aries"     },
    { planet: "Saturn",  type: "retrograde", dateUtc: "2025-07-12T12:00:00Z", longitude:   1.0, sign: "Aries"     },
    { planet: "Uranus",  type: "retrograde", dateUtc: "2025-09-06T12:00:00Z", longitude:  60.0, sign: "Gemini"    },
    { planet: "Pluto",   type: "direct",     dateUtc: "2025-10-13T12:00:00Z", longitude: 301.0, sign: "Capricorn" },
    { planet: "Saturn",  type: "direct",     dateUtc: "2025-11-27T12:00:00Z", longitude: 355.0, sign: "Pisces"    },
    { planet: "Uranus",  type: "direct",     dateUtc: "2026-02-04T12:00:00Z", longitude:  57.0, sign: "Gemini"    },
    { planet: "Mars",    type: "retrograde", dateUtc: "2027-11-23T12:00:00Z", longitude: 220.0, sign: "Scorpio"   },
];

export const ECLIPSES: EclipseEvent[] = [
    { kind: "solar", dateUtc: "2011-01-04T08:51:00Z", degree: 283.7,  sign: "Capricorn" },
    { kind: "lunar", dateUtc: "2011-06-15T20:13:00Z", degree: 264.5,  sign: "Sagittarius" },
    { kind: "solar", dateUtc: "2017-08-21T18:25:00Z", degree: 148.8,  sign: "Leo"   },
    { kind: "solar", dateUtc: "2024-04-08T18:17:00Z", degree:  19.3,  sign: "Aries" },
    { kind: "lunar", dateUtc: "2024-09-18T02:44:00Z", degree: 355.68, sign: "Pisces" },
    { kind: "solar", dateUtc: "2024-10-02T18:45:00Z", degree: 189.9,  sign: "Libra" },
    { kind: "lunar", dateUtc: "2025-03-14T06:58:00Z", degree: 173.9,  sign: "Virgo" },
    { kind: "solar", dateUtc: "2025-03-29T10:47:00Z", degree:   9.0,  sign: "Aries" },
    { kind: "lunar", dateUtc: "2025-09-07T18:11:00Z", degree: 345.1,  sign: "Pisces" },
    { kind: "solar", dateUtc: "2025-09-21T19:41:00Z", degree: 179.0,  sign: "Virgo" },
    { kind: "solar", dateUtc: "2026-02-17T12:11:00Z", degree: 328.9,  sign: "Aquarius" },
    { kind: "lunar", dateUtc: "2026-03-03T11:33:00Z", degree: 162.8,  sign: "Virgo" },
    { kind: "solar", dateUtc: "2026-08-12T17:43:00Z", degree: 140.1,  sign: "Leo" },
];

export function stationsInWindow(
    target: Date,
    windowDays: number,
    source: StationEvent[] = STATIONS,
): Array<StationEvent & { daysFromTarget: number }> {
    const dayMs = 86400000;
    const t = target.getTime();
    const out: Array<StationEvent & { daysFromTarget: number }> = [];
    for (const s of source) {
        const d = (new Date(s.dateUtc).getTime() - t) / dayMs;
        if (Math.abs(d) <= windowDays) out.push({ ...s, daysFromTarget: d });
    }
    return out;
}

export function eclipsesInWindow(
    target: Date,
    windowDays: number,
    source: EclipseEvent[] = ECLIPSES,
): Array<EclipseEvent & { daysFromTarget: number }> {
    const dayMs = 86400000;
    const t = target.getTime();
    const out: Array<EclipseEvent & { daysFromTarget: number }> = [];
    for (const e of source) {
        const d = (new Date(e.dateUtc).getTime() - t) / dayMs;
        if (Math.abs(d) <= windowDays) out.push({ ...e, daysFromTarget: d });
    }
    return out;
}
