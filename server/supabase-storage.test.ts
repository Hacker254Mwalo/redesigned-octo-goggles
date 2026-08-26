import { describe, expect, it } from "vitest";
import { getSupabaseServiceClient } from "./supabase";
import { storagePut } from "./storage";

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
});
