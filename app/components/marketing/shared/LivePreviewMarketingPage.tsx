"use client";

import React from "react";
import { useLivePreview } from "@payloadcms/live-preview-react";
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

export function LivePreviewMarketingPage({
  initialData,
  customRenderers,
}: LivePreviewMarketingPageProps) {
  const { data } = useLivePreview<PageData>({
    initialData,
    serverURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    depth: 2,
  });

  const blocks = data?.layout ?? initialData.layout;

  return (
    <MarketingPageView
      blocks={blocks as readonly Block[]}
      customRenderers={customRenderers}
    />
  );
}
