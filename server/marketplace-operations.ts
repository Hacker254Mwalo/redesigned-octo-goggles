import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { customAlphabet, nanoid } from "nanoid";
import {
  categories,
  disputes,
  marketplaceProfiles,
  notifications,
  orderEvents,
  orderItems,
  orders,
  pickupStations,
  products,
  vendors,
} from "../drizzle/schema";
import { getDb } from "./db";
import { assertMarketplaceRole, makeSlug, type MarketplaceRole } from "./marketplace";
import { storagePut } from "./storage";

export type OrderStatus = "pending_payment" | "paid_escrow" | "ready_for_pickup" | "picked_up" | "released_vendor" | "disputed" | "cancelled";
export type PaymentTiming = "pay_before" | "pay_on_collection" | "pay_on_delivery" | "confirm_with_mtaamarket";
export type FulfilmentMethod = "siaya_pickup" | "home_delivery" | "collection_point" | "special_order";

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid_escrow", "cancelled"],
  paid_escrow: ["ready_for_pickup", "disputed", "cancelled"],
  ready_for_pickup: ["picked_up", "disputed"],
  picked_up: ["released_vendor", "disputed"],
  released_vendor: [],
  disputed: ["released_vendor", "cancelled"],
  cancelled: [],
};
const orderToken = customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

export function assertOrderTransition(from: OrderStatus, to: OrderStatus) {
  if (!ORDER_TRANSITIONS[from].includes(to)) throw new Error(`Order cannot move from ${from.replaceAll("_", " ")} to ${to.replaceAll("_", " ")}.`);
}

export function normalizeKenyanPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `254${digits.slice(1)}` : digits.startsWith("7") || digits.startsWith("1") ? `254${digits}` : digits;
  if (!/^254[17]\d{8}$/.test(normalized)) throw new Error("Enter a valid Kenyan mobile number.");
  return normalized;
}

export function makeOrderNumber() {
  return `MTAA-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${orderToken()}`;
}

export function getPickupStationDeliveryNotice(orderNumber: string) {
  return {
    type: "delivery" as const,
    title: "Arrived at your pickup station",
    body: `${orderNumber} has been delivered to your selected pickup station and is ready for collection.`,
  };
}

export function toVendorSafeOrderView(order: typeof orders.$inferSelect) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    status: order.status,
    fulfilmentMethod: order.fulfilmentMethod,
    paymentTimingSnapshot: order.paymentTimingSnapshot,
    pickupStationId: order.pickupStationId,
    createdAt: order.createdAt,
  };
}

export function resolvePaymentTimingSnapshot(timings: PaymentTiming[]): PaymentTiming {
  return timings.length > 0 && new Set(timings).size === 1 ? timings[0] : "confirm_with_mtaamarket";
}

/** Live-animal listings require the isolated UUID workflow with owner review; never publish them through the legacy seller-write path. */
export function assertLegacySellerListingCategoryCanPublish(categorySlug: string) {
  if (categorySlug === "poultry-livestock") {
    throw new Error("Poultry and livestock listings require MtaaMarket owner review and manual collection checks before they can be published.");
  }
}

export function validateFulfilmentSelection(input: { fulfilmentMethod: FulfilmentMethod; pickupStationId?: number; customerFulfilmentNote?: string; deliveryArea?: string }) {
  const hasLocation = Boolean(input.deliveryArea?.trim() || input.customerFulfilmentNote?.trim());
  if (input.fulfilmentMethod === "home_delivery" && !hasLocation) throw new Error("Add a Siaya delivery area or location suggestion for home delivery.");
  if (input.fulfilmentMethod === "collection_point" && !input.pickupStationId && !hasLocation) throw new Error("Choose a collection point or add a collection suggestion.");
}

async function getProfile(profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  const profile = (await db.select().from(marketplaceProfiles).where(eq(marketplaceProfiles.id, profileId)).limit(1))[0];
  if (!profile) throw new Error("Marketplace profile was not found.");
  return profile;
}

export async function getVendorForProfile(profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  return (await db.select().from(vendors).where(eq(vendors.profileId, profileId)).limit(1))[0];
}

async function notify(profileId: number, type: "payment" | "pickup" | "delivery" | "dispute" | "order" | "system", title: string, body: string, orderId?: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ profileId, type, title, body, orderId });
}

