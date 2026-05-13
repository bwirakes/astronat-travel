import type { HardAspect2026, MoonPhase2026 } from "./weather-types";

const MS_PER_DAY = 86400000;

type TriggerWindow = {
    aspects: HardAspect2026[];
    moons: MoonPhase2026[];
};

export const HARD_ASPECTS_2026: HardAspect2026[] = [
    { date: "2026-01-27", bodies: "Mars ☌ Pluto", degree: "3°♒", type: "conj", severity: "high", geodeticLongitude: "303°E → 57°W (mid-Atlantic / Argentina)", conflict: "Mass event amplifier; Pluto×Mars = extreme casualties, sudden power seizure. Opens eclipse-pair month.", weather: "Explosive cyclogenesis; storm surge exceeding all forecast models." },
    { date: "2026-02-27", bodies: "Mars □ Uranus", degree: "27°♒/27°♉", type: "sq", severity: "critical", geodeticLongitude: "327°E → 33°W (Azores/mid-Atlantic)", conflict: "Sudden uprisings, explosions, infrastructure rupture; historically co-timed with earthquakes and coups.", weather: "Record-breaking sudden storms; tornado outbreak; seismic event within ±3d window. Near Feb 17 eclipse degree.", note: "★ Eclipse proximity: Mars reaches 28°♒ eclipse degree ~Mar 1 (+2d) — Phase 2 trigger window extends to Mar 3 total lunar eclipse." },
    { date: "2026-03-01", bodies: "Mars crosses eclipse° 28°♒", degree: "28°♒", type: "eclipse", severity: "high", geodeticLongitude: "28°W → mid-Atlantic / W.Ireland", conflict: "Karmic eclipse degree activated — conflict/crisis along the eclipse path corridor.", weather: "Flood/storm trigger for 0°E–30°W corridor. Overlaps with Mar 3 total lunar eclipse window (2d later)." },
    { date: "2026-03-13", bodies: "Mars ☌ North Node", degree: "8°♓", type: "node", severity: "high", geodeticLongitude: "8°W → W.Ireland / Morocco corridor", conflict: "Fated/karmic mass event; historically associated with military escalation and unchosen conflict. Pisces NN = maritime, hidden, sacrifice.", weather: "Flood, tsunami risk, maritime disaster. Triggers collective 'destiny' events at 8°W geodetic corridor.", note: "Mercury also conjunct Mars/NN in Pisces this window — communication failures, mass confusion during disasters." },
    { date: "2026-04-13", bodies: "Mars ☌ Neptune", degree: "2-3°♈", type: "conj", severity: "critical", geodeticLongitude: "2-3°E → London / Paris / W.Africa", conflict: "Military deception, invisible/chemical threat, mass panic, hidden actor attacks. World point activation.", weather: "FLOOD MAXIMUM — Mars/Neptune = water overwhelming everything. World point at 0-3°E geodetically activated. Sa/Ne conjunction Feb 20 echoed 52d later.", note: "★ WORLD POINT: 2-3°♈ = 2-3°E geodetically. Saturn/Neptune conjunction was Feb 20 at 0°♈ = same axis 52d earlier. Mars now triggers that midpoint." },
    { date: "2026-04-19", bodies: "Mars ☌ Saturn", degree: "7°♈", type: "conj", severity: "critical", geodeticLongitude: "7°E → Germany / N.Italy / Tunisia", conflict: "Martial law, military conflict, structural state violence, infrastructure attack. Saturn forces Mars to become a weapon of the establishment.", weather: "Catastrophic structural flood (dams, levees, bridges). Historical precedent: mass-casualty infrastructure events.", note: "★ ARIES WORLD POINT CLUSTER: Neptune 0°♈ Feb 20 · Mars/Nep 3°♈ Apr 13 · Mars/Sat 7°♈ Apr 19 — three activations of the Saturn/Neptune conjunction axis in 58 days. Geodetic 7°E = Germany/Italy." },
    { date: "2026-05-04", bodies: "Mars □ Jupiter", degree: "~17°♈/♋", type: "sq", severity: "high", geodeticLongitude: "17°E → Egypt / Libya / Greece corridor", conflict: "Overreach of military force; political hubris leading to crisis. Excess violence beyond all calculation.", weather: "Record-scale storm or compound disaster of excess. Jupiter amplifies whatever Mars triggers.", note: "Cardinal T-Square peak: Jupiter at ~17°♋ sq Saturn ~7°♈ AND Mars at 17°♈ sq Jupiter = three-way activation." },
    { date: "2026-05-25", bodies: "Mars □ Pluto Rx", degree: "5°♉/5°♒", type: "sq", severity: "high", geodeticLongitude: "5°E (Pluto) / 35°E (Mars) → Ethiopia / E.Africa / Red Sea", conflict: "Power struggle at maximum violence; scorched-earth tactics. Fixed sign square = entrenched, no exit.", weather: "Seismic/volcanic trigger — Fixed Earth (Taurus) sq Aquarius Pluto. Ring of Fire pressure." },
    { date: "2026-07-06", bodies: "Mars ☌ Uranus", degree: "~4-5°♊", type: "conj", severity: "critical", geodeticLongitude: "64-65°E → Pakistan / Afghanistan / Russia (Urals)", conflict: "Sudden revolt, coup, explosion; infrastructure rupture. First Mars ☌ Uranus in Gemini since 1941 Uranus ingress era.", weather: "Tornado outbreak, sudden atmospheric rupture. Uranus in Gemini = jet stream disruption; Mars ignites.", note: "★ CALCULATED (±3d). Geodetically: 64°E = Pakistan / Afghanistan corridor; 60°E = Uranus ingress degree. Follows Jupiter ♌ ingress Jun 30 by 6d — Fixed Leo/Aquarius opp newly active." },
    { date: "2026-08-19", bodies: "Mars □ Neptune", degree: "~5°♋/♈", type: "sq", severity: "high", geodeticLongitude: "5°E (Neptune) / 75°E (Mars) → India / Bangladesh corridor", conflict: "Hidden maritime or chemical threat; intelligence failure; mass deception in conflict.", weather: "Pre-eclipse flood trigger: Aug 12 total solar −7d window. Neptune in Aries Rx; Mars in Cancer = SE Asia/Indian Ocean flood threat.", note: "★ CALCULATED (±4d). Mars in Cancer sq Neptune in Aries: classic flood-of-floods signature before the Aug 28 partial lunar eclipse. SA/Ne midpoint reactivated." },
    { date: "2026-09-01", bodies: "Mars □ Saturn", degree: "13°♋/♈", type: "sq", severity: "high", geodeticLongitude: "13°E (Saturn) / 103°E (Mars) → Thailand / Vietnam corridor", conflict: "Military/structural crisis; state response overwhelmed. Saturn Rx in Aries = unresolved martial tension.", weather: "SE Asia cyclone trigger — Mars (103°E = Indochina) activates Saturn's Aries degree from Cancer (water sign). Mirrors Nov 2025 Cyclone Senyar signature.", note: "Matches the Sa/Ne midpoint SE Asia trigger pattern. Saturn Rx at ~13°♈ = 13°E geodetically, but Mars at 13°♋ = 103°E = Thailand/Indochina/Philippines corridor." },
    { date: "2026-10-03", bodies: "Mars ☍ Pluto Rx", degree: "3°♌/3°♒", type: "opp", severity: "critical", geodeticLongitude: "123°E → China coast / Taiwan / Philippines", conflict: "Maximum power confrontation; geopolitical brinkmanship; mass casualties in political conflict.", weather: "Compound compound: Fixed Leo/Aquarius eclipse axis + Mars/Pluto opposition + eclipse window (Aug 12 was 52d prior). China/Pacific corridor geodetically activated.", note: "Oct 3 Mars ☍ Pluto + Nov 3 Mars crosses 20°♌ eclipse degree: two-stage escalation on the Aug 12 eclipse axis." },
    { date: "2026-11-03", bodies: "Mars crosses eclipse° 20°♌", degree: "20°♌", type: "eclipse", severity: "high", geodeticLongitude: "120°E → China / Korea / Philippines", conflict: "Eclipse degree Phase 2 trigger — delayed manifestation of Aug 12 total solar eclipse (83d later). Historical: eclipse-degree transits within 90d produce their most intense events.", weather: "Wildfire / typhoon / compound weather-political event in 120°E corridor. Jupiter-Pluto opposition backdrop." },
];

