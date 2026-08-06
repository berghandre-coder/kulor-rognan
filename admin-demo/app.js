/*
 * Kulør Rognan - admin-demo
 * Kun demonstrasjon: ordre og produktendringer lever i minnet for denne
 * øktenen og lagres ikke permanent noe sted.
 */

var DEMO_ORDERS = [
    {
        id: "KR-1042",
        status: "ny",
        customer: { name: "Kari Nordmann", email: "kari.nordmann@epost.no", phone: "+47 912 34 567" },
        items: [{ productName: "Kulør Interiør Matt", size: "9 l", qty: 1, colorLabel: "Varm Beige (S 1010-Y30R)", price: 2990 }],
        comment: "Ønsker avhenting fredag ettermiddag.",
        createdAt: "2026-08-06T09:12:00"
    },
    {
        id: "KR-1041",
        status: "under_blanding",
        customer: { name: "Ola Haugen", email: "ola.haugen@epost.no", phone: "+47 924 55 112" },
        items: [{ productName: "Kulør Fasademaling", size: "9 l", qty: 2, colorLabel: "Skifergrå (S 6502-B)", price: 3490 }],
        comment: "",
        createdAt: "2026-08-05T11:40:00"
    },
    {
        id: "KR-1040",
        status: "klar",
        customer: { name: "Silje Antonsen", email: "silje.a@epost.no", phone: "+47 400 12 345" },
        items: [{ productName: "Kulør Terrassebeis", size: "2,7 l", qty: 1, colorLabel: "Fargekode (kunde): NCS S 2010-Y50R (fra Butinox fargevelger)", price: 1090 }],
        comment: "Ring gjerne når den er klar.",
        createdAt: "2026-08-04T14:05:00"
    },
    {
        id: "KR-1039",
        status: "utlevert",
        customer: { name: "Per Strand", email: "per.strand@epost.no", phone: "+47 977 88 221" },
        items: [
            { productName: "Kulør Snekkermaling Innendørs", size: "2,7 l", qty: 1, colorLabel: "Kritthvit (S 0502-Y)", price: 1190 },
            { productName: "Kulør Malerpensel Sett", size: "Sett à 3 stk", qty: 1, colorLabel: null, price: 149 }
        ],
        comment: "",
        createdAt: "2026-08-03T10:20:00"
    },
    {
        id: "KR-1038",
        status: "ny",
        customer: { name: "Mona Iversen", email: "mona.iversen@epost.no", phone: "+47 936 21 004" },
        items: [{ productName: "Kulør Interiør Takmaling", size: "2,7 l", qty: 1, colorLabel: "Kremhvit (S 0505-Y20R)", price: 990 }],
        comment: "Har dere denne på lager til i morgen?",
        createdAt: "2026-08-06T08:02:00"
    }
];

var STATUS_ORDER = ["ny", "under_blanding", "klar", "utlevert"];
var STATUS_META = {
    ny: { label: "Ny ordre", classes: "bg-vibrant-orange/15 text-vibrant-orange" },
    under_blanding: { label: "Under blanding", classes: "bg-amber-100 text-amber-800" },
    klar: { label: "Klar til henting", classes: "bg-secondary-container/70 text-secondary" },
    utlevert: { label: "Utlevert", classes: "bg-surface-container-high text-on-surface-variant" }
};

var ICON_CHOICES = ["format_paint", "roofing", "door_front", "home_work", "deck", "domain", "construction", "brush", "cleaning_services", "texture", "layers", "foundation"];

function orderTotal(order) {
    return order.items.reduce(function (sum, i) { return sum + i.price * i.qty; }, 0);
}

function formatOrderDate(iso) {
    return new Date(iso).toLocaleDateString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function showToast(msg) {
    var toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toast.classList.add("hidden"); }, 3200);
}

/* ---------------- Tabs ---------------- */
document.querySelectorAll("#tab-switch .tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
        document.querySelectorAll("#tab-switch .tab-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var tab = btn.getAttribute("data-tab");
        document.getElementById("tab-ordre").classList.toggle("hidden", tab !== "ordre");
        document.getElementById("tab-produkter").classList.toggle("hidden", tab !== "produkter");
    });
});

