// Astrological glyphs — Unicode astronomy symbols
export const PLANET_GLYPHS: Record<string, string> = {
    Sun: "☉",
    Moon: "☽",
    Mercury: "☿",
    Venus: "♀",
    Mars: "♂",
    Jupiter: "♃",
    Saturn: "♄",
    Uranus: "♅",
    Neptune: "♆",
    Pluto: "♇",
};

// Planetary emoji for visual display
export const PLANET_EMOJI: Record<string, string> = {
    Sun: "☀️",
    Moon: "🌙",
    Mercury: "💨",
    Venus: "💚",
    Mars: "🔴",
    Jupiter: "🟠",
    Saturn: "🪐",
    Uranus: "🔵",
    Neptune: "🌊",
    Pluto: "⚫",
};

export const SIGN_GLYPHS: Record<string, string> = {
    Aries: "♈",
    Taurus: "♉",
    Gemini: "♊",
    Cancer: "♋",
    Leo: "♌",
    Virgo: "♍",
    Libra: "♎",
    Scorpio: "♏",
    Sagittarius: "♐",
    Capricorn: "♑",
    Aquarius: "♒",
    Pisces: "♓",
};

// Rich astrocartography interpretations per planet × angle
// Based on Jim Lewis ACG theory + Helena Woods / Wild Witch West reading guides
export interface PlanetAngleMeaning {
    badge: string;
    description: string;
    /** East vs West placement guidance for this angle type */
    eastWest: string;
    /** What the orb distance means for this specific combination */
    orbGuidance: string;
}

