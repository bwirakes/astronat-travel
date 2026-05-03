import { SwissEphSingleton, getHouse, ZODIAC_SIGNS, computeRealtimePositions } from "./lib/astro/transits";
import { birthToUtc } from "./lib/astro/birth-utc";
import { calculateAspect } from "./lib/astro/aspects";
import { essentialDignityLabel } from "./app/lib/dignity";

async function main() {
  const dtUtc = await birthToUtc(
    "1995-05-05",
    "12:00",
    -6.9175, // Bandung lat
    107.6191 // Bandung lon
  );

  const swe = await SwissEphSingleton.getInstance();
  const year = dtUtc.getUTCFullYear();
  const month = dtUtc.getUTCMonth() + 1;
  const day = dtUtc.getUTCDate();
  const hour = dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0 + dtUtc.getUTCSeconds() / 3600.0;
  
  const jd = swe.julday(year, month, day, hour);
  
  // Calculate houses
  const h = swe.houses(jd, -6.9175, 107.6191, 'P') as any;
  const cuspsArray: number[] = [];
  for (let i = 1; i <= 12; i++) {
      cuspsArray.push(h.cusps[i.toString()]);
  }

  const computedPlanets = await computeRealtimePositions(dtUtc, cuspsArray);

  const planets = computedPlanets.map((p: any) => ({
      name: p.name,
      sign: p.sign,
      house: p.house,
      dignity: essentialDignityLabel(p.name, p.sign).toUpperCase(),
  }));

  const asc = h.ascmc["0"];
  
  console.log("Ascendant:", ZODIAC_SIGNS[Math.floor(asc / 30)]);
  console.log("Chart Ruler:", ZODIAC_SIGNS[Math.floor(asc / 30)] === "Leo" ? "Sun" : ZODIAC_SIGNS[Math.floor(asc / 30)] === "Cancer" ? "Moon" : "..."); // simplifying
  console.log("Planets:", JSON.stringify(planets, null, 2));
}

main().catch(console.error);
