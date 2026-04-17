import type { CollectionConfig } from "payload";
import { revalidatePath } from "next/cache";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "publishedDate", "updatedAt"],
    livePreview: {
      url: ({ data }) => {
        const slug = (data as Record<string, string>)?.slug;
        const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        return slug ? `${base}/blog/${slug}` : `${base}/blog`;
      },
    },
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        const slug = doc?.slug as string | undefined;
        if (slug) {
          try {
            revalidatePath(`/blog/${slug}`);
            revalidatePath(`/blog`);
          } catch(e) {
            // Ignore error when running in local Node scripts outside Next.js
          }
        }
      },
    ],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  versions: { drafts: true },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "The URL slug for the post (e.g. 'how-to-travel-on-your-jupiter-line').",
      },
    },
    {
      name: "author",
      type: "text",
      defaultValue: "Natalia H.",
    },
    {
      name: "publishedDate",
      type: "date",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      required: false,
    },
    {
      name: "excerpt",
      type: "textarea",
      required: true,
      admin: {
        description: "A short summary of the post to show on the blog listing page.",
      },
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
  ],
};
