import { getSupabaseServiceClient } from "./supabase";
import type { SupabaseIdentity } from "./supabase-auth";

type V3ProfileRow = {
  id: string;
  full_name: string | null;
  is_vendor: boolean;
  is_vendor_approved: boolean;
  role: "buyer" | "vendor" | "admin";
  vendor_agreement_accepted_at: string | null;
  created_at: string;
};

export type V3VendorAccess = {
  isVendor: boolean;
  isVendorApproved: boolean;
  agreementAcceptedAt: string | null;
  canSubmitListings: boolean;
};

export type V3BuyerOrderAccess = {
  hasName: boolean;
  hasPhone: boolean;
  maskedPhone: string | null;
};

function normalizedEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "";
}

function normalizedKenyanPhone(value: string) {
  const trimmed = value.trim();
  if (!/^\+?254[17]\d{8}$/.test(trimmed)) throw new Error("Use a Kenyan number beginning with 254.");
  return trimmed.replace(/^\+/, "");
}

function normalizedBuyerName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 90) throw new Error("Enter the name you want MtaaMarket to use for this pickup request.");
  return name;
}

function maskPhone(phone: string) {
  return `${phone.slice(0, 5)}••••${phone.slice(-3)}`;
}

function mapVendorAccess(profile: Pick<V3ProfileRow, "is_vendor" | "is_vendor_approved" | "vendor_agreement_accepted_at"> | null): V3VendorAccess {
  const agreementAcceptedAt = profile?.vendor_agreement_accepted_at ?? null;
  const isVendor = Boolean(profile?.is_vendor);
  const isVendorApproved = Boolean(profile?.is_vendor_approved);
  return { isVendor, isVendorApproved, agreementAcceptedAt, canSubmitListings: isVendor && isVendorApproved && Boolean(agreementAcceptedAt) };
}

export async function requireV3Owner(identity: SupabaseIdentity | null) {
  if (!identity) throw new Error("Sign in with a verified owner email session.");
  const { data, error } = await getSupabaseServiceClient().from("profiles").select("id,role").eq("id", identity.subject).maybeSingle();
  if (error || data?.role !== "admin") throw new Error("Owner access is required for this operation.");
}

export async function getV3VendorAccess(identity: SupabaseIdentity | null): Promise<V3VendorAccess> {
  if (!identity) throw new Error("Sign in with your verified MtaaMarket email first.");
  const { data, error } = await getSupabaseServiceClient()
    .from("profiles")
    .select("id,full_name,is_vendor,is_vendor_approved,role,vendor_agreement_accepted_at,created_at")
    .eq("id", identity.subject)
    .maybeSingle();
  if (error) throw new Error("MtaaMarket could not check your vendor access.");
  return mapVendorAccess(data as V3ProfileRow | null);
}

export async function getV3BuyerOrderAccess(identity: SupabaseIdentity | null): Promise<V3BuyerOrderAccess> {
  if (!identity) throw new Error("Sign in with your verified MtaaMarket email first.");
  const { data, error } = await getSupabaseServiceClient().from("profiles").select("id,full_name,phone_number").eq("id", identity.subject).maybeSingle();
  if (error) throw new Error("MtaaMarket could not check your order contact details.");
  return { hasName: Boolean(data?.full_name), hasPhone: Boolean(data?.phone_number), maskedPhone: data?.phone_number ? maskPhone(data.phone_number) : null };
}

/** Captures a buyer's name and one canonical contact through the verified server identity. Later changes require owner support rather than a browser-side overwrite. */
export async function saveV3BuyerOrderProfile(identity: SupabaseIdentity | null, input: { fullName?: string; phone?: string }): Promise<V3BuyerOrderAccess> {
  if (!identity) throw new Error("Sign in with your verified MtaaMarket email first.");
  const fullName = input.fullName ? normalizedBuyerName(input.fullName) : undefined;
  const phoneNumber = input.phone ? normalizedKenyanPhone(input.phone) : undefined;
  const client = getSupabaseServiceClient();
  const existing = await client.from("profiles").select("id,full_name,phone_number").eq("id", identity.subject).maybeSingle();
  if (existing.error) throw new Error("MtaaMarket could not check your order contact details.");
  if (!existing.data && (!fullName || !phoneNumber)) throw new Error("Add your name and Kenyan contact number before confirming hub pickup.");
  if (!existing.data?.full_name && !fullName) throw new Error("Add the name MtaaMarket should use for this pickup request.");
  if (!existing.data?.phone_number && !phoneNumber) throw new Error("Add your Kenyan contact number before confirming hub pickup.");
  if (existing.data?.full_name && fullName && existing.data.full_name !== fullName) throw new Error("Your pickup name is already set. Contact MtaaMarket support if it needs to change.");
  if (existing.data?.phone_number && phoneNumber && existing.data.phone_number !== phoneNumber) throw new Error("Your order contact number is already set. Contact MtaaMarket support if it needs to change.");

  const result = existing.data
    ? await client.from("profiles").update({ ...(existing.data.full_name ? {} : { full_name: fullName }), ...(existing.data.phone_number ? {} : { phone_number: phoneNumber }) }).eq("id", identity.subject).select("id,full_name,phone_number").maybeSingle()
    : await client.from("profiles").insert({ id: identity.subject, full_name: fullName, phone_number: phoneNumber, role: "buyer" }).select("id,full_name,phone_number").maybeSingle();
  if (result.error?.code === "23505") throw new Error("This Kenyan contact number is already linked to another MtaaMarket account. Sign in to that account or contact MtaaMarket support.");
  if (result.error || !result.data?.full_name || !result.data.phone_number) throw new Error("MtaaMarket could not save your protected pickup details.");
  return { hasName: true, hasPhone: true, maskedPhone: maskPhone(result.data.phone_number) };
}

