import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({ getSupabaseServiceClient: vi.fn() }));

import { getSupabaseServiceClient } from "./supabase";
import { applyForV3Vendor, bootstrapV3Owner, getV3AccountProfile, getV3VendorAccess, saveV3BuyerOrderProfile, updateV3AccountProfile } from "./v3-profiles";

const founder = { subject: "11111111-1111-4111-8111-111111111111", email: "founder@example.test", issuedAt: 0 };
const vendor = { subject: "22222222-2222-4222-8222-222222222222", email: "vendor@example.test", issuedAt: 0 };

function readQuery(data: unknown) {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data, error: null });
  return query;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.FOUNDER_EMAIL = "founder@example.test";
});

describe("V3 owner bootstrap", () => {
  it("allows only the server-configured founder email to claim the initial owner role after a verified identity check", async () => {
    const existing = readQuery(null);
    const insert = { insert: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    insert.insert.mockReturnValue(insert);
    insert.select.mockReturnValue(insert);
    insert.maybeSingle.mockResolvedValue({ data: { id: founder.subject, role: "admin" }, error: null });
    const client = { from: vi.fn().mockImplementation(() => client.from.mock.calls.length === 1 ? existing : insert) };
    vi.mocked(getSupabaseServiceClient).mockReturnValue(client as never);

    await expect(bootstrapV3Owner(founder)).resolves.toEqual({ role: "admin" });
    expect(insert.insert).toHaveBeenCalledWith({ id: founder.subject, role: "admin" });

    await expect(bootstrapV3Owner(vendor)).rejects.toThrow("not authorized");
  });
});

describe("V3 founder Seller Studio access", () => {
  it("allows the admin founder role to submit owner-managed listings without vendor self-approval", async () => {
    const ownerProfile = readQuery({ id: founder.subject, full_name: "Founder", is_vendor: false, is_vendor_approved: false, role: "admin", vendor_agreement_accepted_at: null, created_at: "2026-08-27T00:00:00.000Z" });
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(ownerProfile) } as never);

    await expect(getV3VendorAccess(founder)).resolves.toEqual({ isVendor: false, isVendorApproved: false, isOwner: true, agreementAcceptedAt: null, canSubmitListings: true });
  });
});

describe("V3 vendor activation", () => {
  it("records a signed-in vendor agreement request as unapproved and lets only an owner approve it", async () => {
    const noProfile = readQuery(null);
    const insert = { insert: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    insert.insert.mockReturnValue(insert);
    insert.select.mockReturnValue(insert);
    insert.maybeSingle.mockResolvedValue({ data: { id: vendor.subject, is_vendor: true, is_vendor_approved: false, vendor_agreement_accepted_at: "2026-08-27T00:00:00.000Z" }, error: null });
    const vendorClient = { from: vi.fn().mockImplementation(() => vendorClient.from.mock.calls.length === 1 ? noProfile : insert) };
    vi.mocked(getSupabaseServiceClient).mockReturnValue(vendorClient as never);

    await expect(applyForV3Vendor(vendor, true)).resolves.toMatchObject({ isVendor: true, isVendorApproved: false, canSubmitListings: false });
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ id: vendor.subject, is_vendor: true, is_vendor_approved: false, role: "buyer" }));

    const owner = readQuery({ id: founder.subject, role: "admin" });
    const candidate = readQuery({ id: vendor.subject, is_vendor: true, vendor_agreement_accepted_at: "2026-08-27T00:00:00.000Z" });
    const approval = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    approval.update.mockReturnValue(approval);
    approval.eq.mockReturnValue(approval);
    approval.select.mockReturnValue(approval);
    approval.maybeSingle.mockResolvedValue({ data: { id: vendor.subject, is_vendor_approved: true }, error: null });
    const ownerClient = { from: vi.fn().mockImplementation(() => {
      const calls = ownerClient.from.mock.calls.length;
      return calls === 1 ? owner : calls === 2 ? candidate : approval;
    }) };
    vi.mocked(getSupabaseServiceClient).mockReturnValue(ownerClient as never);

    const { updateV3VendorApproval } = await import("./v3-profiles");
    await expect(updateV3VendorApproval(founder, vendor.subject, true)).resolves.toEqual({ id: vendor.subject, isApproved: true });
    expect(approval.update).toHaveBeenCalledWith({ is_vendor_approved: true });
  });
});

