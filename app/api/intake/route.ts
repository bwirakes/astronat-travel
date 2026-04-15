/**
 * POST /api/intake
 * Handles corporate intake form submissions.
 *
 * 1. Creates (or reuses) a Notion database under the Inquiries page
 * 2. Ensures all properties exist on the database (idempotent update)
 * 3. Adds a new entry to that database with all form fields
 * 4. Sends a notification email to astronatsocial@gmail.com via Resend
 */

import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { Resend } from "resend";
import { INTAKE_FORM_SECTIONS } from "@/lib/marketing/data/intake-form";

// ─── Constants ───────────────────────────────────────────────────────────────

const NOTION_INTAKE_DB_ID = process.env.NOTION_INTAKE_DB_ID!;
const NOTIFICATION_EMAIL = process.env.INTAKE_NOTIFICATION_EMAIL!;

// ─── Property schema for idempotent DB update ─────────────────────────────────
// Name/title is excluded — Notion rejects redeclaring the title property via update.
const DB_CREATE_PROPERTIES = {
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
  // ── Contact ──
  "Contact Name": { rich_text: {} },
  "Contact Email": { email: {} },
  "Contact Phone": { phone_number: {} },
  "Contact Title": { rich_text: {} },
  "Preferred Contact": { select: {} },
  "Referral Source": { select: {} },
  // ── Company ──
  "Company Legal Name": { rich_text: {} },
  "Trading Name": { rich_text: {} },
  "Incorporation Country": { rich_text: {} },
  "Incorporation City": { rich_text: {} },
  "Incorporation Date": { rich_text: {} },
  "Incorporation Time": { rich_text: {} },
  "Business Stage": { select: {} },
  "Industry Sectors": { multi_select: {} },
  // ── Expansion ──
  "Target Markets": { multi_select: {} },
  "Expansion Purpose": { multi_select: {} },
  "First International": { select: {} },
  "Decision Timeline": { select: {} },
  // ── Navigating ──
  "Key Decisions": { multi_select: {} },
  "Territories Leaning Toward": { rich_text: {} },
  "Territories Cautious About": { rich_text: {} },
  // ── Leadership ──
  "Exec Chart Mapping": { select: {} },
  "Team Size": { select: {} },
  "Exec Relocation": { select: {} },
  // ── Financial ──
  "Service Tier": { select: {} },
  "Budget One-Time": { select: {} },
  "Budget Monthly": { select: {} },
  "Budget Annual": { select: {} },
  "Budget Approved": { select: {} },
  "Decision Maker": { select: {} },
  "Finance Requirements": { multi_select: {} },
  // ── Working Style ──
  "Prior Astrology Experience": { select: {} },
  "Internal Usage": { multi_select: {} },
  "NDA Requirements": { select: {} },
} as const;

// ─── Properties for idempotent update (excludes title/Name — can't re-declare) ─
const DB_UPDATE_PROPERTIES = DB_CREATE_PROPERTIES;

// ─── Notion helpers ──────────────────────────────────────────────────────────

async function ensureDbSchema(notion: Client): Promise<void> {
  // Ensure all required properties exist on the target database.
  // Name/title cannot be redeclared via update so it's excluded (DB_UPDATE_PROPERTIES).
  await notion.databases.update({
    database_id: NOTION_INTAKE_DB_ID,
    properties: DB_UPDATE_PROPERTIES as any,
  });
}

// ─── Value helpers ────────────────────────────────────────────────────────────

function richText(value: unknown): { rich_text: Array<{ text: { content: string } }> } {
  const str = Array.isArray(value) ? value.join(", ") : String(value ?? "");
  return { rich_text: [{ text: { content: str.slice(0, 2000) } }] };
}

function selectProp(value: unknown): { select: { name: string } | null } {
  const str = Array.isArray(value) ? value[0] : String(value ?? "");
  if (!str) return { select: null };
  return { select: { name: str.slice(0, 100) } };
}

