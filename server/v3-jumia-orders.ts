import { randomUUID } from "node:crypto";
import { getSupabaseServiceClient } from "./supabase";
import type { SupabaseIdentity } from "./supabase-auth";
import { saveV3BuyerOrderProfile } from "./v3-profiles";
import { requireV3Owner } from "./v3-profiles";

const JUMIA_FULFILMENT_METHODS = ["siaya_pickup", "home_delivery", "collection_point"] as const;
const JUMIA_PAYMENT_TIMINGS = ["pay_on_collection", "pay_on_delivery"] as const;
const JUMIA_PAYMENT_STATUSES = ["not_due", "paid", "refunded"] as const;
const JUMIA_ORDER_STATUSES = ["placed", "confirming", "accepted", "sourcing", "ready", "out_for_delivery", "completed", "cancelled"] as const;

type JumiaFulfilmentMethod = (typeof JUMIA_FULFILMENT_METHODS)[number];
export type JumiaOrderStatus = (typeof JUMIA_ORDER_STATUSES)[number];
export type JumiaPaymentStatus = (typeof JUMIA_PAYMENT_STATUSES)[number];
export type JumiaPaymentTiming = (typeof JUMIA_PAYMENT_TIMINGS)[number];

export type JumiaOrderItemInput = {
  title: string;
  details: string;
  quantity: number;
};

export type CreateJumiaOrderInput = {
  items: JumiaOrderItemInput[];
  fulfilmentMethod: JumiaFulfilmentMethod;
  paymentTiming: JumiaPaymentTiming;
  preferredLocation?: string;
  deliverySchedule?: string;
  orderNote?: string;
  fullName?: string;
  phone?: string;
};

export type UpdateJumiaOrderInput = {
  orderId: string;
  status: JumiaOrderStatus;
  quotedAmount?: number;
  paymentStatus?: JumiaPaymentStatus;
  fulfilmentMethod?: JumiaFulfilmentMethod;
  preferredLocation?: string;
  deliverySchedule?: string;
  ownerNotes?: string;
  cancellationReason?: string;
};

function normalizedText(value: string, minimum: number, maximum: number, message: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < minimum || normalized.length > maximum) throw new Error(message);
  return normalized;
}

function normalizedOptionalText(value: string | undefined, maximum: number, message: string) {
  if (!value) return null;
  return normalizedText(value, 1, maximum, message);
}

function normalizePhone(value: string) {
  const normalized = value.trim().replace(/^\+/, "");
  if (!/^254[17]\d{8}$/.test(normalized)) throw new Error("Use a Kenyan mobile number beginning with 254.");
  return normalized;
}

