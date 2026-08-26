import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

function requireEnvironment(name: "VITE_SUPABASE_URL" | "VITE_SUPABASE_PUBLISHABLE_KEY" | "SUPABASE_SECRET_KEY" | "SUPABASE_JWKS_URL") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for the isolated MtaaMarket Supabase adapter.`);
  return value;
}

export function isSupabaseConfigured() {
  return Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_SECRET_KEY && process.env.SUPABASE_JWKS_URL);
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  return {
    url: requireEnvironment("VITE_SUPABASE_URL"),
    publishableKey: requireEnvironment("VITE_SUPABASE_PUBLISHABLE_KEY"),
  };
}

let serviceClient: SupabaseClient | undefined;

/** Server only: this client is never imported by browser code and uses the protected secret key. */
export function getSupabaseServiceClient() {
  if (!serviceClient) {
    serviceClient = createClient(requireEnvironment("VITE_SUPABASE_URL"), requireEnvironment("SUPABASE_SECRET_KEY"), {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }
  return serviceClient;
}

let remoteJwks: ReturnType<typeof createRemoteJWKSet> | undefined;

export async function verifySupabaseAccessToken(accessToken: string): Promise<JWTPayload> {
  if (!accessToken || accessToken.length < 20) throw new Error("A Supabase access token is required.");
  if (!remoteJwks) remoteJwks = createRemoteJWKSet(new URL(requireEnvironment("SUPABASE_JWKS_URL")));
  const { payload } = await jwtVerify(accessToken, remoteJwks, { audience: "authenticated" });
  if (!payload.sub) throw new Error("Supabase access token is missing a subject.");
  return payload;
}
