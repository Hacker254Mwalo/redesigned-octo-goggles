import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import {
  categories,
  marketplaceProfiles,
  pickupStations,
  products,
  reviews,
  users,
  vendors,
} from "../drizzle/schema";
import { getDb } from "./db";

export type MarketplaceRole = "buyer" | "vendor" | "admin";

export function assertMarketplaceRole(role: MarketplaceRole, allowed: MarketplaceRole[]) {
  if (!allowed.includes(role)) {
    throw new Error("You do not have permission to access this marketplace area.");
  }
}

const CATEGORY_SEED = [
  { name: "Phones & Tablets", slug: "phones-tablets", icon: "Smartphone", description: "Phones, tablets and practical accessories.", sortOrder: 1 },
  { name: "Computing", slug: "computing", icon: "Laptop", description: "Laptops, peripherals and work essentials.", sortOrder: 2 },
  { name: "Home & Living", slug: "home-living", icon: "House", description: "Useful finds for a comfortable home.", sortOrder: 3 },
  { name: "Fashion", slug: "fashion", icon: "Shirt", description: "Everyday personal style and accessories.", sortOrder: 4 },
  { name: "Beauty & Care", slug: "beauty-care", icon: "Sparkles", description: "Personal care and beauty essentials.", sortOrder: 5 },
  { name: "Sports & Outdoors", slug: "sports-outdoors", icon: "Bike", description: "Movement, fitness and outdoor life.", sortOrder: 6 },
] as const;

const STATION_SEED = [
  { name: "MtaaMarket CBD Hub", slug: "nairobi-cbd-hub", county: "Nairobi", town: "Nairobi CBD", address: "Tom Mboya Street, near the bus station", landmark: "Opposite the city bus terminal", openingHours: "Mon–Sat, 8:00 AM–6:00 PM", latitude: "-1.2832530", longitude: "36.8219470" },
  { name: "MtaaMarket Westlands Point", slug: "westlands-point", county: "Nairobi", town: "Westlands", address: "Muthangari Drive, Westlands", landmark: "Near The Mall entrance", openingHours: "Mon–Sat, 9:00 AM–6:00 PM", latitude: "-1.2676360", longitude: "36.8104460" },
  { name: "MtaaMarket Rongai Station", slug: "rongai-station", county: "Kajiado", town: "Ongata Rongai", address: "Magadi Road, opposite Maasai Mall", landmark: "Ground-floor pickup desk", openingHours: "Mon–Sat, 9:00 AM–5:00 PM", latitude: "-1.3954070", longitude: "36.7649250" },
  { name: "MtaaMarket Mombasa Centre", slug: "mombasa-centre", county: "Mombasa", town: "Mombasa Island", address: "Nkrumah Road, Mombasa", landmark: "Near the post office", openingHours: "Mon–Sat, 8:30 AM–5:30 PM", latitude: "-4.0434770", longitude: "39.6682060" },
] as const;

const SAMPLE_CATALOG = [
  { categorySlug: "phones-tablets", title: "Sample Listing — Pocket Power Bank 10,000mAh", slug: "sample-pocket-power-bank-10000mah", description: "A clearly labelled sample catalog item for testing product discovery and checkout. Vendor verification is required before live sale.", price: "2499.00", stockQuantity: 12 },
  { categorySlug: "phones-tablets", title: "Sample Listing — Wireless Earbuds Case", slug: "sample-wireless-earbuds-case", description: "A clearly labelled sample catalog item for testing marketplace flows. It is not a buyer review or a paid endorsement.", price: "1890.00", stockQuantity: 8 },
  { categorySlug: "computing", title: "Sample Listing — Laptop Stand, Aluminium", slug: "sample-laptop-stand-aluminium", description: "A clearly labelled sample catalog item for testing marketplace flows. Vendor verification is required before live sale.", price: "3200.00", stockQuantity: 10 },
  { categorySlug: "computing", title: "Sample Listing — Compact Wireless Keyboard", slug: "sample-compact-wireless-keyboard", description: "A clearly labelled sample catalog item for testing marketplace flows. Vendor verification is required before live sale.", price: "4100.00", stockQuantity: 6 },
  { categorySlug: "home-living", title: "Sample Listing — Insulated Travel Flask", slug: "sample-insulated-travel-flask", description: "A clearly labelled sample catalog item for testing marketplace flows. Vendor verification is required before live sale.", price: "1450.00", stockQuantity: 18 },
  { categorySlug: "fashion", title: "Sample Listing — Everyday Canvas Backpack", slug: "sample-everyday-canvas-backpack", description: "A clearly labelled sample catalog item for testing marketplace flows. Vendor verification is required before live sale.", price: "2850.00", stockQuantity: 9 },
  { categorySlug: "beauty-care", title: "Sample Listing — Self-Care Gift Set", slug: "sample-self-care-gift-set", description: "A clearly labelled sample catalog item for testing marketplace flows. Vendor verification is required before live sale.", price: "2200.00", stockQuantity: 7 },
  { categorySlug: "sports-outdoors", title: "Sample Listing — Reusable Water Bottle", slug: "sample-reusable-water-bottle", description: "A clearly labelled sample catalog item for testing marketplace flows. Vendor verification is required before live sale.", price: "1250.00", stockQuantity: 16 },
] as const;

