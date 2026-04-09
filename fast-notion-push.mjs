import fs from "fs";
import path from "path";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DB_ID = "33b0ae6d-4cd3-8168-bf0c-d81a1729330d"; // The PRD Database created recently.
const BASE_URL = "https://api.notion.com/v1";

if (!NOTION_API_KEY) {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
}

async function fetchNotion(path, method = "GET", body = null) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function run() {
  console.log("Fetching existing pages...");
  const pages = await fetchNotion(`/databases/${DB_ID}/query`, "POST", {});
  
  // 1. Mark existing foundation tasks as Done & Archived
  for (const p of pages.results) {
    const name = p.properties.Name?.title[0]?.plain_text || "";
    if (["Scoring Engine", "Profile Persistence", "Database"].includes(name)) {
      await fetchNotion(`/pages/${p.id}`, "PATCH", {
        properties: { Status: { select: { name: "Built" } }, Archived: { checkbox: true } }
      });
      console.log(`Archived ${name}`);
    }
  }

  // 2. Add new roadmap specific tracking item
  console.log("Pushing new Roadmap Epics...");
  const newFeatures = [
    { name: "Model and Engine Score Validation", status: "Not Started", stage: "Stage 2 — Polish" },
    { name: "Productionize Mockups (ACG/Natal)", status: "Not Started", stage: "Stage 2 — Polish" },
    { name: "Geodetic Map Finalization", status: "Not Started", stage: "Stage 2 — Polish" }
  ];

  for (const f of newFeatures) {
    await fetchNotion("/pages", "POST", {
      parent: { database_id: DB_ID },
      properties: {
        Name: { title: [{ text: { content: f.name } }] },
        Status: { select: { name: f.status } },
        Stage: { select: { name: f.stage } }
      }
    });
    console.log(`Added ${f.name}`);
  }
  console.log("Done syncing to Notion!");
}

run().catch(console.error);