async function notifyVendor(vendorId: number | null, type: "payment" | "pickup" | "delivery" | "dispute" | "order", title: string, body: string, orderId: number) {
  if (!vendorId) return;
  const db = await getDb();
  if (!db) return;
  const vendor = (await db.select({ profileId: vendors.profileId }).from(vendors).where(eq(vendors.id, vendorId)).limit(1))[0];
  if (vendor) await notify(vendor.profileId, type, title, body, orderId);
}

export async function createOrderFromBasket(profileId: number, input: { items: { productId: number; quantity: number }[]; fulfilmentMethod: FulfilmentMethod; pickupStationId?: number; paymentPhone?: string; customerFulfilmentNote?: string; deliveryArea?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Marketplace database is unavailable.");
  const profile = await getProfile(profileId);
  assertMarketplaceRole(profile.role, ["buyer", "vendor", "admin"]);
  validateFulfilmentSelection(input);
  if (!input.items.length || input.items.length > 30) throw new Error("Your basket must contain between 1 and 30 items.");
  const quantities = new Map<number, number>();
  for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  if (Array.from(quantities.values()).some(quantity => quantity < 1 || quantity > 20)) throw new Error("Each item quantity must be between 1 and 20.");
  const ids = Array.from(quantities.keys());
  const rows = await db.select().from(products).where(inArray(products.id, ids));
  if (rows.length !== ids.length || rows.some(product => product.status !== "active")) throw new Error("One or more selected products are no longer available.");
  const station = input.pickupStationId
    ? (await db.select().from(pickupStations).where(and(eq(pickupStations.id, input.pickupStationId), eq(pickupStations.isActive, true))).limit(1))[0]
    : undefined;
  if (input.pickupStationId && !station) throw new Error("Select an active Siaya collection point.");
  const vendorIds = Array.from(new Set(rows.map(product => product.vendorId).filter((value): value is number => value !== null)));
  if (vendorIds.length > 1) throw new Error("Please place separate orders for products from different sellers.");
  for (const product of rows) if ((product.stockQuantity || 0) < (quantities.get(product.id) || 0)) throw new Error(`${product.title} does not have enough stock.`);
  const subtotal = rows.reduce((total, product) => total + Number(product.price) * (quantities.get(product.id) || 0), 0);
  const fulfilmentFee = 0;
  const orderNumber = makeOrderNumber();
  const paymentPhone = input.paymentPhone?.trim() ? normalizeKenyanPhone(input.paymentPhone) : undefined;
  const paymentTimingSnapshot = resolvePaymentTimingSnapshot(rows.map(product => product.paymentTiming));
  const inserted = await db.insert(orders).values({
    orderNumber, buyerProfileId: profileId, vendorId: vendorIds[0] ?? null, pickupStationId: station?.id,
    subtotal: subtotal.toFixed(2), pickupFee: fulfilmentFee.toFixed(2), totalAmount: (subtotal + fulfilmentFee).toFixed(2), paymentPhone,
    fulfilmentMethod: input.fulfilmentMethod,
    customerFulfilmentNote: input.customerFulfilmentNote?.trim() || null,
    deliveryArea: input.deliveryArea?.trim() || null,
    paymentTimingSnapshot,
  });
  const orderId = Number(inserted[0].insertId);
  await db.insert(orderItems).values(rows.map(product => ({
    orderId, productId: product.id, vendorId: product.vendorId, titleSnapshot: product.title, imageUrlSnapshot: product.imageUrl,
    unitPrice: String(product.price), quantity: quantities.get(product.id) || 1,
  })));
  await db.insert(orderEvents).values({ orderId, actorProfileId: profileId, eventType: "order_created", toStatus: "pending_payment", metadata: { fulfilmentMethod: input.fulfilmentMethod, pickupStationId: station?.id ?? null, paymentTimingSnapshot } });
  await notify(profileId, "order", "Order received", `${orderNumber} is with MtaaMarket for confirmation. We will update your fulfilment and payment instructions here.`, orderId);
  await notifyVendor(vendorIds[0] ?? null, "order", "New marketplace order", `${orderNumber} is awaiting MtaaMarket confirmation. Prepare only after the platform gives the next instruction.`, orderId);
  return (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
}

export async function listBuyerOrders(profileId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select({ order: orders, station: pickupStations, vendor: vendors }).from(orders)
    .leftJoin(pickupStations, eq(orders.pickupStationId, pickupStations.id)).leftJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(eq(orders.buyerProfileId, profileId)).orderBy(desc(orders.createdAt));
}

export async function listVendorOrders(profileId: number) {
  const db = await getDb(); if (!db) return [];
  const vendor = await getVendorForProfile(profileId); if (!vendor) return [];
  const rows = await db.select({ order: orders, station: pickupStations }).from(orders)
    .leftJoin(pickupStations, eq(orders.pickupStationId, pickupStations.id))
    .where(eq(orders.vendorId, vendor.id)).orderBy(desc(orders.createdAt));
  return rows.map(({ order, station }) => ({ order: toVendorSafeOrderView(order), station }));
}

export async function listNotifications(profileId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.profileId, profileId)).orderBy(desc(notifications.createdAt)).limit(40);
}

