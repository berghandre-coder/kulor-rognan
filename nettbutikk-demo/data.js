/*
 * Storefront model + demo fallback + handlekurv-hjelpere (localStorage).
 * Supabase data replaces the fallback arrays at runtime when configured.
 */

const CART_KEY = "aema_storefront_cart";
const LAST_ORDER_KEY = "aema_storefront_last_order";
const LEGACY_CART_KEY = "kulor_demo_cart";
const LEGACY_LAST_ORDER_KEY = "kulor_demo_last_order";

/*
 * Variant-type styrer hvilket valg produktsiden viser og hvilken
 * etikett varianten får gjennom handlekurv, checkout, bekreftelse og
 * admin - ingen produkter bruker "spannstørrelse" som standard lenger.
 */
const VARIANT_TYPES = {
    spann: { heading: "Velg spannstørrelse", label: "Spannstørrelse" },
    bredde: { heading: "Velg bredde", label: "Bredde" },
    rullbredde: { heading: "Velg rullbredde og lugg", label: "Rullbredde og lugg" },
    tape: { heading: "Velg bredde og lengde", label: "Bredde og lengde" },
    storrelse: { heading: "Velg størrelse", label: "Størrelse" }
};

const PRODUCTS = [
    {
        id: "veggmaling-inne",
        name: "Kulør Interiør Matt",
        shortDesc: "Slitesterk mattmalt veggmaling for innendørs bruk. Lett å påføre, god dekkevne.",
        useArea: "Vegg innendørs",
        category: "inne",
        subcategory: "Veggmaling",
        icon: "format_paint",
        tint: "inne",
        variantType: "spann",
        hasColor: true,
        vatRateBasisPoints: 2500,
        variants: [
            { label: "0,68 l", price: 349 },
            { label: "2,7 l", price: 1090 },
            { label: "9 l", price: 2990 }
        ]
    },
    {
        id: "takmaling-inne",
        name: "Kulør Interiør Takmaling",
        shortDesc: "Sprutfri takmaling med god kontrastevne og lav lukt. Enkel å jobbe med over hodehøyde.",
        useArea: "Tak innendørs",
        category: "inne",
        subcategory: "Takmaling",
        icon: "roofing",
        tint: "inne",
        variantType: "spann",
        hasColor: true,
        vatRateBasisPoints: 2500,
        variants: [
            { label: "0,68 l", price: 329 },
            { label: "2,7 l", price: 990 },
            { label: "9 l", price: 2790 }
        ]
    },
    {
        id: "snekkermaling-inne",
        name: "Kulør Snekkermaling Innendørs",
        shortDesc: "Halvblank maling for panel, dører og listverk. Robust og enkel å holde ren.",
        useArea: "Panel, dør og list",
        category: "inne",
        subcategory: "Panel, dør og list",
        icon: "door_front",
        tint: "inne",
        variantType: "spann",
        hasColor: true,
        vatRateBasisPoints: 2500,
        variants: [
            { label: "0,68 l", price: 399 },
            { label: "2,7 l", price: 1190 }
        ]
    },
    {
        id: "fasademaling-ute",
        name: "Kulør Fasademaling",
        shortDesc: "Værbestandig akrylmaling for tre- og panelfasader. God dekkevne og lang holdbarhet.",
        useArea: "Hus og fasade",
        category: "ute",
        subcategory: "Hus og fasade",
        icon: "home_work",
        tint: "ute",
        variantType: "spann",
        hasColor: true,
        vatRateBasisPoints: 2500,
        variants: [
            { label: "2,7 l", price: 1290 },
            { label: "9 l", price: 3490 }
        ]
    },
    {
        id: "terrassebeis-ute",
        name: "Kulør Terrassebeis",
        shortDesc: "Beskyttende beis for terrassebord og platting. Fremhever trestrukturen.",
        useArea: "Terrasse og platting",
        category: "ute",
        subcategory: "Terrasse og platting",
        icon: "deck",
        tint: "ute",
        variantType: "spann",
        hasColor: true,
        vatRateBasisPoints: 2500,
        variants: [
            { label: "0,68 l", price: 429 },
            { label: "2,7 l", price: 1090 }
        ]
    },
    {
        id: "mursealer-ute",
        name: "Kulør Mursealer",
        shortDesc: "Beskyttende, transparent impregnering for mur og grunnmur. Farges ikke.",
        useArea: "Mur og grunnmur",
        category: "ute",
        subcategory: "Mur og grunnmur",
        icon: "domain",
        tint: "ute",
        variantType: "spann",
        hasColor: false,
        vatRateBasisPoints: 2500,
        variants: [
            { label: "2,7 l", price: 379 },
            { label: "9 l", price: 990 }
        ]
    },
    {
        id: "flatpensel",
        name: "Kulør Flatpensel",
        shortDesc: "Flatpensel med syntetbust for jevne strøk med både vann- og oljebasert maling.",
        useArea: "Pensler",
        category: "tilbehor",
        subcategory: "Pensler",
        icon: "brush",
        tint: "tilbehor",
        variantType: "bredde",
        hasColor: false,
        vatRateBasisPoints: 2500,
        variants: [
            { label: "35 mm", price: 99 },
            { label: "50 mm", price: 129 },
            { label: "70 mm", price: 159 }
        ]
    },
    {
        id: "malerrull",
        name: "Kulør Malerrull Profi",
        shortDesc: "Malerrull med skumkjerne for jevn påføring. Velg lugglengde etter overflaten du skal male.",
        useArea: "Ruller",
        category: "tilbehor",
        subcategory: "Ruller",
        icon: "construction",
        tint: "tilbehor",
        variantType: "rullbredde",
        hasColor: false,
        vatRateBasisPoints: 2500,
        variants: [
            { label: "100 mm – kort lugg (glatte flater)", price: 79 },
            { label: "180 mm – middels lugg (standard vegg og tak)", price: 99 },
            { label: "250 mm – lang lugg (grov struktur og mur)", price: 129 }
        ]
    },
    {
        id: "malerteip",
        name: "Kulør Malerteip",
        shortDesc: "Malerteip som gir rene avslutningslinjer. Tåler inntil 5 dager utendørs.",
        useArea: "Avdekking",
        category: "tilbehor",
        subcategory: "Tape",
        icon: "horizontal_rule",
        tint: "tilbehor",
        variantType: "tape",
        hasColor: false,
        vatRateBasisPoints: 2500,
        variants: [
            { label: "19 mm × 33 m", price: 49 },
            { label: "30 mm × 33 m", price: 69 },
            { label: "50 mm × 33 m", price: 89 }
        ]
    },
    {
        id: "sparkelmasse",
        name: "Kulør Sparkelmasse",
        shortDesc: "Ferdigblandet sparkelmasse for utjevning av mindre skader og sprekker før maling.",
        useArea: "Forarbeid",
        category: "tilbehor",
        subcategory: "Sparkel og forarbeid",
        icon: "texture",
        tint: "tilbehor",
        variantType: "storrelse",
        hasColor: false,
        vatRateBasisPoints: 2500,
        variants: [
            { label: "0,33 kg", price: 69 },
            { label: "1 kg", price: 129 },
            { label: "5 kg", price: 349 }
        ]
    }
];

