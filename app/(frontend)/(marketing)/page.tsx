import Footer from "@/app/components/Footer";
import Navbar from "@/app/components/Navbar";
import { LivePreviewMarketingPage } from "@/app/components/marketing/shared/LivePreviewMarketingPage";
import { homeFallbackBlocksUniversal } from "@/lib/marketing/fallbacks/home";
import { getMarketingPage } from "@/lib/marketing/getMarketingPage";
import { redirect } from "next/navigation";

export const revalidate = 60;

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
    error_code?: string;
    error_description?: string;
  }>;
}) {
  const params = await searchParams;
  if (params?.error || params?.error_code) {
    const next = new URLSearchParams();
    if (params.error_code) next.set("code", params.error_code);
    if (params.error_description) next.set("description", params.error_description);
    redirect(`/auth/error${next.size ? `?${next.toString()}` : ""}`);
  }

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