export async function markNotificationRead(profileId: number, notificationId: number) {
  const db = await getDb(); if (!db) throw new Error("Marketplace database is unavailable.");
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, notificationId), eq(notifications.profileId, profileId)));
  return { ok: true };
}

export async function createVendorProduct(profileId: number, input: { categoryId: number; title: string; description: string; price: number; stockQuantity: number; itemCondition: "new" | "used" | "refurbished"; availabilityStatus: "ready" | "seller_confirmed" | "special_order"; paymentTiming: "pay_before" | "pay_on_collection" | "pay_on_delivery" | "confirm_with_mtaamarket"; fulfilmentOptions: ("siaya_pickup" | "home_delivery" | "collection_point" | "special_order")[]; imageDataUrl?: string }) {
  const db = await getDb(); if (!db) throw new Error("Marketplace database is unavailable.");
  const profile = await getProfile(profileId); assertMarketplaceRole(profile.role, ["vendor", "admin"]);
  const vendor = await getVendorForProfile(profileId); if (!vendor) throw new Error("Create your vendor profile before adding products.");
  if (vendor.approvalStatus !== "approved" || !vendor.isActive) throw new Error("Your Seller Studio is awaiting MtaaMarket approval before listings can go public.");
  const category = (await db.select().from(categories).where(eq(categories.id, input.categoryId)).limit(1))[0]; if (!category) throw new Error("Select a valid category.");
  assertLegacySellerListingCategoryCanPublish(category.slug);
  let imageUrl: string | undefined; let imageKey: string | undefined;
  if (input.imageDataUrl) {
    const match = input.imageDataUrl.match(/^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/);
    if (!match) throw new Error("Use a compressed WebP product image.");
    const bytes = Buffer.from(match[1], "base64");
    if (!bytes.length || bytes.length > 2 * 1024 * 1024) throw new Error("The compressed image must be 2 MB or smaller.");
    const saved = await storagePut(`vendors/${vendor.id}/products/${nanoid(16)}.webp`, bytes, "image/webp"); imageUrl = saved.url; imageKey = saved.key;
  }
  const slug = `${makeSlug(input.title)}-${nanoid(6).toLowerCase()}`;
  await db.insert(products).values({ vendorId: vendor.id, categoryId: category.id, title: input.title, slug, description: input.description, price: input.price.toFixed(2), stockQuantity: input.stockQuantity, imageUrl, imageKey, imageAlt: input.title, sourceType: "approved_seller", itemCondition: input.itemCondition, availabilityStatus: input.availabilityStatus, paymentTiming: input.paymentTiming, fulfilmentOptions: input.fulfilmentOptions, moderationStatus: "visible", status: "active" });
  return (await db.select().from(products).where(eq(products.slug, slug)).limit(1))[0];
}

export async function listVendorProducts(profileId: number) {
  const db = await getDb(); if (!db) return []; const vendor = await getVendorForProfile(profileId); if (!vendor) return [];
  return db.select({ product: products, category: categories }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(eq(products.vendorId, vendor.id)).orderBy(desc(products.createdAt));
}

export async function markReadyForPickup(profileId: number, orderId: number) {
  const db = await getDb(); if (!db) throw new Error("Marketplace database is unavailable."); const profile = await getProfile(profileId);
  const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0]; if (!order) throw new Error("Order not found.");
  if (profile.role !== "admin") { const vendor = await getVendorForProfile(profileId); if (!vendor || vendor.id !== order.vendorId) throw new Error("Only the assigned vendor can prepare this order."); }
  assertOrderTransition(order.status as OrderStatus, "ready_for_pickup"); if (order.paymentTimingSnapshot === "pay_before" && order.paymentStatus !== "paid") throw new Error("Payment must be confirmed before this order can be prepared.");
  await db.update(orders).set({ status: "ready_for_pickup" }).where(eq(orders.id, orderId)); await db.insert(orderEvents).values({ orderId, actorProfileId: profileId, eventType: "ready_for_pickup", fromStatus: order.status, toStatus: "ready_for_pickup" });
  await notify(order.buyerProfileId, "delivery", "Order update", `${order.orderNumber} is ready for the next fulfilment step. Check MtaaMarket for the confirmed collection or delivery instructions.`, orderId); return { ok: true };
}

