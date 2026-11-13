import { randomInt } from "node:crypto";
import { getSupabaseServiceClient } from "./supabase";
import type { SupabaseIdentity } from "./supabase-auth";
import { requireV3Owner } from "./v3-profiles";

function pickupPin() {
  return String(randomInt(0, 10_000)).padStart(4, "0");
}

function normalizePickupPreference(value: string) {
  const preference = value.trim().replace(/\s+/g, " ");
  if (preference.length < 2 || preference.length > 180) {
    throw new Error("Enter a Siaya town or preferred collection area, up to 180 characters.");
  }
  return preference;
}

export async function createV3HubOrder(
  identity: SupabaseIdentity | null,
  input: { productId: string; quantity: number; pickupPreference: string },
) {
  if (!identity) throw new Error("Sign in with your verified MtaaMarket email session before placing an order.");
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity > 999) {
    throw new Error("Choose a quantity between 1 and 999.");
  }
  const pickupPreference = normalizePickupPreference(input.pickupPreference);
  const client = getSupabaseServiceClient();
  const { data: buyer, error: buyerError } = await client.from("profiles").select("id,full_name,phone_number").eq("id", identity.subject).maybeSingle();
  if (buyerError || !buyer?.full_name || !buyer.phone_number) throw new Error("Save your name and Kenyan order contact before placing an order.");
  const { data: product, error: productError } = await client.from("products").select("id,final_price,status,category_slug,allow_pay_on_pickup,stock_quantity").eq("id", input.productId).eq("status", "ACTIVE").maybeSingle();
  if (productError || !product) throw new Error("This product is no longer available.");
  if (product.category_slug === "poultry-livestock") throw new Error("Poultry and livestock handovers require manual MtaaMarket confirmation.");
  if (!product.allow_pay_on_pickup) throw new Error("This product does not currently offer pay on pickup. Ask MtaaMarket to confirm the available options.");
  if (Number(product.stock_quantity) < 1) throw new Error("This listing is currently unavailable. Please request it through MtaaMarket instead.");

  const { data: existingOrder, error: existingOrderError } = await client.from("orders").select("id").eq("buyer_profile_id", identity.subject).eq("product_id", product.id).in("order_status", ["PENDING_DROPOFF", "RECEIVED_AT_HUB"]).maybeSingle();
  if (existingOrderError) throw new Error("MtaaMarket could not check your existing orders.");
  if (existingOrder) throw new Error("You already have an open order for this product.");

  const amount = Number(product.final_price) * input.quantity;
  if (!Number.isSafeInteger(Math.round(amount * 100)) || amount <= 0 || amount > 10_000_000) {
    throw new Error("The order amount is outside the supported limit. Please contact MtaaMarket.");
  }
  const { data, error } = await client.from("orders").insert({
    buyer_profile_id: identity.subject,
    buyer_phone: buyer.phone_number,
    product_id: product.id,
    quantity: input.quantity,
    amount: amount.toFixed(2),
    payment_method: "PAY_ON_PICKUP",
    payment_status: "PENDING",
    order_status: "PENDING_DROPOFF",
    stock_review_status: "pending",
    pickup_pin: pickupPin(),
    pickup_station: pickupPreference,
  }).select("id,created_at,product_id,quantity,amount,payment_status,order_status,stock_review_status,pickup_station").single();
  if (error || !data) throw new Error("MtaaMarket could not record your order. Please try again.");
  return data;
}

/** Buyer-only feed. The pickup PIN is withheld until owner stock confirmation. */
export async function listV3BuyerOrders(identity: SupabaseIdentity | null) {
  if (!identity) throw new Error("Sign in with your verified MtaaMarket email first.");
  const { data, error } = await getSupabaseServiceClient().from("orders").select("id,created_at,product_id,quantity,amount,payment_method,payment_status,order_status,stock_review_status,pickup_pin,pickup_station,products(title,image_url)").eq("buyer_profile_id", identity.subject).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("MtaaMarket could not load your orders.");
  return (data ?? []).map(order => ({
    ...order,
    pickup_pin: order.stock_review_status === "confirmed" ? order.pickup_pin : null,
  }));
}

/** Approved-vendor feed is scoped to owned products and excludes buyer phone and pickup PIN. */
export async function listV3VendorOrders(identity: SupabaseIdentity | null) {
  if (!identity) throw new Error("Sign in with your verified MtaaMarket email first.");
  const client = getSupabaseServiceClient();
  const { data: profile, error: profileError } = await client.from("profiles").select("id,is_vendor,is_vendor_approved,vendor_agreement_accepted_at").eq("id", identity.subject).maybeSingle();
  if (profileError || !profile?.is_vendor || !profile.is_vendor_approved || !profile.vendor_agreement_accepted_at) throw new Error("An approved vendor with an accepted agreement is required to view vendor orders.");
  const { data, error } = await client.from("orders").select("id,created_at,product_id,quantity,amount,payment_method,payment_status,order_status,stock_review_status,pickup_station,products!inner(id,title,image_url,vendor_id)").eq("products.vendor_id", identity.subject).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("MtaaMarket could not load vendor orders.");
  return data ?? [];
}

/** Bounded owner queue; full buyer contact is returned only after server owner authorization. */
export async function listV3OwnerOrders(identity: SupabaseIdentity | null, limit = 100) {
  await requireV3Owner(identity);
  const boundedLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 200) : 100;
  const { data, error } = await getSupabaseServiceClient().from("orders").select("id,created_at,buyer_profile_id,buyer_phone,product_id,quantity,amount,payment_method,payment_status,order_status,stock_review_status,pickup_station,products(title,vendor_id)").order("created_at", { ascending: false }).limit(boundedLimit);
  if (error) throw new Error("MtaaMarket could not load owner order records.");
  return data ?? [];
}

export async function reviewV3OrderStock(
  identity: SupabaseIdentity | null,
  input: { orderId: string; decision: "confirmed" | "unavailable"; markListingOutOfStock?: boolean },
) {
  await requireV3Owner(identity);
  const { data, error } = await getSupabaseServiceClient().rpc("review_v3_order_stock", {
    p_order_id: input.orderId,
    p_decision: input.decision,
    p_mark_listing_out_of_stock: input.decision === "unavailable" && Boolean(input.markListingOutOfStock),
  });
  if (error || !data) throw new Error(error?.message || "MtaaMarket could not update order availability.");
  return data as { id: string; stock_review_status: "confirmed" | "unavailable" };
}

export type V3OrderStatus = "PENDING_DROPOFF" | "RECEIVED_AT_HUB" | "COMPLETED" | "CANCELLED";
const allowedTransitions: Record<V3OrderStatus, V3OrderStatus[]> = { PENDING_DROPOFF: ["RECEIVED_AT_HUB", "CANCELLED"], RECEIVED_AT_HUB: ["COMPLETED", "CANCELLED"], COMPLETED: [], CANCELLED: [] };

export async function updateV3OrderStatus(identity: SupabaseIdentity | null, orderId: string, status: V3OrderStatus) {
  await requireV3Owner(identity);
  if (!(status in allowedTransitions)) throw new Error("This order status is not valid.");
  const { data, error } = await getSupabaseServiceClient().rpc("transition_v3_order_fulfillment", {
    p_order_id: orderId,
    p_next_status: status,
  });
  if (error || !data) throw new Error("This order status could not be updated. Refresh and try again.");
  return data as { id: string; order_status: V3OrderStatus };
}
