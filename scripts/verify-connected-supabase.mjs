import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error("Supabase API connector variables are unavailable.");
  process.exit(1);
}

let host;
try {
  host = new URL(url).host;
} catch {
  console.error(JSON.stringify({
    connectorVariablesPresent: true,
    validSupabaseUrl: false,
    message: "The enabled connector did not provide a valid Supabase project URL.",
  }));
  process.exit(1);
}

const client = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { count, error } = await client
  .from("categories")
  .select("id", { count: "exact", head: true });

if (error) {
  console.error("Connected Supabase project could not complete the safe MtaaMarket category check.");
  process.exit(1);
}

console.log(JSON.stringify({
  host,
  expectedIsolatedMtaaMarketHost: host === "mfgjpjtlmfdtsnkoluco.supabase.co",
  categoryCount: count ?? 0,
}, null, 2));
