/** Default homepage layout using universal block types. */
export const homeFallbackBlocksUniversal = [
  {
    blockType: "heroSection",
    kicker: "Astrocartography & Travel Astrology · Singapore",
    titleAccent: "Your chart",
    titleHtml:
      'Where In <em class="italic font-medium text-[var(--color-y2k-blue)]">The World</em><br/>Is Your Map<br/>Calling You?',
    subtitle:
      "Astrocartography, geodetic forecasting & travel electional astrology — read by a practitioner who takes both the stars and the evidence seriously.",
    primaryCta: { label: "Read My Map →", href: "/flow" },
    secondaryCta: { label: "View Services", href: "#services" },
    heroImage: "/astronat-hero.jpg",
    badge: { kicker: "Currently Exploring", title: "Europe & the Mediterranean" },
    saturnGlyph: "/avatar/saturn-o.svg",
    layout: "image-right",
    decorativeElement: "orbital-grid",
    kickerColor: "y2k-blue",
    ctaStyle: "square",
  },
  {
    blockType: "statsStrip",
    stats: [
      { n: "500+", label: "Charts Read" },
      { n: "12+", label: "Years Practising" },
      { n: "40+", label: "Countries Mapped" },
      { n: "CIA", label: "Affiliated Faculty" },
    ],
    columns: "4",
  },
  {
    blockType: "tickerMarquee",
    durationSec: 28,
    items: [
      { text: "Astrocartography" },
      { text: "Geodetic Forecasting" },
      { text: "Travel Electional" },
      { text: "Relocation Strategy" },
      { text: "Natal Chart" },
      { text: "B2B Corporate Intel" },
    ],
  },
  {
    blockType: "statementBand",
    kicker: "About the Practice",
    bodyHtml:
      'AstroNat is an editorial travel astrology practice for those who seek more than just a destination. It is for the <em class="italic font-semibold text-[var(--color-y2k-blue)]">traveller, the expat, and the CEO</em> who recognises that where we are is as important as when we are.',
    variant: "statement",
  },
  {
    blockType: "cardGrid",
    heading: "Readings & Services",
    countLabel: "04 offerings",
    columns: "4",
    variant: "numbered",
    cards: [
      {
        num: "01 —",
        title: "Personal Relocation Reading",
        desc: "A comprehensive 90-minute reading of your ACG map, local space lines, geodetic chart, and current transit overlays. Know exactly where to go — and why.",
        link: "https://calendly.com/astronat/60min-acg-reading",
        linkLabel: "Book a Session →",
        bgToken: "charcoal",
        textToken: "eggshell",
        glyph: "♈",
      },
      {
        num: "02 —",
        title: "Annual Travel Electional",
        desc: "The right day to depart, arrive, or sign contracts abroad changes everything. Precision timing meets cosmic timing — your travels, optimised by the chart.",
        link: "/map-from-home",
        linkLabel: "Learn More →",
        bgToken: "bg",
        textToken: "primary",
        glyph: "♎",
      },
      {
        num: "03 —",
        title: "B2B & VIP Intelligence",
        desc: "Strategic relocated intelligence for corporate expansion, global hiring, and high-frequency travel calendars. Data-driven celestial mapping for leaders.",
        link: "/b2b",
        linkLabel: "Explore →",
        bgToken: "y2k-blue",
        textToken: "eggshell",
        glyph: "☉",
      },
      {
        num: "04 —",
        title: "AstroNat Planner App",
        desc: "High-precision ACG maps and travel planning software in your pocket. Calculate lines, timing, and score destinations on the go with our proprietary engine.",
        link: "/app",
        linkLabel: "Get the App →",
        bgToken: "black",
        textToken: "eggshell",
        glyph: "♅",
      },
    ],
  },
  {
    blockType: "splitContent",
    layout: "standard",
    bgToken: "spiced",
    kicker: "Featured Workshop · May 2026",
    heading: "AstroNat Travel Astrology Intensive",
    headingHtml:
      '<span style="font-family:var(--font-display-alt-2);font-size:clamp(2rem,3vw,3rem);color:var(--color-charcoal);font-weight:400" class="block mb-2">The Course</span>AstroNat <em class="italic font-light">Travel Astrology</em> Intensive',
    body: "A 4-part deep dive into astrocartography, local space charts, geodetic frameworks, and how 2026's outer planet shifts shape your ideal destinations.",
    image: "/workshop-promo-1.jpg",
    imageSide: "right",
    metaItems: [
      { label: "Format", value: "4 Live Sessions" },
      { label: "Includes", value: "Workbook + Replay" },
      { label: "Launch", value: "19–20 May 2026" },
    ],
    primaryCta: { label: "Waitlist Now →", href: "/map-from-home" },
    priceBadge: { kicker: "Enrol\nNow", line1: "SGD", line2: "$297" },
  },
  {
    blockType: "splitContent",
    layout: "methodology",
    image: "/nat-2.jpg",
    monogram: "/avatar/saturn-monogram.svg",
    heading: "A Multi-Layer Methodology That Goes Deeper",
    intro:
      "Every reading integrates multiple techniques — traditional, modern, and heliocentric — so you receive a complete picture, not just one line on a map. I read charts the way I navigate: with precision, with evidence, and with genuine curiosity about where the sky wants you to be.",
    numberedItems: [
      { glyph: "☽", title: "ACG + Local Space Lines", desc: "Primary map and angular overlay analysis" },
      { glyph: "♄", title: "Geodetic Equivalents", desc: "Fixed earth-sign correspondence per location" },
      { glyph: "☉", title: "Solar Return Relocation", desc: "Annual chart cast for your destination city" },
      { glyph: "★", title: "Eclipse & Ingress Timing", desc: "Detonators overlaid on your personal map" },
      { glyph: "⊙", title: "Fixed Stars", desc: "Scheat, Antares, Regulus in geographic context" },
    ],
    primaryCta: { label: "Learn About the Method →", href: "/flow" },
  },
  {
    blockType: "testimonialGrid",
    heading: "Client Stories",
    subheading: "03 voices",
    items: [
      {
        quote:
          "\u201cThe level of technical detail was unlike anything I\u2019d experienced. Nat doesn\u2019t just tell you where to go \u2014 she explains the celestial mechanics behind it.\u201d",
        name: "Rebecca T.",
        location: "London, UK",
      },
      {
        quote:
          "\u201cMy relocation solar return reading was spot-on. Within the year, every theme she highlighted played out \u2014 in exactly the city she pointed to.\u201d",
        name: "Marcos D",
        location: "São Paulo, Brazil",
      },
      {
        quote:
          "\u201cThe Travel Astrology Intensive changed how I plan every trip. I\u2019m now obsessed with eclipse paths and I have absolutely zero regrets.\u201d",
        name: "Priya K",
        location: "Dubai, UAE",
      },
    ],
  },
  {
    blockType: "ctaBand",
    layout: "newsletter",
    accent: "Stay Cosmic",
    heading: "The AstroNat Dispatch",
    titleLine1: "The AstroNat",
    titleLine2: "Dispatch",
    newsletterBody:
      "Monthly mundane forecasts, travel astrology tips, and early access to new workshops. No spam — just clear signal from the sky.",
  },
] as const;
