/** Default geodetic marketing layout using universal block types.
 *  Note: geoMapSection, geoMundaneCycles, geoCaseStudiesEmbed remain as
 *  custom block types — they are rendered via customRenderers in MarketingPageView. */
export const geodeticFallbackBlocksUniversal = [
  {
    blockType: "heroSection",
    kicker: "Geodetic & Mundane Astrology",
    titleAccent: "The world",
    titleHtml:
      'Where the <em class="italic text-[var(--color-y2k-blue)] font-light">Sky</em><br/>Meets the Earth',
    subtitle: `Most people know astrology as something personal — your chart, your planets, your life. But there is a whole other branch of the tradition that looks outward: at countries, cities, and the cycles shaping the world around us. <strong class="font-medium text-[var(--text-primary)]">Geodetic astrology</strong> maps the zodiac directly onto the globe. <strong class="font-medium text-[var(--text-primary)]">Mundane astrology</strong> tracks the planetary cycles that move through history.`,
    body2: "The sky isn't just above you — it is mapped onto the earth beneath you. Geodetic astrology reveals the archetypal character of locations and how shifting mundane cycles activate territories across history.",
    primaryCta: { label: "Book a Geodetic Reading →", href: "#" },
    secondaryCta: { label: "Explore the Course", href: "#" },
    footnote: "Analytical, evidence-led practice — not prediction theatre.",
    layout: "text-only",
    decorativeElement: "orbital-grid",
    kickerColor: "y2k-blue",
    ctaStyle: "square",
  },
  {
    blockType: "tickerMarquee",
    durationSec: 32,
    items: [
      { text: "Geodetic Astrology" },
      { text: "Mundane Cycles" },
      { text: "Sepharial's World Map" },
      { text: "Saturn–Jupiter Conjunctions" },
      { text: "Eclipse Paths" },
      { text: "World Points" },
      { text: "Geodetic Equivalents" },
      { text: "National Horoscopes" },
    ],
  },
  {
    blockType: "splitContent",
    layout: "two-column-text",
    heading: "What is Geodetic Astrology?",
    sectionLabel: "01 — The Basics",
    leftCol: {
      title: "A zodiac fixed to the globe",
      body: `<p>The Victorian astrologer <strong class="font-medium text-[var(--text-primary)]">Sepharial</strong> (Walter Gorn Old, 1864–1929) proposed a deceptively simple idea: anchor 0° Aries permanently to the Greenwich Meridian, and let each degree of the zodiac correspond to one degree of longitude around the earth.</p>
<p>The result is a <strong class="font-medium text-[var(--text-primary)]">fixed planetary map of the world</strong>. Every city and country gets its own zodiac sign on the Midheaven and Ascendant — determined purely by geography, not by anyone's birth time. These are called a location's <strong class="font-medium text-[var(--text-primary)]">geodetic angles</strong>.</p>
<p>When slow-moving planets transit a city's geodetic angles, <strong class="font-medium text-[var(--text-primary)]">the collective experience of that place tends to shift</strong> in ways that mirror the planet's archetype. Pluto crossing a country's geodetic Midheaven has historically correlated with governance upheaval. Saturn with austerity or constraint. Jupiter with growth and expansion.</p>`,
    },
    rightCol: {
      title: "How your chart connects",
      body: `<p>Your natal planets each have a <strong class="font-medium text-[var(--text-primary)]">geodetic equivalent</strong> — a longitude on earth where that planet resonates in the fixed geodetic system. These are places where you are likely to feel that planet's energy more strongly, simply because your chart aligns with the ground beneath your feet.</p>
<p>A natal Venus at 15° Taurus, for example, sits at roughly <strong class="font-medium text-[var(--text-primary)]">45° East longitude</strong> — a line running through East Africa, the Arabian Peninsula, and into Russia. People with strong Venus placements often describe feeling unusually creative or relationally activated near these longitudes.</p>
<p>Unlike astrocartography (which shifts with your birth chart), geodetic equivalents are a <strong class="font-medium text-[var(--text-primary)]">collective, earth-level resonance</strong> — a meeting point between your personal chart and the world's inherent geography.</p>`,
    },
  },
  // Custom block — rendered by customRenderers
  {
    blockType: "geoMapSection",
    heading: "The Sepharial Geodetic Map",
    sectionLabel: "02 — The Map",
    intro:
      "Each band below shows which zodiac sign rules that longitude — and therefore which cities and regions carry that sign's collective signature. Hover a band to see the sign, its ruling planet, and key cities within it.",
  },
  {
    blockType: "cardGrid",
    heading: "How It Works — The Core Ideas",
    countLabel: "03 — Techniques",
    columns: "3",
    variant: "numbered",
    cards: [
      {
        num: "01",
        title: "Geodetic Angles",
        desc: `Every city has a fixed zodiac sign on its Midheaven and Ascendant — determined by latitude and longitude alone. These are its inherent "character". When outer planets transit these points, collective events tend to unfold that mirror the planet's archetype.`,
        bgToken: "charcoal",
        textToken: "eggshell",
        glyph: "MC",
      },
      {
        num: "02",
        title: "Your Geodetic Equivalents",
        desc: `Each of your natal planets maps to a longitude on earth. These are locations where you resonate with that planet at a collective level — not just personally. Venus equivalents for creative richness; Saturn for discipline; Pluto for deep transformation.`,
        bgToken: "raised",
        textToken: "primary",
        glyph: "♀",
      },
      {
        num: "03",
        title: "Mundane Cycles",
        desc: `Mundane astrology tracks slow outer-planet cycles that shape collective history — Saturn–Jupiter conjunctions (~20 yrs), Saturn–Pluto (~35 yrs), and Pluto's sign ingresses. Layered onto geodetics, they reveal <em class="italic">when</em> a location is most activated.`,
        bgToken: "y2k-blue",
        textToken: "eggshell",
        glyph: "♄",
      },
    ],
  },
  // Custom blocks — rendered by customRenderers
  {
    blockType: "geoMundaneCycles",
    heading: "The Mundane Cycles Active Now",
    sectionLabel: "04 — Current Sky",
    bannerKicker: "Mundane Astrology",
    bannerTitleAccent: "The world",
    bannerTitle: 'Big cycles,<br/><em class="italic font-light">collective shifts</em>',
    bannerBody:
      "Mundane astrology is the astrology of nations and collective experience. It doesn't predict specific events — it identifies archetypal pressures and timing windows. These are the major cycles active right now.",
    cycles: [
      { sym: "♇", title: "Pluto in Aquarius (2024–2044)", desc: "The restructuring of networks, institutions, and collective power — once per ~248 years." },
      { sym: "♆", title: "Neptune into Aries (from 2025)", desc: "The dissolution of old identities; new mythologies emerge. Idealism meets the pioneer impulse." },
      { sym: "♄♆", title: "Saturn–Neptune conjunction (2025–26)", desc: "Reality vs. illusion; structural dissolution; the material limits of dreams meet reality — and vice versa." },
      { sym: "♃♄", title: "Jupiter–Saturn cycle (~20 yrs)", desc: 'The classic "chronocrator" — correlates with political leadership changes and economic paradigm shifts.' },
    ],
    researchNotes: [
      { loc: "SE Asia", desc: "Singapore's geodetic MC (♋ Cancer) activated by Neptune transit — themes of home, belonging, institutional identity" },
      { loc: "Europe", desc: "Pluto transiting ♈ Aries geodetic zones across UK/West Africa longitude band — power restructuring in post-colonial frameworks" },
      { loc: "Americas", desc: "Saturn–Neptune in ♈/♓ signs — Washington D.C.'s geodetic angles under pressure from dissolution cycles" },
    ],
    researchCtaLabel: "Read the Research Notes →",
    researchCtaHref: "#",
  },
  { blockType: "geoCaseStudiesEmbed" },
  {
    blockType: "ctaBand",
    layout: "cta-cards",
    kicker: "Ready to explore yours",
    headingHtml:
      'Your chart,<br/>your location,<br/><em class="italic text-[var(--color-spiced-life)] font-light">your geodetic map.</em>',
    body: "A geodetic reading maps your natal planets onto the globe, identifies the key longitudinal resonances in your chart, and layers in current mundane cycles. It's a grounded, analytical lens on where you are — and where you might want to be.",
    primaryCard: {
      kicker: "Most requested",
      titleHtml: 'ACG Deep Dive<br/><span class="font-normal opacity-80 text-[1.1rem]">includes geodetic overlay</span>',
      href: "#",
    },
    secondaryCards: [
      { kicker: "Self-study", titleHtml: "Geodetic & Mundane<br/>Intensive Course", href: "#" },
      { kicker: "Free", titleHtml: "Research Notes<br/>ongoing cycle analysis", href: "#" },
    ],
  },
] as const;
