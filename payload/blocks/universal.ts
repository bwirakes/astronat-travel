import type { Block } from "payload";

export const heroSection: Block = {
  slug: "heroSection",
  labels: { singular: "Hero section", plural: "Hero sections" },
  fields: [
    { name: "kicker", type: "text" },
    { name: "kickerColor", type: "text", defaultValue: "y2k-blue", admin: { description: "Color token for the kicker text (e.g. y2k-blue, acqua, spiced-life)." } },
    { name: "titleAccent", type: "text" },
    { name: "titleHtml", type: "textarea", required: true, admin: { description: "Main title. Raw HTML permitted for inline accents." } },
    { name: "subtitle", type: "textarea" },
    { name: "primaryCta", type: "group", fields: [{ name: "label", type: "text" }, { name: "href", type: "text" }] },
    { name: "secondaryCta", type: "group", fields: [{ name: "label", type: "text" }, { name: "href", type: "text" }] },
    { name: "heroImage", type: "upload", relationTo: "media" },
    { name: "decorativeElement", type: "select", options: ["none", "orbital-grid", "rotating-svg"], admin: { description: "Background flourish behind the hero." } },
    { name: "layout", type: "select", options: ["image-right", "text-only"], admin: { description: "image-right shows the hero image; text-only hides it." } },
  ]
};

export const statsStrip: Block = {
  slug: "statsStrip",
  labels: { singular: "Stats strip", plural: "Stats strips" },
  fields: [
    { name: "columns", type: "number", defaultValue: 4 },
    { name: "stats", type: "array", fields: [{ name: "n", type: "text" }, { name: "label", type: "text" }] }
  ]
};

export const statementBand: Block = {
  slug: "statementBand",
  labels: { singular: "Statement band", plural: "Statement bands" },
  fields: [
    { name: "variant", type: "select", options: ["statement", "disclaimer"], defaultValue: "statement", admin: { description: "statement = bold band; disclaimer = muted fine-print band." } },
    { name: "kicker", type: "text" },
    { name: "bodyHtml", type: "textarea", admin: { description: "Raw HTML permitted." } }
  ]
};

export const cardGrid: Block = {
  slug: "cardGrid",
  labels: { singular: "Card grid", plural: "Card grids" },
  fields: [
    { name: "heading", type: "text" },
    { name: "headingHtml", type: "textarea", admin: { description: "Raw HTML permitted. Prefer plain `heading` unless you need inline markup." } },
    { name: "kicker", type: "text" },
    { name: "variant", type: "select", options: [ { label: "Numbered Grid", value: "numbered" }, { label: "Pricing Tables", value: "pricing" } ], defaultValue: "numbered", admin: { description: "Numbered = feature cards with big numerals. Pricing = tier/price cards. Each card's fields below pair with the variant." } },
    { name: "columns", type: "number", defaultValue: 2 },
    { name: "sectionBg", type: "select", options: ["raised", "bg"], defaultValue: "bg", admin: { description: "raised = gray panel; bg = page background." } },
    { name: "cards", type: "array", fields: [
      { name: "num", type: "text" },
      { name: "title", type: "text" },
      { name: "desc", type: "textarea" },
      { name: "tag", type: "text" },
      { name: "glyph", type: "text" },
      { name: "bgToken", type: "select", options: [
        { label: "Raised (Editorial Gray)", value: "raised" },
        { label: "Eggshell (Cream)", value: "eggshell" },
        { label: "Y2K Blue (Signature)", value: "y2k-blue" },
        { label: "Acqua (Teal)", value: "acqua" },
        { label: "Spiced Life (Venus Pink)", value: "spiced-life" }
      ], defaultValue: "raised" },
      { name: "textToken", type: "text" },
      { name: "tier", type: "text" },
      { name: "tagline", type: "text" },
      { name: "price", type: "text" },
      { name: "primary", type: "checkbox" },
      { name: "includes", type: "array", fields: [{ name: "line", type: "text" }] },
      { name: "ctaLabel", type: "text" },
      { name: "ctaHref", type: "text" }
    ]}
  ]
};

// Conditions: which layout variant each field belongs to. Fields without a condition are shared across all layouts.
const splitIsStandard = (_: unknown, siblingData: Record<string, unknown>) => siblingData?.layout === "standard";
const splitIsMethodology = (_: unknown, siblingData: Record<string, unknown>) => siblingData?.layout === "methodology";
const splitIsTwoColumn = (_: unknown, siblingData: Record<string, unknown>) => siblingData?.layout === "two-column-text";