/** Only the server-configured founder email can claim the first V3 owner role after authentication verifies the identity. */
export async function bootstrapV3Owner(identity: SupabaseIdentity | null) {
  if (!identity) throw new Error("Sign in with your verified MtaaMarket email first.");
  const founderEmail = normalizedEmail(process.env.FOUNDER_EMAIL);
  if (!founderEmail) throw new Error("Founder owner activation is not configured yet.");
  if (normalizedEmail(identity.email) !== founderEmail) throw new Error("This verified email is not authorized to activate the MtaaMarket owner role.");

  const client = getSupabaseServiceClient();
  const existing = await client.from("profiles").select("id,role").eq("id", identity.subject).maybeSingle();
  if (existing.error) throw new Error("MtaaMarket could not check the founder profile.");

  const result = existing.data
    ? await client.from("profiles").update({ role: "admin" }).eq("id", identity.subject).select("id,role").maybeSingle()
    : await client.from("profiles").insert({ id: identity.subject, role: "admin" }).select("id,role").maybeSingle();
  if (result.error || !result.data) throw new Error("MtaaMarket could not activate the owner role.");
  return { role: "admin" as const };
}

/** Records a vendor's explicit agreement acknowledgement and opens an owner-review request. Approval stays false unless an owner grants it. */
export async function applyForV3Vendor(identity: SupabaseIdentity | null, agreementAccepted: boolean) {
  if (!identity) throw new Error("Sign in with your verified MtaaMarket email first.");
  if (!agreementAccepted) throw new Error("Accept the vendor agreement before requesting approval.");

  const client = getSupabaseServiceClient();
  const existing = await client.from("profiles").select("id,is_vendor,is_vendor_approved,vendor_agreement_accepted_at").eq("id", identity.subject).maybeSingle();
  if (existing.error) throw new Error("MtaaMarket could not check the vendor profile.");

  const agreementAcceptedAt = new Date().toISOString();
  const result = existing.data
    ? await client.from("profiles").update({ is_vendor: true, is_vendor_approved: false, vendor_agreement_accepted_at: agreementAcceptedAt }).eq("id", identity.subject).select("id,is_vendor,is_vendor_approved,vendor_agreement_accepted_at").maybeSingle()
    : await client.from("profiles").insert({ id: identity.subject, is_vendor: true, is_vendor_approved: false, role: "buyer", vendor_agreement_accepted_at: agreementAcceptedAt }).select("id,is_vendor,is_vendor_approved,vendor_agreement_accepted_at").maybeSingle();
  if (result.error || !result.data) throw new Error("MtaaMarket could not record your vendor request.");
  return mapVendorAccess(result.data as Pick<V3ProfileRow, "is_vendor" | "is_vendor_approved" | "vendor_agreement_accepted_at">);
}

export async function listV3VendorApplications(identity: SupabaseIdentity | null) {
  await requireV3Owner(identity);
  const { data, error } = await getSupabaseServiceClient()
    .from("profiles")
    .select("id,full_name,is_vendor,is_vendor_approved,role,vendor_agreement_accepted_at,created_at")
    .eq("is_vendor", true)
    .order("created_at", { ascending: true });
  if (error) throw new Error("MtaaMarket could not load vendor applications.");
  return (data as V3ProfileRow[] ?? []).map(profile => ({
    id: profile.id,
    fullName: profile.full_name,
    isApproved: profile.is_vendor_approved,
    agreementAcceptedAt: profile.vendor_agreement_accepted_at,
    requestedAt: profile.created_at,
  }));
}

export async function updateV3VendorApproval(identity: SupabaseIdentity | null, profileId: string, approved: boolean) {
  await requireV3Owner(identity);
  const client = getSupabaseServiceClient();
  const { data: candidate, error: candidateError } = await client.from("profiles").select("id,is_vendor,vendor_agreement_accepted_at").eq("id", profileId).maybeSingle();
  if (candidateError || !candidate?.is_vendor || !candidate.vendor_agreement_accepted_at) throw new Error("Only an agreement-backed vendor request can be approved or suspended.");
  const { data, error } = await client.from("profiles").update({ is_vendor_approved: approved }).eq("id", profileId).select("id,is_vendor_approved").maybeSingle();
  if (error || !data) throw new Error("MtaaMarket could not update vendor approval.");
  return { id: data.id, isApproved: data.is_vendor_approved };
}
