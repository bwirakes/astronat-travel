import { SwissEphSingleton, getHouse, ZODIAC_SIGNS, computeRealtimePositions } from "./lib/astro/transits";
import { birthToUtc } from "./lib/astro/birth-utc";
import { calculateAspect } from "./lib/astro/aspects";
import { essentialDignityLabel } from "./app/lib/dignity";

async function main() {
  const dtUtc = await birthToUtc(
    "1988-08-17",
    "22:15",
    -6.2088, // Jakarta lat
    106.8456 // Jakarta lon
  );

  const swe = await SwissEphSingleton.getInstance();
  const year = dtUtc.getUTCFullYear();
  const month = dtUtc.getUTCMonth() + 1;
  const day = dtUtc.getUTCDate();
  const hour = dtUtc.getUTCHours() + dtUtc.getUTCMinutes() / 60.0 + dtUtc.getUTCSeconds() / 3600.0;
  
  const jd = swe.julday(year, month, day, hour);
  
  // Calculate houses
  const h = swe.houses(jd, -6.2088, 106.8456, 'P') as any;
  const cuspsArray: number[] = [];
  for (let i = 1; i <= 12; i++) {
      cuspsArray.push(h.cusps[i.toString()]);
  }

  // Compute standard planets
  const computedPlanets = await computeRealtimePositions(dtUtc, cuspsArray);

  const planets = computedPlanets.map((p: any) => ({
      name: p.name,
      sign: p.sign,
      house: p.house,
      dignity: essentialDignityLabel(p.name, p.sign).toUpperCase(),
      deg: p.degree_in_sign
  }));

  const asc = h.ascmc["0"];
  const mc = h.ascmc["1"];
  
  console.log("Ascendant:", ZODIAC_SIGNS[Math.floor(asc / 30)], asc % 30);
  console.log("MC:", ZODIAC_SIGNS[Math.floor(mc / 30)], mc % 30);
  console.log("Planets:", JSON.stringify(planets, null, 2));

  // Compute Aspects
  const aspects = [];
  for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
          const p1 = computedPlanets[i];
          const p2 = computedPlanets[j];
          const result = calculateAspect(p1.longitude, p2.longitude, p1.name, p2.name);
          if (result && result.orb < 5) {
              aspects.push({
                  aspect: `${p1.name} ${result.aspect} ${p2.name}`,
                  orb: result.orb
              });
          }
      }
  }
  console.log("Aspects:", JSON.stringify(aspects, null, 2));
}

main().catch(console.error);
