import type {
    CriteriaCount,
    GeodeticRiskTier,
    GeodeticWeatherEvent,
    SourceWeatherEvent,
    WeatherEventType,
} from "./weather-types";

type WeatherTypeToken = {
    label: string;
    accent: string;
    bg: string;
};

const HEATMAP_SIZE = 360;
const HEATMAP_ORB_DEGREES = 18;

const TIER_LABELS: Record<GeodeticRiskTier, string> = {
    critical: "Critical",
    high: "High",
    moderate: "Moderate",
    watch: "Watch",
    low: "Low",
};

const TIER_ACCENTS: Record<GeodeticRiskTier, string> = {
    critical: "var(--color-spiced-life)",
    high: "var(--gold)",
    moderate: "var(--color-acqua)",
    watch: "var(--sage)",
    low: "var(--text-tertiary)",
};

export const TYPE_TOKEN: Record<WeatherEventType, WeatherTypeToken> = {
    flood: { label: "Flood", accent: "var(--color-y2k-blue)", bg: "color-mix(in oklab, var(--color-y2k-blue) 12%, transparent)" },
    wildfire: { label: "Wildfire", accent: "var(--color-spiced-life)", bg: "color-mix(in oklab, var(--color-spiced-life) 16%, transparent)" },
    storm_cyclone: { label: "Storm / cyclone", accent: "var(--color-acqua)", bg: "color-mix(in oklab, var(--color-acqua) 16%, transparent)" },
    earthquake: { label: "Seismic", accent: "var(--text-secondary)", bg: "color-mix(in oklab, var(--text-secondary) 12%, transparent)" },
    heatwave: { label: "Heatwave", accent: "var(--gold)", bg: "color-mix(in oklab, var(--gold) 16%, transparent)" },
    tornado: { label: "Tornado", accent: "var(--sage)", bg: "color-mix(in oklab, var(--sage) 12%, transparent)" },
    winter_storm: { label: "Winter storm", accent: "var(--color-acqua)", bg: "color-mix(in oklab, var(--color-acqua) 12%, transparent)" },
    compound: { label: "Compound", accent: "var(--gold)", bg: "color-mix(in oklab, var(--gold) 13%, transparent)" },
};

export function tierFromPss(pss: number): GeodeticRiskTier {
    if (pss >= 0.70) return "critical";
    if (pss >= 0.55) return "high";
    if (pss >= 0.40) return "moderate";
    if (pss >= 0.30) return "watch";
    return "low";
}

export function tierLabel(tier: GeodeticRiskTier): string {
    return TIER_LABELS[tier];
}

export function tierAccent(tier: GeodeticRiskTier): string {
    return TIER_ACCENTS[tier];
}