const FEATURED_PRODUCT_IDS = ["veggmaling-inne", "fasademaling-ute", "terrassebeis-ute", "snekkermaling-inne"];

const CATEGORY_META = {
    inne: {
        title: "Maling inne",
        intro: "Vegg, tak, panel og gulv - velg riktig produkt for rommet ditt.",
        subcategories: ["Veggmaling", "Takmaling", "Panel, dør og list", "Grunning", "Gulvmaling"]
    },
    ute: {
        title: "Maling ute",
        intro: "Fasade, terrasse og mur - værbestandige produkter for norsk klima.",
        subcategories: ["Hus og fasade", "Terrasse og platting", "Dør og vindu", "Mur og grunnmur", "Grunning og forarbeid"]
    },
    tilbehor: {
        title: "Tilbehør",
        intro: "Pensler, ruller, tape og forarbeid du trenger for et godt resultat.",
        subcategories: ["Pensler", "Ruller", "Tape", "Sparkel og forarbeid"]
    }
};

const COLORS = [
    { id: "kritthvit", name: "Kritthvit", code: "S 0502-Y", hex: "#F5F1E8" },
    { id: "kremhvit", name: "Kremhvit", code: "S 0505-Y20R", hex: "#F1E8DA" },
    { id: "lys-gra", name: "Lys Grå", code: "S 2002-Y", hex: "#D8D5CE" },
    { id: "varm-beige", name: "Varm Beige", code: "S 1010-Y30R", hex: "#E4D3BB" },
    { id: "sandbeige", name: "Sandbeige", code: "S 1515-Y30R", hex: "#C9AE8C" },
    { id: "duegra", name: "Duegrå", code: "S 3005-Y20R", hex: "#B8ADA0" },
    { id: "skifergra", name: "Skifergrå", code: "S 6502-B", hex: "#6E7275" },
    { id: "antrasitt", name: "Antrasitt", code: "S 7500-N", hex: "#4A4A48" },
    { id: "sort", name: "Sort", code: "S 9000-N", hex: "#1B1B1B" },
    { id: "havbla", name: "Havblå", code: "S 4030-R80B", hex: "#3B5B7A" },
    { id: "skoggronn", name: "Skoggrønn", code: "S 6020-G10Y", hex: "#3C5A3E" },
    { id: "teglrod", name: "Teglrød", code: "S 3560-Y70R", hex: "#A24632" }
];

