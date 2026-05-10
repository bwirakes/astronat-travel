import { getStaticMarketingPage } from "./static-pages";

export async function getMarketingPage(slug: string) {
  return getStaticMarketingPage(slug);
}
