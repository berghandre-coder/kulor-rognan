import fs from "node:fs";

const files = process.argv.slice(2);
let checked = 0;

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];

  scripts.forEach((match, index) => {
    try {
      Function(match[1]);
      checked += 1;
    } catch (error) {
      throw new Error(`${file}, inline script ${index + 1}: ${error.message}`);
    }
  });
}

console.log(`Kontrollerte ${checked} inline-skript i ${files.length} HTML-filer.`);
