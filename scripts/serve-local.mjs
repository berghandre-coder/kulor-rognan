import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const env = Object.fromEntries(
  (await fs.readFile(path.join(root, ".env"), "utf8"))
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    if (url.pathname === "/.netlify/functions/public-config") {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      response.end(JSON.stringify({
        enabled: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.STORE_SLUG),
        supabaseUrl: (env.SUPABASE_URL || "").replace(/\/$/, ""),
        supabaseAnonKey: env.SUPABASE_ANON_KEY || "",
        storeSlug: env.STORE_SLUG || ""
      }));
      return;
    }

    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep)) throw new Error("Invalid path");
    const body = await fs.readFile(file);
    response.writeHead(200, { "content-type": contentTypes[path.extname(file).toLowerCase()] || "application/octet-stream" });
    response.end(body);
  } catch (error) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local storefront: http://127.0.0.1:${port}/`);
});
