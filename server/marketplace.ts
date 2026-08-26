import { and, asc, desc, eq, inArray, isNull, like, or } from "drizzle-orm";
import {
  assistedOrders,
  categories,
  itemRequests,
  marketplaceProfiles,
  pickupStations,
  products,
  reviews,
  users,
  vendors,
} from "../drizzle/schema";
import { getDb } from "./db";

export type MarketplaceRole = "buyer" | "vendor" | "admin";
export type VendorApprovalStatus = "pending" | "approved" | "suspended" | "rejected";
export type ListingModerationStatus = "visible" | "paused" | "removed";
export type AssistedOrderStatus = "recorded" | "confirmed" | "sourcing" | "ready" | "out_for_delivery" | "completed" | "cancelled";

export function assertMarketplaceRole(role: MarketplaceRole, allowed: MarketplaceRole[]) {
  if (!allowed.includes(role)) {
    throw new Error("You do not have permission to access this marketplace area.");
  }
}

const CATEGORY_SEED = [
  { name: "Phones & Electronics", slug: "phones-electronics", icon: "Smartphone", description: "Phones, accessories, audio and practical electronics.", sortOrder: 1 },
  { name: "Computing", slug: "computing", icon: "Laptop", description: "Computers, peripherals and work essentials.", sortOrder: 2 },
  { name: "Home & Kitchen", slug: "home-kitchen", icon: "House", description: "Useful home, kitchen and living products.", sortOrder: 3 },
  { name: "Fashion & Accessories", slug: "fashion-accessories", icon: "Shirt", description: "Clothing, shoes, bags and accessories.", sortOrder: 4 },
  { name: "Beauty & Personal Care", slug: "beauty-personal-care", icon: "Sparkles", description: "Beauty, personal care and wellness products.", sortOrder: 5 },
  { name: "Groceries & Household", slug: "groceries-household", icon: "ShoppingBasket", description: "Everyday household and pantry items.", sortOrder: 6 },
  { name: "Baby, Kids & Toys", slug: "baby-kids-toys", icon: "Baby", description: "Physical products for babies, children and families.", sortOrder: 7 },
  { name: "Farm & Garden", slug: "farm-garden", icon: "Sprout", description: "Farm, garden and outdoor essentials.", sortOrder: 8 },
  { name: "Tools & Building", slug: "tools-building", icon: "Wrench", description: "Tools, hardware and building essentials.", sortOrder: 9 },
  { name: "Automotive & Parts", slug: "automotive-parts", icon: "Car", description: "Vehicle accessories and physical spare parts.", sortOrder: 10 },
] as const;

const LEGACY_STATION_SLUGS = ["nairobi-cbd-hub", "westlands-point", "rongai-station", "mombasa-centre"];
const LEGACY_CATEGORY_SLUGS = ["phones-tablets", "home-living", "fashion", "beauty-care", "sports-outdoors"];

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

/** Seeds categories only; it intentionally archives previous test catalogues and disables unverified demo stations. */
export async function seedMarketplaceFoundation() {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  for (const category of CATEGORY_SEED) {
    await db.insert(categories).values(category).onDuplicateKeyUpdate({
      set: { name: category.name, description: category.description, icon: category.icon, sortOrder: category.sortOrder, isActive: true },
    });
  }
  await db.update(categories).set({ isActive: false }).where(inArray(categories.slug, LEGACY_CATEGORY_SLUGS));
  await db.update(products).set({ status: "archived", moderationStatus: "removed" }).where(like(products.slug, "sample-%"));
  await db.update(pickupStations).set({ isActive: false }).where(inArray(pickupStations.slug, LEGACY_STATION_SLUGS));
}

export async function listPublicCategories() {
  await seedMarketplaceFoundation();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function listPickupStations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pickupStations).where(and(eq(pickupStations.isActive, true), eq(pickupStations.county, "Siaya"))).orderBy(asc(pickupStations.town), asc(pickupStations.name));
}

const publicProductConditions = [
  eq(products.status, "active"),
  eq(products.moderationStatus, "visible"),
  or(isNull(products.vendorId), and(eq(vendors.approvalStatus, "approved"), eq(vendors.isActive, true)))!,
];

