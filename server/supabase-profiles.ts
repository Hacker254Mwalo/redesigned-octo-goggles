import { getSupabaseServiceClient } from "./supabase";
import type { SupabaseIdentity } from "./supabase-auth";

export type SupabaseMarketplaceProfile = {
  id: string;
  displayName: string;
  role: "buyer" | "vendor" | "admin";
};

function toMarketplaceRole(value: unknown): SupabaseMarketplaceProfile["role"] {
  return value === "vendor" || value === "admin" ? value : "buyer";
}

export function defaultDisplayNameForSupabaseIdentity(identity: SupabaseIdentity) {
  const emailLocalPart = identity.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return (emailLocalPart || "MtaaMarket member").slice(0, 120);
}

function mapProfile(row: { id: string; display_name: string; role: string }): SupabaseMarketplaceProfile {
  return { id: row.id, displayName: row.display_name, role: toMarketplaceRole(row.role) };
}

/** Creates only a lowest-privilege buyer profile for a verified email identity. Founder/admin assignment remains an explicit separate action. */
export async function ensureSupabaseMarketplaceProfile(identity: SupabaseIdentity): Promise<SupabaseMarketplaceProfile> {
  const client = getSupabaseServiceClient();
  const existing = await client.from("marketplace_profiles").select("id, display_name, role").eq("id", identity.subject).maybeSingle();
  if (existing.error) throw new Error("MtaaMarket could not check the email profile.");
  if (existing.data) return mapProfile(existing.data);

  const inserted = await client.from("marketplace_profiles").insert({
    id: identity.subject,
    display_name: defaultDisplayNameForSupabaseIdentity(identity),
    role: "buyer",
  }).select("id, display_name, role").maybeSingle();

  if (!inserted.error && inserted.data) return mapProfile(inserted.data);

  // A concurrent request may have created the same profile. Re-read without disclosing storage details.
  const retry = await client.from("marketplace_profiles").select("id, display_name, role").eq("id", identity.subject).maybeSingle();
  if (retry.error || !retry.data) throw new Error("MtaaMarket could not create the email profile.");
  return mapProfile(retry.data);
}