export const MOON_PHASES_2026: MoonPhase2026[] = [
    { date: "2026-01-03", type: "FM", degree: "13°♋", note: "Wolf Moon — opp Capricorn Sun" },
    { date: "2026-01-18", type: "NM", degree: "28°♑", note: "New Moon — Capricorn; Sa/Ne ♈ building" },
    { date: "2026-02-01", type: "FM", degree: "12°♌", note: "Full Moon — Leo/Aquarius axis lit early" },
    { date: "2026-03-19", type: "NM", degree: "28°♓", note: "New Moon — Pisces; Sa/Ne conj 27d past" },
    { date: "2026-04-02", type: "FM", degree: "12°♎", note: "Full Moon — Libra/Aries axis; Jupiter♋ sq Sa♈" },
    { date: "2026-04-17", type: "NM", degree: "27°♈", note: "New Moon — Aries; near Sa/Ne midpoint" },
    { date: "2026-05-01", type: "FM", degree: "11°♏", note: "Full Moon — Scorpio; Flower Moon" },
    { date: "2026-05-16", type: "NM", degree: "25°♉", note: "New Moon — Taurus; Uranus ♊ ingress building" },
    { date: "2026-05-31", type: "FM", degree: "10°♐", note: "Blue Moon (2nd May FM) — Sagittarius/Gemini axis" },
    { date: "2026-06-15", type: "NM", degree: "24°♊", note: "New Moon — Gemini; on Uranus ingress degree" },
    { date: "2026-06-29", type: "FM", degree: "8°♑", note: "Strawberry Moon; Neptune Rx station builds toward Jul 7" },
    { date: "2026-07-14", type: "NM", degree: "22°♋", note: "New Moon — Cancer; Jupiter ♌ (entered Jun 30)" },
    { date: "2026-07-29", type: "FM", degree: "7°♒", note: "Buck Moon — Aquarius; Ju♌ opp Pl♒ tightening" },
    { date: "2026-09-11", type: "NM", degree: "18°♍", note: "New Moon — Virgo; Chiron Rx ♈ (Sep 17 near)" },
    { date: "2026-09-26", type: "FM", degree: "4°♈", note: "Harvest Moon — Aries world point; Sa/Ne echo" },
    { date: "2026-10-10", type: "NM", degree: "17°♎", note: "New Moon — Libra; Mercury Rx Oct 17 week" },
    { date: "2026-10-26", type: "FM", degree: "3°♉", note: "Hunter's Moon — Taurus; Chiron zone 30–32°E" },
    { date: "2026-11-09", type: "NM", degree: "17°♏", note: "New Moon — Scorpio; Sc/Ta bending active" },
    { date: "2026-11-24", type: "FM", degree: "2°♊", note: "Beaver Moon — Gemini/Uranus corridor" },
    { date: "2026-12-09", type: "NM", degree: "17°♐", note: "New Moon — Sagittarius; Saturn direct Dec 10 (±1d)" },
    { date: "2026-12-24", type: "FM", degree: "3°♋", note: "Cold Moon — Cancer; Jupiter Rx 27°♌" },
];

