import { getSupabaseServiceClient } from "./supabase";
import type { SupabaseIdentity } from "./supabase-auth";
import { requireV3Owner } from "./v3-profiles";

export async function listV3ModerationProducts(identity: SupabaseIdentity | null) {
  await requireV3Owner(identity);
  const { data, error } = await getSupabaseServiceClient().from("products").select("id,title,image_url,vendor_id,final_price,status,created_at").in("status", ["PENDING", "ACTIVE", "FLAGGED"]).order("created_at", { ascending: true });
  if (error) throw new Error("MtaaMarket could not load the moderation queue.");
  return data ?? [];
}

export async function moderateV3Product(identity: SupabaseIdentity | null, productId: string, status: "ACTIVE" | "REJECTED" | "FLAGGED") {
  await requireV3Owner(identity);
  const { data, error } = await getSupabaseServiceClient().from("products").update({ status }).eq("id", productId).select("id,status").maybeSingle();
  if (error || !data) throw new Error("This product could not be moderated. Refresh and try again.");
  return data;
}

export async function deleteV3Product(identity: SupabaseIdentity | null, productId: string) {
  await requireV3Owner(identity);
  const { error } = await getSupabaseServiceClient().from("products").delete().eq("id", productId);
  if (error) throw new Error("This product could not be permanently removed.");
  return { success: true as const };
}
