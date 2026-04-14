import { 
  B2B_PACKAGES, 
  B2B_PILLARS, 
  B2B_PROCESS_STEPS, 
  B2B_STATS 
} from "../data/b2b";


export const b2bFallbackBlocksUniversal = [
  {
    blockType: "heroSection",
    kicker: "Corporate Intelligence · B2B & VIP Services",
    titleAccent: "Cosmic Due Diligence",
    titleHtml:
      'The Stars Know<br/>Where Your <em class="italic font-medium text-[var(--color-y2k-blue)]">Business</em><br/>Belongs.',
    subtitle:
      "Your company's incorporation chart is the most overlooked strategic asset in your boardroom. Every territory you expand into, every executive you relocate — the timing and geography are already encoded in your founding data.",
    primaryCta: { label: "Request Briefing →", href: "#" },
    secondaryCta: { label: "View Packages", href: "#packages" },
    heroImage: "/nat-1.jpg",
    layout: "image-right",
    decorativeElement: "rotating-svg",
    kickerColor: "y2k-blue",
    ctaStyle: "square",
  },
  {
    blockType: "statsStrip",
    stats: B2B_STATS.map(({ n, label }) => ({ n, label })),
    columns: "4",
  },
  {
    blockType: "statementBand",
    kicker: "The Premise",
    bodyHtml: `Your incorporation chart is a living strategic document. Astrocartography and geodetic astrology decode <em class="italic font-semibold text-[var(--color-y2k-blue)]">which territories, timing windows, and team configurations</em> align with the celestial blueprint of your business.`,
    variant: "statement",
  },
  {
    blockType: "cardGrid",
    kicker: "The Framework",
    heading: "Four Intelligence Pillars",
    headingHtml: `Four Intelligence <br /><span class="text-[var(--color-y2k-blue)] font-secondary italic normal-case">Pillars</span>`,
    sidebarText:
      "Each pillar maps a distinct dimension of your company's cosmic footprint — from which cities carry your brand's natural authority, to which quarters carry structural tailwinds, to where your best people will perform at their peak.",
    columns: "2",
    variant: "numbered",
    cards: B2B_PILLARS.map((p) => ({
      num: p.num,
      title: p.title,
      desc: p.desc,
      tag: p.tag,
      bgToken:
        p.bg === "var(--bg-raised)"
          ? "raised"
          : p.bg === "var(--color-charcoal)"
            ? "charcoal"
            : p.bg === "var(--color-acqua)"
              ? "acqua"
              : "y2k-blue",
      textToken: p.text === "var(--text-primary)" ? "primary" : "eggshell",
    })),
  },
  {
    blockType: "cardGrid",
    kicker: "Engagement Options",
    heading: "Service Tiers",
    columns: "3",
    variant: "pricing",
    sectionBg: "raised",
    cards: B2B_PACKAGES.map((p) => ({
      title: p.name,
      desc: "",
      tier: p.tier,
      tagline: p.tagline,
      price: p.from,
      glyph: p.glyph,
      primary: p.primary,
      includes: p.includes.map((line: string) => ({ line })),
      ctaLabel: `Enquire About ${p.tier.split(" ")[1]}`,
      ctaHref: "#",
    })),
  },
  {
    blockType: "splitContent",
    layout: "retainer-panel",
    kicker: "VIP Access",
    headingHtml: `<span class="font-secondary italic normal-case text-3xl md:text-4xl text-[var(--color-spiced-life)] mb-2 block tracking-normal">Private Retainer</span>
                 The Inner <span class="font-secondary italic lowercase text-[var(--color-y2k-blue)]">Circle.</span>`,
    body: `<p>For founders, C-suite executives, and family offices who require astrological intelligence woven permanently into their strategic operating rhythm. This is not a one-time report — it is an <strong class="text-[var(--text-primary)] font-semibold">ongoing advisory relationship</strong> where cosmic intelligence becomes part of how you make decisions, year-round.</p>`,
    body2:
      "Retained clients receive direct access to Nat for time-sensitive queries — a board vote, an acquisition window, a key hire. Think of it as having a strategist on retainer who reads the market not just through economics, but through the sky above it.",
    features: [
      {
        icon: "moon",
        title: "Monthly Celestial Briefing",
        desc: "Upcoming planetary activations on your company and personal charts — framed as actionable strategic intelligence, not astrological jargon.",
      },
      {
        icon: "sun",
        title: "Real-Time Electional Support",
        desc: "Direct access to Nat for time-sensitive decisions: signing dates, launch windows, offer deadlines, travel itineraries.",
      },
      {
        icon: "alert",
        title: "Eclipse & Ingress Alerts",
        desc: "Advance notice of high-impact celestial events hitting your chart angles or geodetic meridians — with recommended response strategies.",
      },
      {
        icon: "compass",
        title: "Quarterly Deep-Dive Call",
        desc: "90-minute strategy session reviewing the prior quarter and mapping the next — business chart, personal chart, and geopolitical overlay.",
      },
      {
        icon: "file",
        title: "New Territory Assessments",
        desc: "Up to two new market evaluations per quarter, delivered as concise intelligence memos.",
      },
    ],
    primaryCta: { label: "Apply for Private Retainer", href: "#" },
    rightPanel: {
      kicker: "Investment",
      priceLine: "3,200",
      priceNote: "Minimum 6-month engagement · Annual rate available",
      limitNote: "Limited to 4 active retainer clients at any time",
      ctaLabel: "Apply for Private Retainer",
      ctaHref: "#",
      testimonialKicker: "Regional MD, Financial Services",
      testimonialMeta: "Southeast Asia · Retainer Client",
    },
  },
  {
    blockType: "processTimeline",
    kicker: "How It Works",
    headingHtml: `From Brief to <br /><span class="font-secondary italic lowercase text-[var(--color-y2k-blue)]">Intelligence</span>`,
    bgToken: "raised",
    steps: B2B_PROCESS_STEPS.map((s) => ({ n: s.n, title: s.title, body: s.body })),
  },
  {
    blockType: "statementBand",
    kicker: "Important Note",
    bodyHtml: `Astrocartography and geodetic astrology are <strong class="font-semibold text-[var(--text-primary)]">pattern-recognition and timing frameworks</strong>, not financial advice, investment counsel, or legal guidance. All corporate intelligence reports are provided for strategic reflection and decision-support purposes only. Clients retain full responsibility for their business decisions. <strong class="font-semibold text-[var(--text-primary)]">All client information is held in strict confidence under NDA.</strong>`,
    variant: "disclaimer",
  },
  {
    blockType: "ctaBand",
    layout: "centered",
    bgToken: "y2k-blue",
    accent: "Ready?",
    headingHtml: `Your Company's Chart <br/> Is Already Telling You <br/> <span class="font-primary normal-case tracking-normal text-[#fcfaf1]">Where To Go.</span>`,
    body: "The question is whether you're listening. Let's read it together — and turn celestial intelligence into your most unconventional competitive advantage.",
    primaryCta: { label: "Request a Corporate Briefing", href: "#" },
    secondaryCta: { label: "Download Service Overview", href: "#" },
    decorativeElement: "rotating-svg",
  },
] as const;
