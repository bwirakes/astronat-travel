/**
 * Geodetic Weather backtest runner.
 *
 * USAGE (requires Next dev server running on localhost:3000):
 *   ./node_modules/.bin/next dev &   # start dev server in background
 *   npx tsx app/lib/geodetic/__tests__/backtest-runner.ts
 *   # → writes markdown report to app/lib/geodetic/__tests__/backtest-report.md
 *
 * Calls the local /api/geodetic-weather endpoint for each fixture, computes
 * aggregate metrics, and emits a markdown summary. Designed for manual
 * regression checks, not CI — the swisseph WASM runtime only works inside
 * the Next.js process.
 */
import { CASES, TIER_INDEX, TIER_MIDPOINT, type BacktestCase } from "./historical-events.fixtures";
import { promises as fs } from "node:fs";
import path from "node:path";

const API = process.env.GEODETIC_API ?? "http://localhost:3000/api/geodetic-weather";
const REPORT = path.join(__dirname, "backtest-report.md");

interface RawResult {
    score: number;
    severity: string;
    severityPreShift: string;
    breakdown: {
        tierShift: number;
        bucketAngle: number; bucketParan: number; bucketStation: number;
        bucketIngress: number; bucketEclipse: number; bucketLate: number; bucketConfig: number;
    };
    events: Array<{ layer: string; severity: number; planets?: string[]; label: string }>;
    oobPlanets: Array<{ name: string; declination: number }>;
    severityModifiers: Array<{ label: string }>;
}

async function scoreCase(c: BacktestCase): Promise<RawResult> {
    const res = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date: c.dateUtc, destLat: c.lat, destLon: c.lon }),
    });
    if (!res.ok) throw new Error(`${c.id}: ${res.status} ${res.statusText}`);
    return res.json();
}

async function scoreAt(date: string, lat: number, lon: number): Promise<number> {
    const res = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, destLat: lat, destLon: lon }),
    });
    if (!res.ok) throw new Error(`score ${date} ${lat},${lon}: ${res.status}`);
    const j = await res.json();
    return j.score;
}

interface PerCaseMetric {
    case: BacktestCase;
    result: RawResult;
    tierPass: boolean;
    layerRecall: number;          // 0-1
    calibrationError: number;     // |score − expectedMidpoint|
    regionalDelta?: number;        // |scoreEvent − scoreControl|
}

function layerHits(events: RawResult["events"], expected: string[]): number {
    if (expected.length === 0) return 1; // trivially satisfied
    let hits = 0;
    for (const exp of expected) {
        if (events.some(e => e.layer === exp)) hits++;
    }
    return hits / expected.length;
}

