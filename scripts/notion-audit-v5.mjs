#!/usr/bin/env node
/**
 * notion-audit-v5.mjs
 *
 * Final audit: Rebuilds the PRD page, deduplicates the features database,
 * and updates status for all features including the unified New Reading wizard.
 *
 * Usage: NOTION_API_KEY=... bun scripts/notion-audit-v5.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const envPath = resolve(__dirname, "..", ".env.local");
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  }
} catch {}

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PRODUCT_PAGE_ID = "3300ae6d4cd3801688a4e72fb48d7642";
const PRD_DB_ID = "3300ae6d-4cd3-81a9-a0a4-c75f757ba777";
const NOTION_VERSION = "2022-06-28";
const BASE_URL = "https://api.notion.com/v1";

if (!NOTION_API_KEY) { console.error("❌ NOTION_API_KEY not found."); process.exit(1); }

async function notionFetch(path, method = "GET", body = null) {
  const opts = { method, headers: { Authorization: `Bearer ${NOTION_API_KEY}`, "Notion-Version": NOTION_VERSION, "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json();
  if (!res.ok) { console.error(`❌ (${res.status}):`, JSON.stringify(data, null, 2)); throw new Error(data.message); }
  return data;
}

// Block helpers
const h1 = t => ({ object:"block", type:"heading_1", heading_1:{ rich_text:[{type:"text",text:{content:t}}] } });
const h2 = t => ({ object:"block", type:"heading_2", heading_2:{ rich_text:[{type:"text",text:{content:t}}] } });
const h3 = t => ({ object:"block", type:"heading_3", heading_3:{ rich_text:[{type:"text",text:{content:t}}] } });
const p = t => ({ object:"block", type:"paragraph", paragraph:{ rich_text:[{type:"text",text:{content:t}}] } });
const empty = () => ({ object:"block", type:"paragraph", paragraph:{rich_text:[]} });
const div = () => ({ object:"block", type:"divider", divider:{} });
const bullet = t => ({ object:"block", type:"bulleted_list_item", bulleted_list_item:{ rich_text:[{type:"text",text:{content:t}}] } });
const callout = (t, e="💡") => ({ object:"block", type:"callout", callout:{ rich_text:[{type:"text",text:{content:t}}], icon:{type:"emoji",emoji:e} } });
const toc = () => ({ object:"block", type:"table_of_contents", table_of_contents:{color:"default"} });
const richP = segs => ({ object:"block", type:"paragraph", paragraph:{ rich_text:segs.map(s=>({type:"text",text:{content:s.text},annotations:{bold:s.bold||false,italic:s.italic||false}})) } });
const table = (headers, rows) => {
  const w = headers.length;
  const hRow = { type:"table_row", table_row:{ cells:headers.map(h=>[{type:"text",text:{content:h}}]) } };
  const dRows = rows.map(r=>({ type:"table_row", table_row:{ cells:r.map(c=>[{type:"text",text:{content:c}}]) } }));
  return { object:"block", type:"table", table:{ table_width:w, has_column_header:true, has_row_header:false, children:[hRow,...dRows] } };
};

// ──────────────────────────────────────────────────────────────
// CANONICAL FEATURE LIST (single source of truth)
// ──────────────────────────────────────────────────────────────

const FEATURES = [
  // Already complete
  { name: "Scoring Engine", status: "Done", phase: "Done", priority: "P0", category: "Engine" },
  { name: "API Routes (10 endpoints)", status: "Done", phase: "Done", priority: "P0", category: "Engine" },
  { name: "ACG + Geodetic + Paran Lines", status: "Done", phase: "Done", priority: "P0", category: "Engine" },
  { name: "Design System + Brand Tokens", status: "Done", phase: "Done", priority: "P0", category: "Design System" },

  // Phase 1 — Core infra
  { name: "Database Schema (Supabase)", status: "Not Started", phase: "Phase 1", priority: "P0", category: "Infrastructure" },
  { name: "Authentication (Login + Signup)", status: "Not Started", phase: "Phase 1", priority: "P0", category: "Infrastructure" },

  // Phase 1 — User flows (mockups exist)
  { name: "Onboarding Wizard (6 Screens)", status: "Mockup Done", phase: "Phase 1", priority: "P0", category: "User Flow" },
  { name: "App Home Dashboard", status: "Mockup Done", phase: "Phase 1", priority: "P0", category: "User Flow" },
  { name: "Life Goals (Edit + Find Cities CTA)", status: "Mockup Done", phase: "Phase 1", priority: "P1", category: "User Flow" },

  // Phase 1 — New Reading wizard (unified)
  { name: "New Reading Wizard (Unified)", status: "Not Started", phase: "Phase 1", priority: "P0", category: "User Flow" },

  // Phase 1 — Pages
  { name: "User Profile", status: "Not Started", phase: "Phase 1", priority: "P1", category: "User Flow" },
  { name: "Reading Results Page", status: "Not Started", phase: "Phase 1", priority: "P0", category: "Feature" },
  { name: "Reading History Page", status: "Not Started", phase: "Phase 1", priority: "P0", category: "Feature" },
  { name: "Natal Chart Viewer", status: "Not Started", phase: "Phase 1", priority: "P3", category: "Feature" },
  { name: "Shared Components (Extract)", status: "Not Started", phase: "Phase 1", priority: "P0", category: "Design System" },

  // Phase 2
  { name: "Paywall (Stripe Checkout)", status: "Not Started", phase: "Phase 2", priority: "P0", category: "Monetization" },
  { name: "Transactional Email (Resend)", status: "Not Started", phase: "Phase 2", priority: "P1", category: "Monetization" },
  { name: "Performance Caching", status: "Not Started", phase: "Phase 2", priority: "P2", category: "Infrastructure" },
  { name: "Launch Prep (SEO, Analytics)", status: "Not Started", phase: "Phase 2", priority: "P1", category: "Infrastructure" },

  // Phase 1 — New chart & map features
  { name: "Chart Wheel (AstroChart SVG)", status: "Not Started", phase: "Phase 1", priority: "P1", category: "Feature" },
  { name: "ACG Map Component (Reusable)", status: "Not Started", phase: "Phase 1", priority: "P1", category: "Feature" },
  { name: "Mundane Astrology (Country Charts)", status: "Not Started", phase: "Phase 1", priority: "P2", category: "Feature" },
];

// ──────────────────────────────────────────────────────────────
// DEDUPLICATE + SYNC DATABASE
// ──────────────────────────────────────────────────────────────

async function deduplicateAndSync() {
  console.log("\n🔍 Fetching all pages from PRD database...");

  // Fetch ALL pages (handle pagination)
  let allPages = [];
  let cursor = undefined;
  do {
    const body = cursor ? { start_cursor: cursor } : {};
    const resp = await notionFetch(`/databases/${PRD_DB_ID}/query`, "POST", body);
    allPages = allPages.concat(resp.results);
    cursor = resp.has_more ? resp.next_cursor : undefined;
  } while (cursor);

  console.log(`  Found ${allPages.length} pages total.`);

  // Group by name to find duplicates
  const byName = {};
  for (const page of allPages) {
    const title = page.properties?.Name?.title?.[0]?.text?.content;
    if (!title) continue;
    if (!byName[title]) byName[title] = [];
    byName[title].push(page.id);
  }

  // Delete duplicates (keep first, delete rest)
  let deleted = 0;
  for (const [name, ids] of Object.entries(byName)) {
    if (ids.length > 1) {
      console.log(`  🗑️  Duplicate found: "${name}" (${ids.length} copies)`);
      for (let i = 1; i < ids.length; i++) {
        await notionFetch(`/pages/${ids[i]}`, "PATCH", { archived: true });
        deleted++;
        await new Promise(r => setTimeout(r, 150));
      }
    }
  }
  console.log(`  ✅ Deleted ${deleted} duplicate pages.`);

  // Delete pages that no longer match any canonical feature
  const canonicalNames = new Set(FEATURES.map(f => f.name));
  for (const [name, ids] of Object.entries(byName)) {
    if (!canonicalNames.has(name)) {
      console.log(`  🗑️  Stale feature: "${name}" — archiving`);
      await notionFetch(`/pages/${ids[0]}`, "PATCH", { archived: true });
      deleted++;
      await new Promise(r => setTimeout(r, 150));
    }
  }

  // Now upsert all canonical features
  console.log("\n📊 Syncing canonical features...");
  const existingNames = new Set(Object.keys(byName));

  for (const feat of FEATURES) {
    if (existingNames.has(feat.name) && byName[feat.name]?.length > 0) {
      // Update existing
      try {
        await notionFetch(`/pages/${byName[feat.name][0]}`, "PATCH", {
          properties: {
            Status: { select: { name: feat.status } },
            Priority: { select: { name: feat.priority } },
            Stage: { select: { name: feat.phase } },
            Category: { select: { name: feat.category } },
          }
        });
        console.log(`  ✅ Updated: ${feat.name} → ${feat.status}`);
      } catch (e) {
        console.log(`  ⚠️  Could not update ${feat.name}: ${e.message}`);
      }
    } else {
      // Create new
      try {
        await notionFetch("/pages", "POST", {
          parent: { database_id: PRD_DB_ID },
          properties: {
            Name: { title: [{ text: { content: feat.name } }] },
            Status: { select: { name: feat.status } },
            Priority: { select: { name: feat.priority } },
            Stage: { select: { name: feat.phase } },
            Category: { select: { name: feat.category } },
          },
        });
        console.log(`  ✨ Created: ${feat.name}`);
      } catch (e) {
        console.log(`  ⚠️  Could not create ${feat.name}: ${e.message}`);
      }
    }
    await new Promise(r => setTimeout(r, 200));
  }
}

// ──────────────────────────────────────────────────────────────
// REBUILD PRD PAGE
// ──────────────────────────────────────────────────────────────

const PRD_BLOCKS = [
  h1("Astronat MVP — Product Requirements Document"),
  richP([
    { text:"Updated: ", bold:true }, { text:"March 29, 2026  •  " },
    { text:"Status: ", bold:true }, { text:"Phase 1 In Progress" },
  ]),
  callout("Pilot Launch: June 7, 2026. Phase 1 by May 14. Phase 2 by May 30.", "🗓️"),
  empty(),
  toc(),
  div(),

  // ── ARCHITECTURE ──────────────────────────────────────────────
  h2("Flow Architecture"),
  callout("Every feature card on App Home funnels into a unified New Reading wizard. Every path produces a reading result.", "🎯"),
  empty(),
  p("App Home → New Reading Wizard (5 types) → Reading Results"),
  empty(),
  table(
    ["Reading Type", "Deep-link", "Input", "Output"],
    [
      ["Trip", "?type=trip", "Pick destination", "Full reading at /reading/[id]"],
      ["Relocation", "?type=relocation", "Pick destination", "Full reading (relocation weights)"],
      ["Birthday", "?type=birthday", "Pick year", "Top 5 cities → click for full reading"],
      ["Couples", "?type=couples", "Partner data + destination", "3-column comparison"],
      ["Goals", "?type=goals", "Confirm life goals", "Top 5 cities → click for full reading"],
    ]
  ),
  div(),

  // ── STATUS ────────────────────────────────────────────────────
  h2("Feature Status"),
  empty(),

  h3("✅ Complete"),
  table(
    ["Feature", "Category"],
    [
      ["Scoring Engine (scoring.ts)", "Engine"],
      ["API Routes (10 endpoints)", "Engine"],
      ["ACG + Geodetic + Paran Lines", "Engine"],
      ["Design System + Brand Tokens", "Design System"],
    ]
  ),
  empty(),

  h3("Phase 1 — Build Order"),
  callout("Build in this order: Database → Auth → Shared Components → Onboarding → App Home → New Reading Wizard → Life Goals → Reading Results → Reading History → Profile → Chart", "🚀"),
  empty(),
  table(
    ["#", "Prompt", "Feature", "Status"],
    [
      ["1", "01-database.md", "Supabase SQL Schema + RLS", "Not Started"],
      ["2", "02-auth.md", "Auth (OAuth + Magic Link + Handoff)", "Not Started"],
      ["3", "13-shared-components.md", "Extract Pill, VerdictLabel, Starburst", "Not Started"],
      ["4", "03-onboarding.md", "6-Screen Wizard (localStorage state)", "Mockup Done"],
      ["5", "04-app-home.md", "Dashboard (cards → /new-reading?type=...)", "Mockup Done"],
      ["6", "17-new-reading.md", "Unified New Reading Wizard (5 types)", "Not Started"],
      ["7", "05-life-goals.md", "Goals (edit + 'Find cities' CTA)", "Mockup Done"],
      ["8", "14-reading-results.md", "Reading Results /reading/[id]", "Not Started"],
      ["9", "15-reading-history.md", "Reading History /readings", "Not Started"],
      ["10", "08-profile.md", "User Profile + Account", "Not Started"],
      ["11", "16-chart-viewer.md", "Natal Chart Viewer /chart", "Not Started"],
    ]
  ),
  empty(),
  p("Reference docs (merged into 17-new-reading): 06-birthday-optimizer.md, 07-couples-family.md"),
  div(),

  h3("Phase 2 — Monetization (May 15 → May 30)"),
  table(
    ["#", "Prompt", "Feature", "Status"],
    [
      ["12", "09-paywall.md", "Stripe Checkout + Blurred Gate UI", "Not Started"],
      ["13", "10-email.md", "Resend (Purchase + Welcome + Re-engagement)", "Not Started"],
      ["14", "11-performance.md", "Natal Cache + Search Cache", "Not Started"],
      ["15", "12-polish.md", "SEO, OG Tags, PostHog, Legal", "Not Started"],
    ]
  ),
  div(),

  // ── DESIGN RULES ──────────────────────────────────────────────
  h2("Design Consistency Rules"),
  callout("Every prompt references .agents/skills/astro-design/SKILL.md and app/globals.css.", "⚠️"),
  bullet("Icons: Lucide SVGs only — no emojis in UI"),
  bullet("Cards: var(--shape-asymmetric-md) or clip-path: var(--cut-md)"),
  bullet("Verdicts: ≥80 Sage, 65-79 Blue, 50-64 Gold, 35-49 Spiced, <35 Mars Red"),
  bullet("Logo: /logo-stacked.svg with .onboarding-logo class for dark/light"),
  bullet("Demo mode: ?demo=true supported on all pages"),
  div(),

  h2("Feature Database"),
  p("👇 Canonical feature list. Each entry has status, priority, phase, and category."),
  empty(),
];

async function clearPageBlocks(pageId) {
  console.log("\n🧹 Clearing page blocks...");
  const blocks = await notionFetch(`/blocks/${pageId}/children?page_size=100`);
  let deleted = 0;
  for (const block of blocks.results || []) {
    if (block.type === "child_database") { console.log(`  ⏭  Keeping DB: ${block.id}`); continue; }
    try { await notionFetch(`/blocks/${block.id}`, "DELETE"); deleted++; } catch {}
  }
  console.log(`  ✅ Deleted ${deleted} blocks.`);
}

async function main() {
  // 1. Deduplicate and sync features database
  await deduplicateAndSync();

  // 2. Rebuild PRD page
  await clearPageBlocks(PRODUCT_PAGE_ID);

  console.log(`\n📝 Appending ${PRD_BLOCKS.length} blocks...`);
  const CHUNK = 100;
  for (let i = 0; i < PRD_BLOCKS.length; i += CHUNK) {
    const chunk = PRD_BLOCKS.slice(i, i + CHUNK);
    await notionFetch(`/blocks/${PRODUCT_PAGE_ID}/children`, "PATCH", { children: chunk });
    console.log(`  ✅ Blocks ${i+1}–${i+chunk.length}`);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log("\n🎉 Notion audit complete: PRD rebuilt, duplicates removed, features synced.");
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
