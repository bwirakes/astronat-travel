import fs from "fs";

let content = fs.readFileSync("app/components/worldMapPath.ts", "utf8");

// We know the first part worked: export const WORLD_MAP_PATH = `
// We just need to replace the last double quote with a backtick

let idx = content.lastIndexOf('"');
if (idx !== -1) {
    content = content.substring(0, idx) + '`' + content.substring(idx + 1);
}

fs.writeFileSync("app/components/worldMapPath.ts", content);
console.log("Last quote replaced manually.");
