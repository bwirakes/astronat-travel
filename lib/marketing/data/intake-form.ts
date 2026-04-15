/**
 * AstroNat Corporate Intelligence — Client Intake Form Config
 *
 * Edit labels, options, hints here. No code changes needed.
 */

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "radio"
  | "checkbox"
  | "date";

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: string[];
  hasOther?: boolean;
  columns?: 2 | 3 | 4;
  rows?: number;
}

export interface FormSection {
  id: string;
  kicker: string;
  heading: string;
  headingAccent: string; // word(s) rendered in italic secondary font
  fields: FormField[];
}

export const INTAKE_FORM_SECTIONS: FormSection[] = [
  // ─── 1. COMPANY & ENTITY ────────────────────────────────────────────────
  {
    id: "company",
    kicker: "About Your Business",
    heading: "Your Company &",
    headingAccent: "Entity",
    fields: [
      {
        id: "companyLegalName",
        label: "Full legal business name",
        type: "text",
        required: true,
        placeholder: "e.g. Acme Ventures Pte. Ltd.",
      },
      {
        id: "companyTradingName",
        label: "Trading name (if different)",
        type: "text",
        placeholder: "e.g. Acme Ventures",
      },
      {
        id: "incorporationCountry",
        label: "Country of incorporation",
        type: "text",
        required: true,
        placeholder: "e.g. Singapore",
      },
      {
        id: "incorporationCity",
        label: "City of incorporation",
        type: "text",
        required: true,
        placeholder: "e.g. Singapore",
      },
      {
        id: "incorporationDate",
        label: "Exact incorporation date",
        type: "text",
        required: true,
        hint: "Day / Month / Year",
        placeholder: "e.g. 14 March 2018",
      },
      {
        id: "incorporationTime",
        label: "Exact time of incorporation",
        type: "text",
        hint: "If known — from official documents. Approximate is fine.",
        placeholder: "e.g. 09:32 AM (or 'unknown')",
      },
      {
        id: "businessDescription",
        label: "What does your company do?",
        type: "textarea",
        required: true,
        hint: "A brief description of your business model and primary revenue source.",
        placeholder:
          "e.g. We operate a B2B SaaS platform for supply chain logistics across Southeast Asia...",
        rows: 4,
      },
      {
        id: "businessStage",
        label: "Business stage",
        type: "radio",
        required: true,
        columns: 2,
        options: [
          "Pre-revenue / Idea stage",
          "Early-stage (revenue under $1M)",
          "Growth stage ($1M–$10M revenue)",
          "Scaling ($10M–$50M revenue)",
          "Established ($50M+ revenue)",
          "Enterprise / Publicly listed",
        ],
      },
      {
        id: "industrySectors",
        label: "Industry sector",
        type: "checkbox",
        required: true,
        columns: 3,
        hasOther: true,
        options: [
          "Technology / SaaS",
          "Financial Services",
          "Real Estate / Property",
          "E-commerce / Retail",
          "Healthcare / Wellness",
          "Media / Creative",
          "Professional Services",
          "Manufacturing / Supply Chain",
          "Education / EdTech",
          "Hospitality / Travel",
          "Family Office / Investment",
        ],
      },
    ],
  },

  // ─── 2. EXPANSION GOALS ─────────────────────────────────────────────────
  {
    id: "expansion",
    kicker: "Expansion Goals",
    heading: "Where You Want",
    headingAccent: "To Go",
    fields: [
      {
        id: "targetMarkets",
        label: "Which markets or regions are you currently considering?",
        type: "checkbox",
        required: true,
        hint: "Select all that apply. We will map each against your incorporation chart.",
        columns: 3,
        hasOther: true,
        options: [
          "Southeast Asia",
          "Greater China",
          "Japan / South Korea",
          "India / South Asia",
          "Middle East / GCC",
          "United Kingdom",
          "Continental Europe",
          "United States",
          "Canada",
          "Latin America",
          "Africa",
        ],
      },
      {
        id: "expansionPurpose",
        label: "What is the primary purpose of this expansion?",
        type: "checkbox",
        required: true,
        columns: 2,
        hasOther: true,
        options: [
          "New revenue market",
          "Operational / regional HQ",
          "Brand presence & visibility",
          "Talent acquisition",
          "Regulatory / licensing positioning",
          "Partnership or JV entry",
          "Acquisition or M&A",
        ],
      },
      {
        id: "firstInternational",
        label: "Is this your first international expansion?",
        type: "radio",
        columns: 2,
        options: [
          "Yes — first international move",
          "No — already operating in multiple markets",
        ],
      },
      {
        id: "decisionTimeline",
        label: "Do you have a target decision timeframe?",
        type: "radio",
        required: true,
        columns: 2,
        options: [
          "Immediate — within 1 month",
          "Short-term — 1 to 3 months",
          "Medium-term — 3 to 6 months",
          "Longer-term — 6 to 12 months",
          "Exploratory — no fixed deadline",
        ],
      },
    ],
  },

  // ─── 3. WHAT YOU'RE NAVIGATING ──────────────────────────────────────────
  {
    id: "navigating",
    kicker: "The Decision at Hand",
    heading: "What You're",
    headingAccent: "Navigating",
    fields: [
      {
        id: "keyDecisions",
        label:
          "What is the most significant decision you are currently navigating?",
        type: "checkbox",
        required: true,
        columns: 2,
        hasOther: true,
        options: [
          "Which market(s) to enter",
          "When to launch or go to market",
          "Where to relocate a key executive",
          "Whether to sign a major partnership",
          "Fundraising or investment timing",
          "M&A or acquisition decision",
          "Leadership restructure or hiring",
        ],
      },
      {
        id: "situationContext",
        label: "Tell us more about your situation",
        type: "textarea",
        hint: "What has prompted you to seek this kind of intelligence? Any context, urgency, or background is helpful.",
        placeholder:
          "e.g. We have shortlisted three cities for our APAC HQ and the board needs to make a decision by Q3...",
        rows: 4,
      },
      {
        id: "territoriesLeaningToward",
        label: "Are there territories you are already leaning toward?",
        type: "text",
        placeholder: "e.g. London, Dubai, Tokyo",
      },
      {
        id: "territoriesCautiousAbout",
        label: "Are there territories you are instinctively cautious about?",
        type: "text",
        placeholder:
          "e.g. Uncertain about the US timing, wary of EU regulatory environment",
      },
    ],
  },

  // ─── 4. LEADERSHIP & TEAM ───────────────────────────────────────────────
  {
    id: "leadership",
    kicker: "Leadership & Team",
    heading: "Your",
    headingAccent: "People",
    fields: [
      {
        id: "execChartMapping",
        label: "Should this engagement include executive chart mapping?",
        type: "radio",
        required: true,
        hint: "Executive astrocartography requires each person's birth date and birth city. We treat all personal data with full confidentiality.",
        columns: 2,
        options: [
          "Company chart only",
          "Company + 1–2 key executives",
          "Company + full leadership team",
          "Not sure yet",
        ],
      },
      {
        id: "teamSize",
        label: "How many leaders are involved in this expansion decision?",
        type: "radio",
        columns: 4,
        options: ["Just me", "2–3 people", "4–6 people", "7+ people"],
      },
      {
        id: "execRelocation",
        label:
          "Is there a specific executive whose relocation is part of this question?",
        type: "radio",
        columns: 3,
        options: ["Yes", "No", "Possibly — we're evaluating this"],
      },
    ],
  },

  // ─── 5. FINANCIAL CONSIDERATIONS ────────────────────────────────────────
  {
    id: "financial",
    kicker: "Investment & Budget",
    heading: "Financial",
    headingAccent: "Considerations",
    fields: [
      {
        id: "serviceTier",
        label: "Which service tier are you most interested in exploring?",
        type: "radio",
        required: true,
        columns: 2,
        options: [
          "Market Reconnaissance — Single market · From SGD 2,400",
          "Multi-Market Intelligence — 3–5 markets · From SGD 5,800",
          "Enterprise Advisory — Ongoing · Custom pricing",
          "VIP Private Retainer — Monthly · By Engagement",
          "Not sure — I'd like guidance on what fits",
        ],
      },
      {
        id: "budgetOneTime",
        label: "One-time project budget",
        type: "radio",
        required: true,
        hint: "Select the range that best reflects what has been allocated or what you're comfortable investing.",
        columns: 3,
        options: [
          "Under SGD 2,500",
          "SGD 2,500 – 5,000",
          "SGD 5,000 – 10,000",
          "SGD 10,000 – 25,000",
          "SGD 25,000+",
          "Not applicable",
        ],
      },
      {
        id: "budgetMonthly",
        label: "Monthly retainer budget",
        type: "radio",
        columns: 3,
        options: [
          "Under SGD 2,000/mo",
          "SGD 2,000 – 3,500/mo",
          "SGD 3,500 – 6,000/mo",
          "SGD 6,000+/mo",
          "Not applicable",
        ],
      },
      {
        id: "budgetAnnual",
        label: "Annual engagement budget",
        type: "radio",
        columns: 3,
        options: [
          "Under SGD 25,000/yr",
          "SGD 25,000 – 50,000/yr",
          "SGD 50,000 – 100,000/yr",
          "SGD 100,000+/yr",
          "Not applicable",
        ],
      },
      {
        id: "budgetApproved",
        label: "Has a budget been formally approved for this engagement?",
        type: "radio",
        columns: 2,
        options: [
          "Yes — budget is confirmed and allocated",
          "In progress — pending internal approval",
          "No — I'm evaluating before proposing internally",
          "I am the decision-maker — no approval required",
        ],
      },
      {
        id: "decisionMaker",
        label: "Who is the decision-maker for this investment?",
        type: "radio",
        required: true,
        columns: 2,
        options: [
          "Me — I decide independently",
          "Me + one other (partner / co-founder)",
          "Leadership team or board sign-off",
          "Family office / investment committee",
        ],
      },
      {
        id: "financeRequirements",
        label:
          "Are there any financial or procurement considerations we should know about?",
        type: "checkbox",
        hint: "e.g. invoicing in a specific currency, required vendor onboarding, GST / tax requirements, preferred payment terms.",
        columns: 2,
        hasOther: true,
        options: [
          "Require invoicing in USD",
          "Require invoicing in GBP / EUR",
          "Require formal vendor registration",
          "Require GST / VAT invoice",
          "Prefer split / phased payments",
        ],
      },
    ],
  },

  // ─── 6. WORKING STYLE & FIT ─────────────────────────────────────────────
  {
    id: "workingStyle",
    kicker: "Working Style & Fit",
    heading: "How You",
    headingAccent: "Operate",
    fields: [
      {
        id: "priorAstrologyExperience",
        label: "Have you worked with an astrologer in a business context before?",
        type: "radio",
        columns: 2,
        options: [
          "Yes — regularly",
          "Yes — once or twice",
          "No — this is new territory for me",
          "Personally yes, not in a business context",
        ],
      },
      {
        id: "internalUsage",
        label: "How will this intelligence be used internally?",
        type: "checkbox",
        required: true,
        columns: 2,
        hasOther: true,
        options: [
          "Privately — by me only",
          "Shared with a small leadership group",
          "Presented alongside conventional analysis",
          "Included in board materials",
          "Used as a private sense-check only",
        ],
      },
      {
        id: "ndaRequirements",
        label: "Are there confidentiality or NDA requirements on your end?",
        type: "radio",
        columns: 2,
        options: [
          "Yes — we will need to sign an NDA before sharing details",
          "No — your standard confidentiality terms are sufficient",
          "We'll use a mutual NDA",
          "Not sure yet",
        ],
      },
    ],
  },

  // ─── 7. YOUR DETAILS ────────────────────────────────────────────────────
  {
    id: "contact",
    kicker: "Your Details",
    heading: "How to",
    headingAccent: "Reach You",
    fields: [
      {
        id: "contactName",
        label: "Your full name",
        type: "text",
        required: true,
        placeholder: "First and last name",
      },
      {
        id: "contactTitle",
        label: "Your role / title",
        type: "text",
        required: true,
        placeholder: "e.g. CEO, Managing Director, Founder",
      },
      {
        id: "contactEmail",
        label: "Email address",
        type: "email",
        required: true,
        placeholder: "you@company.com",
      },
      {
        id: "contactPhone",
        label: "WhatsApp / Phone (optional)",
        type: "tel",
        placeholder: "+65 9123 4567",
      },
      {
        id: "contactPreference",
        label: "Preferred way to connect for our follow-up call",
        type: "radio",
        columns: 4,
        options: [
          "Video call (Zoom)",
          "Video call (Google Meet)",
          "WhatsApp voice",
          "Email exchange",
        ],
      },
      {
        id: "referralSource",
        label: "How did you hear about AstroNat Corporate Intelligence?",
        type: "radio",
        columns: 3,
        hasOther: true,
        options: [
          "Instagram",
          "YouTube",
          "Substack / Newsletter",
          "Personal referral",
          "Podcast / Media feature",
          "Google search",
        ],
      },
      {
        id: "additionalNotes",
        label: "Anything else you'd like us to know?",
        type: "textarea",
        hint: "Context about your situation, what you're hoping to achieve, or any questions you have about the process.",
        placeholder:
          "Feel free to share anything that would help us prepare for our conversation...",
        rows: 4,
      },
    ],
  },
];