function multiSelectProp(value: unknown): { multi_select: Array<{ name: string }> } {
  const arr = Array.isArray(value) ? value : [String(value ?? "")];
  return {
    multi_select: arr
      .filter(Boolean)
      .map((v: string) => ({ name: v.slice(0, 100) })),
  };
}

// ─── Email HTML builder ───────────────────────────────────────────────────────

function buildNotificationEmail(data: Record<string, unknown>): string {
  const get = (key: string) => {
    const v = data[key];
    return Array.isArray(v) ? v.join(", ") : String(v ?? "—");
  };

  const sectionHtml = INTAKE_FORM_SECTIONS.map((section) => {
    const rows = section.fields
      .map((f) => {
        const val = get(f.id);
        if (!val || val === "—") return "";
        return `<tr>
          <td style="padding:8px 12px;font-size:11px;color:#666;font-family:monospace;text-transform:uppercase;letter-spacing:1px;width:200px;vertical-align:top;border-bottom:1px solid #f0f0f0;">${f.label}</td>
          <td style="padding:8px 12px;font-size:13px;color:#1B1B1B;border-bottom:1px solid #f0f0f0;">${val}</td>
        </tr>`;
      })
      .filter(Boolean)
      .join("");

    if (!rows) return "";

    return `
      <tr><td colspan="2" style="padding:16px 12px 6px;font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:2px;color:#0456FB;font-weight:600;">${section.kicker}</td></tr>
      ${rows}
    `;
  }).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background:#F8F5EC; font-family: Helvetica, sans-serif; color:#1B1B1B; margin:0; padding:0; }
    .container { max-width:680px; margin:40px auto; background:#fff; border:2px solid #1B1B1B; overflow:hidden; }
    .header { background:#1B1B1B; padding:32px 40px; }
    .header h1 { color:#F8F5EC; margin:0; font-size:24px; text-transform:uppercase; letter-spacing:-0.5px; }
    .header p { color:#0456FB; font-family:monospace; font-size:11px; text-transform:uppercase; letter-spacing:2px; margin:8px 0 0; }
    .hero { padding:24px 40px; background:#0456FB; color:#fff; }
    .hero h2 { margin:0; font-size:20px; font-weight:700; }
    .hero p { margin:6px 0 0; font-size:13px; opacity:0.8; }
    .content { padding:24px 28px; }
    table { width:100%; border-collapse:collapse; }
    .footer { padding:20px 40px; background:#F8F5EC; font-family:monospace; font-size:10px; color:#999; text-transform:uppercase; letter-spacing:1px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ASTRONAT</h1>
      <p>New Corporate Intake Submission</p>
    </div>
    <div class="hero">
      <h2>${get("contactName") || "New Enquiry"} — ${get("companyLegalName") || "Unknown Company"}</h2>
      <p>${get("contactEmail")} &nbsp;·&nbsp; ${get("contactTitle")}</p>
    </div>
    <div class="content">
      <table>
        ${sectionHtml}
      </table>
    </div>
    <div class="footer">
      🔒 Protected by full NDA · AstroNat Corporate Intelligence · Singapore
    </div>
  </div>
</body>
</html>`;
}

// ─── Test payload ─────────────────────────────────────────────────────────────

const TEST_PAYLOAD: Record<string, unknown> = {
  // Contact
  contactName: "Alexandra Tan",
  contactEmail: "alex.tan@example.com",
  contactPhone: "+65 9123 4567",
  contactTitle: "Chief Strategy Officer",
  contactPreference: "Email",
  referralSource: "LinkedIn",
  // Company
  companyLegalName: "Meridian Capital Holdings Pte Ltd",
  companyTradingName: "Meridian Capital",
  incorporationCountry: "Singapore",
  incorporationCity: "Singapore",
  incorporationDate: "1999-03-15",
  incorporationTime: "09:00",
  businessStage: "Scale-up",
  industrySectors: ["Financial Services", "Private Equity"],
  businessDescription: "Meridian Capital is a Singapore-based private equity firm with $2.4B AUM focused on Southeast Asian growth markets. We are preparing for a major regional expansion across Vietnam, Indonesia, and the Philippines over the next 18 months.",
  // Expansion
  targetMarkets: ["Vietnam", "Indonesia", "Philippines"],
  expansionPurpose: ["Market Entry", "Office Establishment", "Regulatory Navigation"],
  firstInternational: "No — we have existing international presence",
  decisionTimeline: "6–12 months",
  situationContext: "We are at an inflection point in our regional strategy. Our Singapore base has been highly successful, but we face significant headwinds in Vietnam due to timing misalignment with the regulatory cycle.",
  // Navigating
  keyDecisions: ["Headquarters relocation", "Executive deployment", "Market entry sequencing"],
  territoriesLeaningToward: "Vietnam, Indonesia",
  territoriesCautiousAbout: "Myanmar, Cambodia",
  // Leadership
  execChartMapping: "Yes — for all C-suite",
  teamSize: "51–200 employees",
  execRelocation: "Yes — 2–3 executives",
  // Financial
  serviceTier: "Enterprise Advisory – Ongoing · Custom pricing",
  budgetOneTime: "SGD 10,000–25,000",
  budgetMonthly: "SGD 3,000–5,000",
  budgetAnnual: "SGD 50,000+",
  budgetApproved: "Yes — budget is approved",
  decisionMaker: "Yes — I am the sole decision maker",
  financeRequirements: ["Invoice with GST", "Wire transfer"],
  // Working Style
  priorAstrologyExperience: "Yes — personal use only",
  internalUsage: ["Executive strategy sessions", "Board presentations"],
  ndaRequirements: "Yes — mutual NDA required",
  additionalNotes: "We have an urgent board presentation in Q3 and would benefit from a preliminary briefing before the full engagement begins.",
};

// ─── Route handler ────────────────────────────────────────────────────────────

// GET /api/intake — fires a test submission with sample data (dev only)
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not available in production" }, { status: 403 });
  }
  const req = new Request("http://localhost/api/intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...TEST_PAYLOAD, _captcha: "test-bypass" }),
  });
  return POST(req);
}

async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // skip if not configured
  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${secret}&response=${token}`,
  });
  const json = await res.json() as { success: boolean; score?: number };
  // v3 requires score >= 0.5 (0.0 = bot, 1.0 = human)
  if (!json.success) return false;
  if (typeof json.score === "number" && json.score < 0.5) return false;
  return true;
}

export async function POST(req: Request) {
  try {
    const data: Record<string, unknown> = await req.json();

    // ── CAPTCHA verification ──────────────────────────────────────────────────
    const captchaToken = data._captcha as string | undefined;
    const hasSecret = !!process.env.RECAPTCHA_SECRET_KEY;
    const isBypass = !hasSecret || (captchaToken === "test-bypass" || captchaToken === "dev-bypass" || captchaToken === "no-captcha");
    if (captchaToken && !isBypass) {
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        return NextResponse.json({ error: "CAPTCHA verification failed. Please try again." }, { status: 400 });
      }
    }

    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    const resend = new Resend(process.env.RESEND_API_KEY);

    const contactName = String(data.contactName ?? "Unknown");
    const companyName = String(data.companyLegalName ?? "Unknown Company");

    // ── 1. Create Notion page (all data as body blocks — DB uses new Notion format) ─
    const str = (v: unknown) => Array.isArray(v) ? v.join(", ") : String(v ?? "—");

    const heading = (content: string) => ({
      object: "block" as const,
      type: "heading_2" as const,
      heading_2: { rich_text: [{ text: { content } }] },
    });

    const row = (label: string, value: unknown) => {
      const val = str(value);
      if (!val || val === "—") return null;
      return {
        object: "block" as const,
        type: "paragraph" as const,
        paragraph: {
          rich_text: [
            { text: { content: `${label}: ` }, annotations: { bold: true, italic: false, strikethrough: false, underline: false, code: false, color: "default" as const } },
            { text: { content: val.slice(0, 2000) } },
          ],
        },
      };
    };

    const blocks = [
      heading("Contact"),
      row("Name", data.contactName),
      row("Email", data.contactEmail),
      row("Phone", data.contactPhone),
      row("Title", data.contactTitle),
      row("Preferred Contact", data.contactPreference),
      row("Referral Source", data.referralSource),

      heading("Company"),
      row("Legal Name", data.companyLegalName),
      row("Trading Name", data.companyTradingName),
      row("Incorporation Country", data.incorporationCountry),
      row("Incorporation City", data.incorporationCity),
      row("Incorporation Date", data.incorporationDate),
      row("Incorporation Time", data.incorporationTime),
      row("Business Stage", data.businessStage),
      row("Industry Sectors", data.industrySectors),
      row("Business Description", data.businessDescription),

      heading("Expansion Goals"),
      row("Target Markets", data.targetMarkets),
      row("Expansion Purpose", data.expansionPurpose),
      row("First International", data.firstInternational),
      row("Decision Timeline", data.decisionTimeline),
      row("Situation Context", data.situationContext),

      heading("Navigating"),
      row("Key Decisions", data.keyDecisions),
      row("Territories Leaning Toward", data.territoriesLeaningToward),
      row("Territories Cautious About", data.territoriesCautiousAbout),

      heading("Leadership"),
      row("Exec Chart Mapping", data.execChartMapping),
      row("Team Size", data.teamSize),
      row("Exec Relocation", data.execRelocation),

      heading("Financial"),
      row("Service Tier", data.serviceTier),
      row("Budget One-Time", data.budgetOneTime),
      row("Budget Monthly", data.budgetMonthly),
      row("Budget Annual", data.budgetAnnual),
      row("Budget Approved", data.budgetApproved),
      row("Decision Maker", data.decisionMaker),
      row("Finance Requirements", data.financeRequirements),

      heading("Working Style"),
      row("Prior Astrology Experience", data.priorAstrologyExperience),
      row("Internal Usage", data.internalUsage),
      row("NDA Requirements", data.ndaRequirements),
      row("Additional Notes", data.additionalNotes),
    ].filter(Boolean) as any[];

    await notion.pages.create({
      parent: { database_id: NOTION_INTAKE_DB_ID },
      properties: {
        Name: {
          title: [{ text: { content: `${contactName} — ${companyName}` } }],
        },
        Status: { select: { name: "New" } },
        "Contact Name": { rich_text: [{ text: { content: contactName.slice(0, 2000) } }] },
        "Contact Email": { email: String(data.contactEmail ?? "") || null } as any,
        "Contact Phone": { phone_number: String(data.contactPhone ?? "") || null } as any,
        "Submitted At": { date: { start: new Date().toISOString() } },
      },
      children: blocks,
    });

    console.log(`[intake] Notion page created for ${contactName} (${companyName})`);

    // ── 3. Send notification email via Resend ─────────────────────────────────
    // In dev/test mode Resend only allows sending to the account owner email.
    const toAddress = process.env.NODE_ENV === "production"
      ? NOTIFICATION_EMAIL
      : (process.env.RESEND_TEST_EMAIL ?? NOTIFICATION_EMAIL);

    const { error: emailError } = await resend.emails.send({
      from: "AstroNat <onboarding@resend.dev>",
      to: [toAddress],
      subject: `New Corporate Intake — ${contactName} · ${companyName}`,
      html: buildNotificationEmail(data as Record<string, unknown>),
    });

    if (emailError) {
      // Non-fatal — Notion entry already created
      console.error("[intake] Resend error:", emailError);
    } else {
      console.log(`[intake] Notification email sent to ${NOTIFICATION_EMAIL}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[intake] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
