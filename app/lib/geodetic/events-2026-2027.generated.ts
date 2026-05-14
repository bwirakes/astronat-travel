/**
 * AUTO-GENERATED — do not hand-edit.
 *
 * Source: scripts/generate-2026-2027-events.ts
 * Window: 2026-01-01T00:00:00Z → 2028-01-01T00:00:00Z
 * Generated: 2026-05-14T12:16:59.920Z
 *
 * To regenerate:
 *   bun run scripts/generate-2026-2027-events.ts
 *
 * The Vitest/bun:test eval __tests__/canonical-events-2026-2027.test.ts re-runs
 * Swiss Ephemeris and diffs against this file. If it drifts, regenerate.
 */

export interface RetrogradeShadowWindowRow {
    body: string;
    preShadowStart:    { utc: string; jd: number; longitude: number; sign: string };
    retrogradeStation: { utc: string; jd: number; longitude: number; sign: string };
    directStation:     { utc: string; jd: number; longitude: number; sign: string };
    postShadowEnd:     { utc: string; jd: number; longitude: number; sign: string };
    durationDays: number;
}

export interface SignIngressRow {
    utc: string;
    jd: number;
    body: string;
    fromSign: string;
    toSign: string;
    longitude: number;
    retrograde: boolean;
}

export interface EclipseRow {
    utc: string;
    jd: number;
    kind: "solar" | "lunar";
    eclipseType: string;
    longitude: number;
    sign: string;
}

export interface StelliumRow {
    startUtc: string;
    endUtc: string;
    durationDays: number;
    members: string[];
    centerLongitudeStart: number;
    centerSignStart: string;
}

export const EVENTS_WINDOW = {
    startUtc: "2026-01-01T00:00:00Z",
    endUtc:   "2028-01-01T00:00:00Z",
} as const;

