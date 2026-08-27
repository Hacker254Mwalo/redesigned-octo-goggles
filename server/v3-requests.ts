import { getSupabaseServiceClient } from "./supabase";
import type { SupabaseIdentity } from "./supabase-auth";
import { ensureSupabaseMarketplaceProfile } from "./supabase-profiles";
import { requireV3Owner } from "./v3-profiles";

const V3_FULFILMENT_METHODS = ["siaya_pickup", "home_delivery", "collection_point", "special_order"] as const;
type V3FulfilmentMethod = (typeof V3_FULFILMENT_METHODS)[number];

export type V3ItemRequestInput = {
  title: string;
  details: string;
  budgetHint?: number;
  preferredFulfilment: V3FulfilmentMethod;
  preferredLocation?: string;
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

function validateV3ItemRequest(input: V3ItemRequestInput) {
  const title = normalizedText(input.title, 4, 180, "Describe the item using between 4 and 180 characters.");
  const details = normalizedText(input.details, 10, 3_000, "Add between 10 and 3,000 characters about the item you need.");
  if (!V3_FULFILMENT_METHODS.includes(input.preferredFulfilment)) throw new Error("Choose a valid MtaaMarket fulfilment preference.");
  if (input.budgetHint !== undefined && (!Number.isFinite(input.budgetHint) || input.budgetHint <= 0 || input.budgetHint > 10_000_000)) throw new Error("Enter a valid optional budget hint.");
  return { title, details, budgetHint: input.budgetHint ?? null, preferredFulfilment: input.preferredFulfilment, preferredLocation: normalizedOptionalText(input.preferredLocation, 180, "Use a broad location of up to 180 characters.") };
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

/** Owner-only view deliberately excludes customer name, phone, and supplier data. */
export async function listV3OwnerItemRequests(identity: SupabaseIdentity | null) {
  await requireV3Owner(identity);
  const { data, error } = await getSupabaseServiceClient().from("item_requests")
    .select("id,title,details,budget_hint,preferred_fulfilment,preferred_location,status,created_at,updated_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error("MtaaMarket could not load the Request Desk queue.");
  return data ?? [];
}
