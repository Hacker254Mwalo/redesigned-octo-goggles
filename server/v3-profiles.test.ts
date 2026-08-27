import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({ getSupabaseServiceClient: vi.fn() }));

import { getSupabaseServiceClient } from "./supabase";
import { applyForV3Vendor, bootstrapV3Owner, updateV3VendorApproval } from "./v3-profiles";

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

    await expect(updateV3VendorApproval(founder, vendor.subject, true)).resolves.toEqual({ id: vendor.subject, isApproved: true });
    expect(approval.update).toHaveBeenCalledWith({ is_vendor_approved: true });
  });
});
