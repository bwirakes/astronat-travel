import Footer from "@/app/components/Footer";
import Navbar from "@/app/components/Navbar";
import { LivePreviewMarketingPage } from "@/app/components/marketing/shared/LivePreviewMarketingPage";
import { mfhFallbackBlocksUniversal } from "@/lib/marketing/fallbacks/mfh";
import { getMarketingPage } from "@/lib/marketing/getMarketingPage";

export const revalidate = 60;

export default async function MapFromHomePage() {
  const doc = await getMarketingPage("map-from-home");
  const blocks =
    doc?.layout && doc.layout.length > 0 ? doc.layout : mfhFallbackBlocksUniversal;

  return (
    <>
      <Navbar hideAuth={true} />
      <LivePreviewMarketingPage
        initialData={{ slug: "map-from-home", title: doc?.title ?? "Map From Home", layout: blocks as never }}
      />
      <Footer />
    </>
  );
}
