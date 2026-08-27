import { randomInt } from "node:crypto";
import { getSupabaseServiceClient } from "./supabase";
import type { SupabaseIdentity } from "./supabase-auth";

function pickupPin() {
  return String(randomInt(0, 10_000)).padStart(4, "0");
}

export async function createV3HubOrder(identity: SupabaseIdentity | null, input: { productId: string }) {
  if (!identity) throw new Error("Sign in with your verified MtaaMarket email session before confirming an order.");
  const client = getSupabaseServiceClient();
  const { data: buyer, error: buyerError } = await client.from("profiles").select("id,full_name,phone_number").eq("id", identity.subject).maybeSingle();
  if (buyerError || !buyer?.full_name || !buyer.phone_number) throw new Error("Save your name and verified Kenyan order contact before confirming hub pickup.");
  const { data: product, error: productError } = await client
    .from("products")
    .select("id,final_price,status")
    .eq("id", input.productId)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (productError || !product) throw new Error("This product is no longer available for hub pickup.");

  const { data: existingOrder, error: existingOrderError } = await client
    .from("orders")
    .select("id")
    .eq("buyer_phone", buyer.phone_number)
    .eq("product_id", product.id)
    .in("order_status", ["PENDING_DROPOFF", "RECEIVED_AT_HUB"])
    .maybeSingle();
  if (existingOrderError) throw new Error("MtaaMarket could not check your existing hub-pickup requests.");
  if (existingOrder) throw new Error("You already have an open hub-pickup request for this product.");

  const pin = pickupPin();
  const { data, error } = await client.from("orders").insert({
    buyer_phone: buyer.phone_number,
    product_id: product.id,
    amount: product.final_price,
    payment_method: "PAY_ON_PICKUP",
    payment_status: "PENDING",
    order_status: "PENDING_DROPOFF",
    pickup_pin: pin,
  }).select("id,pickup_pin,payment_status,order_status,pickup_station").single();
  if (error || !data) throw new Error("MtaaMarket could not record your hub-pickup order.");
  return data;
}
