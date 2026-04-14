import type { Block } from "payload";

export const heroSection: Block = {
  slug: "heroSection",
  labels: { singular: "Hero section", plural: "Hero sections" },
  fields: [
    { name: "kicker", type: "text" },
    { name: "kickerColor", type: "text", defaultValue: "y2k-blue" },
    { name: "titleAccent", type: "text" },
    { name: "titleHtml", type: "textarea", required: true },
    { name: "subtitle", type: "textarea" },
    { name: "primaryCta", type: "group", fields: [{ name: "label", type: "text" }, { name: "href", type: "text" }] },
    { name: "secondaryCta", type: "group", fields: [{ name: "label", type: "text" }, { name: "href", type: "text" }] },
    { name: "heroImage", type: "upload", relationTo: "media" },
    { name: "decorativeElement", type: "select", options: ["none", "orbital-grid", "rotating-svg"] },
    { name: "layout", type: "select", options: ["image-right", "text-only"] },
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
    { name: "variant", type: "select", options: ["statement", "disclaimer"], defaultValue: "statement" },
    { name: "kicker", type: "text" },
    { name: "bodyHtml", type: "textarea" }
  ]
};

export const cardGrid: Block = {
  slug: "cardGrid",
  labels: { singular: "Card grid", plural: "Card grids" },
  fields: [
    { name: "heading", type: "text" },
    { name: "headingHtml", type: "textarea" },
    { name: "kicker", type: "text" },
    { name: "variant", type: "select", options: ["numbered", "pricing"], defaultValue: "numbered" },
    { name: "columns", type: "number", defaultValue: 2 },
    { name: "sectionBg", type: "select", options: ["raised", "charcoal", "bg"], defaultValue: "bg" },
    { name: "cards", type: "array", fields: [
      { name: "num", type: "text" },
      { name: "title", type: "text" },
      { name: "desc", type: "textarea" },
      { name: "tag", type: "text" },
      { name: "glyph", type: "text" },
      { name: "bgToken", type: "text" },
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

export const splitContent: Block = {
  slug: "splitContent",
  labels: { singular: "Split content", plural: "Split contents" },
  fields: [
    { name: "layout", type: "select", options: ["standard", "methodology", "two-column-text"], defaultValue: "standard" },
    { name: "bgToken", type: "text" },
    { name: "kicker", type: "text" },
    { name: "heading", type: "text" },
    { name: "headingHtml", type: "textarea" },
    { name: "body", type: "textarea" },
    { name: "body2", type: "textarea" },
    { name: "image", type: "upload", relationTo: "media" },
    { name: "imageSide", type: "select", options: ["left", "right"], defaultValue: "right" },
    { name: "features", type: "array", fields: [{ name: "icon", type: "text" }, { name: "title", type: "text" }, { name: "desc", type: "textarea" }] },
    { name: "primaryCta", type: "group", fields: [{ name: "label", type: "text" }, { name: "href", type: "text" }] },
    { name: "rightPanel", type: "group", fields: [
       { name: "kicker", type: "text" },
       { name: "priceLine", type: "text" },
       { name: "priceNote", type: "textarea" },
       { name: "limitNote", type: "text" },
       { name: "ctaLabel", type: "text" },
       { name: "ctaHref", type: "text" },
       { name: "testimonialKicker", type: "text" },
       { name: "testimonialMeta", type: "text" }
    ]},
    { name: "leftCol", type: "group", fields: [{ name: "title", type: "text" }, { name: "body", type: "textarea" }] },
    { name: "rightCol", type: "group", fields: [{ name: "title", type: "text" }, { name: "body", type: "textarea" }] },
    { name: "numberedItems", type: "array", fields: [{ name: "glyph", type: "text" }, { name: "title", type: "text" }, { name: "desc", type: "textarea" }] },
    { name: "monogram", type: "upload", relationTo: "media" }
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

export const ctaBand: Block = {
  slug: "ctaBand",
  labels: { singular: "CTA band", plural: "CTA bands" },
  fields: [
    { name: "layout", type: "select", options: ["standard", "newsletter", "cta-cards", "centered", "two-column"], defaultValue: "standard" },
    { name: "bgToken", type: "text" },
    { name: "accent", type: "text" },
    { name: "heading", type: "text" },
    { name: "headingHtml", type: "textarea" },
    { name: "body", type: "textarea" },
    { name: "titleLine1", type: "text" },
    { name: "titleLine2", type: "text" },
    { name: "newsletterBody", type: "textarea" },
    { name: "priceLine", type: "text" },
    { name: "closing", type: "text" },
    { name: "primaryCta", type: "group", fields: [{ name: "label", type: "text" }, { name: "href", type: "text" }] },
    { name: "secondaryCta", type: "group", fields: [{ name: "label", type: "text" }, { name: "href", type: "text" }] },
    { name: "perks", type: "array", fields: [{ name: "line", type: "text" }] },
    { name: "primaryCard", type: "group", fields: [{ name: "kicker", type: "text" }, { name: "titleHtml", type: "textarea" }, { name: "href", type: "text" }] },
    { name: "secondaryCards", type: "array", fields: [{ name: "kicker", type: "text" }, { name: "titleHtml", type: "textarea" }, { name: "href", type: "text" }] },
    { name: "decorativeElement", type: "select", options: ["none", "rotating-svg"], defaultValue: "none" }
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
