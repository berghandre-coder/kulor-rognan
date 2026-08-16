import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("assets/supabase-storefront.js", "utf8");
const requestedUrls = [];

const responses = {
  stores: [{
    id: "00000000-0000-0000-0000-000000000001",
    slug: "test-store",
    name: "Test Store",
    address: "Testveien 1",
    opening_hours: [],
    settings: {},
    theme: {},
    logo_path: "00000000-0000-0000-0000-000000000001/logo.webp"
  }],
  categories: [
    { id: "cat-parent", parent_id: null, slug: "inne", name: "Maling inne", description: "Test", sort_order: 1 },
    { id: "cat-child", parent_id: "cat-parent", slug: "vegg", name: "Veggmaling", sort_order: 2 }
  ],
  products: [{
    id: "product-1", category_id: "cat-child", slug: "testmaling", name: "Testmaling",
    short_description: "Kort", description: "Lang", use_area: "Vegg", image_path: null,
    icon: "format_paint", tint: "inne", variant_type: "spann", has_color: true,
    vat_rate_basis_points: 2500, is_featured: true, is_active: true, sort_order: 1
  }],
  product_variants: [{
    id: "variant-1", product_id: "product-1", label: "3 l", sku: "SKU-1",
    price_ore: 100000, campaign_price_ore: 80000, stock_status: "fjernlager",
    expected_lead_time: "3–7 dager", sort_order: 1
  }],
  colors: [{
    id: "color-1", slug: "hvit", name: "Hvit", code: "S 0500-N", hex: "#FFFFFF",
    supplier: "Test", is_featured: true, sort_order: 1
  }]
};

function jsonResponse(body) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
}

const context = {
  URLSearchParams,
  console,
  window: {},
  fetch(url) {
    requestedUrls.push(String(url));
    if (url === "/.netlify/functions/public-config") {
      return jsonResponse({
        enabled: true,
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "public-anon-key",
        storeSlug: "test-store"
      });
    }

    const table = new URL(url).pathname.split("/").pop();
    return jsonResponse(responses[table]);
  }
};

vm.runInNewContext(source, context, { filename: "assets/supabase-storefront.js" });
const catalog = await context.window.StorefrontRepository.loadCatalog();

assert.equal(catalog.source, "supabase");
assert.equal(catalog.store.name, "Test Store");
assert.match(catalog.store.logoPath, /storage\/v1\/object\/public\/store-assets/);
assert.deepEqual([...catalog.categories.inne.subcategories], ["Veggmaling"]);
assert.equal(catalog.products[0].category, "inne");
assert.equal(catalog.products[0].variants[0].price, 800);
assert.equal(catalog.products[0].variants[0].priceOre, 80000);
assert.equal(catalog.products[0].variants[0].priceExVatOre, 64000);
assert.equal(catalog.products[0].variants[0].regularPrice, 1000);
assert.equal(catalog.products[0].vatRateBasisPoints, 2500);
assert.equal(catalog.products[0].variants[0].stockStatus, "remote_stock");
assert.deepEqual([...catalog.featuredProductIds], ["testmaling"]);
assert.equal(catalog.colors[0].code, "S 0500-N");
assert.ok(!requestedUrls.some((url) => url.includes("supplier_reference")));

console.log("Runtime repository normaliserer butikk, katalog, pris og lagerstatus korrekt.");
