/**
 * GET /api/intake/setup
 * One-time setup: adds all required properties to the Notion intake database.
 * Returns a diff of what was there before and after.
 * Blocked in production.
 */

import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const NOTION_INTAKE_DB_ID = process.env.NOTION_INTAKE_DB_ID!;

const REQUIRED_PROPERTIES: Record<string, any> = {
  Status: {
    select: {
      options: [
        { name: "New", color: "blue" },
        { name: "In Review", color: "yellow" },
        { name: "Contacted", color: "orange" },
        { name: "Qualified", color: "green" },
        { name: "Not a Fit", color: "red" },
      ],
    },
  },
  "Submitted At": { date: {} },
  "Contact Name": { rich_text: {} },
  "Contact Email": { email: {} },
  "Contact Phone": { phone_number: {} },
  "Contact Title": { rich_text: {} },
  "Preferred Contact": { select: {} },
  "Referral Source": { select: {} },
  "Company Legal Name": { rich_text: {} },
  "Trading Name": { rich_text: {} },
  "Incorporation Country": { rich_text: {} },
  "Incorporation City": { rich_text: {} },
  "Incorporation Date": { rich_text: {} },
  "Incorporation Time": { rich_text: {} },
  "Business Stage": { select: {} },
  "Industry Sectors": { multi_select: {} },
  "Target Markets": { multi_select: {} },
  "Expansion Purpose": { multi_select: {} },
  "First International": { select: {} },
  "Decision Timeline": { select: {} },
  "Key Decisions": { multi_select: {} },
  "Territories Leaning Toward": { rich_text: {} },
  "Territories Cautious About": { rich_text: {} },
  "Exec Chart Mapping": { select: {} },
  "Team Size": { select: {} },
  "Exec Relocation": { select: {} },
  "Service Tier": { select: {} },
  "Budget One-Time": { select: {} },
  "Budget Monthly": { select: {} },
  "Budget Annual": { select: {} },
  "Budget Approved": { select: {} },
  "Decision Maker": { select: {} },
  "Finance Requirements": { multi_select: {} },
  "Prior Astrology Experience": { select: {} },
  "Internal Usage": { multi_select: {} },
  "NDA Requirements": { select: {} },
};

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  if (!NOTION_INTAKE_DB_ID) {
    return NextResponse.json({ error: "NOTION_INTAKE_DB_ID env var is not set" }, { status: 500 });
  }

  const notion = new Client({ auth: process.env.NOTION_API_KEY });

  // Push all required properties directly (idempotent — Notion ignores existing ones)
  let updateError: string | null = null;
  try {
    await notion.databases.update({
      database_id: NOTION_INTAKE_DB_ID,
      properties: REQUIRED_PROPERTIES,
    });
  } catch (err: any) {
    updateError = err.message;
    return NextResponse.json({
      status: "update_failed",
      error: err.message,
    }, { status: 500 });
  }

  // Verify by re-retrieving
  const after = await notion.databases.retrieve({ database_id: NOTION_INTAKE_DB_ID });
  const allProps = after.properties ? Object.keys(after.properties) : [];
  const stillMissing = Object.keys(REQUIRED_PROPERTIES).filter((k) => !allProps.includes(k));

  return NextResponse.json({
    status: stillMissing.length === 0 ? "success" : "partial",
    allProperties: allProps,
    stillMissing,
    updateError,
  });
}
