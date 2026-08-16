import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

let written = "";
const context = vm.createContext({
  console,
  Date,
  Math,
  Promise,
  URLSearchParams,
  localStorage: {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
  },
  document: {
    write(value) { written += value; },
    addEventListener() {},
    querySelectorAll() { return []; }
  },
  STORE_FALLBACK_CONFIG: {
    name: '<img src=x onerror="globalThis.pwned=1">',
    legalName: '<script>globalThis.pwned=1</script>',
    logoPath: 'x" onerror="globalThis.pwned=1',
    openingHours: [{ label: "<b>Mandag</b>", value: "09–17" }]
  }
});
context.window = context;

vm.runInContext(fs.readFileSync("assets/store-config.js", "utf8"), context, { filename: "assets/store-config.js" });
vm.runInContext(fs.readFileSync("assets/layout.js", "utf8"), context, { filename: "assets/layout.js" });
context.KulorLayout.injectHeader("../", "", false);
context.KulorLayout.injectFooter("../");

assert.doesNotMatch(written, /<script>globalThis\.pwned/);
assert.doesNotMatch(written, /<img src=x onerror/);
assert.match(written, /&lt;img src=x onerror=/);
assert.equal(context.pwned, undefined);

context.STORE_CONFIG = { name: "Test", address: "Test" };
vm.runInContext(fs.readFileSync("nettbutikk-demo/data.js", "utf8"), context, { filename: "nettbutikk-demo/data.js" });
const card = vm.runInContext(`productCardHTML({
  id: 'x"><script>globalThis.pwned=1</script>',
  name: '<img src=x onerror="globalThis.pwned=1">',
  shortDesc: '<script>globalThis.pwned=1</script>',
  useArea: '<b>Vegg</b>',
  icon: '</span><script>globalThis.pwned=1</script>',
  tint: '" onmouseover="globalThis.pwned=1',
  variantType: 'storrelse',
  hasColor: false,
  variants: [{ price: 100, stockStatus: 'in_stock' }]
})`, context);

assert.doesNotMatch(card, /<script>globalThis\.pwned/);
assert.doesNotMatch(card, /<img src=x onerror/);
assert.match(card, /&lt;script&gt;globalThis\.pwned=1&lt;\/script&gt;/);
assert.equal(context.pwned, undefined);

console.log("Lagret HTML/JS i butikk- og produktfelter escapes før rendering.");
