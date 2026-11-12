import { randomInt } from "node:crypto";
import { getSupabaseServiceClient } from "./supabase";
import type { SupabaseIdentity } from "./supabase-auth";
import { requireV3Owner } from "./v3-profiles";

function pickupPin() {
  return String(randomInt(0, 10_000)).padStart(4, "0");
}

export async function createV3HubOrder(identity: SupabaseIdentity | null, input: { productId: string }) {
  if (!identity) throw new Error("Sign in with your verified MtaaMarket email session before confirming an order.");
  const client = getSupabaseServiceClient();
  const { data: buyer, error: buyerError } = await client.from("profiles").select("id,full_name,phone_number").eq("id", identity.subject).maybeSingle();
  if (buyerError || !buyer?.full_name || !buyer.phone_number) throw new Error("Save your name and verified Kenyan order contact before confirming hub pickup.");
  const { data: product, error: productError } = await client.from("products").select("id,final_price,status,category_slug,allow_pay_on_pickup").eq("id", input.productId).eq("status", "ACTIVE").maybeSingle();
  if (productError || !product) throw new Error("This product is no longer available for hub pickup.");
  if (product.category_slug === "poultry-livestock") throw new Error("Poultry and livestock handovers require MtaaMarket confirmation and cannot use the hub-pickup order path.");
  if (!product.allow_pay_on_pickup) throw new Error("This product does not currently offer pay on pickup. Ask MtaaMarket to confirm the available options.");
  const { data: existingOrder, error: existingOrderError } = await client.from("orders").select("id").eq("buyer_profile_id", identity.subject).eq("product_id", product.id).in("order_status", ["PENDING_DROPOFF", "RECEIVED_AT_HUB"]).maybeSingle();
  if (existingOrderError) throw new Error("MtaaMarket could not check your existing hub-pickup requests.");
  if (existingOrder) throw new Error("You already have an open hub-pickup request for this product.");
  const pin = pickupPin();
  const { data, error } = await client.from("orders").insert({ buyer_profile_id: identity.subject, buyer_phone: buyer.phone_number, product_id: product.id, amount: product.final_price, payment_method: "PAY_ON_PICKUP", payment_status: "PENDING", order_status: "PENDING_DROPOFF", pickup_pin: pin }).select("id,pickup_pin,payment_status,order_status,pickup_station").single();
  if (error || !data) throw new Error("MtaaMarket could not record your hub-pickup order.");
  return data;
}

/** Buyer-only order feed. Pickup PINs are never exposed through vendor or owner feeds. */
export async function listV3BuyerOrders(identity: SupabaseIdentity | null) {
  if (!identity) throw new Error("Sign in with your verified MtaaMarket email first.");
  const { data, error } = await getSupabaseServiceClient().from("orders").select("id,created_at,product_id,amount,payment_method,payment_status,order_status,pickup_pin,pickup_station,products(title,image_url)").eq("buyer_profile_id", identity.subject).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("MtaaMarket could not load your orders.");
  return data ?? [];
}

/** Approved-vendor feed is scoped to owned products and excludes buyer phone and pickup PIN. */
export async function listV3VendorOrders(identity: SupabaseIdentity | null) {
  if (!identity) throw new Error("Sign in with your verified MtaaMarket email first.");
  const client = getSupabaseServiceClient();
  const { data: profile, error: profileError } = await client.from("profiles").select("id,is_vendor,is_vendor_approved,vendor_agreement_accepted_at").eq("id", identity.subject).maybeSingle();
  if (profileError || !profile?.is_vendor || !profile.is_vendor_approved || !profile.vendor_agreement_accepted_at) throw new Error("An approved vendor with an accepted agreement is required to view vendor orders.");
  const { data, error } = await client.from("orders").select("id,created_at,product_id,amount,payment_method,payment_status,order_status,pickup_station,products!inner(id,title,image_url,vendor_id)").eq("products.vendor_id", identity.subject).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("MtaaMarket could not load vendor orders.");
  return data ?? [];
}

/** Bounded owner operations feed, intentionally excluding buyer contact and pickup PIN. */
export async function listV3OwnerOrders(identity: SupabaseIdentity | null, limit = 100) {
  await requireV3Owner(identity);
  const boundedLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 200) : 100;
  const { data, error } = await getSupabaseServiceClient().from("orders").select("id,created_at,buyer_profile_id,product_id,amount,payment_method,payment_status,order_status,pickup_station,products(title,vendor_id)").order("created_at", { ascending: false }).limit(boundedLimit);
  if (error) throw new Error("MtaaMarket could not load owner order records.");
  return data ?? [];
}

export type V3OrderStatus = "PENDING_DROPOFF" | "RECEIVED_AT_HUB" | "COMPLETED" | "CANCELLED";
const allowedTransitions: Record<V3OrderStatus, V3OrderStatus[]> = { PENDING_DROPOFF: ["RECEIVED_AT_HUB", "CANCELLED"], RECEIVED_AT_HUB: ["COMPLETED", "CANCELLED"], COMPLETED: [], CANCELLED: [] };

export async function updateV3OrderStatus(identity: SupabaseIdentity | null, orderId: string, status: V3OrderStatus) {
  await requireV3Owner(identity);
  if (!(status in allowedTransitions)) throw new Error("This order status is not valid.");
  const client = getSupabaseServiceClient();
  const { data: current, error: currentError } = await client.from("orders").select("id,order_status").eq("id", orderId).maybeSingle();
  if (currentError || !current) throw new Error("This order could not be found.");
  if (!allowedTransitions[current.order_status as V3OrderStatus]?.includes(status)) throw new Error("This order cannot transition to the requested status.");
  const { data, error } = await client.from("orders").update({ order_status: status }).eq("id", orderId).eq("order_status", current.order_status).select("id,order_status").maybeSingle();
  if (error || !data) throw new Error("This order status could not be updated. Refresh and try again.");
  return data;
}