/* ---------------- Ordre ---------------- */
var activeStatusFilter = "alle";

function renderStatusFilters() {
    var wrap = document.getElementById("status-filters");
    var options = [{ key: "alle", label: "Alle (" + DEMO_ORDERS.length + ")" }].concat(
        STATUS_ORDER.map(function (key) {
            var count = DEMO_ORDERS.filter(function (o) { return o.status === key; }).length;
            return { key: key, label: STATUS_META[key].label + " (" + count + ")" };
        })
    );
    wrap.innerHTML = options.map(function (o) {
        var isActive = o.key === activeStatusFilter;
        var cls = isActive ? "bg-deep-forest text-white border-deep-forest" : "bg-white text-deep-forest border-outline-variant/40 hover:border-deep-forest/50";
        return '<button type="button" data-status-filter="' + o.key + '" class="px-4 py-2 rounded-full border text-sm font-semibold transition-colors ' + cls + '">' + o.label + '</button>';
    }).join("");
    wrap.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
            activeStatusFilter = btn.getAttribute("data-status-filter");
            renderStatusFilters();
            renderOrderList();
        });
    });
}

function renderOrderList() {
    var listWrap = document.getElementById("order-list");
    var list = DEMO_ORDERS.filter(function (o) { return activeStatusFilter === "alle" || o.status === activeStatusFilter; })
        .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

    if (!list.length) {
        listWrap.innerHTML = '<p class="text-center text-on-surface-variant py-12">Ingen ordre med denne statusen.</p>';
        return;
    }

    listWrap.innerHTML = list.map(function (order) {
        var itemSummary = order.items.length === 1
            ? order.items[0].qty + "× " + order.items[0].productName
            : order.items.length + " varer";
        var meta = STATUS_META[order.status];
        return '' +
            '<button type="button" data-order-id="' + order.id + '" class="w-full text-left bg-white rounded-xl border border-outline-variant/30 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 hover:border-primary/50 hover:shadow-sm transition-all">' +
            '  <div class="min-w-0">' +
            '    <div class="flex items-center gap-2 mb-1 flex-wrap">' +
            '      <span class="font-bold text-deep-forest">' + order.id + '</span>' +
            '      <span class="text-xs px-2 py-0.5 rounded-full font-semibold ' + meta.classes + '">' + meta.label + '</span>' +
            '    </div>' +
            '    <p class="text-sm text-on-surface-variant truncate">' + order.customer.name + ' &middot; ' + itemSummary + '</p>' +
            '    <p class="text-xs text-on-surface-variant">' + formatOrderDate(order.createdAt) + '</p>' +
            '  </div>' +
            '  <div class="flex items-center gap-4">' +
            '    <span class="font-bold text-primary">' + formatNOK(orderTotal(order)) + '</span>' +
            '    <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>' +
            '  </div>' +
            '</button>';
    }).join("");

    listWrap.querySelectorAll("[data-order-id]").forEach(function (btn) {
        btn.addEventListener("click", function () { openOrderModal(btn.getAttribute("data-order-id")); });
    });
}

