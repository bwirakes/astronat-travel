import type { Block } from "payload";

/** Reusable ticker (blue bar, duplicated items for marquee). */
export const tickerMarquee: Block = {
  slug: "tickerMarquee",
  labels: { singular: "Ticker marquee", plural: "Ticker marquees" },
  fields: [
    {
      name: "durationSec",
      type: "number",
      defaultValue: 28,
      admin: { description: "Animation loop duration (seconds)." },
    },
    {
      name: "items",
      type: "array",
      minRows: 1,
      fields: [{ name: "text", type: "text", required: true }],
    },
  ],
};

export const testimonialGrid: Block = {
  slug: "testimonialGrid",
  labels: { singular: "Testimonial grid", plural: "Testimonial grids" },
  fields: [
    {
      name: "heading",
      type: "text",
    },
    {
      name: "subheading",
      type: "text",
    },
    {
      name: "items",
      type: "array",
      fields: [
        { name: "quote", type: "textarea", required: true },
        { name: "name", type: "text", required: true },
        { name: "location", type: "text", required: true },
      ],
    },
  ],
};

export const faqAccordion: Block = {
  slug: "faqAccordion",
  labels: { singular: "FAQ accordion", plural: "FAQ accordions" },
  fields: [
    { name: "heading", type: "text" },
    { name: "kicker", type: "text" },
    {
      name: "items",
      type: "array",
      fields: [
        { name: "question", type: "text", required: true },
        { name: "answer", type: "textarea", required: true },
      ],
    },
  ],
};
