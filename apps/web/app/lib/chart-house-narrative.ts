import { SIGN_RULERS, ZODIAC_SIGNS } from "@/app/lib/astro-constants";

/** One-line travel spine copy per house (natal chart "when you travel" panel). */
export const HOUSE_TRAVEL: Record<number, string> = {
  1: "How locals first read you when you arrive.",
  2: "What you spend, earn, and value abroad.",
  3: "Short trips, local excursions, and everyday errands.",
  4: "What makes a foreign place feel like home.",
  5: "Where you play, flirt, and create on the road.",
  6: "Daily rituals, health, and routine when away.",
  7: "The type of stranger you attract overseas.",
  8: "Shared resources, intimacy, and transformation abroad.",
  9: "Long journeys that amplify and expand you.",
  10: "Career opportunities outside your home base.",
  11: "The community and networks you build in transit.",
  12: "Foreign lands where you retreat or dissolve.",
};

export function signNameFromCuspDegree(deg: number): string {
  const n = ((deg % 360) + 360) % 360;
  return ZODIAC_SIGNS[Math.floor(n / 30)] ?? "Aries";
}

/**
 * Template composed from cusp sign, occupants, and traditional ruler.
 * Used by the 12-house accordion on /chart.
 */
export function buildHouseNarration({
  house,
  sphere,
  cuspSign,
  occupants,
  ruler,
  rulerHouse,
  rulerSign,
  rulerDignity,
}: {
  house: number;
  sphere: string;
  cuspSign: string;
  occupants: Array<{ name: string; sign: string; dignity?: string }>;
  ruler: string | null;
  rulerHouse: number | null;
  rulerSign: string | null;
  rulerDignity?: string | null;
}): string {
  const lowerSphere = sphere.toLowerCase();

  let occupantSentence: string;
  if (occupants.length === 0) {
    occupantSentence = `Empty of planets — your ${lowerSphere} runs on ${cuspSign}'s cue.`;
  } else {
    const names = occupants.map((o) => o.name);
    const joined =
      names.length === 1
        ? names[0]
        : names.length === 2
          ? `${names[0]} and ${names[1]}`
          : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
    const verb = names.length === 1 ? "occupies" : "occupy";
    const standoutDignity = occupants.find((o) => {
      const d = (o.dignity ?? "").toLowerCase();
      return d.includes("domicile") || d.includes("exalt") || d.includes("detriment") || d.includes("fall");
    });
    const dignityTag = standoutDignity
      ? ` (${standoutDignity.name} in ${standoutDignity.dignity?.toLowerCase()})`
      : "";
    occupantSentence = `${joined} ${verb} your ${lowerSphere} in ${cuspSign}${dignityTag}.`;
  }

  let rulerSentence = "";
  if (!ruler) {
    rulerSentence = "";
  } else if (rulerHouse === house) {
    rulerSentence = `${ruler} rules here and lives here — self-contained, no translation needed.`;
  } else if (rulerHouse && rulerSign) {
    const dig = (rulerDignity ?? "").toLowerCase();
    let dignityClause = "";
    if (dig.includes("domicile")) dignityClause = ", where it operates at full strength";
    else if (dig.includes("exalt")) dignityClause = ", where it's amplified";
    else if (dig.includes("detriment")) dignityClause = ", where it sits in detriment and scatters";
    else if (dig.includes("fall")) dignityClause = ", where it's in fall";
    rulerSentence = `${ruler} rules from H${rulerHouse} in ${rulerSign}${dignityClause}.`;
  } else {
    rulerSentence = `${ruler} rules the sign on the cusp.`;
  }

  return rulerSentence ? `${occupantSentence} ${rulerSentence}` : occupantSentence;
}

export function parseAspectOrbString(orb?: string): number {
  if (!orb) return 99;
  const m = orb.match(/(-?\d+)°\s*(\d+)/);
  return m ? parseInt(m[1], 10) + parseInt(m[2], 10) / 60 : 99;
}

function aspectEndpoints(a: {
  aspect: string;
  planet1?: string;
  planet2?: string;
}): { p1: string; p2: string } {
  if (a.planet1 && a.planet2) {
    return { p1: a.planet1, p2: a.planet2 };
  }
  const parts = (a.aspect || "").trim().split(/\s+/);
  if (parts.length >= 3) {
    return { p1: parts[0], p2: parts[parts.length - 1] };
  }
  return { p1: "", p2: "" };
}

/**
 * Top aspects to spotlight: prefer chart ruler + Sun + Moon, then tightest orbs.
 */
type AspectRow = {
  aspect: string;
  type?: string;
  orb: string;
  planet1?: string;
  planet2?: string;
  verdict?: number;
};

export function pickSignatureAspects(
  aspects: AspectRow[],
  ascendantSign: string | undefined
): AspectRow[] {
  if (!aspects.length) return [];
  const rulerName = ascendantSign
    ? SIGN_RULERS[ascendantSign] ?? "Sun"
    : "Sun";
  const priority = new Set([rulerName, "Sun", "Moon"].map((s) => s.toLowerCase()));

  return [...aspects]
    .map((a) => {
      const { p1, p2 } = aspectEndpoints(a);
      const p1l = p1.toLowerCase();
      const p2l = p2.toLowerCase();
      const hit =
        (p1l && priority.has(p1l)) || (p2l && priority.has(p2l)) ? 0 : 1;
      return { a, _p: hit * 10 + parseAspectOrbString(a.orb) };
    })
    .sort((x, y) => x._p - y._p)
    .slice(0, 3)
    .map((x) => x.a);
}

export function buildOccupantsByHouse(
  bodies: Array<{ name: string; house?: number; isAngle?: boolean }>
): Map<number, typeof bodies> {
  const m = new Map<number, typeof bodies>();
  for (const p of bodies) {
    if (p.isAngle) continue;
    if (p.house == null) continue;
    const arr = m.get(p.house) ?? [];
    arr.push(p);
    m.set(p.house, arr);
  }
  return m;
}