function formatNOK(amount) {
    return amount.toLocaleString("nb-NO") + " kr";
}

function formatNOKOre(amountOre) {
    var amount = amountOre / 100;
    var hasOre = Math.abs(amountOre % 100) > 0;
    return amount.toLocaleString("nb-NO", {
        minimumFractionDigits: hasOre ? 2 : 0,
        maximumFractionDigits: 2
    }) + " kr";
}

function formatVatRate(rateBasisPoints) {
    return (rateBasisPoints / 100).toLocaleString("nb-NO", {
        minimumFractionDigits: rateBasisPoints % 100 ? 2 : 0,
        maximumFractionDigits: 2
    }) + " %";
}

function normalizeStockStatus(value) {
    return value === "remote_stock" || value === "fjernlager" ? "remote_stock" : "in_stock";
}

function isRemoteStock(value) {
    return normalizeStockStatus(value) === "remote_stock";
}

function safeHexColor(value) {
    return /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#ffffff";
}

function lineUnitPriceIncVatOre(line) {
    if (Number.isInteger(line.unitPriceIncVatOre)) return line.unitPriceIncVatOre;
    if (Number.isInteger(line.priceOre)) return line.priceOre;
    var legacyPrice = line.variantPrice !== undefined ? line.variantPrice : line.price;
    return Math.round((legacyPrice || 0) * 100);
}

function lineVatRateBasisPoints(line) {
    return Number.isInteger(line.vatRateBasisPoints) ? line.vatRateBasisPoints : 2500;
}

function vatFromInclusiveOre(amountIncVatOre, rateBasisPoints) {
    var amount = Math.max(0, Math.round(amountIncVatOre));
    var rate = Math.max(0, Math.round(rateBasisPoints));
    var amountExVatOre = Math.round(amount * 10000 / (10000 + rate));
    return {
        amountExVatOre: amountExVatOre,
        vatOre: amount - amountExVatOre,
        amountIncVatOre: amount
    };
}

function cartLineVatAmounts(line) {
    var quantity = Math.max(1, Math.round(line.qty || 1));
    var unitPriceIncVatOre = lineUnitPriceIncVatOre(line);
    var totals = vatFromInclusiveOre(unitPriceIncVatOre * quantity, lineVatRateBasisPoints(line));
    totals.unitPriceIncVatOre = unitPriceIncVatOre;
    totals.unitPriceExVatOre = vatFromInclusiveOre(unitPriceIncVatOre, lineVatRateBasisPoints(line)).amountExVatOre;
    totals.vatRateBasisPoints = lineVatRateBasisPoints(line);
    totals.quantity = quantity;
    return totals;
}

