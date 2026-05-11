export const B2B_STATS = [
  { n: '40+', label: 'Countries Mapped', bg: 'var(--bg-raised)' },
  { n: '700+', label: 'Clients Served', bg: 'var(--color-acqua)', color: '#111b2e' },
  { n: '32', label: 'Sectors Covered', bg: 'var(--color-y2k-blue)', color: '#fcfaf1' },
  { n: 'NDA', label: 'Full Confidentiality', bg: 'var(--color-spiced-life)', color: '#111b2e' }
];

export const B2B_PILLARS = [
  { 
    num: '01', 
    title: 'Location Intelligence', 
    desc: 'Every market has a geodetic signature — a fixed zodiacal frequency determined by its longitude on Earth. When that frequency harmonises with your incorporation chart, markets open, brands resonate, and revenue follows. When it conflicts, even brilliant products struggle against invisible structural resistance. We overlay your company\'s chart against the geodetic equivalent maps of target territories, identifying cities and countries where your Sun, Jupiter, Venus, and Midheaven lines land in positions of natural authority and reception.', 
    tag: 'Geodetic Equivalents · ACG Mapping · Territory Scoring', 
    bg: 'var(--bg-raised)', 
    text: 'var(--text-primary)' 
  },
  { 
    num: '02', 
    title: 'Market Timing', 
    desc: 'The same market, entered six months apart, can produce radically different outcomes. Planetary transits to your incorporation chart create windows of expansionary momentum — the difference between launching into a headwind and launching with a full planetary tailwind. We map Jupiter and Venus transits for growth amplification, identify Saturn ingresses that demand structural discipline, and flag eclipse activations on your chart angles. Launch dates, signing days, and partnership windows become precision instruments, not calendar guesses.', 
    tag: 'Planetary Transits · Eclipse Cycles · Ingress Windows', 
    bg: 'var(--color-charcoal)', 
    text: '#fcfaf1' 
  },
  { 
    num: '03', 
    title: 'Risk Mitigation', 
    desc: 'Not all markets that look attractive on paper are astrologically clear. Saturn lines through your key midpoints indicate structural friction — regulatory headwinds, partnership breakdowns, brand perception challenges. Mars-Pluto activations over geodetic meridians signal volatility and forced-change cycles that can turn a promising expansion into a crisis management exercise. We produce a red-flag report for every territory under consideration: what the chart shows, when the risk windows activate, and how to structure entry to route around the pressure points.', 
    tag: 'Saturn Lines · Mars-Pluto Corridors · Eclipse Red Flags', 
    bg: 'var(--color-acqua)', 
    text: '#111b2e' 
  },
  { 
    num: '04', 
    title: 'Team Relocation & Exec Placement', 
    desc: 'Where your key people live and work shapes their performance in ways conventional HR analytics cannot capture. An executive operating on their Jupiter line closes more deals, commands greater authority, and attracts opportunities organically. The same executive on their Saturn line may be capable — but chronically blocked. We map your leadership team\'s astrocartography alongside your company chart, identifying power line alignments between individual executives and your key territories — so your best people are deployed where their charts give them a structural advantage.', 
    tag: 'Executive ACG · Power Line Alignment · Team Deployment', 
    bg: 'var(--color-y2k-blue)', 
    text: '#fcfaf1' 
  }
];

export const B2B_PACKAGES = [
  {
    tier: 'Tier 01 — Entry',
    name: 'Market Reconnaissance',
    tagline: 'For founders entering their first international market',
    from: 'SGD 2,400',
    includes: [
      'Incorporation Chart Analysis — Full natal chart of your business entity',
      'Single-Market Geodetic Report — One target country, in full',
      '12-Month Transit Window — Optimal entry and avoidance periods',
      'Top 3 City Rankings — Within the target market',
      'Written Report + 60-min Debrief Call'
    ],
    glyph: '♑',
    primary: false
  },
  {
    tier: 'Tier 02 — Growth',
    name: 'Multi-Market Intelligence',
    tagline: 'For scaling companies evaluating 3–5 markets simultaneously',
    from: 'SGD 5,800',
    includes: [
      'Incorporation Chart Analysis — Full natal and relocated chart study',
      '3–5 Market Geodetic Reports — Comparative scoring across territories',
      '24-Month Transit Forecast — Eclipse and ingress cycle map',
      'Risk Flag Summary — Red-zone territories and timing alerts',
      '2 Executive Chart Reviews — Power line deployment assessment',
      'Full Report + 90-min Strategy Session',
      '30-Day Follow-Up Access — Email Q&A post-delivery'
    ],
    glyph: '♃',
    primary: true
  },
  {
    tier: 'Tier 03 — Enterprise',
    name: 'Full Spectrum Advisory',
    tagline: 'For enterprise clients requiring ongoing astrological intelligence',
    from: 'By Engagement',
    includes: [
      'All Tier 01 & 02 Deliverables',
      'Unlimited Market Coverage — Global territory scoring',
      'Full Leadership Team Mapping — Entire C-suite ACG review',
      'Quarterly Forecast Updates — Transit and eclipse briefings',
      'Retainer Advisory Access — Monthly strategy calls',
      'Board Presentation — Available on request',
      'Full NDA & Confidentiality Protocol'
    ],
    glyph: '♅',
    primary: false
  }
];

export const B2B_PROCESS_STEPS = [
  { n: '01', title: 'Secure Brief', body: 'Submit your incorporation details and strategic objectives under full NDA.' },
  { n: '02', title: 'Chart Construction', body: 'We build your company\'s natal chart, ACG map, and geodetic equivalent overlay.' },
  { n: '03', title: 'Territory Analysis', body: 'Each target market is scored across location resonance, transit windows, and risk flags.' },
  { n: '04', title: 'Intelligence Report', body: 'A structured written deliverable formatted for board presentation and executive review.' },
  { n: '05', title: 'Strategy Debrief', body: 'A live briefing session to walk through findings and map next strategic actions.' }
];
