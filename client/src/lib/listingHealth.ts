export type ListingHealthInput = {
  title: string;
  description: string;
  categoryId: string;
  imageDataUrl?: string;
  price: string;
  stockQuantity: string;
  fulfilmentOptions: string[];
};

export type ListingHealthCheck = { ok: boolean; label: string; detail: string };

export function assessListingHealth(input: ListingHealthInput): ListingHealthCheck[] {
  return [
    { ok: input.title.trim().length >= 8, label: "Specific product title", detail: "Use at least 8 characters so buyers know what you are selling." },
    { ok: input.description.trim().length >= 50, label: "Useful description", detail: "Add condition, size, colour, quantity, or what the buyer receives." },
    { ok: Boolean(input.categoryId), label: "Correct category", detail: "Choose the closest physical-product category." },
    { ok: Boolean(input.imageDataUrl), label: "Original photo added", detail: "Use your own clear photo; do not copy a supplier image." },
    { ok: Number(input.price) > 0 && Number(input.stockQuantity) > 0, label: "Price and availability set", detail: "Confirm the amount and current stock before publishing." },
    { ok: input.fulfilmentOptions.length > 0, label: "Siaya fulfilment option", detail: "Choose at least one route that MtaaMarket can confirm." },
  ];
}
