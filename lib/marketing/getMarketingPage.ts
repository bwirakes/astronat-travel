import { getPayload } from "payload";
import configPromise from "@payload-config";

export async function getMarketingPage(slug: string) {
  try {
    const payload = await getPayload({ config: await configPromise });
    const res = await payload.find({
      collection: "pages",
      where: { slug: { equals: slug } },
      depth: 2,
    });
    return res.docs[0] || null;
  } catch (err) {
    console.error(`[getMarketingPage] Failed to fetch page ${slug}:`, err);
    return null;
  }
}
