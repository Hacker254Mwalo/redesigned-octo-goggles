import { randomUUID } from "node:crypto";
import { getSupabaseServiceClient } from "./supabase";
import type { SupabaseIdentity } from "./supabase-auth";
import { ensureSupabaseMarketplaceProfile } from "./supabase-profiles";
import { requireV3Owner } from "./v3-profiles";

const V3_FULFILMENT_METHODS = ["siaya_pickup", "home_delivery", "collection_point", "special_order"] as const;
const V3_SOURCE_ROUTES = ["mtaa_select", "approved_vendor", "supplier", "external_marketplace", "other"] as const;
const V3_ITEM_REQUEST_STATUSES = ["submitted", "reviewing", "quoted", "accepted", "sourcing", "completed", "unavailable", "cancelled"] as const;
const V3_ASSISTED_ORDER_STATUSES = ["recorded", "confirmed", "sourcing", "ready", "out_for_delivery", "completed", "cancelled"] as const;
const ASSISTED_REQUEST_ACCEPTED_REPLY = "MtaaMarket has opened an Assisted Market order and will confirm the next step.";

type V3FulfilmentMethod = (typeof V3_FULFILMENT_METHODS)[number];
type V3SourceRoute = (typeof V3_SOURCE_ROUTES)[number];
export type V3ItemRequestStatus = (typeof V3_ITEM_REQUEST_STATUSES)[number];
export type V3AssistedOrderStatus = (typeof V3_ASSISTED_ORDER_STATUSES)[number];

export type V3ItemRequestInput = {
  title: string;
  details: string;
  budgetHint?: number;
  preferredFulfilment: V3FulfilmentMethod;
  preferredLocation?: string;
};

export type V3ItemRequestUpdate = {
  requestId: string;
  status: V3ItemRequestStatus;
  sourceRoute?: V3SourceRoute;
  quotedPrice?: number;
  platformReply?: string;
};

