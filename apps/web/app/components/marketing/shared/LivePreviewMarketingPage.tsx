import React from "react";
import { MarketingPageView } from "./MarketingPageView";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Block = Record<string, any> & { blockType?: string };
type BlockRenderer = React.FC<{ block: Block }>;

interface PageData {
  slug: string;
  title: string;
  layout: Block[];
  [key: string]: unknown;
}

interface LivePreviewMarketingPageProps {
  initialData: PageData;
  customRenderers?: Record<string, BlockRenderer>;
}

/** Static marketing page shell (live Payload preview removed). */
export function LivePreviewMarketingPage({
  initialData,
  customRenderers,
}: LivePreviewMarketingPageProps) {
  const blocks = initialData.layout ?? [];

  return (
    <MarketingPageView
      blocks={blocks as readonly Block[]}
      customRenderers={customRenderers}
    />
  );
}
