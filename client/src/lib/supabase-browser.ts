import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseBrowserConfigured = Boolean(url && publishableKey);

let client: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  if (!url || !publishableKey) throw new Error("MtaaMarket email sign-in is not configured yet.");
  if (!client) client = createClient(url, publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}

export const SUPABASE_ACCESS_TOKEN_KEY = "mtaamarket-supabase-access-token";
