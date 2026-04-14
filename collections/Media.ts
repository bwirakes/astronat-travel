import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  upload: { 
    imageSizes: [
      { name: "card", width: 768, height: 1024 }
    ],
    adminThumbnail: "card"
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    { 
      name: "alt", 
      type: "text", 
      required: true 
    }
  ],
};