export type V3AssistedOrderUpdate = {
  assistedOrderId: string;
  status: V3AssistedOrderStatus;
  platformNotes?: string;
  quotedAmount?: number;
  paymentTiming?: "pay_before" | "pay_on_collection" | "pay_on_delivery" | "confirm_with_mtaamarket";
  fulfilmentMethod?: V3FulfilmentMethod;
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

function makeAssistedOrderNumber(now = new Date()) {
  const date = [String(now.getFullYear()).slice(-2), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("");
  const token = randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `AM-${date}-${token}`;
}

export function assertV3AssistedOrderTransition(from: V3AssistedOrderStatus, to: V3AssistedOrderStatus) {
  const allowed: Record<V3AssistedOrderStatus, V3AssistedOrderStatus[]> = {
    recorded: ["confirmed", "cancelled"],
    confirmed: ["sourcing", "ready", "cancelled"],
    sourcing: ["ready", "cancelled"],
    ready: ["out_for_delivery", "completed", "cancelled"],
    out_for_delivery: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  if (!allowed[from].includes(to)) throw new Error(`Assisted order cannot move from ${from} to ${to}.`);
}

function validateV3ItemRequest(input: V3ItemRequestInput) {
  const title = normalizedText(input.title, 4, 180, "Describe the item using between 4 and 180 characters.");
  const details = normalizedText(input.details, 10, 3_000, "Add between 10 and 3,000 characters about the item you need.");
  if (!V3_FULFILMENT_METHODS.includes(input.preferredFulfilment)) throw new Error("Choose a valid MtaaMarket fulfilment preference.");
  if (input.budgetHint !== undefined && (!Number.isFinite(input.budgetHint) || input.budgetHint <= 0 || input.budgetHint > 10_000_000)) throw new Error("Enter a valid optional budget hint.");
  return { title, details, budgetHint: input.budgetHint ?? null, preferredFulfilment: input.preferredFulfilment, preferredLocation: normalizedOptionalText(input.preferredLocation, 180, "Use a broad location of up to 180 characters.") };
}

function validateExternalSourceDisclosure(sourceRoute: V3SourceRoute, disclosure?: string, contentAttestation?: boolean) {
  if (sourceRoute !== "external_marketplace") return null;
  const normalized = disclosure?.trim();
  if (!normalized || normalized.length < 12) throw new Error("Record the customer's confirmation before using an external marketplace route.");
  if (!contentAttestation) throw new Error("Confirm that MtaaMarket content is original before using an external marketplace route.");
  return normalized.slice(0, 600);
}

/** Creates a private MtaaMarket request from the verified Supabase identity only. It intentionally records neither a buyer phone number nor a supplier route. */
export async function createV3ItemRequest(identity: SupabaseIdentity | null, input: V3ItemRequestInput) {
  if (!identity) throw new Error("Sign in with your verified MtaaMarket email before sending a request.");
  const values = validateV3ItemRequest(input);
  const profile = await ensureSupabaseMarketplaceProfile(identity);
  const { data, error } = await getSupabaseServiceClient().from("item_requests").insert({
    buyer_profile_id: profile.id,
    created_by_profile_id: profile.id,
    is_assisted: false,
    customer_name: null,
    customer_phone: null,
    title: values.title,
    details: values.details,
    budget_hint: values.budgetHint,
    preferred_fulfilment: values.preferredFulfilment,
    preferred_location: values.preferredLocation,
    status: "submitted",
    source_route: null,
  }).select("id,status,created_at").single();
  if (error || !data) throw new Error("MtaaMarket could not record your request. Please try again later.");
  return data;
}

/** Owner-only review update. It stores the owner's response and any manually selected source route, never a copied supplier listing. */
export async function updateV3ItemRequest(identity: SupabaseIdentity | null, input: V3ItemRequestUpdate) {
  await requireV3Owner(identity);
  const client = getSupabaseServiceClient();
  const current = await client.from("item_requests").select("id,status,source_route").eq("id", input.requestId).maybeSingle();
  if (current.error || !current.data) throw new Error("Item request not found.");
  if (input.quotedPrice !== undefined && (!Number.isFinite(input.quotedPrice) || input.quotedPrice <= 0 || input.quotedPrice > 10_000_000)) throw new Error("Enter a valid quoted amount.");
  const sourceRoute = input.sourceRoute ?? current.data.source_route ?? null;
  const result = await client.from("item_requests").update({
    status: input.status,
    source_route: sourceRoute,
    quoted_price: input.quotedPrice ?? null,
    platform_reply: input.platformReply?.trim().slice(0, 3_000) || null,
  }).eq("id", input.requestId).select("id,status,source_route,quoted_price,platform_reply,updated_at").maybeSingle();
  if (result.error || !result.data) throw new Error("MtaaMarket could not update the Request Desk record.");
  return result.data;
}

/** Owner-only view deliberately excludes customer name, phone, and supplier data. */
export async function listV3OwnerItemRequests(identity: SupabaseIdentity | null) {
  await requireV3Owner(identity);
  const { data, error } = await getSupabaseServiceClient().from("item_requests")
    .select("id,title,details,budget_hint,preferred_fulfilment,preferred_location,status,source_route,quoted_price,platform_reply,created_at,updated_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error("MtaaMarket could not load the Request Desk queue.");
  return data ?? [];
}

/** Creates a protected owner-managed record from a Request Desk item. No supplier checkout, payment, or delivery action occurs here. */
export async function createV3AssistedOrderFromRequest(identity: SupabaseIdentity | null, requestId: string, externalSourceDisclosure?: string, externalContentAttestation?: boolean) {
  await requireV3Owner(identity);
  if (!identity) throw new Error("Sign in with a verified owner email session.");
  const client = getSupabaseServiceClient();
  const requestResult = await client.from("item_requests").select("id,buyer_profile_id,created_by_profile_id,title,details,budget_hint,preferred_fulfilment,preferred_location,status,source_route,quoted_price").eq("id", requestId).maybeSingle();
  if (requestResult.error || !requestResult.data) throw new Error("Item request not found.");
  const request = requestResult.data;
  if (["accepted", "completed", "cancelled", "unavailable"].includes(request.status)) throw new Error("This Request Desk record is closed and cannot become an assisted order.");
  const sourceRoute = (request.source_route ?? "other") as V3SourceRoute;
  const disclosure = validateExternalSourceDisclosure(sourceRoute, externalSourceDisclosure, externalContentAttestation);
  const customerProfile = await client.from("profiles").select("id,full_name,phone_number").eq("id", request.buyer_profile_id ?? request.created_by_profile_id).maybeSingle();
  if (customerProfile.error || !customerProfile.data) throw new Error("MtaaMarket could not find the requester's protected profile.");
  const now = new Date().toISOString();
  const inserted = await client.from("assisted_orders").insert({
    assisted_order_number: makeAssistedOrderNumber(),
    item_request_id: request.id,
    owner_profile_id: identity.subject,
    vendor_id: null,
    customer_name: customerProfile.data.full_name?.trim() || "MtaaMarket customer",
    customer_phone: customerProfile.data.phone_number || null,
    title: request.title,
    details: request.details,
    quoted_amount: request.quoted_price ?? request.budget_hint ?? null,
    payment_timing: "confirm_with_mtaamarket",
    fulfilment_method: request.preferred_fulfilment,
    preferred_location: request.preferred_location,
    source_route: sourceRoute,
    status: "recorded",
    platform_notes: null,
    external_source_disclosure: disclosure,
    external_source_confirmed_at: disclosure ? now : null,
    external_source_content_attested_at: disclosure ? now : null,
  }).select("id,assisted_order_number,item_request_id,title,details,quoted_amount,payment_timing,fulfilment_method,preferred_location,source_route,status,platform_notes,confirmed_at,completed_at,created_at,updated_at,external_source_disclosure,external_source_confirmed_at,external_source_content_attested_at").single();
  if (inserted.error || !inserted.data) throw new Error("MtaaMarket could not create the assisted order.");
  const linked = await client.from("item_requests").update({ status: "accepted", platform_reply: ASSISTED_REQUEST_ACCEPTED_REPLY }).eq("id", request.id).select("id,status").maybeSingle();
  if (linked.error || !linked.data) {
    await client.from("assisted_orders").delete().eq("id", inserted.data.id);
    throw new Error("MtaaMarket could not link the assisted order to the Request Desk record.");
  }
  return inserted.data;
}

export async function listV3OwnerAssistedOrders(identity: SupabaseIdentity | null) {
  await requireV3Owner(identity);
  const { data, error } = await getSupabaseServiceClient().from("assisted_orders")
    .select("id,assisted_order_number,item_request_id,title,details,quoted_amount,payment_timing,fulfilment_method,preferred_location,source_route,status,platform_notes,confirmed_at,completed_at,created_at,updated_at,external_source_disclosure,external_source_confirmed_at,external_source_content_attested_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error("MtaaMarket could not load the Assisted Market queue.");
  return data ?? [];
}

export async function updateV3AssistedOrder(identity: SupabaseIdentity | null, input: V3AssistedOrderUpdate) {
  await requireV3Owner(identity);
  const client = getSupabaseServiceClient();
  const current = await client.from("assisted_orders").select("id,status,item_request_id,platform_notes,quoted_amount,payment_timing,fulfilment_method,confirmed_at,completed_at").eq("id", input.assistedOrderId).maybeSingle();
  if (current.error || !current.data) throw new Error("Assisted order not found.");
  if (input.status !== current.data.status) assertV3AssistedOrderTransition(current.data.status as V3AssistedOrderStatus, input.status);
  if (input.quotedAmount !== undefined && (!Number.isFinite(input.quotedAmount) || input.quotedAmount <= 0 || input.quotedAmount > 10_000_000)) throw new Error("Enter a valid assisted-order amount.");
  const values: Record<string, unknown> = { status: input.status };
  if (input.platformNotes !== undefined) values.platform_notes = input.platformNotes.trim().slice(0, 3_000) || null;
  if (input.quotedAmount !== undefined) values.quoted_amount = input.quotedAmount;
  if (input.paymentTiming !== undefined) values.payment_timing = input.paymentTiming;
  if (input.fulfilmentMethod !== undefined) values.fulfilment_method = input.fulfilmentMethod;
  if (input.status === "confirmed" && !current.data.confirmed_at) values.confirmed_at = new Date().toISOString();
  if (input.status === "completed" && !current.data.completed_at) values.completed_at = new Date().toISOString();
  const result = await client.from("assisted_orders").update(values).eq("id", input.assistedOrderId).select("id,status,updated_at,confirmed_at,completed_at").maybeSingle();
  if (result.error || !result.data) throw new Error("MtaaMarket could not update the assisted order.");
  if (current.data.item_request_id) {
    const requestStatus = input.status === "sourcing" ? "sourcing" : input.status === "completed" ? "completed" : input.status === "cancelled" ? "cancelled" : null;
    if (requestStatus) await client.from("item_requests").update({ status: requestStatus }).eq("id", current.data.item_request_id);
  }
  return result.data;
}