const ECLIPSE_MOON_PHASES: MoonPhase2026[] = [
    { date: "2026-02-17", type: "NM", degree: "28°♒", note: "☀ ANNULAR SOLAR ECLIPSE (Pair B anchor)", eclipse: true },
    { date: "2026-03-03", type: "FM", degree: "12°♍", note: "☽ TOTAL LUNAR ECLIPSE", eclipse: true },
    { date: "2026-08-12", type: "NM", degree: "20°♌", note: "☀ TOTAL SOLAR ECLIPSE (Pair B anchor)", eclipse: true },
    { date: "2026-08-28", type: "FM", degree: "5°♓", note: "☽ PARTIAL LUNAR ECLIPSE", eclipse: true },
];

export const MOON_CALENDAR_2026: MoonPhase2026[] = [
    ...MOON_PHASES_2026,
    ...ECLIPSE_MOON_PHASES,
].sort((a, b) => a.date.localeCompare(b.date));

export function triggersForWindow(startDate: string, days = 13): TriggerWindow {
    const start = new Date(`${startDate}T00:00:00Z`).getTime();
    const end = start + days * MS_PER_DAY;
    const inWindow = (date: string): boolean => {
        const time = new Date(`${date}T00:00:00Z`).getTime();
        return time >= start && time <= end;
    };

    return {
        aspects: HARD_ASPECTS_2026.filter((aspect) => inWindow(aspect.date)),
        moons: MOON_CALENDAR_2026.filter((phase) => inWindow(phase.date)),
    };
}
