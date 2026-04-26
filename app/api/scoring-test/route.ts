import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { birthToUtc } from "@/lib/astro/birth-utc";
import { SwissEphSingleton, computeRealtimePositions } from "@/lib/astro/transits";
import { resolveACGFull, computeParans } from "@/lib/astro/acg-lines";
import { solve12MonthTransits } from "@/lib/astro/transit-solver";
import {
  computeHouseMatrix,
  mapTransitsToMatrix,
  computeGlobalPenalty,
  type MatrixNatalPlanet,
  type MatrixACGLine,
  type MatrixParan,
} from "@/app/lib/house-matrix";
import { computeEventScores, type OccupancyPlanet } from "@/app/lib/scoring-engine";
import { houseFromLongitude } from "@/app/lib/geodetic";
import { essentialDignityLabel } from "@/app/lib/dignity";
import { determineSect, computeLotOfFortune, computeLotOfSpirit } from "@/app/lib/arabic-parts";

interface ScoringLocation {
  label: string;
  lat: number;
  lon: number;
}

interface ScoringBody {
  name?: string;
  birthDate?: string;
  birthTime?: string;
  travelDate?: string;
  travelTime?: string;
  birthPlace?: ScoringLocation;
  travelLocation?: ScoringLocation;
}

interface SwissHouseResult {
  cusps: Record<string, number>;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidLocation(value: unknown): value is ScoringLocation {
  if (!value || typeof value !== "object") return false;
  const location = value as Partial<ScoringLocation>;
  return (
    typeof location.label === "string" &&
    location.label.trim().length > 0 &&
    isFiniteNumber(location.lat) &&
    isFiniteNumber(location.lon)
  );
}

function validatePayload(body: ScoringBody): string | null {
  if (!body.name?.trim()) return "Name is required.";
  if (!body.birthDate) return "Birth date is required.";
  if (!body.birthTime) return "Birth time is required.";
  if (!body.travelDate) return "Travel date is required.";
  if (!body.travelTime) return "Travel time is required.";
  if (!isValidLocation(body.birthPlace)) return "Birth place coordinates are required.";
  if (!isValidLocation(body.travelLocation)) return "Travel location coordinates are required.";
  return null;
}

async function computeCusps(dtUtc: Date, lat: number, lon: number): Promise<number[]> {
  const swe = await SwissEphSingleton.getInstance();
  const jd = swe.julday(
    dtUtc.getUTCFullYear(),
    dtUtc.getUTCMonth() + 1,
    dtUtc.getUTCDate(),
    dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0 + dtUtc.getUTCSeconds() / 3600.0,
  );
  const system = Math.abs(lat) >= 66 ? "W" : "P";
  const houses = swe.houses(jd, lat, lon, system) as SwissHouseResult;
  const cusps: number[] = [];
  for (let i = 1; i <= 12; i++) {
    cusps.push(houses.cusps[i.toString()]);
  }
  return cusps;
}

function normalizeTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

function planetName(planet: MatrixNatalPlanet): string {
  return planet.planet || planet.name || "";
}

function storageErrorMessage(error: { code?: string; message?: string }): string {
  if (error.code === "PGRST205" || error.message?.includes("scoring_test_results")) {
    return "Score computed, but the scoring_test_results table is missing. Apply the Supabase migration, then run this test again.";
  }

  return "Score computed, but the result could not be stored.";
}

function buildHouseExplanation(house: {
  house: number;
  sphere: string;
  score: number;
  status: string;
  breakdown: Record<string, number>;
}): string {
  const strongest = Object.entries(house.breakdown)
    .filter(([, value]) => typeof value === "number")
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");

  return `House ${house.house} (${house.sphere}) scored ${house.score}, landing at "${house.status}". Largest scoring contributors: ${strongest || "none"}.`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ScoringBody;
    const validationError = validatePayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const name = body.name!.trim();
    const birthDate = body.birthDate!;
    const birthTime = normalizeTime(body.birthTime!);
    const travelDateInput = body.travelDate!;
    const travelTime = normalizeTime(body.travelTime!);
    const birthPlace = body.birthPlace!;
    const travelLocation = body.travelLocation!;
    const travelDate = await birthToUtc(travelDateInput, travelTime, travelLocation.lat, travelLocation.lon);

    const dtUtc = await birthToUtc(birthDate, birthTime, birthPlace.lat, birthPlace.lon);
    const natalCusps = await computeCusps(dtUtc, birthPlace.lat, birthPlace.lon);
    const natalPositions = await computeRealtimePositions(dtUtc, natalCusps);
    const natalPlanets: MatrixNatalPlanet[] = natalPositions.map((planet) => ({
      planet: planet.name,
      name: planet.name,
      sign: planet.sign,
      longitude: planet.longitude,
      retrograde: planet.is_retrograde,
      house: planet.house,
      dignity: essentialDignityLabel(planet.name, planet.sign),
      speed: planet.speed,
    }));

    const relocatedCusps = await computeCusps(dtUtc, travelLocation.lat, travelLocation.lon);
    const { cityLines: acgLines, allLines } = await resolveACGFull(dtUtc, travelLocation.lat, travelLocation.lon);
    const rawTransits = await solve12MonthTransits(natalPlanets, travelDate);
    const mappedTransits = mapTransitsToMatrix(rawTransits, natalPlanets, relocatedCusps, birthPlace.lat);
    const globalPenalty = computeGlobalPenalty(rawTransits);
    const parans = computeParans(allLines, travelLocation.lat);

    const sunPlanet = natalPlanets.find((planet) => planetName(planet).toLowerCase() === "sun");
    const moonPlanet = natalPlanets.find((planet) => planetName(planet).toLowerCase() === "moon");
    const relocatedAsc = relocatedCusps[0] ?? 0;
    const sect = sunPlanet ? determineSect(sunPlanet.longitude, relocatedAsc) : undefined;
    const lotOfFortuneLon = sunPlanet && moonPlanet
      ? computeLotOfFortune(relocatedAsc, sunPlanet.longitude, moonPlanet.longitude, sect)
      : undefined;
    const lotOfSpiritLon = sunPlanet && moonPlanet
      ? computeLotOfSpirit(relocatedAsc, sunPlanet.longitude, moonPlanet.longitude, sect)
      : undefined;

    const matrixResult = computeHouseMatrix({
      natalPlanets,
      relocatedCusps,
      acgLines: acgLines as MatrixACGLine[],
      transits: mappedTransits,
      parans: parans as MatrixParan[],
      destLat: travelLocation.lat,
      destLon: travelLocation.lon,
      globalPenalty,
      birthLat: birthPlace.lat,
      lotOfFortuneLon,
      lotOfSpiritLon,
      sect,
    });

    const relocatedPlanets: OccupancyPlanet[] = natalPlanets.map((planet) => ({
      name: planetName(planet),
      house: houseFromLongitude(planet.longitude, relocatedAsc),
      dignityStatus: planet.dignity,
      hasLine: acgLines.some((line) => line.planet.toLowerCase() === planetName(planet).toLowerCase()),
    }));
    const eventScores = computeEventScores(matrixResult, relocatedPlanets);
    const houseScores = matrixResult.houses.map((house) => ({
      house: house.house,
      sphere: house.sphere,
      relocatedSign: house.relocatedSign,
      rulerPlanet: house.rulerPlanet,
      rulerCondition: house.rulerCondition,
      score: house.score,
      status: house.status,
      breakdown: house.breakdown,
    }));

    const rawInput = {
      name,
      birthDate,
      birthTime,
      travelDate: travelDateInput,
      travelTime,
      birthPlace,
      travelLocation,
      birthDateUtc: dtUtc.toISOString(),
      travelDateUtc: travelDate.toISOString(),
    };
    const rawOutput = {
      macroScore: matrixResult.macroScore,
      macroVerdict: matrixResult.macroVerdict,
      houseSystem: matrixResult.houseSystem,
      explanations: {
        overall: `The macro score is ${matrixResult.macroScore} (${matrixResult.macroVerdict}) using ${matrixResult.houseSystem} houses.`,
        houses: houseScores.map(buildHouseExplanation),
        events: eventScores.map((event) =>
          `${event.eventName}: base ${event.baseVolume}, affinity ${event.affinityModifier}, final ${event.finalScore} (${event.verdict}).`,
        ),
      },
      houses: houseScores,
      eventScores,
      aspects: {
        transitHits: rawTransits,
        mappedTransits,
      },
      natalPlanets,
      relocatedPlanets,
      natalCusps,
      relocatedCusps,
      natalAngles: {
        ASC: natalCusps[0],
        IC: natalCusps[3],
        DSC: natalCusps[6],
        MC: natalCusps[9],
      },
      relocatedAngles: {
        ASC: relocatedCusps[0],
        IC: relocatedCusps[3],
        DSC: relocatedCusps[6],
        MC: relocatedCusps[9],
      },
      acgLines,
      parans,
      lots: {
        lotOfFortuneLon,
        lotOfSpiritLon,
      },
      sect,
      globalPenalty,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("scoring_test_results")
      .insert({
        user_id: user.id,
        name,
        birth_place: birthPlace.label,
        birth_lat: birthPlace.lat,
        birth_lon: birthPlace.lon,
        birth_date: birthDate,
        birth_time: birthTime,
        travel_location: travelLocation.label,
        travel_lat: travelLocation.lat,
        travel_lon: travelLocation.lon,
        travel_time: travelTime,
        travel_date: travelDate.toISOString(),
        macro_score: matrixResult.macroScore,
        macro_verdict: matrixResult.macroVerdict,
        house_scores: houseScores,
        event_scores: eventScores,
        raw_input: rawInput,
        raw_output: rawOutput,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[/api/scoring-test] insert failed", insertError);
      return NextResponse.json({
        resultId: null,
        macroScore: matrixResult.macroScore,
        macroVerdict: matrixResult.macroVerdict,
        houseSystem: matrixResult.houseSystem,
        houses: houseScores,
        eventScores,
        rawInput,
        rawOutput,
        storageWarning: storageErrorMessage(insertError),
      });
    }

    return NextResponse.json({
      resultId: inserted.id,
      macroScore: matrixResult.macroScore,
      macroVerdict: matrixResult.macroVerdict,
      houseSystem: matrixResult.houseSystem,
      houses: houseScores,
      eventScores,
      rawInput,
      rawOutput,
    });
  } catch (error) {
    console.error("[/api/scoring-test]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scoring test failed." },
      { status: 500 },
    );
  }
}