export async function ensureMarketplaceProfile(userId: number, name?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  const found = await db.select().from(marketplaceProfiles).where(eq(marketplaceProfiles.userId, userId)).limit(1);
  if (found[0]) return found[0];

  const account = await db.select({ role: users.role, name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  const role = account[0]?.role === "admin" ? "admin" : "buyer";
  await db.insert(marketplaceProfiles).values({
    userId,
    displayName: (name || account[0]?.name || "MtaaMarket shopper").slice(0, 120),
    role,
  });
  const created = await db.select().from(marketplaceProfiles).where(eq(marketplaceProfiles.userId, userId)).limit(1);
  if (!created[0]) throw new Error("Could not initialize marketplace profile.");
  return created[0];
}

export async function seedMarketplaceFoundation() {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  for (const category of CATEGORY_SEED) {
    await db.insert(categories).values(category).onDuplicateKeyUpdate({ set: { name: category.name, description: category.description, icon: category.icon, sortOrder: category.sortOrder, isActive: true } });
  }
  for (const station of STATION_SEED) {
    await db.insert(pickupStations).values(station).onDuplicateKeyUpdate({ set: { name: station.name, county: station.county, town: station.town, address: station.address, landmark: station.landmark, openingHours: station.openingHours, latitude: station.latitude, longitude: station.longitude, isActive: true } });
  }
  const seededCategories = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const categoryBySlug = new Map(seededCategories.map(category => [category.slug, category.id]));
  for (const item of SAMPLE_CATALOG) {
    const categoryId = categoryBySlug.get(item.categorySlug);
    if (!categoryId) continue;
    await db.insert(products).values({
      categoryId,
      title: item.title,
      slug: item.slug,
      description: item.description,
      price: item.price,
      stockQuantity: item.stockQuantity,
      isLocalInventory: true,
      status: "active",
      imageAlt: item.title,
    }).onDuplicateKeyUpdate({ set: {
      categoryId,
      title: item.title,
      description: item.description,
      price: item.price,
      stockQuantity: item.stockQuantity,
      isLocalInventory: true,
      status: "active",
      imageAlt: item.title,
    } });
  }
}

export async function listPublicCategories() {
  await seedMarketplaceFoundation();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function listPickupStations() {
  await seedMarketplaceFoundation();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pickupStations).where(eq(pickupStations.isActive, true)).orderBy(asc(pickupStations.county), asc(pickupStations.town), asc(pickupStations.name));
}

export async function listProducts(input?: { categorySlug?: string; search?: string; limit?: number }) {
  await seedMarketplaceFoundation();
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(products.status, "active")];
  if (input?.categorySlug) conditions.push(eq(categories.slug, input.categorySlug));
  if (input?.search?.trim()) {
    const term = `%${input.search.trim().replace(/[%_]/g, "\\$&")}%`;
    conditions.push(or(like(products.title, term), like(products.description, term))!);
  }
  return db.select({ product: products, category: categories, vendor: vendors })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(Math.min(Math.max(input?.limit ?? 24, 1), 60));
}

export async function getPublicProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select({ product: products, category: categories, vendor: vendors })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .where(and(eq(products.slug, slug), eq(products.status, "active")))
    .limit(1);
  return rows[0];
}

/** Publicly visible feedback is limited to reviews tied to completed orders. */
export async function listVerifiedReviewsForProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ review: reviews, reviewer: marketplaceProfiles })
    .from(reviews)
    .innerJoin(marketplaceProfiles, eq(reviews.buyerProfileId, marketplaceProfiles.id))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));
}

export async function createVendorForProfile(profileId: number, input: { storeName: string; storeSlug: string; description?: string; supportPhone?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  await db.insert(vendors).values({ profileId, ...input });
  await db.update(marketplaceProfiles).set({ role: "vendor" }).where(eq(marketplaceProfiles.id, profileId));
  const created = await db.select().from(vendors).where(eq(vendors.profileId, profileId)).limit(1);
  return created[0];
}

export function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}
