import type { BasketItem } from "@/contexts/CartContext";

export type CollectionPreference = "siaya_pickup" | "home_delivery" | "collection_point" | "special_order";

export type CollectionBrief = {
  createdAt: string;
  items: Array<{ title: string; quantity: number }>;
  fulfilmentMethod: CollectionPreference;
  broadLocation?: string;
  preferenceNote?: string;
  requiresOwnerConfirmation: true;
  paymentInstructionsConfirmed: false;
};

export const COLLECTION_BRIEF_KEY = "mtaamarket-collection-brief-v1";

export const collectionSafetySteps = [
  "Choose only a broad area or known collection point. Do not add a house number, ID number, or payment details here.",
  "Wait for MtaaMarket to confirm stock, the collection route, collection time, and any payment instruction in a protected workspace.",
  "Use a collection reference only after MtaaMarket confirms it. Inspect the parcel before accepting a hand-off where the route allows.",
  "If anything differs from the confirmed item or route, pause collection and contact MtaaMarket support before accepting it.",
];

export function buildCollectionBrief(input: {
  items: BasketItem[];
  fulfilmentMethod: CollectionPreference;
  broadLocation?: string;
  preferenceNote?: string;
  createdAt?: string;
}): CollectionBrief {
  const broadLocation = input.broadLocation?.trim().slice(0, 180) || undefined;
  const preferenceNote = input.preferenceNote?.trim().slice(0, 600) || undefined;
  return {
    createdAt: input.createdAt || new Date().toISOString(),
    items: input.items.map(({ title, quantity }) => ({ title: title.replace("Sample Listing — ", ""), quantity })),
    fulfilmentMethod: input.fulfilmentMethod,
    broadLocation,
    preferenceNote,
    requiresOwnerConfirmation: true,
    paymentInstructionsConfirmed: false,
  };
}

export function saveCollectionBrief(brief: CollectionBrief) {
  try { sessionStorage.setItem(COLLECTION_BRIEF_KEY, JSON.stringify(brief)); } catch { /* Browser storage can be unavailable. */ }
  return brief;
}
