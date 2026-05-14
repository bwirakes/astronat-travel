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

export interface RetrogradeWindowEvent {
    planet: string;
    entry: StationEvent;
    exit: StationEvent;
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
    { planet: "Mercury", type: "retrograde", dateUtc: "2024-11-26T02:38:37Z", longitude: 262.7, sign: "Sagittarius" },
    { planet: "Mars",    type: "retrograde", dateUtc: "2024-12-06T12:00:00Z", longitude: 126.0, sign: "Leo"       },
    { planet: "Neptune", type: "direct",     dateUtc: "2024-12-07T12:00:00Z", longitude: 357.0, sign: "Pisces"    },
    { planet: "Mercury", type: "direct",     dateUtc: "2024-12-15T21:02:44Z", longitude: 246.4, sign: "Sagittarius" },
    { planet: "Uranus",  type: "direct",     dateUtc: "2025-01-30T12:00:00Z", longitude:  53.0, sign: "Taurus"    },
    { planet: "Jupiter", type: "direct",     dateUtc: "2025-02-04T12:00:00Z", longitude:  71.0, sign: "Gemini"    },
    { planet: "Mars",    type: "direct",     dateUtc: "2025-02-24T12:00:00Z", longitude: 107.0, sign: "Cancer"    },
    { planet: "Venus",   type: "retrograde", dateUtc: "2025-03-02T00:37:01Z", longitude:  10.8, sign: "Aries"     },
    { planet: "Mercury", type: "retrograde", dateUtc: "2025-03-15T06:51:18Z", longitude:   9.6, sign: "Aries"     },
    { planet: "Mercury", type: "direct",     dateUtc: "2025-04-07T11:13:00Z", longitude: 356.8, sign: "Pisces"    },
    { planet: "Venus",   type: "direct",     dateUtc: "2025-04-13T01:03:54Z", longitude: 354.6, sign: "Pisces"    },
    { planet: "Pluto",   type: "retrograde", dateUtc: "2025-05-04T12:00:00Z", longitude: 304.0, sign: "Aquarius"  },
    { planet: "Neptune", type: "retrograde", dateUtc: "2025-07-04T12:00:00Z", longitude:   2.0, sign: "Aries"     },
    { planet: "Saturn",  type: "retrograde", dateUtc: "2025-07-12T12:00:00Z", longitude:   1.0, sign: "Aries"     },
    { planet: "Mercury", type: "retrograde", dateUtc: "2025-07-18T04:45:27Z", longitude: 135.6, sign: "Leo"       },
    { planet: "Mercury", type: "direct",     dateUtc: "2025-08-11T07:26:09Z", longitude: 124.3, sign: "Leo"       },
    { planet: "Uranus",  type: "retrograde", dateUtc: "2025-09-06T12:00:00Z", longitude:  60.0, sign: "Gemini"    },
    { planet: "Pluto",   type: "direct",     dateUtc: "2025-10-13T12:00:00Z", longitude: 301.0, sign: "Capricorn" },
    { planet: "Mercury", type: "retrograde", dateUtc: "2025-11-09T18:53:57Z", longitude: 246.8, sign: "Sagittarius" },
    { planet: "Jupiter", type: "retrograde", dateUtc: "2025-11-11T16:42:09Z", longitude: 115.2, sign: "Cancer"    },
    { planet: "Saturn",  type: "direct",     dateUtc: "2025-11-27T12:00:00Z", longitude: 355.0, sign: "Pisces"    },
    { planet: "Mercury", type: "direct",     dateUtc: "2025-11-29T17:47:57Z", longitude: 230.7, sign: "Scorpio"   },
    { planet: "Neptune", type: "direct",     dateUtc: "2025-12-10T12:22:58Z", longitude: 359.4, sign: "Pisces"    },
    { planet: "Uranus",  type: "direct",     dateUtc: "2026-02-04T02:33:00Z", longitude:  57.5, sign: "Taurus"    },
    { planet: "Mercury", type: "retrograde", dateUtc: "2026-02-26T06:49:00Z", longitude: 352.6, sign: "Pisces"    },
    { planet: "Mercury", type: "direct",     dateUtc: "2026-03-20T19:33:00Z", longitude: 338.5, sign: "Pisces"    },
    { planet: "Jupiter", type: "direct",     dateUtc: "2026-03-11T03:30:00Z", longitude: 105.1, sign: "Cancer"    },
    { planet: "Pluto",   type: "retrograde", dateUtc: "2026-05-06T15:37:00Z", longitude: 305.5, sign: "Aquarius"  },
    { planet: "Mercury", type: "retrograde", dateUtc: "2026-06-29T17:37:00Z", longitude: 116.3, sign: "Cancer"    },
    { planet: "Neptune", type: "retrograde", dateUtc: "2026-07-07T10:57:00Z", longitude:   4.4, sign: "Aries"     },
    { planet: "Mercury", type: "direct",     dateUtc: "2026-07-23T22:59:00Z", longitude: 106.3, sign: "Cancer"    },
    { planet: "Saturn",  type: "retrograde", dateUtc: "2026-07-26T19:58:00Z", longitude:  14.8, sign: "Aries"     },
    { planet: "Uranus",  type: "retrograde", dateUtc: "2026-09-10T18:29:00Z", longitude:  65.7, sign: "Gemini"    },
    { planet: "Venus",   type: "retrograde", dateUtc: "2026-10-03T07:17:00Z", longitude: 218.5, sign: "Scorpio"   },
    { planet: "Pluto",   type: "direct",     dateUtc: "2026-10-16T02:39:00Z", longitude: 303.1, sign: "Aquarius"  },
    { planet: "Mercury", type: "retrograde", dateUtc: "2026-10-24T07:13:00Z", longitude: 231.0, sign: "Scorpio"   },
    { planet: "Mercury", type: "direct",     dateUtc: "2026-11-13T15:55:00Z", longitude: 215.0, sign: "Scorpio"   },
    { planet: "Venus",   type: "direct",     dateUtc: "2026-11-14T00:28:00Z", longitude: 202.9, sign: "Libra"     },
    { planet: "Saturn",  type: "direct",     dateUtc: "2026-12-10T23:31:00Z", longitude:   7.9, sign: "Aries"     },
    { planet: "Neptune", type: "direct",     dateUtc: "2026-12-12T22:17:00Z", longitude:   1.6, sign: "Aries"     },
    { planet: "Jupiter", type: "retrograde", dateUtc: "2026-12-13T00:58:00Z", longitude: 147.0, sign: "Leo"       },
    { planet: "Mars",    type: "retrograde", dateUtc: "2027-01-10T12:58:46Z", longitude: 160.4, sign: "Virgo"     },
    { planet: "Uranus",  type: "direct",     dateUtc: "2027-02-08T12:29:19Z", longitude:  61.7, sign: "Gemini"    },
    { planet: "Mercury", type: "retrograde", dateUtc: "2027-02-09T17:35:40Z", longitude: 336.0, sign: "Pisces"    },
    { planet: "Mercury", type: "direct",     dateUtc: "2027-03-03T12:41:49Z", longitude: 320.9, sign: "Aquarius"  },
    { planet: "Mars",    type: "direct",     dateUtc: "2027-04-01T14:11:11Z", longitude: 140.9, sign: "Leo"       },
    { planet: "Jupiter", type: "direct",     dateUtc: "2027-04-13T02:12:47Z", longitude: 137.0, sign: "Leo"       },
    { planet: "Pluto",   type: "retrograde", dateUtc: "2027-05-08T12:52:13Z", longitude: 307.2, sign: "Aquarius"  },
    { planet: "Mercury", type: "retrograde", dateUtc: "2027-06-10T18:18:23Z", longitude:  96.4, sign: "Cancer"    },
    { planet: "Mercury", type: "direct",     dateUtc: "2027-07-04T19:37:19Z", longitude:  87.5, sign: "Gemini"    },
    { planet: "Neptune", type: "retrograde", dateUtc: "2027-07-09T22:42:57Z", longitude:   6.7, sign: "Aries"     },
    { planet: "Saturn",  type: "retrograde", dateUtc: "2027-08-09T18:06:53Z", longitude:  27.9, sign: "Aries"     },
    { planet: "Uranus",  type: "retrograde", dateUtc: "2027-09-15T09:11:46Z", longitude:  70.0, sign: "Gemini"    },
    { planet: "Mercury", type: "retrograde", dateUtc: "2027-10-07T14:27:39Z", longitude: 214.9, sign: "Scorpio"   },
    { planet: "Pluto",   type: "direct",     dateUtc: "2027-10-18T03:54:33Z", longitude: 304.7, sign: "Aquarius"  },
    { planet: "Mercury", type: "direct",     dateUtc: "2027-10-28T14:17:04Z", longitude: 199.3, sign: "Libra"     },
    { planet: "Neptune", type: "direct",     dateUtc: "2027-12-15T09:09:54Z", longitude:   3.9, sign: "Aries"     },
    { planet: "Saturn",  type: "direct",     dateUtc: "2027-12-24T02:48:27Z", longitude:  21.0, sign: "Aries"     },
    { planet: "Jupiter", type: "retrograde", dateUtc: "2028-01-12T08:54:03Z", longitude: 177.5, sign: "Virgo"     },
    { planet: "Mercury", type: "retrograde", dateUtc: "2028-01-24T10:58:40Z", longitude: 319.7, sign: "Aquarius"  },
    { planet: "Uranus",  type: "direct",     dateUtc: "2028-02-12T23:50:09Z", longitude:  65.9, sign: "Gemini"    },
    { planet: "Mercury", type: "direct",     dateUtc: "2028-02-14T12:49:23Z", longitude: 304.0, sign: "Aquarius"  },
    { planet: "Pluto",   type: "retrograde", dateUtc: "2028-05-09T09:28:50Z", longitude: 308.8, sign: "Aquarius"  },
    { planet: "Venus",   type: "retrograde", dateUtc: "2028-05-10T23:03:31Z", longitude:  79.7, sign: "Gemini"    },
    { planet: "Jupiter", type: "direct",     dateUtc: "2028-05-13T20:01:35Z", longitude: 167.5, sign: "Virgo"     },
    { planet: "Mercury", type: "retrograde", dateUtc: "2028-05-21T08:48:47Z", longitude:  76.3, sign: "Gemini"    },
    { planet: "Mercury", type: "direct",     dateUtc: "2028-06-14T06:04:32Z", longitude:  67.8, sign: "Gemini"    },
    { planet: "Venus",   type: "direct",     dateUtc: "2028-06-22T22:14:37Z", longitude:  63.2, sign: "Gemini"    },
    { planet: "Neptune", type: "retrograde", dateUtc: "2028-07-11T13:07:07Z", longitude:   8.9, sign: "Aries"     },
    { planet: "Saturn",  type: "retrograde", dateUtc: "2028-08-22T22:18:38Z", longitude:  41.3, sign: "Taurus"    },
    { planet: "Uranus",  type: "retrograde", dateUtc: "2028-09-19T00:03:21Z", longitude:  74.2, sign: "Gemini"    },
    { planet: "Mercury", type: "retrograde", dateUtc: "2028-09-19T16:26:54Z", longitude: 198.6, sign: "Libra"     },
    { planet: "Mercury", type: "direct",     dateUtc: "2028-10-11T10:30:57Z", longitude: 183.5, sign: "Libra"     },
    { planet: "Pluto",   type: "direct",     dateUtc: "2028-10-19T03:48:45Z", longitude: 306.4, sign: "Aquarius"  },
    { planet: "Neptune", type: "direct",     dateUtc: "2028-12-16T20:45:40Z", longitude:   6.1, sign: "Aries"     },
    { planet: "Saturn",  type: "direct",     dateUtc: "2029-01-05T12:38:40Z", longitude:  34.4, sign: "Taurus"    },
    { planet: "Mercury", type: "retrograde", dateUtc: "2029-01-07T07:50:40Z", longitude: 303.6, sign: "Aquarius"  },
    { planet: "Mercury", type: "direct",     dateUtc: "2029-01-27T18:49:20Z", longitude: 287.6, sign: "Capricorn" },
    { planet: "Uranus",  type: "direct",     dateUtc: "2029-02-16T10:51:46Z", longitude:  70.2, sign: "Gemini"    },
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
    { kind: "lunar", dateUtc: "2026-08-28T04:18:00Z", degree: 334.9,  sign: "Pisces" },
];

