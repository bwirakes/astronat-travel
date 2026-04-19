import type { EventType } from "@/lib/astro/geodetic-patterns";

export type Category = "motion" | "mp" | "ingress" | "eclipse" | "transit" | "config" | "lunation";

export const CATEGORY_OF: Record<EventType, Category> = {
  "ingress": "ingress",
  "station": "motion",
  "retrograde-span": "motion",
  "aspect": "transit",
  "midpoint-ingress": "mp",
  "stellium": "config",
  "oob-span": "config",
  "nodal-activation": "config",
  "one-sided-nodal": "config",
  "eclipse-solar": "eclipse",
  "eclipse-lunar": "eclipse",
  "lunation-new": "lunation",
  "lunation-full": "lunation",
};

export const CATEGORIES: Array<{ key: Category; label: string; bg: string; fg: string }> = [
  { key: "motion",   label: "Motion",         bg: "#EEEDFE", fg: "#3C3489" },
  { key: "ingress",  label: "Ingresses",      bg: "#FAECE7", fg: "#712B13" },
  { key: "transit",  label: "Transits",       bg: "#E1F5EE", fg: "#085041" },
  { key: "mp",       label: "Midpoints",      bg: "#FBEAF0", fg: "#72243E" },
  { key: "config",   label: "Configurations", bg: "#FCEBEB", fg: "#791F1F" },
  { key: "eclipse",  label: "Eclipses",       bg: "#E8E7E2", fg: "#444441" },
  { key: "lunation", label: "Lunations",      bg: "#E6F1FB", fg: "#0C447C" },
];

export const CATEGORY_META = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<
  Category,
  (typeof CATEGORIES)[number]
>;
