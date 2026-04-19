import type { CollectionConfig } from "payload";
import { revalidatePath } from "next/cache";

import { marketingBlocks } from "../payload/blocks";

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
    livePreview: {
      url: ({ data }) => {
        const slug = (data as Record<string, string>)?.slug;
        const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        return slug === "home" ? base : `${base}/${slug}`;
      },
    },
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        const slug = doc?.slug as string | undefined;
        if (slug) {
          const pagePath = slug === "home" ? "/" : `/${slug}`;
          revalidatePath(pagePath);
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
        description: "Use: home, b2b, map-from-home, geodetic, or a marketing lander slug.",
      },
    },
    {
      name: "metaDescription",
      type: "textarea",
    },
    {
      name: "layout",
      type: "blocks",
      required: true,
      blocks: marketingBlocks,
    },
  ],
};