export const PLANET_MEANINGS: Record<string, Record<string, PlanetAngleMeaning>> = {
    Sun: {
        MC: {
            badge: "Spotlight & Visibility",
            description: "The Sun on your Midheaven line brings you into public life here. Career, reputation, and visibility are spotlit — people notice you. This is a place where your identity aligns with your vocation and you are seen for who you truly are.",
            eastWest: "West of this line activates full 10th house energy: career ambition, authority, and public recognition. East of it shifts toward 9th house themes — teaching, publishing, higher learning, and international perspective.",
            orbGuidance: "Within 150 miles the effect is pronounced and hard to ignore. Up to 300 miles you'll feel a steady sense of purpose and visibility. Beyond 500 miles it's a subtle background hum.",
        },
        IC: {
            badge: "Inner Identity",
            description: "The Sun on your IC line anchors deep personal identity to this territory. A place for self-discovery, ancestral roots, and private renewal. You feel at home at a soul level — this location nourishes who you are beneath the surface.",
            eastWest: "West of the IC line draws you toward the private foundation of your chart — home, family, and psychic depth. East shifts energy toward 3rd house themes of learning and local community.",
            orbGuidance: "Closer proximity intensifies the introspective pull. At 300+ miles this becomes a gentle sense of belonging rather than a transformative rootedness.",
        },
        ASC: {
            badge: "Self-Expression",
            description: "You radiate solar confidence here. Others see you as vital, charismatic, and authoritative — the Sun rises on your persona. Leadership comes naturally and your presence commands attention without effort.",
            eastWest: "West of the ASC line gives the most angular, personal expression of solar energy — you fully embody it. East places it in a more contemplative, cadent position where the energy is internalized rather than projected.",
            orbGuidance: "The Ascendant line is personally felt the most intensely of all four angles. Living within 150 miles is a powerful identity-altering experience.",
        },
        DSC: {
            badge: "Partnerships Shine",
            description: "Others who carry solar qualities — confident, creative, or authoritative people — are drawn to you here. Partnerships flourish and significant relationships are formed. The Sun illuminates your 7th house, making collaborations pivotal.",
            eastWest: "West of the DSC brings full 7th house partnership energy (committed relationships, contracts). East tilts toward 6th house — working relationships and service-oriented connections.",
            orbGuidance: "Within 200 miles you'll actively attract solar people and meaningful one-on-one relationships. The influence softens considerably beyond 400 miles.",
        },
    },
    Moon: {
        MC: {
            badge: "Emotional Fulfillment",
            description: "The Moon on the Midheaven brings emotional resonance to public life. Careers involving nurturing, the public, food, home, memory, or women flourish here. The local community emotionally adopts you — you feel publicly known and emotionally safe.",
            eastWest: "West means the Moon's fullest Cancerian instincts govern your career and reputation. East shifts to 9th house — intuitive wisdom, teaching, and publishing from an emotionally authentic place.",
            orbGuidance: "Closest proximity (under 150 miles) creates a strong emotional feedback loop with your environment. At greater distance the nurturance becomes subtler but still present.",
        },
        IC: {
            badge: "Home & Comfort",
            description: "The Moon's most natural home. This line marks where you feel deeply nurtured, emotionally secure, and rooted. A place to live more than visit — family life, domestic comfort, and a sense of genuine belonging carry here.",
            eastWest: "West emphasizes the 4th house's domestic, ancestral, and psychic depth. East brings a 3rd house flavor — feeling emotionally at ease in your immediate surroundings and neighborhood.",
            orbGuidance: "Even at 400+ miles, Moon IC lines feel softly comforting. Closer in (under 200 miles) the sense of home and belonging is visceral.",
        },
        ASC: {
            badge: "Emotional Magnetism",
            description: "Your emotional world is written on your face here. People find you approachable, nurturing, and intuitively in tune. You attract those who need emotional support, and you feel every mood of the environment acutely. Sensitivity is amplified.",
            eastWest: "West of the Moon ASC is the most personally felt — you become highly attuned, almost psychic in your environment. East shifts toward inward emotional processing rather than outward expression.",
            orbGuidance: "The Moon moves quickly in the sky; ASC lines can be particularly strong in smaller orbs. Within 150 miles emotional sensitivity is notably heightened.",
        },
        DSC: {
            badge: "Deep Connections",
            description: "Relationships formed here carry emotional weight and depth. You attract nurturing, sensitive, or maternal partners. Emotional bonds are meaningful and lasting. The Moon in your 7th house here makes others feel responsible for you — and you for them.",
            eastWest: "West of Moon DSC pulls toward committed emotional partnerships and caregiving bonds. East tilts toward day-to-day service and emotional support in working relationships.",
            orbGuidance: "Within 250 miles emotional connections formed here feel fated. The influence tapers meaningfully beyond 500 miles.",
        },
    },
    Venus: {
        MC: {
            badge: "Love & Social Magic",
            description: "One of the most celebrated lines in astrocartography. Venus on the Midheaven makes you elegant, charming, and socially magnetic in the public eye. Creative work, art, fashion, beauty, and diplomacy coalesce. This is where the world falls in love with you.",
            eastWest: "West brings full 10th house Venusian glory — career success through beauty, art, or charm; public adoration. East moves toward 9th house — love of learning, travel enchantment, and international aesthetics.",
            orbGuidance: "Even moderate orbs (up to 400 miles) carry a clear Venusian sweetness. Closest placement (under 150 miles) is a notably pleasurable and socially thriving environment.",
        },
        IC: {
            badge: "Domestic Beauty",
            description: "Home life is beautiful, harmonious, and aesthetically rich here. A place to create a sanctuary. Venus at the IC draws in loving family dynamics, comfortable spaces, and a deep feeling of being cherished at home.",
            eastWest: "West brings the full domestic beauty of the 4th house — a home that feels like art, loving family ties. East shifts toward neighborhood charm and ease in local community.",
            orbGuidance: "Moderate orbs work beautifully here — Venus IC influence at 300 miles still feels like a comfortable, aesthetically pleasing environment.",
        },
        ASC: {
            badge: "Beauty & Attraction",
            description: "You appear more beautiful, graceful, and magnetic here — others perceive you through a Venusian lens. Social interactions are effortless, romantic encounters happen naturally, and your artistic side comes forward. A place where you feel your most attractive self.",
            eastWest: "West of Venus ASC is where the full magnetic effect is felt — you truly embody Venusian allure. East internalizes the appreciation; you're drawn to beauty rather than attracting it.",
            orbGuidance: "Within 200 miles Venus ASC lines are notably felt in social and romantic encounters. One of the most pleasurable lines to live near.",
        },
        DSC: {
            badge: "Romantic Encounters",
            description: "Significant romantic partners are magnetized here. Venus in your 7th house floods the relationship zone — love affairs, aesthetic partnerships, and creative collaborations abound. A destination known for romance and connection.",
            eastWest: "West of Venus DSC brings full partnership enchantment — expect significant romantic or creative alliances. East softens this toward pleasurable working relationships and collaborative aesthetics.",
            orbGuidance: "Under 300 miles, romantic and social encounters feel noticeably abundant. Beyond 500 miles it's a pleasantly social environment without the magnetic intensity.",
        },
    },
    Mars: {
        MC: {
            badge: "Drive & Ambition",
            description: "Mars on the Midheaven supercharges ambition and career drive. You want to achieve, compete, and lead here. Excellent for entrepreneurial ventures, athletic pursuits, or any career that rewards assertiveness. Be mindful of conflict with authorities.",
            eastWest: "West of Mars MC brings warrior energy to your career — competitive, action-driven, and potentially confrontational at the top. East channels this into 9th house ambition: energetic pursuit of knowledge, adventure, and philosophical goals.",
            orbGuidance: "Under 200 miles Mars MC can feel intense — productive but exhausting. Moderate orbs (200–400 miles) give you drive without burning out.",
        },
        IC: {
            badge: "Inner Fire",
            description: "Home and domestic life carry an edge of volatility, passion, or relentless energy here. You may feel restless at home, driven to renovate or relocate repeatedly. Deep ancestral warrior energy surfaces — can be healing or combative depending on awareness.",
            eastWest: "West of Mars IC stokes the 4th house fire — family dynamics, home renovations, inner battles with roots. East brings 3rd house restlessness — constant movement through the local environment.",
            orbGuidance: "Mars IC is best approached with moderate orbs (200–400 miles) — close proximity can make home feel like a battlefield.",
        },
        ASC: {
            badge: "Energy & Action",
            description: "You come alive physically here — bold, direct, energetic. Others experience you as assertive and powerful. Athletic performance peaks. Be conscious that Mars on the Ascendant can read as aggressive; channel the energy into purposeful action rather than reactive impulse.",
            eastWest: "West of Mars ASC gives the full physicalized warrior effect — you feel strong and others feel your force. East turns this inward, giving personal drive and restlessness that fuels private action.",
            orbGuidance: "Within 150–200 miles the energy boost is palpable — excellent for physical challenges, sports, or any intensive work. Tightest orbs can feel overstimulating for longer stays.",
        },
        DSC: {
            badge: "Passionate Bonds",
            description: "The people you meet here carry Martian intensity — passionate, driven, possibly confrontational. Relationships forged here have heat. Romantic partnerships feel electric and competitive. Use consciously: this line makes for passionate connections that can cut both ways.",
            eastWest: "West of Mars DSC draws passionate and potentially combative one-on-one partnerships. East brings fiery energy to working relationships, health routines, and service collaborations.",
            orbGuidance: "Within 250 miles the intensity of interpersonal dynamics is pronounced. Best for short visits or when you want high-energy encounters rather than settled relationship life.",
        },
    },
    Jupiter: {
        MC: {
            badge: "Expansion & Success",
            description: "One of the most sought-after lines. Jupiter on the Midheaven expands career, reputation, and public standing. Luck feels structural rather than fleeting — opportunities arrive with less effort. Teaching, publishing, law, philosophy, and international work all flourish.",
            eastWest: "West of Jupiter MC is where career abundance peaks — promotions, visibility, and fortunate alliances come naturally. East shifts this toward 9th house wisdom: you're celebrated for your knowledge, travel writing, or philosophical contribution.",
            orbGuidance: "Jupiter's expansion is felt broadly — even 500 mile orbs carry a background sense of optimism and opportunity. Within 200 miles the luck feels concrete and consistent.",
        },
        IC: {
            badge: "Inner Growth",
            description: "A place that grows your soul. Jupiter at the IC brings generosity, warmth, and a philosophical richness to home and family life. Families feel larger, more inclusive. You have space to breathe and reflect. Ideal for long-term living or a retreat.",
            eastWest: "West expands the domestic sphere — bigger homes, larger families, abundant private life. East carries Jupiterian generosity into the neighborhood and local community.",
            orbGuidance: "Jupiter IC lines work beautifully even at 400+ mile orbs — a quiet abundance permeates the surroundings without overwhelming.",
        },
        ASC: {
            badge: "Luck & Opportunity",
            description: "Opportunities seem to just appear here. You radiate optimism and others respond with generosity. A classic 'lucky' line — doors open, introductions happen, and your natural confidence draws fortunate circumstances. Great for travel, networking, and first impressions.",
            eastWest: "West of Jupiter ASC gives the full expansive personal effect — you feel bigger, luckier, more confident. East tempers this into a more philosophical self-expansion — learning and broadening your worldview rather than external fortune.",
            orbGuidance: "Within 200 miles you'll notice tangible luck-like synchronicities. At 400+ miles Jupiter ASC acts as a pleasant backdrop of optimism and social ease.",
        },
        DSC: {
            badge: "Generous Connections",
            description: "Abundant, generous, and educated people gravitate toward you here. Jupiter in the 7th opens the door to partnerships with mentors, benefactors, and culturally enriching collaborators. Business partnerships succeed and romantic relationships carry a philosophical quality.",
            eastWest: "West of Jupiter DSC brings major partnership expansion — significant mentors, wealthy allies, or abundant marriages. East brings Jupiter's generosity to working relationships and daily collaborations.",
            orbGuidance: "Moderate to wide orbs (up to 500 miles) still carry notable benefit — Jupiter is generous with its influence distance.",
        },
    },
    Saturn: {
        MC: {
            badge: "Hard Work Pays Off",
            description: "Saturn at the Midheaven demands excellence but rewards it. Career here requires sustained effort, discipline, and patience — but achievements are lasting and recognized. Excellent for long-term professional building. Authority figures may be stern; use structure as your superpower.",
            eastWest: "West of Saturn MC gives full Capricornian 10th house energy — hard-won career authority and lasting reputation. East channels this into serious academic achievement, academic publishing, or structured travel with purpose.",
            orbGuidance: "Under 150 miles Saturn MC can feel demanding or heavy — best for short-term focused work sprints or if your natal chart handles Saturn well. At 300+ miles the discipline is constructive without being oppressive.",
        },
        IC: {
            badge: "Deep Foundations",
            description: "This line calls you to build something that lasts at the foundation level. Home life may feel structured, traditional, or burdened with responsibility — but what you create here is enduring. Ancestral patterns surface for resolution. A serious but ultimately grounding location.",
            eastWest: "West of Saturn IC brings the full weight of family karma and domestic responsibility. East brings a more measured, methodical approach to local community and everyday life.",
            orbGuidance: "Saturn IC is most constructive at moderate orbs (200–400 miles) — you get the grounding without the heaviness bearing down directly.",
        },
        ASC: {
            badge: "Growth Through Challenge",
            description: "You appear more serious, composed, and authoritative here. Others receive you as mature and capable. Life asks more of you — structure, mastery, and discipline are rewarded. Growth is real but slow. Saturn on the Ascendant builds character through challenge.",
            eastWest: "West brings the full disciplinarian effect to your persona — you are the authority figure. East internalizes this as a drive toward self-mastery and private ambition rather than outer gravitas.",
            orbGuidance: "Closest orbs (under 150 miles) can feel austere or restrictive for leisure travel. Better suited for intentional, goal-oriented visits. Moderate orbs feel like productive structure.",
        },
        DSC: {
            badge: "Serious Commitments",
            description: "Partnerships formed here are serious, karmic, and long-lasting. You may attract older, more experienced, or more structured partners. Contracts and commitments feel binding. Use this energy for professional partnerships that require staying power.",
            eastWest: "West of Saturn DSC gives the full weight of serious 7th house commitments — lasting but potentially heavy relationships. East shifts to structured working relationships and health discipline.",
            orbGuidance: "Under 300 miles expect significant, lasting partnership connections — but approach with eyes open. The energy is real and the commitments tend to stick.",
        },
    },
    Mercury: {
        MC: {
            badge: "Communication Wins",
            description: "Mercury on the Midheaven is the writer's, speaker's, and networker's line. Your voice carries publicly here — writing, media, teaching, and communication-based careers thrive. You're known as intelligent, quick, and articulate. Ideas translate into professional currency.",
            eastWest: "West of Mercury MC gives full 10th house communicative authority — career through words, media, and intellect. East deepens this into 9th house scholarly publishing, language learning, and philosophical writing.",
            orbGuidance: "Within 200 miles the mental stimulation and career communication opportunities are noticeably heightened. A productive line for intellectual work even at moderate orbs.",
        },
        IC: {
            badge: "Inner Dialogue",
            description: "An active, curious mental environment at home. Family communication is lively but may be scattered or over-analytical. This line stimulates the mind at rest — a place where you think deeply about your roots and inner world. Writers and students often thrive near Mercury IC.",
            eastWest: "West brings mental liveliness to the domestic sphere. East channels Mercury's quick energy into neighborhood networks, local transit, and short daily journeys.",
            orbGuidance: "Mercury IC lines work well even at 300–400 mile orbs — you simply get a mentally stimulating local environment without the restlessness of close proximity.",
        },
        ASC: {
            badge: "Quick Connections",
            description: "You are seen as sharp, communicative, and socially nimble here. Conversations happen effortlessly; you make fast connections and introductions. Your wit is at its peak. Excellent for networking, journalism, or anywhere communication is the currency.",
            eastWest: "West of Mercury ASC makes the mercurial wit your defining quality — you're the connector, the talker, the networker. East internalizes this as rapid thinking and research rather than social performance.",
            orbGuidance: "Within 200 miles social and intellectual fluency are notably higher. A great line for any situation requiring sharp communication.",
        },
        DSC: {
            badge: "Intellectual Bonds",
            description: "You attract witty, intelligent, and communicative partners here. Relationships involve a strong mental component — conversations keep you engaged. Business partnerships are mentally stimulating. The 7th house here favors contracts and agreements.",
            eastWest: "West of Mercury DSC courts smart, verbal, Contract-oriented partners. East tilts toward working relationships built around practical communication — colleagues, co-workers, editors.",
            orbGuidance: "Under 300 miles you'll notice a clear mental chemistry with the people you meet. Intellectual connections are notably more common.",
        },
    },
    Uranus: {
        MC: {
            badge: "Breakthroughs",
            description: "Uranus at the Midheaven is electric, unpredictable, and revolutionary. Career here is unconventional — you may work in technology, activism, innovation, or artistic disruption. Expect sudden shifts in direction. This line is best for those ready to break the mold, not those seeking stability.",
            eastWest: "West of Uranus MC unleashes full disruptive career energy — sudden changes, brilliant innovations, and very unconventional professional paths. East channels this into 9th house intellectual rebellion — cutting-edge philosophies, tech-enabled travel, and avant-garde education.",
            orbGuidance: "Even at 400+ miles Uranus MC carries an electric atmosphere. Closest proximity (under 150 miles) can feel chaotic — best for short committed sprints of innovation rather than long-term settling.",
        },
        IC: {
            badge: "Inner Revolution",
            description: "Home life carries an electric, unstable, or radically independent quality. You may move frequently or live in unconventional arrangements. Deep urge for freedom at your foundation. A powerful line for liberating yourself from old family patterns and ancestral conditioning.",
            eastWest: "West brings the revolutionary urge directly into the domestic sphere — expect the unexpected at home. East carries this electric restlessness into local neighborhood life and short-range movement.",
            orbGuidance: "Moderate orbs (200–400 miles) are recommended for longer stays near Uranus IC — closest proximity can make it difficult to plant roots.",
        },
        ASC: {
            badge: "Electrifying Presence",
            description: "You carry a charge here — people see you as original, eccentric, and ahead of your time. Technical brilliance and inspirational ideas attract an exciting crowd. You may feel restless or hyperactivated; channel the electricity into creative or innovative output.",
            eastWest: "West of Uranus ASC gives the full personal electric effect — you embody the iconoclast. East internalizes the energy into a private restlessness and urge for intellectual freedom.",
            orbGuidance: "Within 200 miles the Uranian voltage is lit. Excellent for short, high-intensity creative or tech sprints — less ideal for slow, settled living.",
        },
        DSC: {
            badge: "Unexpected Meetings",
            description: "Your partnerships here are unusual, exciting, and potentially short-lived. You meet people who are radically different or unconventional. Relationships challenge your assumptions and keep you alert. Great for collaborative innovation; less stable for committed long-term bonds.",
            eastWest: "West of Uranus DSC brings lightning-bolt encounters in partnerships — thrilling but erratic. East channels this into unexpected working relationships and collaborations in tech, social change, or creative disruption.",
            orbGuidance: "Under 300 miles the partner-attraction pattern is notably surprising and novel. Wide orbs still bring occasional electric encounters but without the constant disruption.",
        },
    },
    Neptune: {
        MC: {
            badge: "Creativity & Dreams",
            description: "Neptune at the Midheaven dissolves the boundaries between your vocation and your spiritual life. Careers in art, film, music, healing, spirituality, or anything that transcends the material flourish. You're seen as an idealist or visionary. Be careful of illusion in professional reputation.",
            eastWest: "West of Neptune MC gives full visionary/artistic career expression — you're the dreamer on the public stage. East shifts toward 9th house mysticism — spiritual tourism, esoteric publishing, and philosophical idealism.",
            orbGuidance: "Even moderate orbs (300–500 miles) carry a dreamlike quality to the environment. Closest proximity (under 150 miles) can blur reality at the career level — use with clarity of intention.",
        },
        IC: {
            badge: "Spiritual Depth",
            description: "Home becomes a sanctuary of spiritual depth and creative solitude. You feel dissolving into the landscape — a mystic connection to the place. Private retreat, meditation, creative isolation, and ancestral healing all work beautifully here. Prone to escapism if unconscious.",
            eastWest: "West floods the domestic sphere with Neptunian sensitivity — a beautiful but potentially boundary-less home life. East brings gentle spiritual ease to local community life and daily movement.",
            orbGuidance: "Neptune IC works powerfully at even large orbs (400+ miles) — the spiritual undercurrent of a location is felt even from a distance. Closest proximity intensifies the otherworldly pull.",
        },
        ASC: {
            badge: "Mystical Aura",
            description: "Others see you as ethereal, mysterious, and otherworldly here. Psychic sensitivity is heightened and you may be more empathic than usual. Creative and spiritual work flows. Be grounded — Neptune on the Ascendant can blur identity boundaries and make you susceptible to others' projections.",
            eastWest: "West of Neptune ASC fully dissolves your outer persona into mystical projection — you become the mirror for others. East turns this inward, heightening private spiritual intuition and sensitivity.",
            orbGuidance: "Within 200 miles the Neptunian atmosphere is unmistakable — a dreamlike quality to interactions and heightened artistic inspiration. Grounding practices are recommended.",
        },
        DSC: {
            badge: "Soul Connections",
            description: "Deeply karmic and spiritual partnerships are made here. You attract soulmates, spiritual teachers, or artists. Relationships carry a transcendent quality — but also potential confusion, idealization, or codependency. Enter consciously; the bonds formed here are rarely casual.",
            eastWest: "West of Neptune DSC draws soulmate and spiritual partnership encounters of real depth — often fated. East brings gentle spiritual collaboration in working relationships and creative partnerships.",
            orbGuidance: "Under 300 miles the partnership encounters carry a clear mystical quality. Wide orbs create a background of idealized social dynamics without the full dissolution of boundaries.",
        },
    },
    Pluto: {
        MC: {
            badge: "Transformation",
            description: "Pluto at the Midheaven is one of the most intense career lines. Your vocation enters a zone of deep transformation — power dynamics, psychological depth, and radical reinvention. You may wield significant influence or face major power struggles. Nothing about your career here is surface-level.",
            eastWest: "West of Pluto MC brings full Scorpionic power to your career — intense authority, transformative leadership, and possible confrontation with power structures. East channels this into 9th house psychological depth — transformative philosophy, occult study, or radical academic work.",
            orbGuidance: "Under 200 miles Pluto MC is a serious energetic commitment — best for intentional transformation rather than casual visits. Moderate orbs (300–500 miles) give the depth without the all-consuming intensity.",
        },
        IC: {
            badge: "Deep Rebirth",
            description: "The underworld surfaces at home. Deep ancestral, karmic, and psychological material comes up for transformation here. This line is powerful for shadow work, therapeutic retreats, and confronting the hidden past. Not light — but among the most powerfully healing lines available.",
            eastWest: "West brings the full Plutonian depth to the foundation — ancestral purging, soul-level healing, and transformative domestic environments. East channels the transformation into psychological restlessness in the local environment.",
            orbGuidance: "Even moderate orbs (200–400 miles) carry Pluto IC's transformative undertow. Best suited to those doing intentional inner work rather than leisure travel.",
        },
        ASC: {
            badge: "Power & Intensity",
            description: "You carry magnetic authority here — others sense your depth and presence without knowing why. You appear intense, powerful, and psychologically penetrating. This line attracts and repels in equal measure. Extraordinary leadership potential, but be conscious of power dynamics and control.",
            eastWest: "West of Pluto ASC means others experience your full Plutonian power directly. East internalizes this — driving deep personal transformation and psychological self-examination rather than outward intensity.",
            orbGuidance: "Within 150–200 miles the intensity is felt by everyone around you. Good for short transformative visits; very sustained proximity can feel depleting without conscious integration.",
        },
        DSC: {
            badge: "Transformative Bonds",
            description: "The partnerships formed here are anything but shallow — they fundamentally change you. Power dynamics in relationships are amplified. You may attract intense, complex, or transformative partners. Psychological depth in relationships is unavoidable here; approach with self-awareness.",
            eastWest: "West of Pluto DSC draws intense, transformative, sometimes power-charged partnerships. East tilts toward deep psychological working relationships and healing collaborations.",
            orbGuidance: "Under 300 miles the relationship intensity is notable — profound connections but also the possibility of control dynamics. Wide orbs soften this into meaningful depth without the volatility.",
        },
    },
};

