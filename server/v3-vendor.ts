import { storagePut } from "./storage";
import { getSupabaseServiceClient } from "./supabase";
import type { SupabaseIdentity } from "./supabase-auth";

export async function submitV3VendorProduct(identity: SupabaseIdentity | null, input: { title: string; price: number; imageData: string; imageType: string }) {
  if (!identity) throw new Error("Sign in with your verified vendor email session.");
  const client = getSupabaseServiceClient();
  const { data: profile } = await client.from("profiles").select("id,is_vendor,is_vendor_approved").eq("id", identity.subject).maybeSingle();
  if (!profile?.is_vendor || !profile.is_vendor_approved) throw new Error("An approved vendor profile is required before submitting a listing.");
  const base64 = input.imageData.split(",")[1];
  if (!base64) throw new Error("Choose a valid product image.");
  const { url } = await storagePut(`vendor-listings/${identity.subject}/listing`, Buffer.from(base64, "base64"), input.imageType);
  const { data, error } = await client.from("products").insert({ vendor_id: identity.subject, title: input.title, image_url: url, base_price: input.price, final_price: input.price, status: "PENDING" }).select("id,status").single();
  if (error || !data) throw new Error("MtaaMarket could not submit this listing.");
  return data;
}
