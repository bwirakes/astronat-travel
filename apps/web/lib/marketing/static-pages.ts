import staticPagesData from "./static-pages-data.json";
import { b2bFallbackBlocksUniversal } from "./fallbacks/b2b";
import { geodeticFallbackBlocksUniversal } from "./fallbacks/geodetic";
import { homeFallbackBlocksUniversal } from "./fallbacks/home";
import { mfhFallbackBlocksUniversal } from "./fallbacks/mfh";

export type MarketingPageDoc = {
  title: string;
  slug: string;
  /** CMS block array; same shape as Payload `layout` blocks. */
  layout: unknown[];
};

const exported = staticPagesData as Record<string, MarketingPageDoc | undefined>;

const FALLBACK_BY_SLUG: Record<string, MarketingPageDoc> = {
  home: {
    title: "Home",
    slug: "home",
    layout: [...homeFallbackBlocksUniversal],
  },
  geodetic: {
    title: "Geodetic",
    slug: "geodetic",
    layout: [...geodeticFallbackBlocksUniversal],
  },
  "map-from-home": {
    title: "Map From Home",
    slug: "map-from-home",
    layout: [...mfhFallbackBlocksUniversal],
  },
  b2b: {
    title: "B2B",
    slug: "b2b",
    layout: [...b2bFallbackBlocksUniversal],
  },
};

/**
 * Merges exported Payload `pages` with in-repo fallbacks when the DB had no row
 * or an empty `layout` (e.g. drafts-only / empty collection).
 */
export function getStaticMarketingPage(slug: string): MarketingPageDoc | null {
  const fromDb = exported[slug];
  if (fromDb && Array.isArray(fromDb.layout) && fromDb.layout.length > 0) {
    return {
      title: fromDb.title,
      slug: fromDb.slug,
      layout: fromDb.layout,
    };
  }
  return FALLBACK_BY_SLUG[slug] ?? null;
}