export const PLANET_COLORS: Record<string, string> = {
    Sun: "var(--color-planet-sun)",
    Moon: "var(--color-planet-moon)",
    Mercury: "var(--color-planet-mercury)",
    Venus: "var(--color-planet-venus)",
    Mars: "var(--color-planet-mars)",
    Jupiter: "var(--color-planet-jupiter)",
    Saturn: "var(--color-planet-saturn)",
    Uranus: "var(--color-planet-uranus)",
    Neptune: "var(--color-planet-neptune)",
    Pluto: "var(--color-planet-pluto)",
    Ascendant: "var(--color-planet-sun)",
    MC: "var(--color-planet-sun)",
    IC: "var(--color-planet-moon)",
    DSC: "var(--color-planet-moon)",
    DC: "var(--color-planet-moon)",
    "North Node": "var(--color-planet-mercury)",
    "South Node": "var(--color-planet-venus)",
    Chiron: "var(--color-planet-jupiter)",
};

// Zodiac sign from birth date (simplified — no ephemeris needed for sun sign)
const SIGNS = [
    { name: "Capricorn", emoji: "♑", start: [1, 1], end: [1, 19] },
    { name: "Aquarius", emoji: "♒", start: [1, 20], end: [2, 18] },
    { name: "Pisces", emoji: "♓", start: [2, 19], end: [3, 20] },
    { name: "Aries", emoji: "♈", start: [3, 21], end: [4, 19] },
    { name: "Taurus", emoji: "♉", start: [4, 20], end: [5, 20] },
    { name: "Gemini", emoji: "♊", start: [5, 21], end: [6, 20] },
    { name: "Cancer", emoji: "♋", start: [6, 21], end: [7, 22] },
    { name: "Leo", emoji: "♌", start: [7, 23], end: [8, 22] },
    { name: "Virgo", emoji: "♍", start: [8, 23], end: [9, 22] },
    { name: "Libra", emoji: "♎", start: [9, 23], end: [10, 22] },
    { name: "Scorpio", emoji: "♏", start: [10, 23], end: [11, 21] },
    { name: "Sagittarius", emoji: "♐", start: [11, 22], end: [12, 21] },
    { name: "Capricorn", emoji: "♑", start: [12, 22], end: [12, 31] },
];

