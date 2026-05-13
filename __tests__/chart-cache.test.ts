import { describe, expect, it } from "bun:test";
import { natalCacheMatchesProfile, natalCuspsFromCache } from "@/lib/astro/chart-cache";

const profile = {
  birth_date: "1975-12-21",
  birth_time: "01:20:00",
  birth_lat: 53.8560526,
  birth_lon: 13.688091,
};

const expectedUtc = new Date("1975-12-21T00:20:00.000Z");

function chart(overrides: Record<string, unknown> = {}) {
  return {
    ephemeris_data: {
      planets: [{ name: "Sun", longitude: 268.5 }],
      profile_time: expectedUtc.toISOString(),
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      birth_lat: profile.birth_lat,
      birth_lon: profile.birth_lon,
      cusps: Array.from({ length: 12 }, (_, i) => i * 30),
      ...overrides,
    },
  };
}

describe("natal chart cache profile guard", () => {
  it("accepts a cache whose birth metadata and UTC instant match the profile", () => {
    expect(natalCacheMatchesProfile(chart(), profile, expectedUtc)).toBe(true);
  });

  it("rejects a stale cache from a previous profile save", () => {
    expect(natalCacheMatchesProfile(
      chart({
        profile_time: "1990-12-23T07:57:00.000Z",
        birth_date: "1990-12-23",
        birth_time: "15:57:00",
        birth_lat: 1.357107,
        birth_lon: 103.8194992,
      }),
      profile,
      expectedUtc,
    )).toBe(false);
  });

  it("keeps old cache rows usable when profile_time matches but birth metadata was not stored yet", () => {
    expect(natalCacheMatchesProfile(
      chart({
        birth_date: undefined,
        birth_time: undefined,
        birth_lat: undefined,
        birth_lon: undefined,
      }),
      profile,
      expectedUtc,
    )).toBe(true);
  });

  it("reads cusps from all historical cache shapes", () => {
    const cusps = Array.from({ length: 12 }, (_, i) => i + 1);

    expect(natalCuspsFromCache({ ephemeris_data: { cusps } })).toEqual(cusps);
    expect(natalCuspsFromCache({ house_placements: { cusps } })).toEqual(cusps);
    expect(natalCuspsFromCache({ cusps_data: { cusps } })).toEqual(cusps);
  });
});