export const RETROGRADE_SHADOW_WINDOWS: RetrogradeShadowWindowRow[] = [
    {
        "body": "Pluto",
        "preShadowStart": {
            "utc": "2025-01-10T15:42:36Z",
            "jd": 2460686.154588,
            "longitude": 301.366931,
            "sign": "Aquarius"
        },
        "retrogradeStation": {
            "utc": "2025-05-04T15:28:04Z",
            "jd": 2460800.144488,
            "longitude": 303.818613,
            "sign": "Aquarius"
        },
        "directStation": {
            "utc": "2025-10-14T02:53:24Z",
            "jd": 2460962.620419,
            "longitude": 301.366931,
            "sign": "Aquarius"
        },
        "postShadowEnd": {
            "utc": "2026-02-04T20:28:06Z",
            "jd": 2461076.352847,
            "longitude": 303.818613,
            "sign": "Aquarius"
        },
        "durationDays": 390.2
    },
    {
        "body": "Pallas",
        "preShadowStart": {
            "utc": "2025-03-08T03:11:18Z",
            "jd": 2460742.632848,
            "longitude": 306.662048,
            "sign": "Aquarius"
        },
        "retrogradeStation": {
            "utc": "2025-06-09T09:44:32Z",
            "jd": 2460835.90593,
            "longitude": 325.231104,
            "sign": "Aquarius"
        },
        "directStation": {
            "utc": "2025-10-04T07:20:09Z",
            "jd": 2460952.805659,
            "longitude": 306.662048,
            "sign": "Aquarius"
        },
        "postShadowEnd": {
            "utc": "2026-01-09T19:41:30Z",
            "jd": 2461050.320484,
            "longitude": 325.231104,
            "sign": "Aquarius"
        },
        "durationDays": 307.69
    },
    {
        "body": "Neptune",
        "preShadowStart": {
            "utc": "2025-03-13T21:50:53Z",
            "jd": 2460748.41034,
            "longitude": 359.372557,
            "sign": "Pisces"
        },
        "retrogradeStation": {
            "utc": "2025-07-04T21:34:01Z",
            "jd": 2460861.398619,
            "longitude": 2.175443,
            "sign": "Aries"
        },
        "directStation": {
            "utc": "2025-12-10T12:24:23Z",
            "jd": 2461020.016936,
            "longitude": 359.372557,
            "sign": "Pisces"
        },
        "postShadowEnd": {
            "utc": "2026-03-31T05:44:07Z",
            "jd": 2461130.738969,
            "longitude": 2.175443,
            "sign": "Aries"
        },
        "durationDays": 382.33
    },
    {
        "body": "Saturn",
        "preShadowStart": {
            "utc": "2025-04-06T14:50:10Z",
            "jd": 2460772.118173,
            "longitude": 355.157583,
            "sign": "Pisces"
        },
        "retrogradeStation": {
            "utc": "2025-07-13T04:08:11Z",
            "jd": 2460869.672346,
            "longitude": 1.93444,
            "sign": "Aries"
        },
        "directStation": {
            "utc": "2025-11-28T03:52:39Z",
            "jd": 2461007.661562,
            "longitude": 355.157583,
            "sign": "Pisces"
        },
        "postShadowEnd": {
            "utc": "2026-03-02T18:14:25Z",
            "jd": 2461102.260016,
            "longitude": 1.93444,
            "sign": "Aries"
        },
        "durationDays": 330.14
    },
    {
        "body": "Chiron",
        "preShadowStart": {
            "utc": "2025-04-06T01:36:41Z",
            "jd": 2460771.567142,
            "longitude": 22.598944,
            "sign": "Aries"
        },
        "retrogradeStation": {
            "utc": "2025-07-30T14:43:07Z",
            "jd": 2460887.113275,
            "longitude": 27.162773,
            "sign": "Aries"
        },
        "directStation": {
            "utc": "2026-01-02T14:38:45Z",
            "jd": 2461043.11024,
            "longitude": 22.598944,
            "sign": "Aries"
        },
        "postShadowEnd": {
            "utc": "2026-04-25T08:19:37Z",
            "jd": 2461155.846957,
            "longitude": 27.162773,
            "sign": "Aries"
        },
        "durationDays": 384.28
    },
    {
        "body": "Ceres",
        "preShadowStart": {
            "utc": "2025-05-24T18:35:51Z",
            "jd": 2460820.274898,
            "longitude": 2.510101,
            "sign": "Aries"
        },
        "retrogradeStation": {
            "utc": "2025-08-11T21:39:16Z",
            "jd": 2460899.402266,
            "longitude": 16.79744,
            "sign": "Aries"
        },
        "directStation": {
            "utc": "2025-11-22T00:00:29Z",
            "jd": 2461001.500336,
            "longitude": 2.510101,
            "sign": "Aries"
        },
        "postShadowEnd": {
            "utc": "2026-02-05T19:34:38Z",
            "jd": 2461077.315716,
            "longitude": 16.79744,
            "sign": "Aries"
        },
        "durationDays": 257.04
    },
    {
        "body": "Uranus",
        "preShadowStart": {
            "utc": "2025-05-20T18:33:36Z",
            "jd": 2460816.273332,
            "longitude": 57.459792,
            "sign": "Taurus"
        },
        "retrogradeStation": {
            "utc": "2025-09-06T04:52:14Z",
            "jd": 2460924.702942,
            "longitude": 61.463734,
            "sign": "Gemini"
        },
        "directStation": {
            "utc": "2026-02-04T02:34:32Z",
            "jd": 2461075.607314,
            "longitude": 57.459792,
            "sign": "Taurus"
        },
        "postShadowEnd": {
            "utc": "2026-05-21T16:43:37Z",
            "jd": 2461182.196962,
            "longitude": 61.463734,
            "sign": "Gemini"
        },
        "durationDays": 365.92
    },
    {
        "body": "Jupiter",
        "preShadowStart": {
            "utc": "2025-08-17T07:35:35Z",
            "jd": 2460904.816375,
            "longitude": 105.087374,
            "sign": "Cancer"
        },
        "retrogradeStation": {
            "utc": "2025-11-11T16:42:51Z",
            "jd": 2460991.196423,
            "longitude": 115.152602,
            "sign": "Cancer"
        },
        "directStation": {
            "utc": "2026-03-11T03:31:17Z",
            "jd": 2461110.646728,
            "longitude": 105.087374,
            "sign": "Cancer"
        },
        "postShadowEnd": {
            "utc": "2026-06-06T15:40:52Z",
            "jd": 2461198.153382,
            "longitude": 115.152602,
            "sign": "Cancer"
        },
        "durationDays": 293.34
    },
    {
        "body": "Mercury",
        "preShadowStart": {
            "utc": "2026-02-11T22:13:23Z",
            "jd": 2461083.425958,
            "longitude": 338.490742,
            "sign": "Pisces"
        },
        "retrogradeStation": {
            "utc": "2026-02-26T06:49:23Z",
            "jd": 2461097.784288,
            "longitude": 352.565309,
            "sign": "Pisces"
        },
        "directStation": {
            "utc": "2026-03-20T19:34:03Z",
            "jd": 2461120.315315,
            "longitude": 338.490742,
            "sign": "Pisces"
        },
        "postShadowEnd": {
            "utc": "2026-04-09T11:43:30Z",
            "jd": 2461139.988538,
            "longitude": 352.565309,
            "sign": "Pisces"
        },
        "durationDays": 56.56
    },
    {
        "body": "Pluto",
        "preShadowStart": {
            "utc": "2026-01-12T07:42:05Z",
            "jd": 2461052.820896,
            "longitude": 303.068488,
            "sign": "Aquarius"
        },
        "retrogradeStation": {
            "utc": "2026-05-06T15:35:26Z",
            "jd": 2461167.149612,
            "longitude": 305.509414,
            "sign": "Aquarius"
        },
        "directStation": {
            "utc": "2026-10-16T02:41:23Z",
            "jd": 2461329.612076,
            "longitude": 303.068488,
            "sign": "Aquarius"
        },
        "postShadowEnd": {
            "utc": "2027-02-07T01:16:52Z",
            "jd": 2461443.553375,
            "longitude": 305.509414,
            "sign": "Aquarius"
        },
        "durationDays": 390.73
    },
    {
        "body": "Juno",
        "preShadowStart": {
            "utc": "2026-03-14T11:25:56Z",
            "jd": 2461113.976341,
            "longitude": 295.669247,
            "sign": "Capricorn"
        },
        "retrogradeStation": {
            "utc": "2026-06-05T21:56:05Z",
            "jd": 2461197.413945,
            "longitude": 311.001332,
            "sign": "Aquarius"
        },
        "directStation": {
            "utc": "2026-09-17T01:10:32Z",
            "jd": 2461300.54898,
            "longitude": 295.669247,
            "sign": "Capricorn"
        },
        "postShadowEnd": {
            "utc": "2026-11-30T05:40:31Z",
            "jd": 2461374.736469,
            "longitude": 311.001332,
            "sign": "Aquarius"
        },
        "durationDays": 260.76
    },
    {
        "body": "Mercury",
        "preShadowStart": {
            "utc": "2026-06-13T00:54:13Z",
            "jd": 2461204.537653,
            "longitude": 106.316535,
            "sign": "Cancer"
        },
        "retrogradeStation": {
            "utc": "2026-06-29T17:37:08Z",
            "jd": 2461221.234123,
            "longitude": 116.257353,
            "sign": "Cancer"
        },
        "directStation": {
            "utc": "2026-07-23T22:59:04Z",
            "jd": 2461245.457687,
            "longitude": 106.316535,
            "sign": "Cancer"
        },
        "postShadowEnd": {
            "utc": "2026-08-07T03:38:10Z",
            "jd": 2461259.651503,
            "longitude": 116.257353,
            "sign": "Cancer"
        },
        "durationDays": 55.11
    },
    {
        "body": "Neptune",
        "preShadowStart": {
            "utc": "2026-03-16T08:55:21Z",
            "jd": 2461115.871776,
            "longitude": 1.612811,
            "sign": "Aries"
        },
        "retrogradeStation": {
            "utc": "2026-07-07T10:55:48Z",
            "jd": 2461228.955411,
            "longitude": 4.417966,
            "sign": "Aries"
        },
        "directStation": {
            "utc": "2026-12-12T22:18:31Z",
            "jd": 2461387.429523,
            "longitude": 1.612811,
            "sign": "Aries"
        },
        "postShadowEnd": {
            "utc": "2027-04-02T19:01:03Z",
            "jd": 2461498.2924,
            "longitude": 4.417966,
            "sign": "Aries"
        },
        "durationDays": 382.42
    },
    {
        "body": "Saturn",
        "preShadowStart": {
            "utc": "2026-04-20T12:18:12Z",
            "jd": 2461151.012634,
            "longitude": 7.931023,
            "sign": "Aries"
        },
        "retrogradeStation": {
            "utc": "2026-07-26T19:57:56Z",
            "jd": 2461248.331902,
            "longitude": 14.749954,
            "sign": "Aries"
        },
        "directStation": {
            "utc": "2026-12-10T23:32:11Z",
            "jd": 2461385.480685,
            "longitude": 7.931023,
            "sign": "Aries"
        },
        "postShadowEnd": {
            "utc": "2027-03-15T06:51:46Z",
            "jd": 2461479.785948,
            "longitude": 14.749954,
            "sign": "Aries"
        },
        "durationDays": 328.77
    },
    {
        "body": "Chiron",
        "preShadowStart": {
            "utc": "2026-04-10T09:36:12Z",
            "jd": 2461140.900138,
            "longitude": 26.264535,
            "sign": "Aries"
        },
        "retrogradeStation": {
            "utc": "2026-08-03T20:11:28Z",
            "jd": 2461256.341293,
            "longitude": 30.866818,
            "sign": "Taurus"
        },
        "directStation": {
            "utc": "2027-01-06T11:02:09Z",
            "jd": 2461411.959831,
            "longitude": 26.264535,
            "sign": "Aries"
        },
        "postShadowEnd": {
            "utc": "2027-04-28T20:43:12Z",
            "jd": 2461524.363328,
            "longitude": 30.866818,
            "sign": "Taurus"
        },
        "durationDays": 383.46
    },
    {
        "body": "Pallas",
        "preShadowStart": {
            "utc": "2026-05-06T20:19:14Z",
            "jd": 2461167.34669,
            "longitude": 3.2937,
            "sign": "Aries"
        },
        "retrogradeStation": {
            "utc": "2026-08-14T09:43:06Z",
            "jd": 2461266.904928,
            "longitude": 22.648555,
            "sign": "Aries"
        },
        "directStation": {
            "utc": "2026-12-01T04:36:00Z",
            "jd": 2461375.69167,
            "longitude": 3.2937,
            "sign": "Aries"
        },
        "postShadowEnd": {
            "utc": "2027-02-19T21:49:08Z",
            "jd": 2461456.409118,
            "longitude": 22.648555,
            "sign": "Aries"
        },
        "durationDays": 289.06
    },
    {
        "body": "Vesta",
        "preShadowStart": {
            "utc": "2026-06-14T16:26:47Z",
            "jd": 2461206.185266,
            "longitude": 12.68013,
            "sign": "Aries"
        },
        "retrogradeStation": {
            "utc": "2026-08-25T18:02:39Z",
            "jd": 2461278.251838,
            "longitude": 27.808116,
            "sign": "Aries"
        },
        "directStation": {
            "utc": "2026-11-28T13:29:27Z",
            "jd": 2461373.062121,
            "longitude": 12.68013,
            "sign": "Aries"
        },
        "postShadowEnd": {
            "utc": "2027-02-10T01:57:12Z",
            "jd": 2461446.581385,
            "longitude": 27.808116,
            "sign": "Aries"
        },
        "durationDays": 240.4
    },
    {
        "body": "Uranus",
        "preShadowStart": {
            "utc": "2026-05-25T10:45:11Z",
            "jd": 2461185.948048,
            "longitude": 61.682626,
            "sign": "Gemini"
        },
        "retrogradeStation": {
            "utc": "2026-09-10T18:28:29Z",
            "jd": 2461294.269782,
            "longitude": 65.697005,
            "sign": "Gemini"
        },
        "directStation": {
            "utc": "2027-02-08T12:30:36Z",
            "jd": 2461445.021255,
            "longitude": 61.682626,
            "sign": "Gemini"
        },
        "postShadowEnd": {
            "utc": "2027-05-26T03:48:02Z",
            "jd": 2461551.658352,
            "longitude": 65.697005,
            "sign": "Gemini"
        },
        "durationDays": 365.71
    },
    {
        "body": "Venus",
        "preShadowStart": {
            "utc": "2026-08-31T14:46:47Z",
            "jd": 2461284.115822,
            "longitude": 202.863666,
            "sign": "Libra"
        },
        "retrogradeStation": {
            "utc": "2026-10-03T07:16:60Z",
            "jd": 2461316.803469,
            "longitude": 218.491133,
            "sign": "Scorpio"
        },
        "directStation": {
            "utc": "2026-11-14T00:28:39Z",
            "jd": 2461358.519898,
            "longitude": 202.863666,
            "sign": "Libra"
        },
        "postShadowEnd": {
            "utc": "2026-12-15T18:45:04Z",
            "jd": 2461390.281299,
            "longitude": 218.491133,
            "sign": "Scorpio"
        },
        "durationDays": 106.17
    },
    {
        "body": "Mercury",
        "preShadowStart": {
            "utc": "2026-10-04T09:10:32Z",
            "jd": 2461317.882311,
            "longitude": 215.033493,
            "sign": "Scorpio"
        },
        "retrogradeStation": {
            "utc": "2026-10-24T07:13:57Z",
            "jd": 2461337.80135,
            "longitude": 230.978994,
            "sign": "Scorpio"
        },
        "directStation": {
            "utc": "2026-11-13T15:55:06Z",
            "jd": 2461358.163261,
            "longitude": 215.033493,
            "sign": "Scorpio"
        },
        "postShadowEnd": {
            "utc": "2026-11-30T06:17:32Z",
            "jd": 2461374.762179,
            "longitude": 230.978994,
            "sign": "Scorpio"
        },
        "durationDays": 56.88
    },
    {
        "body": "Ceres",
        "preShadowStart": {
            "utc": "2026-09-11T00:32:55Z",
            "jd": 2461294.522862,
            "longitude": 100.195957,
            "sign": "Cancer"
        },
        "retrogradeStation": {
            "utc": "2026-11-22T06:01:50Z",
            "jd": 2461366.751269,
            "longitude": 113.943946,
            "sign": "Cancer"
        },
        "directStation": {
            "utc": "2027-02-23T23:27:23Z",
            "jd": 2461460.477353,
            "longitude": 100.195957,
            "sign": "Cancer"
        },
        "postShadowEnd": {
            "utc": "2027-05-04T18:42:39Z",
            "jd": 2461530.279623,
            "longitude": 113.943946,
            "sign": "Cancer"
        },
        "durationDays": 235.76
    },
    {
        "body": "Jupiter",
        "preShadowStart": {
            "utc": "2026-09-17T04:29:50Z",
            "jd": 2461300.687381,
            "longitude": 136.995481,
            "sign": "Leo"
        },
        "retrogradeStation": {
            "utc": "2026-12-13T00:57:45Z",
            "jd": 2461387.540109,
            "longitude": 147.024652,
            "sign": "Leo"
        },
        "directStation": {
            "utc": "2027-04-13T02:12:25Z",
            "jd": 2461508.591951,
            "longitude": 136.995481,
            "sign": "Leo"
        },
        "postShadowEnd": {
            "utc": "2027-07-11T04:51:12Z",
            "jd": 2461597.702223,
            "longitude": 147.024652,
            "sign": "Leo"
        },
        "durationDays": 297.01
    },
    {
        "body": "Mars",
        "preShadowStart": {
            "utc": "2026-11-05T15:34:48Z",
            "jd": 2461350.149171,
            "longitude": 140.926597,
            "sign": "Leo"
        },
        "retrogradeStation": {
            "utc": "2027-01-10T13:00:36Z",
            "jd": 2461416.042088,
            "longitude": 160.429016,
            "sign": "Virgo"
        },
        "directStation": {
            "utc": "2027-04-01T14:09:27Z",
            "jd": 2461497.089897,
            "longitude": 140.926597,
            "sign": "Leo"
        },
        "postShadowEnd": {
            "utc": "2027-06-08T01:59:19Z",
            "jd": 2461564.582856,
            "longitude": 160.429016,
            "sign": "Virgo"
        },
        "durationDays": 214.43
    },
    {
        "body": "Mercury",
        "preShadowStart": {
            "utc": "2027-01-25T18:58:43Z",
            "jd": 2461431.290771,
            "longitude": 320.923154,
            "sign": "Aquarius"
        },
        "retrogradeStation": {
            "utc": "2027-02-09T17:37:18Z",
            "jd": 2461446.234239,
            "longitude": 335.981273,
            "sign": "Pisces"
        },
        "directStation": {
            "utc": "2027-03-03T12:33:15Z",
            "jd": 2461468.023086,
            "longitude": 320.923154,
            "sign": "Aquarius"
        },
        "postShadowEnd": {
            "utc": "2027-03-23T14:59:09Z",
            "jd": 2461488.124415,
            "longitude": 335.981273,
            "sign": "Pisces"
        },
        "durationDays": 56.83
    },
    {
        "body": "Pluto",
        "preShadowStart": {
            "utc": "2027-01-13T23:40:48Z",
            "jd": 2461419.486669,
            "longitude": 304.748152,
            "sign": "Aquarius"
        },
        "retrogradeStation": {
            "utc": "2027-05-08T12:55:19Z",
            "jd": 2461534.038419,
            "longitude": 307.177954,
            "sign": "Aquarius"
        },
        "directStation": {
            "utc": "2027-10-18T03:53:34Z",
            "jd": 2461696.662201,
            "longitude": 304.748152,
            "sign": "Aquarius"
        },
        "postShadowEnd": {
            "utc": "2028-02-09T05:13:18Z",
            "jd": 2461810.717572,
            "longitude": 307.177954,
            "sign": "Aquarius"
        },
        "durationDays": 391.23
    },
    {
        "body": "Mercury",
        "preShadowStart": {
            "utc": "2027-05-26T06:04:40Z",
            "jd": 2461551.753238,
            "longitude": 87.469208,
            "sign": "Gemini"
        },
        "retrogradeStation": {
            "utc": "2027-06-10T18:16:28Z",
            "jd": 2461567.261434,
            "longitude": 96.36115,
            "sign": "Cancer"
        },
        "directStation": {
            "utc": "2027-07-04T19:40:36Z",
            "jd": 2461591.319865,
            "longitude": 87.469208,
            "sign": "Gemini"
        },
        "postShadowEnd": {
            "utc": "2027-07-19T08:43:46Z",
            "jd": 2461605.863728,
            "longitude": 96.36115,
            "sign": "Cancer"
        },
        "durationDays": 54.11
    },
    {
        "body": "Neptune",
        "preShadowStart": {
            "utc": "2027-03-18T20:10:35Z",
            "jd": 2461483.340684,
            "longitude": 3.852504,
            "sign": "Aries"
        },
        "retrogradeStation": {
            "utc": "2027-07-09T22:42:11Z",
            "jd": 2461596.445957,
            "longitude": 6.659441,
            "sign": "Aries"
        },
        "directStation": {
            "utc": "2027-12-15T09:07:30Z",
            "jd": 2461754.880203,
            "longitude": 3.852504,
            "sign": "Aries"
        },
        "postShadowEnd": {
            "utc": "2028-04-04T08:08:23Z",
            "jd": 2461865.839152,
            "longitude": 6.659441,
            "sign": "Aries"
        },
        "durationDays": 382.5
    },
    {
        "body": "Chiron",
        "preShadowStart": {
            "utc": "2027-04-14T22:27:24Z",
            "jd": 2461510.435692,
            "longitude": 30.018945,
            "sign": "Taurus"
        },
        "retrogradeStation": {
            "utc": "2027-08-08T02:56:34Z",
            "jd": 2461625.62262,
            "longitude": 34.667727,
            "sign": "Taurus"
        },
        "directStation": {
            "utc": "2028-01-10T06:42:13Z",
            "jd": 2461780.779315,
            "longitude": 30.018945,
            "sign": "Taurus"
        },
        "postShadowEnd": {
            "utc": "2028-05-01T08:43:09Z",
            "jd": 2461892.8633,
            "longitude": 34.667727,
            "sign": "Taurus"
        },
        "durationDays": 382.43
    },
    {
        "body": "Saturn",
        "preShadowStart": {
            "utc": "2027-05-04T18:06:30Z",
            "jd": 2461530.254515,
            "longitude": 21.020576,
            "sign": "Aries"
        },
        "retrogradeStation": {
            "utc": "2027-08-09T18:07:05Z",
            "jd": 2461627.254921,
            "longitude": 27.880399,
            "sign": "Aries"
        },
        "directStation": {
            "utc": "2027-12-24T02:48:31Z",
            "jd": 2461763.617028,
            "longitude": 21.020576,
            "sign": "Aries"
        },
        "postShadowEnd": {
            "utc": "2028-03-27T04:32:51Z",
            "jd": 2461857.689481,
            "longitude": 27.880399,
            "sign": "Aries"
        },
        "durationDays": 327.43
    },
    {
        "body": "Uranus",
        "preShadowStart": {
            "utc": "2027-05-30T03:47:42Z",
            "jd": 2461555.658129,
            "longitude": 65.931144,
            "sign": "Gemini"
        },
        "retrogradeStation": {
            "utc": "2027-09-15T09:10:41Z",
            "jd": 2461663.882422,
            "longitude": 69.95571,
            "sign": "Gemini"
        },
        "directStation": {
            "utc": "2028-02-12T23:50:59Z",
            "jd": 2461814.493744,
            "longitude": 65.931144,
            "sign": "Gemini"
        },
        "postShadowEnd": {
            "utc": "2028-05-29T15:25:38Z",
            "jd": 2461921.142802,
            "longitude": 69.95571,
            "sign": "Gemini"
        },
        "durationDays": 365.48
    },
    {
        "body": "Mercury",
        "preShadowStart": {
            "utc": "2027-09-17T07:30:03Z",
            "jd": 2461665.812534,
            "longitude": 199.312072,
            "sign": "Libra"
        },
        "retrogradeStation": {
            "utc": "2027-10-07T14:38:18Z",
            "jd": 2461686.109925,
            "longitude": 214.927815,
            "sign": "Scorpio"
        },
        "directStation": {
            "utc": "2027-10-28T14:11:52Z",
            "jd": 2461707.091577,
            "longitude": 199.312072,
            "sign": "Libra"
        },
        "postShadowEnd": {
            "utc": "2027-11-13T09:55:50Z",
            "jd": 2461722.913771,
            "longitude": 214.927815,
            "sign": "Scorpio"
        },
        "durationDays": 57.1
    },
    {
        "body": "Juno",
        "preShadowStart": {
            "utc": "2027-10-08T06:18:17Z",
            "jd": 2461686.762693,
            "longitude": 110.119462,
            "sign": "Cancer"
        },
        "retrogradeStation": {
            "utc": "2027-12-05T02:04:27Z",
            "jd": 2461744.58642,
            "longitude": 123.279387,
            "sign": "Leo"
        },
        "directStation": {
            "utc": "2028-02-26T09:23:43Z",
            "jd": 2461827.891468,
            "longitude": 110.119462,
            "sign": "Cancer"
        },
        "postShadowEnd": {
            "utc": "2028-05-03T11:39:15Z",
            "jd": 2461894.985587,
            "longitude": 123.279387,
            "sign": "Leo"
        },
        "durationDays": 208.22
    },
    {
        "body": "Vesta",
        "preShadowStart": {
            "utc": "2027-10-01T22:20:03Z",
            "jd": 2461680.430594,
            "longitude": 123.13293,
            "sign": "Leo"
        },
        "retrogradeStation": {
            "utc": "2027-12-15T22:30:25Z",
            "jd": 2461755.437787,
            "longitude": 138.562344,
            "sign": "Leo"
        },
        "directStation": {
            "utc": "2028-03-19T14:10:58Z",
            "jd": 2461850.090945,
            "longitude": 123.13293,
            "sign": "Leo"
        },
        "postShadowEnd": {
            "utc": "2028-05-30T22:24:11Z",
            "jd": 2461922.43346,
            "longitude": 138.562344,
            "sign": "Leo"
        },
        "durationDays": 242
    },
    {
        "body": "Jupiter",
        "preShadowStart": {
            "utc": "2027-10-17T05:52:04Z",
            "jd": 2461695.744494,
            "longitude": 167.540319,
            "sign": "Virgo"
        },
        "retrogradeStation": {
            "utc": "2028-01-12T08:54:57Z",
            "jd": 2461782.871494,
            "longitude": 177.512154,
            "sign": "Virgo"
        },
        "directStation": {
            "utc": "2028-05-13T20:01:32Z",
            "jd": 2461905.334401,
            "longitude": 167.540319,
            "sign": "Virgo"
        },
        "postShadowEnd": {
            "utc": "2028-08-11T12:54:05Z",
            "jd": 2461995.03756,
            "longitude": 177.512154,
            "sign": "Virgo"
        },
        "durationDays": 299.29
    },
    {
        "body": "Pallas",
        "preShadowStart": {
            "utc": "2027-11-10T18:57:31Z",
            "jd": 2461720.289944,
            "longitude": 165.041641,
            "sign": "Virgo"
        },
        "retrogradeStation": {
            "utc": "2028-01-25T00:54:21Z",
            "jd": 2461795.537749,
            "longitude": 184.30301,
            "sign": "Libra"
        },
        "directStation": {
            "utc": "2028-05-02T00:46:10Z",
            "jd": 2461893.532061,
            "longitude": 165.041641,
            "sign": "Virgo"
        },
        "postShadowEnd": {
            "utc": "2028-07-26T15:19:01Z",
            "jd": 2461979.138206,
            "longitude": 184.30301,
            "sign": "Libra"
        },
        "durationDays": 258.85
    }
];

