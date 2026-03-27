---
name: notion-prd
description: Notion PRD integration — create and manage the Astronat product requirements database via the Notion API. Includes scripts for syncing features from local PRD docs to a Notion database.
---

# Notion PRD Skill

This skill provides scripts and instructions to manage the Astronat PRD database in Notion.

## Configuration

| Key | Value |
|-----|-------|
| **Notion API Key** | Stored in `.env.local` as `NOTION_API_KEY` |
| **Product Page ID** | `3300ae6d4cd3801688a4e72fb48d7642` |
| **API Version** | `2022-06-28` |
| **Base URL** | `https://api.notion.com/v1` |

## Database Schema

The PRD database uses the following properties:

| Property | Type | Description |
|----------|------|-------------|
| **Name** | `title` | Feature name |
| **Status** | `select` | `Not Started`, `In Progress`, `Mockup Exists`, `Built`, `Shipped` |
| **Priority** | `select` | `P0 — Critical`, `P1 — High`, `P2 — Medium`, `P3 — Low` |
| **Stage** | `select` | `Stage 1 — Core`, `Stage 2 — Polish` |
| **Deadline** | `date` | Target completion date |
| **PRD Source** | `select` | Which local doc this came from (`mvp-requirements`, `onboarding-flow`, `analysis-layers`, `scoring-rubric`) |
| **Category** | `select` | `Auth`, `Onboarding`, `Payments`, `Email`, `Database`, `Engine`, `Design`, `Analytics` |
| **Owner** | `rich_text` | Person responsible |

## Scripts

### `scripts/notion-sync.mjs`

The main script for creating the database and populating it with features. Run with:

```bash
node scripts/notion-sync.mjs
```

The script will:
1. Create a new database under the Product page (if not already created)
2. Add all features from the PRD documents as pages
3. Each page includes the feature description as page content (body blocks)

### Re-running

The script is **idempotent for the database** — it checks if a PRD Features database already exists under the Product page before creating a new one. Pages are always appended (not deduplicated) so avoid running the page creation step twice.

## How to Use

### Adding a new feature to Notion

When a new feature is specified in a local PRD doc:

1. Add the feature to the relevant `docs/prd/*.md` file
2. Add an entry to the `FEATURES` array in `scripts/notion-sync.mjs`
3. Run `node scripts/notion-sync.mjs --pages-only` to push just the new pages

### Updating the database schema

If you need to add properties to the database, update the `DATABASE_PROPERTIES` object in `scripts/notion-sync.mjs` and use the Notion API's `PATCH /v1/databases/{id}` endpoint.

## API Reference

- [Create a database](https://developers.notion.com/reference/create-a-database)
- [Create a page](https://developers.notion.com/reference/post-page)
- [Update a database](https://developers.notion.com/reference/update-a-database)
- [Append block children](https://developers.notion.com/reference/patch-block-children)
