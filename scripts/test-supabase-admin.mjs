import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("assets/supabase-admin.js", "utf8");
const requests = [];
const storage = new Map();
const ownStoreId = "11111111-1111-4111-8111-111111111111";

function response(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => body == null ? "" : JSON.stringify(body)
  };
}

async function fetchMock(url, options = {}) {
  const request = { url: String(url), options };
  requests.push(request);

  if (request.url.includes("/auth/v1/token?grant_type=password")) {
    return response(200, {
      access_token: "authenticated-jwt",
      refresh_token: "refresh-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: "user-1", email: "admin@example.no" }
    });
  }
  if (request.url.endsWith("/auth/v1/user")) return response(200, { id: "user-1", email: "admin@example.no" });
  if (request.url.includes("/rest/v1/store_members")) return response(200, [{ store_id: ownStoreId, role: "admin" }]);
  if (request.url.includes("/rest/v1/stores")) return response(200, [{ id: ownStoreId, slug: "kulor-rognan", name: "Kulør Rognan" }]);
  if (request.url.includes("/rest/v1/categories")) return response(200, [{ id: "category-1", name: "Veggmaling" }]);
  if (request.url.includes("/rest/v1/products") && options.method !== "PATCH") return response(200, [{ id: "product-1", name: "Produkt" }]);
  if (request.url.includes("/rest/v1/product_variants")) return response(200, [{ id: "variant-1", supplier_reference: "INTERN-123" }]);
  if (request.url.includes("/rest/v1/colors")) return response(200, []);
  if (request.url.includes("/rest/v1/rpc/save_catalog_product")) return response(200, "product-1");
  if (request.url.includes("/rest/v1/products") && options.method === "PATCH") return response(200, [{ id: "product-1", is_active: false }]);
  if (request.url.includes("/storage/v1/object/store-assets/") && options.method === "POST") return response(200, { Key: "uploaded" });
  if (request.url.endsWith("/storage/v1/object/store-assets") && options.method === "DELETE") return response(200, []);
  if (request.url.endsWith("/auth/v1/logout")) return response(204, null);
  throw new Error(`Unexpected request: ${request.url}`);
}

const context = vm.createContext({
  console,
  fetch: fetchMock,
  URLSearchParams,
  Blob,
  Date,
  sessionStorage: {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storage.set(key, value); },
    removeItem(key) { storage.delete(key); }
  },
  window: {}
});
context.window = context;
vm.runInContext(source, context, { filename: "assets/supabase-admin.js" });

const client = context.SupabaseAdmin.create({
  enabled: true,
  supabaseUrl: "https://example.supabase.co",
  supabaseAnonKey: "sb_publishable_test",
  storeSlug: "kulor-rognan"
});

await client.signIn("admin@example.no", "password");
const storeContext = await client.loadStoreContext();
assert.equal(storeContext.storeId, ownStoreId);
assert.equal(storeContext.role, "admin");

const catalog = await client.loadCatalog();
assert.equal(catalog.products.length, 1);
assert.equal(catalog.variants[0].supplier_reference, "INTERN-123");

await client.saveProduct(
  { id: "product-1", store_id: "attacker-store", name: "Produkt" },
  [{ id: "variant-1", store_id: "attacker-store", product_id: "attacker-product", label: "1 l" }]
);
const rpcRequest = requests.find((request) => request.url.includes("rpc/save_catalog_product"));
const rpcBody = JSON.parse(rpcRequest.options.body);
assert.equal(rpcBody.product_data.store_id, ownStoreId);
assert.equal("store_id" in rpcBody.variant_data[0], false);
assert.equal("product_id" in rpcBody.variant_data[0], false);

await client.updateProductActive("product-1", false);
const updateRequest = requests.find((request) => request.url.includes("/products?") && request.options.method === "PATCH");
assert.match(updateRequest.url, new RegExp(`store_id=eq\\.${ownStoreId}`));

const imagePath = await client.uploadProductImage("product-1", "Testprodukt", new Blob(["image"], { type: "image/webp" }));
assert.ok(imagePath.startsWith(`${ownStoreId}/products/product-1/`));
assert.match(client.publicStorageUrl(imagePath), /storage\/v1\/object\/public\/store-assets/);

requests.forEach((request) => {
  const headers = request.options.headers || {};
  assert.notEqual(headers.apikey, "service-role");
  if (!request.url.includes("token?grant_type=password")) {
    assert.ok(!headers.authorization || headers.authorization === "Bearer authenticated-jwt");
  }
});

console.log("Admin Auth, medlemskontekst, store_id-låsing, CRUD-kall og Storage-sti er korrekte.");