function openOrderModal(orderId) {
    var order = DEMO_ORDERS.find(function (o) { return o.id === orderId; });
    if (!order) return;
    var modal = document.getElementById("order-modal");
    var content = document.getElementById("order-modal-content");

    var itemsHTML = order.items.map(function (i) {
        return '' +
            '<div class="flex justify-between gap-3 py-2 border-b border-outline-variant/15 last:border-0">' +
            '  <div>' +
            '    <p class="font-semibold text-deep-forest">' + i.qty + '&times; ' + i.productName + '</p>' +
            '    <p class="text-sm text-on-surface-variant">' + i.size + (i.colorLabel ? " · " + i.colorLabel : "") + '</p>' +
            '  </div>' +
            '  <span class="font-semibold text-deep-forest shrink-0">' + formatNOK(i.price * i.qty) + '</span>' +
            '</div>';
    }).join("");

    var stepsHTML = STATUS_ORDER.map(function (key) {
        var isCurrent = key === order.status;
        var cls = isCurrent ? "bg-vibrant-orange text-white border-vibrant-orange" : "bg-white text-deep-forest border-outline-variant/40 hover:border-vibrant-orange/60";
        return '<button type="button" data-set-status="' + key + '" class="px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ' + cls + '">' + STATUS_META[key].label + '</button>';
    }).join("");

    content.innerHTML = '' +
        '<div class="flex items-start justify-between mb-5">' +
        '  <div>' +
        '    <h2 class="font-headline-md text-lg text-deep-forest">Ordre ' + order.id + '</h2>' +
        '    <p class="text-sm text-on-surface-variant">' + formatOrderDate(order.createdAt) + '</p>' +
        '  </div>' +
        '  <button type="button" id="order-modal-close" class="text-on-surface-variant hover:text-deep-forest" aria-label="Lukk"><span class="material-symbols-outlined">close</span></button>' +
        '</div>' +

        '<div class="bg-surface-container rounded-lg p-4 mb-5">' +
        '  <p class="font-semibold text-deep-forest mb-1">' + order.customer.name + '</p>' +
        '  <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">' +
        '    <a class="text-primary hover:text-vibrant-orange flex items-center gap-1" href="mailto:' + order.customer.email + '"><span class="material-symbols-outlined text-[16px]">mail</span>' + order.customer.email + '</a>' +
        '    <a class="text-primary hover:text-vibrant-orange flex items-center gap-1" href="tel:' + order.customer.phone.replace(/\s/g, "") + '"><span class="material-symbols-outlined text-[16px]">call</span>' + order.customer.phone + '</a>' +
        '  </div>' +
        (order.comment ? '  <p class="text-sm text-on-surface-variant italic mt-2">Kommentar: "' + order.comment + '"</p>' : '') +
        '</div>' +

        '<h3 class="font-semibold text-deep-forest mb-2">Produkter</h3>' +
        '<div class="mb-4">' + itemsHTML + '</div>' +
        '<div class="flex items-center justify-between pt-2 pb-5 border-b border-outline-variant/15 mb-5">' +
        '  <span class="font-semibold text-deep-forest">Totalsum</span>' +
        '  <span class="font-bold text-primary text-xl">' + formatNOK(orderTotal(order)) + '</span>' +
        '</div>' +

        '<h3 class="font-semibold text-deep-forest mb-2">Status</h3>' +
        '<div class="flex flex-wrap gap-2 mb-6" id="status-steps">' + stepsHTML + '</div>' +

        '<button type="button" id="order-modal-close-2" class="w-full border border-outline-variant/40 text-deep-forest font-semibold py-2.5 rounded-lg hover:bg-surface-container">Lukk</button>';

    modal.classList.remove("hidden");
    document.getElementById("order-modal-close").addEventListener("click", closeOrderModal);
    document.getElementById("order-modal-close-2").addEventListener("click", closeOrderModal);
    content.querySelectorAll("[data-set-status]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            order.status = btn.getAttribute("data-set-status");
            renderStatusFilters();
            renderOrderList();
            openOrderModal(order.id);
            showToast("Status for " + order.id + " endret til «" + STATUS_META[order.status].label + "» (demo).");
        });
    });
}

function closeOrderModal() {
    document.getElementById("order-modal").classList.add("hidden");
}
document.getElementById("order-modal").addEventListener("click", function (e) {
    if (e.target.id === "order-modal") closeOrderModal();
});

/* ---------------- Produkter ---------------- */
var CATEGORY_LABELS = { inne: "Maling inne", ute: "Maling ute", tilbehor: "Tilbehør" };
var editingProductId = null;