function slug(input: string): string {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function crit(met: number, total: number, key: string): CriteriaCount {
    return { met, total, key };
}

export const HISTORICAL_EVENTS: SourceWeatherEvent[] = [
    { date: "2024-01-02", title: "Storm Henk/Annelie — UK/Europe", type: "storm_cyclone", severity: 2, deaths: 0, damageBillions: 2.0, pss: 0.31, stars: [], notes: "Uranus direct 19° Taurus Jan 27 shortly after", pair: null, geostress: null, source: "Wikipedia Weather 2024", criteria: crit(2, 15, "T1 Uranus-D decay (Jan 27 +25d) · T9 outer aspect") },
    { date: "2024-06-28", title: "Hurricane Beryl — earliest Cat 5 Atlantic ever", type: "storm_cyclone", severity: 4, deaths: 73, damageBillions: 7.0, pss: 0.58, stars: ["Scheat (29°♓ — Neptune near)"], notes: "Neptune 29° Pisces conjunct Scheat; Saturn Rx approaching 19° Pisces", pair: null, geostress: "Uranus ♉ / Pluto ♒ Fixed sq background", source: "NOAA NCEI; Wikipedia 2024", criteria: crit(4, 15, "T2 Saturn Rx station Jun 29 (+1d) · T4 Scheat/Neptune · T9 outer aspect · T13 geostress") },
    { date: "2024-09-06", title: "Typhoon Yagi — Myanmar/Vietnam (805 dead)", type: "storm_cyclone", severity: 4, deaths: 805, damageBillions: 12.0, pss: 0.56, stars: ["Pleiades (Uranus Rx 27° Tau)", "Chiron 19°♈ (Mars ♋ sq — pioneer death toll)"], notes: "Uranus Rx 27° Taurus within 2° Pleiades; Mars sq Saturn; Mars sq Chiron ♈", pair: null, geostress: "Uranus ♉ / Pluto ♒ Fixed sq; Mars trigger on Pluto degree", source: "EM-DAT 2024", criteria: crit(8, 15, "T1 Jupiter Rx station Oct 9 (33d) · T3 Oct 2 eclipse 26d · T4 Pleiades+Chiron · T9 Mars sq Saturn · T10 Sep 17 partial lunar (−11d) · T12 Mars trigger Pluto° · T13 Fixed sq · T14 Chiron") },
    { date: "2024-09-26", title: "Hurricane Helene — Cat 4, deadliest US since Katrina", type: "flood", severity: 5, deaths: 225, damageBillions: 78.7, pss: 0.78, stars: ["Scheat (Neptune 27°♓)", "Pleiades (Uranus Rx)", "Chiron 19°♈ (Mars ♋ sq exact — deadliest US storm since Katrina)"], notes: "Saturn Rx 12°♓; Neptune 27°♓ Scheat exact; Sep 17 eclipse −9d; OOB Mars; Mars sq Chiron exact = pioneer casualty signature", pair: "Pair A corridor (Oct 2 annular approaching +6d)", geostress: "Uranus/Pluto Fixed sq; Pluto 29°♑ anaretic sq Aries/Libra bending", source: "NOAA NCEI 2025", criteria: crit(12, 15, "T1 Jupiter Rx 13d · T2 Uranus Rx ~25d · T3 Oct 2 annular+6d & Sep 17 partial · T4 Scheat+Pleiades+Chiron · T5 Pluto 29°♑ · T6 OOB Mars · T9 outer aspect · T10 Sep 17 partial lunar −9d · T11 Pair A · T12 Mars sq Chiron exact · T13 Fixed sq · T14 Chiron") },
    { date: "2024-10-09", title: "Hurricane Milton — Tampa, Cat 3", type: "storm_cyclone", severity: 4, deaths: 24, damageBillions: 34.3, pss: 0.64, stars: ["Scheat (Neptune 27°♓)", "Chiron 19°♈ (Mars ♋ sq)"], notes: "Jupiter Rx STATIONS at 21°♊ on day of landfall; Saturn Rx 12°♓; Mars sq Chiron ♈ continuing", pair: "Pair A — Oct 2 annular exact anchor (−7d from today)", geostress: "Uranus ♉ / Pluto ♒ Fixed sq; Jupiter station direct trigger", source: "NOAA NCEI 2025", criteria: crit(10, 15, "T1 Jupiter station direct exact · T2 Uranus Rx ~38d · T3 Oct 2 annular −7d · T4 Scheat+Chiron · T5 Pluto 29°♑ · T9 Mars sq outer · T11 Pair A anchor · T12 Jupiter station Phase 2 trigger · T13 Fixed sq · T14 Chiron") },
    { date: "2024-10-29", title: "Valencia Spain DANA floods — 224 dead", type: "flood", severity: 5, deaths: 224, damageBillions: 11.0, pss: 0.81, stars: ["Scheat (Neptune 27°♓ exact)", "Pleiades", "Chiron 19°♈ (Mars ♋ sq — most lethal EU flood in decades)"], notes: "Most lethal European flood in decades. Saturn Rx 13°♓; Neptune Scheat exact; OOB Moon; Mars sq Chiron = pioneer regional casualty scale", pair: "Pair A — Oct 2 annular (−27d)", geostress: "Uranus/Pluto Fixed sq; Pluto 29°♑ anaretic sq bending", source: "US News; Yale Climate Connections", criteria: crit(9, 15, "T1 Jupiter station 20d · T3 Oct 2 annular −27d · T4 Scheat+Pleiades+Chiron · T5 Pluto 29°♑ · T6 OOB Moon · T9 outer aspect · T11 Pair A · T13 Fixed sq · T14 Chiron") },
    { date: "2025-01-07", title: "LA Palisades & Eaton fires — costliest wildfires in world history", type: "wildfire", severity: 5, deaths: 29, damageBillions: 65.0, pss: 0.83, stars: ["Algol (Uranus 23°♉)", "Pleiades (Uranus 23°♉)", "Chiron 21°♈ (Mars Rx ♋ sq — costliest wildfire in history)"], notes: "Mars Rx Cancer; Uranus Rx 23°♉ near Algol/Pleiades; OOB Mars; Santa Ana winds; Mars Rx sq Chiron ♈ = costliest-ever Chiron pioneer signature. ⚠ deaths VERIFY: ~29 confirmed, 482 is likely incorrect", pair: "Pair A corridor — between Oct 2 '24 and Mar 29 '25 eclipses", geostress: "T-Sq: Mars Rx ♋ sq Uranus ♉ / Pluto ♒ (Cardinal apex, Fixed base)", source: "Gallagher Re 2025 — deaths ⚠ VERIFY", criteria: crit(9, 15, "T2 Mars Rx station Dec 6 (32d) · T3 Mar 29 eclipse 81d · T4 Algol+Pleiades+Chiron · T6 OOB Mars (multiplier) · T9 outer aspect · T11 Pair A · T12 Mars Rx sq Chiron Phase 2 · T13 Cardinal T-Sq · T14 Chiron") },
    { date: "2025-01-20", title: "Historic Gulf Coast winter storm — records Louisiana/Florida", type: "winter_storm", severity: 3, deaths: 10, damageBillions: 3.0, pss: 0.38, stars: [], notes: "Saturn in Pisces; Uranus Rx Taurus; coldest January in 10 years", pair: "Pair A corridor", geostress: "Uranus/Pluto Fixed sq background", source: "Wikipedia Weather 2025", criteria: crit(4, 15, "T2 Mars Rx 45d · T3 Mar 29 eclipse 68d · T11 Pair A · T13 Fixed sq") },
    { date: "2025-04-02", title: "Tornado outbreak + flash flooding — US South/Midwest", type: "tornado", severity: 4, deaths: 40, damageBillions: 4.5, pss: 0.51, stars: ["Aldebaran (Mars in Aries/Gemini)"], notes: "Jupiter Cancer sq Aries planets; Mars direct mid-Aries", pair: "Post Pair A (Mar 29 eclipse just passed)", geostress: "Cardinal T-Sq building: Jupiter ♋ sq Saturn/Neptune ♈", source: "Wikipedia Weather 2025", criteria: crit(6, 15, "T2 Mars direct station Feb 24 (37d) · T3 Mar 29 partial solar −4d · T4 Aldebaran · T9 Jupiter sq Aries · T11 Pair A post-window · T13 Cardinal T-Sq") },
    { date: "2025-05-16", title: "EF4 Kentucky + EF3 St. Louis — 28 dead", type: "tornado", severity: 4, deaths: 28, damageBillions: 2.5, pss: 0.52, stars: ["Aldebaran"], notes: "Jupiter 17°♋ sq Aries stellium; Mars in Aries; EF3 140mph St. Louis. Saturn enters Aries May 24 (8d later — approaches ingress)", pair: null, geostress: "Cardinal T-Sq: Jupiter ♋ sq Saturn ♈ / Neptune ♈", source: "ABC News Dec 2025", criteria: crit(5, 15, "T3 Mar 29 eclipse 48d · T4 Aldebaran · T7 Aries stellium (Mars+Neptune+Chiron) · T9 Jupiter sq Aries · T13 Cardinal T-Sq") },
    { date: "2025-06-20", title: "EF-5 Enderlin ND — first EF5 in US in 10+ years", type: "tornado", severity: 5, deaths: 0, damageBillions: 1.5, pss: 0.62, stars: ["Aldebaran (Mars sq Uranus)", "Antares (Sun opp Solstice)"], notes: "210mph winds. Mars sq Uranus; Summer Solstice 0°♋ world point; Uranus 28°♉ — 17d before Gemini ingress (Jul 7)", pair: null, geostress: "Cardinal T-Sq: Jupiter ♋ sq Saturn ♈; Mars trigger on Uranus ingress degree", source: "ABC News Dec 2025", criteria: crit(7, 15, "T3 Mar 29 eclipse 83d · T4 Aldebaran+Antares · T8 Solstice Sun ingress 0°♋ · T9 Mars sq Uranus · T12 Mars trigger Uranus° · T13 Cardinal T-Sq · T14 Chiron") },
    { date: "2025-07-04", title: "Texas Hill Country flash floods — deadliest US inland flood in 50 years", type: "flood", severity: 5, deaths: 135, damageBillions: 5.0, pss: 0.73, stars: ["Fomalhaut (Neptune 3°♈)", "Chiron ~21°♈ (Jupiter ♋ sq — deadliest US inland flood in 50 yrs)"], notes: "MCV 20\" in 6h. Neptune 3°♈ (Fomalhaut); Saturn 8°♈; Jupiter Cancer sq Chiron ♈ within ~4° = pioneer regional flood signature. Uranus enters Gemini Jul 7 (+3d)", pair: null, geostress: "Cardinal T-Sq: Jupiter ♋ sq Saturn ♈ at near-exact; Mars trigger", source: "Climate Central 2025", criteria: crit(7, 15, "T4 Fomalhaut+Chiron · T7 Aries stellium (Sat+Nep+Chiron) · T8 Uranus Gemini ingress +3d · T9 Jupiter sq Aries · T12 Mars trigger · T13 Cardinal T-Sq · T14 Chiron") },
    { date: "2025-07-15", title: "European heatwave — ⚠ deaths VERIFY", type: "heatwave", severity: 5, deaths: 24000, damageBillions: 8.0, pss: 0.71, stars: ["Antares (Sun opp 9°♐)", "Regulus (Mars in Leo)", "Chiron ~22°♈ (Sun ♋ sq ~1° orb)"], notes: "Mars in Leo near Regulus; Sun at ~23°♋ sq Chiron 22°♈ within 1°; Sun opp Antares. ⚠ Deaths 24,000 needs verification — Sun sq Chiron = 'record-breaking' heat pioneer", pair: null, geostress: "Cardinal T-Sq: Jupiter late ♋ sq Saturn ♈; Sun trigger crossing Antares opp degree", source: "Yale Climate Connections Jan 2026 — ⚠ VERIFY ALL FIGURES", criteria: crit(7, 15, "T4 Antares+Regulus+Chiron · T7 Aries stellium (Sat+Nep+Chiron) · T8 Mars ingress Leo · T9 outer aspect · T12 Sun Phase 2 trigger sq Chiron · T13 Cardinal T-Sq · T14 Chiron") },
    { date: "2025-10-28", title: "Hurricane Melissa — Cat 5 landfall Jamaica", type: "storm_cyclone", severity: 5, deaths: 200, damageBillions: 6.0, pss: 0.60, stars: ["Scheat (Neptune ♈ opp)"], notes: "First Cat 5 landfall Jamaica since 1988. Mars triggering Saturn/Neptune midpoint", pair: null, geostress: "Mars Phase 2 trigger: crossed Saturn/Neptune midpoint degree", source: "WWA 2025; Earth.org Jan 2026", criteria: crit(5, 15, "T1 Saturn direct Nov 27 (30d) · T4 Scheat · T9 Neptune ♈ opposition · T12 Mars trigger Sa/Ne midpoint · T13 Cardinal T-Sq") },
    { date: "2025-11-22", title: "Indonesia/Malaysia overlapping cyclones — 1,800 dead", type: "flood", severity: 5, deaths: 1800, damageBillions: 25.0, pss: 0.76, stars: ["Scheat (opp from 29°♍)", "Pleiades"], notes: "Two overlapping tropical cyclones. Saturn 15°♈; Neptune 5°♈. Sa/Ne midpoint over SE Asia.", pair: null, geostress: "Saturn direct station Nov 27 (+5d) = Phase 2 trigger releasing 3-month pressure", source: "Earth.org Jan 2026; Christian Aid 2025", criteria: crit(6, 15, "T1 Saturn direct station +5d · T3 Feb 17 eclipse 87d · T4 Scheat+Pleiades · T7 Aries stellium (Sat+Nep+Chiron) · T9 Sa/Ne midpoint · T13 compound pattern") },
    { date: "2025-11-28", title: "Cyclone Senyar — Thailand/Indonesia (1,482 dead)", type: "storm_cyclone", severity: 5, deaths: 1482, damageBillions: 9.0, pss: 0.74, stars: ["Scheat", "Pleiades"], notes: "Exceptionally rare tropical cyclone in Thailand. Saturn direct station exact Nov 27 (−1d).", pair: null, geostress: "Saturn direct station = Phase 2 trigger; Sa/Ne midpoint over Thai Gulf longitudes", source: "Yale Climate Connections Jan 2026", criteria: crit(6, 15, "T1 Saturn direct station exact −1d · T3 Feb 17 eclipse 81d · T4 Scheat+Pleiades · T7 Aries stellium · T9 Sa/Ne midpoint · T13 compound cluster") },
    { date: "2025-11-30", title: "Cyclone Ditwah — Sri Lanka (643 dead, $4.1B)", type: "flood", severity: 5, deaths: 643, damageBillions: 4.1, pss: 0.72, stars: ["Scheat", "Fomalhaut (Neptune ♈)"], notes: "Deadliest cyclone Sri Lanka since 1978. Saturn/Neptune Aries midpoint over Indian Ocean.", pair: null, geostress: "Triple cyclone cluster Nov 22–30: compound release of Saturn direct station trigger", source: "Yale Climate Connections Jan 2026", criteria: crit(6, 15, "T1 Saturn direct station −3d · T3 Feb 17 eclipse 79d · T4 Scheat+Fomalhaut · T7 Aries stellium · T9 Sa/Ne midpoint · T13 triple cluster") },
];

export const FORECAST_EVENTS: SourceWeatherEvent[] = [
    { date: "2026-02-17", type: "flood", pss: 0.79, stars: ["Scheat (opp)", "Eris 24°♈ (eclipse opp — 4° orb)"], pair: "Pair B ANCHOR — annular solar eclipse 28°♒", geostress: "Sat ☌ Nep 0°♈ exact Feb 20 (±3d)", combo: "ANNULAR SOLAR ECLIPSE 28°♒ — Pair B first anchor. Opposes Eris 24°♈ within 4° = chaos/model-defying weather signature. Saturn-Neptune exact conjunction 0°♈ Feb 20 (+3d) — rarest alignment in ~9,000 years; both at the Aries world point (0°E = Prime Meridian: UK/West Africa). Eclipse geodetic: 28°♒ = 28°W (mid-Atlantic/Azores). Jupiter Cancer sq Aries Cardinal T-Sq active. Chiron 22°♈.", criteria: crit(10, 15, "T3 eclipse anchor · T4 Scheat+Eris · T5 world pt 0°♈ · T7 Aries stellium · T8 Saturn+Neptune ingress ♈ · T9 outer conj · T11 Pair B · T12 trigger potential · T13 Cardinal T-Sq · T14 Eris"), title: "Annular eclipse and Saturn-Neptune world point" },
    { date: "2026-03-03", type: "flood", pss: 0.68, stars: ["Fomalhaut", "Scheat"], pair: "Pair B active", geostress: "Cardinal T-Sq ♋/♈ (building)", combo: "TOTAL LUNAR ECLIPSE Mar 3 at ~12°♍ — ±45d window. Sun at 12°♓ near Fomalhaut 3°♓ (9° orb, loose). Sensitises Virgo/Pisces axis: 45°E–135°E = Urals to Philippines corridor. Saturn-Neptune conjunction Feb 20 within 13d. Jupiter Cancer sq Saturn/Neptune Aries Cardinal T-Sq building. Mars Phase 2 trigger potential for subsequent weeks. Eclipse window active through mid-April.", criteria: crit(8, 15, "T3 Feb 17 solar eclipse window · T4 Fomalhaut · T7 Aries stellium · T9 outer aspect · T10 total lunar eclipse · T11 Pair B · T13 Cardinal T-Sq · T14 Chiron"), title: "Total lunar eclipse flood window" },
    { date: "2026-04-21", type: "flood", pss: 0.61, stars: ["Fomalhaut", "Scheat (opp)", "Eris 24°♈ (Feb eclipse opp — 4° orb)"], pair: "Pair B", geostress: "T-Sq ♋/♈", combo: "Saturn 8°♈ / Neptune 5°♈ midpoint active; Jupiter Cancer sq Aries (Cardinal T-Sq apex at Cancer). Mar 3 total lunar −49d eclipse trigger still active. Feb 17 eclipse 28°♒ opp Eris 24°♈ within 4° = chaotic/model-defying weather signature for Aries corridor.", criteria: crit(6, 15, "T3 Mar 3 lunar −49d · T4 Fomalhaut+Scheat+Eris · T9 outer aspect · T11 Pair B · T13 Cardinal T-Sq · T14 Eris"), title: "Saturn-Neptune midpoint flood pressure" },
    { date: "2026-04-25", type: "compound", pss: 0.60, stars: ["Aldebaran", "Chiron 22°♈"], pair: "Pair B active", geostress: "T-Sq ♋/♈ + Uranus Gemini ingress", combo: "URANUS PERMANENT INGRESS GEMINI Apr 25, 2026 — first permanent ingress to Gemini since 1941. Uranus at 0°♊ = geodetic 60°E (Middle East/Pakistan/Afghanistan). Sudden structural rupture energy at world point. Cardinal T-Square: Jupiter Cancer sq Saturn/Neptune Aries fully engaged. Phase 2: Mars crossing Uranus ingress degree in subsequent weeks = seismic/tornado trigger for 60°E corridor and Ring of Fire.", criteria: crit(7, 15, "T3 Mar 3 lunar window · T4 Aldebaran+Chiron · T7 Aries stellium · T8 Uranus ingress 0°♊ · T9 Jupiter sq Aries · T13 Cardinal T-Sq · T14 Chiron"), title: "Uranus Gemini ingress rupture window" },
    { date: "2026-05-05", type: "tornado", pss: 0.55, stars: ["Aldebaran", "Eris 24°♈ (Mars crossing — discord trigger)"], pair: "Pair B", geostress: "T-Sq ♋/♈", combo: "Mars in Aries crossing near Eris 24°♈ (fast planet activation of Eris = model-defying storm behaviour); Mars sq Uranus; Jupiter Cancer sq Saturn/Neptune Aries (Cardinal T-Sq). Mars Phase 2 trigger: crossing Aldebaran degree.", criteria: crit(6, 15, "T4 Aldebaran+Eris · T9 Mars sq Uranus · T11 Pair B · T12 Mars Phase 2 trigger · T13 Cardinal T-Sq · T14 Eris"), title: "Mars-Eris model-defying storm trigger" },
    { date: "2026-05-19", type: "flood", pss: 0.52, stars: ["Fomalhaut", "Scheat"], pair: "Pair B", geostress: "T-Sq ♋/♈", combo: "Neptune 5°♈ / Saturn 9°♈ midpoint; eclipse shadow (Feb 17 annular, −91d, just outside window); Jupiter ♋ sq Saturn ♈ near exact. Cardinal T-Sq maintaining pressure on flood-prone longitudes.", criteria: crit(5, 15, "T4 Fomalhaut+Scheat · T7 Aries stellium · T9 outer aspect · T11 Pair B · T13 Cardinal T-Sq"), title: "Cardinal flood pressure holds" },
    { date: "2026-06-02", type: "storm_cyclone", pss: 0.57, stars: ["Aldebaran", "Antares (opp)"], pair: "Pair B", geostress: "T-Sq ♋/♈", combo: "Jupiter Cancer; Mars sq Neptune; Aldebaran–Antares axis activated. Cardinal T-Sq still engaged. Mars triggering the Jupiter/Saturn square degree = dual Phase 2 trigger.", criteria: crit(5, 15, "T4 Aldebaran+Antares · T9 Mars sq Neptune · T11 Pair B · T12 Mars dual Phase 2 · T13 Cardinal T-Sq"), title: "Aldebaran-Antares storm trigger" },
    { date: "2026-06-16", type: "heatwave", pss: 0.59, stars: ["Antares", "Regulus"], pair: "Pair B", geostress: "T-Sq ♋/♈", combo: "Sun approaching Cancer ingress (world point); Antares opposition season begins. Sun crosses 9°♐ (Antares) opposition = Sun Phase 2 trigger for fire/heat domain. Chiron entering Taurus Jun 19 (3d away) — last Chiron ♈ window.", criteria: crit(5, 15, "T4 Antares+Regulus · T9 outer aspect · T11 Pair B · T12 Sun Phase 2 trigger · T13 Cardinal T-Sq"), title: "Antares heat trigger" },
    { date: "2026-06-19", type: "heatwave", pss: 0.59, stars: ["Antares", "Chiron 0°♉ (ingress — geodetic shift to 30°E)"], pair: "Pair B active", geostress: "T-Sq ♋/♈ → Fixed opp approaching", combo: "CHIRON ENTERS TAURUS Jun 19 — geodetic sensitizer shifts from 21°E (Poland/Hungary) to 30–32°E (Turkey/East Africa/Egypt). Pioneer wound signatures now activate the Turkey–East Africa–Pakistan corridor. Jupiter 29°♋ anaretic (approaching Leo Jun 30 — T-Sq near peak). Solstice world point Jun 21 approaching. Final Chiron-in-Aries pioneer window closed.", criteria: crit(6, 15, "T4 Antares+Chiron · T5 Jupiter 29°♋ anaretic · T8 Chiron ingress · T9 outer aspect · T11 Pair B · T13 T-Sq peak"), title: "Chiron Taurus geodetic shift" },
    { date: "2026-06-21", type: "heatwave", pss: 0.67, stars: ["Antares (Sun opp)", "Aldebaran"], pair: "Pair B", geostress: "T-Sq ♋/♈", combo: "Summer Solstice 0°♋ world point; Sun opp Antares exact; Mars in Leo near Regulus. Cardinal T-Sq peaks: Jupiter 29°♋ sq Saturn ~12°♈ near exact orb. Chiron just entered Taurus (Jun 19). Jupiter enters Leo Jun 30 — 9 days away.", criteria: crit(7, 15, "T4 Antares+Aldebaran · T5 Jupiter 29°♋ anaretic · T8 Solstice 0°♋ ingress · T9 outer aspect · T11 Pair B · T12 Sun Phase 2 exact · T13 Cardinal T-Sq peak"), title: "Solstice world-point heat window" },
    { date: "2026-06-30", type: "wildfire", pss: 0.66, stars: ["Antares (opp)", "Regulus", "Algol (Uranus ♊)"], pair: "Pair B active", geostress: "Fixed opp: Ju♌ opp Pl♒ (begins Jun 30)", combo: "JUPITER ENTERS LEO Jun 30, 2026 (verified) — dissolves Cardinal T-Square; opens Fixed Leo/Aquarius axis opposing Pluto ♒. Geodetic 0°♌ = 120°E (China/Korea/Japan). Leo wildfire/political disruption corridor activated. Neptune Rx Jun 29 — retreating toward Pisces (~Oct 22). Fixed Leo/Aquarius eclipse pair axis now fully lit for Aug 12 total solar eclipse.", criteria: crit(8, 15, "T4 Antares+Regulus+Algol · T5 Leo world-axis · T8 Jupiter ingress+Neptune Rx · T9 outer opp · T11 Pair B · T12 Phase 2 potential · T13 Fixed opp · T14 Chiron ♉"), title: "Jupiter Leo wildfire corridor opens" },
    { date: "2026-07-07", type: "flood", pss: 0.63, stars: ["Fomalhaut", "Scheat", "Chiron 0°♉ (Taurus)"], pair: "Pair B", geostress: "Fixed opp: Ju♌ opp Pl♒ (active from Jun 30)", combo: "Jupiter IN LEO as of Jun 30 — Cardinal T-Sq dissolved; Fixed Leo/Aquarius opp with Pluto NOW ACTIVE on eclipse pair axis. Neptune Rx since Jun 29 (retrograding toward Pisces ~Oct 22). Chiron entered Taurus Jun 19 — geodetic sensitizer zone shifts from 21°E (Poland) to 30–32°E (Turkey/East Africa). Neptune 6°♈ Rx / Saturn 10°♈ — Sa/Ne midpoint still active over SE Asia longitudes.", criteria: crit(6, 15, "T4 Fomalhaut+Scheat+Chiron♉ · T8 Jupiter ♌ ingress Jun 30 + Neptune Rx Jun 29 · T9 Sa/Ne midpoint aspect · T11 Pair B · T13 Fixed opp axis · T14 Chiron ♉ sensitizer"), title: "Fixed opposition flood field" },
    { date: "2026-07-21", type: "storm_cyclone", pss: 0.58, stars: ["Scheat", "Pleiades"], pair: "Pair B", geostress: "Fixed opp: Ju♌ opp Pl♒ (deepening)", combo: "Jupiter at ~3°♌ (entered Jun 30) — Fixed Leo/Aquarius opposition with Pluto deepening on Aug 12 eclipse pair axis. Uranus 1–2°♊; Neptune Rx ~4°♈ retrograding toward Pisces (arrives ~Oct 22). Saturn 10–11°♈; Sa/Ne midpoint active. Atlantic/Pacific hurricane season peak. Aug 12 total solar eclipse now 22 days away.", criteria: crit(5, 15, "T4 Scheat+Pleiades · T9 Fixed opp outer aspect · T11 Pair B (Aug 12 eclipse -22d) · T13 Fixed opp deepening · T14 Chiron ♉ sensitizer"), title: "Hurricane season fixed-axis build" },
    { date: "2026-08-04", type: "wildfire", pss: 0.54, stars: ["Antares", "Algol (Uranus)"], pair: "Pair B — 8 days to exact eclipse", geostress: "Fixed opp: Ju ♌ opp Pl ♒", combo: "Mars in Leo; Uranus early Gemini sq Pisces nodes; Leo fire season peak. Pair B second anchor (Aug 12) approaching — pair orb maximising. Chiron Rx still in Taurus (~1°♉) — Turkey/East Africa corridor sensitised.", criteria: crit(5, 15, "T4 Antares+Algol · T9 Uranus sq nodes · T11 Pair B eclipse approach · T13 Fixed opp · T14 Chiron ♉"), title: "Pre-eclipse wildfire build" },
    { date: "2026-08-12", type: "compound", pss: 0.87, stars: ["Antares", "Regulus", "Algol (Uranus)"], pair: "Pair B EXACT — Aug 12 total solar 20°♌", geostress: "Fixed opp: Ju ♌ opp Pl ♒ exact + eclipse on same axis", combo: "TOTAL SOLAR ECLIPSE 20°♌ Leo — Pair B second anchor. Jupiter Leo opposing Pluto Aquarius on eclipse degree axis. Uranus sq nodes near exact. Nodes approaching Leo/Aquarius ingress (~Sep). Duration ~2–2.5 min (VERIFY). Leo corridor = wildfire, heatwave, political disruption maximum. Eclipse path: North Atlantic → Spain/NW Africa → geodetic hotzone.", criteria: crit(9, 15, "T1 Uranus sq node station · T3 total solar eclipse · T4 Antares+Regulus+Algol · T7 Fixed Leo cluster · T9 outer opp · T11 Pair B EXACT · T12 Phase 2 trigger · T13 Fixed opp · T14 Chiron ♉"), title: "Pair B total solar eclipse maximum" },
    { date: "2026-08-28", type: "flood", pss: 0.63, stars: ["Scheat", "Pleiades"], pair: "Pair B active (−16d from Aug 12)", geostress: "Fixed opp: Ju ♌ opp Pl ♒", combo: "Partial lunar eclipse Aug 28 at ~5°♒ (±21d window). Double eclipse window with Aug 12 total solar (−16d). Fixed Leo/Aquarius axis doubly lit. Chiron Rx in early Taurus — approaching Aries return Sep 17.", criteria: crit(5, 15, "T3 Aug 12 total solar window · T4 Scheat+Pleiades · T10 partial lunar Aug 28 · T11 Pair B · T13 Fixed opp"), title: "Double eclipse flood window" },
    { date: "2026-09-01", type: "storm_cyclone", pss: 0.64, stars: ["Scheat", "Pleiades"], pair: "Pair B active", geostress: "Fixed opp; Node ingress Leo/♒ ~Sep", combo: "Atlantic/Pacific hurricane peak; Uranus Gemini; Saturn/Neptune Aries. Node ingress to Leo/Aquarius (~Sep 2026) shifts bending to Scorpio/Taurus. Chiron Rx returns to Aries Sep 17 — watch final Aries pioneer signature. Neptune Rx still in Aries (enters Pisces Oct 22).", criteria: crit(5, 15, "T4 Scheat+Pleiades · T8 Node ingress · T9 outer aspect · T11 Pair B · T13 Fixed opp"), title: "Hurricane peak and node shift" },
    { date: "2026-09-22", type: "flood", pss: 0.55, stars: ["Fomalhaut", "Scheat"], pair: "Pair B active", geostress: "Fixed axis; Scorpio/Taurus bending now active", combo: "Autumn Equinox world point 0°♎; Saturn/Neptune Aries; Libra ingress activates Spica 23°♎. New bending at Scorpio/Taurus. Chiron Rx back in Aries Sep 17 (−5d) = final pioneer Aries window. Neptune ~3°♈ Rx, approaching Pisces entry Oct 22.", criteria: crit(5, 15, "T4 Fomalhaut+Scheat · T8 Equinox 0°♎ ingress · T9 outer aspect · T11 Pair B · T13 Fixed/Sc-Ta bending"), title: "Equinox world-point flood window" },
    { date: "2026-10-06", type: "storm_cyclone", pss: 0.62, stars: ["Scheat", "Pleiades (Uranus)"], pair: "Pair B active (±180d from Aug 12 runs to Feb 2027)", geostress: "Fixed axis; Scorpio/Taurus bending", combo: "Uranus in Gemini; Saturn 14°♈ (Neptune Rx re-entering Pisces ~Oct 22 — Sa/Ne midpoint dissolving by month end). Neptune still in Aries for this window. Mirrors Oct 2024 Milton/Valencia cluster on same fixed-sq background. Mercury Rx Oct 17 approaching.", criteria: crit(4, 15, "T4 Scheat+Pleiades · T9 outer aspect · T11 Pair B · T13 Fixed/Sc-Ta bending"), title: "Fixed-axis October storm echo" },
    { date: "2026-10-20", type: "flood", pss: 0.68, stars: ["Algol (Uranus)", "Pleiades", "Scheat"], pair: "Pair B active", geostress: "Fixed axis; Mercury Rx station Oct 17", combo: "Uranus in Gemini Algol/Pleiades corridor; Saturn 14°♈; Neptune Rx entering Pisces ~Oct 22 (last days of Neptune in Aries — dissolving Sa/Ne ♈ midpoint). Anniversary Oct 29 2024 Valencia floods. Mercury Rx station Oct 17 (−3d) = communication/transport breakdown amplifier. Phase 2 triple stack: Mercury Rx + Mars approaching + eclipse window.", criteria: crit(6, 15, "T2 Mercury Rx station Oct 17 · T4 Algol+Pleiades+Scheat · T9 outer aspect · T11 Pair B · T12 triple Phase 2 stack · T13 Fixed axis"), title: "Mercury station flood breakdown" },
    { date: "2026-11-03", type: "compound", pss: 0.70, stars: ["Scheat", "Pleiades", "Fomalhaut"], pair: "Pair B active", geostress: "Fixed axis; Jupiter Rx ~Nov 11", combo: "All outer planets one-side Nodal axis; Saturn ~16°♈; Neptune Rx now in Pisces (entered Oct 22) — Sa/Ne midpoint dissolving but Saturn alone still active. Jupiter Rx station ~Nov 11 approaching. Mirrors Nov 2025 compound cluster pattern.", criteria: crit(5, 15, "T4 Scheat+Pleiades+Fomalhaut · T7 outer planets massed · T9 outer aspect · T11 Pair B · T13 Fixed opp"), title: "Compound cluster pattern returns" },
    { date: "2026-11-17", type: "storm_cyclone", pss: 0.65, stars: ["Scheat", "Pleiades"], pair: "Pair B active", geostress: "Fixed axis; Jupiter Rx station Dec 13", combo: "Saturn 15°♈ — exact echo of Nov 2025 Indonesia/Malaysia degree. Neptune now in Pisces Rx (since Oct 22); Sa/Ne midpoint deactivated but Saturn ♈ alone active for SE Asia. Jupiter Rx station Dec 13 approaching (−26d). SE Asia longitudes maximally exposed to Saturn midpoint.", criteria: crit(6, 15, "T1 Jupiter Rx station Dec 13 approaching · T4 Scheat+Pleiades · T7 echo of Nov 2025 · T9 Saturn ♈ · T11 Pair B · T13 Fixed opp"), title: "SE Asia cyclone echo" },
    { date: "2026-12-01", type: "flood", pss: 0.59, stars: ["Scheat (opp from 29°♍)", "Fomalhaut"], pair: "Pair B active", geostress: "Jupiter Rx station Dec 13 building", combo: "Saturn direct Dec 10 approaching (Phase 2 station trigger building — mirrors Dec 2025 Cyclone Ditwah). Jupiter Rx station Dec 13 (+12d). Double station window. Neptune in Pisces Rx — Scheat at 29°♓ reactivated by Neptune retrograde.", criteria: crit(5, 15, "T1 Saturn direct Dec 10 + Jupiter Rx Dec 13 (double station) · T4 Scheat+Fomalhaut · T9 Neptune Rx toward Scheat · T11 Pair B · T13 Fixed axis"), title: "Double station late-season flood window" },
];

export const GEODETIC_ZONES: Record<string, string[]> = {
    "2026-02-17": ["UK / Ghana / Nigeria (0°E — Sa☌Ne world point)", "Greece / Romania / Libya (24°E — Eris opp)", "Azores / Morocco coast (28°W — eclipse 28°♒)"],
    "2026-03-03": ["New Zealand / W.Pacific (162°E — lunar eclipse exact)", "Portugal / Morocco (18°W — eclipse Sun axis)", "Urals to Philippines corridor (45–135°E — sensitised)"],
    "2026-04-21": ["Germany / Italy / Algeria (5–8°E — Sa/Ne midpoint)", "Greece / Libya (24°E — Eris)", "India / SE Asia (90–120°E — Jupiter ♋ apex)"],
    "2026-04-25": ["Pakistan / Afghanistan / Iran (60–65°E — Uranus 0°♊ ingress)", "Russia (Urals) / Kazakhstan (60°E)", "NW India (69°E — Aldebaran)"],
    "2026-05-05": ["Romania / Libya / Egypt (17–24°E — Mars/Eris)", "Afghanistan / NW India (69°E — Aldebaran)", "US Great Plains / Tornado Alley (T-Sq axis)"],
    "2026-05-19": ["Germany / Italy / Algeria (5–9°E — Sa/Ne midpoint)", "Portugal / mid-Atlantic (29°W — Scheat)", "Pakistan / Afghanistan (59°E — Pleiades)"],
    "2026-06-02": ["Caribbean / Gulf of Mexico (111°W — Antares)", "Pakistan / Afghanistan (69°E — Aldebaran)", "Atlantic hurricane pre-season basin"],
    "2026-06-16": ["Japan / Eastern Australia / Pacific (150°E — Regulus)", "Afghanistan / NW India (69°E — Sun-Antares axis)", "Mediterranean fire belt (20–30°E)"],
    "2026-06-19": ["Turkey / Egypt / Ukraine (30°E — Chiron 0°♉ ingress)", "Kenya / Tanzania / Ethiopia (30–35°E)", "Caribbean / Gulf Coast (111°W — Antares)"],
    "2026-06-21": ["Turkey / East Africa (30°E — Chiron ♉)", "Caribbean / Gulf of Mexico (111°W — Antares opp)", "Afghanistan / Pakistan (69°E — Aldebaran)", "Global (Solstice world point broadcast)"],
    "2026-06-30": ["China coast / Korea / Japan (120–150°E — Jupiter ♌ opens)", "Philippines / Eastern Australia (135–150°E)", "California / Pacific coast (120°W — Fixed axis)"],
    "2026-07-07": ["Pakistan / Afghanistan / Kazakhstan (60–65°E — Mars ☌ Uranus ★)", "Turkey / Egypt / East Africa (30°E — Chiron ♉)", "Germany / Italy (7–8°E — Sa/Ne midpoint)", "Portugal / NW Africa (27–29°W — Fomalhaut/Scheat)"],
    "2026-07-21": ["China / Korea / Japan (120–150°E — Jupiter ♌ axis)", "Pakistan / Afghanistan (59°E — Pleiades)", "Atlantic basin (hurricane season peak)", "Portugal / Morocco (29°W — Scheat)"],
    "2026-08-04": ["Caribbean / Gulf of Mexico (111°W — Antares, peak season)", "Ethiopia / Iran / Pakistan (56°E — Algol/Uranus)", "California / SW USA (120°W — Leo wildfire corridor)", "Mediterranean fire belt (15–25°E)"],
    "2026-08-12": ["Japan / Philippines / Mariana Islands (140°E — eclipse 20°♌)", "Spain / NW Africa (totality path)", "Eastern Australia / New Zealand (150°E — Regulus)", "Caribbean / Gulf (111°W — Antares)", "Ethiopia / Pakistan (56°E — Algol)"],
    "2026-08-28": ["Azores / Portugal / Atlantic (25–29°W — partial lunar eclipse)", "Pakistan / Afghanistan (59°E — Pleiades)", "SE Asia (100–120°E — Fixed Leo backdrop)"],
    "2026-09-01": ["Thailand / Vietnam / Cambodia (103°E — Mars exact)", "Philippines / S.China Sea (110–120°E)", "Bay of Bengal / Bangladesh (88–92°E)", "Italy / Albania / Libya (13°E — Saturn Rx)"],
    "2026-09-22": ["Pacific Islands / Samoa / Fiji (180°E — Equinox world point)", "Hawaii (157°W — Spica activation)", "Germany / Italy (5°E — Chiron Rx ♈)", "Atlantic (25–30°W — Scheat/Fomalhaut)"],
    "2026-10-06": ["UK / France / Algeria (3°E — Neptune last days ♈)", "Italy / Libya (14°E — Saturn ♈)", "Pakistan / Afghanistan (59°E — Pleiades bending)", "W.Mexico / Central America (120–150°W — Sc/Ta bending)"],
    "2026-10-20": ["Ethiopia / East Africa (55–60°E — Algol/Pleiades)", "Pakistan / Afghanistan (60°E)", "Iran / Kazakhstan (60°E)", "Valencia / SE Spain echo (0–5°W — Oct 29 anniversary)"],
    "2026-11-03": ["Pakistan / Afghanistan (59°E — Pleiades/Scheat)", "S.Italy / Libya / Tunisia (16°E — Saturn ♈)", "Atlantic / Portugal (27–29°W — Fomalhaut/Scheat)", "SE Asia (100–120°E — Nov 2025 pattern echo)"],
    "2026-11-17": ["Thailand / Vietnam / Malaysia (103–110°E — Saturn ♈ SE Asia echo)", "Indonesia / Philippines (110–125°E)", "N.Italy / Greece / Albania (15°E — Saturn ♈)", "Pakistan (59°E — Pleiades)"],
    "2026-12-01": ["Pakistan / Afghanistan (59°E — Scheat/Pleiades)", "Atlantic / Canary Islands (27–30°W — Neptune ♓/Scheat)", "SE Asia (100–115°E — Saturn station echo)", "Caribbean (late-season cyclone close)"],
};

function makeHeatmap(event: SourceWeatherEvent, zones: string[]): number[] {
    const centers = extractLongitudes(`${event.combo ?? ""} ${event.notes ?? ""} ${zones.join(" ")}`);
    const fallback = Math.round((new Date(event.date).getUTCMonth() / 12) * 360);
    const longitudes = centers.length ? centers : [fallback];

    return Array.from({ length: HEATMAP_SIZE }, (_, lon) => {
        const peak = longitudes.reduce((max, center) => Math.max(max, longitudePeak(lon, center)), 0);
        return Number(Math.min(1, event.pss * (0.35 + peak * 0.65)).toFixed(3));
    });
}

function longitudePeak(longitude: number, center: number): number {
    const distance = Math.abs(longitude - center) % HEATMAP_SIZE;
    const shortestDistance = Math.min(distance, HEATMAP_SIZE - distance);
    return Math.max(0, 1 - shortestDistance / HEATMAP_ORB_DEGREES);
}

function extractLongitudes(text: string): number[] {
    const matches = [...text.matchAll(/(\d{1,3})°\s*([EW])?/g)];
    const values = matches.map((m) => {
        const raw = Number(m[1]);
        const hemi = m[2];
        if (!Number.isFinite(raw) || raw > 360) return null;
        if (hemi === "W") return (360 - raw) % 360;
        return raw % 360;
    }).filter((v): v is number => v != null);
    return Array.from(new Set(values));
}

function normalizeEvent(event: SourceWeatherEvent, kind: "historical" | "forecast"): GeodeticWeatherEvent {
    const zones = kind === "forecast" ? (GEODETIC_ZONES[event.date] ?? []) : [];
    return {
        ...event,
        id: `${kind}-${event.date}-${slug(event.title)}`,
        kind,
        tier: tierFromPss(event.pss),
        editorialBody: event.combo ?? event.notes ?? event.title,
        heatmap: makeHeatmap(event, zones),
        zones,
    };
}

export const HISTORICAL_WEATHER_EVENTS: GeodeticWeatherEvent[] = HISTORICAL_EVENTS.map((event) => normalizeEvent(event, "historical"));
export const FORECAST_WEATHER_EVENTS: GeodeticWeatherEvent[] = FORECAST_EVENTS.map((event) => normalizeEvent(event, "forecast"));
export const ALL_GEODETIC_WEATHER_EVENTS: GeodeticWeatherEvent[] = [
    ...FORECAST_WEATHER_EVENTS,
    ...HISTORICAL_WEATHER_EVENTS,
];

export function getWeatherEventById(id: string): GeodeticWeatherEvent | undefined {
    return ALL_GEODETIC_WEATHER_EVENTS.find((event) => event.id === id);
}
