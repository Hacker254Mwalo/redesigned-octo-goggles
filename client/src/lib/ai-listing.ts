/**
 * Manual-first integration boundary for a future listing assistant.
 *
 * This module intentionally performs no Cloudinary request, model invocation,
 * storage upload, queueing, or background processing. Original vendor images
 * and manual listing facts continue directly to the protected server submission
 * path. Any future provider implementation must be server-only, user-triggered,
 * consented, rate-limited, cost-approved, and return editable drafts only.
 */

export const AI_LISTING_MANUAL_FALLBACK = {
  image: "Automatic image cleanup is not active. Your original photo will be submitted unchanged for owner review.",
  copy: "Automatic Sheng/English copy assistance is not active. Your manual title will be sent unchanged for owner review.",
} as const;

export type ManualListingImageInput = {
  imageData: string;
  imageType: "image/jpeg" | "image/png" | "image/webp";
};

export type ListingImagePreparation = ManualListingImageInput & {
  mode: "manual-original";
  message: string;
};

export async function prepareListingImageForSubmission(input: ManualListingImageInput): Promise<ListingImagePreparation> {
  return { ...input, mode: "manual-original", message: AI_LISTING_MANUAL_FALLBACK.image };
}

export type ListingCopyFallback = {
  mode: "manual";
  draft: null;
  message: string;
};

export async function createEditableMarketCopyDraft(): Promise<ListingCopyFallback> {
  return { mode: "manual", draft: null, message: AI_LISTING_MANUAL_FALLBACK.copy };
}