function renderProductTable() {
    var body = document.getElementById("product-table-body");
    body.innerHTML = PRODUCTS.map(function (p) {
        var sizesLabel = p.sizes.map(function (s) { return s.label; }).join(", ");
        return '' +
            '<tr class="border-t border-outline-variant/15">' +
            '  <td class="px-4 py-3">' +
            '    <div class="flex items-center gap-3">' +
            '      <span class="w-9 h-9 rounded-lg bg-gradient-to-br ' + TINT_GRADIENTS[p.tint] + ' flex items-center justify-center shrink-0">' +
            '        <span class="material-symbols-outlined text-[18px] ' + (p.tint === "tilbehor" ? "text-deep-forest" : "text-white") + '">' + p.icon + '</span>' +
            '      </span>' +
            '      <div class="min-w-0"><p class="font-semibold text-deep-forest truncate">' + p.name + '</p><p class="text-xs text-on-surface-variant truncate">' + p.subcategory + '</p></div>' +
            '    </div>' +
            '  </td>' +
            '  <td class="px-4 py-3 text-on-surface-variant">' + CATEGORY_LABELS[p.category] + '</td>' +
            '  <td class="px-4 py-3 text-on-surface-variant">' + sizesLabel + '</td>' +
            '  <td class="px-4 py-3">' + (p.hasColor ? '<span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Krever farge</span>' : '<span class="text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">Ingen farge</span>') + '</td>' +
            '  <td class="px-4 py-3">' +
            '    <label class="inline-flex items-center gap-2 cursor-pointer">' +
            '      <input type="checkbox" data-toggle-active="' + p.id + '" class="rounded border-outline-variant text-vibrant-orange focus:ring-vibrant-orange" ' + (p.active !== false ? "checked" : "") + '/>' +
            '      <span class="text-xs font-semibold ' + (p.active !== false ? "text-secondary" : "text-on-surface-variant") + '">' + (p.active !== false ? "Aktiv" : "Inaktiv") + '</span>' +
            '    </label>' +
            '  </td>' +
            '  <td class="px-4 py-3 text-right"><button type="button" data-edit-product="' + p.id + '" class="text-primary font-semibold text-sm hover:text-vibrant-orange">Rediger</button></td>' +
            '</tr>';
    }).join("");

    body.querySelectorAll("[data-toggle-active]").forEach(function (input) {
        input.addEventListener("change", function () {
            var p = getProductById(input.getAttribute("data-toggle-active"));
            p.active = input.checked;
            renderProductTable();
            showToast((p.active ? "«" + p.name + "» aktivert" : "«" + p.name + "» deaktivert") + " (demo).");
        });
    });
    body.querySelectorAll("[data-edit-product]").forEach(function (btn) {
        btn.addEventListener("click", function () { openProductModal(getProductById(btn.getAttribute("data-edit-product"))); });
    });
}

function renderIconPicker(selected) {
    var wrap = document.getElementById("pf-icon-picker");
    wrap.innerHTML = ICON_CHOICES.map(function (icon) {
        var isSel = icon === selected;
        return '<button type="button" data-icon="' + icon + '" class="aspect-square rounded-lg border-2 flex items-center justify-center transition-colors ' + (isSel ? "border-vibrant-orange bg-vibrant-orange/10" : "border-outline-variant/40 hover:border-primary/50") + '"><span class="material-symbols-outlined text-[20px] text-deep-forest">' + icon + '</span></button>';
    }).join("");
    wrap.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
            wrap.dataset.selected = btn.getAttribute("data-icon");
            renderIconPicker(btn.getAttribute("data-icon"));
        });
    });
    wrap.dataset.selected = selected;
}

function renderSizeRows(sizes) {
    var wrap = document.getElementById("pf-sizes");
    wrap.innerHTML = "";
    (sizes.length ? sizes : [{ label: "", price: "" }]).forEach(function (s) { addSizeRow(s.label, s.price); });
}

