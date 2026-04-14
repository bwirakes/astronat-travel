import React from "react";
import { GeoCaseStudiesEmbed } from "./blocks/GeoCaseStudiesEmbed";
import { GeoMapSection } from "./blocks/GeoMapSection";
import { GeoMundaneCycles } from "./blocks/GeoMundaneCycles";
import { 
  HeroSection, 
  StatsStrip, 
  StatementBand, 
  CardGrid, 
  SplitContent, 
  ProcessTimeline, 
  CtaBand 
} from "./blocks/UniversalBlocks";
import {
  TickerMarquee,
  TestimonialGrid,
  FaqAccordion,
  PullQuote
} from "./blocks/SharedBlocks";

// Default blocks mappings (handles Payload CMS blockType string)
const defaultRenderers: Record<string, React.FC<any>> = {
  "GeoCaseStudiesEmbed": GeoCaseStudiesEmbed,
  "GeoMapSection": GeoMapSection,
  "GeoMundaneCycles": GeoMundaneCycles,
  "geo-case-studies-embed": GeoCaseStudiesEmbed,
  "geo-map-section": GeoMapSection,
  "geo-mundane-cycles": GeoMundaneCycles,
  "heroSection": HeroSection,
  "statsStrip": StatsStrip,
  "statementBand": StatementBand,
  "cardGrid": CardGrid,
  "splitContent": SplitContent,
  "processTimeline": ProcessTimeline,
  "ctaBand": CtaBand,
  "tickerMarquee": TickerMarquee,
  "testimonialGrid": TestimonialGrid,
  "faqAccordion": FaqAccordion,
  "pullQuote": PullQuote,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = Record<string, any> & { blockType?: string };

interface MarketingPageViewProps {
  blocks: readonly Block[];
  customRenderers?: Record<string, React.FC<{ block: Block }>>;
}

export function MarketingPageView({ blocks, customRenderers = {} }: MarketingPageViewProps) {
  if (!blocks || blocks.length === 0) return null;

  const renderers = { ...defaultRenderers, ...customRenderers };

  return (
    <>
      {blocks.map((block, index) => {
        const blockType = block.blockType ?? "";
        const Renderer = renderers[blockType];

        if (!Renderer) {
          if (process.env.NODE_ENV !== "production") {
             console.warn(`[MarketingPageView] No renderer found for block type: ${blockType}`);
             return (
               <div key={index} className="p-4 border border-dashed border-red-500 m-4 text-red-500">
                 Missing renderer for block: <code>{blockType}</code>
               </div>
             );
          }
          return null;
        }

        return <Renderer key={index} block={block} />;
      })}
    </>
  );
}
