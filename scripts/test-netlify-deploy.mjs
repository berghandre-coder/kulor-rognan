import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const env = Object.fromEntries(
  (await fs.readFile(path.join(root, ".env"), "utf8"))
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

process.env.SUPABASE_URL = env.SUPABASE_URL;
process.env.SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
process.env.STORE_SLUG = env.STORE_SLUG;

const { handler } = await import("../netlify/functions/public-config.mjs");
const response = await handler();
const config = JSON.parse(response.body);

assert.equal(response.statusCode, 200);
assert.equal(config.enabled, true);
assert.equal(config.supabaseUrl, env.SUPABASE_URL.replace(/\/$/, ""));
assert.equal(config.supabaseAnonKey, env.SUPABASE_ANON_KEY);
assert.equal(config.storeSlug, "kulor-rognan");

const expectedPublished = [
  "index.html",
  "admin-demo/index.html",
  "admin-demo/app.js",
  "assets/supabase-admin.js",
  "assets/supabase-storefront.js",
  "config/stores/kulor-rognan.js",
  "nettbutikk-demo/index.html"
];
for (const relativePath of expectedPublished) {
  await fs.access(path.join(root, "dist", relativePath));
}

const forbiddenPublished = [".env", "docs", "netlify", "scripts", "supabase"];
for (const relativePath of forbiddenPublished) {
  await assert.rejects(fs.access(path.join(root, "dist", relativePath)));
}

const adminHtml = await fs.readFile(path.join(root, "dist/admin-demo/index.html"), "utf8");
assert.match(adminHtml, /\.\.\/assets\/supabase-admin\.js/);
assert.match(adminHtml, /app\.js/);

console.log("Netlify-pakke, runtime-konfig og publiseringsgrenser er korrekte.");
