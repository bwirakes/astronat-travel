import { describe, expect, it } from "bun:test";
import { getPostBySlug, getPosts } from "@/lib/blog/api";
import { getMarketingPage } from "@/lib/marketing/getMarketingPage";
import { getStaticBlogPostBySlug, getStaticBlogSlugs } from "@/lib/blog/static-posts";

describe("static marketing + blog (post-Payload)", () => {
  it("returns layouts for required marketing slugs via fallbacks or export", async () => {
    for (const slug of ["home", "geodetic", "map-from-home", "b2b"] as const) {
      const doc = await getMarketingPage(slug);
      expect(doc).not.toBeNull();
      expect(doc!.layout.length).toBeGreaterThan(0);
    }
  });

  it("exports blog posts with stable ordering and slug lookup", async () => {
    const slugs = getStaticBlogSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      const p = getStaticBlogPostBySlug(slug);
      expect(p?.slug).toBe(slug);
      expect(p?.title?.length).toBeGreaterThan(0);
    }

    const posts = await getPosts();
    expect(posts.length).toBeGreaterThan(0);

    const firstSlug = slugs[0];
    const byApi = await getPostBySlug(firstSlug);
    expect(byApi?.slug).toBe(firstSlug);
  });

  it("sample-post fallback resolves via API", async () => {
    const p = await getPostBySlug("sample-post");
    expect(p?.slug).toBe("sample-post");
  });
});
