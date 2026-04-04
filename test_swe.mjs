import SwissEph from 'swisseph-wasm';
const sw = new SwissEph();
async function test() {
    try {
        console.log("Starting initialization...");
        await sw.initSwissEph();
        console.log("Initialized!");
        const jd = sw.julday(2000, 1, 1, 12, 1);
        console.log("JD:", jd);
    } catch (e) {
        console.log("Error:", e.stack);
    }
}
test();