export const SIGN_INGRESSES: SignIngressRow[] = [
    {
        "utc": "2026-01-01T21:11:51Z",
        "jd": 2461042.383229,
        "body": "Mercury",
        "fromSign": "Sagittarius",
        "toSign": "Capricorn",
        "longitude": 270,
        "retrograde": false
    },
    {
        "utc": "2026-01-11T20:38:15Z",
        "jd": 2461052.359893,
        "body": "Vesta",
        "fromSign": "Capricorn",
        "toSign": "Aquarius",
        "longitude": 300,
        "retrograde": false
    },
    {
        "utc": "2026-01-17T12:44:33Z",
        "jd": 2461058.030932,
        "body": "Venus",
        "fromSign": "Capricorn",
        "toSign": "Aquarius",
        "longitude": 300,
        "retrograde": false
    },
    {
        "utc": "2026-01-20T01:46:05Z",
        "jd": 2461060.573664,
        "body": "Sun",
        "fromSign": "Capricorn",
        "toSign": "Aquarius",
        "longitude": 300,
        "retrograde": false
    },
    {
        "utc": "2026-01-20T16:42:20Z",
        "jd": 2461061.196062,
        "body": "Mercury",
        "fromSign": "Capricorn",
        "toSign": "Aquarius",
        "longitude": 300,
        "retrograde": false
    },
    {
        "utc": "2026-01-23T09:17:54Z",
        "jd": 2461063.887431,
        "body": "Mars",
        "fromSign": "Capricorn",
        "toSign": "Aquarius",
        "longitude": 300,
        "retrograde": false
    },
    {
        "utc": "2026-01-25T01:32:11Z",
        "jd": 2461065.564011,
        "body": "Pallas",
        "fromSign": "Aquarius",
        "toSign": "Pisces",
        "longitude": 330,
        "retrograde": false
    },
    {
        "utc": "2026-01-26T17:41:13Z",
        "jd": 2461067.236952,
        "body": "Neptune",
        "fromSign": "Pisces",
        "toSign": "Aries",
        "longitude": 0,
        "retrograde": false
    },
    {
        "utc": "2026-02-06T22:49:13Z",
        "jd": 2461078.450841,
        "body": "Mercury",
        "fromSign": "Aquarius",
        "toSign": "Pisces",
        "longitude": 330,
        "retrograde": false
    },
    {
        "utc": "2026-02-10T10:19:47Z",
        "jd": 2461081.930405,
        "body": "Venus",
        "fromSign": "Aquarius",
        "toSign": "Pisces",
        "longitude": 330,
        "retrograde": false
    },
    {
        "utc": "2026-02-14T00:12:43Z",
        "jd": 2461085.508826,
        "body": "Saturn",
        "fromSign": "Pisces",
        "toSign": "Aries",
        "longitude": 0,
        "retrograde": false
    },
    {
        "utc": "2026-02-18T15:53:05Z",
        "jd": 2461090.16186,
        "body": "Sun",
        "fromSign": "Aquarius",
        "toSign": "Pisces",
        "longitude": 330,
        "retrograde": false
    },
    {
        "utc": "2026-03-02T14:16:59Z",
        "jd": 2461102.095132,
        "body": "Mars",
        "fromSign": "Aquarius",
        "toSign": "Pisces",
        "longitude": 330,
        "retrograde": false
    },
    {
        "utc": "2026-03-06T10:46:54Z",
        "jd": 2461105.94924,
        "body": "Venus",
        "fromSign": "Pisces",
        "toSign": "Aries",
        "longitude": 0,
        "retrograde": false
    },
    {
        "utc": "2026-03-10T21:23:36Z",
        "jd": 2461110.391388,
        "body": "Vesta",
        "fromSign": "Aquarius",
        "toSign": "Pisces",
        "longitude": 330,
        "retrograde": false
    },
    {
        "utc": "2026-03-15T05:13:59Z",
        "jd": 2461114.718046,
        "body": "Ceres",
        "fromSign": "Aries",
        "toSign": "Taurus",
        "longitude": 30,
        "retrograde": false
    },
    {
        "utc": "2026-03-20T14:47:07Z",
        "jd": 2461120.116055,
        "body": "Sun",
        "fromSign": "Pisces",
        "toSign": "Aries",
        "longitude": 0,
        "retrograde": false
    },
    {
        "utc": "2026-03-29T08:50:57Z",
        "jd": 2461128.868712,
        "body": "Juno",
        "fromSign": "Capricorn",
        "toSign": "Aquarius",
        "longitude": 300,
        "retrograde": false
    },
    {
        "utc": "2026-03-30T16:02:01Z",
        "jd": 2461130.168063,
        "body": "Venus",
        "fromSign": "Aries",
        "toSign": "Taurus",
        "longitude": 30,
        "retrograde": false
    },
    {
        "utc": "2026-04-09T19:37:20Z",
        "jd": 2461140.317591,
        "body": "Mars",
        "fromSign": "Pisces",
        "toSign": "Aries",
        "longitude": 0,
        "retrograde": false
    },
    {
        "utc": "2026-04-15T03:22:39Z",
        "jd": 2461145.640728,
        "body": "Mercury",
        "fromSign": "Pisces",
        "toSign": "Aries",
        "longitude": 0,
        "retrograde": false
    },
    {
        "utc": "2026-04-20T01:40:16Z",
        "jd": 2461150.569631,
        "body": "Sun",
        "fromSign": "Aries",
        "toSign": "Taurus",
        "longitude": 30,
        "retrograde": false
    },
    {
        "utc": "2026-04-24T04:04:34Z",
        "jd": 2461154.669837,
        "body": "Venus",
        "fromSign": "Taurus",
        "toSign": "Gemini",
        "longitude": 60,
        "retrograde": false
    },
    {
        "utc": "2026-04-26T00:52:28Z",
        "jd": 2461156.536437,
        "body": "Uranus",
        "fromSign": "Taurus",
        "toSign": "Gemini",
        "longitude": 60,
        "retrograde": false
    },
    {
        "utc": "2026-04-26T05:07:47Z",
        "jd": 2461156.713734,
        "body": "Pallas",
        "fromSign": "Pisces",
        "toSign": "Aries",
        "longitude": 0,
        "retrograde": false
    },
    {
        "utc": "2026-05-03T02:58:05Z",
        "jd": 2461163.62367,
        "body": "Mercury",
        "fromSign": "Aries",
        "toSign": "Taurus",
        "longitude": 30,
        "retrograde": false
    },
    {
        "utc": "2026-05-13T16:13:56Z",
        "jd": 2461174.176348,
        "body": "Vesta",
        "fromSign": "Pisces",
        "toSign": "Aries",
        "longitude": 0,
        "retrograde": false
    },
    {
        "utc": "2026-05-17T10:27:33Z",
        "jd": 2461177.9358,
        "body": "Mercury",
        "fromSign": "Taurus",
        "toSign": "Gemini",
        "longitude": 60,
        "retrograde": false
    },
    {
        "utc": "2026-05-18T22:26:38Z",
        "jd": 2461179.435157,
        "body": "Mars",
        "fromSign": "Aries",
        "toSign": "Taurus",
        "longitude": 30,
        "retrograde": false
    },
    {
        "utc": "2026-05-19T01:06:25Z",
        "jd": 2461179.546128,
        "body": "Venus",
        "fromSign": "Gemini",
        "toSign": "Cancer",
        "longitude": 90,
        "retrograde": false
    },
    {
        "utc": "2026-05-21T00:37:53Z",
        "jd": 2461181.526311,
        "body": "Sun",
        "fromSign": "Taurus",
        "toSign": "Gemini",
        "longitude": 60,
        "retrograde": false
    },
    {
        "utc": "2026-05-28T23:49:51Z",
        "jd": 2461189.492952,
        "body": "Ceres",
        "fromSign": "Taurus",
        "toSign": "Gemini",
        "longitude": 60,
        "retrograde": false
    },
    {
        "utc": "2026-06-01T11:56:52Z",
        "jd": 2461192.997826,
        "body": "Mercury",
        "fromSign": "Gemini",
        "toSign": "Cancer",
        "longitude": 90,
        "retrograde": false
    },
    {
        "utc": "2026-06-13T10:47:56Z",
        "jd": 2461204.949959,
        "body": "Venus",
        "fromSign": "Cancer",
        "toSign": "Leo",
        "longitude": 120,
        "retrograde": false
    },
    {
        "utc": "2026-06-19T21:20:13Z",
        "jd": 2461211.389039,
        "body": "Chiron",
        "fromSign": "Aries",
        "toSign": "Taurus",
        "longitude": 30,
        "retrograde": false
    },
    {
        "utc": "2026-06-21T08:25:40Z",
        "jd": 2461212.851153,
        "body": "Sun",
        "fromSign": "Gemini",
        "toSign": "Cancer",
        "longitude": 90,
        "retrograde": false
    },
    {
        "utc": "2026-06-28T19:30:23Z",
        "jd": 2461220.312762,
        "body": "Mars",
        "fromSign": "Taurus",
        "toSign": "Gemini",
        "longitude": 60,
        "retrograde": false
    },
    {
        "utc": "2026-06-30T05:53:22Z",
        "jd": 2461221.74539,
        "body": "Jupiter",
        "fromSign": "Cancer",
        "toSign": "Leo",
        "longitude": 120,
        "retrograde": false
    },
    {
        "utc": "2026-07-09T17:23:16Z",
        "jd": 2461231.224491,
        "body": "Venus",
        "fromSign": "Leo",
        "toSign": "Virgo",
        "longitude": 150,
        "retrograde": false
    },
    {
        "utc": "2026-07-22T19:14:14Z",
        "jd": 2461244.301554,
        "body": "Sun",
        "fromSign": "Cancer",
        "toSign": "Leo",
        "longitude": 120,
        "retrograde": false
    },
    {
        "utc": "2026-07-27T00:47:12Z",
        "jd": 2461248.532775,
        "body": "True Node",
        "fromSign": "Pisces",
        "toSign": "Aquarius",
        "longitude": 329.999999,
        "retrograde": true
    },
    {
        "utc": "2026-08-06T19:13:54Z",
        "jd": 2461259.301319,
        "body": "Venus",
        "fromSign": "Virgo",
        "toSign": "Libra",
        "longitude": 180,
        "retrograde": false
    },
    {
        "utc": "2026-08-09T16:29:32Z",
        "jd": 2461262.187171,
        "body": "Mercury",
        "fromSign": "Cancer",
        "toSign": "Leo",
        "longitude": 120,
        "retrograde": false
    },
    {
        "utc": "2026-08-11T08:31:39Z",
        "jd": 2461263.855313,
        "body": "Mars",
        "fromSign": "Gemini",
        "toSign": "Cancer",
        "longitude": 90,
        "retrograde": false
    },
    {
        "utc": "2026-08-11T14:44:31Z",
        "jd": 2461264.114253,
        "body": "Juno",
        "fromSign": "Aquarius",
        "toSign": "Capricorn",
        "longitude": 300,
        "retrograde": true
    },
    {
        "utc": "2026-08-12T14:55:18Z",
        "jd": 2461265.121742,
        "body": "Ceres",
        "fromSign": "Gemini",
        "toSign": "Cancer",
        "longitude": 90,
        "retrograde": false
    },
    {
        "utc": "2026-08-23T02:19:57Z",
        "jd": 2461275.597193,
        "body": "Sun",
        "fromSign": "Leo",
        "toSign": "Virgo",
        "longitude": 150,
        "retrograde": false
    },
    {
        "utc": "2026-08-25T11:05:22Z",
        "jd": 2461277.962064,
        "body": "Mercury",
        "fromSign": "Leo",
        "toSign": "Virgo",
        "longitude": 150,
        "retrograde": false
    },
    {
        "utc": "2026-09-10T08:07:57Z",
        "jd": 2461293.838856,
        "body": "Venus",
        "fromSign": "Libra",
        "toSign": "Scorpio",
        "longitude": 210,
        "retrograde": false
    },
    {
        "utc": "2026-09-10T16:21:47Z",
        "jd": 2461294.181797,
        "body": "Mercury",
        "fromSign": "Virgo",
        "toSign": "Libra",
        "longitude": 180,
        "retrograde": false
    },
    {
        "utc": "2026-09-18T01:53:17Z",
        "jd": 2461301.578668,
        "body": "Chiron",
        "fromSign": "Taurus",
        "toSign": "Aries",
        "longitude": 30,
        "retrograde": true
    },
    {
        "utc": "2026-09-23T00:06:22Z",
        "jd": 2461306.504423,
        "body": "Sun",
        "fromSign": "Virgo",
        "toSign": "Libra",
        "longitude": 180,
        "retrograde": false
    },
    {
        "utc": "2026-09-28T02:50:01Z",
        "jd": 2461311.618064,
        "body": "Mars",
        "fromSign": "Cancer",
        "toSign": "Leo",
        "longitude": 120,
        "retrograde": false
    },
    {
        "utc": "2026-09-30T11:45:33Z",
        "jd": 2461313.989966,
        "body": "Mercury",
        "fromSign": "Libra",
        "toSign": "Scorpio",
        "longitude": 210,
        "retrograde": false
    },
    {
        "utc": "2026-10-23T09:39:05Z",
        "jd": 2461336.902145,
        "body": "Sun",
        "fromSign": "Libra",
        "toSign": "Scorpio",
        "longitude": 210,
        "retrograde": false
    },
    {
        "utc": "2026-10-24T02:41:23Z",
        "jd": 2461337.612076,
        "body": "Juno",
        "fromSign": "Capricorn",
        "toSign": "Aquarius",
        "longitude": 300,
        "retrograde": false
    },
    {
        "utc": "2026-10-25T09:10:57Z",
        "jd": 2461338.882601,
        "body": "Venus",
        "fromSign": "Scorpio",
        "toSign": "Libra",
        "longitude": 210,
        "retrograde": true
    },
    {
        "utc": "2026-11-22T07:24:30Z",
        "jd": 2461366.80868,
        "body": "Sun",
        "fromSign": "Scorpio",
        "toSign": "Sagittarius",
        "longitude": 240,
        "retrograde": false
    },
    {
        "utc": "2026-11-25T23:38:13Z",
        "jd": 2461370.484876,
        "body": "Mars",
        "fromSign": "Leo",
        "toSign": "Virgo",
        "longitude": 150,
        "retrograde": false
    },
    {
        "utc": "2026-12-04T08:13:52Z",
        "jd": 2461378.842964,
        "body": "Venus",
        "fromSign": "Libra",
        "toSign": "Scorpio",
        "longitude": 210,
        "retrograde": false
    },
    {
        "utc": "2026-12-06T08:34:29Z",
        "jd": 2461380.857276,
        "body": "Mercury",
        "fromSign": "Scorpio",
        "toSign": "Sagittarius",
        "longitude": 240,
        "retrograde": false
    },
    {
        "utc": "2026-12-21T20:51:23Z",
        "jd": 2461396.36902,
        "body": "Sun",
        "fromSign": "Sagittarius",
        "toSign": "Capricorn",
        "longitude": 270,
        "retrograde": false
    },
    {
        "utc": "2026-12-25T18:23:38Z",
        "jd": 2461400.266411,
        "body": "Mercury",
        "fromSign": "Sagittarius",
        "toSign": "Capricorn",
        "longitude": 270,
        "retrograde": false
    },
    {
        "utc": "2027-01-07T08:54:37Z",
        "jd": 2461412.871256,
        "body": "Venus",
        "fromSign": "Scorpio",
        "toSign": "Sagittarius",
        "longitude": 240,
        "retrograde": false
    },
    {
        "utc": "2027-01-13T06:07:00Z",
        "jd": 2461418.754863,
        "body": "Mercury",
        "fromSign": "Capricorn",
        "toSign": "Aquarius",
        "longitude": 300,
        "retrograde": false
    },
    {
        "utc": "2027-01-15T00:03:60Z",
        "jd": 2461420.502774,
        "body": "Juno",
        "fromSign": "Aquarius",
        "toSign": "Pisces",
        "longitude": 330,
        "retrograde": false
    },
    {
        "utc": "2027-01-20T07:30:60Z",
        "jd": 2461425.813193,
        "body": "Sun",
        "fromSign": "Capricorn",
        "toSign": "Aquarius",
        "longitude": 300,
        "retrograde": false
    },
    {
        "utc": "2027-02-01T01:26:47Z",
        "jd": 2461437.560271,
        "body": "Mercury",
        "fromSign": "Aquarius",
        "toSign": "Pisces",
        "longitude": 330,
        "retrograde": false
    },
    {
        "utc": "2027-02-03T14:31:41Z",
        "jd": 2461440.10533,
        "body": "Venus",
        "fromSign": "Sagittarius",
        "toSign": "Capricorn",
        "longitude": 270,
        "retrograde": false
    },
    {
        "utc": "2027-02-16T07:52:57Z",
        "jd": 2461452.828442,
        "body": "Vesta",
        "fromSign": "Aries",
        "toSign": "Taurus",
        "longitude": 30,
        "retrograde": false
    },
    {
        "utc": "2027-02-18T12:16:42Z",
        "jd": 2461455.0116,
        "body": "Mercury",
        "fromSign": "Pisces",
        "toSign": "Aquarius",
        "longitude": 330,
        "retrograde": true
    },
    {
        "utc": "2027-02-18T21:34:38Z",
        "jd": 2461455.399053,
        "body": "Sun",
        "fromSign": "Aquarius",
        "toSign": "Pisces",
        "longitude": 330,
        "retrograde": false
    },
    {
        "utc": "2027-02-21T14:14:37Z",
        "jd": 2461458.093485,
        "body": "Mars",
        "fromSign": "Virgo",
        "toSign": "Leo",
        "longitude": 150,
        "retrograde": true
    },
    {
        "utc": "2027-03-01T06:33:25Z",
        "jd": 2461465.773203,
        "body": "Venus",
        "fromSign": "Capricorn",
        "toSign": "Aquarius",
        "longitude": 300,
        "retrograde": false
    },
    {
        "utc": "2027-03-08T21:57:06Z",
        "jd": 2461473.414654,
        "body": "Pallas",
        "fromSign": "Aries",
        "toSign": "Taurus",
        "longitude": 30,
        "retrograde": false
    },
    {
        "utc": "2027-03-16T04:09:46Z",
        "jd": 2461480.673448,
        "body": "Juno",
        "fromSign": "Pisces",
        "toSign": "Aries",
        "longitude": 0,
        "retrograde": false
    },
    {
        "utc": "2027-03-18T10:03:03Z",
        "jd": 2461482.918789,
        "body": "Mercury",
        "fromSign": "Aquarius",
        "toSign": "Pisces",
        "longitude": 330,
        "retrograde": false
    },
    {
        "utc": "2027-03-20T20:25:51Z",
        "jd": 2461485.351289,
        "body": "Sun",
        "fromSign": "Pisces",
        "toSign": "Aries",
        "longitude": 0,
        "retrograde": false
    },
    {
        "utc": "2027-03-26T08:17:40Z",
        "jd": 2461490.845604,
        "body": "Venus",
        "fromSign": "Aquarius",
        "toSign": "Pisces",
        "longitude": 330,
        "retrograde": false
    },
    {
        "utc": "2027-04-08T23:21:19Z",
        "jd": 2461504.473134,
        "body": "Mercury",
        "fromSign": "Pisces",
        "toSign": "Aries",
        "longitude": 0,
        "retrograde": false
    },
    {
        "utc": "2027-04-14T14:58:29Z",
        "jd": 2461510.123941,
        "body": "Chiron",
        "fromSign": "Aries",
        "toSign": "Taurus",
        "longitude": 30,
        "retrograde": false
    },
    {
        "utc": "2027-04-20T03:58:14Z",
        "jd": 2461515.665438,
        "body": "Venus",
        "fromSign": "Pisces",
        "toSign": "Aries",
        "longitude": 0,
        "retrograde": false
    },
    {
        "utc": "2027-04-20T07:18:47Z",
        "jd": 2461515.804712,
        "body": "Sun",
        "fromSign": "Aries",
        "toSign": "Taurus",
        "longitude": 30,
        "retrograde": false
    },
    {
        "utc": "2027-04-24T22:19:16Z",
        "jd": 2461520.430041,
        "body": "Mercury",
        "fromSign": "Aries",
        "toSign": "Taurus",
        "longitude": 30,
        "retrograde": false
    },
    {
        "utc": "2027-05-01T16:57:30Z",
        "jd": 2461527.206595,
        "body": "Vesta",
        "fromSign": "Taurus",
        "toSign": "Gemini",
        "longitude": 60,
        "retrograde": false
    },
    {
        "utc": "2027-05-06T17:13:34Z",
        "jd": 2461532.217751,
        "body": "Pallas",
        "fromSign": "Taurus",
        "toSign": "Gemini",
        "longitude": 60,
        "retrograde": false
    },
    {
        "utc": "2027-05-09T01:58:54Z",
        "jd": 2461534.582565,
        "body": "Mercury",
        "fromSign": "Taurus",
        "toSign": "Gemini",
        "longitude": 60,
        "retrograde": false
    },
    {
        "utc": "2027-05-10T00:53:40Z",
        "jd": 2461535.537271,
        "body": "Juno",
        "fromSign": "Aries",
        "toSign": "Taurus",
        "longitude": 30,
        "retrograde": false
    },
    {
        "utc": "2027-05-14T14:48:40Z",
        "jd": 2461540.117125,
        "body": "Mars",
        "fromSign": "Leo",
        "toSign": "Virgo",
        "longitude": 150,
        "retrograde": false
    },
    {
        "utc": "2027-05-14T21:02:39Z",
        "jd": 2461540.376839,
        "body": "Venus",
        "fromSign": "Aries",
        "toSign": "Taurus",
        "longitude": 30,
        "retrograde": false
    },
    {
        "utc": "2027-05-21T06:19:24Z",
        "jd": 2461546.763467,
        "body": "Sun",
        "fromSign": "Taurus",
        "toSign": "Gemini",
        "longitude": 60,
        "retrograde": false
    },
    {
        "utc": "2027-05-21T18:37:07Z",
        "jd": 2461547.275775,
        "body": "Ceres",
        "fromSign": "Cancer",
        "toSign": "Leo",
        "longitude": 120,
        "retrograde": false
    },
    {
        "utc": "2027-05-28T17:07:43Z",
        "jd": 2461554.213693,
        "body": "Mercury",
        "fromSign": "Gemini",
        "toSign": "Cancer",
        "longitude": 90,
        "retrograde": false
    },
    {
        "utc": "2027-06-08T12:33:41Z",
        "jd": 2461565.023389,
        "body": "Venus",
        "fromSign": "Taurus",
        "toSign": "Gemini",
        "longitude": 60,
        "retrograde": false
    },
    {
        "utc": "2027-06-21T14:11:59Z",
        "jd": 2461578.091658,
        "body": "Sun",
        "fromSign": "Gemini",
        "toSign": "Cancer",
        "longitude": 90,
        "retrograde": false
    },
    {
        "utc": "2027-06-26T07:20:22Z",
        "jd": 2461582.80581,
        "body": "Mercury",
        "fromSign": "Cancer",
        "toSign": "Gemini",
        "longitude": 90,
        "retrograde": true
    },
    {
        "utc": "2027-06-27T10:43:38Z",
        "jd": 2461583.946965,
        "body": "Pallas",
        "fromSign": "Gemini",
        "toSign": "Cancer",
        "longitude": 90,
        "retrograde": false
    },
    {
        "utc": "2027-07-02T03:41:47Z",
        "jd": 2461588.654017,
        "body": "Juno",
        "fromSign": "Taurus",
        "toSign": "Gemini",
        "longitude": 60,
        "retrograde": false
    },
    {
        "utc": "2027-07-03T02:02:39Z",
        "jd": 2461589.585179,
        "body": "Venus",
        "fromSign": "Gemini",
        "toSign": "Cancer",
        "longitude": 90,
        "retrograde": false
    },
    {
        "utc": "2027-07-10T04:31:37Z",
        "jd": 2461596.688621,
        "body": "Vesta",
        "fromSign": "Gemini",
        "toSign": "Cancer",
        "longitude": 90,
        "retrograde": false
    },
    {
        "utc": "2027-07-12T13:49:09Z",
        "jd": 2461599.075794,
        "body": "Mercury",
        "fromSign": "Gemini",
        "toSign": "Cancer",
        "longitude": 90,
        "retrograde": false
    },
    {
        "utc": "2027-07-15T05:41:36Z",
        "jd": 2461601.737224,
        "body": "Mars",
        "fromSign": "Virgo",
        "toSign": "Libra",
        "longitude": 180,
        "retrograde": false
    },
    {
        "utc": "2027-07-23T01:05:49Z",
        "jd": 2461609.545711,
        "body": "Sun",
        "fromSign": "Cancer",
        "toSign": "Leo",
        "longitude": 120,
        "retrograde": false
    },
    {
        "utc": "2027-07-26T04:50:12Z",
        "jd": 2461612.701524,
        "body": "Jupiter",
        "fromSign": "Leo",
        "toSign": "Virgo",
        "longitude": 150,
        "retrograde": false
    },
    {
        "utc": "2027-07-27T12:32:07Z",
        "jd": 2461614.022298,
        "body": "Venus",
        "fromSign": "Cancer",
        "toSign": "Leo",
        "longitude": 120,
        "retrograde": false
    },
    {
        "utc": "2027-08-01T03:17:58Z",
        "jd": 2461618.637475,
        "body": "Ceres",
        "fromSign": "Leo",
        "toSign": "Virgo",
        "longitude": 150,
        "retrograde": false
    },
    {
        "utc": "2027-08-02T10:53:32Z",
        "jd": 2461619.953844,
        "body": "Mercury",
        "fromSign": "Cancer",
        "toSign": "Leo",
        "longitude": 120,
        "retrograde": false
    },
    {
        "utc": "2027-08-16T21:29:38Z",
        "jd": 2461634.395574,
        "body": "Pallas",
        "fromSign": "Cancer",
        "toSign": "Leo",
        "longitude": 120,
        "retrograde": false
    },
    {
        "utc": "2027-08-17T04:44:30Z",
        "jd": 2461634.697572,
        "body": "Mercury",
        "fromSign": "Leo",
        "toSign": "Virgo",
        "longitude": 150,
        "retrograde": false
    },
    {
        "utc": "2027-08-20T19:43:53Z",
        "jd": 2461638.322142,
        "body": "Venus",
        "fromSign": "Leo",
        "toSign": "Virgo",
        "longitude": 150,
        "retrograde": false
    },
    {
        "utc": "2027-08-23T08:15:28Z",
        "jd": 2461640.844078,
        "body": "Sun",
        "fromSign": "Leo",
        "toSign": "Virgo",
        "longitude": 150,
        "retrograde": false
    },
    {
        "utc": "2027-08-26T02:00:01Z",
        "jd": 2461643.58335,
        "body": "Juno",
        "fromSign": "Gemini",
        "toSign": "Cancer",
        "longitude": 90,
        "retrograde": false
    },
    {
        "utc": "2027-09-02T01:53:19Z",
        "jd": 2461650.578695,
        "body": "Mars",
        "fromSign": "Libra",
        "toSign": "Scorpio",
        "longitude": 210,
        "retrograde": false
    },
    {
        "utc": "2027-09-03T11:38:03Z",
        "jd": 2461651.984756,
        "body": "Mercury",
        "fromSign": "Virgo",
        "toSign": "Libra",
        "longitude": 180,
        "retrograde": false
    },
    {
        "utc": "2027-09-14T00:25:51Z",
        "jd": 2461662.517956,
        "body": "Venus",
        "fromSign": "Virgo",
        "toSign": "Libra",
        "longitude": 180,
        "retrograde": false
    },
    {
        "utc": "2027-09-22T23:32:49Z",
        "jd": 2461671.481125,
        "body": "Vesta",
        "fromSign": "Cancer",
        "toSign": "Leo",
        "longitude": 120,
        "retrograde": false
    },
    {
        "utc": "2027-09-23T06:02:52Z",
        "jd": 2461671.751988,
        "body": "Sun",
        "fromSign": "Virgo",
        "toSign": "Libra",
        "longitude": 180,
        "retrograde": false
    },
    {
        "utc": "2027-09-27T09:10:50Z",
        "jd": 2461675.882523,
        "body": "Mercury",
        "fromSign": "Libra",
        "toSign": "Scorpio",
        "longitude": 210,
        "retrograde": false
    },
    {
        "utc": "2027-10-05T15:36:52Z",
        "jd": 2461684.150604,
        "body": "Ceres",
        "fromSign": "Virgo",
        "toSign": "Libra",
        "longitude": 180,
        "retrograde": false
    },
    {
        "utc": "2027-10-08T04:00:13Z",
        "jd": 2461686.666819,
        "body": "Venus",
        "fromSign": "Libra",
        "toSign": "Scorpio",
        "longitude": 210,
        "retrograde": false
    },
    {
        "utc": "2027-10-10T02:34:16Z",
        "jd": 2461688.607124,
        "body": "Pallas",
        "fromSign": "Leo",
        "toSign": "Virgo",
        "longitude": 150,
        "retrograde": false
    },
    {
        "utc": "2027-10-15T23:15:04Z",
        "jd": 2461694.4688,
        "body": "Mars",
        "fromSign": "Scorpio",
        "toSign": "Sagittarius",
        "longitude": 240,
        "retrograde": false
    },
    {
        "utc": "2027-10-16T07:37:35Z",
        "jd": 2461694.817772,
        "body": "Mercury",
        "fromSign": "Scorpio",
        "toSign": "Libra",
        "longitude": 210,
        "retrograde": true
    },
    {
        "utc": "2027-10-23T15:34:01Z",
        "jd": 2461702.148622,
        "body": "Sun",
        "fromSign": "Libra",
        "toSign": "Scorpio",
        "longitude": 210,
        "retrograde": false
    },
    {
        "utc": "2027-11-01T07:35:41Z",
        "jd": 2461710.816447,
        "body": "Venus",
        "fromSign": "Scorpio",
        "toSign": "Sagittarius",
        "longitude": 240,
        "retrograde": false
    },
    {
        "utc": "2027-11-07T22:17:39Z",
        "jd": 2461717.428928,
        "body": "Juno",
        "fromSign": "Cancer",
        "toSign": "Leo",
        "longitude": 120,
        "retrograde": false
    },
    {
        "utc": "2027-11-10T00:27:28Z",
        "jd": 2461719.51907,
        "body": "Mercury",
        "fromSign": "Libra",
        "toSign": "Scorpio",
        "longitude": 210,
        "retrograde": false
    },
    {
        "utc": "2027-11-22T13:17:22Z",
        "jd": 2461732.053732,
        "body": "Sun",
        "fromSign": "Scorpio",
        "toSign": "Sagittarius",
        "longitude": 240,
        "retrograde": false
    },
    {
        "utc": "2027-11-25T12:00:35Z",
        "jd": 2461735.0004,
        "body": "Venus",
        "fromSign": "Sagittarius",
        "toSign": "Capricorn",
        "longitude": 270,
        "retrograde": false
    },
    {
        "utc": "2027-11-25T18:39:17Z",
        "jd": 2461735.277284,
        "body": "Mars",
        "fromSign": "Sagittarius",
        "toSign": "Capricorn",
        "longitude": 270,
        "retrograde": false
    },
    {
        "utc": "2027-11-29T10:24:44Z",
        "jd": 2461738.933847,
        "body": "Mercury",
        "fromSign": "Scorpio",
        "toSign": "Sagittarius",
        "longitude": 240,
        "retrograde": false
    },
    {
        "utc": "2027-12-13T13:13:47Z",
        "jd": 2461753.051236,
        "body": "Ceres",
        "fromSign": "Libra",
        "toSign": "Scorpio",
        "longitude": 210,
        "retrograde": false
    },
    {
        "utc": "2027-12-18T11:59:13Z",
        "jd": 2461757.999453,
        "body": "Mercury",
        "fromSign": "Sagittarius",
        "toSign": "Capricorn",
        "longitude": 270,
        "retrograde": false
    },
    {
        "utc": "2027-12-19T18:41:22Z",
        "jd": 2461759.278729,
        "body": "Venus",
        "fromSign": "Capricorn",
        "toSign": "Aquarius",
        "longitude": 300,
        "retrograde": false
    },
    {
        "utc": "2027-12-22T02:43:18Z",
        "jd": 2461761.613405,
        "body": "Sun",
        "fromSign": "Sagittarius",
        "toSign": "Capricorn",
        "longitude": 270,
        "retrograde": false
    },
    {
        "utc": "2027-12-23T12:37:28Z",
        "jd": 2461763.026016,
        "body": "Pallas",
        "fromSign": "Virgo",
        "toSign": "Libra",
        "longitude": 180,
        "retrograde": false
    }
];