async function run() {
    console.log(`Running ${CASES.length} backtest cases against ${API}…\n`);
    const results: PerCaseMetric[] = [];

    for (const c of CASES) {
        try {
            const result = await scoreCase(c);
            const actualTierIdx = TIER_INDEX[result.severity as keyof typeof TIER_INDEX] ?? -1;
            const expectedTierIdx = TIER_INDEX[c.expectedMinTier];
            const tierPass = actualTierIdx >= expectedTierIdx;
            const layerRecall = layerHits(result.events, c.expectedLayers);
            const expectedMidpoint = TIER_MIDPOINT[c.expectedMinTier];
            const calibrationError = Math.abs(result.score - expectedMidpoint);

            let regionalDelta: number | undefined;
            if (c.regionalControl) {
                const controlScore = await scoreAt(c.dateUtc, c.regionalControl.lat, c.regionalControl.lon);
                regionalDelta = Math.abs(result.score - controlScore);
            }

            results.push({ case: c, result, tierPass, layerRecall, calibrationError, regionalDelta });
            console.log(`  ${c.id}: score=${result.score} sev=${result.severity} ${tierPass ? "✓" : "✗"} layerRecall=${(layerRecall*100).toFixed(0)}%`);
        } catch (err) {
            console.error(`  ${c.id}: ERR ${err instanceof Error ? err.message : err}`);
        }
    }

    // ── Aggregate metrics ─────────────────────────────────────────────────
    const total = results.length;
    const tierPassCount = results.filter(r => r.tierPass).length;
    const layerRecallAvg = results.reduce((s, r) => s + r.layerRecall, 0) / total;
    const calibrationMAE = results.reduce((s, r) => s + r.calibrationError, 0) / total;

    const nullControls = results.filter(r => r.case.category === "control-calm");
    const falsePositives = nullControls.filter(r => {
        const idx = TIER_INDEX[r.result.severity as keyof typeof TIER_INDEX] ?? 0;
        return idx >= TIER_INDEX.Severe;
    });
    const nonNulls = results.filter(r => r.case.category !== "control-calm");
    const regionalChecks = results.filter(r => r.regionalDelta !== undefined);

    // Per-category summary
    const byCat = new Map<string, { n: number; pass: number }>();
    for (const r of results) {
        const k = r.case.category;
        const cur = byCat.get(k) ?? { n: 0, pass: 0 };
        cur.n++; if (r.tierPass) cur.pass++;
        byCat.set(k, cur);
    }

    // ── Write report ──────────────────────────────────────────────────────
    const md: string[] = [];
    md.push(`# Geodetic Weather — Backtest Report`);
    md.push(``);
    md.push(`Run: ${new Date().toISOString()}`);
    md.push(`Cases: **${total}** · API: ${API}`);
    md.push(``);
    md.push(`## Aggregate metrics`);
    md.push(``);
    md.push(`| Metric | Value | Target |`);
    md.push(`|---|---|---|`);
    md.push(`| Tier-match accuracy | **${(tierPassCount/total*100).toFixed(1)}%** (${tierPassCount}/${total}) | ≥ 85% |`);
    md.push(`| Layer attribution recall | **${(layerRecallAvg*100).toFixed(1)}%** | ≥ 80% |`);
    md.push(`| Null-control false-positive | **${(falsePositives.length/Math.max(nullControls.length,1)*100).toFixed(1)}%** (${falsePositives.length}/${nullControls.length}) | ≤ 10% |`);
    md.push(`| Score calibration MAE | **${calibrationMAE.toFixed(1)}** | ≤ 15 |`);
    if (regionalChecks.length) {
        const avgDelta = regionalChecks.reduce((s, r) => s + (r.regionalDelta ?? 0), 0) / regionalChecks.length;
        md.push(`| Avg regional delta | **${avgDelta.toFixed(1)}** pts | ≥ 15 |`);
    }
    md.push(``);

    md.push(`## By category`);
    md.push(``);
    md.push(`| Category | n | tier pass |`);
    md.push(`|---|---|---|`);
    for (const [cat, v] of byCat.entries()) {
        md.push(`| ${cat} | ${v.n} | ${v.pass}/${v.n} (${(v.pass/v.n*100).toFixed(0)}%) |`);
    }
    md.push(``);

    md.push(`## Per-case detail`);
    md.push(``);
    md.push(`| Case | Score | Tier | Expected | Pass | LayerRecall | Calib | RegionalΔ | Top event |`);
    md.push(`|---|---|---|---|---|---|---|---|---|`);
    for (const r of results) {
        const top = r.result.events[0];
        const topStr = top ? `${top.layer}: ${top.label.slice(0, 50)} (${top.severity})` : "—";
        md.push(
            `| ${r.case.id} | ${r.result.score} | ${r.result.severity} | ≥${r.case.expectedMinTier} | ${r.tierPass ? "✓" : "✗"} | ${(r.layerRecall*100).toFixed(0)}% | ${r.calibrationError.toFixed(0)} | ${r.regionalDelta ?? "—"} | ${topStr} |`
        );
    }
    md.push(``);

    md.push(`## Tier shifts fired`);
    md.push(``);
    for (const r of results) {
        if (r.result.breakdown.tierShift > 0) {
            const mods = r.result.severityModifiers.map(m => m.label).join("; ");
            md.push(`- **${r.case.id}** +${r.result.breakdown.tierShift}: ${mods}`);
        }
    }
    md.push(``);

    await fs.writeFile(REPORT, md.join("\n"));
    console.log(`\nReport: ${REPORT}`);
    console.log(`\nTier-match: ${tierPassCount}/${total} · Layer recall: ${(layerRecallAvg*100).toFixed(0)}% · FP: ${falsePositives.length}/${nullControls.length} · Calib MAE: ${calibrationMAE.toFixed(1)}`);
}

run().catch(err => { console.error(err); process.exit(1); });
