/* Kulør Rognan catalog admin. All persistence goes through authenticated
 * Supabase requests and database RLS; there is no demo/minne-lagring here. */
(function () {
    "use strict";

    var adminClient = null;
    var adminContext = null;
    var catalog = { categories: [], products: [], variants: [], colors: [] };
    var editingProduct = null;
    var editingColor = null;
    var previewObjectUrl = null;

    var html = window.escapeHTML || function (value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
        });
    };

    function byId(id) { return document.getElementById(id); }

    function showOnly(viewId) {
        ["admin-loading", "admin-login", "admin-app"].forEach(function (id) {
            byId(id).classList.toggle("hidden", id !== viewId);
        });
    }

    function showToast(message) {
        var toast = byId("toast");
        toast.textContent = message;
        toast.classList.remove("hidden");
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(function () { toast.classList.add("hidden"); }, 4200);
    }

    function showGlobalError(error) {
        var wrap = byId("admin-global-error");
        wrap.textContent = error && error.message ? error.message : String(error);
        wrap.classList.remove("hidden");
    }

    function clearGlobalError() { byId("admin-global-error").classList.add("hidden"); }

    function friendlyAuthError(error) {
        if (error && (error.status === 400 || error.status === 401)) return "Feil e-post eller passord.";
        return error && error.message ? error.message : "Innloggingen feilet.";
    }

    function setButtonBusy(button, busy, busyLabel) {
        if (!button.dataset.idleLabel) button.dataset.idleLabel = button.textContent;
        button.disabled = busy;
        button.classList.toggle("opacity-60", busy);
        button.textContent = busy ? busyLabel : button.dataset.idleLabel;
    }

    function formatNOKOre(amountOre) {
        var amount = Number(amountOre || 0) / 100;
        return amount.toLocaleString("nb-NO", {
            minimumFractionDigits: amountOre % 100 ? 2 : 0,
            maximumFractionDigits: 2
        }) + " kr";
    }

    function formatVatRate(rateBasisPoints) {
        return (Number(rateBasisPoints || 0) / 100).toLocaleString("nb-NO", {
            minimumFractionDigits: rateBasisPoints % 100 ? 2 : 0,
            maximumFractionDigits: 2
        }) + " %";
    }

    function priceExVatOre(priceOre, rateBasisPoints) {
        return Math.round(priceOre * 10000 / (10000 + rateBasisPoints));
    }

    function normalizeStockStatus(value) {
        return value === "remote_stock" || value === "fjernlager" ? "remote_stock" : "in_stock";
    }

    function slugify(value) {
        return String(value || "")
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "element";
    }

    function categoryById(id) {
        return catalog.categories.find(function (category) { return category.id === id; });
    }

    function categoryLabel(id) {
        var category = categoryById(id);
        if (!category) return "Ukjent kategori";
        var parent = category.parent_id ? categoryById(category.parent_id) : null;
        return parent ? parent.name + " / " + category.name : category.name;
    }

    function categoryTint(id) {
        var category = categoryById(id);
        var parent = category && category.parent_id ? categoryById(category.parent_id) : category;
        return parent ? parent.slug : "tilbehor";
    }

    function productsWithVariants() {
        return catalog.products.map(function (product) {
            return Object.assign({}, product, {
                variants: catalog.variants.filter(function (variant) { return variant.product_id === product.id; })
            });
        });
    }

    async function loadCatalogAndRender() {
        clearGlobalError();
        catalog = await adminClient.loadCatalog();
        renderProductTable();
        renderColorList();
    }

    async function enterAdmin() {
        adminContext = await adminClient.loadStoreContext();
        byId("admin-store-name").textContent = adminContext.storeName + " · " + adminContext.role;
        byId("admin-user-label").textContent = adminContext.user.email || "Innlogget bruker";
        await loadCatalogAndRender();
        showOnly("admin-app");
    }

    async function initialize() {
        showOnly("admin-loading");
        try {
            var config = await window.SupabaseAdmin.publicConfig();
            adminClient = window.SupabaseAdmin.create(config);
            var session = await adminClient.restoreSession();
            if (!session) {
                showOnly("admin-login");
                return;
            }
            await enterAdmin();
        } catch (error) {
            showOnly("admin-login");
            var errorEl = byId("login-error");
            errorEl.textContent = error.message;
            errorEl.classList.remove("hidden");
        }
    }

    byId("login-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        var errorEl = byId("login-error");
        var submit = byId("login-submit");
        errorEl.classList.add("hidden");
        setButtonBusy(submit, true, "Logger inn …");
        try {
            await adminClient.signIn(byId("login-email").value.trim(), byId("login-password").value);
            await enterAdmin();
            byId("login-password").value = "";
        } catch (error) {
            if (adminClient) await adminClient.signOut();
            errorEl.textContent = friendlyAuthError(error);
            errorEl.classList.remove("hidden");
        } finally {
            setButtonBusy(submit, false, "Logger inn …");
        }
    });

    byId("logout-btn").addEventListener("click", async function () {
        await adminClient.signOut();
        adminContext = null;
        catalog = { categories: [], products: [], variants: [], colors: [] };
        showOnly("admin-login");
        showToast("Du er logget ut.");
    });

    function renderProductTable() {
        var products = productsWithVariants();
        var body = byId("product-table-body");
        byId("product-count").textContent = products.length + " produkter";

        if (!products.length) {
            body.innerHTML = '<tr><td colspan="6" class="px-4 py-10 text-center text-on-surface-variant">Ingen produkter ennå.</td></tr>';
            return;
        }

        body.innerHTML = products.map(function (product) {
            var activeVariants = product.variants.filter(function (variant) { return variant.is_active; });
            var variantsLabel = activeVariants.map(function (variant) {
                var price = variant.campaign_price_ore == null ? variant.price_ore : variant.campaign_price_ore;
                return html(variant.label) + " · " + html(formatNOKOre(price));
            }).join("<br>");
            var image = product.image_path
                ? '<img src="' + html(adminClient.publicStorageUrl(product.image_path)) + '" alt="" class="w-11 h-11 rounded-lg object-cover border border-outline-variant/20">'
                : '<span class="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center"><span class="material-symbols-outlined text-primary">inventory_2</span></span>';
            return '' +
                '<tr class="border-t border-outline-variant/15">' +
                '  <td class="px-4 py-3"><div class="flex items-center gap-3">' + image + '<div class="min-w-0"><p class="font-semibold text-deep-forest truncate">' + html(product.name) + '</p><p class="text-xs text-on-surface-variant truncate">' + html(product.slug) + '</p></div></div></td>' +
                '  <td class="px-4 py-3 text-on-surface-variant">' + html(categoryLabel(product.category_id)) + '</td>' +
                '  <td class="px-4 py-3 text-on-surface-variant leading-5">' + (variantsLabel || "Ingen aktive varianter") + '</td>' +
                '  <td class="px-4 py-3 text-on-surface-variant">' + html(formatVatRate(product.vat_rate_basis_points)) + '</td>' +
                '  <td class="px-4 py-3"><label class="inline-flex items-center gap-2 cursor-pointer"><input type="checkbox" data-toggle-product="' + html(product.id) + '" class="rounded border-outline-variant text-vibrant-orange focus:ring-vibrant-orange" ' + (product.is_active ? "checked" : "") + '><span class="text-xs font-semibold ' + (product.is_active ? "text-secondary" : "text-on-surface-variant") + '">' + (product.is_active ? "Aktiv" : "Inaktiv") + '</span></label></td>' +
                '  <td class="px-4 py-3 text-right"><button type="button" data-edit-product="' + html(product.id) + '" class="text-primary font-semibold text-sm hover:text-vibrant-orange">Rediger</button></td>' +
                '</tr>';
        }).join("");

        body.querySelectorAll("[data-edit-product]").forEach(function (button) {
            button.addEventListener("click", function () {
                openProductModal(products.find(function (product) { return product.id === button.dataset.editProduct; }));
            });
        });
        body.querySelectorAll("[data-toggle-product]").forEach(function (input) {
            input.addEventListener("change", async function () {
                input.disabled = true;
                try {
                    await adminClient.updateProductActive(input.dataset.toggleProduct, input.checked);
                    await loadCatalogAndRender();
                    showToast(input.checked ? "Produktet er aktivert." : "Produktet er deaktivert.");
                } catch (error) {
                    showGlobalError(error);
                    input.checked = !input.checked;
                    input.disabled = false;
                }
            });
        });
    }

    function populateCategorySelect(selectedId) {
        var select = byId("pf-category");
        select.innerHTML = "";
        var parents = catalog.categories.filter(function (category) { return !category.parent_id; });
        parents.forEach(function (parent) {
            var children = catalog.categories.filter(function (category) { return category.parent_id === parent.id; });
            var group = document.createElement("optgroup");
            group.label = parent.name;
            (children.length ? children : [parent]).forEach(function (category) {
                if (!category.is_active && category.id !== selectedId) return;
                var option = document.createElement("option");
                option.value = category.id;
                option.textContent = category.name + (category.is_active ? "" : " (inaktiv)");
                option.selected = category.id === selectedId;
                group.appendChild(option);
            });
            if (group.children.length) select.appendChild(group);
        });
    }

    function setImagePreview(url) {
        var preview = byId("pf-image-preview");
        preview.replaceChildren();
        if (!url) {
            var icon = document.createElement("span");
            icon.className = "material-symbols-outlined text-4xl";
            icon.textContent = "image";
            preview.appendChild(icon);
            return;
        }
        var image = document.createElement("img");
        image.src = url;
        image.alt = "Forhåndsvisning";
        image.className = "w-full h-full object-cover";
        preview.appendChild(image);
    }

    function revokePreviewUrl() {
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
    }

    function variantRow(variant) {
        var row = document.createElement("div");
        row.className = "border border-outline-variant/30 rounded-xl p-4 bg-surface-container/40";
        row.dataset.variantId = variant && variant.id ? variant.id : crypto.randomUUID();
        row.innerHTML = '' +
            '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">' +
            '  <div><label class="block text-xs font-semibold mb-1">Variant</label><input required maxlength="160" data-v-label class="field text-sm" placeholder="F.eks. 2,7 l"></div>' +
            '  <div><label class="block text-xs font-semibold mb-1">SKU (valgfritt)</label><input maxlength="120" data-v-sku class="field text-sm"></div>' +
            '  <div><label class="block text-xs font-semibold mb-1">Ordinær pris inkl. MVA</label><input required min="0.01" step="0.01" type="number" data-v-price class="field text-sm"><span data-v-ex-vat class="block text-[10px] text-on-surface-variant mt-1"></span></div>' +
            '  <div><label class="block text-xs font-semibold mb-1">Kampanjepris inkl. MVA</label><input min="0.01" step="0.01" type="number" data-v-campaign class="field text-sm" placeholder="Valgfritt"></div>' +
            '  <div><label class="block text-xs font-semibold mb-1">Lagerstatus</label><select data-v-stock class="field text-sm"><option value="in_stock">På lager</option><option value="remote_stock">Fjernlager / bestillingsvare</option></select></div>' +
            '  <div class="sm:col-span-2"><label class="block text-xs font-semibold mb-1">Forventet leveringstid</label><input required maxlength="200" data-v-lead class="field text-sm"></div>' +
            '  <div><label class="block text-xs font-semibold mb-1">Intern leverandørreferanse</label><input maxlength="250" data-v-supplier class="field text-sm"></div>' +
            '</div>' +
            '<div class="flex items-center justify-between mt-3"><label class="flex items-center gap-2 text-xs"><input type="checkbox" data-v-active class="rounded text-vibrant-orange"><span>Aktiv variant</span></label><button type="button" data-v-remove class="text-error text-xs font-semibold">Fjern fra skjema</button></div>';

        row.querySelector("[data-v-label]").value = variant ? variant.label || "" : "";
        row.querySelector("[data-v-sku]").value = variant ? variant.sku || "" : "";
        row.querySelector("[data-v-price]").value = variant ? (variant.price_ore / 100).toFixed(2) : "";
        row.querySelector("[data-v-campaign]").value = variant && variant.campaign_price_ore != null ? (variant.campaign_price_ore / 100).toFixed(2) : "";
        row.querySelector("[data-v-stock]").value = normalizeStockStatus(variant && variant.stock_status);
        row.querySelector("[data-v-lead]").value = variant ? variant.expected_lead_time || "" : "Normalt klar for henting samme dag";
        row.querySelector("[data-v-supplier]").value = variant ? variant.supplier_reference || "" : "";
        row.querySelector("[data-v-active]").checked = variant ? variant.is_active !== false : true;
        row.querySelector("[data-v-remove]").addEventListener("click", function () {
            if (byId("pf-variants").children.length === 1) {
                showToast("Et produkt må ha minst én variant.");
                return;
            }
            row.remove();
        });
        row.querySelector("[data-v-stock]").addEventListener("change", function (event) {
            var lead = row.querySelector("[data-v-lead]");
            if (!lead.value || lead.value === "Normalt klar for henting samme dag" || lead.value === "3–7 dager") {
                lead.value = event.target.value === "remote_stock" ? "3–7 dager" : "Normalt klar for henting samme dag";
            }
        });
        row.querySelector("[data-v-price]").addEventListener("input", updateVariantExVat);
        byId("pf-variants").appendChild(row);
        updateVariantExVat();
    }

    function updateVariantExVat() {
        var vatRate = Math.round((Number(byId("pf-vat-rate").value) || 0) * 100);
        byId("pf-variants").querySelectorAll(":scope > div").forEach(function (row) {
            var priceOre = Math.round((Number(row.querySelector("[data-v-price]").value) || 0) * 100);
            row.querySelector("[data-v-ex-vat]").textContent = priceOre > 0 ? "Eks. MVA: " + formatNOKOre(priceExVatOre(priceOre, vatRate)) : "";
        });
    }

    byId("pf-vat-rate").addEventListener("input", updateVariantExVat);
    byId("pf-add-variant").addEventListener("click", function () { variantRow(null); });

    function openProductModal(product) {
        editingProduct = product || null;
        revokePreviewUrl();
        byId("product-modal-title").textContent = product ? "Rediger produkt" : "Nytt produkt";
        byId("pf-name").value = product ? product.name : "";
        byId("pf-short-desc").value = product ? product.short_description || "" : "";
        byId("pf-description").value = product ? product.description || "" : "";
        byId("pf-usearea").value = product ? product.use_area || "" : "";
        byId("pf-vat-rate").value = product ? product.vat_rate_basis_points / 100 : 25;
        byId("pf-has-color").checked = product ? product.has_color : false;
        byId("pf-featured").checked = product ? product.is_featured : false;
        byId("pf-active").checked = product ? product.is_active : true;
        byId("pf-image").value = "";
        byId("pf-image-info").textContent = "";
        byId("pf-error").classList.add("hidden");
        populateCategorySelect(product ? product.category_id : null);
        if (!product && byId("pf-category").options.length) byId("pf-category").selectedIndex = 0;
        setImagePreview(product && product.image_path ? adminClient.publicStorageUrl(product.image_path) : "");
        byId("pf-variants").innerHTML = "";
        (product && product.variants.length ? product.variants : [null]).forEach(variantRow);
        byId("product-modal").classList.remove("hidden");
    }

    function closeProductModal() {
        byId("product-modal").classList.add("hidden");
        revokePreviewUrl();
    }

    byId("new-product-btn").addEventListener("click", function () { openProductModal(null); });
    byId("product-modal-close").addEventListener("click", closeProductModal);
    byId("pf-cancel").addEventListener("click", closeProductModal);
    byId("product-modal").addEventListener("click", function (event) { if (event.target === byId("product-modal")) closeProductModal(); });
    byId("pf-image").addEventListener("change", function (event) {
        revokePreviewUrl();
        var file = event.target.files[0];
        if (!file) {
            setImagePreview(editingProduct && editingProduct.image_path ? adminClient.publicStorageUrl(editingProduct.image_path) : "");
            return;
        }
        previewObjectUrl = URL.createObjectURL(file);
        setImagePreview(previewObjectUrl);
        byId("pf-image-info").textContent = "Original: " + Math.round(file.size / 1024) + " KB";
    });

    function collectVariants() {
        return Array.from(byId("pf-variants").children).map(function (row, index) {
            var label = row.querySelector("[data-v-label]").value.trim();
            var priceOre = Math.round(Number(row.querySelector("[data-v-price]").value) * 100);
            var campaignValue = row.querySelector("[data-v-campaign]").value;
            var campaignPriceOre = campaignValue === "" ? null : Math.round(Number(campaignValue) * 100);
            if (!label || !Number.isInteger(priceOre) || priceOre <= 0) throw new Error("Alle varianter må ha navn og en gyldig pris.");
            if (campaignPriceOre != null && (!Number.isInteger(campaignPriceOre) || campaignPriceOre < 0 || campaignPriceOre >= priceOre)) {
                throw new Error("Kampanjepris må være lavere enn ordinær pris.");
            }
            var leadTime = row.querySelector("[data-v-lead]").value.trim();
            if (!leadTime) throw new Error("Alle varianter må ha forventet leveringstid.");
            return {
                id: row.dataset.variantId,
                label: label,
                sku: row.querySelector("[data-v-sku]").value.trim(),
                price_ore: priceOre,
                campaign_price_ore: campaignPriceOre,
                stock_status: normalizeStockStatus(row.querySelector("[data-v-stock]").value),
                expected_lead_time: leadTime,
                supplier_reference: row.querySelector("[data-v-supplier]").value.trim(),
                is_active: row.querySelector("[data-v-active]").checked,
                sort_order: (index + 1) * 10
            };
        });
    }

    byId("product-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        var errorEl = byId("pf-error");
        var submit = byId("pf-submit");
        var uploadedPath = null;
        errorEl.classList.add("hidden");
        setButtonBusy(submit, true, "Lagrer …");

        try {
            var name = byId("pf-name").value.trim();
            var categoryId = byId("pf-category").value;
            var vatRateBasisPoints = Math.round(Number(byId("pf-vat-rate").value) * 100);
            if (!name || !categoryId) throw new Error("Navn og kategori er påkrevd.");
            if (!Number.isInteger(vatRateBasisPoints) || vatRateBasisPoints < 0 || vatRateBasisPoints > 10000) throw new Error("MVA-satsen må være mellom 0 og 100 prosent.");

            var productId = editingProduct ? editingProduct.id : crypto.randomUUID();
            var oldImagePath = editingProduct ? editingProduct.image_path : null;
            var imagePath = oldImagePath;
            var imageFile = byId("pf-image").files[0];
            if (imageFile) {
                byId("pf-image-info").textContent = "Komprimerer bildet …";
                var compressed = await window.ImageCompression.compressImage(imageFile);
                byId("pf-image-info").textContent = "Komprimert til " + Math.round(compressed.blob.size / 1024) + " KB (" + compressed.width + " × " + compressed.height + ")";
                uploadedPath = await adminClient.uploadProductImage(productId, name, compressed.blob);
                imagePath = uploadedPath;
            }

            var productData = {
                id: productId,
                category_id: categoryId,
                slug: editingProduct ? editingProduct.slug : slugify(name) + "-" + productId.slice(0, 8),
                name: name,
                short_description: byId("pf-short-desc").value.trim(),
                description: byId("pf-description").value.trim(),
                use_area: byId("pf-usearea").value.trim(),
                image_path: imagePath || "",
                icon: editingProduct ? editingProduct.icon || "inventory_2" : "inventory_2",
                tint: categoryTint(categoryId),
                variant_type: editingProduct ? editingProduct.variant_type || "storrelse" : "storrelse",
                has_color: byId("pf-has-color").checked,
                vat_rate_basis_points: vatRateBasisPoints,
                is_featured: byId("pf-featured").checked,
                is_active: byId("pf-active").checked,
                sort_order: editingProduct ? editingProduct.sort_order : (catalog.products.length + 1) * 10
            };

            await adminClient.saveProduct(productData, collectVariants());

            if (uploadedPath && oldImagePath && oldImagePath !== uploadedPath) {
                adminClient.deleteStorageObject(oldImagePath).catch(function (error) {
                    console.warn("Gammelt produktbilde kunne ikke slettes:", error.message);
                });
            }
            await loadCatalogAndRender();
            closeProductModal();
            showToast(editingProduct ? "Produktet er oppdatert i Supabase." : "Produktet er opprettet i Supabase.");
        } catch (error) {
            if (uploadedPath) {
                await adminClient.deleteStorageObject(uploadedPath).catch(function () {});
            }
            errorEl.textContent = error.message;
            errorEl.classList.remove("hidden");
        } finally {
            setButtonBusy(submit, false, "Lagrer …");
        }
    });

    function safeHex(value) { return /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#ffffff"; }

    function renderColorList() {
        var wrap = byId("color-list");
        if (!catalog.colors.length) {
            wrap.innerHTML = '<p class="text-on-surface-variant">Ingen farger ennå.</p>';
            return;
        }
        wrap.innerHTML = catalog.colors.map(function (color) {
            return '' +
                '<div class="bg-white border border-outline-variant/30 rounded-xl p-4 flex items-center gap-3">' +
                '  <span class="w-12 h-12 rounded-lg border border-outline-variant/40 shrink-0" style="background-color:' + safeHex(color.hex) + '"></span>' +
                '  <div class="min-w-0 flex-1"><p class="font-semibold text-deep-forest truncate">' + html(color.name) + '</p><p class="text-xs text-on-surface-variant">' + html(color.code) + (color.supplier ? " · " + html(color.supplier) : "") + '</p></div>' +
                '  <label class="flex items-center gap-1 text-xs"><input data-toggle-color="' + html(color.id) + '" type="checkbox" class="rounded text-vibrant-orange" ' + (color.is_active ? "checked" : "") + '><span>Aktiv</span></label>' +
                '  <button data-edit-color="' + html(color.id) + '" type="button" aria-label="Rediger ' + html(color.name) + '" class="text-primary"><span class="material-symbols-outlined text-[20px]">edit</span></button>' +
                '</div>';
        }).join("");
        wrap.querySelectorAll("[data-edit-color]").forEach(function (button) {
            button.addEventListener("click", function () {
                openColorModal(catalog.colors.find(function (color) { return color.id === button.dataset.editColor; }));
            });
        });
        wrap.querySelectorAll("[data-toggle-color]").forEach(function (input) {
            input.addEventListener("change", async function () {
                input.disabled = true;
                try {
                    await adminClient.updateColorActive(input.dataset.toggleColor, input.checked);
                    await loadCatalogAndRender();
                    showToast("Fargestatus er oppdatert.");
                } catch (error) {
                    showGlobalError(error);
                    input.checked = !input.checked;
                    input.disabled = false;
                }
            });
        });
    }

    function openColorModal(color) {
        editingColor = color || null;
        byId("color-modal-title").textContent = color ? "Rediger farge" : "Ny farge";
        byId("cf-name").value = color ? color.name : "";
        byId("cf-code").value = color ? color.code : "";
        byId("cf-hex").value = color ? safeHex(color.hex) : "#ffffff";
        byId("cf-supplier").value = color ? color.supplier || "" : "";
        byId("cf-featured").checked = color ? color.is_featured : true;
        byId("cf-active").checked = color ? color.is_active : true;
        byId("cf-error").classList.add("hidden");
        byId("color-modal").classList.remove("hidden");
    }

    function closeColorModal() { byId("color-modal").classList.add("hidden"); }
    byId("new-color-btn").addEventListener("click", function () { openColorModal(null); });
    byId("color-modal-close").addEventListener("click", closeColorModal);
    byId("cf-cancel").addEventListener("click", closeColorModal);
    byId("color-modal").addEventListener("click", function (event) { if (event.target === byId("color-modal")) closeColorModal(); });
    byId("color-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        var errorEl = byId("cf-error");
        var submit = byId("cf-submit");
        errorEl.classList.add("hidden");
        setButtonBusy(submit, true, "Lagrer …");
        try {
            var name = byId("cf-name").value.trim();
            var code = byId("cf-code").value.trim();
            if (!name || !code) throw new Error("Navn og fargekode er påkrevd.");
            var id = editingColor ? editingColor.id : crypto.randomUUID();
            await adminClient.saveColor({
                id: id,
                exists: !!editingColor,
                slug: editingColor ? editingColor.slug : slugify(name) + "-" + id.slice(0, 8),
                name: name,
                code: code,
                hex: byId("cf-hex").value,
                supplier: byId("cf-supplier").value.trim(),
                is_featured: byId("cf-featured").checked,
                is_active: byId("cf-active").checked,
                sort_order: editingColor ? editingColor.sort_order : (catalog.colors.length + 1) * 10
            });
            await loadCatalogAndRender();
            closeColorModal();
            showToast(editingColor ? "Fargen er oppdatert." : "Fargen er opprettet.");
        } catch (error) {
            errorEl.textContent = error.message;
            errorEl.classList.remove("hidden");
        } finally {
            setButtonBusy(submit, false, "Lagrer …");
        }
    });

    initialize();
})();
