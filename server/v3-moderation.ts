import { getSupabaseServiceClient } from "./supabase";
import type { SupabaseIdentity } from "./supabase-auth";

async function requireV3Owner(identity: SupabaseIdentity | null) {
  if (!identity) throw new Error("Sign in with a verified owner email session.");
  const { data, error } = await getSupabaseServiceClient().from("profiles").select("id,role").eq("id", identity.subject).maybeSingle();
  if (error || data?.role !== "admin") throw new Error("Owner access is required for product moderation.");
}

export async function listV3PendingProducts(identity: SupabaseIdentity | null) {
  await requireV3Owner(identity);
  const { data, error } = await getSupabaseServiceClient().from("products").select("id,title,image_url,vendor_id,final_price,status,created_at").eq("status", "PENDING").order("created_at", { ascending: true });
  if (error) throw new Error("MtaaMarket could not load pending products.");
  return data ?? [];
}

export async function moderateV3Product(identity: SupabaseIdentity | null, productId: string, status: "ACTIVE" | "REJECTED") {
  await requireV3Owner(identity);
  const { data, error } = await getSupabaseServiceClient().from("products").update({ status }).eq("id", productId).eq("status", "PENDING").select("id,status").maybeSingle();
  if (error || !data) throw new Error("This product could not be moderated. Refresh and try again.");
  return data;
}
