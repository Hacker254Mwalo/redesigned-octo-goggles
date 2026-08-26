import { describe, expect, it } from "vitest";
import { getSupabasePublicConfig, getSupabaseServiceClient, isSupabaseConfigured } from "./supabase";

describe("isolated MtaaMarket Supabase adapters", () => {
  it("keeps server credentials out of public configuration and sees only the isolated project buckets", async () => {
    expect(isSupabaseConfigured()).toBe(true);
    const publicConfig = getSupabasePublicConfig();
    expect(publicConfig.url).toMatch(/^https:\/\/mfgjpjtlmfdtsnkoluco\.supabase\.co$/);
    expect(publicConfig).not.toHaveProperty("secretKey");

    const { data: buckets, error } = await getSupabaseServiceClient().storage.listBuckets();
    expect(error?.message).toBeUndefined();
    expect(buckets?.map(bucket => bucket.name).sort()).toEqual(expect.arrayContaining(["catalogue-media", "marketplace-private"]));
  });
});
