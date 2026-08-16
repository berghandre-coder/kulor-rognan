/*
 * Generic store config shape. A tenant-specific fallback may be loaded first;
 * a configured Netlify deployment then replaces it with Supabase data.
 */
var STORE_CONFIG = Object.assign({
    slug: "store",
    name: "Nettbutikk",
    legalName: "Nettbutikk",
    region: "",
    footerTagline: "",
    logoPath: "",
    address: "",
    phoneDisplay: "",
    phoneHref: "",
    openingHours: [],
    supplierColorUrl: "",
    supplierColorLabel: "leverandøren",
    theme: {},
    settings: {}
}, window.STORE_FALLBACK_CONFIG || {});

function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        }[character];
    });
}

function safePublicUrl(value) {
    var url = String(value || "").trim();
    if (!url) return "";
    if (/^(?:https?:)?\/\//i.test(url) || url.charAt(0) === "/") return url;
    if (/^[a-z0-9_./-]+(?:\?[a-z0-9_.,=&%-]*)?$/i.test(url)) return url;
    return "";
}

window.escapeHTML = escapeHTML;
window.safePublicUrl = safePublicUrl;
