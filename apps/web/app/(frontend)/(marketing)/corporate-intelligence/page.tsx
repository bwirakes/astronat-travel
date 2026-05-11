import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { LivePreviewMarketingPage } from "@/app/components/marketing/shared/LivePreviewMarketingPage";
import { b2bFallbackBlocksUniversal } from "@/lib/marketing/fallbacks/b2b";
import { getMarketingPage } from "@/lib/marketing/getMarketingPage";

export const revalidate = 60;

export default async function B2BPage() {
  const doc = await getMarketingPage("b2b");
  const blocks =
    doc?.layout && doc.layout.length > 0 ? doc.layout : b2bFallbackBlocksUniversal;

  return (
    <>
      <Navbar hideAuth={true} />
      <LivePreviewMarketingPage
        initialData={{ slug: "b2b", title: doc?.title ?? "B2B", layout: blocks as never }}
      />
      <Footer variant="b2b" />
    </>
  );
}
