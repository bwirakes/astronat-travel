/**
 * geodetic-predictions-api.test.ts
 *
 * Unit tests for the cached /api/geodetic-predictions route — query param
 * validation + filter composition + cache wiring. No live Supabase round trip:
 * we mock `createAdminClient` and `unstable_cache` so the test runs hermetic.
 */
import { beforeEach, describe, expect, it, mock } from "bun:test";

// --- Mock setup -------------------------------------------------------------

interface MockRow {
    id: string;
    prediction_date: string;
    event_type: string;
    kind: "forecast" | "historical";
    is_published: boolean;
    pss: number;
    tier: string;
}

const ROWS: MockRow[] = [
    { id: "f1", prediction_date: "2026-02-17", event_type: "flood",    kind: "forecast",   is_published: true, pss: 0.79, tier: "critical" },
    { id: "f2", prediction_date: "2026-08-12", event_type: "compound", kind: "forecast",   is_published: true, pss: 0.87, tier: "critical" },
    { id: "h1", prediction_date: "2024-09-26", event_type: "flood",    kind: "historical", is_published: true, pss: 0.78, tier: "critical" },
    { id: "h2", prediction_date: "2025-01-07", event_type: "wildfire", kind: "historical", is_published: true, pss: 0.83, tier: "critical" },
    { id: "x",  prediction_date: "2026-03-03", event_type: "flood",    kind: "forecast",   is_published: false, pss: 0.68, tier: "high" },
];

const createAdminClientMock = mock(() => ({
    from: () => ({
        select: () => ({
            eq: () => ({
                order: () => Promise.resolve({
                    data: ROWS.filter((r) => r.is_published),
                    error: null,
                }),
            }),
        }),
    }),
}));

mock.module("@/lib/supabase/admin", () => ({
    createAdminClient: createAdminClientMock,
}));

// unstable_cache: replace with a passthrough so each test gets a fresh call.
mock.module("next/cache", () => ({
    unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
    revalidateTag: () => undefined,
}));

// --- Import AFTER mocks --------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GET } = require("@/app/api/geodetic-predictions/route") as typeof import("@/app/api/geodetic-predictions/route");

function makeRequest(query: string): import("next/server").NextRequest {
    const url = new URL(`http://localhost/api/geodetic-predictions${query}`);
    return { nextUrl: url } as unknown as import("next/server").NextRequest;
}

// --- Tests ------------------------------------------------------------------

describe("GET /api/geodetic-predictions", () => {
    beforeEach(() => {
        createAdminClientMock.mockClear();
    });

    it("returns all published rows when no filters are applied", async () => {
        const res = await GET(makeRequest(""));
        const json = await res.json();
        expect(json.count).toBe(4);
        expect(json.totalCatalogSize).toBe(4);
        const ids = json.rows.map((r: { id: string }) => r.id);
        expect(ids).toContain("f1");
        expect(ids).not.toContain("x");
        expect(createAdminClientMock.mock.calls.length).toBeGreaterThan(0);
    });

    it("filters by type=flood", async () => {
        const res = await GET(makeRequest("?type=flood"));
        const json = await res.json();
        expect(json.count).toBe(2);
        for (const r of json.rows) expect(r.event_type).toBe("flood");
    });

    it("filters by kind=forecast", async () => {
        const res = await GET(makeRequest("?kind=forecast"));
        const json = await res.json();
        expect(json.count).toBe(2);
        for (const r of json.rows) expect(r.kind).toBe("forecast");
    });

    it("filters by from + to date range", async () => {
        const res = await GET(makeRequest("?from=2026-01-01&to=2026-12-31"));
        const json = await res.json();
        expect(json.count).toBe(2);
        for (const r of json.rows) {
            expect(r.prediction_date >= "2026-01-01").toBe(true);
            expect(r.prediction_date <= "2026-12-31").toBe(true);
        }
    });

    it("composes type + kind + date filters together", async () => {
        const res = await GET(makeRequest("?type=flood&kind=forecast&from=2026-01-01"));
        const json = await res.json();
        expect(json.count).toBe(1);
        expect(json.rows[0].id).toBe("f1");
    });

    it("rejects invalid type with 400 (no DB call)", async () => {
        const res = await GET(makeRequest("?type=meteor"));
        expect(res.status).toBe(400);
        expect(createAdminClientMock.mock.calls.length).toBe(0);
    });

    it("rejects invalid kind with 400 (no DB call)", async () => {
        const res = await GET(makeRequest("?kind=hypothetical"));
        expect(res.status).toBe(400);
        expect(createAdminClientMock.mock.calls.length).toBe(0);
    });

    it("rejects malformed from date with 400 (no DB call)", async () => {
        const res = await GET(makeRequest("?from=2026"));
        expect(res.status).toBe(400);
        expect(createAdminClientMock.mock.calls.length).toBe(0);
    });
});
