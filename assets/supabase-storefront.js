/*
 * Public, read-only storefront repository.
 *
 * Supabase URL, anon key and deployment store slug come from a Netlify
 * Function backed by environment variables. No tenant identity or key is
 * embedded in the reusable frontend. When config/Supabase is unavailable,
 * callers keep using the existing demo data.
 */
(function (global) {
    "use strict";

    function publicConfig() {
        if (global.PUBLIC_APP_CONFIG) {
            return Promise.resolve(global.PUBLIC_APP_CONFIG);
        }

        return fetch("/.netlify/functions/public-config", {
            headers: { accept: "application/json" }
        }).then(function (response) {
            if (!response.ok) throw new Error("Kunne ikke hente offentlig app-konfigurasjon.");
            return response.json();
        });
    }

    function rest(config, table, params) {
        var query = new URLSearchParams(params || {}).toString();
        return fetch(config.supabaseUrl + "/rest/v1/" + table + (query ? "?" + query : ""), {
            headers: {
                accept: "application/json",
                apikey: config.supabaseAnonKey,
                authorization: "Bearer " + config.supabaseAnonKey
            }
        }).then(function (response) {
            if (!response.ok) {
                return response.text().then(function (body) {
                    throw new Error("Supabase " + table + " svarte " + response.status + ": " + body);
                });
            }
            return response.json();
        });
    }

    function storageUrl(config, path) {
        if (!path) return null;
        if (/^(?:https?:)?\/\//i.test(path) || path.charAt(0) === "/") return path;
        return config.supabaseUrl + "/storage/v1/object/public/store-assets/" +
            path.split("/").map(encodeURIComponent).join("/");
    }

    function stockStatus(value) {
        return value === "remote_stock" || value === "fjernlager" ? "remote_stock" : "in_stock";
    }

    function storeConfig(config, store) {
        return {
            id: store.id,
            slug: store.slug,
            name: store.name,
            legalName: store.legal_name || store.name,
            region: store.region || "",
            footerTagline: store.footer_tagline || "",
            logoPath: storageUrl(config, store.logo_path),
            address: store.address,
            phoneDisplay: store.phone_display || "",
            phoneHref: store.phone_href || "",
            openingHours: store.opening_hours || [],
            supplierColorUrl: store.supplier_color_url || "",
            supplierColorLabel: store.supplier_color_label || "leverandøren",
            theme: store.theme || {},
            settings: store.settings || {}
        };
    }

    function categoryModel(rows) {
        var byId = {};
        rows.forEach(function (row) { byId[row.id] = row; });

        var meta = {};
        rows.filter(function (row) { return !row.parent_id; }).forEach(function (parent) {
            meta[parent.slug] = {
                id: parent.id,
                title: parent.name,
                intro: parent.description || "",
                imageUrl: parent.image_path || null,
                subcategories: rows
                    .filter(function (child) { return child.parent_id === parent.id; })
                    .sort(function (a, b) { return a.sort_order - b.sort_order; })
                    .map(function (child) { return child.name; })
            };
        });

        return { byId: byId, meta: meta };
    }

    function productModel(config, products, variants, categories) {
        var variantsByProduct = {};
        variants.forEach(function (variant) {
            if (!variantsByProduct[variant.product_id]) variantsByProduct[variant.product_id] = [];
            variantsByProduct[variant.product_id].push(variant);
        });

        return products.map(function (product) {
            var category = categories.byId[product.category_id];
            var parent = category && category.parent_id ? categories.byId[category.parent_id] : category;
            var productVariants = (variantsByProduct[product.id] || [])
                .sort(function (a, b) { return a.sort_order - b.sort_order; })
                .map(function (variant) {
                    var regularPrice = variant.price_ore / 100;
                    var campaignPrice = variant.campaign_price_ore == null ? null : variant.campaign_price_ore / 100;
                    var effectivePriceOre = campaignPrice == null ? variant.price_ore : variant.campaign_price_ore;
                    var vatRateBasisPoints = product.vat_rate_basis_points;
                    var priceExVatOre = Math.round(effectivePriceOre * 10000 / (10000 + vatRateBasisPoints));
                    return {
                        id: variant.id,
                        label: variant.label,
                        sku: variant.sku,
                        priceOre: effectivePriceOre,
                        priceExVatOre: priceExVatOre,
                        priceExVat: priceExVatOre / 100,
                        vatRateBasisPoints: vatRateBasisPoints,
                        regularPriceOre: variant.price_ore,
                        campaignPriceOre: variant.campaign_price_ore,
                        price: campaignPrice == null ? regularPrice : campaignPrice,
                        regularPrice: regularPrice,
                        campaignPrice: campaignPrice,
                        stockStatus: stockStatus(variant.stock_status),
                        expectedLeadTime: variant.expected_lead_time
                    };
                });

            return {
                databaseId: product.id,
                id: product.slug,
                name: product.name,
                shortDesc: product.short_description || "",
                description: product.description || "",
                useArea: product.use_area || "",
                category: parent ? parent.slug : "",
                subcategory: category ? category.name : "",
                categoryId: product.category_id,
                icon: product.icon || "inventory_2",
                imageUrl: storageUrl(config, product.image_path),
                tint: product.tint || (parent ? parent.slug : "tilbehor"),
                variantType: product.variant_type,
                hasColor: product.has_color,
                vatRateBasisPoints: product.vat_rate_basis_points,
                featured: product.is_featured,
                active: product.is_active,
                variants: productVariants
            };
        }).filter(function (product) { return product.variants.length > 0; });
    }

    function colorModel(rows) {
        return rows.map(function (color) {
            return {
                databaseId: color.id,
                id: color.slug,
                name: color.name,
                code: color.code,
                hex: color.hex,
                supplier: color.supplier,
                featured: color.is_featured
            };
        });
    }

    function loadCatalog() {
        return publicConfig().then(function (config) {
            if (!config || !config.enabled) throw new Error("Supabase er ikke konfigurert for denne deployen.");

            return rest(config, "stores", {
                slug: "eq." + config.storeSlug,
                is_active: "eq.true",
                select: "id,slug,name,legal_name,region,footer_tagline,logo_path,address,phone_display,phone_href,opening_hours,supplier_color_url,supplier_color_label,theme,settings",
                limit: "1"
            }).then(function (stores) {
                if (!stores.length) throw new Error("Fant ingen aktiv butikk for STORE_SLUG.");
                var store = stores[0];

                return Promise.all([
                    rest(config, "categories", {
                        store_id: "eq." + store.id,
                        is_active: "eq.true",
                        select: "id,parent_id,slug,name,description,image_path,icon,sort_order",
                        order: "sort_order.asc"
                    }),
                    rest(config, "products", {
                        store_id: "eq." + store.id,
                        is_active: "eq.true",
                        select: "id,category_id,slug,name,short_description,description,use_area,image_path,icon,tint,variant_type,has_color,vat_rate_basis_points,is_featured,is_active,sort_order",
                        order: "sort_order.asc"
                    }),
                    rest(config, "product_variants", {
                        store_id: "eq." + store.id,
                        is_active: "eq.true",
                        select: "id,product_id,label,sku,price_ore,campaign_price_ore,stock_status,expected_lead_time,sort_order",
                        order: "sort_order.asc"
                    }),
                    rest(config, "colors", {
                        store_id: "eq." + store.id,
                        is_active: "eq.true",
                        select: "id,slug,name,code,hex,supplier,is_featured,sort_order",
                        order: "sort_order.asc"
                    })
                ]).then(function (result) {
                    var categories = categoryModel(result[0]);
                    var products = productModel(config, result[1], result[2], categories);
                    return {
                        source: "supabase",
                        store: storeConfig(config, store),
                        categories: categories.meta,
                        products: products,
                        featuredProductIds: products.filter(function (product) { return product.featured; }).map(function (product) { return product.id; }),
                        colors: colorModel(result[3])
                    };
                });
            });
        });
    }

    global.StorefrontRepository = { loadCatalog: loadCatalog };
})(window);