export const ECLIPSES_2026_2027: EclipseRow[] = [
    {
        "utc": "2026-02-17T12:02:19Z",
        "jd": 2461089.001608,
        "kind": "solar",
        "eclipseType": "annular",
        "longitude": 328.828897,
        "sign": "Aquarius"
    },
    {
        "utc": "2026-03-03T11:39:05Z",
        "jd": 2461102.985469,
        "kind": "lunar",
        "eclipseType": "total",
        "longitude": 162.89816,
        "sign": "Virgo"
    },
    {
        "utc": "2026-08-12T17:37:52Z",
        "jd": 2461265.234634,
        "kind": "solar",
        "eclipseType": "total",
        "longitude": 140.032895,
        "sign": "Leo"
    },
    {
        "utc": "2026-08-28T04:19:42Z",
        "jd": 2461280.680343,
        "kind": "lunar",
        "eclipseType": "partial",
        "longitude": 334.901968,
        "sign": "Pisces"
    },
    {
        "utc": "2027-02-06T15:57:18Z",
        "jd": 2461443.164792,
        "kind": "solar",
        "eclipseType": "annular",
        "longitude": 317.627137,
        "sign": "Aquarius"
    },
    {
        "utc": "2027-02-20T23:24:47Z",
        "jd": 2461457.475544,
        "kind": "lunar",
        "eclipseType": "penumbral",
        "longitude": 152.093092,
        "sign": "Virgo"
    },
    {
        "utc": "2027-08-02T10:06:22Z",
        "jd": 2461619.921089,
        "kind": "solar",
        "eclipseType": "total",
        "longitude": 129.91735,
        "sign": "Leo"
    },
    {
        "utc": "2027-08-17T07:29:51Z",
        "jd": 2461634.812401,
        "kind": "lunar",
        "eclipseType": "penumbral",
        "longitude": 324.196846,
        "sign": "Aquarius"
    }
];

