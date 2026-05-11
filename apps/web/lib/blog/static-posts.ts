import staticPostsData from "./static-posts-data.json";

export type BlogPostDoc = {
  id: string;
  title: string;
  slug: string;
  author?: string;
  publishedDate?: string;
  excerpt: string;
  heroImage?: { url: string; alt: string };
  content: unknown;
};

const posts = staticPostsData as BlogPostDoc[];

const bySlug = new Map<string, BlogPostDoc>();
for (const p of posts) {
  if (p.slug) bySlug.set(p.slug, p);
}

export function getStaticBlogPosts(): BlogPostDoc[] {
  return [...posts].sort((a, b) => {
    const ta = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
    const tb = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
    return tb - ta;
  });
}

export function getStaticBlogPostBySlug(slug: string): BlogPostDoc | undefined {
  return bySlug.get(slug);
}

export function getStaticBlogSlugs(): string[] {
  return posts.map((p) => p.slug).filter(Boolean);
}
