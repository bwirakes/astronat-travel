import Footer from "@/app/components/Footer";
import Navbar from "@/app/components/Navbar";
import { LivePreviewMarketingPage } from "@/app/components/marketing/shared/LivePreviewMarketingPage";
import { homeFallbackBlocksUniversal } from "@/lib/marketing/fallbacks/home";
import { getMarketingPage } from "@/lib/marketing/getMarketingPage";

export const revalidate = 60;

export default async function Home() {
  const doc = await getMarketingPage("home");
  const blocks =
    doc?.layout && doc.layout.length > 0 ? doc.layout : homeFallbackBlocksUniversal;

  return (
    <>
      <Navbar hideAuth={false} />
      <LivePreviewMarketingPage
        initialData={{ slug: "home", title: doc?.title ?? "Home", layout: blocks as never }}
      />
      <Footer />
    </>
  );
}
