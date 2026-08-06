/*
 * Delt header/footer for nettbutikk-demo og admin-demo.
 * Kjøres synkront (ikke defer) slik at header/footer er på plass før siden vises.
 */
(function () {
    var ROOT = "../";

    function shopHeader(active) {
        function link(href, label, key) {
            var isActive = active === key;
            var cls = isActive
                ? "text-primary font-bold border-b-2 border-primary pb-1"
                : "text-on-surface-variant font-medium hover:text-primary";
            return '<a class="' + cls + ' transition-colors font-label-md text-label-md px-2" href="' + href + '">' + label + "</a>";
        }
        return '' +
            '<div class="w-full bg-deep-forest text-surface-cream text-center py-2 px-4 text-xs md:text-sm font-medium">' +
            '  <span class="material-symbols-outlined align-middle text-[16px] mr-1">visibility</span>' +
            '  Demo-visning &ndash; dette er ikke en live nettbutikk. Ingen ordre blir reelt behandlet eller belastet.' +
            '</div>' +
            '<header class="sticky top-0 z-50 bg-surface-cream shadow-sm shadow-deep-forest/10 w-full">' +
            '  <div class="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-7xl mx-auto">' +
            '    <a class="flex items-center gap-2" href="index.html">' +
            '      <img alt="Kulør Logo" class="h-8 md:h-10 w-auto object-contain" src="' + ROOT + 'img/kulor-logo-400.png"/>' +
            '      <span class="hidden sm:inline-block ml-1 py-0.5 px-2 rounded-full bg-vibrant-orange/15 text-vibrant-orange font-label-sm text-label-sm border border-vibrant-orange/30">Nettbutikk demo</span>' +
            '    </a>' +
            '    <nav aria-label="Nettbutikk navigasjon" class="hidden md:flex items-center gap-6">' +
            link("index.html", "Hjem", "hjem") +
            link("kategori.html?type=inne", "Maling inne", "inne") +
            link("kategori.html?type=ute", "Maling ute", "ute") +
            link("kategori.html?type=tilbehor", "Tilbehør", "tilbehor") +
            '    </nav>' +
            '    <div class="flex items-center gap-3 md:gap-4">' +
            '      <a class="hidden md:inline text-on-surface-variant hover:text-primary text-label-md font-label-md" href="' + ROOT + 'index.html">Til kulor-rognan.no</a>' +
            '      <a class="relative flex items-center gap-2 bg-vibrant-orange hover:bg-primary-container text-white py-2 px-3 md:px-4 rounded-lg transition-all font-label-md text-label-md font-semibold" href="handlekurv.html">' +
            '        <span class="material-symbols-outlined text-[20px]">shopping_cart</span>' +
            '        <span class="hidden sm:inline">Handlekurv</span>' +
            '        <span class="hidden inline-flex ml-0.5 bg-white text-vibrant-orange rounded-full w-5 h-5 items-center justify-center text-xs font-bold" data-cart-count></span>' +
            '      </a>' +
            '      <button aria-label="Åpne meny" class="md:hidden text-deep-forest p-2 rounded-lg hover:bg-surface-container" data-mobile-nav-toggle type="button">' +
            '        <span class="material-symbols-outlined text-[24px]">menu</span>' +
            '      </button>' +
            '    </div>' +
            '  </div>' +
            '  <nav aria-label="Mobilmeny" class="hidden flex-col px-margin-mobile pb-4 gap-1 bg-surface-cream md:hidden" data-mobile-nav>' +
            link("index.html", "Hjem", "hjem") +
            link("kategori.html?type=inne", "Maling inne", "inne") +
            link("kategori.html?type=ute", "Maling ute", "ute") +
            link("kategori.html?type=tilbehor", "Tilbehør", "tilbehor") +
            '  </nav>' +
            '</header>';
    }

    function shopFooter() {
        return '' +
            '<footer class="w-full bg-deep-forest text-white mt-section-gap">' +
            '  <div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12">' +
            '    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">' +
            '      <div class="flex items-center gap-3">' +
            '        <img alt="Kulør Logo" class="h-8 w-auto object-contain" src="' + ROOT + 'img/kulor-logo-400.png"/>' +
            '        <div>' +
            '          <p class="font-label-md text-label-md text-white">Kulør Rognan &ndash; Nettbutikk (demo)</p>' +
            '          <p class="text-surface-cream/60 text-xs">Strandgata 11, 8250 Rognan</p>' +
            '        </div>' +
            '      </div>' +
            '      <p class="text-surface-cream/70 text-sm max-w-md">Dette er en demonstrasjon utviklet for å vise en mulig klikk-og-hent-løsning. Ingen produkter, priser eller ordre er reelle.</p>' +
            '    </div>' +
            '    <div class="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-surface-cream/60">' +
            '      <p>&copy; 2026 Kulør Rognan &ndash; salgsdemo, ikke i produksjon</p>' +
            '      <a class="hover:text-white transition-colors flex items-center gap-1" href="' + ROOT + 'admin-demo/index.html">Se administrasjonsdemo <span class="material-symbols-outlined text-[16px]">arrow_forward</span></a>' +
            '    </div>' +
            '  </div>' +
            '</footer>';
    }

    function adminHeader() {
        return '' +
            '<div class="w-full bg-deep-forest text-surface-cream text-center py-2 px-4 text-xs md:text-sm font-medium">' +
            '  <span class="material-symbols-outlined align-middle text-[16px] mr-1">visibility</span>' +
            '  Admin-demo &ndash; viser hvordan butikken vil behandle ordre. Endringer lagres ikke permanent.' +
            '</div>' +
            '<header class="sticky top-0 z-50 bg-surface-cream shadow-sm shadow-deep-forest/10 w-full">' +
            '  <div class="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-7xl mx-auto">' +
            '    <a class="flex items-center gap-2" href="index.html">' +
            '      <img alt="Kulør Logo" class="h-8 md:h-10 w-auto object-contain" src="' + ROOT + 'img/kulor-logo-400.png"/>' +
            '      <span class="hidden sm:inline-block ml-1 py-0.5 px-2 rounded-full bg-deep-forest/10 text-deep-forest font-label-sm text-label-sm border border-deep-forest/20">Adminpanel demo</span>' +
            '    </a>' +
            '    <div class="flex items-center gap-4">' +
            '      <a class="text-on-surface-variant hover:text-primary text-label-md font-label-md" href="' + ROOT + 'nettbutikk-demo/index.html">Til nettbutikk-demo</a>' +
            '      <a class="text-on-surface-variant hover:text-primary text-label-md font-label-md" href="' + ROOT + 'index.html">Til kulor-rognan.no</a>' +
            '    </div>' +
            '  </div>' +
            '</header>';
    }

    function adminFooter() {
        return '' +
            '<footer class="w-full bg-deep-forest text-white mt-section-gap">' +
            '  <div class="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-8 text-center text-xs text-surface-cream/60">' +
            '    &copy; 2026 Kulør Rognan &ndash; adminpanel-demo, ikke i produksjon' +
            '  </div>' +
            '</footer>';
    }

    function wireMobileNav() {
        var toggle = document.querySelector("[data-mobile-nav-toggle]");
        var nav = document.querySelector("[data-mobile-nav]");
        if (!toggle || !nav) return;
        toggle.addEventListener("click", function () {
            var isOpen = nav.classList.contains("flex");
            nav.classList.toggle("flex", !isOpen);
            nav.classList.toggle("hidden", isOpen);
        });
    }

    document.addEventListener("DOMContentLoaded", wireMobileNav);

    window.KulorLayout = {
        injectShop: function (active) {
            document.write('<div id="site-header">' + shopHeader(active) + '</div>');
        },
        injectShopFooter: function () {
            document.write('<div id="site-footer">' + shopFooter() + '</div>');
        },
        injectAdmin: function () {
            document.write('<div id="site-header">' + adminHeader() + '</div>');
        },
        injectAdminFooter: function () {
            document.write('<div id="site-footer">' + adminFooter() + '</div>');
        }
    };
})();
