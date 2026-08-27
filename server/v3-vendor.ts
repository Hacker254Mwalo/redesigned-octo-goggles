import { storagePut } from "./storage";
import { getSupabaseServiceClient } from "./supabase";
import type { SupabaseIdentity } from "./supabase-auth";
import { requireV3Owner } from "./v3-profiles";
import { V3_LISTING_CATEGORY_SLUGS, type V3ListingCategorySlug } from "@shared/v3-listing";
import { randomUUID } from "node:crypto";

const MAX_IMAGE_BYTES = 5_000_000;
const MAX_IMAGE_DIMENSION = 6_000;
const MAX_IMAGE_PIXELS = 24_000_000;
const imageExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type SupportedImageType = keyof typeof imageExtensions;

export type V3ListingSubmission = {
  title: string;
  description?: string;
  categorySlug: V3ListingCategorySlug;
  price: number;
  stockQuantity: number;
  allowPayOnPickup: boolean;
  livestockType?: string;
  livestockDetails?: string;
  livestockWelfareAttested?: boolean;
  livestockMovementAcknowledged?: boolean;
  imageData: string;
  imageType: string;
};

function imageDimensions(image: Buffer, imageType: SupportedImageType) {
  if (imageType === "image/png") {
    if (image.length < 24 || image.toString("ascii", 1, 4) !== "PNG") return null;
    return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
  }

  if (imageType === "image/jpeg") {
    if (image.length < 4 || image[0] !== 0xff || image[1] !== 0xd8) return null;
    for (let offset = 2; offset + 9 < image.length;) {
      if (image[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      while (offset < image.length && image[offset] === 0xff) offset += 1;
      const marker = image[offset];
      offset += 1;
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 1 >= image.length) return null;
      const segmentLength = image.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > image.length) return null;
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        return { height: image.readUInt16BE(offset + 3), width: image.readUInt16BE(offset + 5) };
      }
      offset += segmentLength;
    }
    return null;
  }

  if (image.length < 30 || image.toString("ascii", 0, 4) !== "RIFF" || image.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunkType = image.toString("ascii", 12, 16);
  if (chunkType === "VP8X") {
    return {
      width: 1 + image.readUIntLE(24, 3),
      height: 1 + image.readUIntLE(27, 3),
    };
  }
  if (chunkType === "VP8 ") {
    const signature = image.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 20);
    if (signature < 0 || signature + 7 > image.length) return null;
    return {
      width: image.readUInt16LE(signature + 3) & 0x3fff,
      height: image.readUInt16LE(signature + 5) & 0x3fff,
    };
  }
  if (chunkType === "VP8L" && image[20] === 0x2f) {
    const bits = image.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  return null;
}

function decodeVendorImage(imageData: string, imageType: string) {
  if (!(imageType in imageExtensions)) throw new Error("Use a JPEG, PNG, or WebP product image.");
  const dataUrl = imageData.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!dataUrl || dataUrl[1] !== imageType) throw new Error("The selected image type did not match the uploaded file.");

  const image = Buffer.from(dataUrl[2], "base64");
  if (!image.length || image.length > MAX_IMAGE_BYTES) throw new Error("Choose an image smaller than 5 MB.");

  const dimensions = imageDimensions(image, imageType as SupportedImageType);
  if (!dimensions || !dimensions.width || !dimensions.height) throw new Error("MtaaMarket could not validate this image file.");
  if (dimensions.width > MAX_IMAGE_DIMENSION || dimensions.height > MAX_IMAGE_DIMENSION || dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) {
    throw new Error("Choose an image up to 6,000 pixels on each side and 24 megapixels.");
  }
  return { image, extension: imageExtensions[imageType as SupportedImageType] };
}