export async function listProducts(input?: { categorySlug?: string; search?: string; limit?: number }) {
  await seedMarketplaceFoundation();
  const db = await getDb();
  if (!db) return [];
  const conditions = [...publicProductConditions];
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
    .where(and(eq(products.slug, slug), ...publicProductConditions))
    .limit(1);
  return rows[0];
}

export async function listApprovedVendors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendors)
    .where(and(eq(vendors.approvalStatus, "approved"), eq(vendors.isActive, true)))
    .orderBy(desc(vendors.approvedAt), asc(vendors.storeName))
    .limit(18);
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

export async function createVendorForProfile(profileId: number, input: { storeName: string; storeSlug: string; description?: string; supportPhone?: string; serviceArea?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  await db.insert(vendors).values({
    profileId,
    storeName: input.storeName,
    storeSlug: input.storeSlug,
    description: input.description,
    supportPhone: input.supportPhone,
    serviceArea: input.serviceArea?.trim() || "Serves Siaya County",
    isActive: false,
    approvalStatus: "pending",
  });
  await db.update(marketplaceProfiles).set({ role: "vendor" }).where(eq(marketplaceProfiles.id, profileId));
  const created = await db.select().from(vendors).where(eq(vendors.profileId, profileId)).limit(1);
  return created[0];
}

export async function listAdminVendors() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ vendor: vendors, profile: marketplaceProfiles })
    .from(vendors)
    .innerJoin(marketplaceProfiles, eq(vendors.profileId, marketplaceProfiles.id))
    .orderBy(asc(vendors.approvalStatus), desc(vendors.createdAt));
}

export async function listAdminProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ product: products, category: categories, vendor: vendors })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .orderBy(desc(products.updatedAt), desc(products.createdAt))
    .limit(100);
}

export function getVendorGovernanceUpdate(vendor: typeof vendors.$inferSelect, approvalStatus: VendorApprovalStatus, ownerNotes?: string, now = new Date()) {
  return {
    approvalStatus,
    ownerNotes: ownerNotes?.trim() || null,
    isActive: approvalStatus === "approved",
    isVerified: approvalStatus === "approved",
    approvedAt: approvalStatus === "approved" ? now : vendor.approvedAt,
    suspendedAt: approvalStatus === "suspended" ? now : null,
  };
}

export function getProductModerationUpdate(product: typeof products.$inferSelect, moderationStatus: ListingModerationStatus) {
  return {
    moderationStatus,
    status: moderationStatus === "removed" ? "archived" as const : product.status,
  };
}

export async function updateVendorGovernance(vendorId: number, approvalStatus: VendorApprovalStatus, ownerNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  const vendor = (await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1))[0];
  if (!vendor) throw new Error("Vendor not found.");
  const values = getVendorGovernanceUpdate(vendor, approvalStatus, ownerNotes);
  await db.update(vendors).set(values).where(eq(vendors.id, vendorId));
  return (await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1))[0];
}

export async function moderateProduct(productId: number, moderationStatus: ListingModerationStatus) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  const product = (await db.select().from(products).where(eq(products.id, productId)).limit(1))[0];
  if (!product) throw new Error("Listing not found.");
  await db.update(products).set(getProductModerationUpdate(product, moderationStatus)).where(eq(products.id, productId));
  return { ok: true };
}

