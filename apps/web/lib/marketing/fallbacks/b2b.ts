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
    primaryCta: { label: "Request Briefing →", href: "/form" },
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
    bodyHtml: `I created <strong class="font-semibold text-[var(--text-primary)]">Cosmic Corporate Intelligence (CCI)</strong> for one main objective: to help businesses achieve their fullest potential with clear, measurable results using time-proven celestial wisdom.<br/><br/>Companies have too much riding on the line to be making wrong decisions without holistic information.<br/><br/><em class="italic font-medium text-[var(--color-y2k-blue)]">These decisions affect stakeholders, resources and markets on so many levels.</em><br/><br/>The outcomes can be costly and irreversible.<br/><br/>Your business has cosmic data encoded in its birth — and using that information to <em class="italic font-medium text-[var(--color-y2k-blue)]">preempt, mitigate and strategize</em> would help it reach its fullest potential at the right time.`,
    variant: "full-width",
  },
  {
    blockType: "cardGrid",
    kicker: "The AstroNat Framework",
    heading: "Four Intelligence CCI Pillars",
    headingHtml: `Four Intelligence CCI <br /><span class="text-[var(--color-y2k-blue)] font-secondary italic normal-case">Pillars</span>`,
    sidebarText:
      "Your incorporation chart is a living strategic document. Astrocartography and geodetic astrology decode which territories, timing windows, and team configurations align with the celestial blueprint of your business.\n\nEach pillar maps a distinct dimension of your company's cosmic footprint — from which cities carry your brand's natural authority, to which quarters carry setbacks, to where your best people will perform at their peak.",
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
    blockType: "splitContent",
    layout: "retainer-panel",
    bgToken: "acqua",
    kicker: "Engagement Options",
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
    primaryCta: { label: "Apply for Private Retainer", href: "/form" },
    rightPanel: {
      kicker: "Engagement",
      priceLine: "By Engagement",
      priceNote: "Minimum 3-month engagement · Annual rate available",
      limitNote: "Limited to 4 active retainer clients at any time",
      ctaLabel: "Apply for Private Retainer",
      ctaHref: "/form",
      testimonialQuote: "We delayed our Singapore office launch by six weeks based on Nat's transit analysis. The regulatory headwinds she flagged materialised precisely on schedule. We avoided them entirely.",
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
    bgToken: "y2k-blue",
    accent: "Ready?",
    headingHtml: `Your Company's Chart <br/> Is Already Telling You <br/> <span class="font-primary normal-case tracking-normal text-[#fcfaf1]">Where To Go.</span>`,
    body: "The question is whether you're listening. Let's read it together — and turn celestial intelligence into your most unconventional competitive advantage.",
    primaryCta: { label: "Request a Corporate Briefing", href: "/form" },
    decorativeElement: "rotating-svg",
  },
] as const;
