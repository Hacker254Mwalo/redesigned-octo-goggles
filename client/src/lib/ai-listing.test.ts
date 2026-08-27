import { describe, expect, it } from "vitest";
import { AI_LISTING_MANUAL_FALLBACK, createEditableMarketCopyDraft, prepareListingImageForSubmission } from "./ai-listing";

describe("manual-first AI listing integration boundary", () => {
  it("preserves the vendor's original image rather than queueing or processing it when image cleanup is inactive", async () => {
    await expect(prepareListingImageForSubmission({ imageData: "data:image/png;base64,aGVsbG8=", imageType: "image/png" })).resolves.toEqual({
      imageData: "data:image/png;base64,aGVsbG8=",
      imageType: "image/png",
      mode: "manual-original",
      message: AI_LISTING_MANUAL_FALLBACK.image,
    });
  });

  it("returns no automatic Sheng or English copy when a model is unconfigured", async () => {
    await expect(createEditableMarketCopyDraft()).resolves.toEqual({ mode: "manual", draft: null, message: AI_LISTING_MANUAL_FALLBACK.copy });
  });
});