function normalizeListingSubmission(input: V3ListingSubmission) {
  const title = input.title.trim();
  const description = input.description?.trim() || null;
  const isLivestock = input.categorySlug === "poultry-livestock";
  const livestockType = input.livestockType?.trim() || null;
  const livestockDetails = input.livestockDetails?.trim() || null;
  if (title.length < 3 || title.length > 180) throw new Error("Use a product title between 3 and 180 characters.");
  if (description && description.length > 1_600) throw new Error("Keep the product description within 1,600 characters.");
  if (!V3_LISTING_CATEGORY_SLUGS.includes(input.categorySlug)) throw new Error("Choose a valid MtaaMarket category.");
  if (!Number.isFinite(input.price) || input.price <= 0 || input.price > 10_000_000) throw new Error("Enter a valid price in Kenyan shillings.");
  if (!Number.isSafeInteger(input.stockQuantity) || input.stockQuantity < 1 || input.stockQuantity > 100_000) throw new Error("Enter an available quantity between 1 and 100,000.");
  if (isLivestock) {
    if (!livestockType || livestockType.length < 2 || livestockType.length > 80) throw new Error("Describe the poultry or livestock type in 2 to 80 characters.");
    if (!livestockDetails || livestockDetails.length < 10 || livestockDetails.length > 500) throw new Error("Add 10 to 500 characters of factual animal details for owner review.");
    if (!input.livestockWelfareAttested) throw new Error("Confirm the poultry or livestock welfare statement before submitting.");
    if (!input.livestockMovementAcknowledged) throw new Error("Acknowledge that MtaaMarket does not arrange animal transport or confirm movement requirements.");
    if (input.allowPayOnPickup) throw new Error("Poultry and livestock listings must use manual MtaaMarket handover confirmation, not hub pickup.");
  }
  return { title, description, livestockType: isLivestock ? livestockType : null, livestockDetails: isLivestock ? livestockDetails : null, livestockWelfareAttested: isLivestock, livestockMovementAcknowledged: isLivestock };
}

async function createV3PendingListing(input: V3ListingSubmission, options: { vendorId: string | null; isAdminConcierge: boolean; storagePrefix: "vendor-listings" | "owner-listings"; storageOwnerId: string }) {
  const { title, description, livestockType, livestockDetails, livestockWelfareAttested, livestockMovementAcknowledged } = normalizeListingSubmission(input);
  const client = getSupabaseServiceClient();
  const { image, extension } = decodeVendorImage(input.imageData, input.imageType);
  const { url } = await storagePut(`${options.storagePrefix}/${options.storageOwnerId}/${randomUUID()}.${extension}`, image, input.imageType);
  const { data, error } = await client.from("products").insert({ vendor_id: options.vendorId, title, description, category_slug: input.categorySlug, image_url: url, base_price: input.price, final_price: input.price, stock_quantity: input.stockQuantity, is_admin_concierge: options.isAdminConcierge, allow_pay_on_pickup: input.allowPayOnPickup, livestock_type: livestockType, livestock_details: livestockDetails, livestock_welfare_attested: livestockWelfareAttested, livestock_movement_acknowledged: livestockMovementAcknowledged, status: "PENDING" }).select("id,status").single();
  if (error || !data) throw new Error("MtaaMarket could not submit this listing.");
  return data;
}

export async function submitV3VendorProduct(identity: SupabaseIdentity | null, input: V3ListingSubmission) {
  if (!identity) throw new Error("Sign in with your verified vendor email session.");
  normalizeListingSubmission(input);
  const client = getSupabaseServiceClient();
  const { data: profile } = await client.from("profiles").select("id,is_vendor,is_vendor_approved,vendor_agreement_accepted_at").eq("id", identity.subject).maybeSingle();
  if (!profile?.is_vendor || !profile.is_vendor_approved) throw new Error("Your vendor profile must be approved by the MtaaMarket owner before you can submit a listing.");
  if (!profile.vendor_agreement_accepted_at) throw new Error("Accept the vendor agreement with the MtaaMarket owner before submitting a listing.");
  return createV3PendingListing(input, { vendorId: identity.subject, isAdminConcierge: false, storagePrefix: "vendor-listings", storageOwnerId: identity.subject });
}

/** Founder-only intake for original MtaaMarket-owned goods. It still enters owner moderation as PENDING. */
export async function submitV3OwnerProduct(identity: SupabaseIdentity | null, input: V3ListingSubmission) {
  await requireV3Owner(identity);
  if (!identity) throw new Error("Sign in with a verified owner email session.");
  return createV3PendingListing(input, { vendorId: null, isAdminConcierge: true, storagePrefix: "owner-listings", storageOwnerId: identity.subject });
}
