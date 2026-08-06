/*
 * Kulør Rognan - nettbutikk-demo
 * Statiske eksempeldata + handlekurv-hjelpere (localStorage).
 * Ingen database, ingen backend - kun til demonstrasjonsformål.
 */

const CART_KEY = "kulor_demo_cart";
const LAST_ORDER_KEY = "kulor_demo_last_order";

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

const STORE_INFO = {
    name: "Kulør Rognan",
    address: "Strandgata 11, 8250 Rognan",
    supplierColorUrl: "https://www.butinoxinterior.no/vare-farger/"
};

function formatNOK(amount) {
    return amount.toLocaleString("nb-NO") + " kr";
}

function getProductById(id) {
    return PRODUCTS.find(function (p) { return p.id === id; });
}

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
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
    return line.variantPrice * line.qty;
}

function cartTotal(cart) {
    return (cart || getCart()).reduce(function (sum, line) { return sum + cartLineTotal(line); }, 0);
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
    updateCartBadge();
}

var TINT_GRADIENTS = {
    inne: "from-primary-container to-primary",
    ute: "from-deep-forest to-secondary",
    tilbehor: "from-surface-container-high to-outline-variant"
};

function productCardHTML(product) {
    var iconColor = product.tint === "tilbehor" ? "text-deep-forest" : "text-white";
    var fromPrice = product.variants[0].price;
    var ctaText = VARIANT_TYPES[product.variantType].heading + (product.hasColor ? " og farge" : "");
    return '' +
        '<a href="produkt.html?id=' + product.id + '" class="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm shadow-deep-forest/5 hover:shadow-md transition-all duration-300 border border-outline-variant/20">' +
        '  <div class="aspect-[4/3] bg-gradient-to-br ' + TINT_GRADIENTS[product.tint] + ' flex items-center justify-center">' +
        '    <span class="material-symbols-outlined ' + iconColor + ' text-[64px] group-hover:scale-110 transition-transform duration-300" style="font-variation-settings:\'FILL\' 1;">' + product.icon + '</span>' +
        '  </div>' +
        '  <div class="p-5 flex flex-col flex-1">' +
        '    <p class="uppercase tracking-wider text-[11px] font-label-sm text-primary mb-1">' + product.useArea + '</p>' +
        '    <h3 class="font-headline-md text-lg text-deep-forest mb-1">' + product.name + '</h3>' +
        '    <p class="text-sm text-on-surface-variant mb-4 flex-1 line-clamp-2">' + product.shortDesc + '</p>' +
        '    <div class="flex items-center justify-between mb-3">' +
        '      <span class="text-xs text-on-surface-variant">Pris fra</span>' +
        '      <span class="font-bold text-primary text-lg">' + formatNOK(fromPrice) + '</span>' +
        '    </div>' +
        '    <span class="w-full text-center inline-flex items-center justify-center gap-1 bg-primary/10 group-hover:bg-vibrant-orange group-hover:text-white text-primary text-sm font-semibold py-2.5 px-3 rounded-lg transition-colors">' + ctaText + ' <span class="material-symbols-outlined text-[16px]">arrow_forward</span></span>' +
        '  </div>' +
        '</a>';
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