function makeOrderNumber(now = new Date()) {
  const date = [String(now.getFullYear()).slice(-2), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("");
  return `JM-${date}-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export function assertJumiaOrderTransition(from: JumiaOrderStatus, to: JumiaOrderStatus) {
  const allowed: Record<JumiaOrderStatus, JumiaOrderStatus[]> = {
    placed: ["confirming", "cancelled"],
    confirming: ["accepted", "cancelled"],
    accepted: ["sourcing", "cancelled"],
    sourcing: ["ready", "cancelled"],
    ready: ["out_for_delivery", "completed", "cancelled"],
    out_for_delivery: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  if (!allowed[from].includes(to)) throw new Error(`Jumia order cannot move from ${from.replaceAll("_", " ")} to ${to.replaceAll("_", " ")}.`);
}

function validateCreateInput(input: CreateJumiaOrderInput) {
  if (!input.items.length || input.items.length > 20) throw new Error("Add between 1 and 20 items to your Jumia order.");
  const items = input.items.map(item => ({
    title: normalizedText(item.title, 4, 180, "Each item needs a name between 4 and 180 characters."),
    details: normalizedText(item.details, 10, 3_000, "Add at least 10 characters describing each item, size, colour, or preferred option."),
    quantity: item.quantity,
  }));
  if (items.some(item => !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) throw new Error("Each Jumia item quantity must be between 1 and 20.");
  if (!JUMIA_FULFILMENT_METHODS.includes(input.fulfilmentMethod)) throw new Error("Choose a valid MtaaMarket fulfilment method.");
  if (!JUMIA_PAYMENT_TIMINGS.includes(input.paymentTiming)) throw new Error("Choose payment at collection or payment at delivery.");
  if (input.fulfilmentMethod === "home_delivery" && input.paymentTiming !== "pay_on_delivery") throw new Error("Home delivery uses payment on delivery.");
  if (input.fulfilmentMethod !== "home_delivery" && input.paymentTiming !== "pay_on_collection") throw new Error("Collection uses payment on collection.");
  const preferredLocation = normalizedOptionalText(input.preferredLocation, 180, "Use a broad Siaya location of up to 180 characters.");
  if (input.fulfilmentMethod === "home_delivery" && !preferredLocation) throw new Error("Add a broad Siaya delivery area for home delivery.");
  return {
    items,
    fulfilmentMethod: input.fulfilmentMethod,
    paymentTiming: input.paymentTiming,
    preferredLocation,
    deliverySchedule: normalizedOptionalText(input.deliverySchedule, 120, "Use a delivery or collection timing note of up to 120 characters."),
    orderNote: normalizedOptionalText(input.orderNote, 1_200, "Use an order note of up to 1,200 characters."),
    fullName: input.fullName ? normalizedText(input.fullName, 2, 90, "Enter the name for this order.") : undefined,
    phone: input.phone ? normalizePhone(input.phone) : undefined,
  };
}

async function getBuyerProfile(identity: SupabaseIdentity, fullName?: string, phone?: string) {
  if (fullName || phone) await saveV3BuyerOrderProfile(identity, { fullName, phone });
  const { data, error } = await getSupabaseServiceClient().from("profiles").select("id,full_name,phone_number").eq("id", identity.subject).maybeSingle();
  if (error || !data?.full_name || !data.phone_number) throw new Error("Add your name and Kenyan contact number before placing a Jumia order.");
  return data;
}

export async function createV3JumiaOrder(identity: SupabaseIdentity | null, input: CreateJumiaOrderInput) {
  if (!identity) throw new Error("Sign in with your verified MtaaMarket email before placing an order.");
  const values = validateCreateInput(input);
  const profile = await getBuyerProfile(identity, values.fullName, values.phone);
  const { data, error } = await getSupabaseServiceClient().from("jumia_orders").insert({
    order_number: makeOrderNumber(),
    buyer_profile_id: profile.id,
    customer_name: profile.full_name,
    customer_phone: profile.phone_number,
    items: values.items,
    fulfilment_method: values.fulfilmentMethod,
    payment_timing: values.paymentTiming,
    payment_status: "not_due",
    status: "placed",
    preferred_location: values.preferredLocation,
    delivery_schedule: values.deliverySchedule,
    order_note: values.orderNote,
    quoted_amount: null,
    owner_notes: null,
    cancellation_reason: null,
  }).select("id,order_number,status,payment_status,payment_timing,fulfilment_method,preferred_location,delivery_schedule,quoted_amount,items,created_at,updated_at").single();
  if (error || !data) throw new Error("MtaaMarket could not record your Jumia order. Please try again.");
  return data;
}

export async function listV3BuyerJumiaOrders(identity: SupabaseIdentity | null) {
  if (!identity) return [];
  const { data, error } = await getSupabaseServiceClient().from("jumia_orders")
    .select("id,order_number,status,payment_status,payment_timing,fulfilment_method,preferred_location,delivery_schedule,quoted_amount,items,created_at,updated_at,cancellation_reason")
    .eq("buyer_profile_id", identity.subject)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw new Error("MtaaMarket could not load your Jumia orders.");
  return data ?? [];
}

export async function listV3OwnerJumiaOrders(identity: SupabaseIdentity | null) {
  await requireV3Owner(identity);
  const { data, error } = await getSupabaseServiceClient().from("jumia_orders")
    .select("id,order_number,buyer_profile_id,customer_name,customer_phone,status,payment_status,payment_timing,fulfilment_method,preferred_location,delivery_schedule,order_note,quoted_amount,items,owner_notes,cancellation_reason,confirmed_at,completed_at,created_at,updated_at")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw new Error("MtaaMarket could not load the Jumia fulfilment queue.");
  return data ?? [];
}

export async function updateV3OwnerJumiaOrder(identity: SupabaseIdentity | null, input: UpdateJumiaOrderInput) {
  await requireV3Owner(identity);
  const client = getSupabaseServiceClient();
  const current = await client.from("jumia_orders").select("id,status,payment_status,confirmed_at,completed_at").eq("id", input.orderId).maybeSingle();
  if (current.error || !current.data) throw new Error("Jumia order not found.");
  if (input.status !== current.data.status) assertJumiaOrderTransition(current.data.status as JumiaOrderStatus, input.status);
  if (input.quotedAmount !== undefined && (!Number.isFinite(input.quotedAmount) || input.quotedAmount < 0 || input.quotedAmount > 10_000_000)) throw new Error("Enter a valid confirmed Jumia amount.");
  if (input.paymentStatus && !JUMIA_PAYMENT_STATUSES.includes(input.paymentStatus)) throw new Error("Choose a valid payment status.");
  if (input.status === "cancelled" && current.data.payment_status === "paid" && input.paymentStatus !== "refunded") throw new Error("Record the refund before cancelling an order that was paid.");
  if (input.status === "completed" && input.paymentStatus !== "paid" && current.data.payment_status !== "paid") throw new Error("Record payment at hand-off before completing this order.");
  const values: Record<string, unknown> = { status: input.status };
  if (input.quotedAmount !== undefined) values.quoted_amount = input.quotedAmount;
  if (input.paymentStatus !== undefined) values.payment_status = input.paymentStatus;
  if (input.fulfilmentMethod !== undefined) values.fulfilment_method = input.fulfilmentMethod;
  if (input.preferredLocation !== undefined) values.preferred_location = normalizedOptionalText(input.preferredLocation, 180, "Use a broad Siaya location of up to 180 characters.");
  if (input.deliverySchedule !== undefined) values.delivery_schedule = normalizedOptionalText(input.deliverySchedule, 120, "Use a timing note of up to 120 characters.");
  if (input.ownerNotes !== undefined) values.owner_notes = input.ownerNotes.trim().slice(0, 3_000) || null;
  if (input.cancellationReason !== undefined) values.cancellation_reason = input.cancellationReason.trim().slice(0, 600) || null;
  if (input.status === "accepted" && !current.data.confirmed_at) values.confirmed_at = new Date().toISOString();
  if (input.status === "completed" && !current.data.completed_at) values.completed_at = new Date().toISOString();
  if (input.status === "cancelled" && current.data.payment_status === "paid") values.payment_status = "refunded";
  const result = await client.from("jumia_orders").update(values).eq("id", input.orderId).select("id,order_number,status,payment_status,quoted_amount,updated_at,confirmed_at,completed_at,cancellation_reason").maybeSingle();
  if (result.error || !result.data) throw new Error("MtaaMarket could not update the Jumia order.");
  return result.data;
}