export async function confirmPickup(profileId: number, orderId: number) {
  const db = await getDb(); if (!db) throw new Error("Marketplace database is unavailable."); const order = (await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.buyerProfileId, profileId))).limit(1))[0]; if (!order) throw new Error("Order not found.");
  assertOrderTransition(order.status as OrderStatus, "picked_up"); const releaseAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.update(orders).set({ status: "picked_up", pickedUpAt: new Date(), autoReleaseAt: releaseAt }).where(eq(orders.id, orderId)); await db.insert(orderEvents).values({ orderId, actorProfileId: profileId, eventType: "pickup_confirmed", fromStatus: order.status, toStatus: "picked_up", metadata: { autoReleaseAt: releaseAt.toISOString() } });
  await notifyVendor(order.vendorId, "pickup", "Pickup confirmed", `${order.orderNumber} was confirmed by the buyer. Escrow release is scheduled after the dispute window.`, orderId); return { ok: true, autoReleaseAt: releaseAt };
}

export async function openDispute(profileId: number, orderId: number, reason: string, details: string) {
  const db = await getDb(); if (!db) throw new Error("Marketplace database is unavailable."); const order = (await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.buyerProfileId, profileId))).limit(1))[0]; if (!order) throw new Error("Order not found.");
  assertOrderTransition(order.status as OrderStatus, "disputed"); await db.insert(disputes).values({ orderId, openedByProfileId: profileId, reason, details }); await db.update(orders).set({ status: "disputed", autoReleaseAt: null }).where(eq(orders.id, orderId)); await db.insert(orderEvents).values({ orderId, actorProfileId: profileId, eventType: "dispute_opened", fromStatus: order.status, toStatus: "disputed" });
  await notifyVendor(order.vendorId, "dispute", "Order dispute opened", `${order.orderNumber} has an open dispute. Escrow remains held.`, orderId); return { ok: true };
}

export async function releaseEscrowOrder(orderId: number, actorProfileId?: number) {
  const db = await getDb(); if (!db) throw new Error("Marketplace database is unavailable."); const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0]; if (!order) throw new Error("Order not found.");
  assertOrderTransition(order.status as OrderStatus, "released_vendor"); await db.update(orders).set({ status: "released_vendor", releasedAt: new Date() }).where(eq(orders.id, orderId)); await db.insert(orderEvents).values({ orderId, actorProfileId: actorProfileId ?? null, eventType: "escrow_released", fromStatus: order.status, toStatus: "released_vendor" });
  await notify(order.buyerProfileId, "order", "Order completed", `${order.orderNumber} has completed the marketplace escrow process.`, orderId); await notifyVendor(order.vendorId, "order", "Escrow released", `${order.orderNumber} is marked as released to the vendor ledger.`, orderId); return { ok: true };
}

export async function releaseEligibleEscrowOrders() {
  const db = await getDb(); if (!db) return { released: 0 }; const eligible = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.status, "picked_up"), lte(orders.autoReleaseAt, new Date())));
  for (const order of eligible) await releaseEscrowOrder(order.id); return { released: eligible.length };
}

export async function getAdminSummary() {
  const db = await getDb(); if (!db) return { orderCount: 0, openDisputeCount: 0, notificationCount: 0 };
  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders); const [openDisputeCount] = await db.select({ count: sql<number>`count(*)` }).from(disputes).where(inArray(disputes.status, ["open", "under_review"])); const [notificationCount] = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(eq(notifications.isRead, false));
  return { orderCount: Number(orderCount.count), openDisputeCount: Number(openDisputeCount.count), notificationCount: Number(notificationCount.count) };
}
