import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.resolve(root, "dist");
if (path.dirname(output) !== root || path.basename(output) !== "dist") {
  throw new Error("Refusing to build outside the expected dist directory.");
}

const publishEntries = [
  "index.html",
  "admin-demo",
  "assets",
  "config",
  "img",
  "nettbutikk-demo"
];

await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });

for (const entry of publishEntries) {
  const source = path.join(root, entry);
  const destination = path.join(output, entry);
  await fs.cp(source, destination, { recursive: true });
}

console.log(`Netlify-pakke opprettet med ${publishEntries.length} eksplisitte innslag.`);
