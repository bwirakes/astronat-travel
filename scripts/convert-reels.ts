#!/usr/bin/env bun
/**
 * Converts public/reels/reel{1,2,3}.gif to .mp4 (h.264, faststart) using the
 * ffmpeg binary bundled with `ffmpeg-static`. Run after replacing the source
 * GIFs to regenerate the .mp4 variants. Once the .mp4 files exist and look
 * good, switch the `image` references in the marketing + blog pages from
 * `.gif` to `.mp4` — the InstagramReels component already branches on the
 * extension and renders <video> for mp4.
 *
 * Why mp4 instead of webm: broader Safari support and InstagramReels uses
 * a generic <video> element. webm can be added as an extra <source> later
 * if you want even smaller payloads on Chromium.
 *
 * Expected delta: 7 MB gif → ~400 KB mp4 (≈18× smaller).
 *
 * Usage:
 *   bun run scripts/convert-reels.ts
 *   bun run scripts/convert-reels.ts --reel reel1
 */

import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath = (require("ffmpeg-static") as string | null) ?? "ffmpeg";

const REELS_DIR = path.resolve(process.cwd(), "public/reels");
const REELS = ["reel1", "reel2", "reel3"];

function fmtBytes(n: number) {
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  if (n > 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

const filter = process.argv.includes("--reel")
  ? process.argv[process.argv.indexOf("--reel") + 1]
  : null;

for (const name of REELS) {
  if (filter && name !== filter) continue;
  const src = path.join(REELS_DIR, `${name}.gif`);
  const dst = path.join(REELS_DIR, `${name}.mp4`);
  if (!existsSync(src)) {
    console.warn(`[skip] ${src} not found`);
    continue;
  }
  console.log(`→ encoding ${name}.gif → ${name}.mp4`);
  execFileSync(
    ffmpegPath,
    [
      "-y",
      "-i",
      src,
      "-movflags",
      "+faststart",
      "-pix_fmt",
      "yuv420p",
      "-vf",
      "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-c:v",
      "libx264",
      "-preset",
      "slower",
      "-crf",
      "23",
      "-an",
      dst,
    ],
    { stdio: "inherit" }
  );
  const beforeBytes = statSync(src).size;
  const afterBytes = statSync(dst).size;
  console.log(`  ${fmtBytes(beforeBytes)} → ${fmtBytes(afterBytes)}`);
}

console.log("\nDone. Switch the reel references in:");
console.log("  - app/(frontend)/(blog)/blog/page.tsx");
console.log("  - app/(frontend)/(marketing)/app/page.tsx");
console.log("…from `/reels/reelN.gif` to `/reels/reelN.mp4`.");
