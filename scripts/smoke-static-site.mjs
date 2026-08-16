import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const root = path.resolve(process.cwd(), process.argv[2] || ".");
const routes = [
  "/",
  "/nettbutikk-demo/",
  "/nettbutikk-demo/kategori.html?type=inne",
  "/nettbutikk-demo/produkt.html?id=veggmaling-inne",
  "/nettbutikk-demo/handlekurv.html",
  "/nettbutikk-demo/checkout.html",
  "/nettbutikk-demo/bekreftelse.html",
  "/admin-demo/"
];

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const file = path.resolve(root, "." + pathname);
    assert.ok(file.startsWith(root + path.sep));
    const body = await fs.readFile(file);
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();

try {
  for (const route of routes) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    assert.equal(response.status, 200, route);
    assert.match(await response.text(), /<!DOCTYPE html>/i, route);
  }
  console.log(`Alle ${routes.length} HTML-ruter svarte korrekt fra lokal statisk server.`);
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
