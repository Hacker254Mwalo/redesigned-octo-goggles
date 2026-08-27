import { describe, expect, it } from "vitest";
import { getSupabasePublicConfig, getSupabaseServiceClient, isSupabaseConfigured } from "./supabase";

const supabaseVerificationConfigured = Boolean(process.env.VITE_SUPABASE_URL?.trim() && process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() && process.env.SUPABASE_SECRET_KEY?.trim() && process.env.SUPABASE_JWKS_URL?.trim());

describe("isolated MtaaMarket Supabase adapters", () => {
  it.skipIf(!supabaseVerificationConfigured)("keeps server credentials out of public configuration and sees only the isolated project buckets", async () => {
    expect(isSupabaseConfigured()).toBe(true);
    const publicConfig = getSupabasePublicConfig();
    expect(publicConfig.url).toMatch(/^https:\/\/mfgjpjtlmfdtsnkoluco\.supabase\.co$/);
    expect(publicConfig).not.toHaveProperty("secretKey");

    const { data: buckets, error } = await getSupabaseServiceClient().storage.listBuckets();
    expect(error?.message).toBeUndefined();
    expect(buckets?.map(bucket => bucket.name).sort()).toEqual(expect.arrayContaining(["catalogue-media", "marketplace-private"]));
  });
});