function orderItemSnapshot(line) {
    var amounts = cartLineVatAmounts(line);
    return Object.assign({}, line, {
        productName: line.productName,
        quantity: amounts.quantity,
        unitPriceIncVatOre: amounts.unitPriceIncVatOre,
        unitPriceExVatOre: amounts.unitPriceExVatOre,
        vatRateBasisPoints: amounts.vatRateBasisPoints,
        lineAmountExVatOre: amounts.amountExVatOre,
        lineVatOre: amounts.vatOre,
        lineAmountIncVatOre: amounts.amountIncVatOre
    });
}

function cartVatSummary(cart) {
    var byRate = {};
    var summary = (cart || getCart()).reduce(function (totals, line) {
        var amounts = cartLineVatAmounts(line);
        totals.subtotalExVatOre += amounts.amountExVatOre;
        totals.vatTotalOre += amounts.vatOre;
        totals.totalIncVatOre += amounts.amountIncVatOre;

        var rateKey = String(amounts.vatRateBasisPoints);
        if (!byRate[rateKey]) {
            byRate[rateKey] = {
                vatRateBasisPoints: amounts.vatRateBasisPoints,
                amountExVatOre: 0,
                vatOre: 0,
                amountIncVatOre: 0
            };
        }
        byRate[rateKey].amountExVatOre += amounts.amountExVatOre;
        byRate[rateKey].vatOre += amounts.vatOre;
        byRate[rateKey].amountIncVatOre += amounts.amountIncVatOre;
        return totals;
    }, { subtotalExVatOre: 0, vatTotalOre: 0, totalIncVatOre: 0 });

    summary.vatBreakdown = Object.keys(byRate).map(function (key) { return byRate[key]; })
        .sort(function (a, b) { return a.vatRateBasisPoints - b.vatRateBasisPoints; });
    return summary;
}

function getProductById(id) {
    return PRODUCTS.find(function (p) { return p.id === id; });
}

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY) || localStorage.getItem(LEGACY_CART_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    localStorage.removeItem(LEGACY_CART_KEY);
    updateCartBadge();
}

function addToCart(item) {
    var cart = getCart();
    cart.push(item);
    saveCart(cart);
}

function removeFromCart(lineId) {
    var cart = getCart().filter(function (line) { return line.lineId !== lineId; });
    saveCart(cart);
    return cart;
}

function updateCartQty(lineId, qty) {
    var cart = getCart();
    cart.forEach(function (line) {
        if (line.lineId === lineId) {
            line.qty = Math.max(1, qty);
        }
    });
    saveCart(cart);
    return cart;
}

function cartLineTotal(line) {
    return cartLineVatAmounts(line).amountIncVatOre / 100;
}

function cartTotal(cart) {
    return cartVatSummary(cart).totalIncVatOre / 100;
}

function cartCount(cart) {
    return (cart || getCart()).reduce(function (sum, line) { return sum + line.qty; }, 0);
}

function updateCartBadge() {
    var badges = document.querySelectorAll("[data-cart-count]");
    var count = cartCount();
    badges.forEach(function (badge) {
        badge.textContent = count;
        badge.classList.toggle("hidden", count === 0);
    });
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(LEGACY_CART_KEY);
    updateCartBadge();
}

var TINT_GRADIENTS = {
    inne: "from-primary-container to-primary",
    ute: "from-deep-forest to-secondary",
    tilbehor: "from-surface-container-high to-outline-variant"
};