export function getSunSign(month: number, day: number): { name: string; emoji: string } | null {
    for (const sign of SIGNS) {
        const [sm, sd] = sign.start;
        const [em, ed] = sign.end;
        if (
            (month === sm && day >= sd) ||
            (month === em && day <= ed)
        ) {
            return { name: sign.name, emoji: sign.emoji };
        }
    }
    return null;
}

export function getDistanceRanking(distanceKm: number): string {
    const miles = distanceKm / 1.60934;
    if (miles <= 150) return "Intense Influence";
    if (miles <= 300) return "Strong Influence";
    if (miles <= 500) return "Moderate Influence";
    return "Background Influence";
}

/**
 * Returns a label matching the guide's orb-of-influence framework.
 * Intense: < 150 miles — hard to ignore, most power
 * Strong: 150–300 miles — clearly felt
 * Moderate: 300–500 miles — background presence
 * Negligible: > 500 miles — only noticeable for outer planets
 */
export function getOrbStrengthLabel(distanceKm: number): string {
    const miles = distanceKm / 1.60934;
    if (miles <= 150) return "Intense (< 150 mi)";
    if (miles <= 300) return "Strong (150–300 mi)";
    if (miles <= 500) return "Moderate (300–500 mi)";
    return "Background (> 500 mi)";
}

