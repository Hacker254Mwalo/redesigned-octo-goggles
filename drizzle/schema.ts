import {
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core account record populated by Manus OAuth. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const marketplaceProfiles = mysqlTable("marketplace_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("displayName", { length: 120 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  role: mysqlEnum("role", ["buyer", "vendor", "admin"]).default("buyer").notNull(),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("marketplace_profiles_phone_unique").on(table.phoneNumber)]);

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  icon: varchar("icon", { length: 48 }).notNull(),
  description: varchar("description", { length: 240 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull().unique().references(() => marketplaceProfiles.id, { onDelete: "cascade" }),
  storeName: varchar("storeName", { length: 120 }).notNull(),
  storeSlug: varchar("storeSlug", { length: 140 }).notNull().unique(),
  description: text("description"),
  supportPhone: varchar("supportPhone", { length: 20 }),
  logoUrl: text("logoUrl"),
  pickupNotes: text("pickupNotes"),
  isVerified: boolean("isVerified").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").references(() => vendors.id, { onDelete: "set null" }),
  categoryId: int("categoryId").notNull().references(() => categories.id),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  compareAtPrice: decimal("compareAtPrice", { precision: 12, scale: 2 }),
  stockQuantity: int("stockQuantity").default(0).notNull(),
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 512 }),
  imageAlt: varchar("imageAlt", { length: 180 }),
  isLocalInventory: boolean("isLocalInventory").default(false).notNull(),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("products_discovery_index").on(table.status, table.categoryId, table.createdAt),
  index("products_vendor_index").on(table.vendorId, table.status),
]);

export const pickupStations = mysqlTable("pickup_stations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  county: varchar("county", { length: 80 }).notNull(),
  town: varchar("town", { length: 80 }).notNull(),
  address: text("address").notNull(),
  landmark: varchar("landmark", { length: 180 }),
  openingHours: varchar("openingHours", { length: 180 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("pickup_stations_location_index").on(table.county, table.town, table.isActive)]);

export const carts = mysqlTable("carts", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull().references(() => marketplaceProfiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("carts_profile_unique").on(table.profileId)]);

export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  cartId: int("cartId").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: int("quantity").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("cart_items_cart_product_unique").on(table.cartId, table.productId)]);

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull().unique(),
  buyerProfileId: int("buyerProfileId").notNull().references(() => marketplaceProfiles.id),
  vendorId: int("vendorId").references(() => vendors.id, { onDelete: "set null" }),
  pickupStationId: int("pickupStationId").references(() => pickupStations.id, { onDelete: "set null" }),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  pickupFee: decimal("pickupFee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "initiated", "paid", "failed", "refunded"]).default("unpaid").notNull(),
  status: mysqlEnum("status", ["pending_payment", "paid_escrow", "ready_for_pickup", "picked_up", "released_vendor", "disputed", "cancelled"]).default("pending_payment").notNull(),
  mpesaCheckoutRequestId: varchar("mpesaCheckoutRequestId", { length: 128 }),
  mpesaMerchantRequestId: varchar("mpesaMerchantRequestId", { length: 128 }),
  mpesaReceiptNumber: varchar("mpesaReceiptNumber", { length: 64 }),
  paymentPhone: varchar("paymentPhone", { length: 20 }),
  autoReleaseAt: timestamp("autoReleaseAt"),
  pickedUpAt: timestamp("pickedUpAt"),
  releasedAt: timestamp("releasedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("orders_buyer_status_index").on(table.buyerProfileId, table.status, table.createdAt),
  index("orders_vendor_status_index").on(table.vendorId, table.status, table.createdAt),
  uniqueIndex("orders_checkout_request_unique").on(table.mpesaCheckoutRequestId),
]);

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: int("productId").references(() => products.id, { onDelete: "set null" }),
  vendorId: int("vendorId").references(() => vendors.id, { onDelete: "set null" }),
  titleSnapshot: varchar("titleSnapshot", { length: 180 }).notNull(),
  imageUrlSnapshot: text("imageUrlSnapshot"),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  quantity: int("quantity").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("order_items_order_index").on(table.orderId)]);

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  buyerProfileId: int("buyerProfileId").notNull().references(() => marketplaceProfiles.id, { onDelete: "cascade" }),
  orderItemId: int("orderItemId").notNull().unique().references(() => orderItems.id, { onDelete: "cascade" }),
  rating: int("rating").notNull(),
  comment: text("comment"),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("reviews_product_index").on(table.productId, table.createdAt)]);

export const disputes = mysqlTable("disputes", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique().references(() => orders.id, { onDelete: "cascade" }),
  openedByProfileId: int("openedByProfileId").notNull().references(() => marketplaceProfiles.id),
  reason: varchar("reason", { length: 120 }).notNull(),
  details: text("details").notNull(),
  status: mysqlEnum("status", ["open", "under_review", "resolved_buyer", "resolved_vendor", "closed"]).default("open").notNull(),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull().references(() => marketplaceProfiles.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["payment", "pickup", "delivery", "dispute", "order", "system"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  orderId: int("orderId").references(() => orders.id, { onDelete: "set null" }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("notifications_profile_index").on(table.profileId, table.isRead, table.createdAt)]);

export const orderEvents = mysqlTable("order_events", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => orders.id, { onDelete: "cascade" }),
  actorProfileId: int("actorProfileId").references(() => marketplaceProfiles.id, { onDelete: "set null" }),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  fromStatus: varchar("fromStatus", { length: 48 }),
  toStatus: varchar("toStatus", { length: 48 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("order_events_order_index").on(table.orderId, table.createdAt)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type MarketplaceProfile = typeof marketplaceProfiles.$inferSelect;
export type Product = typeof products.$inferSelect;
