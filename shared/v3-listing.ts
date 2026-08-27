export const V3_LISTING_CATEGORY_SLUGS = [
  "phones-electronics",
  "computing",
  "home-kitchen",
  "fashion-accessories",
  "beauty-personal-care",
  "groceries-household",
  "baby-kids-toys",
  "farm-garden",
  "poultry-livestock",
  "tools-building",
  "automotive-parts",
] as const;

export type V3ListingCategorySlug = (typeof V3_LISTING_CATEGORY_SLUGS)[number];

export const V3_LISTING_CATEGORIES: ReadonlyArray<{ slug: V3ListingCategorySlug; name: string }> = [
  { slug: "phones-electronics", name: "Phones & Electronics" },
  { slug: "computing", name: "Computing" },
  { slug: "home-kitchen", name: "Home & Kitchen" },
  { slug: "fashion-accessories", name: "Fashion & Accessories" },
  { slug: "beauty-personal-care", name: "Beauty & Personal Care" },
  { slug: "groceries-household", name: "Groceries & Household" },
  { slug: "baby-kids-toys", name: "Baby, Kids & Toys" },
  { slug: "farm-garden", name: "Farm & Garden" },
  { slug: "poultry-livestock", name: "Poultry & Livestock" },
  { slug: "tools-building", name: "Tools & Building" },
  { slug: "automotive-parts", name: "Automotive & Parts" },
];

export function getV3ListingCategory(slug: string) {
  return V3_LISTING_CATEGORIES.find(category => category.slug === slug) ?? null;
}
