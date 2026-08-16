const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=300, stale-while-revalidate=3600"
  },
  body: JSON.stringify(body)
});

export async function handler() {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
  const storeSlug = process.env.STORE_SLUG || "";

  if (!supabaseUrl || !supabaseAnonKey || !storeSlug) {
    return json(200, { enabled: false });
  }

  return json(200, {
    enabled: true,
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    supabaseAnonKey,
    storeSlug
  });
}