export const splitContent: Block = {
  slug: "splitContent",
  labels: { singular: "Split content", plural: "Split contents" },
  fields: [
    { name: "layout", type: "select", options: ["standard", "methodology", "two-column-text"], defaultValue: "standard" },
    { name: "bgToken", type: "select", admin: { description: "Design-system background color token." }, options: [
        { label: "Raised (Editorial Gray)", value: "raised" },
        { label: "Eggshell (Cream)", value: "eggshell" },
        { label: "Y2K Blue (Signature)", value: "y2k-blue" },
        { label: "Acqua (Teal)", value: "acqua" },
        { label: "Spiced Life (Venus Pink)", value: "spiced-life" }
      ], defaultValue: "raised" },
    { name: "kicker", type: "text" },
    { name: "heading", type: "text" },
    { name: "headingHtml", type: "textarea", admin: { description: "Raw HTML permitted. Prefer plain `heading` unless you need inline markup." } },
    { name: "body", type: "textarea" },
    { name: "body2", type: "textarea", admin: { condition: splitIsStandard, description: "Second paragraph, only shown in the standard layout." } },
    { name: "image", type: "upload", relationTo: "media" },
    { name: "imageSide", type: "select", options: ["left", "right"], defaultValue: "right" },
    { name: "features", type: "array", admin: { condition: splitIsStandard }, fields: [{ name: "icon", type: "text" }, { name: "title", type: "text" }, { name: "desc", type: "textarea" }] },
    { name: "primaryCta", type: "group", admin: { condition: splitIsStandard }, fields: [{ name: "label", type: "text" }, { name: "href", type: "text" }] },
    { name: "rightPanel", type: "group", admin: { condition: splitIsStandard, description: "Sidebar panel (pricing, testimonial) — standard layout only." }, fields: [
       { name: "kicker", type: "text" },
       { name: "priceLine", type: "text" },
       { name: "priceNote", type: "textarea" },
       { name: "limitNote", type: "text" },
       { name: "ctaLabel", type: "text" },
       { name: "ctaHref", type: "text" },
       { name: "testimonialKicker", type: "text" },
       { name: "testimonialMeta", type: "text" }
    ]},
    { name: "leftCol", type: "group", admin: { condition: splitIsTwoColumn }, fields: [{ name: "title", type: "text" }, { name: "body", type: "textarea" }] },
    { name: "rightCol", type: "group", admin: { condition: splitIsTwoColumn }, fields: [{ name: "title", type: "text" }, { name: "body", type: "textarea" }] },
    { name: "numberedItems", type: "array", admin: { condition: splitIsMethodology }, fields: [{ name: "glyph", type: "text" }, { name: "title", type: "text" }, { name: "desc", type: "textarea" }] },
    { name: "monogram", type: "upload", relationTo: "media", admin: { condition: splitIsMethodology } }
  ]
};

export const processTimeline: Block = {
  slug: "processTimeline",
  labels: { singular: "Process timeline", plural: "Process timelines" },
  fields: [
    { name: "kicker", type: "text" },
    { name: "headingHtml", type: "textarea" },
    { name: "steps", type: "array", fields: [{ name: "n", type: "text" }, { name: "title", type: "text" }, { name: "body", type: "textarea" }] }
  ]
};

// Conditions: which CTA variant each field belongs to. Fields without a condition are shared across all variants.
const ctaIsStandard = (_: unknown, s: Record<string, unknown>) => s?.layout === "standard";
const ctaIsNewsletter = (_: unknown, s: Record<string, unknown>) => s?.layout === "newsletter";
const ctaIsCards = (_: unknown, s: Record<string, unknown>) => s?.layout === "cta-cards";
const ctaIsCentered = (_: unknown, s: Record<string, unknown>) => s?.layout === "centered";

export const ctaBand: Block = {
  slug: "ctaBand",
  labels: { singular: "CTA band", plural: "CTA bands" },
  fields: [
    { name: "layout", type: "select", options: ["standard", "newsletter", "cta-cards", "centered", "two-column"], defaultValue: "standard" },
    { name: "bgToken", type: "select", admin: { description: "Design-system background color token." }, options: [
        { label: "Raised (Editorial Gray)", value: "raised" },
        { label: "Eggshell (Cream)", value: "eggshell" },
        { label: "Y2K Blue (Signature)", value: "y2k-blue" },
        { label: "Acqua (Teal)", value: "acqua" },
        { label: "Spiced Life (Venus Pink)", value: "spiced-life" }
      ], defaultValue: "raised" },
    { name: "accent", type: "text" },
    { name: "heading", type: "text" },
    { name: "headingHtml", type: "textarea", admin: { description: "Raw HTML permitted. Prefer plain `heading` unless you need inline markup." } },
    { name: "body", type: "textarea", admin: { condition: ctaIsStandard } },
    { name: "titleLine1", type: "text", admin: { condition: ctaIsCentered } },
    { name: "titleLine2", type: "text", admin: { condition: ctaIsCentered } },
    { name: "newsletterBody", type: "textarea", admin: { condition: ctaIsNewsletter } },
    { name: "priceLine", type: "text", admin: { condition: ctaIsCentered } },
    { name: "closing", type: "text", admin: { condition: ctaIsCentered } },
    { name: "primaryCta", type: "group", fields: [{ name: "label", type: "text" }, { name: "href", type: "text" }] },
    { name: "secondaryCta", type: "group", admin: { condition: ctaIsStandard }, fields: [{ name: "label", type: "text" }, { name: "href", type: "text" }] },
    { name: "perks", type: "array", admin: { condition: ctaIsNewsletter }, fields: [{ name: "line", type: "text" }] },
    { name: "primaryCard", type: "group", admin: { condition: ctaIsCards }, fields: [{ name: "kicker", type: "text" }, { name: "titleHtml", type: "textarea" }, { name: "href", type: "text" }] },
    { name: "secondaryCards", type: "array", admin: { condition: ctaIsCards }, fields: [{ name: "kicker", type: "text" }, { name: "titleHtml", type: "textarea" }, { name: "href", type: "text" }] },
    { name: "decorativeElement", type: "select", admin: { description: "Optional background flourish. 'rotating-svg' is an animated glyph." }, options: ["none", "rotating-svg"], defaultValue: "none" }
  ]
};

export const universalBlocks = [
  heroSection,
  statsStrip,
  statementBand,
  cardGrid,
  splitContent,
  processTimeline,
  ctaBand
];