export function getOrbStrengthColor(distanceKm: number): string {
    const miles = distanceKm / 1.60934;
    if (miles <= 150) return "#e85d4a";   // red — intense
    if (miles <= 300) return "#f5a623";   // amber — strong
    if (miles <= 500) return "#7ecbf5";   // blue — moderate
    return "#5a6070";                      // muted — background
}

export function getOrbStrengthWidth(distanceKm: number): number {
    const miles = distanceKm / 1.60934;
    if (miles <= 150) return 100;
    if (miles <= 300) return 70;
    if (miles <= 500) return 40;
    return 15;
}


/**
 * Full mock ACG dataset — 10 planets × 4 angles = 40 lines.
 * Longitudes are spread to simulate a real natal chart born at ~35°N, 139°E (Tokyo area),
 * with planets distributed realistically across the ecliptic.
 *
 * Convention:  longitude 0–360° = Greenwich 0° + offset east.
 * MC line lon = RAMC − planet RA ≈ birth_lon + planet_lon_offset (simplified).
 */
export const MOCK_PLANET_LINES = [
    // Sun  — ecliptic ~355° (Pisces)
    { planet: "Sun", angle: "MC",  longitude: -25,  distance_km: 521,  orb: 4,  is_paran: false, meaning: PLANET_MEANINGS.Sun.MC  },
    { planet: "Sun", angle: "IC",  longitude: 155,  distance_km: 521,  orb: 4,  is_paran: false, meaning: PLANET_MEANINGS.Sun.IC  },
    { planet: "Sun", angle: "ASC", longitude: -65,  distance_km: 900,  orb: 7,  is_paran: false, meaning: PLANET_MEANINGS.Sun.ASC },
    { planet: "Sun", angle: "DSC", longitude: 115,  distance_km: 900,  orb: 7,  is_paran: false, meaning: PLANET_MEANINGS.Sun.DSC },

    // Moon — fast-moving; ecliptic ~85° (Gemini)
    { planet: "Moon", angle: "MC",  longitude: 85,   distance_km: 789,  orb: 6,  is_paran: false, meaning: PLANET_MEANINGS.Moon.MC  },
    { planet: "Moon", angle: "IC",  longitude: -95,  distance_km: 789,  orb: 6,  is_paran: false, meaning: PLANET_MEANINGS.Moon.IC  },
    { planet: "Moon", angle: "ASC", longitude: 45,   distance_km: 1200, orb: 9,  is_paran: false, meaning: PLANET_MEANINGS.Moon.ASC },
    { planet: "Moon", angle: "DSC", longitude: -135, distance_km: 1200, orb: 9,  is_paran: false, meaning: PLANET_MEANINGS.Moon.DSC },

    // Mercury — ecliptic ~350° (Pisces, near Sun)
    { planet: "Mercury", angle: "MC",  longitude: -30,  distance_km: 450,  orb: 3,  is_paran: false, meaning: PLANET_MEANINGS.Mercury.MC  },
    { planet: "Mercury", angle: "IC",  longitude: 150,  distance_km: 450,  orb: 3,  is_paran: false, meaning: PLANET_MEANINGS.Mercury.IC  },
    { planet: "Mercury", angle: "ASC", longitude: -70,  distance_km: 800,  orb: 6,  is_paran: false, meaning: PLANET_MEANINGS.Mercury.ASC },
    { planet: "Mercury", angle: "DSC", longitude: 110,  distance_km: 800,  orb: 6,  is_paran: false, meaning: PLANET_MEANINGS.Mercury.DSC },

    // Venus — ecliptic ~20° (Aries)
    { planet: "Venus", angle: "MC",  longitude: -5,   distance_km: 142,  orb: 1,  is_paran: false, meaning: PLANET_MEANINGS.Venus.MC  },
    { planet: "Venus", angle: "IC",  longitude: 175,  distance_km: 142,  orb: 1,  is_paran: false, meaning: PLANET_MEANINGS.Venus.IC  },
    { planet: "Venus", angle: "ASC", longitude: -45,  distance_km: 600,  orb: 5,  is_paran: false, meaning: PLANET_MEANINGS.Venus.ASC },
    { planet: "Venus", angle: "DSC", longitude: 135,  distance_km: 600,  orb: 5,  is_paran: false, meaning: PLANET_MEANINGS.Venus.DSC },

    // Mars — ecliptic ~105° (Cancer, retrograde)
    { planet: "Mars", angle: "MC",  longitude: 105,  distance_km: 1500, orb: 12, is_paran: false, meaning: PLANET_MEANINGS.Mars.MC  },
    { planet: "Mars", angle: "IC",  longitude: -75,  distance_km: 1500, orb: 12, is_paran: false, meaning: PLANET_MEANINGS.Mars.IC  },
    { planet: "Mars", angle: "ASC", longitude: 65,   distance_km: 1800, orb: 14, is_paran: false, meaning: PLANET_MEANINGS.Mars.ASC },
    { planet: "Mars", angle: "DSC", longitude: -115, distance_km: 1800, orb: 14, is_paran: false, meaning: PLANET_MEANINGS.Mars.DSC },

    // Jupiter — ecliptic ~75° (Gemini)
    { planet: "Jupiter", angle: "MC",  longitude: 75,   distance_km: 920,  orb: 7,  is_paran: false, meaning: PLANET_MEANINGS.Jupiter.MC  },
    { planet: "Jupiter", angle: "IC",  longitude: -105, distance_km: 920,  orb: 7,  is_paran: false, meaning: PLANET_MEANINGS.Jupiter.IC  },
    { planet: "Jupiter", angle: "ASC", longitude: 35,   distance_km: 387,  orb: 3,  is_paran: false, meaning: PLANET_MEANINGS.Jupiter.ASC },
    { planet: "Jupiter", angle: "DSC", longitude: -145, distance_km: 1300, orb: 10, is_paran: false, meaning: PLANET_MEANINGS.Jupiter.DSC },

    // Saturn — ecliptic ~350° (Pisces)
    { planet: "Saturn", angle: "MC",  longitude: -35,  distance_km: 1600, orb: 13, is_paran: false, meaning: PLANET_MEANINGS.Saturn.MC  },
    { planet: "Saturn", angle: "IC",  longitude: 145,  distance_km: 1600, orb: 13, is_paran: false, meaning: PLANET_MEANINGS.Saturn.IC  },
    { planet: "Saturn", angle: "ASC", longitude: -80,  distance_km: 1100, orb: 9,  is_paran: false, meaning: PLANET_MEANINGS.Saturn.ASC },
    { planet: "Saturn", angle: "DSC", longitude: 100,  distance_km: 1204, orb: 10, is_paran: false, meaning: PLANET_MEANINGS.Saturn.DSC },

    // Uranus — ecliptic ~55° (Taurus)
    { planet: "Uranus", angle: "MC",  longitude: 55,   distance_km: 2200, orb: 18, is_paran: false, meaning: PLANET_MEANINGS.Uranus.MC  },
    { planet: "Uranus", angle: "IC",  longitude: -125, distance_km: 2200, orb: 18, is_paran: false, meaning: PLANET_MEANINGS.Uranus.IC  },
    { planet: "Uranus", angle: "ASC", longitude: 15,   distance_km: 2500, orb: 20, is_paran: false, meaning: PLANET_MEANINGS.Uranus.ASC },
    { planet: "Uranus", angle: "DSC", longitude: -165, distance_km: 2500, orb: 20, is_paran: false, meaning: PLANET_MEANINGS.Uranus.DSC },

    // Neptune — ecliptic ~10° (Aries)
    { planet: "Neptune", angle: "MC",  longitude: 10,   distance_km: 1900, orb: 15, is_paran: false, meaning: PLANET_MEANINGS.Neptune.MC  },
    { planet: "Neptune", angle: "IC",  longitude: -170, distance_km: 1900, orb: 15, is_paran: false, meaning: PLANET_MEANINGS.Neptune.IC  },
    { planet: "Neptune", angle: "ASC", longitude: -30,  distance_km: 1600, orb: 13, is_paran: false, meaning: PLANET_MEANINGS.Neptune.ASC },
    { planet: "Neptune", angle: "DSC", longitude: 150,  distance_km: 1600, orb: 13, is_paran: false, meaning: PLANET_MEANINGS.Neptune.DSC },

    // Pluto — ecliptic ~310° (Aquarius)
    { planet: "Pluto", angle: "MC",  longitude: -50,  distance_km: 3100, orb: 25, is_paran: false, meaning: PLANET_MEANINGS.Pluto.MC  },
    { planet: "Pluto", angle: "IC",  longitude: 130,  distance_km: 3100, orb: 25, is_paran: false, meaning: PLANET_MEANINGS.Pluto.IC  },
    { planet: "Pluto", angle: "ASC", longitude: -95,  distance_km: 2800, orb: 22, is_paran: false, meaning: PLANET_MEANINGS.Pluto.ASC },
    { planet: "Pluto", angle: "DSC", longitude: 85,   distance_km: 2800, orb: 22, is_paran: false, meaning: PLANET_MEANINGS.Pluto.DSC },

    // Paran examples
    { planet: "Venus-Jupiter", angle: "Paran", latitude: 35,   distance_km: 10, orb: 0, is_paran: true, meaning: { badge: "Abundance & Love", description: "Venus and Jupiter cross at this latitude — one of the most fortunate paran combinations. Social magnetism and fortunate partnerships converge.", eastWest: "", orbGuidance: "Parans operate within 75 miles north/south of the crossing latitude." } },
    { planet: "Saturn-Mars",   angle: "Paran", latitude: -15,  distance_km: 10, orb: 0, is_paran: true, meaning: { badge: "Challenging Karma", description: "Mars and Saturn cross at this latitude — discipline under pressure. Requires patience and structured effort.", eastWest: "", orbGuidance: "Parans operate within 75 miles north/south of the crossing latitude." } },
];


