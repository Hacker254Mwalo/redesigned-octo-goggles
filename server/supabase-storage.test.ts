import { describe, expect, it } from "vitest";
import { getSupabaseServiceClient } from "./supabase";
import { storageGetSignedUrl, storagePut } from "./storage";

describe("isolated MtaaMarket Supabase Storage adapter", () => {
  it("stores and cleans up a temporary original-media verification object through the existing storage interface", async () => {
    const verificationPrefix = `verification/${crypto.randomUUID()}.webp`;
    const saved = await storagePut(verificationPrefix, Buffer.from("RIFF\x00\x00\x00\x00WEBPVP8 ", "binary"), "image/webp");

    try {
      expect(saved.key).toMatch(/^verification\//);
      expect(saved.url).toContain("/storage/v1/object/public/catalogue-media/");
    } finally {
      const { error } = await getSupabaseServiceClient().storage.from("catalogue-media").remove([saved.key]);
      expect(error?.message).toBeUndefined();
    }
  });

  it("creates and cleans up a temporary private record before returning a time-bounded signed URL", async () => {
    const verificationKey = `verification/${crypto.randomUUID()}.pdf`;
    const client = getSupabaseServiceClient();
    const { error } = await client.storage.from("marketplace-private").upload(verificationKey, Buffer.from("MtaaMarket private verification"), { contentType: "application/pdf", upsert: false });
    expect(error?.message).toBeUndefined();

    try {
      const signedUrl = await storageGetSignedUrl(verificationKey);
      expect(signedUrl).toContain("/storage/v1/object/sign/marketplace-private/");
    } finally {
      const { error: removeError } = await client.storage.from("marketplace-private").remove([verificationKey]);
      expect(removeError?.message).toBeUndefined();
    }
  });
});
