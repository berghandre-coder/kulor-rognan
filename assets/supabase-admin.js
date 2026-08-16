/*
 * Authenticated Supabase admin client for the static storefront.
 * Uses only the public/publishable key. JWT membership + database RLS are the
 * authority for every read and write; caller-provided store ids are ignored.
 */
(function (global) {
    "use strict";

    var SESSION_KEY = "aema_storefront_admin_session";

    function publicConfig() {
        if (global.PUBLIC_APP_CONFIG) return Promise.resolve(global.PUBLIC_APP_CONFIG);
        return fetch("/.netlify/functions/public-config", {
            headers: { accept: "application/json" },
            cache: "no-store"
        }).then(function (response) {
            if (!response.ok) throw new Error("Kunne ikke hente Supabase-konfigurasjon.");
            return response.json();
        });
    }

    function parseBody(response) {
        if (response.status === 204) return Promise.resolve(null);
        return response.text().then(function (text) {
            if (!text) return null;
            try { return JSON.parse(text); } catch (error) { return text; }
        });
    }

    function apiError(response, body) {
        var message = body && typeof body === "object"
            ? (body.message || body.error_description || body.error || "Ukjent API-feil")
            : (body || "Ukjent API-feil");
        var error = new Error(message);
        error.status = response.status;
        error.code = body && body.code;
        return error;
    }

    function create(config) {
        if (!config || !config.enabled || !config.supabaseUrl || !config.supabaseAnonKey || !config.storeSlug) {
            throw new Error("Supabase er ikke konfigurert for admin.");
        }

        var baseUrl = config.supabaseUrl.replace(/\/$/, "");
        var publishableKey = config.supabaseAnonKey;
        var session = null;
        var storeContext = null;

        function saveSession(nextSession) {
            session = nextSession || null;
            if (session) {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
            } else {
                sessionStorage.removeItem(SESSION_KEY);
            }
        }

        function authRequest(path, options) {
            var requestOptions = Object.assign({}, options || {});
            requestOptions.headers = Object.assign({
                apikey: publishableKey,
                accept: "application/json"
            }, requestOptions.headers || {});
            return fetch(baseUrl + "/auth/v1/" + path, requestOptions).then(function (response) {
                return parseBody(response).then(function (body) {
                    if (!response.ok) throw apiError(response, body);
                    return body;
                });
            });
        }

        function refreshSession() {
            if (!session || !session.refresh_token) return Promise.reject(new Error("Innloggingen er utløpt."));
            return authRequest("token?grant_type=refresh_token", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ refresh_token: session.refresh_token })
            }).then(function (nextSession) {
                saveSession(nextSession);
                return nextSession;
            }).catch(function (error) {
                saveSession(null);
                throw error;
            });
        }

        function authenticatedFetch(url, options, canRefresh) {
            if (!session || !session.access_token) return Promise.reject(new Error("Du må logge inn."));
            var requestOptions = Object.assign({}, options || {});
            requestOptions.headers = Object.assign({
                apikey: publishableKey,
                authorization: "Bearer " + session.access_token,
                accept: "application/json"
            }, requestOptions.headers || {});

            return fetch(url, requestOptions).then(function (response) {
                if (response.status === 401 && canRefresh !== false && session && session.refresh_token) {
                    return refreshSession().then(function () {
                        return authenticatedFetch(url, options, false);
                    });
                }
                return parseBody(response).then(function (body) {
                    if (!response.ok) throw apiError(response, body);
                    return body;
                });
            });
        }

        function rest(table, params, options) {
            var query = new URLSearchParams(params || {}).toString();
            return authenticatedFetch(
                baseUrl + "/rest/v1/" + table + (query ? "?" + query : ""),
                options || {},
                true
            );
        }

        function requireStoreContext() {
            if (!storeContext || !storeContext.storeId) throw new Error("Brukeren er ikke koblet til en butikk.");
            return storeContext;
        }

        function signIn(email, password) {
            return authRequest("token?grant_type=password", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email: email, password: password })
            }).then(function (nextSession) {
                saveSession(nextSession);
                return nextSession;
            });
        }

        function restoreSession() {
            var stored = sessionStorage.getItem(SESSION_KEY);
            if (!stored) return Promise.resolve(null);
            try {
                session = JSON.parse(stored);
            } catch (error) {
                saveSession(null);
                return Promise.resolve(null);
            }

            var expiresAt = Number(session.expires_at || 0);
            var ensureFresh = expiresAt && expiresAt < Math.floor(Date.now() / 1000) + 60
                ? refreshSession()
                : Promise.resolve(session);

            return ensureFresh.then(function () {
                return authenticatedFetch(baseUrl + "/auth/v1/user", {}, true);
            }).then(function (user) {
                session.user = user;
                saveSession(session);
                return session;
            }).catch(function () {
                saveSession(null);
                return null;
            });
        }

        function signOut() {
            var request = session && session.access_token
                ? authenticatedFetch(baseUrl + "/auth/v1/logout", { method: "POST" }, false).catch(function () {})
                : Promise.resolve();
            return request.then(function () {
                storeContext = null;
                saveSession(null);
            });
        }

        function loadStoreContext() {
            if (!session || !session.user || !session.user.id) throw new Error("Fant ingen autentisert bruker.");
            return Promise.all([
                rest("store_members", {
                    user_id: "eq." + session.user.id,
                    select: "store_id,role"
                }),
                rest("stores", {
                    slug: "eq." + config.storeSlug,
                    select: "id,slug,name",
                    limit: "1"
                })
            ]).then(function (result) {
                var store = result[1][0];
                var membership = store && result[0].find(function (row) { return row.store_id === store.id; });
                if (!store || !membership) {
                    throw new Error("Brukeren er ikke knyttet til " + config.storeSlug + " i store_members.");
                }
                storeContext = {
                    storeId: store.id,
                    storeSlug: store.slug,
                    storeName: store.name,
                    role: membership.role,
                    user: session.user
                };
                return storeContext;
            });
        }

        function loadCatalog() {
            var context = requireStoreContext();
            var storeFilter = "eq." + context.storeId;
            return Promise.all([
                rest("categories", {
                    store_id: storeFilter,
                    select: "id,parent_id,slug,name,description,image_path,icon,sort_order,is_active",
                    order: "sort_order.asc"
                }),
                rest("products", {
                    store_id: storeFilter,
                    select: "id,category_id,slug,name,short_description,description,use_area,image_path,icon,tint,variant_type,has_color,vat_rate_basis_points,is_featured,is_active,sort_order",
                    order: "sort_order.asc"
                }),
                rest("product_variants", {
                    store_id: storeFilter,
                    select: "id,product_id,label,sku,price_ore,campaign_price_ore,stock_status,expected_lead_time,supplier_reference,is_active,sort_order",
                    order: "sort_order.asc"
                }),
                rest("colors", {
                    store_id: storeFilter,
                    select: "id,slug,name,code,hex,supplier,is_featured,is_active,sort_order",
                    order: "sort_order.asc"
                })
            ]).then(function (result) {
                return { categories: result[0], products: result[1], variants: result[2], colors: result[3] };
            });
        }

        function saveProduct(productData, variants) {
            var context = requireStoreContext();
            var safeProduct = Object.assign({}, productData, { store_id: context.storeId });
            var safeVariants = (variants || []).map(function (variant) {
                var copy = Object.assign({}, variant);
                delete copy.store_id;
                delete copy.product_id;
                return copy;
            });
            return rest("rpc/save_catalog_product", {}, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ product_data: safeProduct, variant_data: safeVariants })
            });
        }

        function updateProductActive(productId, isActive) {
            var context = requireStoreContext();
            return rest("products", {
                id: "eq." + productId,
                store_id: "eq." + context.storeId,
                select: "id,is_active"
            }, {
                method: "PATCH",
                headers: { "content-type": "application/json", prefer: "return=representation" },
                body: JSON.stringify({ is_active: !!isActive })
            });
        }

        function saveColor(colorData) {
            var context = requireStoreContext();
            var payload = {
                id: colorData.id,
                store_id: context.storeId,
                slug: colorData.slug,
                name: colorData.name,
                code: colorData.code,
                hex: colorData.hex,
                supplier: colorData.supplier || null,
                is_featured: !!colorData.is_featured,
                is_active: !!colorData.is_active,
                sort_order: colorData.sort_order || 0
            };
            var isExisting = !!colorData.exists;
            return rest("colors", isExisting ? {
                id: "eq." + colorData.id,
                store_id: "eq." + context.storeId,
                select: "id"
            } : { select: "id" }, {
                method: isExisting ? "PATCH" : "POST",
                headers: { "content-type": "application/json", prefer: "return=representation" },
                body: JSON.stringify(payload)
            });
        }

        function updateColorActive(colorId, isActive) {
            var context = requireStoreContext();
            return rest("colors", {
                id: "eq." + colorId,
                store_id: "eq." + context.storeId,
                select: "id,is_active"
            }, {
                method: "PATCH",
                headers: { "content-type": "application/json", prefer: "return=representation" },
                body: JSON.stringify({ is_active: !!isActive })
            });
        }

        function encodeStoragePath(path) {
            return String(path).split("/").map(encodeURIComponent).join("/");
        }

        function publicStorageUrl(path) {
            if (!path) return "";
            return baseUrl + "/storage/v1/object/public/store-assets/" + encodeStoragePath(path);
        }

        function uploadProductImage(productId, fileName, blob) {
            var context = requireStoreContext();
            var cleanName = String(fileName || "produkt")
                .toLowerCase()
                .normalize("NFKD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "") || "produkt";
            var path = context.storeId + "/products/" + productId + "/" + Date.now() + "-" + cleanName + ".webp";
            return authenticatedFetch(baseUrl + "/storage/v1/object/store-assets/" + encodeStoragePath(path), {
                method: "POST",
                headers: { "content-type": blob.type || "image/webp", "x-upsert": "false" },
                body: blob
            }, true).then(function () { return path; });
        }

        function deleteStorageObject(path) {
            var context = requireStoreContext();
            if (!path || String(path).indexOf(context.storeId + "/") !== 0) {
                return Promise.reject(new Error("Avviste sletting utenfor butikkens bildemappe."));
            }
            return authenticatedFetch(baseUrl + "/storage/v1/object/store-assets", {
                method: "DELETE",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ prefixes: [path] })
            }, true);
        }

        return {
            signIn: signIn,
            signOut: signOut,
            restoreSession: restoreSession,
            loadStoreContext: loadStoreContext,
            loadCatalog: loadCatalog,
            saveProduct: saveProduct,
            updateProductActive: updateProductActive,
            saveColor: saveColor,
            updateColorActive: updateColorActive,
            uploadProductImage: uploadProductImage,
            deleteStorageObject: deleteStorageObject,
            publicStorageUrl: publicStorageUrl,
            getSession: function () { return session; },
            getStoreContext: function () { return storeContext; }
        };
    }

    global.SupabaseAdmin = { publicConfig: publicConfig, create: create };
})(window);