function addSizeRow(label, price) {
    var wrap = document.getElementById("pf-sizes");
    var row = document.createElement("div");
    row.className = "flex gap-2 items-center";
    row.innerHTML = '' +
        '<input type="text" placeholder="Størrelse, f.eks. 2,7 l" value="' + (label || "") + '" class="flex-1 rounded-lg border border-outline-variant/50 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" data-size-label/>' +
        '<input type="number" min="0" placeholder="Pris (kr)" value="' + (price === "" || price === undefined ? "" : price) + '" class="w-28 rounded-lg border border-outline-variant/50 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" data-size-price/>' +
        '<button type="button" class="text-on-surface-variant hover:text-error" aria-label="Fjern størrelse" data-remove-size><span class="material-symbols-outlined text-[18px]">close</span></button>';
    row.querySelector("[data-remove-size]").addEventListener("click", function () {
        if (wrap.children.length > 1) row.remove();
    });
    wrap.appendChild(row);
}

document.getElementById("pf-add-size").addEventListener("click", function () { addSizeRow("", ""); });

function openProductModal(product) {
    editingProductId = product ? product.id : null;
    document.getElementById("product-modal-title").textContent = product ? "Rediger produkt" : "Nytt produkt";
    document.getElementById("pf-name").value = product ? product.name : "";
    document.getElementById("pf-desc").value = product ? product.shortDesc : "";
    document.getElementById("pf-category").value = product ? product.category : "inne";
    document.getElementById("pf-subcategory").value = product ? product.subcategory : "";
    document.getElementById("pf-usearea").value = product ? product.useArea : "";
    document.getElementById("pf-has-color").checked = product ? product.hasColor : true;
    document.getElementById("pf-active").checked = product ? product.active !== false : true;
    document.getElementById("pf-error").classList.add("hidden");
    renderIconPicker(product ? product.icon : ICON_CHOICES[0]);
    renderSizeRows(product ? product.sizes : []);
    document.getElementById("product-modal").classList.remove("hidden");
}

function closeProductModal() {
    document.getElementById("product-modal").classList.add("hidden");
}

document.getElementById("new-product-btn").addEventListener("click", function () { openProductModal(null); });
document.getElementById("product-modal-close").addEventListener("click", closeProductModal);
document.getElementById("pf-cancel").addEventListener("click", closeProductModal);
document.getElementById("product-modal").addEventListener("click", function (e) {
    if (e.target.id === "product-modal") closeProductModal();
});

document.getElementById("product-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var errorEl = document.getElementById("pf-error");
    var name = document.getElementById("pf-name").value.trim();
    var sizes = Array.from(document.querySelectorAll("#pf-sizes > div")).map(function (row) {
        return {
            label: row.querySelector("[data-size-label]").value.trim(),
            price: Number(row.querySelector("[data-size-price]").value) || 0
        };
    }).filter(function (s) { return s.label && s.price > 0; });

    if (!name || !sizes.length) {
        errorEl.textContent = "Fyll ut produktnavn og minst én spannstørrelse med pris.";
        errorEl.classList.remove("hidden");
        return;
    }
    errorEl.classList.add("hidden");

    var category = document.getElementById("pf-category").value;
    var data = {
        name: name,
        shortDesc: document.getElementById("pf-desc").value.trim(),
        category: category,
        subcategory: document.getElementById("pf-subcategory").value.trim() || CATEGORY_LABELS[category],
        useArea: document.getElementById("pf-usearea").value.trim() || CATEGORY_LABELS[category],
        icon: document.getElementById("pf-icon-picker").dataset.selected || ICON_CHOICES[0],
        tint: category,
        hasColor: document.getElementById("pf-has-color").checked,
        active: document.getElementById("pf-active").checked,
        sizes: sizes
    };

    if (editingProductId) {
        Object.assign(getProductById(editingProductId), data);
        showToast("«" + data.name + "» oppdatert (demo).");
    } else {
        data.id = "demo-" + Date.now();
        PRODUCTS.push(data);
        showToast("«" + data.name + "» opprettet (demo - lagres ikke permanent).");
    }
    closeProductModal();
    renderProductTable();
});

/* ---------------- Init ---------------- */
renderStatusFilters();
renderOrderList();
renderProductTable();