export const MOCK_TRANSITS = [
    { planets: "Venus △ natal Jupiter", type: "Trine", aspect: "trine", system: "natal", orb: 1 },
    { planets: "Mars □ geodetic Saturn", type: "Square", aspect: "square", system: "geodetic", orb: 2 },
    { planets: "Sun ☌ natal Mercury", type: "Conjunction", aspect: "conjunction", system: "natal", orb: 0.5 },
    { planets: "Moon ⚹ geodetic Venus", type: "Sextile", aspect: "sextile", system: "geodetic", orb: 4 },
];

export const MOCK_HOROSCOPE = `Your **Venus MC line** runs 142km from this destination — close enough to feel it. Venus on the Midheaven means this is a place where you're seen, appreciated, and where social connections happen naturally. Good city for creative work and meeting people.

**Jupiter on your Ascendant** adds genuine expansion energy. This isn't just luck — it's your chart saying this location amplifies your sense of possibility. Opportunities here feel organic, not forced.

**One thing to watch**: Mars squaring your natal Saturn at the time of travel means energy can run hot then cold. Don't overschedule the first few days. Leave room for unstructured time — that's where this trip delivers.

Arrival day has Moon sextile natal Venus — emotionally you'll feel settled quickly. Trust your instincts about neighborhoods and people. Your read on this city will be sharp from day one.

**Summary**: Venus-Jupiter signature. Strong for relationships, aesthetics, and anything involving being visible. Saturn square asks for pacing. Plan accordingly.`;

