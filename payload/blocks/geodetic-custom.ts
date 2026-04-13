import type { Block } from "payload";

/** Geodetic-specific blocks with no universal equivalent. */

export const geoMapSection: Block = {
  slug: "geoMapSection",
  labels: { singular: "Geodetic map section", plural: "Geodetic map sections" },
  fields: [
    { name: "heading", type: "text", required: true },
    { name: "sectionLabel", type: "text", required: true },
    { name: "intro", type: "textarea", required: true },
  ],
};

export const geoMundaneCycles: Block = {
  slug: "geoMundaneCycles",
  labels: {
    singular: "Geodetic mundane cycles",
    plural: "Geodetic mundane cycles",
  },
  fields: [
    { name: "heading", type: "text", required: true },
    { name: "sectionLabel", type: "text", required: true },
    { name: "bannerKicker", type: "text", required: true },
    { name: "bannerTitleAccent", type: "text", required: true },
    { name: "bannerTitle", type: "textarea", required: true },
    { name: "bannerBody", type: "textarea", required: true },
    {
      name: "cycles",
      type: "array",
      fields: [
        { name: "sym", type: "text", required: true },
        { name: "title", type: "text", required: true },
        { name: "desc", type: "textarea", required: true },
      ],
    },
    {
      name: "researchNotes",
      type: "array",
      fields: [
        { name: "loc", type: "text", required: true },
        { name: "desc", type: "textarea", required: true },
      ],
    },
    { name: "researchCtaLabel", type: "text", required: true },
    { name: "researchCtaHref", type: "text", required: true },
  ],
};

export const geoCaseStudiesEmbed: Block = {
  slug: "geoCaseStudiesEmbed",
  labels: {
    singular: "Geodetic case studies",
    plural: "Geodetic case studies",
  },
  fields: [],
};

export const geodeticCustomBlocks: Block[] = [
  geoMapSection,
  geoMundaneCycles,
  geoCaseStudiesEmbed,
];
