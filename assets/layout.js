/*
 * Delt header/footer for hele nettstedet, inkludert nettbutikk-demoen.
 * Butikkens navn/logo/kontaktinfo hentes fra STORE_CONFIG (store-config.js),
 * som må lastes før denne filen. Header/footer-markup er identisk med
 * index.html sin egen header/footer - nettbutikksider legger kun til et
 * handlekurv-ikon. admin-demo bruker en egen, separat header (injectAdmin)
 * og er ikke del av dette.
 *
 * Kjøres synkront (ikke defer) slik at header/footer er på plass før siden vises.
 */
(function () {
    var YEAR = new Date().getFullYear();
    var html = window.escapeHTML;

    function assetPath(root, path) {
        if (!path) return "";
        var safePath = window.safePublicUrl(path);
        if (!safePath) return "";
        if (/^(?:https?:)?\/\//.test(safePath) || safePath.charAt(0) === "/") return safePath;
        return root + safePath;
    }

    function navLink(href, label, isActive, extra) {
        var cls = isActive
            ? "text-primary font-bold border-b-2 border-primary pb-1 transition-colors font-label-md text-label-md hover:text-primary px-2"
            : "text-on-surface-variant font-medium hover:text-primary transition-colors font-label-md text-label-md hover:bg-surface-container rounded-sm px-2 py-1";
        return '<a class="' + cls + (extra || "") + '" href="' + href + '">' + label + "</a>";
    }

    function siteHeaderHTML(root, active, showCart) {
        var home = root === "" ? "#" : root + "index.html";
        var tjenester = root === "" ? "#tjenester" : root + "index.html#tjenester";
        var kontakt = root === "" ? "#kontakt" : root + "index.html#kontakt";
        var nettbutikk = root + "nettbutikk-demo/";

        var cartHTML = "";
        if (showCart) {
            cartHTML = '' +
                '<a aria-label="Handlekurv" class="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-surface-container text-deep-forest transition-colors" href="' + root + 'nettbutikk-demo/handlekurv.html">' +
                '  <span class="material-symbols-outlined text-[22px]">shopping_cart</span>' +
                '  <span class="hidden inline-flex absolute -top-1 -right-1 bg-vibrant-orange text-white rounded-full min-w-[18px] h-[18px] px-1 items-center justify-center text-[10px] font-bold" data-cart-count></span>' +
                '</a>';
        }

        return '' +
            '<header class="sticky top-0 z-50 bg-surface-cream shadow-sm shadow-deep-forest/10 w-full transition-all duration-300">' +
            '<div class="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-7xl mx-auto">' +
            '<a aria-label="' + html(STORE_CONFIG.name) + ' Home" class="flex items-center gap-2" href="' + home + '">' +
            '<img alt="' + html(STORE_CONFIG.name) + ' logo" class="h-8 md:h-10 w-auto object-contain" src="' + html(assetPath(root, STORE_CONFIG.logoPath)) + '"/>' +
            '<span class="sr-only">' + html(STORE_CONFIG.name) + '</span>' +
            '</a>' +
            '<nav aria-label="Main Navigation" class="hidden md:flex items-center gap-6">' +
            navLink(home, "Hjem", active === "hjem") +
            navLink(tjenester, "Maling", false) +
            navLink(tjenester, "Gulv", false) +
            navLink(tjenester, "Solskjerming", false) +
            navLink(tjenester, "Tjenester", false) +
            navLink(nettbutikk, 'Nettbutikk <span class="text-[10px] bg-vibrant-orange/15 text-vibrant-orange px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Nytt</span>', active === "nettbutikk", " flex items-center gap-1.5") +
            '</nav>' +
            '<div class="hidden md:flex items-center gap-4">' +
            '<a class="text-deep-forest font-label-md text-label-md hover:text-primary transition-colors font-semibold" href="' + kontakt + '">Kontakt oss</a>' +
            '<a class="bg-vibrant-orange hover:bg-primary-container text-white font-label-md text-label-md py-2 px-4 rounded-lg transition-all duration-300 shadow-sm shadow-deep-forest/10 hover:shadow-md active:scale-95 font-semibold" href="#">Bestill befaring</a>' +
            '</div>' +
            '<div class="flex items-center gap-1">' +
            cartHTML +
            '<button aria-label="Toggle menu" class="md:hidden text-deep-forest p-2 rounded-lg hover:bg-surface-container transition-colors">' +
            '<span class="material-symbols-outlined text-[24px]">menu</span>' +
            '</button>' +
            '</div>' +
            '</div>' +
            '</header>';
    }

    function siteFooterHTML(root) {
        return '' +
            '<footer class="w-full bg-deep-forest text-white">' +
            '<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">' +
            '<div class="grid grid-cols-1 md:grid-cols-4 gap-gutter">' +
            '<div class="col-span-1">' +
            '<div class="mb-4"><div class="mb-4"><img alt="' + html(STORE_CONFIG.name) + ' logo" class="h-8 md:h-10 w-auto object-contain" src="' + html(assetPath(root, STORE_CONFIG.logoPath)) + '"/></div></div>' +
            '<p class="font-body-md text-body-md text-surface-cream/80 mb-6">' + html(STORE_CONFIG.footerTagline) + '</p>' +
            '<div class="flex items-center gap-2 text-surface-cream/80">' +
            '<span class="material-symbols-outlined text-[20px] text-vibrant-orange">location_on</span>' +
            '<span class="font-body-md text-body-md">' + html(STORE_CONFIG.address) + '</span>' +
            '</div>' +
            '</div>' +
            '<div class="col-span-1 md:col-span-2 grid grid-cols-2 gap-8">' +
            '<div>' +
            '<h3 class="font-label-md text-label-md text-vibrant-orange font-bold mb-4 uppercase tracking-wider">Utforsk</h3>' +
            '<ul class="space-y-3">' +
            '<li><a class="text-surface-cream/80 font-normal hover:text-white transition-colors font-body-md text-body-md" href="#">Maling</a></li>' +
            '<li><a class="text-surface-cream/80 font-normal hover:text-white transition-colors font-body-md text-body-md" href="#">Gulv</a></li>' +
            '<li><a class="text-surface-cream/80 font-normal hover:text-white transition-colors font-body-md text-body-md" href="#">Solskjerming</a></li>' +
            '<li><a class="text-surface-cream/80 font-normal hover:text-white transition-colors font-body-md text-body-md" href="#">Fargekart</a></li>' +
            '<li><a class="text-surface-cream/80 font-normal hover:text-white transition-colors font-body-md text-body-md" href="#">Gavekort</a></li>' +
            '</ul>' +
            '</div>' +
            '<div>' +
            '<h3 class="font-label-md text-label-md text-vibrant-orange font-bold mb-4 uppercase tracking-wider">Informasjon</h3>' +
            '<ul class="space-y-3">' +
            '<li><a class="text-surface-cream/80 font-normal hover:text-white transition-colors font-body-md text-body-md" href="#">Om oss</a></li>' +
            '<li><a class="text-surface-cream/80 font-normal hover:text-white transition-colors font-body-md text-body-md" href="#">Kontakt</a></li>' +
            '<li><a class="text-surface-cream/80 font-normal hover:text-white transition-colors font-body-md text-body-md" href="#">Personvern</a></li>' +
            '<li><a class="text-surface-cream/80 font-normal hover:text-white transition-colors font-body-md text-body-md" href="#">Betingelser</a></li>' +
            '</ul>' +
            '</div>' +
            '</div>' +
            '<div class="col-span-1 bg-on-secondary-fixed-variant/30 p-6 rounded-xl border border-white/10 h-fit">' +
            '<h3 class="font-label-md text-label-md text-vibrant-orange font-bold mb-4 uppercase tracking-wider">Åpningstider</h3>' +
            '<ul class="space-y-2 mb-6 font-body-md text-body-md text-surface-cream/90">' +
            STORE_CONFIG.openingHours.map(function (row) {
                return '<li class="flex justify-between' + (row.muted ? " text-surface-cream/60" : "") + '"><span>' + html(row.label) + '</span> <span>' + html(row.value) + '</span></li>';
            }).join("") +
            '</ul>' +
            '<a class="flex items-center gap-2 text-white hover:text-vibrant-orange transition-colors font-label-md text-label-md font-bold" href="tel:' + html(String(STORE_CONFIG.phoneHref || "").replace(/[^+0-9]/g, "")) + '"><span class="material-symbols-outlined text-[20px]">call</span> ' + html(STORE_CONFIG.phoneDisplay) + '</a>' +
            '</div>' +
            '</div>' +
            '<div class="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">' +
            '<p class="font-label-sm text-label-sm text-surface-cream/60">© ' + YEAR + ' ' + html(STORE_CONFIG.legalName) + ' - ' + html(STORE_CONFIG.region) + '</p>' +
            '<p class="font-label-sm text-label-sm text-surface-cream/60">Levert av © ' + YEAR + ' AEMA Digital AS</p>' +
            '</div>' +
            '</div>' +
            '</footer>';
    }

    function demoBannerHTML() {
        return '' +
            '<div class="w-full bg-deep-forest text-surface-cream text-center py-2 px-4 text-xs md:text-sm font-medium">' +
            '<span class="material-symbols-outlined align-middle text-[16px] mr-1">visibility</span>' +
            'Demo-visning &ndash; dette er ikke en live nettbutikk. Ingen ordre blir reelt behandlet eller belastet.' +
            '</div>';
    }

    var STORE_NAV_ITEMS = [
        { key: "oversikt", label: "Oversikt", path: "nettbutikk-demo/index.html" },
        { key: "inne", label: "Innemaling", path: "nettbutikk-demo/kategori.html?type=inne" },
        { key: "ute", label: "Utemaling", path: "nettbutikk-demo/kategori.html?type=ute" },
        { key: "tilbehor", label: "Tilbehør", path: "nettbutikk-demo/kategori.html?type=tilbehor" }
    ];

    function storeNavHTML(root, activeKey) {
        var links = STORE_NAV_ITEMS.map(function (item) {
            var isActive = item.key === activeKey;
            var cls = isActive
                ? "bg-white text-primary shadow-sm font-semibold"
                : "text-on-surface-variant hover:text-primary hover:bg-white/60";
            return '<a class="shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors ' + cls + '" href="' + root + item.path + '">' + item.label + "</a>";
        }).join("");
        return '' +
            '<div class="w-full bg-surface-container border-b border-outline-variant/20">' +
            '<div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex items-center gap-2 overflow-x-auto py-2.5">' +
            '<span class="text-on-surface-variant font-semibold text-sm pr-1 shrink-0 hidden sm:inline">I nettbutikken:</span>' +
            links +
            '</div>' +
            '</div>';
    }

    function adminHeaderHTML(root) {
        return '' +
            '<div class="w-full bg-deep-forest text-surface-cream text-center py-2 px-4 text-xs md:text-sm font-medium">' +
            '  <span class="material-symbols-outlined align-middle text-[16px] mr-1">visibility</span>' +
            '  Sikker administrasjon av butikkens produktkatalog' +
            '</div>' +
            '<header class="sticky top-0 z-50 bg-surface-cream shadow-sm shadow-deep-forest/10 w-full">' +
            '  <div class="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-7xl mx-auto">' +
            '    <a class="flex items-center gap-2" href="index.html">' +
            '      <img alt="' + html(STORE_CONFIG.name) + ' logo" class="h-8 md:h-10 w-auto object-contain" src="' + html(assetPath(root, STORE_CONFIG.logoPath)) + '"/>' +
            '      <span class="hidden sm:inline-block ml-1 py-0.5 px-2 rounded-full bg-deep-forest/10 text-deep-forest font-label-sm text-label-sm border border-deep-forest/20">Adminpanel</span>' +
            '    </a>' +
            '    <div class="flex items-center gap-4">' +
            '      <a class="text-on-surface-variant hover:text-primary text-label-md font-label-md" href="' + root + 'nettbutikk-demo/index.html">Til nettbutikk-demo</a>' +
            '      <a class="text-on-surface-variant hover:text-primary text-label-md font-label-md" href="' + root + 'index.html">Til hovedsiden</a>' +
            '    </div>' +
            '  </div>' +
            '</header>';
    }

    function adminFooterHTML() {
        return '' +
            '<footer class="w-full bg-deep-forest text-white mt-section-gap">' +
            '  <div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-8 text-center text-xs text-surface-cream/60">' +
            '    &copy; ' + YEAR + ' ' + html(STORE_CONFIG.name) + ' &ndash; produktadministrasjon' +
            '  </div>' +
            '</footer>';
    }

    var layoutApi = {
        // root: "" på index.html, "../" på sider ett nivå ned (nettbutikk-demo/, admin-demo/)
        injectDemoBanner: function () {
            document.write(demoBannerHTML());
        },
        injectHeader: function (root, active, showCart) {
            document.write('<div data-layout-header data-root="' + root + '" data-active="' + active + '" data-show-cart="' + (!!showCart) + '">' + siteHeaderHTML(root, active, !!showCart) + '</div>');
        },
        injectStoreNav: function (root, activeKey) {
            document.write(storeNavHTML(root, activeKey));
        },
        injectFooter: function (root) {
            document.write('<div id="site-footer" data-layout-footer data-root="' + root + '">' + siteFooterHTML(root) + '</div>');
        },
        injectAdmin: function () {
            document.write('<div data-layout-admin-header>' + adminHeaderHTML("../") + '</div>');
        },
        injectAdminFooter: function () {
            document.write('<div id="site-footer" data-layout-admin-footer>' + adminFooterHTML() + '</div>');
        },
        refreshStoreIdentity: function () {
            document.querySelectorAll("[data-layout-header]").forEach(function (wrap) {
                wrap.innerHTML = siteHeaderHTML(wrap.dataset.root || "", wrap.dataset.active || "", wrap.dataset.showCart === "true");
            });
            document.querySelectorAll("[data-layout-footer]").forEach(function (wrap) {
                wrap.innerHTML = siteFooterHTML(wrap.dataset.root || "");
            });
            document.querySelectorAll("[data-layout-admin-header]").forEach(function (wrap) {
                wrap.innerHTML = adminHeaderHTML("../");
            });
            document.querySelectorAll("[data-layout-admin-footer]").forEach(function (wrap) {
                wrap.innerHTML = adminFooterHTML();
            });
            if (typeof window.updateCartBadge === "function") window.updateCartBadge();
        }
    };

    window.AemaLayout = layoutApi;
    window.KulorLayout = layoutApi;
})();
