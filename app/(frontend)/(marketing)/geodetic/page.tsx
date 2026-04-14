import Footer from "@/app/components/Footer";
import Navbar from "@/app/components/Navbar";
import { LivePreviewMarketingPage } from "@/app/components/marketing/shared/LivePreviewMarketingPage";
import { GeoMapSection } from "@/app/components/marketing/shared/blocks/GeoMapSection";
import { GeoMundaneCycles } from "@/app/components/marketing/shared/blocks/GeoMundaneCycles";
import { GeoCaseStudiesEmbed } from "@/app/components/marketing/shared/blocks/GeoCaseStudiesEmbed";
import { geodeticFallbackBlocksUniversal } from "@/lib/marketing/fallbacks/geodetic";
import { getMarketingPage } from "@/lib/marketing/getMarketingPage";

export const revalidate = 60;

const geoCustomRenderers = {
  geoMapSection: GeoMapSection,
  geoMundaneCycles: GeoMundaneCycles,
  geoCaseStudiesEmbed: GeoCaseStudiesEmbed,
};

export default async function GeodeticPage() {
  const doc = await getMarketingPage("geodetic");
  const blocks =
    doc?.layout && doc.layout.length > 0 ? doc.layout : geodeticFallbackBlocksUniversal;

  return (
    <>
      <Navbar hideAuth={false} />
      <LivePreviewMarketingPage
        initialData={{ slug: "geodetic", title: doc?.title ?? "Geodetic", layout: blocks as never }}
        customRenderers={geoCustomRenderers}
      />
      <Footer />
    </>
  );
}
