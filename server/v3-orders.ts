import { randomInt } from "node:crypto";
import { getSupabaseServiceClient } from "./supabase";

function pickupPin() {
  return String(randomInt(0, 10_000)).padStart(4, "0");
}

export async function createV3HubOrder(input: { buyerPhone: string; productId: string }) {
  const client = getSupabaseServiceClient();
  const { data: product, error: productError } = await client
    .from("products")
    .select("id,final_price,status")
    .eq("id", input.productId)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (productError || !product) throw new Error("This product is no longer available for hub pickup.");

  const pin = pickupPin();
  const { data, error } = await client.from("orders").insert({
    buyer_phone: input.buyerPhone,
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
