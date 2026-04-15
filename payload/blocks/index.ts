import { geodeticCustomBlocks } from "./geodetic-custom";
import { faqAccordion, testimonialGrid, tickerMarquee } from "./shared";
import { universalBlocks } from "./universal";

export const marketingBlocks = [
  ...universalBlocks,
  tickerMarquee,
  testimonialGrid,
  faqAccordion,
  ...geodeticCustomBlocks,
];
