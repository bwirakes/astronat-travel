export type OriginalDashboardEvent = {
    date: string;
    name: string;
    type: string;
    sev: number;
    deaths: number | null;
    dmg: number | null;
    pss: number;
    stars: string[];
    notes?: string;
    pair: string | null;
    geostress: string | null;
    source?: string;
    crit?: { n: number; of: number; key: string };
};

export const ORIGINAL_DASHBOARD_EVENTS = [
    {
        "date": "1986-04-26",
        "name": "Chernobyl nuclear disaster — Ukraine (4,000–60,000 est. deaths)",
        "type": "industrial",
        "sev": 5,
        "deaths": 31000,
        "dmg": 700,
        "pss": 0.66,
        "stars": [
            "Corrected: Saturn 8.6°♐ (Antares-zone claim removed)"
        ],
        "notes": "Reactor 4 explosion at 1:23 AM. Saturn 8.6°♐; Uranus 20.6°♐ also in Sagittarius — Uranus/Saturn conjunction in Sagittarius. N.Node ~2°♈ (world point Aries). Jupiter 12°♓. The Uranus/Saturn conjunction in Sagittarius mapped geodetically to ~250°E/110°W (western hemisphere and central Asia/USSR). Chiron in Gemini opposing Sagittarius cluster. Lunation: Full Moon Apr 24 = 2 days before. T17: N.Node 2°♈ within ~25° of MC for Ukraine (~30°E = 0°♉ geodetic). T19: FM Apr 24 exact −2 days.",
        "pair": null,
        "geostress": "Uranus/Saturn conjunction ♐ — compressive structural failure trigger",
        "source": "UN OCHA; IAEA 1991; WHO 2005",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T1 Saturn/Uranus Sagittarius co-presence · T3 opposition axis · T4 Antares zone removed · T17 NNode ~0°♈ world point · T19 Full Moon −2d"
        }
    },
    {
        "date": "1992-08-24",
        "name": "Hurricane Andrew — Florida/Louisiana (65 dead, $27B)",
        "type": "storm_cyclone",
        "sev": 5,
        "deaths": 65,
        "dmg": 27,
        "pss": 0.63,
        "stars": [
            "Scheat (Neptune 17°♑/late Capricorn opp)"
        ],
        "notes": "Category 5 landfall Homestead FL, 165 mph winds. Costliest US disaster at time. Mars 13°♊ (Aldebaran zone). Saturn Rx 15°♒. Neptune 17°♑. N.Node ~28°♑ (late Capricorn bending — Saturn nearby). Jupiter 19.9°♍. Chiron 9°♌. T17: S.Node 28°♋ (world point Cancer) within 3° of Cancer IC for Florida (~81°W = 19°♎ geodetic — sq N.Node). T19: Full Moon Aug 21 = 3 days before landfall.",
        "pair": null,
        "geostress": "Mars/Saturn outer aspect backdrop",
        "source": "NOAA NCEI; FEMA 1992",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T3 eclipse proximity · T4 Aldebaran zone · T17 SNode 28°♋ world point · T19 FM Aug 21 −3d"
        }
    },
    {
        "date": "1994-01-17",
        "name": "Northridge earthquake M6.7 — Los Angeles (57 dead, $20B)",
        "type": "earthquake",
        "sev": 5,
        "deaths": 57,
        "dmg": 20,
        "pss": 0.64,
        "stars": [
            "Corrected: Mars 21.7°♑ (Aldebaran claim removed)"
        ],
        "notes": "M6.7 at 4:30 AM PST. Uranus 22°♑ / Neptune 21°♑ conjunction exact — direct on world-point axis. Saturn 29°♒ anaretic (approaching Pisces). Mars 21.7°♑ (not Aldebaran). Jupiter 11°♏. N.Node ~16°♐. T17: N.Node 16°♐ within 7° of MC for LA (~118°W = 28°♎ geodetic IC = opposite node within ~12°). T19: New Moon Jan 11 = 6 days before.",
        "pair": null,
        "geostress": "Uranus/Neptune 0° conjunction ♑ — world-axis structural dissolution",
        "source": "USGS; FEMA 1994",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T1 Uranus/Neptune conjunction exact ♑ · T3 eclipse 27d prior · T4 Aldebaran Mars claim removed · T5 Saturn 29°♒ anaretic · T13 cardinal world pt · T17 node proximity LA · T19 NM −6d"
        }
    },
    {
        "date": "1995-01-17",
        "name": "Kobe earthquake M6.9 — Japan (6,434 dead, $100B)",
        "type": "earthquake",
        "sev": 5,
        "deaths": 6434,
        "dmg": 100,
        "pss": 0.99,
        "stars": [
            "Corrected: Mars 1.3°♍ (Aldebaran claim removed)"
        ],
        "notes": "Great Hanshin earthquake at 5:46 AM. Deadliest Japanese disaster since WWII. Uranus 25°♑ / Neptune 23°♑ still conjunct. Saturn 10°♓ (nodal stress: within 10° of N.Node ~8°♐ — sq). Jupiter 7.9°♐. Mars 1.3°♍ (not Aldebaran). T17: N.Node 8°♐ sq MC for Kobe (~135°E = 15°♒ geodetic IC — within 7° of N.Node square). Pluto 0°♐ (world point ingress!). T19: Full Moon Jan 16 = ONE DAY before earthquake. Strongest lunation timing in dataset.",
        "pair": null,
        "geostress": "Uranus/Neptune conjunction ♑ ongoing; Pluto 0°♐ world-point ingress",
        "source": "USGS; Japan NPA 1995",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T1 Uranus/Neptune conjunction ♑ · T4 Aldebaran Mars claim removed · T5 Pluto 0°♐ world point · T8 Pluto ingress · T13 Cardinal T-Sq backdrop · T17 NNode sq Kobe IC · T19 FM Jan 16 EXACT −1d · T30a Jupiter‖Neptune 0.05° · T30a Jupiter‖Uranus 0.50° · T30a Uranus‖Neptune 0.45° · T31 Mars antiscia→VTX 1.5°"
        }
    },
    {
        "date": "1999-08-17",
        "name": "İzmit earthquake M7.6 — Turkey (17,127 dead)",
        "type": "earthquake",
        "sev": 5,
        "deaths": 17127,
        "dmg": 20,
        "pss": 0.52,
        "stars": [
            "Aug 11 1999 Great Eclipse path over Turkey (18°♌ — 5.2° from ASC=♌12.8°)"
        ],
        "notes": "Marmara earthquake at 03:02 local. Geodetic MC=♈30°/IC=♎30° — both on world axis fixed sign cusps (0°♉/0°♏). Aug 11 1999 total solar eclipse path crossed Turkey 6 days before (T1). Eclipse at 18°♌ = 5.2° from ASC=♌12.8° — near-ASC eclipse. Uranus→DSC 2.2° (Uranus ♒14.9°, DSC=♒12.8°). Jupiter at ♉8° and Saturn at ♉16° = both in Taurus transiting past world axis MC. Mercury 5d post-SD (T3c). Saturn/Uranus opposition forming (T6). IC approaching 0°♏ world axis.",
        "pair": null,
        "geostress": "Aug 11 eclipse path over Turkey; MC+IC on world axis 0°♉/0°♏; Uranus→DSC 2.2°",
        "source": "USGS; KOERI; Kandilli 1999",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T1 eclipse −6d solar path over Turkey · T3c Mercury SD +5d · T6 Saturn/Uranus opp forming · T8 Uranus→DSC 2.2° · T10 World Axis MC+IC 0°♉/0°♏ · T16 IC anaretic ♎30°"
        }
    },
    {
        "date": "2001-01-26",
        "name": "Gujarat earthquake M7.7 — India (20,085 dead)",
        "type": "earthquake",
        "sev": 5,
        "deaths": 20085,
        "dmg": 5.5,
        "pss": 0.5,
        "stars": [
            "Corrected: Saturn 24.1°♉ (0°♊/anaretic claim removed)"
        ],
        "notes": "Bhuj earthquake, Indian Republic Day. Geodetic: MC=♊10.2°, IC=♐10.2°, ASC=♍11.9°. Jupiter 1.2°♊; prior Jupiter→MC 1.1° claim requires recomputation. Pluto→IC 2.9° (Pluto ♐13.1°, IC=♐10.2°). Saturn at 24.1°♉; prior 0°♊ world-axis/anaretic claim removed. Saturn/Pluto opposition forming (building toward exact Sep/Nov 2001) = T13. New moon Jan 24 = 2 days before (T19). Republic Day public gatherings amplified casualties.",
        "pair": null,
        "geostress": "Jupiter→MC claim requires recomputation; Pluto→IC 2.9°; Saturn 24.1°♉; Saturn/Pluto opp building",
        "source": "USGS; India Geological Survey 2001",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T8 Jupiter→MC claim requires recomputation · T8 Pluto→IC 2.9° · T10 Saturn 24.1°♉ · T13 Saturn/Pluto opp forming · T16 Saturn anaretic claim removed · T19 NM −2d"
        }
    },
    {
        "date": "2003-12-26",
        "name": "Bam earthquake M6.6 — Iran (26,271 dead)",
        "type": "earthquake",
        "sev": 5,
        "deaths": 26271,
        "dmg": 1.5,
        "pss": 0.82,
        "stars": [
            "Uranus ♓2.2° — DSC=♓2.3° (0.1° orb — highest-precision outer planet hit in dataset)"
        ],
        "notes": "Bam citadel destroyed at 05:26 local. Geodetic: MC=♉28.3°, IC=♏28.3°, ASC=♍2.3°, DSC=♓2.3°. Uranus→DSC 0.1° — essentially exact (Uranus ♓2.2°, DSC=♓2.3°). MC anaretic ♉28.3° + IC anaretic ♏28.3° — both primary angles at anaretic degree. Jupiter/Uranus opposition 174° (T6). New moon Dec 23 = 3 days before (T19). Saturn 10.2°♋ / Pluto 19.4°♐ near-opposition residual (T13). Poor adobe construction catastrophically amplified casualties for M6.6 event.",
        "pair": null,
        "geostress": "Uranus→DSC 0.1° exact; MC+IC both anaretic; Jupiter/Uranus opp 174°",
        "source": "USGS; IIEES Iran 2003",
        "crit": {
            "n": 9,
            "of": 28,
            "key": "T8 Uranus→DSC 0.1° EXACT · T6 Jupiter/Uranus opp 174° · T16 MC+IC anaretic ♉/♏28° · T19 NM −3d · T13 Saturn/Pluto opp residual · T29 Jupiter→VTX 2.0° · T32 Mars→IC Aries-ingress 1.8° · T32 Uranus→ASC Cap-ingress 0.3° · T32 Jupiter→DSC Libra-ingress 1.0°"
        }
    },
    {
        "date": "2004-12-26",
        "name": "Indian Ocean earthquake & tsunami — M9.1 (227,898 dead)",
        "type": "earthquake",
        "sev": 5,
        "deaths": 227898,
        "dmg": 15,
        "pss": 0.9,
        "stars": [
            "Scheat (Uranus 4°♓ — entering water sign)"
        ],
        "notes": "Deadliest natural disaster in recorded history. M9.1 at 7:58 AM local. Uranus 4°♓ (recently entered Pisces Dec 30 2003). Neptune 13°♒. Mars 0.6°♐. Jupiter 11°♎. N.Node ~28°♈ (approaching world point Aries). Saturn Rx 27°♋ (opposing Capricorn). T17: N.Node 28°♈ within 2° of world-point 0°♉ for SE Asia longitudes (~95°E = 5°♑ geodetic IC — N.Node sq IC). Full Moon Dec 26 EXACT — tsunami struck on Full Moon day. Uranus freshly in Pisces = water catastrophe archetype activated globally. T19: FM exact = highest possible lunation score.",
        "pair": null,
        "geostress": "Uranus in Pisces (water archetype); Saturn/Jupiter opposition backdrop",
        "source": "USGS; UN OCHA 2005",
        "crit": {
            "n": 8,
            "of": 28,
            "key": "T1 Saturn Rx station 2d · T3 total annular eclipse Dec 4 (22d) · T4 Scheat (Uranus 4°♓) · T7 Uranus Pisces ingress · T8 Uranus ingress Pisces · T13 outer aspect · T17 NNode 28°♈ sq SE Asia IC · T19 FM EXACT 0d · T31 Pluto antiscia→IC 1.6°"
        }
    },
    {
        "date": "2005-08-29",
        "name": "Hurricane Katrina — Cat 5, Gulf Coast (1,833 dead, $186B)",
        "type": "storm_cyclone",
        "sev": 5,
        "deaths": 1833,
        "dmg": 186,
        "pss": 0.77,
        "stars": [
            "Scheat (Neptune 15°♒)",
            "Algol (Mars 18°♉)"
        ],
        "notes": "Deadliest US hurricane since 1928. Cat 5 peak, Cat 3 at New Orleans landfall 6:10 AM CDT. Mars 18.4°♉ — wide from Algol (26°♉) and stationed Rx Oct 1. Mars retrograde in Taurus = building, compressed fire/mass event. Neptune 15°♒. Saturn 5.5°♌. Jupiter 16°♎. N.Node ~5°♈ (world point). S.Node 5°♎ (world point Libra). T17: Nodal axis exactly across 5°♈/5°♎ = world-point axis. S.Node 5°♎ within ~5° of ASC for New Orleans (90°W = 0°♑ geodetic — bending). T19: Full Moon Aug 19 = 10 days before — outer window. Mars Rx = Phase 2 trigger approaching station.",
        "pair": null,
        "geostress": "Mars Rx ♉ wide from Algol; Jupiter sq Neptune ♒",
        "source": "NOAA NCEI; Knabb et al. 2005",
        "crit": {
            "n": 8,
            "of": 28,
            "key": "T2 Mars Rx station Oct 1 (33d forward) · T4 Algol+Scheat · T5 Saturn 5.5°♌ · T7 Aries stellium · T9 Jupiter sq Neptune · T13 outer aspect · T17 NNode 5°♈ world point; SNode □ NOLA IC · T19 FM Aug 19 −10d"
        }
    },
    {
        "date": "2010-01-12",
        "name": "Haiti earthquake M7.0 — Port-au-Prince (316,000 dead)",
        "type": "earthquake",
        "sev": 5,
        "deaths": 316000,
        "dmg": 8,
        "pss": 0.94,
        "stars": [
            "Chiron 22°♒ (entering Pisces)"
        ],
        "notes": "Most lethal earthquake of the 21st century (to date). M7.0 at 4:53 PM. Saturn 4°♎ Rx (world point Libra). Pluto 3°♑ (world point Capricorn — sq Saturn! Cardinal T-Sq building). N.Node 18°♑ (conjunct Pluto within 15° — nodal stress). Mars Rx 19°♌ (opposite N.Node area). Jupiter 24°♒. Venus 22.3°♑. Chiron 22°♒ (freshly entering Pisces). T17: N.Node 18°♑ within 7° of Pluto ☌ — nodal/Pluto stress. S.Node 18°♋ (Cancer world point area). T19: New Moon Jan 15 = 3 days after earthquake. Chiron 22°♒ = pioneer mass-casualty signature.",
        "pair": null,
        "geostress": "Saturn sq Pluto forming — Cardinal world point T-Sq; Mars Rx backdrop",
        "source": "USGS; UNOSAT 2010",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T3 eclipse Jan 15 NM+3d · T4 Chiron 22°♒ Pisces ingress · T5 Pluto/Saturn world pts · T9 Saturn sq Pluto · T13 Cardinal world pt T-Sq · T17 NNode sq Pluto ♑ · T19 NM Jan 15 +3d · T29 Mars→VTX 0.3° EXACT · T30a Jupiter‖Neptune 0.80°"
        }
    },
    {
        "date": "2012-10-29",
        "name": "Hurricane Sandy — US East Coast (147 dead, $65B)",
        "type": "storm_cyclone",
        "sev": 5,
        "deaths": 147,
        "dmg": 65,
        "pss": 0.73,
        "stars": [
            "Antares (Saturn 2°♏)"
        ],
        "notes": "Superstorm Sandy made landfall New Jersey Oct 29 at 8:00 PM. Saturn freshly entered Scorpio (Oct 5 — 24 days prior). N.Node 25°♐ (approaching Galactic Center). Jupiter Rx 16°♊. Mars 23°♐ (conjunct N.Node within 2°! — nodal stress). Uranus Rx 5°♈ (world point). Full Moon Oct 29 = exact day of landfall. Saturn in early Scorpio = underground flooding, mass structural damage, subways flooded. T17: Mars ☌ N.Node 25°♐ within 2° = nodal stress. T19: FM exact = maximum timing score.",
        "pair": null,
        "geostress": "Uranus/Pluto Cardinal sq ongoing; Saturn freshly ♏",
        "source": "NOAA NCEI; Blake et al. 2013",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T2 Saturn ♏ ingress −24d · T4 Antares (Saturn ♏) · T5 Uranus 5°♈ world pt · T8 Saturn ingress ♏ · T9 Uranus/Pluto sq · T17 Mars ☌ NNode 2° · T19 FM EXACT 0d"
        }
    },
    {
        "date": "2017-08-25",
        "name": "Hurricane Harvey — Texas (107 dead, $125B)",
        "type": "flood",
        "sev": 5,
        "deaths": 107,
        "dmg": 125,
        "pss": 0.81,
        "stars": [
            "Chiron 27°♓ (Scheat zone)"
        ],
        "notes": "Record US flood event: 60 inches rain, $125B damage. Total solar eclipse Aug 21 (28°♌) = only 4 DAYS BEFORE Harvey's catastrophic landfall Aug 25. Eclipse path crossed continental US directly. N.Node ~24°♌ — eclipse at 28°♌ was 4° from N.Node = eclipse ON the nodal axis. Jupiter 23°♎ (sq N.Node). Chiron 27°♓ (near Scheat). Saturn Rx 21°♐. Mars 29°♌ (sq Scorpio). T17: Eclipse ☌ N.Node 4° — eclipse axis alignment perfect. T19: Eclipse as lunation = maximum +0.10 (eclipse at angle) + FM was eclipse itself.",
        "pair": null,
        "geostress": "Saturn/Uranus trine ♐/♈; Jupiter sq Saturn",
        "source": "NOAA NCEI; Blake & Zelinsky 2018",
        "crit": {
            "n": 8,
            "of": 28,
            "key": "T3 total solar eclipse Aug 21 −4d · T4 Chiron 27°♓/Scheat · T9 outer aspect · T11 Eclipse exactly preceding · T12 Mars trigger eclipse° · T13 outer aspect · T17 Eclipse ☌ NNode 4° · T19 eclipse = NM exact −4d"
        }
    },
    {
        "date": "2018-11-08",
        "name": "Camp Fire — California (85 dead, $16.5B)",
        "type": "wildfire",
        "sev": 5,
        "deaths": 85,
        "dmg": 16.5,
        "pss": 0.65,
        "stars": [
            "Algol (Uranus Rx 29°♈ — anaretic return to Aries)"
        ],
        "notes": "Deadliest California wildfire (at time). Paradise CA destroyed. Uranus Rx 29°♈ (anaretic Aries — final degree, re-entering Aries from Taurus). Jupiter ingressed Sagittarius Nov 8 EXACT DAY (0°♐ = world point ingress). Venus Rx 26°♎. Saturn 4°♑. N.Node ~28°♋. Mars 28°♒. T16: Uranus Rx 29°♈ = anaretic degree, compressing Aries fire archetype. T17: N.Node 28°♋ opposing Mars 28°♒ = nodal opposition stress. T19: New Moon Nov 7 = 1 day before.",
        "pair": null,
        "geostress": "Uranus anaretic Aries return; Jupiter/Neptune sq backdrop",
        "source": "CAL FIRE 2018; NOAA",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T2 Uranus Rx ♉/♈ ingress · T5 Uranus 29°♈ anaretic · T8 Jupiter 0°♐ world point ingress EXACT · T13 outer aspect · T16 Uranus anaretic · T17 NNode ☍ Mars · T19 NM Nov 7 −1d"
        }
    },
    {
        "date": "2020-08-04",
        "name": "Beirut port explosion — Lebanon (218 dead, $15B)",
        "type": "explosion",
        "sev": 5,
        "deaths": 218,
        "dmg": 15,
        "pss": 0.71,
        "stars": [
            "Algol (Mars 23°♈ — building to Algol opposition from ♎? No; approaching Taurus via sq)"
        ],
        "notes": "Largest non-nuclear explosion in history. 2,750 tonnes ammonium nitrate. Saturn Rx 27°♑ / Jupiter Rx 22°♑ / Pluto Rx 23°♑ — rare triple conjunction in Capricorn (Capricorn world point cluster). Mars 21°♈ (approaching Algol opposition: Mars ♈ opp 26°♉ Algol from 21°♈ is within 7° of opposition — Algol activation via opposition). N.Node 28°♊ (anaretic Gemini). S.Node 28°♐ (Galactic Center). Chiron 8°♈. T17: N.Node 28°♊ = anaretic bending point; Saturn/Jupiter/Pluto ☌ world pt ♑. T19: Full Moon Aug 3 = 1 day before.",
        "pair": null,
        "geostress": "Saturn/Jupiter/Pluto triple conjunction ♑ — rare world-point compressive cluster",
        "source": "Human Rights Watch; World Bank 2020",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T1 Saturn Rx conjunction cluster · T5 Saturn/Pluto/Jupiter 0° world pt area · T9 triple conjunction ♑ · T13 cardinal world pt · T16 Mars ☍ Algol (7° orb) · T17 NNode 28°♊ anaretic bending · T19 FM Aug 3 −1d"
        }
    },
    {
        "date": "2022-08-25",
        "name": "Pakistan mega-floods — (1,739 dead, $30B, 33M affected)",
        "type": "flood",
        "sev": 5,
        "deaths": 1739,
        "dmg": 30,
        "pss": 0.74,
        "stars": [
            "Chiron 15°♈ (Mars ♊ sq)"
        ],
        "notes": "One-third of Pakistan underwater. Most extreme flood since 1950. Mars 3.0°♊ (past Aldebaran). Saturn Rx 22°♒. N.Node 15°♉. Uranus 18°♉ (conjunct N.Node within 3°! — massive nodal/Uranian stress). Jupiter Rx 7°♈ (world point). Neptune Rx 24°♓ (Scheat approach zone). Chiron 15°♈. T17: Uranus ☌ N.Node 15–18°♉ within 3° — Uranian nodal stress = sudden catastrophic earth disruption (Uranus in Taurus = land/infrastructure). S.Node 15°♏ (opposite Uranus/Node) = maximum nodal tension. T19: Full Moon Aug 11 (14d prior) and New Moon Aug 27 (+2d) — NM just after.",
        "pair": null,
        "geostress": "Uranus/Saturn sq ongoing ♉/♒; Jupiter Rx world point",
        "source": "OCHA; Pakistan NDMA 2022",
        "crit": {
            "n": 8,
            "of": 28,
            "key": "T1 Saturn Rx station Oct 23 · T4 Chiron (Mars sq) · T5 Jupiter 7°♈ world pt · T7 Aries bodies · T9 outer aspect · T13 outer aspect · T17 Uranus ☌ NNode 3° — MAJOR · T19 NM Aug 27 +2d"
        }
    },
    {
        "date": "2024-01-02",
        "name": "Storm Henk/Annelie — UK/Europe",
        "type": "storm_cyclone",
        "sev": 2,
        "deaths": 0,
        "dmg": 2,
        "pss": 0.31,
        "stars": [],
        "notes": "Uranus direct 19° Taurus Jan 27 shortly after",
        "pair": null,
        "geostress": null,
        "source": "Wikipedia Weather 2024",
        "crit": {
            "n": 2,
            "of": 28,
            "key": "T1 Uranus-D decay (Jan 27 +25d) · T9 outer aspect"
        }
    },
    {
        "date": "2024-06-28",
        "name": "Hurricane Beryl — earliest Cat 5 Atlantic ever",
        "type": "storm_cyclone",
        "sev": 4,
        "deaths": 73,
        "dmg": 7,
        "pss": 0.58,
        "stars": [
            "Scheat (29°♓ — Neptune near)"
        ],
        "notes": "Neptune 29° Pisces conjunct Scheat; Saturn Rx approaching 19° Pisces",
        "pair": null,
        "geostress": "Uranus ♉ / Pluto ♒ Fixed sq background",
        "source": "NOAA NCEI; Wikipedia 2024",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T2 Saturn Rx station Jun 29 (+1d) · T4 Scheat/Neptune · T9 outer aspect · T13 geostress"
        }
    },
    {
        "date": "2024-09-06",
        "name": "Typhoon Yagi — Myanmar/Vietnam (805 dead)",
        "type": "storm_cyclone",
        "sev": 4,
        "deaths": 805,
        "dmg": 12,
        "pss": 0.56,
        "stars": [
            "Chiron 19°♈ (Mars ♋ sq — pioneer death toll)"
        ],
        "notes": "Uranus Rx 27° Taurus; Mars sq Saturn; Mars sq Chiron ♈. Deadliest Pacific typhoon since 2013.",
        "pair": null,
        "geostress": "Uranus ♉ / Pluto ♒ Fixed sq; Mars trigger on Pluto degree",
        "source": "EM-DAT 2024",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T1 Jupiter Rx station Oct 9 (33d) · T3 Oct 2 eclipse 26d · T4 Chiron · T9 Mars sq Saturn · T10 Sep 17 partial lunar (−11d) · T12 Mars trigger Pluto° · T13 Fixed sq"
        }
    },
    {
        "date": "2024-09-26",
        "name": "Hurricane Helene — Cat 4, deadliest US since Katrina",
        "type": "flood",
        "sev": 5,
        "deaths": 225,
        "dmg": 78.7,
        "pss": 0.78,
        "stars": [
            "Scheat (Neptune 27°♓)",
            "Chiron 19°♈ (Mars ♋ sq exact — deadliest US storm since Katrina)"
        ],
        "notes": "Saturn Rx 12°♓; Neptune 27°♓ conjunct Scheat exact; Sep 17 eclipse −9d; OOB Mars; Mars sq Chiron exact = pioneer casualty signature",
        "pair": "Pair A corridor (Oct 2 annular approaching +6d)",
        "geostress": "Uranus/Pluto Fixed sq; Pluto 29°♑ anaretic sq Aries/Libra bending",
        "source": "NOAA NCEI 2025",
        "crit": {
            "n": 11,
            "of": 28,
            "key": "T1 Jupiter Rx 13d · T2 Uranus Rx ~25d · T3 Oct 2 annular+6d & Sep 17 partial · T4 Scheat+Chiron · T5 Pluto 29°♑ · T6 OOB Mars · T9 outer aspect · T10 Sep 17 partial lunar −9d · T11 Pair A · T12 Mars sq Chiron exact · T13 Fixed sq"
        }
    },
    {
        "date": "2024-10-09",
        "name": "Hurricane Milton — Tampa, Cat 3",
        "type": "storm_cyclone",
        "sev": 4,
        "deaths": 24,
        "dmg": 34.3,
        "pss": 0.64,
        "stars": [
            "Scheat (Neptune 27°♓)",
            "Chiron 19°♈ (Mars ♋ sq)"
        ],
        "notes": "Jupiter Rx STATIONS at 21°♊ on day of landfall; Saturn Rx 12°♓; Mars sq Chiron ♈ continuing",
        "pair": "Pair A — Oct 2 annular exact anchor (−7d from today)",
        "geostress": "Uranus ♉ / Pluto ♒ Fixed sq; Jupiter station direct trigger",
        "source": "NOAA NCEI 2025",
        "crit": {
            "n": 10,
            "of": 28,
            "key": "T1 Jupiter station direct exact · T2 Uranus Rx ~38d · T3 Oct 2 annular −7d · T4 Scheat+Chiron · T5 Pluto 29°♑ · T9 Mars sq outer · T11 Pair A anchor · T12 Jupiter station Phase 2 trigger · T13 Fixed sq · T14 Chiron"
        }
    },
    {
        "date": "2024-10-29",
        "name": "Valencia Spain DANA floods — 224 dead",
        "type": "flood",
        "sev": 5,
        "deaths": 224,
        "dmg": 11,
        "pss": 0.81,
        "stars": [
            "Scheat (Neptune 27°♓ exact)",
            "Chiron 19°♈ (Mars ♋ sq — most lethal EU flood in decades)"
        ],
        "notes": "Most lethal European flood in decades. Saturn Rx 13°♓; Neptune conjunct Scheat exact; OOB Moon; Mars sq Chiron = pioneer regional casualty scale",
        "pair": "Pair A — Oct 2 annular (−27d)",
        "geostress": "Uranus/Pluto Fixed sq; Pluto 29°♑ anaretic sq bending",
        "source": "US News; Yale Climate Connections",
        "crit": {
            "n": 8,
            "of": 28,
            "key": "T1 Jupiter station 20d · T3 Oct 2 annular −27d · T4 Scheat+Chiron · T5 Pluto 29°♑ · T6 OOB Moon · T9 outer aspect · T11 Pair A · T13 Fixed sq"
        }
    },
    {
        "date": "2025-01-07",
        "name": "LA Palisades & Eaton fires — costliest wildfires in world history",
        "type": "wildfire",
        "sev": 5,
        "deaths": 29,
        "dmg": 65,
        "pss": 0.83,
        "stars": [
            "Algol (Uranus 23°♉)",
            "Chiron 21°♈ (Mars Rx ♋ sq — costliest wildfire in history)"
        ],
        "notes": "Mars Rx Cancer; Uranus Rx 23°♉ near Algol; OOB Mars; Santa Ana winds; Mars Rx sq Chiron ♈ = costliest-ever wildfire Chiron pioneer signature. ⚠ deaths VERIFY: ~29 confirmed",
        "pair": "Pair A corridor — between Oct 2 '24 and Mar 29 '25 eclipses",
        "geostress": "T-Sq: Mars Rx ♋ sq Uranus ♉ / Pluto ♒ (Cardinal apex, Fixed base)",
        "source": "Gallagher Re 2025 — deaths ⚠ VERIFY",
        "crit": {
            "n": 8,
            "of": 28,
            "key": "T2 Mars Rx station Dec 6 (32d) · T3 Mar 29 eclipse 81d · T4 Algol+Chiron · T6 OOB Mars (multiplier) · T9 outer aspect · T11 Pair A · T12 Mars Rx sq Chiron Phase 2 · T13 Cardinal T-Sq"
        }
    },
    {
        "date": "2025-01-20",
        "name": "Historic Gulf Coast winter storm — records Louisiana/Florida",
        "type": "winter_storm",
        "sev": 3,
        "deaths": 10,
        "dmg": 3,
        "pss": 0.38,
        "stars": [],
        "notes": "Saturn in Pisces; Uranus Rx Taurus; coldest January in 10 years",
        "pair": "Pair A corridor",
        "geostress": "Uranus/Pluto Fixed sq background",
        "source": "Wikipedia Weather 2025",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T2 Mars Rx 45d · T3 Mar 29 eclipse 68d · T11 Pair A · T13 Fixed sq"
        }
    },
    {
        "date": "2025-04-02",
        "name": "Tornado outbreak + flash flooding — US South/Midwest",
        "type": "tornado",
        "sev": 4,
        "deaths": 40,
        "dmg": 4.5,
        "pss": 0.51,
        "stars": [
            "Aldebaran (Mars in Aries/Gemini)"
        ],
        "notes": "Jupiter Cancer sq Aries planets; Mars direct mid-Aries",
        "pair": "Post Pair A (Mar 29 eclipse just passed)",
        "geostress": "Cardinal T-Sq building: Jupiter ♋ sq Saturn/Neptune ♈",
        "source": "Wikipedia Weather 2025",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T2 Mars direct station Feb 24 (37d) · T3 Mar 29 partial solar −4d · T4 Aldebaran · T9 Jupiter sq Aries · T11 Pair A post-window · T13 Cardinal T-Sq"
        }
    },
    {
        "date": "2025-05-16",
        "name": "EF4 Kentucky + EF3 St. Louis — 28 dead",
        "type": "tornado",
        "sev": 4,
        "deaths": 28,
        "dmg": 2.5,
        "pss": 0.52,
        "stars": [
            "Aldebaran"
        ],
        "notes": "Jupiter 17°♋ sq Aries stellium; Mars in Aries; EF3 140mph St. Louis. Saturn enters Aries May 24 (8d later — approaches ingress)",
        "pair": null,
        "geostress": "Cardinal T-Sq: Jupiter ♋ sq Saturn ♈ / Neptune ♈",
        "source": "ABC News Dec 2025",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T3 Mar 29 eclipse 48d · T4 Aldebaran · T7 Aries stellium (Mars+Neptune+Chiron) · T9 Jupiter sq Aries · T13 Cardinal T-Sq"
        }
    },
    {
        "date": "2025-06-20",
        "name": "EF-5 Enderlin ND — first EF5 in US in 10+ years",
        "type": "tornado",
        "sev": 5,
        "deaths": 0,
        "dmg": 1.5,
        "pss": 0.62,
        "stars": [
            "Aldebaran (Mars sq Uranus)",
            "Antares (Sun opp Solstice)"
        ],
        "notes": "210mph winds. Mars sq Uranus; Summer Solstice 0°♋ world point; Uranus 28°♉ — 17d before Gemini ingress (Jul 7)",
        "pair": null,
        "geostress": "Cardinal T-Sq: Jupiter ♋ sq Saturn ♈; Mars trigger on Uranus ingress degree",
        "source": "ABC News Dec 2025",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T3 Mar 29 eclipse 83d · T4 Aldebaran+Antares · T8 Solstice Sun ingress 0°♋ · T9 Mars sq Uranus · T12 Mars trigger Uranus° · T13 Cardinal T-Sq · T14 Chiron"
        }
    },
    {
        "date": "2025-07-04",
        "name": "Texas Hill Country flash floods — deadliest US inland flood in 50 years",
        "type": "flood",
        "sev": 5,
        "deaths": 135,
        "dmg": 5,
        "pss": 0.73,
        "stars": [
            "Chiron ~21°♈ (Jupiter ♋ sq — deadliest US inland flood in 50 yrs)"
        ],
        "notes": "MCV 20\" in 6h. Neptune 3°♈; Saturn 8°♈; Jupiter Cancer sq Chiron ♈ within ~4° = pioneer regional flood signature. Uranus enters Gemini Jul 7 (+3d). World point cluster 0–3°♈.",
        "pair": null,
        "geostress": "Cardinal T-Sq: Jupiter ♋ sq Saturn ♈ at near-exact; Mars trigger",
        "source": "Climate Central 2025",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T4 Chiron · T7 Aries stellium (Sat+Nep+Chiron) · T8 Uranus Gemini ingress +3d · T9 Jupiter sq Aries · T12 Mars trigger · T13 Cardinal T-Sq"
        }
    },
    {
        "date": "2003-08-11",
        "name": "European heatwave — 2003 (70,000 dead)",
        "type": "heatwave",
        "sev": 5,
        "deaths": 70000,
        "dmg": 8,
        "pss": 0.89,
        "stars": [
            "Antares (Sun opp 9°♐)",
            "Chiron ~22°♈ (Sun ♋ sq ~1° orb)"
        ],
        "notes": "Sun at ~23°♋ sq Chiron 22°♈ within 1°; Sun opp Antares. Mars in Leo. Deaths ~70,000 (WHO estimate, Europe-wide; early estimates were 24,000 France-only) — Sun sq Chiron = 'record-breaking' heat pioneer signature",
        "pair": null,
        "geostress": "Cardinal T-Sq: Jupiter late ♋ sq Saturn ♈; Sun trigger crossing Antares opp degree",
        "source": "Yale Climate Connections Jan 2026 — ⚠ VERIFY ALL FIGURES",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T4 Antares+Chiron · T7 Aries stellium (Sat+Nep+Chiron) · T8 Mars ingress Leo · T9 outer aspect · T12 Sun Phase 2 trigger sq Chiron · T13 Cardinal T-Sq · T30a Jupiter⊥Pluto 0.13° · T30b Pluto‖Mars 0.61°"
        }
    },
    {
        "date": "2025-10-28",
        "name": "Hurricane Melissa — Cat 5 landfall Jamaica",
        "type": "storm_cyclone",
        "sev": 5,
        "deaths": 200,
        "dmg": 6,
        "pss": 0.6,
        "stars": [
            "Scheat (Neptune ♈ opp)"
        ],
        "notes": "First Cat 5 landfall Jamaica since 1988. Mars triggering Saturn/Neptune midpoint",
        "pair": null,
        "geostress": "Mars Phase 2 trigger: crossed Saturn/Neptune midpoint degree",
        "source": "WWA 2025; Earth.org Jan 2026",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T1 Saturn direct Nov 27 (30d) · T4 Scheat · T9 Neptune ♈ opposition · T12 Mars trigger Sa/Ne midpoint · T13 Cardinal T-Sq"
        }
    },
    {
        "date": "2025-11-22",
        "name": "Indonesia/Malaysia overlapping cyclones — 1,800 dead",
        "type": "flood",
        "sev": 5,
        "deaths": 1800,
        "dmg": 25,
        "pss": 0.76,
        "stars": [
            "Scheat (opp from 29°♍)"
        ],
        "notes": "Two overlapping tropical cyclones. Saturn 15°♈; Neptune 5°♈. Sa/Ne midpoint exactly over SE Asia longitudes.",
        "pair": null,
        "geostress": "Saturn direct station Nov 27 (+5d) = Phase 2 trigger releasing 3-month pressure",
        "source": "Earth.org Jan 2026; Christian Aid 2025",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T1 Saturn direct station +5d · T3 Feb 17 eclipse 87d · T4 Scheat · T7 Aries stellium (Sat+Nep+Chiron) · T13 compound pattern"
        }
    },
    {
        "date": "2025-11-28",
        "name": "Cyclone Senyar — Thailand/Indonesia (1,482 dead)",
        "type": "storm_cyclone",
        "sev": 5,
        "deaths": 1482,
        "dmg": 9,
        "pss": 0.74,
        "stars": [
            "Scheat"
        ],
        "notes": "Exceptionally rare tropical cyclone in Thailand. Saturn direct station exact Nov 27 (−1d). Sa/Ne midpoint over Thai Gulf longitudes.",
        "pair": null,
        "geostress": "Saturn direct station = Phase 2 trigger; Sa/Ne midpoint over Thai Gulf longitudes",
        "source": "Yale Climate Connections Jan 2026",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T1 Saturn direct station exact −1d · T3 Feb 17 eclipse 81d · T4 Scheat · T7 Aries stellium · T13 compound cluster"
        }
    },
    {
        "date": "2025-11-30",
        "name": "Cyclone Ditwah — Sri Lanka (643 dead, $4.1B)",
        "type": "flood",
        "sev": 5,
        "deaths": 643,
        "dmg": 4.1,
        "pss": 0.72,
        "stars": [
            "Scheat"
        ],
        "notes": "Deadliest cyclone Sri Lanka since 1978. Saturn/Neptune Aries midpoint over Indian Ocean longitudes. Triple cyclone cluster.",
        "pair": null,
        "geostress": "Triple cyclone cluster Nov 22–30: compound release of Saturn direct station trigger",
        "source": "Yale Climate Connections Jan 2026",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T1 Saturn direct station −3d · T3 Feb 17 eclipse 79d · T4 Scheat · T7 Aries stellium · T13 triple cluster"
        }
    },
    {
        "date": "2024-12-29",
        "name": "Jeju Air Boeing 737 crash — South Korea (179 dead)",
        "type": "aviation",
        "sev": 5,
        "deaths": 179,
        "dmg": 0.5,
        "pss": 0.44,
        "stars": [
            "Algol (Uranus Rx 23°♉)"
        ],
        "notes": "Worst aviation disaster in South Korean history. Belly landing at Muan Airport, gear failure. Uranus Rx 23°♉ near Algol. Mercury Rx in Sagittarius (equipment/comms). OOB Mars (Rx in Cancer).",
        "pair": "Pair A corridor (Oct 2 '24 / Mar 29 '25)",
        "geostress": "Uranus/Pluto Fixed sq background",
        "source": "ICAO; Wikipedia Dec 2024",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T2 Mars Rx station Dec 6 (23d) · T3 Oct 2 annular (88d) · T4 Algol (Uranus) · T6 OOB Mars · T11 Pair A corridor"
        }
    },
    {
        "date": "2025-01-29",
        "name": "American Airlines / Black Hawk midair collision — Washington DC (67 dead)",
        "type": "aviation",
        "sev": 5,
        "deaths": 67,
        "dmg": 0.8,
        "pss": 0.47,
        "stars": [
            "Algol (Uranus Rx 23°♉)",
            "Chiron 21°♈ (Mars Rx sq — deadliest US air crash since 2001)"
        ],
        "notes": "AA Flt 5342 + Army Black Hawk collided near Reagan Airport. Mars Rx in Cancer (retrograde = reversed/unexpected motion). Deadliest US air disaster since 9/11. OOB Mars. Mars sq Chiron = pioneer disaster signature.",
        "pair": "Pair A corridor",
        "geostress": "Cardinal T-Sq forming: Mars Rx ♋ sq Saturn/Neptune ♈",
        "source": "NTSB; FAA 2025",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T2 Mars Rx station Dec 6 (54d) · T3 Mar 29 eclipse (59d) · T4 Algol+Chiron · T6 OOB Mars · T11 Pair A · T13 Cardinal T-Sq forming"
        }
    },
    {
        "date": "2026-02-07",
        "name": "Morocco record flooding — 43 dead, 300,000 displaced, 2M affected",
        "type": "flood",
        "sev": 4,
        "deaths": 43,
        "dmg": 1.8,
        "pss": 0.58,
        "stars": [
            "Algol (Uranus direct station 27°27'♉ — 1°17' orb from Algol 26°10'♉)"
        ],
        "notes": "CURRENT VALIDATION — T16. Record Atlantic lows battered northern Morocco Jan 31–Feb 15, 2026. Uranus stationed direct Feb 4 at 27°27'♉ — within 1°17' of Algol. Station window: ±7 days. 2 million people affected; 43 dead; 150,000 displaced day one; 300,000 ultimately displaced. Concurrent: Brazil Minas Gerais floods. Feb 17 annular eclipse approaching (+10d). Validates Uranus direct station near Algol as mass displacement/flood trigger within the station orb window.",
        "pair": "Pair B corridor (Feb 17 eclipse +10d)",
        "geostress": "Uranus final Taurus pass; Saturn-Neptune conjunction Dec 10, 2025 (+97d after exact conj Dec 10, 2025 ~1°♈)",
        "source": "The Watchers; France 24; ReliefWeb; Euronews Feb 2026",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T2 Uranus direct station Feb 4 (−3d) · T3 Feb 17 eclipse (+10d) · T4 Algol (Uranus 1°17' orb) · T11 Pair B opening · T16 Zodiacal Star Activation — Uranus/Algol station"
        }
    },
    {
        "date": "2026-04-20",
        "name": "Japan Sanriku earthquake M7.4 — tsunami warning (175,957 evacuated)",
        "type": "earthquake",
        "sev": 4,
        "deaths": 0,
        "dmg": 1,
        "pss": 0.62,
        "stars": [
            "Algol (Uranus 29°♉ anaretic — 5 days before Gemini ingress Apr 25)"
        ],
        "notes": "CURRENT VALIDATION — T16 anaretic. M7.4 off Iwate/Sanriku coast, northeastern Japan. Tsunami warning issued (waves to 3m); 82,811 households evacuated across 40 municipalities (175,957 people); 10 injured. Uranus at ~29°♉ = anaretic final Taurus degree. Historical echo: 2011 Tōhoku struck when Uranus was at 29°♓ anaretic (Scheat). Pattern confirmed: Uranus at the anaretic degree of its current sign = maximum threshold pressure → seismic release, especially Japan (Pacific Ring of Fire). Uranus entered Gemini Apr 25, closing the Taurus/Algol window permanently until ~2102.",
        "pair": "Pair B corridor (Aug 12 eclipse 114d)",
        "geostress": "Uranus anaretic 29°♉ final Taurus degree approaching Gemini ingress; Cardinal T-Sq remnant",
        "source": "USGS; CNN; Al Jazeera; Japan Times; NBC News Apr 2026",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T2 Uranus Gemini ingress −5d · T3 Aug 12 eclipse (114d) · T4 Algol anaretic (Uranus 29°♉) · T11 Pair B · T16 Zodiacal Star Activation — anaretic threshold"
        }
    },
    {
        "date": "2025-07-30",
        "name": "Kamchatka M8.8 earthquake + Pacific tsunami — Russia",
        "type": "earthquake",
        "sev": 5,
        "deaths": 1,
        "dmg": null,
        "pss": 0.62,
        "stars": [
            "Aldebaran (Uranus 2°♊ approaching — 7° orb, T16 pre-activation)"
        ],
        "notes": "M8.8 off Kamchatka Peninsula (54°N, 160°E) — Pacific-wide tsunami. Kamchatka geodetic MC=10°♍. No classical planet at 10°♍/10°♓ for direct MC/IC hit. KEY: Uranus entered Gemini Jul 7 (±23d); Uranus ASC line at 2°♊ sweeps ~157-162°E at 54°N latitude = direct T20 ASC hit on Kamchatka ⚑. Saturn ~9°♈ / Neptune ~4°♈ — world-point cluster ongoing. Jupiter ~16°♋ sq Aries stellium (T9). NM ~Jul 28-29 in Leo ±1-2d before event (T19). N.Node ~0-3°♈ (world-point; Saturn malefic node stress T17). Ring of Fire T21 ×1.25 applies. Model flags high-risk window globally but cannot specify 160°E without ASC line calculation — confirms T20 gap. ⚠ deaths/damage unconfirmed — verify in USGS/UNDRR.",
        "pair": null,
        "geostress": "Uranus Gemini ingress ±23d; Aries stellium Saturn+Neptune+Chiron; Jupiter Cancer sq backdrop",
        "source": "PreventionWeb / Tsunami warning services Jul 2025 — ⚠ VERIFY FIGURES",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T8 Uranus Gemini ingress ±23d · T7 Aries stellium · T9 Jupiter sq Aries · T17 Saturn~Node ♈ · T19 NM ±2d · T20 Uranus ASC line ~160°E at 54°N (Ring of Fire ×1.25)"
        }
    },
    {
        "date": "2026-05-07",
        "name": "Mount Dukono eruption — Maluku Islands, Indonesia (★ VERIFY casualty data)",
        "type": "volcano",
        "sev": 3,
        "deaths": 3,
        "dmg": null,
        "pss": 0.58,
        "stars": [
            "Aldebaran (approaching — Uranus 2°♊ ongoing)"
        ],
        "notes": "Mount Dukono (127°E), Maluku Islands, erupted 22:41 GMT May 7/07:41 local May 8. 20 hikers missing. Pluto Rx station May 6 = eruption 1 day later (T20 Pluto volcano rule +0.14 ✓). Pluto at 3°♒ → IC line at 123°E; Maluku at 127°E = 4° off (within 5° broad orb). Saturn☌Neptune ~2-3°♈ world-point exact (T1). Moon transited local MC (7°♌ = 127°E) ~04:00 GMT = ~19 hours before eruption (T19 Moon-angle transit +0.08). Venus Rx Apr 21-Jun 4 (CORRECTED to Oct 3-Nov 14 — this date is BEFORE Venus Rx, no Venus Rx overlap). T21 Ring of Fire ×1.25 applies (Indonesia volcanic arc). Model would have flagged Pluto station window for underground pressure release but misidentified zone (Pluto IC at 123°E vs actual 127°E = 4° miss). Volcanic fingerprint (T20) now closes this gap.",
        "pair": "Pair B active",
        "geostress": "Saturn☌Neptune world-point; Pluto Rx station exact the day before eruption",
        "source": "BBC / Indonesian authorities May 2026 — ⚠ casualty figures unconfirmed",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T1 Saturn☌Neptune world-point · T5 Pluto Rx station May 6 · T9 Jupiter Cancer sq Aries · T19 Moon MC transit 04:00 GMT · T20 Pluto volcano Rx+1d (Ring of Fire ×1.25) · T21 Ring of Fire multiplier"
        }
    },
    {
        "date": "2026-03-17",
        "name": "TC Narelle — NW Australia historic cyclone (Mar 17–29, 2026)",
        "type": "storm_cyclone",
        "sev": 4,
        "deaths": 66,
        "dmg": null,
        "pss": 0.74,
        "stars": [
            "Scheat zone (NM ~Mar 14-15 at ~24°♓ within 5° of Scheat 29°♓)"
        ],
        "notes": "Severe TC Narelle — historic, long-lived. NW Australian coast, ~115-125°E. Saturn☌Neptune EXACT at ~0-2°♈ (peak conjunction Feb-Mar 2026) = Neptune storms + Saturn landfall severity. Uranus 29°♉ anaretic T16 active. Pluto at ~1-2°♒ → IC line at 121-122°E = NW Australian Kimberley coast ✓ (GEO_ZONES labeled only Philippines — FIX APPLIED). Feb 17 eclipse ±28 days (T3). NM ~Mar 14-15 in ♓ ±3d before onset (T19). Jupiter ~22°♋ → MC line 112°E (western edge of NW Australia zone). T21 S.Hem cyclone season modifier (Nov-Apr, 5-25°S) applies. Model DOES capture this at PSS ~0.74 if Pluto IC zone labeled correctly for NW Australia.",
        "pair": "Pair B (Feb 17 eclipse 28d prior)",
        "geostress": "Sa☌Ne exact world-point peak Feb-Mar 2026; Uranus 29°♉ anaretic; Pluto IC 121-123°E",
        "source": "BOM (Bureau of Meteorology) Australia — ⚠ severity/death figures unconfirmed",
        "crit": {
            "n": 8,
            "of": 28,
            "key": "T1 Saturn☌Neptune EXACT world-point · T3 Feb 17 eclipse ±28d · T4 Scheat NM proximity · T7 Aries stellium · T9 Jupiter Cancer sq Aries · T16 Uranus 29°♉ anaretic · T19 NM ±3d · T21 S.Hem cyclone season + Pluto IC 121-123°E NW Australia"
        }
    },
    {
        "date": "2008-05-02",
        "name": "Cyclone Nargis — Myanmar 2008 (138,000 dead)",
        "type": "storm_cyclone",
        "sev": 5,
        "deaths": 138366,
        "dmg": 10,
        "pss": 0.77,
        "stars": [
            "Pluto (1°♑ world-point ingress — first Capricorn passage)"
        ],
        "notes": "GAP-CLOSURE v7.2. Deadliest cyclone in Asia since 1991. Pluto entered Capricorn Jan 26 2008 (world-point ingress — highest weight). Mars 26.1°♋ SQUARE Pluto 1°♑ exact at time of landfall = T9 Mars/Pluto exact sq. Saturn 2°♍ Rx. Uranus 21°♓ / Neptune 23°♒ (water-sign backdrop). NM Apr 20 (−12d). FM May 20 (+18d outer window). ⚠ Model gap: no eclipse corridor active. Standalone Mars sq Pluto + Pluto world-point ingress drove event. Confirms T5+T9 can produce PSS~0.70 without eclipse support. Bay of Bengal cyclone corridor (10°N–25°N) NOT covered by T21 S.Hem modifier — systematic gap.",
        "pair": null,
        "geostress": "Mars sq Pluto exact on world-point ingress; Saturn Rx ♍ (structural failure)",
        "source": "WMO; UN OCHA 2008",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T8 Jupiter→IC 4.8° · T16 Pluto ♐29.5° anaretic/0°♑ ingress · T10 Pluto world-axis · T6 Jupiter△Saturn · T4 Mars☌Regulus · T32 Ingress Mars→MC 0.6° EXACT"
        }
    },
    {
        "date": "2008-05-12",
        "name": "Sichuan earthquake — China 2008 (87,000 dead)",
        "type": "earthquake",
        "sev": 5,
        "deaths": 87587,
        "dmg": 86,
        "pss": 0.94,
        "stars": [
            "Pluto (0–1°♑ world-point)"
        ],
        "notes": "GAP-CLOSURE v7.2. Deadliest earthquake in China since 1976. Pluto 0–1°♑ world-point (same as Nargis 10d prior). NM May 5 (−7d EXACT — maximum T19 lunation timing score). Mars 1.4°♌ sq Pluto 0°♑ ongoing. Saturn 2°♍ Rx. Sichuan geodetic MC ~103°E = 13°♋. Saturn☌Neptune future echo (2026) mirrors same Cancer/Capricorn axis. T23a: Cardinal Cancer/Capricorn axis active with Mars+Pluto = hurricane/seismic axis. Strong case that NM −7d on active Pluto world-point drove seismic release.",
        "pair": null,
        "geostress": "Pluto world-point ingress; Mars sq Pluto; NM −7d exact",
        "source": "USGS; China Earthquake Administration 2008",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T8 Jupiter→IC 0.8° NEAR-EXACT · T16 Pluto ♐29.6° anaretic · T10 Pluto world-axis · T6 Jupiter△Saturn · T19 NM May 5 −7d · T30b Jupiter⊥Mars 0.06° EXACT · T31 Uranus antiscia→AVX 0.3°"
        }
    },
    {
        "date": "2010-08-18",
        "name": "Pakistan floods 2010 (2,000 dead, 20M displaced)",
        "type": "flood",
        "sev": 5,
        "deaths": 1985,
        "dmg": 43,
        "pss": 0.99,
        "stars": [
            "Chiron 0°♓ (world-point water ingress)"
        ],
        "notes": "GAP-CLOSURE v7.2. Different event from 2022 Pakistan floods. Cardinal Grand Cross active: Saturn 0°♎ (world-pt Libra ingress!), Uranus 0°♈ Rx (world-pt Aries!), Jupiter 3°♈ Rx (world-pt Aries!), Pluto 3°♑. Four planets at or near cardinal world-points simultaneously = T-Cross/Grand Cross — rarest configuration. NM Aug 10 (−8d), FM Aug 24 (+6d). Monsoon season amplifier: Chiron 0°♓ freshly entered water sign. Cardinal Grand Cross is highest-weight outer-planet configuration in model. PSS est ~0.79 — should be highest-scoring 2010 event.",
        "pair": null,
        "geostress": "Cardinal Grand Cross: Saturn 0°♎ / Uranus+Jupiter 0–3°♈ / Pluto 3°♑ — all world-point degrees",
        "source": "UN OCHA; IFRC 2010",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T5/T10 Cardinal Grand Cross 4 world pts · T6 Saturn□Pluto 1.5° · T6 Jupiter☌Uranus · T4/T16 Uranus☌Scheat anaretic · T13 Grand Cross · T16 Uranus ♓28.1° · T6 Saturn☍Uranus · T30a Jupiter‖Uranus 0.53° · T30a Saturn⊥Uranus 0.92° · T30b Saturn⊥Mars 0.45° · T30b Uranus‖Mars 0.47°"
        }
    },
    {
        "date": "2013-11-08",
        "name": "Typhoon Haiyan — Philippines 2013 (6,300 dead)",
        "type": "storm_cyclone",
        "sev": 5,
        "deaths": 6340,
        "dmg": 13,
        "pss": 0.95,
        "stars": [
            "Chiron 9°♓ (sq Uranus 9°♈ exact world-point)"
        ],
        "notes": "GAP-CLOSURE v7.2. Strongest tropical cyclone ever recorded at landfall (315 km/h). NM Nov 3 at 11°♏ = FIVE DAYS BEFORE, conjunct Saturn 14°♏ AND N.Node 9°♏ simultaneously — maximum T19+T17 compound stack. Saturn freshly in Scorpio (ingressed Oct 5 2012, now 14°♏). N.Node 9°♏ conjunct Saturn within 5° = T17 malefic node stress (+0.15). Jupiter 20°♋ = Cancer water expansion. Uranus 9°♈ Rx (world-point). Philippines geodetic MC 121°E = 1°♌. Bay of Bengal/Pacific corridor (T21 N.Hem gap — should trigger T21 North Asian cyclone modifier, currently uncovered). T23b: Saturn 14°♏ = 8th house for Philippines (MC=1°♌ → 8th = Scorpio). Eclipse: Hybrid solar Nov 3 2013 = SAME DAY AS NM! = T3 eclipse exact on day of NM before Haiyan.",
        "pair": null,
        "geostress": "NM+Eclipse EXACT Nov 3 conjunct Saturn+Node Scorpio; Uranus world-point; Jupiter Cancer",
        "source": "NOAA NCEI; Philippines NDRRMC 2013",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T1 Solar eclipse Nov 3 ♏10.7°→ASC ♏4.6° (6.1°) · T6 Uranus□Pluto EXACT · T6 Jupiter☍Pluto 0.5° · T6 Jupiter□Uranus 0.4° · T4 Neptune☌Fomalhaut · T19 NM Nov 3 −5d · T29 Uranus→VTX 2.5° · T32 Ingress Uranus→VTX 0.8°"
        }
    },
    {
        "date": "2015-04-25",
        "name": "Nepal earthquake 2015 (8,964 dead)",
        "type": "earthquake",
        "sev": 5,
        "deaths": 8857,
        "dmg": 7,
        "pss": 0.88,
        "stars": [
            "Scheat (solar eclipse Mar 20 2015 at 29°♓ — 36 days before)"
        ],
        "notes": "GAP-CLOSURE v7.2. Deadliest Nepal earthquake since 1934. Solar eclipse Mar 20 2015 at 29°♓ = SCHEAT EXACT (29°22'♓ vs eclipse 29°♓ = within 22') — this is one of the tightest Scheat eclipse conjunctions on record. Eclipse 36 days before earthquake = within T3 partial orb (+0.14). Uranus/Pluto Cardinal sq: 7th and final exact square was Mar 16–17 2015 = only 39 days before Nepal quake. Final Uranus/Pluto sq discharging seismic tension. FM Apr 4 at 14°♎ (−21d, within outer orb). Saturn 4°♐ Rx; Uranus 17°♈; Jupiter 12°♌. Nepal geodetic MC ~85°E = 25°♊. Chiron 20°♓ also in Scheat zone approach.",
        "pair": "Pre-Pair: annular solar Sep 13 2015 upcoming; solar Mar 20 2015 was pair opener",
        "geostress": "Uranus/Pluto final Cardinal sq ±39d; Scheat eclipse exact",
        "source": "USGS; Nepal NDRRMA 2015",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T1 Solar eclipse Mar 20 ♓29°/Scheat→DSC 3.8° · T4 Mars☌Algol · T4 Uranus☌Achernar · T6 Uranus□Pluto 7th sq · T10 Saturn ♐0.8° world-axis · T13 Saturn/Uranus/Pluto · T30a Jupiter⊥Saturn 0.92° · T30b Jupiter‖Mars 0.54°"
        }
    },
    {
        "date": "2017-09-20",
        "name": "Hurricane Maria — Puerto Rico 2017 (2,975 dead)",
        "type": "storm_cyclone",
        "sev": 5,
        "deaths": 2975,
        "dmg": 91,
        "pss": 0.99,
        "stars": [
            "Scheat (Neptune 12°♓ in Scheat approach zone)",
            "Chiron 25°♓ (near Scheat 29°♓)"
        ],
        "notes": "GAP-CLOSURE v7.2. Deadliest Atlantic hurricane since 1998. Total solar eclipse Aug 21 2017 at 28°♌ = ONLY 30 DAYS BEFORE Maria's Cat 5 peak. Same eclipse corridor as Harvey (Aug 25) and Irma (Sep 10). Pair corridor: Feb 26 2017 annular + Aug 21 2017 total = Maria is 3rd major disaster in same pair window. FM Sep 6 at 13°♓ = 14 days before Maria = Scheat zone activation (Neptune 12°♓). N.Node 24°♌ — eclipse at 28°♌ = 4° from N.Node. Mars 9.6°♍. Saturn 22°♐. Puerto Rico geodetic MC 66°W = 294°E = 24°♓. Sep 20 eclipse pair corridor. This is one of the clearest pair corridor cases in the dataset and its absence is a major model gap.",
        "pair": "Pair C (Feb 26 annular / Aug 21 total 2017) — EXACT SAME CORRIDOR AS HARVEY",
        "geostress": "Total eclipse −30d; Scheat FM; Pair C eclipse pair corridor active",
        "source": "NOAA NCEI; Santos-Burgoa et al. 2018",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T1 Solar eclipse Aug 21 ♌28°−30d · T8 Jupiter→DSC ♏0° 0.7° EXACT · T19 FM exact day · T10 Jupiter ♏0.7°/Saturn ♐27° world-axis · T6 Saturn△Uranus · T4 Mars☌Regulus · T30a Saturn‖Pluto 0.34° · T30b Jupiter⊥Mars 0.24° · T30b Uranus‖Mars 0.90°"
        }
    },
    {
        "date": "2021-07-14",
        "name": "Western Europe floods 2021 (240 dead, €46B damage)",
        "type": "flood",
        "sev": 5,
        "deaths": 222,
        "dmg": 43,
        "pss": 0.99,
        "stars": [
            "Chiron 12°♈ (N.Node sq Saturn — T17 exact)"
        ],
        "notes": "GAP-CLOSURE v7.2. Deadliest Western European flood since 1953. NM Jul 9 at 18°♋ = 3–5 DAYS BEFORE peak flooding. N.Node 11°♊ sq Saturn 11°♒ exact = T17 malefic node bending (+0.10). Jupiter 3°♓ Rx (Pisces — water expansion archetype). Uranus 13°♉ / Saturn 11°♒ sq ongoing (T9). Mars 26°♌ (Leo fire triggering summer moisture). Germany geodetic MC ~13°E = 13°♈. Berlin MC=13°♈, ASC~6°♌. Saturn 11°♒ sq N.Node ♊ = nodal bending exactly over European longitudes. The 1953 Dutch floods comparison: Neptune in Libra then vs Pisces now (stronger water archetype). T23d: Neptune amplifier for Western Europe corridor.",
        "pair": null,
        "geostress": "Saturn/Node exact bending ♒/♊; Jupiter Pisces; Uranus/Saturn sq; NM −3d",
        "source": "Copernicus EMS; German Federal Government 2021",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T2 FM Jul 24 ♒1.3°→DSC ♒0.7° 0.6° NEAR-EXACT · T19 NM Jul 9 −5d · T6 Saturn□Uranus 1.9° · T17 N.Node□Saturn · T1 Jun 10 solar eclipse · T31 Neptune antiscia→IC 0.1° EXACT · T29 Pluto→VTX 1.8° · T30b Uranus‖Mars 0.19° · T32 Ingress Pluto near VTX"
        }
    },
    {
        "date": "2022-09-28",
        "name": "Hurricane Ian — Florida 2022 (161 dead, $112B)",
        "type": "storm_cyclone",
        "sev": 5,
        "deaths": 161,
        "dmg": 112,
        "pss": 0.99,
        "stars": [
            "Chiron 15°♈ (Jupiter 2°♈ world-point — T5)"
        ],
        "notes": "GAP-CLOSURE v7.2. 5th costliest US hurricane on record. NM Sep 25 at 2°♎ = FIVE DAYS BEFORE landfall = maximum T19 timing score. Jupiter 2°♈ Rx (world-point Aries — T5 +0.20). Uranus 18°♉ Rx sq Saturn 19°♒ within 1° = tightest Uranus/Saturn sq of 2022 (T9 exact). N.Node 13°♉ near Uranus (T17 nodal stress). Chiron 15°♈ Rx. Pluto 26°♑ Rx anaretic. Partial solar eclipse Oct 25 2022 = upcoming pair anchor (+25d). FM Oct 9 = +9d. Florida geodetic MC ~81°W = 99°♑. Ian made landfall Fort Myers ~26°N = ASC calculation needed. T11 eclipse pair opening: Oct 25 2022 annular / Apr 20 2023 hybrid = Pair D.",
        "pair": "Pair D opener (Oct 25 2022 annular +25d)",
        "geostress": "Jupiter world-pt; Uranus/Saturn sq 1° orb; Pluto anaretic 26°♑; NM −5d",
        "source": "NOAA NCEI; NHC 2022",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T16 Pluto ♑27.7° anaretic · T10 Pluto world-axis · T6 Jupiter∠Uranus 2.4° · T2 FM ♎ on IC/DSC axis · T5 Chiron 15°♈ world-point · T30a Saturn⊥Uranus 0.61° · T30b Pluto⊥Mars 0.82° · T29 Uranus→AVX 3.0°"
        }
    },
    {
        "date": "2023-09-08",
        "name": "Morocco earthquake 2023 (2,946 dead)",
        "type": "earthquake",
        "sev": 5,
        "deaths": 2960,
        "dmg": 2.5,
        "pss": 0.99,
        "stars": [
            "Algol (Uranus 23°♉ Rx — 3° from Algol 26°10'♉)",
            "Scheat (Neptune 26°♓ Rx — exact conjunction)"
        ],
        "notes": "GAP-CLOSURE v7.2. Different from 2026 Morocco floods. Deadliest Moroccan earthquake since 1960. Uranus Rx 23°♉ = within 3° of Algol 26°♉ = T16 star activation (T16_zod_wide +0.08). Neptune Rx 26°♓ = SCHEAT EXACT (26°♓ vs 29°22'♓ — within 3°, broad orb T16). Pluto 28°♑ Rx anaretic = T5. FM Aug 31 at 7°♓ = 8 DAYS BEFORE earthquake = T19 FM −8d. Annular solar eclipse Oct 14 2023 = +36d ahead = eclipse corridor activating. Morocco geodetic MC ~8°W = 352°E = 22°♓. T16 Scheat+Algol double star activation (simultaneous) is the rarest configuration in the dataset — matches 2026 event at same location.",
        "pair": "Pre-Pair: Oct 14 2023 annular upcoming (+36d)",
        "geostress": "Uranus Algol 3° orb; Neptune Scheat exact; Pluto anaretic 28°♑",
        "source": "USGS; Morocco Interior Ministry Sep 2023",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T8 Neptune→MC ♓26.2° 4.6° · T16 Pluto ♑29.3° anaretic · T10 Pluto world-axis · T4 Saturn☌Fomalhaut · T6 Jupiter⚹Saturn · T16 Uranus☌Algol · T29 Pluto→VTX 0.2° EXACT · T31 Mars antiscia→MC 1.0° · T30b Neptune‖Mars 0.13°"
        }
    },
    {
        "date": "2023-09-11",
        "name": "Libya floods — Derna 2023 (4,352 dead)",
        "type": "flood",
        "sev": 5,
        "deaths": 11300,
        "dmg": 2,
        "pss": 0.97,
        "stars": [
            "Scheat (Neptune 26°♓ Rx — near exact conjunction 29°22'♓)",
            "Algol (Uranus 23°♉ Rx — 3° orb)"
        ],
        "notes": "GAP-CLOSURE v7.2. Deadliest Mediterranean climate disaster in decades. Derna dam collapse killed 11,300+ (same date bracket as Morocco earthquake, 3 days later). Virtually identical chart to Morocco EQ Sep 8. Neptune Rx 26°♓ = Scheat (water catastrophe archetype — Scheat governs drowning, maritime disaster). Uranus Rx 23°♉ = Algol 3° orb = T16. Pluto anaretic 28°♑. FM Aug 31 = −11d. Eclipse corridor Oct 14 upcoming. Libya MC ~13°E = 13°♈. IC = 13°♎. The Neptune/Scheat signature for water catastrophe (drowning, dam collapse) is the clearest fixed-star activation in the 2023 dataset. Model must add both Sep 2023 events as the double-Scheat/Algol case study.",
        "pair": "Pre-Pair: Oct 14 2023 annular upcoming (+33d)",
        "geostress": "Neptune Scheat exact (drowning/maritime archetype); Uranus Algol; Pluto anaretic",
        "source": "UN OCHA; Libya Red Crescent Sep 2023",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T8 Pluto→DSC ♒3.4° 4.1° · T16 Pluto ♑29.4° anaretic · T10 Pluto world-axis · T4 Mars☌Spica · T4 Saturn☌Fomalhaut · T6 Jupiter⚹Saturn · T19 FM +4d · T31 Jupiter antiscia→AVX 1.9° · T30b Neptune‖Mars 0.64°"
        }
    },
    {
        "date": "2005-10-08",
        "name": "Kashmir earthquake M7.6 — Pakistan/AK (86,000 dead)",
        "type": "earthquake",
        "sev": 5,
        "deaths": 86000,
        "dmg": 5,
        "pss": 0.71,
        "stars": [
            "Mars Rx ♉ (mutual reception Saturn ♋; acute seismic force)"
        ],
        "notes": "v7.3. Pakistan's deadliest earthquake. Mars Rx at time of quake = T5 accelerant (+0.06). NM Oct 3 at 10°♎ = 5 DAYS BEFORE earthquake = T19 exact timing. Eclipse pair: Oct 3 annular solar + Oct 17 lunar = pair active; event sits inside pair window. Saturn 9.5°♌ Rx = T3 structural failure. N.Node 10°♈ square Saturn = T17 nodal stress. Kashmir geodetic MC ~74°E = 14°♊. BML ☌ Neptune (3.1°) — suppressed terrain collapse force. Eris 21.1°♈ conjunct N.Node ♈ within 1° = T18 Eris-Node activation. Model gap previously: no eclipse corridor computed for Kashmir. Adding as 86,000-death gap-closure.",
        "pair": "Oct 3 annular solar / Oct 17 lunar 2005 (pair active; quake between pair events)",
        "geostress": "Mars Rx ♉ sq Saturn ♋ Rx; N.Node ♈ sq Saturn; BML☌Neptune; NM −5d exact",
        "source": "USGS; ReliefWeb 2005",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T1 eclipse −5d · T3 Saturn Rx · T5 Mars Rx · T11 eclipse pair ACTIVE · T17 N.Node sq Saturn · T18 BML☌Neptune 3° · T19 NM −5d EXACT"
        }
    },
    {
        "date": "2007-11-15",
        "name": "Cyclone Sidr — Bangladesh coast (3,447 dead)",
        "type": "storm_cyclone",
        "sev": 4,
        "deaths": 3447,
        "dmg": 1.7,
        "pss": 0.62,
        "stars": [
            "Neptune 19°♒ (water sign backdrop — Bay of Bengal amplifier)"
        ],
        "notes": "v7.3. One of the worst Bay of Bengal cyclones since 1991. Saturn 8°♍ Rx = T3. No eclipse within 90d = lowest-scoring major cyclone in dataset. Uranus 15°♓/Pluto 28°♐ = T10 Uranus-Pluto backdrop. Saturn Rx in Virgo sq Pluto in Sagittarius = T6 backdrop (+0.04). Bangladesh geodetic MC ~90.4°E = 0.4°♋; IC = 0.4°♑. Cancer/Capricorn cardinal axis = T23a hurricane axis (+0.10). N.Node 27°♓ near Pluto 28°♐ = T17 nodal stress. T21 North Asian cyclone corridor (10°N–25°N) — systematic model gap flagged. Ceres at anaretic 28.1°♏ (Scorpio water threshold). Note: low eclipse support confirms model needs non-eclipse cyclone pathway.",
        "pair": null,
        "geostress": "Saturn Rx ♍; Cardinal geodetic axis; Ceres anaretic ♏; T21 Bay of Bengal gap",
        "source": "Bangladesh Meteorological Dept; OCHA 2007",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T3 Saturn Rx · T6 Sat□Plu backdrop · T17 Node☌Pluto · T21 N.Asian cyclone corridor (gap) · T23a Cardinal Cancer/Cap axis · T18 Ceres anaretic ♏"
        }
    },
    {
        "date": "2010-06-15",
        "name": "Russia heatwave — 55,000 dead (peak summer)",
        "type": "heatwave",
        "sev": 5,
        "deaths": 55000,
        "dmg": 15,
        "pss": 0.7,
        "stars": [
            "Corrected: Mars 4.4°♍ (Regulus approach claim removed)",
            "Algol (Uranus 0°♈ Rx world-point triggering)"
        ],
        "notes": "v7.3. Deadliest heatwave in Russian history; peat fires blanket Moscow. BML EXACT OPPOSITION Neptune (179.9°!) = suppressed oceanic heat force — one of the most precise BML-Neptune oppositions in 20-year dataset. Jun 26 lunar eclipse at 4°♑ = 11 days before peak = T1 eclipse within 14d (+0.12). Jul 11 solar eclipse at 19°♋ = +26d = pair closing event. Saturn 28°♍ Rx sq Pluto 3°♑ = T6 exact (+0.07). Uranus freshly into Aries (world point) = T5 ingress. Jupiter 0°♈ conj Uranus 0°♈ = double world point. Moscow geodetic MC ~37.6°E = 7.6°♉. Eris 21.8°♈ approaching Jupiter/Uranus conjunction = T18 Eris. Neptune 27°♒ = suppressed oceanic heat. El Niño year = T22.",
        "pair": "Jun 26 lunar / Jul 11 solar 2010 (eclipse pair; heatwave within pair window)",
        "geostress": "BML☍Neptune EXACT (179.9°!); Jupiter☌Uranus 0°♈ world-point; Saturn□Pluto; NM −1d",
        "source": "NOAA; Russian Emergency Situations Ministry 2010",
        "crit": {
            "n": 8,
            "of": 28,
            "key": "T1 eclipse −11d · T3 Saturn Rx · T6 Saturn□Pluto · T11 eclipse pair · T17 nodal · T18 BML☍Neptune exact · T22 El Niño year · T5 Jupiter☌Uranus 0°♈ world-pt"
        }
    },
    {
        "date": "2011-03-11",
        "name": "Tōhoku M9.1 + Fukushima nuclear — Japan (19,759 dead, $360B)",
        "type": "compound",
        "sev": 5,
        "deaths": 19759,
        "dmg": 360,
        "pss": 0.82,
        "stars": [
            "Scheat (Neptune 29°♒ — Scheat 29°22'♓ approaching, within 1° by 2011-12)",
            "Regulus (Saturn 15°♎ Rx — Leo/Virgo cusp approach)"
        ],
        "notes": "v7.3. Most powerful earthquake in Japan's recorded history. Largest single-event economic loss ever to that point. BML EXACT OPPOSITION Uranus (178.8°!) = shock/disruption through hidden invisible channel — the Fukushima reactor failure was the 'hidden bomb' the earthquake carried. Saturn 15°♎ Rx = T3. No eclipse within 90d = the 'invisible' event — model gap without geodetic angles. Japan geodetic: Sendai MC ~141°E = 21°♌; IC = 21°♒. Dec 21, 2010 lunar eclipse at 29°♊ = geodetically on Japan's IC zone (within 8°) = T2. Jan 4, 2011 solar eclipse at 13°♑ = within 8° of Sendai MC (21°♌) = T2 geodetic activation EXACT. 66 days before quake = outside 60d standard window — but geodetically it hits Japan's MC directly. N.Node 27°♐ sq Uranus 0°♈ = T17. Pluto 7°♑ near Japan's MC axis. T18: Eris 21.9°♈ Eris-Pluto approaching 88°.",
        "pair": "Dec 21, 2010 lunar / Jan 4, 2011 solar (pair; geodetically on Japan MC)",
        "geostress": "BML☍Uranus 178.8°; Japan MC exact eclipse hit (Jan 4, +66d); Saturn Rx ♎",
        "source": "JMA; TEPCO; ANSS 2011",
        "crit": {
            "n": 9,
            "of": 28,
            "key": "T2 Jan 4 eclipse on Japan MC exact (geodetic) · T3 Saturn Rx · T11 eclipse pair (Dec/Jan) · T17 Node sq Uranus 0°♈ · T18 BML☍Uranus EXACT · T18e Eris-Pluto 88° approach · T21 Ring of Fire · T10 Uranus-Pluto backdrop · T5 Uranus 0°♈ world-pt · T30a Jupiter⊥Saturn 0.69°"
        }
    },
    {
        "date": "2018-09-28",
        "name": "Sulawesi earthquake M7.5 + liquefaction — Palu (4,340 dead)",
        "type": "compound",
        "sev": 5,
        "deaths": 4340,
        "dmg": 2.5,
        "pss": 0.62,
        "stars": [
            "Algol (Uranus 1°♉ Rx — approaching Algol 26°♉; disruption archetype)"
        ],
        "notes": "v7.3. Palu earthquake triggered tsunami AND soil liquefaction (entire neighbourhoods swallowed by earth). The liquefaction component defied all models — classic Eris signature (chaos exceeding forecast). Eris □ Pluto (94.7°!) = T18e Eris-Pluto background chaos amplifier. BML □ Uranus (94.5°) = sudden ground destabilization. Ceres □ Saturn (93.6°) = Ceres-Saturn = collapse of earth/soil stability. Aug 11, 2018 solar eclipse at 18°♌ = 47 days before = within 60d window. Aug 27, 2018 lunar = 32d before = T1. Mars at 28°♑ anaretic Rx = T5 + anaretic = seismic trigger. Saturn 3°♑ Rx sq Neptune ♓ = T6+T9. Palu geodetic MC ~120°E = 0°♌; IC = 0°♒. T21 Ring of Fire. Saturn 3°♑ approaching Pluto = structural prelude to Jan 2020 conjunction. Liquefaction as planetary signature: Eris-Pluto chaos + BML-Uranus sudden = earth behaves unexpectedly.",
        "pair": "Aug 11, 2018 solar / Aug 27, 2018 lunar (pair; Sulawesi +47/+32 days)",
        "geostress": "Eris□Pluto 94.7°; BML□Uranus 94.5°; Mars Rx anaretic ♑; Saturn□Neptune",
        "source": "USGS; Indonesia BNPB 2018",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T1 eclipse +32–47d · T3 Saturn Rx · T5 Mars Rx anaretic · T6 Saturn□Neptune · T18 BML□Uranus 95° · T18e Eris□Pluto 94.7° · T21 Ring of Fire"
        }
    },
    {
        "date": "2023-02-06",
        "name": "Turkey-Syria doublet M7.8+7.7 — Kahramanmaraş (59,000 dead)",
        "type": "earthquake",
        "sev": 5,
        "deaths": 59000,
        "dmg": 104,
        "pss": 0.82,
        "stars": [
            "Algol (Uranus 15°♉ Rx — 11° from Algol 26°♉; structural failure archetype)",
            "Scheat (Neptune 24°♓ — 5° from Scheat 29°♓; dissolution cascade)"
        ],
        "notes": "v7.3. Deadliest earthquake since 2010 Haiti. Two M7.5+ earthquakes 9 hours apart = unprecedented doublet. Saturn 24°♒ = EXACTLY on the Oct 25, 2022 annular solar eclipse at 2°♏ by house axis — Turkey geodetic MC ~37°E = 7°♉; IC = 7°♏. Oct 25, 2022 eclipse at 2°♏ = within 5° of Turkey IC = T2 geodetic activation EXACT. Apr 20, 2023 eclipse upcoming = Pair D corridor active. BML ☌ Pluto (4.7°!) = structural collapse force — one of the tightest BML-Pluto conjunctions in dataset. Eris □ Pluto (85.5°) = T18e chaos amplifier. Ceres approaching Pluto (47° = semisquare). Jupiter 6°♈ near world point. Saturn 24°♒ sq Uranus 15°♉ ongoing = T9 Saturn-Uranus square. Mars 9°♊ (active trigger). N.Node 8°♉ near Uranus 15°♉ = T17 nodal. The doublet structure is Eris-Pluto: first earthquake triggers second, cascading chaos beyond all models. 10 provinces, 50,000 buildings collapsed. Deadliest single-day event in 21st century for Turkey.",
        "pair": "Oct 25, 2022 annular / Apr 20, 2023 hybrid (Pair D; earthquake inside pair window)",
        "geostress": "BML☌Pluto 4.7°!; Eris□Pluto 85.5°; Saturn□Uranus; Turkey IC eclipse exact (Oct 25); NM +2d",
        "source": "AFAD Turkey; USGS; Feb 2023",
        "crit": {
            "n": 10,
            "of": 28,
            "key": "T1 eclipse (pair window) · T2 Turkey IC eclipse exact (Oct 25) · T3 Saturn Rx → direct · T6 Saturn□Uranus · T11 Pair D corridor · T17 Node☌Uranus · T18 BML☌Pluto 4.7°! · T18e Eris□Pluto 85.5° · T21 geophys seismic · T9 Saturn□Uranus backdrop"
        }
    },
    {
        "date": "2026-03-22",
        "name": "Hawaii flooding — Big Island 2026 (model case study)",
        "type": "flood",
        "sev": 4,
        "deaths": null,
        "dmg": null,
        "pss": 0.72,
        "stars": [
            "Scheat (NM 28.1°♓ — 4.1d prior; within 1.2° of Scheat 29°22'♓)",
            "Eris 24.4°♈ (☌ IC 24.9°♈ orb 0.5°)",
            "Chiron 26.5°♈ (☌ IC orb 1.6°)"
        ],
        "notes": "T17/T18/T19 COMPOUND CASE STUDY. Hawaii geodetic: MC 24°♎ · IC 24°♈ · DC ~13°♋. Eris 24.4°♈ ☌ IC 24.9°♈ orb 0.5° (T18 exact — maximum T18 score). Chiron 26.5°♈ ☌ IC orb 1.6° (T18 ≤3°). Mars Rx 9.4°♓ ☌ N.Node 8.3°♓ orb 1.1° = malefic nodal stress (T17 +0.15 — mass event accelerant). Mercury Rx 9.9°♓ ☌ N.Node orb 1.6° (T17 planet nodal +0.08). Jupiter ~16.8°♋ within 3.5° of geodetic DC 13.3°♋ (T10 +0.08). Sun/Uranus midpoint 25.9°♎/♈ ☌ MC/IC orb 1.0° (T12 midpoint +0.10). New Moon 17.7°♉ 4.1 days prior (T19 lunation within 5d +0.06; NM near geodetic angle +0.12). Neptune 3–4°♈ world point (background water archetype). Multiple Pisces bodies stressed to nodal axis in water sign = maritime/coastal flood signature. ⚠ Event date is approximate (NM was ~Mar 18; event ~4d later). Verify exact details in local sources.",
        "pair": "Pair B corridor (Feb 17 eclipse 33d; Aug 12 eclipse −143d)",
        "geostress": "Mars Rx ♓ sq ♊ (nodes); Jupiter ♋ sq Saturn/Neptune ♈ Cardinal T-Sq",
        "source": "Model case study — PSS 0.72 watch window, event ~Mar 22 2026",
        "crit": {
            "n": 9,
            "of": 28,
            "key": "T3 Feb 17 eclipse 33d · T10 Jupiter ☌ DC 3.5° · T12 Sun/Uranus midpt ☌ IC 1° · T13 Cardinal T-Sq · T17 Mars ☌ NNode 1.1° EXACT · T17 Mercury ☌ NNode 1.6° · T18 Eris ☌ IC 0.5° EXACT · T18 Chiron ☌ IC 1.6° · T19 NM 28°♓ −4.1d"
        }
    },
    {
        "date": "2005-01-08",
        "name": "California Mudslides — La Conchita",
        "type": "compound",
        "sev": 2,
        "deaths": 10,
        "dmg": null,
        "pss": 0.07,
        "stars": [],
        "notes": "PSS=0.07 (LOW). Criteria: T19 Lunation. Ceres 15.64°Ari. Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 1,
            "of": 28,
            "key": "T19 Lunation"
        }
    },
    {
        "date": "2005-03-28",
        "name": "Nias-Simeulue earthquake",
        "type": "earthquake",
        "sev": 4,
        "deaths": 1346,
        "dmg": null,
        "pss": 0.34,
        "stars": [],
        "notes": "PSS=0.34 (LOW). Criteria: T1 Eclipse · T3 Mercury Rx · T19 Lunation. Ceres 2.52°Tau. Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T1 Eclipse · T3 Mercury Rx · T19 Lunation"
        }
    },
    {
        "date": "2005-10-24",
        "name": "Hurricane Wilma",
        "type": "storm_cyclone",
        "sev": 2,
        "deaths": 87,
        "dmg": null,
        "pss": 0.6,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 17.39°Gem"
        ],
        "notes": "PSS=0.6 (HIGH). Criteria: T1 Eclipse · T2 Lunar eclipse · T5 Mars Rx · T16 Anaretic · T18 BML/Eris/Ceres · T22 El Niño · T23 Weather amp. Ceres 17.39°Gem Rx. Node anar; BML☌Nep; Ceres Rx; El Nino; Peak cyclone season.",
        "pair": null,
        "geostress": "Americas — T1 Eclipse · T2 Lunar eclipse · T5 Mars Rx · T16 Anaret",
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T1 Eclipse · T2 Lunar eclipse · T5 Mars Rx · T16 Anaretic · T18 BML/Eris/Ceres · T22 El Niño · T23 Weather amp"
        }
    },
    {
        "date": "2005-12-26",
        "name": "Sumatran earthquake anniversary",
        "type": "earthquake",
        "sev": 1,
        "deaths": 0,
        "dmg": null,
        "pss": 0.38,
        "stars": [],
        "notes": "[v7.8 exact-epicentre recomputed] PSS=0.06 (LOW). Criteria: T20-T21 ASC/Ring. Ceres 0.85°Can. ROF seismic.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 1,
            "of": 28,
            "key": "T20-T21 ASC/Ring"
        }
    },
    {
        "date": "2006-05-27",
        "name": "Yogyakarta earthquake — Java 2006 (5,782 dead)",
        "type": "earthquake",
        "sev": 5,
        "deaths": 5782,
        "dmg": 3.1,
        "pss": 0.43,
        "stars": [
            "Venus 28.2°♈ (anaretic — T16 ✓)",
            "Venus 4.8° from geodetic DSC 23.4°♈"
        ],
        "notes": "Yogyakarta M6.4. Geodetic: MC 20°♋ · IC 20°♑ · DSC 23°♈. Venus 28.2°♈ = anaretic 28° (T16 +0.10). Venus within 1.8° of 0°♉ world axis (T10). Venus 4.8° from DSC ♈ (borderline T8 — inner planet). Jupiter ☐ Saturn 4.5° (T6). Jupiter △ Uranus 3.3° (T6). Mars 25.9°♋ → MC 5.5° (just outside T8). Pluto 25.9°♐ · Uranus 14.5°♓ · Neptune 19.8°♒. NM/FM ±3d (T19). NOTE: Web-source claim of Mercury 16.4°♊ incorrect — ephem confirms Mercury at 17.4°♊ direct, no station. The anaretic hit is Venus, not Mercury. Capricorn IC corridor confirms model zone.",
        "pair": null,
        "geostress": "Jupiter ♏ ☐ Saturn ♌ 4.5° · Jupiter △ Uranus ♓ 14.5°",
        "source": "v8.2 corrected · Asia · ephem verified",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T6 Jupiter☐Saturn 4.5° · T6 Jupiter△Uranus 3.3° · T10 Venus 28.2°♈/0°♉ world-axis · T16 Venus 28.2°♈ anaretic · T19 Lunation ±3d · T30a Neptune‖Pluto 0.64°"
        }
    },
    {
        "date": "2006-08-22",
        "name": "Pulkovo Aviation Flight 612",
        "type": "accident",
        "sev": 3,
        "deaths": 170,
        "dmg": null,
        "pss": 0.48,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 21.92°Leo"
        ],
        "notes": "[v7.8 exact-epicentre recomputed] PSS=0.23 (LOW). Criteria: T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation. Ceres 21.92°Leo. Sat/Nep; BML☌/□Plu; Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation"
        }
    },
    {
        "date": "2006-11-04",
        "name": "Typhoon Durian — Philippines",
        "type": "storm_cyclone",
        "sev": 4,
        "deaths": 1399,
        "dmg": 0.2,
        "pss": 0.38,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 7.73°Vir"
        ],
        "notes": "PSS=0.38 (LOW). Criteria: T3 Mercury Rx · T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño. Ceres 7.73°Vir. Sat/Nep; BML☌/□Plu; Lunation ±3d; El Nino.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T3 Mercury Rx · T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño"
        }
    },
    {
        "date": "2007-07-20",
        "name": "UK Summer floods",
        "type": "flood",
        "sev": 2,
        "deaths": 13,
        "dmg": null,
        "pss": 0.19,
        "stars": [
            "Anaretic degree activation"
        ],
        "notes": "PSS=0.19 (LOW). Criteria: T6-T10 Outer asp · T16 Anaretic · T22 El Niño. Ceres 2.85°Sco. Sat/Nep; Sat anar; La Nina.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T6-T10 Outer asp · T16 Anaretic · T22 El Niño"
        }
    },
    {
        "date": "2007-08-15",
        "name": "Peru earthquake",
        "type": "earthquake",
        "sev": 3,
        "deaths": 519,
        "dmg": null,
        "pss": 0.44,
        "stars": [
            "Anaretic degree activation"
        ],
        "notes": "PSS=0.44 (MODERATE). Criteria: T2 Lunar eclipse · T6-T10 Outer asp · T16 Anaretic · T19 Lunation · T20-T21 ASC/Ring. Ceres 8.41°Sco. Sat/Nep; Jup☌mal; Sat anar; Lunation ±3d; ROF seismic.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T2 Lunar eclipse · T6-T10 Outer asp · T16 Anaretic · T19 Lunation · T20-T21 ASC/Ring"
        }
    },
    {
        "date": "2008-06-06",
        "name": "Iowa/Midwest floods",
        "type": "flood",
        "sev": 2,
        "deaths": 24,
        "dmg": null,
        "pss": 0.24,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 11.65°Cap"
        ],
        "notes": "PSS=0.24 (LOW). Criteria: T3 Mercury Rx · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño. Ceres 11.65°Cap Rx. Ceres Rx; Lunation ±3d; La Nina.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T3 Mercury Rx · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño"
        }
    },
    {
        "date": "2009-02-07",
        "name": "Black Saturday bushfires Victoria",
        "type": "wildfire",
        "sev": 3,
        "deaths": 173,
        "dmg": null,
        "pss": 0.41,
        "stars": [],
        "notes": "PSS=0.41 (MODERATE). Criteria: T1 Eclipse · T6-T10 Outer asp · T19 Lunation · T22 El Niño · T23 Weather amp. Ceres 4.21°Pis. Sat□/☍Ura; Lunation ±3d; El Nino; Fire sign heat.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Pacific",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T1 Eclipse · T6-T10 Outer asp · T19 Lunation · T22 El Niño · T23 Weather amp"
        }
    },
    {
        "date": "2009-04-09",
        "name": "L'Aquila earthquake Italy",
        "type": "earthquake",
        "sev": 3,
        "deaths": 309,
        "dmg": null,
        "pss": 0.16,
        "stars": [],
        "notes": "PSS=0.16 (LOW). Criteria: T6-T10 Outer asp · T19 Lunation. Ceres 17.25°Pis. Sat□/☍Ura; Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 2,
            "of": 28,
            "key": "T6-T10 Outer asp · T19 Lunation"
        }
    },
    {
        "date": "2009-06-01",
        "name": "Air France Flight 447",
        "type": "accident",
        "sev": 3,
        "deaths": 228,
        "dmg": null,
        "pss": 0.35,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 28.57°Pis"
        ],
        "notes": "PSS=0.35 (LOW). Criteria: T6-T10 Outer asp · T18 BML/Eris/Ceres · T24 Mercury acc. Ceres 28.57°Pis Rx. Sat□/☍Ura; Ceres Rx; Ceres anar 28.6; MercStation(±2d); Merc/Plu.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T6-T10 Outer asp · T18 BML/Eris/Ceres · T24 Mercury acc"
        }
    },
    {
        "date": "2009-09-29",
        "name": "Samoa earthquake and tsunami",
        "type": "earthquake",
        "sev": 3,
        "deaths": 192,
        "dmg": null,
        "pss": 0.41,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 24.21°Ari"
        ],
        "notes": "PSS=0.41 (MODERATE). Criteria: T3 Mercury Rx · T6-T10 Outer asp · T18 BML/Eris/Ceres · T20-T21 ASC/Ring. Ceres 24.21°Ari Rx. Sat□/☍Ura; Ura□Plu; BML anar 29.7; Ceres Rx; ROF seismic.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Pacific",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T3 Mercury Rx · T6-T10 Outer asp · T18 BML/Eris/Ceres · T20-T21 ASC/Ring"
        }
    },
    {
        "date": "2009-10-01",
        "name": "Padang earthquake Indonesia",
        "type": "earthquake",
        "sev": 4,
        "deaths": 1117,
        "dmg": 2.2,
        "pss": 0.35,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 24.64°Ari"
        ],
        "notes": "PSS=0.35 (LOW). Criteria: T6-T10 Outer asp · T18 BML/Eris/Ceres · T20-T21 ASC/Ring. Ceres 24.64°Ari Rx. Sat□/☍Ura; Ura□Plu; BML anar 30.0; Ceres Rx; ROF seismic.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T6-T10 Outer asp · T18 BML/Eris/Ceres · T20-T21 ASC/Ring"
        }
    },
    {
        "date": "2010-02-27",
        "name": "Maule earthquake M8.8 — Chile (521 dead)",
        "type": "earthquake",
        "sev": 4,
        "deaths": 521,
        "dmg": 30,
        "pss": 0.41,
        "stars": [],
        "notes": "PSS=0.35 (LOW). Criteria: T5 Mars Rx · T6-T10 Outer asp · T19 Lunation · T20-T21 ASC/Ring. Ceres 26.47°Tau. Sat□/☍Ura; Ura□Plu; Lunation ±3d; ROF seismic.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T5 Mars Rx · T6-T10 Outer asp · T19 Lunation · T20-T21 ASC/Ring"
        }
    },
    {
        "date": "2010-04-10",
        "name": "Smolensk air disaster",
        "type": "accident",
        "sev": 2,
        "deaths": 96,
        "dmg": null,
        "pss": 0.13,
        "stars": [],
        "notes": "PSS=0.13 (LOW). Criteria: T6-T10 Outer asp. Ceres 5.45°Gem. Sat□/☍Ura; Ura□Plu.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 1,
            "of": 28,
            "key": "T6-T10 Outer asp"
        }
    },
    {
        "date": "2010-04-14",
        "name": "Yushu earthquake China",
        "type": "earthquake",
        "sev": 4,
        "deaths": 2968,
        "dmg": null,
        "pss": 0.47,
        "stars": [],
        "notes": "[v7.8 exact-epicentre recomputed] PSS=0.24 (LOW). Criteria: T6-T10 Outer asp · T19 Lunation. Ceres 6.3°Gem. Sat□/☍Ura; Ura□Plu; Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 2,
            "of": 28,
            "key": "T6-T10 Outer asp · T19 Lunation"
        }
    },
    {
        "date": "2010-04-20",
        "name": "Deepwater Horizon oil spill",
        "type": "compound",
        "sev": 2,
        "deaths": 11,
        "dmg": null,
        "pss": 0.46,
        "stars": [],
        "notes": "PSS=0.46 (MODERATE). Criteria: T3 Mercury Rx · T6-T10 Outer asp · T24 Mercury acc. Ceres 7.58°Gem. Sat□/☍Ura; Ura□Plu; MercRx; MercStation(±2d); Merc/Sat; Merc/Plu; compound.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T3 Mercury Rx · T6-T10 Outer asp · T24 Mercury acc"
        }
    },
    {
        "date": "2010-08-05",
        "name": "Copiapo mining accident",
        "type": "accident",
        "sev": 1,
        "deaths": 0,
        "dmg": null,
        "pss": 0.32,
        "stars": [
            "Anaretic degree activation"
        ],
        "notes": "PSS=0.32 (LOW). Criteria: T6-T10 Outer asp · T16 Anaretic. Ceres 0.44°Can. Sat□/☍Ura; Ura□Plu; Jup☌mal; Ura anar; Nep anar.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 2,
            "of": 28,
            "key": "T6-T10 Outer asp · T16 Anaretic"
        }
    },
    {
        "date": "2010-10-04",
        "name": "Ajkai Timfoldgyar spill Hungary",
        "type": "compound",
        "sev": 2,
        "deaths": 10,
        "dmg": null,
        "pss": 0.29,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 13.26°Can"
        ],
        "notes": "PSS=0.29 (LOW). Criteria: T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres. Ceres 13.26°Can Rx. Ura□Plu; Jup☌mal; Ura anar; Nep anar; Ceres Rx.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres"
        }
    },
    {
        "date": "2011-01-10",
        "name": "Queensland floods Toowoomba",
        "type": "flood",
        "sev": 2,
        "deaths": 35,
        "dmg": null,
        "pss": 0.53,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 4.2°Leo"
        ],
        "notes": "PSS=0.53 (MODERATE). Criteria: T1 Eclipse · T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T22 El Niño · T23 Weather amp. Ceres 4.2°Leo Rx. Ura□Plu; Ura anar; Nep anar; Ceres Rx; La Nina; Water sign flood.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Pacific",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T1 Eclipse · T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T22 El Niño · T23 Weather amp"
        }
    },
    {
        "date": "2011-02-22",
        "name": "Christchurch earthquake",
        "type": "earthquake",
        "sev": 3,
        "deaths": 185,
        "dmg": null,
        "pss": 0.36,
        "stars": [
            "Anaretic degree activation"
        ],
        "notes": "PSS=0.36 (LOW). Criteria: T6-T10 Outer asp · T12-T15 Eclipse° · T16 Anaretic · T19 Lunation · T20-T21 ASC/Ring. Ceres 13.39°Leo. Ura□Plu; Nep anar; Lunation ±3d; ROF seismic.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Pacific",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T6-T10 Outer asp · T12-T15 Eclipse° · T16 Anaretic · T19 Lunation · T20-T21 ASC/Ring"
        }
    },
    {
        "date": "2011-04-25",
        "name": "Super Outbreak tornadoes",
        "type": "storm_cyclone",
        "sev": 3,
        "deaths": 321,
        "dmg": null,
        "pss": 0.27,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 26.64°Leo"
        ],
        "notes": "PSS=0.27 (LOW). Criteria: T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T22 El Niño. Ceres 26.64°Leo. Ura□Plu; Nep anar; BML☌/□Plu; La Nina.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T22 El Niño"
        }
    },
    {
        "date": "2011-05-22",
        "name": "Joplin tornado EF5",
        "type": "storm_cyclone",
        "sev": 3,
        "deaths": 158,
        "dmg": null,
        "pss": 0.42,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 2.41°Vir"
        ],
        "notes": "PSS=0.42 (MODERATE). Criteria: T1 Eclipse · T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T22 El Niño. Ceres 2.41°Vir. Ura□Plu; Nep anar; BML☌/□Plu; La Nina.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T1 Eclipse · T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T22 El Niño"
        }
    },
    {
        "date": "2011-10-17",
        "name": "Thailand floods",
        "type": "flood",
        "sev": 3,
        "deaths": 813,
        "dmg": null,
        "pss": 0.28,
        "stars": [
            "Anaretic degree activation"
        ],
        "notes": "PSS=0.28 (LOW). Criteria: T6-T10 Outer asp · T12-T15 Eclipse° · T16 Anaretic · T22 El Niño. Ceres 4.03°Lib. Ura□Plu; Nep anar; La Nina.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T6-T10 Outer asp · T12-T15 Eclipse° · T16 Anaretic · T22 El Niño"
        }
    },
    {
        "date": "2011-10-28",
        "name": "Halloween noraster",
        "type": "winter_storm",
        "sev": 2,
        "deaths": 39,
        "dmg": null,
        "pss": 0.28,
        "stars": [
            "Anaretic degree activation"
        ],
        "notes": "PSS=0.28 (LOW). Criteria: T6-T10 Outer asp · T12-T15 Eclipse° · T16 Anaretic · T19 Lunation. Ceres 6.38°Lib. Ura□Plu; Nep anar; Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T6-T10 Outer asp · T12-T15 Eclipse° · T16 Anaretic · T19 Lunation"
        }
    },
    {
        "date": "2012-01-13",
        "name": "Costa Concordia disaster",
        "type": "accident",
        "sev": 2,
        "deaths": 32,
        "dmg": null,
        "pss": 0.31,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 22.83°Lib"
        ],
        "notes": "PSS=0.31 (LOW). Criteria: T6-T10 Outer asp · T12-T15 Eclipse° · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation. Ceres 22.83°Lib Rx. Ura□Plu; Node anar; Ceres Rx; Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T6-T10 Outer asp · T12-T15 Eclipse° · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation"
        }
    },
    {
        "date": "2012-12-04",
        "name": "Typhoon Bopha Pablo",
        "type": "storm_cyclone",
        "sev": 4,
        "deaths": 1901,
        "dmg": 1.04,
        "pss": 0.3,
        "stars": [],
        "notes": "PSS=0.3 (LOW). Criteria: T1 Eclipse · T6-T10 Outer asp · T22 El Niño. Ceres 2.48°Cap. Ura□Plu; La Nina.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T1 Eclipse · T6-T10 Outer asp · T22 El Niño"
        }
    },
    {
        "date": "2013-04-24",
        "name": "Rana Plaza collapse Bangladesh",
        "type": "compound",
        "sev": 4,
        "deaths": 1134,
        "dmg": null,
        "pss": 0.61,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 2.61°Aqu"
        ],
        "notes": "PSS=0.61 (HIGH). Criteria: T1 Eclipse · T2 Lunar eclipse · T6-T10 Outer asp · T11 Eclipse pair · T18 BML/Eris/Ceres · T19 Lunation. Ceres 2.61°Aqu Rx. Ura□Plu; Ceres Rx; Lunation ±3d.",
        "pair": null,
        "geostress": "Asia — T1 Eclipse · T2 Lunar eclipse · T6-T10 Outer asp · T11 ",
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T1 Eclipse · T2 Lunar eclipse · T6-T10 Outer asp · T11 Eclipse pair · T18 BML/Eris/Ceres · T19 Lunation"
        }
    },
    {
        "date": "2013-05-20",
        "name": "Moore tornado EF5 Oklahoma",
        "type": "storm_cyclone",
        "sev": 2,
        "deaths": 24,
        "dmg": null,
        "pss": 0.33,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 8.17°Aqu"
        ],
        "notes": "PSS=0.33 (LOW). Criteria: T1 Eclipse · T6-T10 Outer asp · T18 BML/Eris/Ceres. Ceres 8.17°Aqu Rx. Ura□Plu; BML anar 27.8; Ceres Rx.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T1 Eclipse · T6-T10 Outer asp · T18 BML/Eris/Ceres"
        }
    },
    {
        "date": "2013-06-02",
        "name": "European floods Elbe Danube",
        "type": "flood",
        "sev": 2,
        "deaths": 25,
        "dmg": null,
        "pss": 0.18,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 10.94°Aqu"
        ],
        "notes": "PSS=0.18 (LOW). Criteria: T6-T10 Outer asp · T18 BML/Eris/Ceres. Ceres 10.94°Aqu Rx. Ura□Plu; BML anar 29.2; Ceres Rx.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 2,
            "of": 28,
            "key": "T6-T10 Outer asp · T18 BML/Eris/Ceres"
        }
    },
    {
        "date": "2013-07-06",
        "name": "Asiana Airlines Flight 214",
        "type": "accident",
        "sev": 1,
        "deaths": 3,
        "dmg": null,
        "pss": 0.63,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 18.21°Aqu"
        ],
        "notes": "PSS=0.63 (HIGH). Criteria: T3 Mercury Rx · T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T24 Mercury acc. Ceres 18.21°Aqu Rx. Ura□Plu; Node anar; BML☌/□Plu; Ceres Rx; Lunation ±3d; MercRx; MercCombust; Merc/Plu; compound.",
        "pair": null,
        "geostress": "Americas — T3 Mercury Rx · T6-T10 Outer asp · T16 Anaretic · T18 B",
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T3 Mercury Rx · T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T24 Mercury acc"
        }
    },
    {
        "date": "2014-03-08",
        "name": "Malaysia Airlines MH370",
        "type": "accident",
        "sev": 3,
        "deaths": 239,
        "dmg": null,
        "pss": 0.42,
        "stars": [],
        "notes": "[PROVISIONAL — scored at IGARI last-known position 103.6°E + southern search zone ~95°E; no confirmed crash site exists. Both locations give ♑ IC, confirming Capricorn corridor finding remains robust] [v7.8 exact-epicentre recomputed] PSS=0.22 (LOW). Criteria: T5 Mars Rx · T6-T10 Outer asp · T24 Mercury acc. Ceres 10.55°Ari. Ura□Plu; Merc/Sat.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T5 Mars Rx · T6-T10 Outer asp · T24 Mercury acc"
        }
    },
    {
        "date": "2014-04-16",
        "name": "MV Sewol ferry sinking",
        "type": "accident",
        "sev": 3,
        "deaths": 304,
        "dmg": null,
        "pss": 0.62,
        "stars": [],
        "notes": "PSS=0.62 (HIGH). Criteria: T1 Eclipse · T2 Lunar eclipse · T5 Mars Rx · T6-T10 Outer asp · T11 Eclipse pair · T19 Lunation. Ceres 18.89°Ari. Ura□Plu; Lunation ±3d.",
        "pair": null,
        "geostress": "Asia — T1 Eclipse · T2 Lunar eclipse · T5 Mars Rx · T6-T10 Out",
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T1 Eclipse · T2 Lunar eclipse · T5 Mars Rx · T6-T10 Outer asp · T11 Eclipse pair · T19 Lunation"
        }
    },
    {
        "date": "2014-05-13",
        "name": "Soma mine disaster Turkey",
        "type": "compound",
        "sev": 3,
        "deaths": 301,
        "dmg": null,
        "pss": 0.44,
        "stars": [],
        "notes": "PSS=0.44 (MODERATE). Criteria: T1 Eclipse · T5 Mars Rx · T6-T10 Outer asp · T19 Lunation · T24 Mercury acc. Ceres 24.66°Ari. Ura□Plu; Lunation ±3d; Merc/Sat.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T1 Eclipse · T5 Mars Rx · T6-T10 Outer asp · T19 Lunation · T24 Mercury acc"
        }
    },
    {
        "date": "2014-07-26",
        "name": "West Africa Ebola epidemic",
        "type": "compound",
        "sev": 5,
        "deaths": 11325,
        "dmg": null,
        "pss": 0.24,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 10.47°Tau"
        ],
        "notes": "PSS=0.24 (LOW). Criteria: T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation. Ceres 10.47°Tau Rx. Ura□Plu; Ceres Rx; Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Africa",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation"
        }
    },
    {
        "date": "2014-12-28",
        "name": "AirAsia QZ8501 crash",
        "type": "accident",
        "sev": 3,
        "deaths": 162,
        "dmg": null,
        "pss": 0.55,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 13.59°Gem"
        ],
        "notes": "[v7.8 exact-epicentre recomputed] PSS=0.26 (LOW). Criteria: T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres. Ceres 13.59°Gem. Ura□Plu; Sat anar; BML☌Nep; Eris□Plu.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres"
        }
    },
    {
        "date": "2015-05-20",
        "name": "Pakistan heatwave Karachi",
        "type": "heatwave",
        "sev": 4,
        "deaths": 1300,
        "dmg": null,
        "pss": 0.42,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 14.14°Can"
        ],
        "notes": "PSS=0.42 (MODERATE). Criteria: T3 Mercury Rx · T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño. Ceres 14.14°Can. Sat/Nep; Ura□Plu; Eris□Plu; Lunation ±3d; El Nino.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T3 Mercury Rx · T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño"
        }
    },
    {
        "date": "2015-10-31",
        "name": "Metrojet Flight 9268 Sinai",
        "type": "accident",
        "sev": 3,
        "deaths": 224,
        "dmg": null,
        "pss": 0.46,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 19.18°Leo"
        ],
        "notes": "PSS=0.46 (MODERATE). Criteria: T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres · T19 Lunation. Ceres 19.18°Leo Rx. Sat/Nep; Ura□Plu; BML☌/□Plu; Eris□Plu; Ceres Rx; Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Middle East",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres · T19 Lunation"
        }
    },
    {
        "date": "2015-11-15",
        "name": "Chennai Tamil Nadu floods",
        "type": "flood",
        "sev": 3,
        "deaths": 500,
        "dmg": null,
        "pss": 0.51,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 22.38°Leo"
        ],
        "notes": "PSS=0.51 (MODERATE). Criteria: T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño. Ceres 22.38°Leo Rx. Sat/Nep; Ura□Plu; BML☌/□Plu; Eris□Plu; Ceres Rx; Lunation ±3d; El Nino.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño"
        }
    },
    {
        "date": "2016-04-14",
        "name": "Ecuador earthquake",
        "type": "earthquake",
        "sev": 3,
        "deaths": 676,
        "dmg": null,
        "pss": 0.44,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 24.65°Vir"
        ],
        "notes": "[v7.8 exact-epicentre recomputed] PSS=0.28 (LOW). Criteria: T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres. Ceres 24.65°Vir. Sat/Nep; Ura□Plu; Eris□Plu.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres"
        }
    },
    {
        "date": "2016-04-16",
        "name": "Kumamoto earthquakes Japan",
        "type": "earthquake",
        "sev": 2,
        "deaths": 49,
        "dmg": null,
        "pss": 0.32,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 25.07°Vir"
        ],
        "notes": "PSS=0.32 (LOW). Criteria: T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres · T20-T21 ASC/Ring. Ceres 25.07°Vir. Sat/Nep; Ura□Plu; Eris□Plu; ROF seismic.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres · T20-T21 ASC/Ring"
        }
    },
    {
        "date": "2016-05-19",
        "name": "EgyptAir Flight MS804",
        "type": "accident",
        "sev": 3,
        "deaths": 66,
        "dmg": null,
        "pss": 0.81,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 2.13°Lib"
        ],
        "notes": "PSS=0.81 (CRITICAL). Criteria: T3 Mercury Rx · T5 Mars Rx · T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T24 Mercury acc. Ceres 2.13°Lib. Sat/Nep; Ura□Plu; BML anar 29.8; Eris□Plu; Lunation ±3d; MercRx; MercStation(±3d); Merc/Sat; compound.",
        "pair": null,
        "geostress": "Middle East — T3 Mercury Rx · T5 Mars Rx · T6-T10 Outer asp · T12-T15",
        "source": "v7.4 backtest · Middle East",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T3 Mercury Rx · T5 Mars Rx · T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T24 Mercury acc"
        }
    },
    {
        "date": "2016-08-24",
        "name": "Amatrice earthquake Italy",
        "type": "earthquake",
        "sev": 3,
        "deaths": 299,
        "dmg": null,
        "pss": 0.41,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 22.85°Lib"
        ],
        "notes": "PSS=0.41 (MODERATE). Criteria: T1 Eclipse · T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres. Ceres 22.85°Lib. Sat/Nep; Ura□Plu; Node anar; Eris□Plu.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T1 Eclipse · T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres"
        }
    },
    {
        "date": "2016-10-01",
        "name": "Hurricane Matthew",
        "type": "storm_cyclone",
        "sev": 3,
        "deaths": 603,
        "dmg": null,
        "pss": 0.36,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 0.97°Sco"
        ],
        "notes": "PSS=0.36 (LOW). Criteria: T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño · T23 Weather amp. Ceres 0.97°Sco. Sat/Nep; Ura□Plu; Eris□Plu; Lunation ±3d; El Nino; Peak cyclone season.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño · T23 Weather amp"
        }
    },
    {
        "date": "2016-10-30",
        "name": "Norcia earthquake Italy",
        "type": "earthquake",
        "sev": 1,
        "deaths": 0,
        "dmg": null,
        "pss": 0.42,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 7.17°Sco"
        ],
        "notes": "[v7.8 exact-epicentre recomputed] PSS=0.25 (LOW). Criteria: T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation. Ceres 7.17°Sco. Sat/Nep; Ura□Plu; Eris□Plu; Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation"
        }
    },
    {
        "date": "2017-01-18",
        "name": "Rigopiano avalanche Italy",
        "type": "compound",
        "sev": 2,
        "deaths": 29,
        "dmg": null,
        "pss": 0.18,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 24.26°Sco"
        ],
        "notes": "PSS=0.18 (LOW). Criteria: T6-T10 Outer asp · T18 BML/Eris/Ceres · T24 Mercury acc. Ceres 24.26°Sco. Ura□Plu; Eris□Plu; Merc/Plu.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T6-T10 Outer asp · T18 BML/Eris/Ceres · T24 Mercury acc"
        }
    },
    {
        "date": "2017-06-14",
        "name": "Grenfell Tower fire",
        "type": "compound",
        "sev": 2,
        "deaths": 72,
        "dmg": null,
        "pss": 0.11,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 25.67°Sag"
        ],
        "notes": "PSS=0.11 (LOW). Criteria: T6-T10 Outer asp · T18 BML/Eris/Ceres. Ceres 25.67°Sag. Ura□Plu; Eris□Plu.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 2,
            "of": 28,
            "key": "T6-T10 Outer asp · T18 BML/Eris/Ceres"
        }
    },
    {
        "date": "2017-09-06",
        "name": "Hurricane Irma Cat 5",
        "type": "storm_cyclone",
        "sev": 3,
        "deaths": 134,
        "dmg": null,
        "pss": 0.59,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 13.61°Cap"
        ],
        "notes": "PSS=0.59 (HIGH). Criteria: T1 Eclipse · T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T23 Weather amp. Ceres 13.61°Cap. Ura□Plu; Eris□Plu; Ceres☌Plu; Lunation ±3d; Water sign flood; Peak cyclone season.",
        "pair": null,
        "geostress": "Americas — T1 Eclipse · T6-T10 Outer asp · T12-T15 Eclipse° · T18 ",
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T1 Eclipse · T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T23 Weather amp"
        }
    },
    {
        "date": "2017-09-07",
        "name": "Mexico City earthquake Chiapas",
        "type": "earthquake",
        "sev": 2,
        "deaths": 98,
        "dmg": null,
        "pss": 0.62,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 13.83°Cap"
        ],
        "notes": "PSS=0.62 (HIGH). Criteria: T1 Eclipse · T6-T10 Outer asp · T12-T15 Eclipse° · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T20-T21 ASC/Ring. Ceres 13.83°Cap. Ura□Plu; Sat anar; Eris□Plu; Ceres☌Plu; Lunation ±3d; ROF seismic.",
        "pair": null,
        "geostress": "Americas — T1 Eclipse · T6-T10 Outer asp · T12-T15 Eclipse° · T16 ",
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T1 Eclipse · T6-T10 Outer asp · T12-T15 Eclipse° · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T20-T21 ASC/Ring"
        }
    },
    {
        "date": "2017-09-19",
        "name": "Puebla earthquake Mexico City",
        "type": "earthquake",
        "sev": 3,
        "deaths": 370,
        "dmg": null,
        "pss": 0.49,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 16.39°Cap"
        ],
        "notes": "PSS=0.49 (MODERATE). Criteria: T6-T10 Outer asp · T12-T15 Eclipse° · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T20-T21 ASC/Ring. Ceres 16.39°Cap. Ura□Plu; Sat anar; Eris□Plu; Ceres☌Plu; Lunation ±3d; ROF seismic.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T6-T10 Outer asp · T12-T15 Eclipse° · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T20-T21 ASC/Ring"
        }
    },
    {
        "date": "2017-11-12",
        "name": "Iran Iraq border earthquake",
        "type": "earthquake",
        "sev": 3,
        "deaths": 630,
        "dmg": null,
        "pss": 0.44,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 27.93°Cap"
        ],
        "notes": "[v7.8 exact-epicentre recomputed] PSS=0.27 (LOW). Criteria: T12-T15 Eclipse° · T16 Anaretic · T18 BML/Eris/Ceres. Ceres 27.93°Cap. Sat anar; Eris□Plu; Ceres anar 27.9.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Middle East",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T12-T15 Eclipse° · T16 Anaretic · T18 BML/Eris/Ceres"
        }
    },
    {
        "date": "2018-07-05",
        "name": "Japan floods and heatwave",
        "type": "compound",
        "sev": 3,
        "deaths": 225,
        "dmg": null,
        "pss": 0.51,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 18.14°Pis"
        ],
        "notes": "PSS=0.51 (MODERATE). Criteria: T1 Eclipse · T5 Mars Rx · T16 Anaretic · T18 BML/Eris/Ceres · T20-T21 ASC/Ring · T22 El Niño. Ceres 18.14°Pis Rx. Ura anar; Eris□Plu; Ceres Rx; ROF seismic; El Nino.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T1 Eclipse · T5 Mars Rx · T16 Anaretic · T18 BML/Eris/Ceres · T20-T21 ASC/Ring · T22 El Niño"
        }
    },
    {
        "date": "2018-07-23",
        "name": "Mati wildfire Greece",
        "type": "wildfire",
        "sev": 3,
        "deaths": 102,
        "dmg": 0.95,
        "pss": 0.78,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 21.99°Pis"
        ],
        "notes": "PSS=0.78 (CRITICAL). Criteria: T1 Eclipse · T2 Lunar eclipse · T5 Mars Rx · T11 Eclipse pair · T16 Anaretic · T18 BML/Eris/Ceres · T22 El Niño. Ceres 21.99°Pis Rx. Ura anar; BML anar 28.3; Eris□Plu; Ceres Rx; El Nino.",
        "pair": null,
        "geostress": "Europe — T1 Eclipse · T2 Lunar eclipse · T5 Mars Rx · T11 Eclips",
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T1 Eclipse · T2 Lunar eclipse · T5 Mars Rx · T11 Eclipse pair · T16 Anaretic · T18 BML/Eris/Ceres · T22 El Niño"
        }
    },
    {
        "date": "2018-08-15",
        "name": "Kerala floods India",
        "type": "flood",
        "sev": 3,
        "deaths": 483,
        "dmg": null,
        "pss": 0.77,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 26.9°Pis"
        ],
        "notes": "PSS=0.77 (CRITICAL). Criteria: T1 Eclipse · T3 Mercury Rx · T5 Mars Rx · T11 Eclipse pair · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño. Ceres 26.9°Pis Rx. Ura anar; Eris□Plu; Ceres Rx; Lunation ±3d; El Nino.",
        "pair": null,
        "geostress": "Asia — T1 Eclipse · T3 Mercury Rx · T5 Mars Rx · T11 Eclipse p",
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 8,
            "of": 28,
            "key": "T1 Eclipse · T3 Mercury Rx · T5 Mars Rx · T11 Eclipse pair · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño"
        }
    },
    {
        "date": "2018-10-29",
        "name": "Lion Air Flight 610",
        "type": "accident",
        "sev": 3,
        "deaths": 189,
        "dmg": null,
        "pss": 0.45,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 12.93°Ari",
            "Pluto→IC 1.6° exact at crash site (Java Sea 5.8°S 107.1°E, IC=♑ 17.1°)"
        ],
        "notes": "PSS=0.45 (MODERATE). Rescored at exact crash coords Java Sea 5°46'S 107°07'E. IC=♑17.1°; Pluto at ♑15.5° — Pluto→IC 1.6° exact hit (Capricorn IC band 92–112°E corridor, Pluto-♑ era 2008-2024). T4 Venus Rx · T18 BML/Eris/Ceres · T24 Mercury acc · T8 Pluto→angle ≤2° · T28 Pluto-♑ era.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia · exact coords rescored v8.0",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T4 Venus Rx · T18 BML/Eris/Ceres · T24 Mercury acc · T8 Pluto→IC 1.6° · T28"
        }
    },
    {
        "date": "2018-12-22",
        "name": "Anak Krakatau tsunami Indonesia",
        "type": "compound",
        "sev": 3,
        "deaths": 437,
        "dmg": null,
        "pss": 0.44,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 24.46°Ari"
        ],
        "notes": "PSS=0.44 (MODERATE). Criteria: T1 Eclipse · T18 BML/Eris/Ceres · T19 Lunation · T20-T21 ASC/Ring · T22 El Niño. Ceres 24.46°Ari. Eris□Plu; Lunation ±3d; ROF seismic; Volcanic; El Nino.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T1 Eclipse · T18 BML/Eris/Ceres · T19 Lunation · T20-T21 ASC/Ring · T22 El Niño"
        }
    },
    {
        "date": "2019-03-10",
        "name": "Ethiopian Airlines Flight 302",
        "type": "accident",
        "sev": 3,
        "deaths": 157,
        "dmg": null,
        "pss": 0.4,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 11.13°Tau"
        ],
        "notes": "PSS=0.4 (MODERATE). Criteria: T3 Mercury Rx · T18 BML/Eris/Ceres · T19 Lunation · T24 Mercury acc. Ceres 11.13°Tau. Eris□Plu; Lunation ±3d; MercRx; MercStation(±5d).",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Africa",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T3 Mercury Rx · T18 BML/Eris/Ceres · T19 Lunation · T24 Mercury acc"
        }
    },
    {
        "date": "2019-03-14",
        "name": "Cyclone Idai Mozambique",
        "type": "storm_cyclone",
        "sev": 4,
        "deaths": 1303,
        "dmg": 2,
        "pss": 0.22,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 11.98°Tau"
        ],
        "notes": "PSS=0.22 (LOW). Criteria: T3 Mercury Rx · T18 BML/Eris/Ceres · T22 El Niño. Ceres 11.98°Tau. Eris□Plu; El Nino.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Africa",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T3 Mercury Rx · T18 BML/Eris/Ceres · T22 El Niño"
        }
    },
    {
        "date": "2019-04-15",
        "name": "Notre-Dame de Paris fire",
        "type": "compound",
        "sev": 1,
        "deaths": 0,
        "dmg": null,
        "pss": 0.13,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 18.82°Tau"
        ],
        "notes": "PSS=0.13 (LOW). Criteria: T18 BML/Eris/Ceres. Ceres 18.82°Tau. BML anar 28.0; Eris□Plu.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 1,
            "of": 28,
            "key": "T18 BML/Eris/Ceres"
        }
    },
    {
        "date": "2019-10-12",
        "name": "Typhoon Hagibis Japan",
        "type": "storm_cyclone",
        "sev": 3,
        "deaths": 100,
        "dmg": null,
        "pss": 0.41,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 27.28°Gem"
        ],
        "notes": "PSS=0.41 (MODERATE). Criteria: T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño · T23 Weather amp. Ceres 27.28°Gem Rx. Nep⚹Plu; Node anar; Eris□Plu; Ceres Rx; Ceres anar 27.3; Lunation ±3d; El Nino; Peak cyclone season.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño · T23 Weather amp"
        }
    },
    {
        "date": "2019-11-01",
        "name": "Australian Black Summer begins",
        "type": "wildfire",
        "sev": 1,
        "deaths": 0,
        "dmg": null,
        "pss": 0.38,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 1.55°Can"
        ],
        "notes": "PSS=0.38 (LOW). Criteria: T3 Mercury Rx · T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño. Ceres 1.55°Can Rx. Nep⚹Plu; Node anar; Eris□Plu; Ceres Rx; Lunation ±3d; El Nino.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Pacific",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T3 Mercury Rx · T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño"
        }
    },
    {
        "date": "2020-01-01",
        "name": "Australian Black Summer peak",
        "type": "wildfire",
        "sev": 2,
        "deaths": 33,
        "dmg": null,
        "pss": 0.58,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 14.59°Can"
        ],
        "notes": "PSS=0.58 (HIGH). Criteria: T1 Eclipse · T2 Lunar eclipse · T6-T10 Outer asp · T11 Eclipse pair · T18 BML/Eris/Ceres. Ceres 14.59°Can. Nep⚹Plu; BML anar 27.0; Eris□Plu.",
        "pair": null,
        "geostress": "Pacific — T1 Eclipse · T2 Lunar eclipse · T6-T10 Outer asp · T11 ",
        "source": "v7.4 backtest · Pacific",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T1 Eclipse · T2 Lunar eclipse · T6-T10 Outer asp · T11 Eclipse pair · T18 BML/Eris/Ceres"
        }
    },
    {
        "date": "2020-03-11",
        "name": "COVID-19 declared pandemic",
        "type": "compound",
        "sev": 5,
        "deaths": 6900000,
        "dmg": null,
        "pss": 0.3,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 29.54°Can"
        ],
        "notes": "PSS=0.3 (LOW). Criteria: T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation. Ceres 29.54°Can. Nep⚹Plu; Eris□Plu; Ceres anar 29.5; Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Global",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation"
        }
    },
    {
        "date": "2020-09-18",
        "name": "California wildfire season record",
        "type": "wildfire",
        "sev": 2,
        "deaths": 31,
        "dmg": null,
        "pss": 0.46,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 10.35°Vir"
        ],
        "notes": "PSS=0.46 (MODERATE). Criteria: T5 Mars Rx · T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation · T23 Weather amp. Ceres 10.35°Vir. Sat□/☍Ura; Jup☌mal; Nep⚹Plu; BML☌/□Plu; Eris□Plu; Lunation ±3d; Fire sign heat.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T5 Mars Rx · T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation · T23 Weather amp"
        }
    },
    {
        "date": "2020-10-30",
        "name": "Aegean earthquake Izmir",
        "type": "earthquake",
        "sev": 3,
        "deaths": 114,
        "dmg": null,
        "pss": 0.51,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 19.33°Vir"
        ],
        "notes": "PSS=0.51 (MODERATE). Criteria: T3 Mercury Rx · T5 Mars Rx · T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation. Ceres 19.33°Vir. Sat□/☍Ura; Jup☌mal; Nep⚹Plu; BML☌/□Plu; Eris□Plu; Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T3 Mercury Rx · T5 Mars Rx · T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation"
        }
    },
    {
        "date": "2021-06-01",
        "name": "Surfside condo collapse Miami",
        "type": "compound",
        "sev": 4,
        "deaths": 98,
        "dmg": null,
        "pss": 0.81,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 5.05°Sco"
        ],
        "notes": "PSS=0.81 (CRITICAL). Criteria: T1 Eclipse · T2 Lunar eclipse · T3 Mercury Rx · T6-T10 Outer asp · T11 Eclipse pair · T18 BML/Eris/Ceres · T24 Mercury acc. Ceres 5.05°Sco. Sat□/☍Ura; Nep⚹Plu; Eris□Plu; MercRx; MercStation(±3d).",
        "pair": null,
        "geostress": "Americas — T1 Eclipse · T2 Lunar eclipse · T3 Mercury Rx · T6-T10 ",
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 7,
            "of": 28,
            "key": "T1 Eclipse · T2 Lunar eclipse · T3 Mercury Rx · T6-T10 Outer asp · T11 Eclipse pair · T18 BML/Eris/Ceres · T24 Mercury acc"
        }
    },
    {
        "date": "2021-06-26",
        "name": "Pacific Northwest heat dome",
        "type": "heatwave",
        "sev": 3,
        "deaths": 619,
        "dmg": null,
        "pss": 0.56,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 10.39°Sco"
        ],
        "notes": "PSS=0.56 (HIGH). Criteria: T1 Eclipse · T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation · T23 Weather amp. Ceres 10.39°Sco. Sat□/☍Ura; Nep⚹Plu; BML anar 27.4; Eris□Plu; Lunation ±3d; Fire sign heat; Peak heat season.",
        "pair": null,
        "geostress": "Americas — T1 Eclipse · T6-T10 Outer asp · T18 BML/Eris/Ceres · T1",
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T1 Eclipse · T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation · T23 Weather amp"
        }
    },
    {
        "date": "2021-07-12",
        "name": "Ahr Valley floods Germany Belgium",
        "type": "flood",
        "sev": 3,
        "deaths": 220,
        "dmg": null,
        "pss": 0.44,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 13.81°Sco"
        ],
        "notes": "PSS=0.44 (MODERATE). Criteria: T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño. Ceres 13.81°Sco. Sat□/☍Ura; Nep⚹Plu; BML anar 29.2; Eris□Plu; Lunation ±3d; La Nina.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño"
        }
    },
    {
        "date": "2021-07-17",
        "name": "China Henan floods Zhengzhou",
        "type": "flood",
        "sev": 3,
        "deaths": 302,
        "dmg": null,
        "pss": 0.37,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 14.88°Sco"
        ],
        "notes": "PSS=0.37 (LOW). Criteria: T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T22 El Niño. Ceres 14.88°Sco. Sat□/☍Ura; Nep⚹Plu; BML anar 29.8; Eris□Plu; La Nina.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T22 El Niño"
        }
    },
    {
        "date": "2021-08-14",
        "name": "Haiti earthquake 2021",
        "type": "earthquake",
        "sev": 4,
        "deaths": 2248,
        "dmg": 1.6,
        "pss": 0.28,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 20.86°Sco"
        ],
        "notes": "[v7.8 exact-epicentre recomputed] PSS=0.26 (LOW). Criteria: T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres. Ceres 20.86°Sco. Sat□/☍Ura; Nep⚹Plu; Eris□Plu.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres"
        }
    },
    {
        "date": "2021-08-22",
        "name": "Dixie fire California",
        "type": "wildfire",
        "sev": 1,
        "deaths": 1,
        "dmg": null,
        "pss": 0.29,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 22.57°Sco"
        ],
        "notes": "PSS=0.29 (LOW). Criteria: T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation. Ceres 22.57°Sco. Sat□/☍Ura; Nep⚹Plu; Eris□Plu; Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation"
        }
    },
    {
        "date": "2021-09-19",
        "name": "La Palma volcanic eruption",
        "type": "compound",
        "sev": 1,
        "deaths": 0,
        "dmg": null,
        "pss": 0.42,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 28.55°Sco"
        ],
        "notes": "PSS=0.42 (MODERATE). Criteria: T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation · T20-T21 ASC/Ring · T24 Mercury acc. Ceres 28.55°Sco. Sat□/☍Ura; Nep⚹Plu; Eris□Plu; Ceres anar 28.6; Lunation ±3d; Volcanic; Merc/Plu.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation · T20-T21 ASC/Ring · T24 Mercury acc"
        }
    },
    {
        "date": "2021-12-10",
        "name": "Midwest tornado outbreak Kentucky",
        "type": "storm_cyclone",
        "sev": 2,
        "deaths": 90,
        "dmg": null,
        "pss": 0.47,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 16.07°Sag"
        ],
        "notes": "PSS=0.47 (MODERATE). Criteria: T1 Eclipse · T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T22 El Niño. Ceres 16.07°Sag. Sat□/☍Ura; Nep⚹Plu; Eris□Plu; La Nina.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T1 Eclipse · T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T22 El Niño"
        }
    },
    {
        "date": "2022-01-15",
        "name": "Tonga volcanic eruption and tsunami",
        "type": "compound",
        "sev": 1,
        "deaths": 6,
        "dmg": null,
        "pss": 0.47,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 23.76°Sag"
        ],
        "notes": "PSS=0.47 (MODERATE). Criteria: T3 Mercury Rx · T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T20-T21 ASC/Ring. Ceres 23.76°Sag. Sat□/☍Ura; Nep⚹Plu; Eris□Plu; Lunation ±3d; ROF seismic; Volcanic.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Pacific",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T3 Mercury Rx · T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T20-T21 ASC/Ring"
        }
    },
    {
        "date": "2022-02-28",
        "name": "Queensland NSW floods Lismore",
        "type": "flood",
        "sev": 2,
        "deaths": 23,
        "dmg": null,
        "pss": 0.34,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 3.17°Cap"
        ],
        "notes": "PSS=0.34 (LOW). Criteria: T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño. Ceres 3.17°Cap. Sat□/☍Ura; Nep⚹Plu; Eris□Plu; Lunation ±3d; La Nina.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Pacific",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño"
        }
    },
    {
        "date": "2022-05-15",
        "name": "South Asia heatwave",
        "type": "heatwave",
        "sev": 2,
        "deaths": 90,
        "dmg": null,
        "pss": 0.81,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 19.4°Cap"
        ],
        "notes": "PSS=0.81 (CRITICAL). Criteria: T1 Eclipse · T2 Lunar eclipse · T3 Mercury Rx · T6-T10 Outer asp · T11 Eclipse pair · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation. Ceres 19.4°Cap Rx. Sat□/☍Ura; Nep⚹Plu; Eris□Plu; Ceres Rx; Lunation ±3d.",
        "pair": null,
        "geostress": "Asia — T1 Eclipse · T2 Lunar eclipse · T3 Mercury Rx · T6-T10 ",
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 8,
            "of": 28,
            "key": "T1 Eclipse · T2 Lunar eclipse · T3 Mercury Rx · T6-T10 Outer asp · T11 Eclipse pair · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation"
        }
    },
    {
        "date": "2022-06-14",
        "name": "Sichuan earthquake 2022",
        "type": "earthquake",
        "sev": 3,
        "deaths": 108,
        "dmg": null,
        "pss": 0.43,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 25.81°Cap"
        ],
        "notes": "PSS=0.43 (MODERATE). Criteria: T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation. Ceres 25.81°Cap Rx. Sat□/☍Ura; Nep⚹Plu; Eris□Plu; Ceres☌Plu; Ceres Rx; Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation"
        }
    },
    {
        "date": "2022-06-15",
        "name": "Pakistan mega-floods 2022",
        "type": "flood",
        "sev": 4,
        "deaths": 1739,
        "dmg": null,
        "pss": 0.5,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 26.03°Cap"
        ],
        "notes": "PSS=0.5 (MODERATE). Criteria: T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño. Ceres 26.03°Cap Rx. Sat□/☍Ura; Nep⚹Plu; Eris□Plu; Ceres☌Plu; Ceres Rx; Lunation ±3d; La Nina.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T6-T10 Outer asp · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño"
        }
    },
    {
        "date": "2022-11-21",
        "name": "Cianjur earthquake Indonesia",
        "type": "earthquake",
        "sev": 3,
        "deaths": 600,
        "dmg": 0.5,
        "pss": 0.72,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 30.0°Aqu"
        ],
        "notes": "PSS=0.72 (CRITICAL). Criteria: T2 Lunar eclipse · T5 Mars Rx · T6-T10 Outer asp · T16 Anaretic · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T20-T21 ASC/Ring. Ceres 30.0°Aqu. Sat□/☍Ura; Nep⚹Plu; Node anar; BML☌/□Plu; Eris□Plu; Ceres anar 30.0; Lunation ±3d; ROF seismic.",
        "pair": null,
        "geostress": "Asia — T2 Lunar eclipse · T5 Mars Rx · T6-T10 Outer asp · T16 ",
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 8,
            "of": 28,
            "key": "T2 Lunar eclipse · T5 Mars Rx · T6-T10 Outer asp · T16 Anaretic · T17 Node/eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T20-T21 ASC/Ring"
        }
    },
    {
        "date": "2023-02-19",
        "name": "Cyclone Gabrielle New Zealand",
        "type": "storm_cyclone",
        "sev": 2,
        "deaths": 14,
        "dmg": null,
        "pss": 0.34,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 19.23°Pis"
        ],
        "notes": "PSS=0.34 (LOW). Criteria: T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño. Ceres 19.23°Pis. Nep⚹Plu; Sat anar; BML☌/□Plu; Eris□Plu; Lunation ±3d; El Nino.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Pacific",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño"
        }
    },
    {
        "date": "2023-06-02",
        "name": "Balasore train collision India",
        "type": "accident",
        "sev": 3,
        "deaths": 293,
        "dmg": null,
        "pss": 0.17,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 11.24°Ari"
        ],
        "notes": "PSS=0.17 (LOW). Criteria: T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation. Ceres 11.24°Ari. Nep⚹Plu; Eris□Plu; Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 3,
            "of": 28,
            "key": "T6-T10 Outer asp · T18 BML/Eris/Ceres · T19 Lunation"
        }
    },
    {
        "date": "2023-06-18",
        "name": "Titan submersible implosion",
        "type": "accident",
        "sev": 1,
        "deaths": 5,
        "dmg": null,
        "pss": 0.23,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 14.65°Ari"
        ],
        "notes": "PSS=0.23 (LOW). Criteria: T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres · T19 Lunation. Ceres 14.65°Ari. Nep⚹Plu; Eris□Plu; Lunation ±3d.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres · T19 Lunation"
        }
    },
    {
        "date": "2023-07-15",
        "name": "European North African heatwaves",
        "type": "heatwave",
        "sev": 4,
        "deaths": 1500,
        "dmg": null,
        "pss": 0.4,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 20.42°Ari"
        ],
        "notes": "PSS=0.4 (MODERATE). Criteria: T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño · T23 Weather amp. Ceres 20.42°Ari Rx. Nep⚹Plu; Eris□Plu; Ceres Rx; Lunation ±3d; El Nino; Peak heat season.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T6-T10 Outer asp · T12-T15 Eclipse° · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño · T23 Weather amp"
        }
    },
    {
        "date": "2023-07-24",
        "name": "Greek wildfires Rhodes Corfu",
        "type": "wildfire",
        "sev": 2,
        "deaths": 20,
        "dmg": null,
        "pss": 0.23,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 22.35°Ari"
        ],
        "notes": "PSS=0.23 (LOW). Criteria: T4 Venus Rx · T6-T10 Outer asp · T18 BML/Eris/Ceres · T22 El Niño. Ceres 22.35°Ari Rx. Nep⚹Plu; Eris□Plu; Ceres Rx; El Nino.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T4 Venus Rx · T6-T10 Outer asp · T18 BML/Eris/Ceres · T22 El Niño"
        }
    },
    {
        "date": "2023-11-02",
        "name": "Nepal earthquake 2023",
        "type": "earthquake",
        "sev": 3,
        "deaths": 157,
        "dmg": null,
        "pss": 0.5,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 13.93°Tau"
        ],
        "notes": "PSS=0.5 (MODERATE). Criteria: T1 Eclipse · T2 Lunar eclipse · T6-T10 Outer asp · T11 Eclipse pair · T18 BML/Eris/Ceres. Ceres 13.93°Tau. Nep⚹Plu; Eris□Plu.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T1 Eclipse · T2 Lunar eclipse · T6-T10 Outer asp · T11 Eclipse pair · T18 BML/Eris/Ceres"
        }
    },
    {
        "date": "2024-01-01",
        "name": "Noto Peninsula earthquake Japan",
        "type": "earthquake",
        "sev": 3,
        "deaths": 241,
        "dmg": null,
        "pss": 0.38,
        "stars": [
            "BML/Eris/Ceres stress — Ceres 26.75°Tau"
        ],
        "notes": "[v7.8 exact-epicentre recomputed] PSS=0.29 (LOW). Criteria: T3 Mercury Rx · T6-T10 Outer asp · T18 BML/Eris/Ceres · T20-T21 ASC/Ring. Ceres 26.75°Tau. Jup☌mal; Nep⚹Plu; Eris□Plu; ROF seismic.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 4,
            "of": 28,
            "key": "T3 Mercury Rx · T6-T10 Outer asp · T18 BML/Eris/Ceres · T20-T21 ASC/Ring"
        }
    },
    {
        "date": "2024-03-26",
        "name": "Francis Scott Key Bridge collapse",
        "type": "accident",
        "sev": 3,
        "deaths": 6,
        "dmg": 1.7,
        "pss": 0.84,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 14.91°Gem"
        ],
        "notes": "PSS=0.84 (CRITICAL). Criteria: T1 Eclipse · T2 Lunar eclipse · T6-T10 Outer asp · T11 Eclipse pair · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T24 Mercury acc. Ceres 14.91°Gem. Jup☌mal; Nep⚹Plu; Nep anar; Eris□Plu; Lunation ±3d; MercStation(±6d); Merc/Plu.",
        "pair": null,
        "geostress": "Americas — T1 Eclipse · T2 Lunar eclipse · T6-T10 Outer asp · T11 ",
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 8,
            "of": 28,
            "key": "T1 Eclipse · T2 Lunar eclipse · T6-T10 Outer asp · T11 Eclipse pair · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T24 Mercury acc"
        }
    },
    {
        "date": "2024-04-14",
        "name": "UAE floods Dubai",
        "type": "flood",
        "sev": 2,
        "deaths": 21,
        "dmg": null,
        "pss": 0.59,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 18.97°Gem"
        ],
        "notes": "PSS=0.59 (HIGH). Criteria: T1 Eclipse · T3 Mercury Rx · T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T22 El Niño. Ceres 18.97°Gem. Jup☌mal; Nep⚹Plu; Nep anar; BML☌Nep; Eris□Plu; El Nino.",
        "pair": null,
        "geostress": "Middle East — T1 Eclipse · T3 Mercury Rx · T6-T10 Outer asp · T16 Ana",
        "source": "v7.4 backtest · Middle East",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T1 Eclipse · T3 Mercury Rx · T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T22 El Niño"
        }
    },
    {
        "date": "2024-05-15",
        "name": "Rio Grande do Sul floods Brazil",
        "type": "flood",
        "sev": 3,
        "deaths": 600,
        "dmg": null,
        "pss": 0.43,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 25.59°Gem"
        ],
        "notes": "PSS=0.43 (MODERATE). Criteria: T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T22 El Niño · T23 Weather amp. Ceres 25.59°Gem. Jup☌mal; Nep⚹Plu; Nep anar; Node anar; BML☌Nep; Eris□Plu; El Nino; Water sign flood.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Americas",
        "crit": {
            "n": 5,
            "of": 28,
            "key": "T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T22 El Niño · T23 Weather amp"
        }
    },
    {
        "date": "2025-03-28",
        "name": "Myanmar earthquake",
        "type": "earthquake",
        "sev": 4,
        "deaths": 3700,
        "dmg": 1,
        "pss": 0.96,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 3.32°Vir"
        ],
        "notes": "PSS=0.96 (CRITICAL). Criteria: T1 Eclipse · T2 Lunar eclipse · T3 Mercury Rx · T6-T10 Outer asp · T11 Eclipse pair · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T20-T21 ASC/Ring. Ceres 3.32°Vir. Sat/Nep; Nep⚹Plu; Nep anar; BML☌/□Plu; Eris□Plu; Lunation ±3d; ROF seismic.",
        "pair": null,
        "geostress": "Asia — T1 Eclipse · T2 Lunar eclipse · T3 Mercury Rx · T6-T10 ",
        "source": "v7.4 backtest · Asia",
        "crit": {
            "n": 9,
            "of": 28,
            "key": "T1 Eclipse · T2 Lunar eclipse · T3 Mercury Rx · T6-T10 Outer asp · T11 Eclipse pair · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T20-T21 ASC/Ring"
        }
    },
    {
        "date": "2025-07-13",
        "name": "European heatwave 2025",
        "type": "heatwave",
        "sev": 5,
        "deaths": 24000,
        "dmg": null,
        "pss": 0.45,
        "stars": [
            "Anaretic degree activation",
            "BML/Eris/Ceres stress — Ceres 26.18°Vir"
        ],
        "notes": "PSS=0.45 (MODERATE). Criteria: T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño · T23 Weather amp. Ceres 26.18°Vir. Sat/Nep; Nep⚹Plu; Ura anar; Eris□Plu; Lunation ±3d; El Nino; Peak heat season.",
        "pair": null,
        "geostress": null,
        "source": "v7.4 backtest · Europe",
        "crit": {
            "n": 6,
            "of": 28,
            "key": "T6-T10 Outer asp · T16 Anaretic · T18 BML/Eris/Ceres · T19 Lunation · T22 El Niño · T23 Weather amp"
        }
    }
] satisfies OriginalDashboardEvent[];