export const STELLIUMS_2026_2027: StelliumRow[] = [
    {
        "startUtc": "2026-01-01T00:00:00Z",
        "endUtc": "2026-01-18T00:00:00Z",
        "durationDays": 17,
        "members": [
            "Mars",
            "Sun",
            "Venus"
        ],
        "centerLongitudeStart": 280.9465,
        "centerSignStart": "Capricorn"
    },
    {
        "startUtc": "2026-01-14T00:00:00Z",
        "endUtc": "2026-01-21T00:00:00Z",
        "durationDays": 7,
        "members": [
            "Mars",
            "Mercury",
            "Sun"
        ],
        "centerLongitudeStart": 291.4131,
        "centerSignStart": "Capricorn"
    },
    {
        "startUtc": "2026-01-20T00:00:00Z",
        "endUtc": "2026-01-24T00:00:00Z",
        "durationDays": 4,
        "members": [
            "Mercury",
            "Pluto",
            "Sun",
            "Venus"
        ],
        "centerLongitudeStart": 301.0761,
        "centerSignStart": "Aquarius"
    },
    {
        "startUtc": "2026-01-22T00:00:00Z",
        "endUtc": "2026-01-23T00:00:00Z",
        "durationDays": 1,
        "members": [
            "Mars",
            "Mercury",
            "Pluto",
            "Sun"
        ],
        "centerLongitudeStart": 301.1481,
        "centerSignStart": "Aquarius"
    },
    {
        "startUtc": "2026-01-24T00:00:00Z",
        "endUtc": "2026-01-28T00:00:00Z",
        "durationDays": 4,
        "members": [
            "Mars",
            "Pluto",
            "Sun"
        ],
        "centerLongitudeStart": 302.2367,
        "centerSignStart": "Aquarius"
    },
    {
        "startUtc": "2026-01-25T00:00:00Z",
        "endUtc": "2026-01-27T00:00:00Z",
        "durationDays": 2,
        "members": [
            "Mercury",
            "Sun",
            "Venus"
        ],
        "centerLongitudeStart": 307.2004,
        "centerSignStart": "Aquarius"
    },
    {
        "startUtc": "2026-03-05T00:00:00Z",
        "endUtc": "2026-03-11T00:00:00Z",
        "durationDays": 6,
        "members": [
            "Neptune",
            "Saturn",
            "Venus"
        ],
        "centerLongitudeStart": 0.2002,
        "centerSignStart": "Aries"
    },
    {
        "startUtc": "2026-03-20T00:00:00Z",
        "endUtc": "2026-03-27T00:00:00Z",
        "durationDays": 7,
        "members": [
            "Neptune",
            "Saturn",
            "Sun"
        ],
        "centerLongitudeStart": 1.7191,
        "centerSignStart": "Aries"
    },
    {
        "startUtc": "2026-04-13T00:00:00Z",
        "endUtc": "2026-04-16T00:00:00Z",
        "durationDays": 3,
        "members": [
            "Mars",
            "Neptune",
            "Saturn"
        ],
        "centerLongitudeStart": 4.7516,
        "centerSignStart": "Aries"
    },
    {
        "startUtc": "2026-04-14T00:00:00Z",
        "endUtc": "2026-04-16T00:00:00Z",
        "durationDays": 2,
        "members": [
            "Mars",
            "Mercury",
            "Neptune"
        ],
        "centerLongitudeStart": 0.8344,
        "centerSignStart": "Aries"
    },
    {
        "startUtc": "2026-04-17T00:00:00Z",
        "endUtc": "2026-04-19T00:00:00Z",
        "durationDays": 2,
        "members": [
            "Mars",
            "Mercury",
            "Neptune",
            "Saturn"
        ],
        "centerLongitudeStart": 5.0894,
        "centerSignStart": "Aries"
    },
    {
        "startUtc": "2026-04-20T00:00:00Z",
        "endUtc": "2026-04-23T00:00:00Z",
        "durationDays": 3,
        "members": [
            "Mars",
            "Mercury",
            "Saturn"
        ],
        "centerLongitudeStart": 7.5459,
        "centerSignStart": "Aries"
    },
    {
        "startUtc": "2027-08-07T00:00:00Z",
        "endUtc": "2027-08-16T00:00:00Z",
        "durationDays": 9,
        "members": [
            "Mercury",
            "Sun",
            "Venus"
        ],
        "centerLongitudeStart": 131.8322,
        "centerSignStart": "Leo"
    },
    {
        "startUtc": "2027-08-25T00:00:00Z",
        "endUtc": "2027-08-30T00:00:00Z",
        "durationDays": 5,
        "members": [
            "Jupiter",
            "Sun",
            "Venus"
        ],
        "centerLongitudeStart": 153.9591,
        "centerSignStart": "Virgo"
    }
];
