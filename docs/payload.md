# Payload CMS — operator notes

This project runs Payload 3.x on Bun. The scripts under `scripts/` exist
because Payload's published CLI uses `tsx://` protocol URLs that Bun's
module resolver does not understand, so invoking `payload migrate`,
`payload generate:importmap`, etc. directly fails at import time.

## Scripts

| Script                             | Replaces                        | Notes                                                                                                                              |
| ---------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/generate-importmap.ts`    | `payload generate:importmap`    | Calls `generateImportMap` from Payload's published JS API. Pass `--force` to rewrite on no-op changes.                             |
| `scripts/payload-migrate.ts`       | `payload migrate[:*]`           | Dispatches to Payload's `migrate` entry. Use `bun run scripts/payload-migrate.ts migrate:create <name>` to scaffold new migrations. |
| `scripts/seed-payload-pages.ts`    | —                               | Seeds the 4 marketing pages (home, b2b, map-from-home, geodetic) from `lib/marketing/fallbacks/*`. Idempotent (checks by slug).    |
| `scripts/seed-payload-media.ts`    | —                               | Uploads images from `public/` into the media collection and links them into page blocks by `_order`. Idempotent (checks by filename). |

Common commands:

```sh
bun run scripts/payload-migrate.ts migrate:status
bun run scripts/payload-migrate.ts migrate
bun run scripts/generate-importmap.ts --force
bun run scripts/seed-payload-pages.ts
```

If you see errors about `tsx://` URLs, you are running the stock CLI
under Bun — switch to the script in the table above.

## Logging

Inside a Payload-aware script, log via `payload.logger.{info,warn,error}`.
The one exception is the top-level `main().catch(...)` handler: if
`getPayload({ config })` itself threw, there is no instance to log
through, so `console.error` is correct there.

## Import map

Payload emits `app/(payload)/admin/importMap.js` listing every custom
component referenced by `admin.components.*` in the config. Regenerate
after changing any custom component path:

```sh
bun run scripts/generate-importmap.ts --force
```

The file is committed so production builds do not need to run the
generator.

## Build-time TS errors

`next.config.ts` keeps `typescript.ignoreBuildErrors: true` with an
inline comment listing the pre-existing non-Payload errors. Do not
add new Payload-related TS errors under that flag — fix them in
the Payload-owned code directly.
