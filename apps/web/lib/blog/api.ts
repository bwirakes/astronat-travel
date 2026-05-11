import {
  getStaticBlogPostBySlug,
  getStaticBlogPosts,
  type BlogPostDoc,
} from "./static-posts";

const mockLexicalContent = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Welcome to the new journal. This is a sample blog post rendered completely using the Payload CMS Lexical engine, matching the exact bespoke typographic scale of the Astro-Brand.",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Living Your Astrology",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "heading",
        version: 1,
        tag: "h2",
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Stop guessing your next move. Turn your birth chart into a precision travel map in seconds.",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "This quote should appear properly bordered and stylized.",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "quote",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
};

const samplePost: BlogPostDoc = {
  id: "sample-1",
  title: "The Reality of Relocating on Your Jupiter Line",
  slug: "sample-post",
  author: "Natalia H.",
  publishedDate: new Date().toISOString(),
  excerpt:
    "Everyone talks about how the Jupiter line brings abundance, but no one talks about the overwhelm. Here is the honest truth after six months living the data.",
  heroImage: {
    url: "/astronat-hero.jpg",
    alt: "Vespa and cypress",
  },
  content: mockLexicalContent,
};

export async function getPosts(): Promise<BlogPostDoc[]> {
  const staticPosts = getStaticBlogPosts();
  return staticPosts.length > 0 ? staticPosts : [samplePost];
}

export async function getPostBySlug(slug: string): Promise<BlogPostDoc | null> {
  if (slug === "sample-post") {
    return samplePost;
  }
  return getStaticBlogPostBySlug(slug) ?? null;
}
