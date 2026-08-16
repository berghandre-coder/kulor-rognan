import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("nettbutikk-demo/data.js", "utf8");
let layoutRefreshed = false;

const context = vm.createContext({
  console,
  Promise,
  Date,
  Math,
  localStorage: {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
  },
  document: {
    addEventListener() {},
    querySelectorAll() { return []; }
  },
  STORE_CONFIG: { name: "Fallback", address: "Fallbackveien 1" }
});

context.window = context;
context.KulorLayout = { refreshStoreIdentity() { layoutRefreshed = true; } };
context.StorefrontRepository = {
  loadCatalog() {
    return Promise.resolve({
      source: "supabase",
      store: { name: "Databasebutikk", address: "Dataveien 2" },
      categories: {
        test: { title: "Test", intro: "", subcategories: ["Underkategori"] }
      },
      products: [{
        id: "databaseprodukt", name: "Databaseprodukt", shortDesc: "", useArea: "Test",
        category: "test", subcategory: "Underkategori", icon: "inventory_2", tint: "tilbehor",
        variantType: "storrelse", hasColor: false, vatRateBasisPoints: 2500,
        variants: [{ label: "1 stk", price: 100, stockStatus: "pa_lager" }]
      }],
      featuredProductIds: ["databaseprodukt"],
      colors: []
    });
  }
};

vm.runInContext(source, context, { filename: "nettbutikk-demo/data.js" });
await context.STOREFRONT_READY;

assert.equal(context.STORE_CONFIG.name, "Databasebutikk");
assert.equal(vm.runInContext("PRODUCTS.length", context), 1);
assert.equal(vm.runInContext("PRODUCTS[0].id", context), "databaseprodukt");
assert.equal(vm.runInContext("FEATURED_PRODUCT_IDS[0]", context), "databaseprodukt");
assert.equal(vm.runInContext("CATEGORY_META.test.title", context), "Test");
assert.equal(context.STOREFRONT_SOURCE, "supabase");
assert.equal(layoutRefreshed, true);

const standardRate = vm.runInContext("vatFromInclusiveOre(10000, 2500)", context);
assert.equal(standardRate.amountExVatOre, 8000);
assert.equal(standardRate.vatOre, 2000);
assert.equal(standardRate.amountExVatOre + standardRate.vatOre, standardRate.amountIncVatOre);

const mixedRates = vm.runInContext(`cartVatSummary([
  { unitPriceIncVatOre: 10000, qty: 1, vatRateBasisPoints: 2500 },
  { unitPriceIncVatOre: 11200, qty: 1, vatRateBasisPoints: 1200 }
])`, context);
assert.equal(mixedRates.subtotalExVatOre, 18000);
assert.equal(mixedRates.vatTotalOre, 3200);
assert.equal(mixedRates.totalIncVatOre, 21200);
assert.equal(mixedRates.vatBreakdown.length, 2);

const snapshot = vm.runInContext("orderItemSnapshot({ productName: 'Test', price: 1, qty: 3, vatRateBasisPoints: 2500 })", context);
assert.equal(snapshot.unitPriceIncVatOre, 100);
assert.equal(snapshot.lineAmountExVatOre + snapshot.lineVatOre, snapshot.lineAmountIncVatOre);

console.log("Databro, MVA-avrunding, snapshots og blandede satser er korrekte.");