export interface TravelWindow {
    month: string;
    quality: "excellent" | "good" | "caution" | "avoid";
    score: number;
    reason: string;
    house: string;
}

// Pattern that cycles through 12 months of transit quality & reasons
const WINDOW_PATTERNS: Array<Omit<TravelWindow, "month">> = [
    { quality: "excellent", score: 85, reason: "Venus trine natal Jupiter — social expansion", house: "9th House (Travel)" },
    { quality: "good",      score: 70, reason: "Sun sextile natal Venus — pleasant, low-friction", house: "9th House (Travel)" },
    { quality: "caution",   score: 55, reason: "Mars square natal Saturn — low energy, delays", house: "6th House (Health)" },
    { quality: "good",      score: 70, reason: "Mercury trine natal Mercury — clear communication", house: "3rd House (Learning)" },
    { quality: "excellent", score: 85, reason: "Jupiter conjunct natal MC — career visibility abroad", house: "10th House (Career)" },
    { quality: "good",      score: 70, reason: "Venus sextile natal Moon — emotional ease", house: "4th House (Home)" },
    { quality: "caution",   score: 55, reason: "Saturn opposite natal Sun — heavy, restrictive", house: "7th House (Relationships)" },
    { quality: "good",      score: 70, reason: "Sun trine natal Jupiter — expansive mood", house: "9th House (Travel)" },
    { quality: "excellent", score: 85, reason: "Venus conjunct natal Venus return — peak harmony", house: "5th House (Pleasure)" },
    { quality: "good",      score: 70, reason: "Mercury sextile natal Sun — mental clarity", house: "3rd House (Learning)" },
    { quality: "caution",   score: 55, reason: "Mars opposition natal Moon — emotional friction", house: "1st House (Self)" },
    { quality: "excellent", score: 85, reason: "Jupiter trine natal Sun — best window of the year", house: "9th House (Travel)" },
];