/** Hand-curated 2025-2027 lunation table (NASA + Swiss Ephemeris derived).
 *  Degrees are tropical ecliptic, positions are at lunation exactness UTC.
 *
 *  Invariant: contains ONLY ordinary new/full moons. Eclipse-grade lunations
 *  live in `ECLIPSES` and are scored by `scorePersonalEclipses`. Both scorers
 *  route to the same per-house bucket, so a duplicate entry here would
 *  double-count against `bucketTransit` on that date. The
 *  `lunations-no-eclipse-overlap` test guards against drift. */
export const LUNATIONS: LunationEvent[] = [
    { kind: "new-moon",  dateUtc: "2025-01-29T12:36:00Z", degree: 309.8, sign: "Aquarius" },
    { kind: "full-moon", dateUtc: "2025-02-12T13:53:00Z", degree: 144.1, sign: "Leo" },
    { kind: "new-moon",  dateUtc: "2025-02-28T00:45:00Z", degree: 339.7, sign: "Pisces" },
    { kind: "full-moon", dateUtc: "2025-04-13T00:22:00Z", degree: 203.3, sign: "Libra" },
    { kind: "new-moon",  dateUtc: "2025-04-27T19:31:00Z", degree:  37.8, sign: "Taurus" },
    { kind: "full-moon", dateUtc: "2025-05-12T16:56:00Z", degree: 232.2, sign: "Scorpio" },
    { kind: "new-moon",  dateUtc: "2025-05-27T03:02:00Z", degree:  66.1, sign: "Gemini" },
    { kind: "full-moon", dateUtc: "2025-06-11T07:43:00Z", degree: 260.6, sign: "Sagittarius" },
    { kind: "new-moon",  dateUtc: "2025-06-25T10:31:00Z", degree:  94.1, sign: "Cancer" },
    { kind: "full-moon", dateUtc: "2025-07-10T20:36:00Z", degree: 288.8, sign: "Capricorn" },
    { kind: "new-moon",  dateUtc: "2025-07-24T19:11:00Z", degree: 122.1, sign: "Leo" },
    { kind: "full-moon", dateUtc: "2025-08-09T07:55:00Z", degree: 317.0, sign: "Aquarius" },
    { kind: "new-moon",  dateUtc: "2025-08-23T06:06:00Z", degree: 150.5, sign: "Virgo" },
    { kind: "full-moon", dateUtc: "2025-10-07T03:48:00Z", degree:  14.1, sign: "Aries" },
    { kind: "new-moon",  dateUtc: "2025-10-21T12:25:00Z", degree: 208.4, sign: "Libra" },
    { kind: "full-moon", dateUtc: "2025-11-05T13:19:00Z", degree:  43.4, sign: "Taurus" },
    { kind: "new-moon",  dateUtc: "2025-11-20T06:47:00Z", degree: 238.2, sign: "Scorpio" },
    { kind: "full-moon", dateUtc: "2025-12-04T23:14:00Z", degree:  73.0, sign: "Gemini" },
    { kind: "new-moon",  dateUtc: "2025-12-20T01:43:00Z", degree: 268.4, sign: "Sagittarius" },
    { kind: "full-moon", dateUtc: "2026-01-03T10:03:00Z", degree: 103.0, sign: "Cancer" },
    { kind: "new-moon",  dateUtc: "2026-01-18T19:51:00Z", degree: 298.7, sign: "Capricorn" },
    { kind: "full-moon", dateUtc: "2026-02-01T22:09:00Z", degree: 133.0, sign: "Leo" },
    { kind: "new-moon",  dateUtc: "2026-03-19T01:24:00Z", degree: 358.4, sign: "Pisces" },
    { kind: "full-moon", dateUtc: "2026-04-02T02:51:00Z", degree: 192.7, sign: "Libra" },
    { kind: "new-moon",  dateUtc: "2026-04-17T11:51:00Z", degree:  27.5, sign: "Aries" },
    { kind: "full-moon", dateUtc: "2026-05-01T17:23:00Z", degree: 221.3, sign: "Scorpio" },
    { kind: "new-moon",  dateUtc: "2026-05-16T20:01:00Z", degree:  55.9, sign: "Taurus" },
    { kind: "full-moon", dateUtc: "2026-05-31T08:45:00Z", degree: 249.9, sign: "Sagittarius" },
    { kind: "new-moon",  dateUtc: "2026-06-15T02:54:00Z", degree:  84.0, sign: "Gemini" },
    { kind: "full-moon", dateUtc: "2026-06-29T23:57:00Z", degree: 278.2, sign: "Capricorn" },
    { kind: "new-moon",  dateUtc: "2026-07-14T09:43:00Z", degree: 112.0, sign: "Cancer" },
    { kind: "full-moon", dateUtc: "2026-07-29T14:35:00Z", degree: 306.5, sign: "Aquarius" },
    { kind: "new-moon",  dateUtc: "2026-09-11T03:27:00Z", degree: 168.4, sign: "Virgo" },
    { kind: "full-moon", dateUtc: "2026-09-26T16:49:00Z", degree:   3.6, sign: "Aries" },
    { kind: "new-moon",  dateUtc: "2026-10-10T15:50:00Z", degree: 197.3, sign: "Libra" },
    { kind: "full-moon", dateUtc: "2026-10-26T04:11:00Z", degree:  32.7, sign: "Taurus" },
    { kind: "new-moon",  dateUtc: "2026-11-09T07:01:00Z", degree: 226.9, sign: "Scorpio" },
    { kind: "full-moon", dateUtc: "2026-11-24T14:53:00Z", degree:  62.3, sign: "Gemini" },
    { kind: "new-moon",  dateUtc: "2026-12-09T00:51:00Z", degree: 256.9, sign: "Sagittarius" },
    { kind: "full-moon", dateUtc: "2026-12-24T01:28:00Z", degree:  92.2, sign: "Cancer" },
    { kind: "new-moon",  dateUtc: "2027-01-07T20:24:00Z", degree: 287.3, sign: "Capricorn" },
    { kind: "full-moon", dateUtc: "2027-01-22T12:17:00Z", degree: 122.2, sign: "Leo" },
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

export function stationsInDateRange(
    startDate: Date,
    endDate: Date,
    source: StationEvent[] = STATIONS,
): StationEvent[] {
    const start = startDate.getTime();
    const end = endDate.getTime();
    return source
        .filter((s) => {
            const t = new Date(s.dateUtc).getTime();
            return t >= start && t <= end;
        })
        .sort((a, b) => new Date(a.dateUtc).getTime() - new Date(b.dateUtc).getTime());
}

export function retrogradeWindowsInRange(
    startDate: Date,
    endDate: Date,
    source: StationEvent[] = STATIONS,
): RetrogradeWindowEvent[] {
    const start = startDate.getTime();
    const end = endDate.getTime();
    const byPlanet = new Map<string, StationEvent[]>();

    for (const station of source) {
        const stations = byPlanet.get(station.planet) ?? [];
        stations.push(station);
        byPlanet.set(station.planet, stations);
    }

    const windows: RetrogradeWindowEvent[] = [];
    for (const [planet, stations] of byPlanet) {
        stations.sort((a, b) => new Date(a.dateUtc).getTime() - new Date(b.dateUtc).getTime());
        for (let i = 0; i < stations.length; i++) {
            const entry = stations[i];
            if (entry.type !== "retrograde") continue;

            const exit = stations.slice(i + 1).find((candidate) => candidate.type === "direct");
            if (!exit) continue;

            const entryTime = new Date(entry.dateUtc).getTime();
            const exitTime = new Date(exit.dateUtc).getTime();
            if (exitTime < start || entryTime > end) continue;

            windows.push({ planet, entry, exit });
        }
    }

    return windows.sort(
        (a, b) => new Date(a.entry.dateUtc).getTime() - new Date(b.entry.dateUtc).getTime(),
    );
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