function productCardHTML(product) {
    var safeTint = Object.prototype.hasOwnProperty.call(TINT_GRADIENTS, product.tint) ? product.tint : "tilbehor";
    var iconColor = safeTint === "tilbehor" ? "text-deep-forest" : "text-white";
    var fromPrice = product.variants[0].price;
    var variantMeta = VARIANT_TYPES[product.variantType] || VARIANT_TYPES.storrelse;
    var ctaText = variantMeta.heading + (product.hasColor ? " og farge" : "");
    var media = product.imageUrl
        ? '<img src="' + escapeHTML(safePublicUrl(product.imageUrl)) + '" alt="' + escapeHTML(product.name) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>'
        : '<span class="material-symbols-outlined ' + iconColor + ' text-[64px] group-hover:scale-110 transition-transform duration-300" style="font-variation-settings:\'FILL\' 1;">' + escapeHTML(product.icon) + '</span>';
    var hasRemoteStock = product.variants.some(function (variant) { return isRemoteStock(variant.stockStatus); });
    var hasLocalStock = product.variants.some(function (variant) { return !isRemoteStock(variant.stockStatus); });
    var stock = hasRemoteStock && hasLocalStock
        ? '<span class="text-[11px] font-semibold text-primary">Lagerstatus varierer</span>'
        : hasRemoteStock
            ? '<span class="text-[11px] font-semibold text-primary">Fjernlager · ' + escapeHTML(product.variants[0].expectedLeadTime) + '</span>'
            : '<span class="text-[11px] font-semibold text-secondary">På lager</span>';
    return '' +
        '<a href="produkt.html?id=' + encodeURIComponent(product.id) + '" class="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm shadow-deep-forest/5 hover:shadow-md transition-all duration-300 border border-outline-variant/20">' +
        '  <div class="aspect-[4/3] bg-gradient-to-br ' + TINT_GRADIENTS[safeTint] + ' flex items-center justify-center">' +
        media +
        '  </div>' +
        '  <div class="p-5 flex flex-col flex-1">' +
        '    <p class="uppercase tracking-wider text-[11px] font-label-sm text-primary mb-1">' + escapeHTML(product.useArea) + '</p>' +
        '    <h3 class="font-headline-md text-lg text-deep-forest mb-1">' + escapeHTML(product.name) + '</h3>' +
        '    <p class="text-sm text-on-surface-variant mb-4 flex-1 line-clamp-2">' + escapeHTML(product.shortDesc) + '</p>' +
        '    <div class="flex items-center justify-between mb-3">' +
        '      <span>' + stock + '</span>' +
        '      <span class="font-bold text-primary text-lg">' + formatNOK(fromPrice) + ' <small class="block text-[10px] font-normal text-on-surface-variant text-right">inkl. MVA</small></span>' +
        '    </div>' +
        '    <span class="w-full text-center inline-flex items-center justify-center gap-1 bg-primary/10 group-hover:bg-vibrant-orange group-hover:text-white text-primary text-sm font-semibold py-2.5 px-3 rounded-lg transition-colors">' + escapeHTML(ctaText) + ' <span class="material-symbols-outlined text-[16px]">arrow_forward</span></span>' +
        '  </div>' +
        '</a>';
}

document.addEventListener("DOMContentLoaded", updateCartBadge);

var STOREFRONT_SOURCE = "demo";
var STOREFRONT_ERROR = null;

function applyStorefrontCatalog(catalog) {
    Object.keys(catalog.store || {}).forEach(function (key) {
        var value = catalog.store[key];
        if (value !== null && value !== undefined) STORE_CONFIG[key] = value;
    });

    PRODUCTS.splice.apply(PRODUCTS, [0, PRODUCTS.length].concat(catalog.products || []));
    FEATURED_PRODUCT_IDS.splice.apply(FEATURED_PRODUCT_IDS, [0, FEATURED_PRODUCT_IDS.length].concat(catalog.featuredProductIds || []));
    COLORS.splice.apply(COLORS, [0, COLORS.length].concat(catalog.colors || []));

    Object.keys(CATEGORY_META).forEach(function (key) { delete CATEGORY_META[key]; });
    Object.keys(catalog.categories || {}).forEach(function (key) {
        CATEGORY_META[key] = catalog.categories[key];
    });

    STOREFRONT_SOURCE = catalog.source || "supabase";
    if (window.KulorLayout && typeof window.KulorLayout.refreshStoreIdentity === "function") {
        window.KulorLayout.refreshStoreIdentity();
    }
}

var STOREFRONT_READY = window.StorefrontRepository
    ? window.StorefrontRepository.loadCatalog().then(function (catalog) {
        applyStorefrontCatalog(catalog);
        return { source: STOREFRONT_SOURCE };
    }).catch(function (error) {
        STOREFRONT_ERROR = error;
        console.info("Bruker innebygde demo-data:", error.message);
        return { source: "demo", error: error };
    })
    : Promise.resolve({ source: "demo" });