/**
 * Generate 12 travel windows starting from any given date string (YYYY-MM-DD).
 * Each window maps to a successive calendar month (Mar 2026, Apr 2026, etc.).
 * Defaults to current month if no date given.
 */
export function generateTravelWindows(startDateStr?: string): TravelWindow[] {
    const start = startDateStr ? new Date(startDateStr + "T12:00:00") : new Date();
    // Normalise to first of the month to avoid DST edge cases
    const baseYear = start.getFullYear();
    const baseMonth = start.getMonth(); // 0-indexed
    return WINDOW_PATTERNS.map((pattern, i) => {
        // Explicit date construction so months always tick forward correctly
        const d = new Date(baseYear, baseMonth + i, 1);
        const month = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        return { month, ...pattern };
    });
}

/**
 * Derive 12 monthly travel windows from real transit major_aspects data.
 * Groups aspects by calendar month, scores each month numerically, maps to quality.
 * Falls back to generateTravelWindows() if insufficient real data.
 */
export function generateWindowsFromTransits(
    aspects: Array<{
        date?: string;
        transit_planet?: string;
        natal_planet?: string;
        aspect?: string;
        orb?: number;
        p1?: string;
        p2?: string;
    }>,
    startDateStr?: string,
): TravelWindow[] {
    const BENEFIC = ["venus", "jupiter", "sun"];
    const MALEFIC = ["mars", "saturn", "pluto", "uranus"];
    const HARD_ASPECTS = ["square", "opposition", "□", "☍"];
    const SOFT_ASPECTS = ["trine", "sextile", "△", "⚹", "conjunction"];
    const HOUSE_MAP: Record<string, string> = {
        sun: "5th House (Creative Expression)", moon: "4th House (Emotional Security)",
        mercury: "3rd House (Communication)", venus: "7th House (Relationships)",
        mars: "1st House (Vitality)", jupiter: "9th House (Travel & Philosophy)",
        saturn: "10th House (Career)", uranus: "11th House (Innovation)",
        neptune: "12th House (Spirituality)", pluto: "8th House (Transformation)",
    };

    // Group aspect scores by month string
    const monthScores: Record<string, { score: number; reasons: string[]; planets: string[] }> = {};

    for (const a of aspects) {
        if (!a.date) continue;
        const d = new Date(a.date);
        if (isNaN(d.getTime())) continue;
        const monthKey = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

        const transitPlanet = (a.transit_planet || a.p1 || "").toLowerCase();
        const natalPlanet   = (a.natal_planet  || a.p2 || "").toLowerCase();
        const aspectStr     = (a.aspect || "").toLowerCase();
        const orb           = a.orb ?? 3;

        if (!monthScores[monthKey]) monthScores[monthKey] = { score: 50, reasons: [], planets: [] };

        const isBenefic = BENEFIC.some(b => transitPlanet.includes(b));
        const isMalefic = MALEFIC.some(m => transitPlanet.includes(m));
        const isHard    = HARD_ASPECTS.some(h => aspectStr.includes(h));
        const isSoft    = SOFT_ASPECTS.some(s => aspectStr.includes(s));
        const orbW      = orb <= 1 ? 2 : orb <= 3 ? 1.5 : 1;

        if (isHard && isMalefic)    monthScores[monthKey].score -= Math.round(15 * orbW);
        else if (isHard)            monthScores[monthKey].score -= Math.round(8 * orbW);
        else if (isSoft && isBenefic) monthScores[monthKey].score += Math.round(12 * orbW);
        else if (isSoft)            monthScores[monthKey].score += Math.round(6 * orbW);

        const rLabel = `${a.transit_planet || a.p1} ${a.aspect} natal ${a.natal_planet || a.p2}`;
        monthScores[monthKey].reasons.push(rLabel);
        monthScores[monthKey].planets.push(transitPlanet);
    }

    // If we have fewer than 3 months of real data, fall back to static pattern
    if (Object.keys(monthScores).length < 3) {
        return generateTravelWindows(startDateStr);
    }

    // Build 12 months from startDate, using real scores where we have them
    const start = startDateStr ? new Date(startDateStr + "T12:00:00") : new Date();
    const baseYear = start.getFullYear();
    const baseMonth = start.getMonth();

    return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(baseYear, baseMonth + i, 1);
        const month = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        const data = monthScores[month];

        let quality: TravelWindow["quality"];
        let reason: string;
        let house: string;
        let score: number;
        let pScore: number;
        let cScore: number;

        if (data) {
            score = Math.max(0, Math.min(100, data.score));
            pScore = Math.round(score * 0.7);
            cScore = score - pScore;
            quality = score >= 65 ? "excellent" : score >= 45 ? "good" : "caution";
            reason  = data.reasons[0] || "mixed transits";
            const mainPlanet = data.planets[0] || "";
            house   = HOUSE_MAP[mainPlanet] || "9th House (Travel)";
        } else {
            // No data for this month — use static pattern slot
            const slot = WINDOW_PATTERNS[i % 12];
            quality = slot.quality;
            score   = slot.score;
            reason  = slot.reason;
            house   = slot.house;
        }

        return { month, quality, score, reason, house };
    });
}

/**
 * Static default — call as a function so it always returns current-month-relative windows.
 * Stored as a function call at import time only for initial render; the flow page
 * always calls generateTravelWindows(travelDate) for real data.
 */
export const MOCK_12_MONTH_WINDOWS: TravelWindow[] = generateTravelWindows();
