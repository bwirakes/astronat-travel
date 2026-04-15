import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Media } from "./collections/Media";
import { Pages } from "./collections/Pages";
import { Users } from "./collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const s3Bucket = process.env.S3_BUCKET;
const s3Enabled = Boolean(
  s3Bucket && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY,
);

/** Set `DATABASE_SSL_REJECT_UNAUTHORIZED=false` locally if Node reports SSL chain errors against Supabase. */
const dbPool: { connectionString: string; ssl?: { rejectUnauthorized: boolean } } =
  {
    connectionString: process.env.DATABASE_URL || "",
  };
if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false") {
  dbPool.ssl = { rejectUnauthorized: false };
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      url: ({ data }) =>
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/${
          (data as Record<string, string>)?.slug === "home"
            ? ""
            : (data as Record<string, string>)?.slug ?? ""
        }`,
      collections: ["pages"],
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 375, height: 667 },
        { label: "Tablet", name: "tablet", width: 768, height: 1024 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },
  collections: [Users, Media, Pages],
  db: postgresAdapter({
    pool: dbPool,
    schemaName: "payload",
  }),
  editor: lexicalEditor(),
  plugins: [
    s3Storage({
      bucket: s3Bucket || "payload-media-local-placeholder",
      collections: {
        media: true,
      },
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
        region: process.env.S3_REGION || "us-east-1",
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      },
      enabled: s3Enabled,
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || "",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