describe("V3 buyer pickup profile", () => {
  it("writes a private name and canonical phone number only for the same verified buyer identity", async () => {
    const existing = readQuery(null);
    const insert = { insert: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    insert.insert.mockReturnValue(insert);
    insert.select.mockReturnValue(insert);
    insert.maybeSingle.mockResolvedValue({ data: { id: vendor.subject, full_name: "Siaya Buyer", phone_number: "254711281501" }, error: null });
    const client = { from: vi.fn().mockImplementation(() => client.from.mock.calls.length === 1 ? existing : insert) };
    vi.mocked(getSupabaseServiceClient).mockReturnValue(client as never);

    await expect(saveV3BuyerOrderProfile(vendor, { fullName: "  Siaya   Buyer ", phone: "+254711281501" })).resolves.toEqual({ hasName: true, hasPhone: true, maskedPhone: "25471••••501" });
    expect(insert.insert).toHaveBeenCalledWith({ id: vendor.subject, full_name: "Siaya Buyer", phone_number: "254711281501", role: "buyer" });
  });

  it("does not allow a first profile write that omits either required pickup detail", async () => {
    const existing = readQuery(null);
    vi.mocked(getSupabaseServiceClient).mockReturnValue({ from: vi.fn().mockReturnValue(existing) } as never);

    await expect(saveV3BuyerOrderProfile(vendor, { fullName: "Siaya Buyer" })).rejects.toThrow("Kenyan contact number");
    await expect(saveV3BuyerOrderProfile(vendor, { phone: "254711281501" })).rejects.toThrow("name");
  });

  it("rejects an attempt to reuse a Kenyan pickup number without exposing the other account", async () => {
    const existing = readQuery(null);
    const insert = { insert: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    insert.insert.mockReturnValue(insert);
    insert.select.mockReturnValue(insert);
    insert.maybeSingle.mockResolvedValue({ data: null, error: { code: "23505" } });
    const client = { from: vi.fn().mockImplementation(() => client.from.mock.calls.length === 1 ? existing : insert) };
    vi.mocked(getSupabaseServiceClient).mockReturnValue(client as never);

    await expect(saveV3BuyerOrderProfile(vendor, { fullName: "Siaya Buyer", phone: "254711281501" })).rejects.toThrow("already linked to another MtaaMarket account");
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ full_name: "Siaya Buyer", phone_number: "254711281501" }));
  });
});


describe("V3 account settings", () => {
  it("loads and updates the verified profile without changing its role", async () => {
    const profileRead = readQuery({ id: vendor.subject, full_name: "Buyer", phone_number: "254700000000", role: "buyer", is_vendor: false, is_vendor_approved: false });
    const profileLookup = readQuery({ id: vendor.subject });
    const update = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    update.update.mockReturnValue(update);
    update.eq.mockReturnValue(update);
    update.select.mockReturnValue(update);
    update.maybeSingle.mockResolvedValue({ data: { id: vendor.subject, full_name: "Updated Buyer", phone_number: "254711281501", role: "buyer", is_vendor: false, is_vendor_approved: false }, error: null });
    const profileClient = { from: vi.fn().mockReturnValue(profileRead) };
    vi.mocked(getSupabaseServiceClient).mockReturnValue(profileClient as never);
    await expect(getV3AccountProfile(vendor)).resolves.toEqual({ fullName: "Buyer", phoneNumber: "254700000000", role: "buyer", isVendor: false, isVendorApproved: false });

    const updateClient = { from: vi.fn().mockImplementation(() => updateClient.from.mock.calls.length === 1 ? profileLookup : update) };
    vi.mocked(getSupabaseServiceClient).mockReturnValue(updateClient as never);
    await expect(updateV3AccountProfile(vendor, { fullName: "Updated Buyer", phone: "+254711281501" })).resolves.toEqual({ fullName: "Updated Buyer", phoneNumber: "254711281501", role: "buyer", isVendor: false, isVendorApproved: false });
    expect(update.update).toHaveBeenCalledWith({ full_name: "Updated Buyer", phone_number: "254711281501" });
  });

  it("creates a buyer profile when an authenticated account has no V3 profile yet", async () => {
    const existing = readQuery(null);
    const insert = { insert: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() };
    insert.insert.mockReturnValue(insert);
    insert.select.mockReturnValue(insert);
    insert.maybeSingle.mockResolvedValue({ data: { id: vendor.subject, full_name: "New Buyer", phone_number: "254711281501", role: "buyer", is_vendor: false, is_vendor_approved: false }, error: null });
    const client = { from: vi.fn().mockImplementation(() => client.from.mock.calls.length === 1 ? existing : insert) };
    vi.mocked(getSupabaseServiceClient).mockReturnValue(client as never);

    await expect(updateV3AccountProfile(vendor, { fullName: "New Buyer", phone: "254711281501" })).resolves.toMatchObject({ fullName: "New Buyer", phoneNumber: "254711281501", role: "buyer" });
    expect(insert.insert).toHaveBeenCalledWith({ id: vendor.subject, full_name: "New Buyer", phone_number: "254711281501", role: "buyer" });
  });
});
