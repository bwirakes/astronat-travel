import { computeRealtimePositions } from './lib/astro/transits';

async function main() {
    const now = new Date("2026-04-04T12:00:00Z");
    const positions = await computeRealtimePositions(now);
    console.log("Positions:", JSON.stringify(positions, null, 2));
}
main().catch(console.error);
