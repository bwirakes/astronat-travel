import type { BodyStarMatrixCatalog } from "./weather-types";

export const STARS_LIST = [
    "Algol (26°♉)",
    "Scheat (29°♓)",
    "Antares (9°♐)",
    "Pleiades (29°♉)",
    "Aldebaran (9°♊)",
    "Fomalhaut (3°♓)",
    "Regulus (0°♍)",
];

export const BODIES_LIST = [
    "Mars",
    "Uranus",
    "Neptune",
    "Saturn",
    "Jupiter",
    "Sun",
    "Chiron",
    "Eris",
    "Ceres",
    "BML",
];

export const STAR_SEVERITY: Record<string, number> = {
    "Algol (26°♉)": 1.0,
    "Scheat (29°♓)": 0.9,
    "Antares (9°♐)": 0.85,
    "Pleiades (29°♉)": 0.85,
    "Aldebaran (9°♊)": 0.80,
    "Fomalhaut (3°♓)": 0.70,
    "Regulus (0°♍)": 0.65,
};

export const BODY_STAR_NOTES: Record<string, Record<string, string>> = {
    Mars: {
        "Algol (26°♉)": "Explosive mass casualties; fires beyond all scale",
        "Scheat (29°♓)": "Sudden maritime violence; storm surge",
        "Antares (9°♐)": "Maximum fire-weather ignition; Mars/Antares 2yr cycle",
        "Pleiades (29°♉)": "Sudden mass grief; loss of life cluster",
        "Aldebaran (9°♊)": "Violent wind-driven storm; derecho; tempest",
        "Fomalhaut (3°♓)": "Sudden flood where defences fail instantly",
        "Regulus (0°♍)": "Military or police action producing leadership crisis",
    },
    Uranus: {
        "Algol (26°♉)": "Sudden mass-casualty geological rupture; Turkey Feb 2023",
        "Scheat (29°♓)": "Unexpected maritime disasters; tidal disruption",
        "Antares (9°♐)": "Record-breaking sudden fire; first-in-decades event",
        "Pleiades (29°♉)": "Sudden mass displacement; unexpected grief events",
        "Aldebaran (9°♊)": "Unprecedented storm force; weather records broken",
        "Fomalhaut (3°♓)": "Unexpected failure of trusted water systems",
        "Regulus (0°♍)": "Sudden political upset following disaster",
    },
    Neptune: {
        "Algol (26°♉)": "Extreme flooding mass casualties",
        "Scheat (29°♓)": "MAXIMUM water disaster; maritime catastrophe",
        "Antares (9°♐)": "Slow-build fire via drought; gradual fire crisis",
        "Pleiades (29°♉)": "Mass grief over extended water event; multi-week flood",
        "Aldebaran (9°♊)": "Extended atmospheric storm season; not single event",
        "Fomalhaut (3°♓)": "Water systems trusted then dissolved; dams, levees",
        "Regulus (0°♍)": "Leadership dissolution by gradual crisis",
    },
    Saturn: {
        "Algol (26°♉)": "Structural mass-casualty failure",
        "Scheat (29°♓)": "Structural flood; infrastructure overwhelmed by water",
        "Antares (9°♐)": "Prolonged grinding conflict or sustained fire season",
        "Pleiades (29°♉)": "Mass structural grief; disaster + prolonged mourning",
        "Aldebaran (9°♊)": "Sustained structural storm damage; multi-day event",
        "Fomalhaut (3°♓)": "Oroville-type: dam/levee trusted, structurally fails",
        "Regulus (0°♍)": "Governmental failure evaluated by disaster",
    },
    Jupiter: {
        "Algol (26°♉)": "Excess severity amplified; mass-scale events",
        "Scheat (29°♓)": "Excess volume flooding; Pakistan 2022-type events",
        "Antares (9°♐)": "Record-breaking storms of excess",
        "Pleiades (29°♉)": "Mass events of excess; bumper grief or abundance",
        "Aldebaran (9°♊)": "Record-scale tempest; maritime excess",
        "Fomalhaut (3°♓)": "Flooding of idealised systems; agricultural collapse",
        "Regulus (0°♍)": "Leadership triumph or judgment following disaster",
    },
    Sun: {
        "Algol (26°♉)": "Annual peak ±5d ~May 17; publicises catastrophe",
        "Scheat (29°♓)": "Annual maritime peak ~Mar 19–20",
        "Antares (9°♐)": "Annual fire-weather peak ~Dec 1–5 (Sun at 9°♐)",
        "Pleiades (29°♉)": "Annual mass-grief activation ~May 19–20",
        "Aldebaran (9°♊)": "Annual storm peak ~Jun 1–5",
        "Fomalhaut (3°♓)": "Annual water-system-failure peak ~Feb 22–25",
        "Regulus (0°♍)": "Annual leadership test peak ~Sep 17–23",
    },
    Chiron: {
        "Algol (26°♉)": "Pioneer mass-casualty wound; first-in-history disaster of this type",
        "Scheat (29°♓)": "Unhealed maritime wound repeated; pioneer storm to previously unaffected region",
        "Antares (9°♐)": "Record-setting wildfire via unresolved environmental wound",
        "Pleiades (29°♉)": "Pioneer mass grief; first-ever unprecedented scale of collective loss",
        "Aldebaran (9°♊)": "Wind record shattered; atmospheric violence setting new historical benchmark",
        "Fomalhaut (3°♓)": "Water infrastructure wound — trusted system destroyed for the first time",
        "Regulus (0°♍)": "Leadership forced to confront long-denied environmental wound publicly",
    },
    Eris: {
        "Algol (26°♉)": "Total chaos forcing global reckoning; catastrophe beyond all control frameworks",
        "Scheat (29°♓)": "Chaotic maritime disaster defying all prediction models",
        "Antares (9°♐)": "Fire spreading contrary to all forecasts; unprecedented unpredictable behaviour",
        "Pleiades (29°♉)": "Sudden mass discord within disaster response; chaotic grief",
        "Aldebaran (9°♊)": "Storm of total disorder; simultaneous multi-vector atmospheric breakdown",
        "Fomalhaut (3°♓)": "Flood forcing collective attention onto long-ignored water infrastructure failure",
        "Regulus (0°♍)": "Institutional discord and blame war following forced public reckoning",
    },
    Ceres: {
        "Algol (26°♉)": "Agricultural mass casualty; famine-level crop destruction following disaster",
        "Scheat (29°♓)": "Flood annihilating agricultural land; season-ending water excess",
        "Antares (9°♐)": "Sustained drought + heat destroying seasonal agricultural cycle",
        "Pleiades (29°♉)": "Mass crop failure; collective grief over food security collapse",
        "Aldebaran (9°♊)": "Storm destroying harvest infrastructure; agricultural supply chain break",
        "Fomalhaut (3°♓)": "Irrigation or aquifer failure; foundational water supply collapse",
        "Regulus (0°♍)": "Government food security response under public scrutiny; harvest policy crisis",
    },
    BML: {
        "Algol (26°♉)": "Maximum dark extreme — suppressed violence erupting beyond all precedent",
        "Scheat (29°♓)": "Hidden maritime force suddenly unleashed; freak wave or unexpected storm surge",
        "Antares (9°♐)": "Suppressed wildfire erupting — years of unburned fuel ignited at once",
        "Pleiades (29°♉)": "Hidden grief emerging days after event; shadow casualties surfacing post-disaster",
        "Aldebaran (9°♊)": "Wild uncontrollable wind; tempest defying all forecasting and containment",
        "Fomalhaut (3°♓)": "Hidden underground or upstream water force suddenly released without warning",
        "Regulus (0°♍)": "Suppressed truth exposed by disaster; hidden leadership crisis suddenly surfaces",
    },
};

export const BODY_STAR_MATRIX: BodyStarMatrixCatalog = {
    stars: STARS_LIST,
    bodies: BODIES_LIST,
    starSeverity: STAR_SEVERITY,
    notes: BODY_STAR_NOTES,
};