export async function createItemRequest(profileId: number, input: { title: string; details: string; budgetHint?: number; preferredFulfilment: "siaya_pickup" | "home_delivery" | "collection_point" | "special_order"; preferredLocation?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  const profile = await ensureProfileRole(profileId);
  assertMarketplaceRole(profile.role, ["buyer", "vendor", "admin"]);
  const inserted = await db.insert(itemRequests).values({
    buyerProfileId: profileId,
    createdByProfileId: profileId,
    isAssisted: false,
    title: input.title,
    details: input.details,
    budgetHint: input.budgetHint?.toFixed(2),
    preferredFulfilment: input.preferredFulfilment,
    preferredLocation: input.preferredLocation?.trim() || null,
  });
  return (await db.select().from(itemRequests).where(eq(itemRequests.id, Number(inserted[0].insertId))).limit(1))[0];
}

export async function createAssistedItemRequest(ownerProfileId: number, input: { customerName: string; customerPhone?: string; title: string; details: string; budgetHint?: number; preferredFulfilment: "siaya_pickup" | "home_delivery" | "collection_point" | "special_order"; preferredLocation?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  const owner = await ensureProfileRole(ownerProfileId);
  assertMarketplaceRole(owner.role, ["admin"]);
  const inserted = await db.insert(itemRequests).values({
    createdByProfileId: ownerProfileId,
    isAssisted: true,
    customerName: input.customerName,
    customerPhone: input.customerPhone?.trim() || null,
    title: input.title,
    details: input.details,
    budgetHint: input.budgetHint?.toFixed(2),
    preferredFulfilment: input.preferredFulfilment,
    preferredLocation: input.preferredLocation?.trim() || null,
  });
  return (await db.select().from(itemRequests).where(eq(itemRequests.id, Number(inserted[0].insertId))).limit(1))[0];
}

export function makeAssistedOrderNumber(now = new Date()) {
  const date = [String(now.getFullYear()).slice(-2), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("");
  const token = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AM-${date}-${token}`;
}

export function assertAssistedOrderTransition(from: AssistedOrderStatus, to: AssistedOrderStatus) {
  const allowed: Record<AssistedOrderStatus, AssistedOrderStatus[]> = {
    recorded: ["confirmed", "cancelled"],
    confirmed: ["sourcing", "ready", "cancelled"],
    sourcing: ["ready", "cancelled"],
    ready: ["out_for_delivery", "completed", "cancelled"],
    out_for_delivery: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  if (!allowed[from].includes(to)) throw new Error(`Assisted order cannot move from ${from} to ${to}.`);
}

export type AssistedOrderInput = {
  customerName: string;
  customerPhone?: string;
  title: string;
  details: string;
  quotedAmount?: number;
  paymentTiming: "pay_before" | "pay_on_collection" | "pay_on_delivery" | "confirm_with_mtaamarket";
  fulfilmentMethod: "siaya_pickup" | "home_delivery" | "collection_point" | "special_order";
  preferredLocation?: string;
  sourceRoute: "mtaa_select" | "approved_vendor" | "supplier" | "external_marketplace" | "other";
  platformNotes?: string;
  itemRequestId?: number;
};

export type AssistedRequestSource = Pick<typeof itemRequests.$inferSelect, "id" | "customerName" | "customerPhone" | "title" | "details" | "quotedPrice" | "budgetHint" | "preferredFulfilment" | "preferredLocation" | "sourceRoute">;
export const ASSISTED_REQUEST_ACCEPTED_REPLY = "MtaaMarket has opened an Assisted Market order and will confirm the next step.";

export function buildAssistedOrderFromRequest(request: AssistedRequestSource, customerName: string): AssistedOrderInput {
  return {
    customerName,
    customerPhone: request.customerPhone || undefined,
    title: request.title,
    details: request.details,
    quotedAmount: request.quotedPrice ? Number(request.quotedPrice) : request.budgetHint ? Number(request.budgetHint) : undefined,
    paymentTiming: "confirm_with_mtaamarket",
    fulfilmentMethod: request.preferredFulfilment,
    preferredLocation: request.preferredLocation || undefined,
    sourceRoute: request.sourceRoute || "other",
    itemRequestId: request.id,
  };
}

export async function convertRequestToAssistedOrder<T>(request: AssistedRequestSource, customerName: string, handlers: { createOrder: (input: AssistedOrderInput) => Promise<T>; markRequestAccepted: (requestId: number) => Promise<void> }) {
  const created = await handlers.createOrder(buildAssistedOrderFromRequest(request, customerName));
  await handlers.markRequestAccepted(request.id);
  return created;
}

export async function createAssistedOrder(ownerProfileId: number, input: AssistedOrderInput, options: { updateLinkedRequest?: boolean } = {}) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  const owner = await ensureProfileRole(ownerProfileId);
  assertMarketplaceRole(owner.role, ["admin"]);
  const inserted = await db.insert(assistedOrders).values({
    assistedOrderNumber: makeAssistedOrderNumber(),
    itemRequestId: input.itemRequestId || null,
    ownerProfileId,
    customerName: input.customerName,
    customerPhone: input.customerPhone?.trim() || null,
    title: input.title,
    details: input.details,
    quotedAmount: input.quotedAmount?.toFixed(2),
    paymentTiming: input.paymentTiming,
    fulfilmentMethod: input.fulfilmentMethod,
    preferredLocation: input.preferredLocation?.trim() || null,
    sourceRoute: input.sourceRoute,
    platformNotes: input.platformNotes?.trim() || null,
  });
  if (input.itemRequestId && options.updateLinkedRequest !== false) await db.update(itemRequests).set({ status: "accepted", platformReply: ASSISTED_REQUEST_ACCEPTED_REPLY }).where(eq(itemRequests.id, input.itemRequestId));
  return (await db.select().from(assistedOrders).where(eq(assistedOrders.id, Number(inserted[0].insertId))).limit(1))[0];
}

export async function createAssistedOrderFromRequest(ownerProfileId: number, requestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  const request = (await db.select().from(itemRequests).where(eq(itemRequests.id, requestId)).limit(1))[0];
  if (!request) throw new Error("Item request not found.");
  const customer = request.customerName || (request.buyerProfileId ? (await db.select().from(marketplaceProfiles).where(eq(marketplaceProfiles.id, request.buyerProfileId)).limit(1))[0]?.displayName : null) || "MtaaMarket customer";
  return convertRequestToAssistedOrder(request, customer, {
    createOrder: input => createAssistedOrder(ownerProfileId, input, { updateLinkedRequest: false }),
    markRequestAccepted: async id => { await db.update(itemRequests).set({ status: "accepted", platformReply: ASSISTED_REQUEST_ACCEPTED_REPLY }).where(eq(itemRequests.id, id)); },
  });
}

export async function listAdminAssistedOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assistedOrders).orderBy(desc(assistedOrders.createdAt));
}

export async function updateAssistedOrderByAdmin(input: { assistedOrderId: number; status: AssistedOrderStatus; platformNotes?: string; quotedAmount?: number; paymentTiming?: AssistedOrderInput["paymentTiming"]; fulfilmentMethod?: AssistedOrderInput["fulfilmentMethod"] }) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  const order = (await db.select().from(assistedOrders).where(eq(assistedOrders.id, input.assistedOrderId)).limit(1))[0];
  if (!order) throw new Error("Assisted order not found.");
  assertAssistedOrderTransition(order.status, input.status);
  await db.update(assistedOrders).set({
    status: input.status,
    platformNotes: input.platformNotes?.trim() || order.platformNotes,
    quotedAmount: input.quotedAmount?.toFixed(2) || order.quotedAmount,
    paymentTiming: input.paymentTiming || order.paymentTiming,
    fulfilmentMethod: input.fulfilmentMethod || order.fulfilmentMethod,
    confirmedAt: input.status === "confirmed" ? new Date() : order.confirmedAt,
    completedAt: input.status === "completed" ? new Date() : order.completedAt,
  }).where(eq(assistedOrders.id, input.assistedOrderId));
  return { ok: true };
}

async function ensureProfileRole(profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  const profile = (await db.select().from(marketplaceProfiles).where(eq(marketplaceProfiles.id, profileId)).limit(1))[0];
  if (!profile) throw new Error("Marketplace profile was not found.");
  return profile;
}

export async function listBuyerItemRequests(profileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(itemRequests).where(eq(itemRequests.buyerProfileId, profileId)).orderBy(desc(itemRequests.createdAt));
}

export async function listAdminItemRequests() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ request: itemRequests })
    .from(itemRequests)
    .orderBy(desc(itemRequests.createdAt));
}

export async function updateItemRequestByAdmin(input: { requestId: number; status: "submitted" | "reviewing" | "quoted" | "accepted" | "sourcing" | "completed" | "unavailable" | "cancelled"; sourceRoute?: "mtaa_select" | "approved_vendor" | "supplier" | "external_marketplace" | "other"; quotedPrice?: number; platformReply?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  const request = (await db.select().from(itemRequests).where(eq(itemRequests.id, input.requestId)).limit(1))[0];
  if (!request) throw new Error("Item request not found.");
  await db.update(itemRequests).set({
    status: input.status,
    sourceRoute: input.sourceRoute || null,
    quotedPrice: input.quotedPrice?.toFixed(2),
    platformReply: input.platformReply?.trim() || null,
  }).where(eq(itemRequests.id, input.requestId));
  return { ok: true };
}

export function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}
