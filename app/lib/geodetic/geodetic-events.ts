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

/** Ordinary new/full moons (eclipses are tracked separately). 2025-2027
 *  window — generated from swisseph at module-cache time and pruned to
 *  events the engine looks up. Extending the window: regenerate via
 *  `lib/astro/geodetic-pattern-compute.ts:detectLunations`. */
export interface LunationEvent {
    kind: "new-moon" | "full-moon";
    dateUtc: string;
    degree: number;     // ecliptic longitude where the lunation occurred
    sign: string;
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

/** Hand-curated 2025-2027 lunation table (NASA + Swiss Ephemeris derived).
 *  Degrees are tropical ecliptic, positions are at lunation exactness UTC. */
export const LUNATIONS: LunationEvent[] = [
    { kind: "new-moon",  dateUtc: "2025-01-29T12:36:00Z", degree: 309.7, sign: "Aquarius" },
    { kind: "full-moon", dateUtc: "2025-02-12T13:53:00Z", degree: 324.0, sign: "Leo" },
    { kind: "new-moon",  dateUtc: "2025-02-28T00:45:00Z", degree: 339.5, sign: "Pisces" },
    { kind: "full-moon", dateUtc: "2025-03-14T06:55:00Z", degree: 353.9, sign: "Virgo" },
    { kind: "new-moon",  dateUtc: "2025-03-29T10:58:00Z", degree:   9.0, sign: "Aries" },
    { kind: "full-moon", dateUtc: "2025-04-13T00:22:00Z", degree:  23.3, sign: "Libra" },
    { kind: "new-moon",  dateUtc: "2025-04-27T19:31:00Z", degree:  37.8, sign: "Taurus" },
    { kind: "full-moon", dateUtc: "2025-05-12T16:56:00Z", degree:  52.0, sign: "Scorpio" },
    { kind: "new-moon",  dateUtc: "2025-05-27T03:02:00Z", degree:  66.2, sign: "Gemini" },
    { kind: "full-moon", dateUtc: "2025-06-11T07:43:00Z", degree:  80.4, sign: "Sagittarius" },
    { kind: "new-moon",  dateUtc: "2025-06-25T10:31:00Z", degree:  94.4, sign: "Cancer" },
    { kind: "full-moon", dateUtc: "2025-07-10T20:36:00Z", degree: 108.6, sign: "Capricorn" },
    { kind: "new-moon",  dateUtc: "2025-07-24T19:11:00Z", degree: 122.5, sign: "Leo" },
    { kind: "full-moon", dateUtc: "2025-08-09T07:55:00Z", degree: 136.9, sign: "Aquarius" },
    { kind: "new-moon",  dateUtc: "2025-08-23T06:06:00Z", degree: 150.5, sign: "Virgo" },
    { kind: "full-moon", dateUtc: "2025-09-07T18:09:00Z", degree: 165.4, sign: "Pisces" }, // eclipse — present in ECLIPSES too
    { kind: "new-moon",  dateUtc: "2025-09-21T19:54:00Z", degree: 179.0, sign: "Virgo" }, // eclipse — present in ECLIPSES too
    { kind: "full-moon", dateUtc: "2025-10-07T03:48:00Z", degree: 194.2, sign: "Aries" },
    { kind: "new-moon",  dateUtc: "2025-10-21T12:25:00Z", degree: 207.9, sign: "Libra" },
    { kind: "full-moon", dateUtc: "2025-11-05T13:19:00Z", degree: 223.3, sign: "Taurus" },
    { kind: "new-moon",  dateUtc: "2025-11-20T06:47:00Z", degree: 237.6, sign: "Scorpio" },
    { kind: "full-moon", dateUtc: "2025-12-04T23:14:00Z", degree: 252.7, sign: "Gemini" },
    { kind: "new-moon",  dateUtc: "2025-12-20T01:43:00Z", degree: 268.0, sign: "Sagittarius" },
    { kind: "full-moon", dateUtc: "2026-01-03T10:03:00Z", degree: 282.6, sign: "Cancer" },
    { kind: "new-moon",  dateUtc: "2026-01-18T19:51:00Z", degree: 298.5, sign: "Capricorn" },
    { kind: "full-moon", dateUtc: "2026-02-01T22:09:00Z", degree: 313.0, sign: "Leo" },
    { kind: "new-moon",  dateUtc: "2026-02-17T12:11:00Z", degree: 328.9, sign: "Aquarius" }, // eclipse — also in ECLIPSES
    { kind: "full-moon", dateUtc: "2026-03-03T11:33:00Z", degree: 342.8, sign: "Virgo" }, // eclipse — also in ECLIPSES
    { kind: "new-moon",  dateUtc: "2026-03-19T01:24:00Z", degree: 358.5, sign: "Pisces" },
    { kind: "full-moon", dateUtc: "2026-04-02T02:51:00Z", degree:  12.4, sign: "Libra" },
    { kind: "new-moon",  dateUtc: "2026-04-17T11:51:00Z", degree:  27.4, sign: "Aries" },
    { kind: "full-moon", dateUtc: "2026-05-01T17:23:00Z", degree:  41.3, sign: "Scorpio" },
    { kind: "new-moon",  dateUtc: "2026-05-16T20:01:00Z", degree:  55.9, sign: "Taurus" },
    { kind: "full-moon", dateUtc: "2026-05-31T08:45:00Z", degree:  70.1, sign: "Sagittarius" },
    { kind: "new-moon",  dateUtc: "2026-06-15T02:54:00Z", degree:  83.9, sign: "Gemini" },
    { kind: "full-moon", dateUtc: "2026-06-29T23:57:00Z", degree:  98.0, sign: "Capricorn" },
    { kind: "new-moon",  dateUtc: "2026-07-14T09:43:00Z", degree: 111.5, sign: "Cancer" },
    { kind: "full-moon", dateUtc: "2026-07-29T14:35:00Z", degree: 126.5, sign: "Aquarius" },
    { kind: "new-moon",  dateUtc: "2026-08-12T17:36:00Z", degree: 140.1, sign: "Leo" }, // eclipse — also in ECLIPSES
    { kind: "full-moon", dateUtc: "2026-08-28T04:18:00Z", degree: 155.0, sign: "Pisces" },
    { kind: "new-moon",  dateUtc: "2026-09-11T03:27:00Z", degree: 168.2, sign: "Virgo" },
    { kind: "full-moon", dateUtc: "2026-09-26T16:49:00Z", degree: 183.5, sign: "Aries" },
    { kind: "new-moon",  dateUtc: "2026-10-10T15:50:00Z", degree: 197.4, sign: "Libra" },
    { kind: "full-moon", dateUtc: "2026-10-26T04:11:00Z", degree: 213.0, sign: "Taurus" },
    { kind: "new-moon",  dateUtc: "2026-11-09T07:01:00Z", degree: 226.8, sign: "Scorpio" },
    { kind: "full-moon", dateUtc: "2026-11-24T14:53:00Z", degree: 242.7, sign: "Gemini" },
    { kind: "new-moon",  dateUtc: "2026-12-09T00:51:00Z", degree: 257.0, sign: "Sagittarius" },
    { kind: "full-moon", dateUtc: "2026-12-24T01:28:00Z", degree: 272.5, sign: "Cancer" },
    { kind: "new-moon",  dateUtc: "2027-01-07T20:24:00Z", degree: 287.0, sign: "Capricorn" },
    { kind: "full-moon", dateUtc: "2027-01-22T12:17:00Z", degree: 302.7, sign: "Leo" },
];

export function lunationsInWindow(
    target: Date,
    windowDays: number,
    source: LunationEvent[] = LUNATIONS,
): Array<LunationEvent & { daysFromTarget: number }> {
    const dayMs = 86400000;
    const t = target.getTime();
    const out: Array<LunationEvent & { daysFromTarget: number }> = [];
    for (const l of source) {
        const d = (new Date(l.dateUtc).getTime() - t) / dayMs;
        if (Math.abs(d) <= windowDays) out.push({ ...l, daysFromTarget: d });
    }
    return out;
}

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
