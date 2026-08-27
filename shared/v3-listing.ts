export const V3_LISTING_CATEGORY_SLUGS = [
  "home-kitchen",
  "phones-electronics",
  "solar-energy",
  "fashion",
  "groceries-pantry",
  "beauty-personal-care",
  "baby-kids",
  "farm-garden",
  "poultry-livestock",
  "building-tools",
  "school-office",
  "auto-motorbike",
] as const;

export type V3ListingCategorySlug = (typeof V3_LISTING_CATEGORY_SLUGS)[number];

export const V3_LISTING_CATEGORIES: ReadonlyArray<{ slug: V3ListingCategorySlug; name: string }> = [
  { slug: "home-kitchen", name: "Home & Kitchen" },
  { slug: "phones-electronics", name: "Phones & Electronics" },
  { slug: "solar-energy", name: "Solar & Energy" },
  { slug: "fashion", name: "Fashion" },
  { slug: "groceries-pantry", name: "Groceries & Pantry" },
  { slug: "beauty-personal-care", name: "Beauty & Personal Care" },
  { slug: "baby-kids", name: "Baby & Kids" },
  { slug: "farm-garden", name: "Farm & Garden" },
  { slug: "poultry-livestock", name: "Poultry & Livestock" },
  { slug: "building-tools", name: "Building & Tools" },
  { slug: "school-office", name: "School & Office" },
  { slug: "auto-motorbike", name: "Auto & Motorbike" },
];

export function getV3ListingCategory(slug: string) {
  return V3_LISTING_CATEGORIES.find(category => category.slug === slug) ?? null;
}
