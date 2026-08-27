import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  assertMarketplaceRole,
  createAssistedOrder,
  createAssistedOrderFromRequest,
  createAssistedItemRequest,
  createItemRequest,
  createVendorForProfile,
  ensureMarketplaceProfile,
  getPublicProductBySlug,
  listAdminItemRequests,
  listAdminProducts,
  listAdminAssistedOrders,
  listAdminVendors,
  listApprovedVendors,
  listBuyerItemRequests,
  listPickupStations,
  listProducts,
  listPublicCategories,
  listVerifiedReviewsForProduct,
  makeSlug,
  moderateProduct,
  updateItemRequestByAdmin,
  updateAssistedOrderByAdmin,
  updateVendorGovernance,
} from "./marketplace";
import {
  confirmPickup,
  createOrderFromBasket,
  createVendorProduct,
  getAdminSummary,
  getVendorForProfile,
  listBuyerOrders,
  listNotifications,
  listVendorOrders,
  listVendorProducts,
  markNotificationRead,
  markReadyForPickup,
  openDispute,
  releaseEscrowOrder,
} from "./marketplace-operations";
import { initiateMpesaStkPush, isMpesaConfigured } from "./payments";
import { createItemRequestDraft, createListingDraft } from "./marketplace-ai";
import { getProductionReadiness } from "./production-readiness";
import { ensureSupabaseMarketplaceProfile } from "./supabase-profiles";
import { createV3HubOrder } from "./v3-orders";
import { deleteV3Product, listV3ModerationProducts, moderateV3Product } from "./v3-moderation";
import { submitV3VendorProduct } from "./v3-vendor";
import { applyForV3Vendor, bootstrapV3Owner, getV3BuyerOrderAccess, getV3VendorAccess, listV3VendorApplications, saveV3BuyerOrderProfile, updateV3VendorApproval } from "./v3-profiles";

const safeSearch = z.string().trim().max(100);
const phone = z.string().trim().regex(/^\+?254[17]\d{8}$/, "Use a Kenyan number beginning with 254.").optional();
const orderItemSchema = z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(20) });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    supabaseSession: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.supabaseIdentity) return { signedIn: false, protectedCommerceReady: false, message: "No verified MtaaMarket email session is present." };
      const profile = await ensureSupabaseMarketplaceProfile(ctx.supabaseIdentity);
      return {
        signedIn: true,
        subject: ctx.supabaseIdentity.subject,
        email: ctx.supabaseIdentity.email,
        profile,
        protectedCommerceReady: false,
        message: "Your MtaaMarket email session is verified with a buyer profile. Seller, owner, basket, order, and payment actions remain unavailable until the protected UUID migration is complete.",
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  marketplace: router({
    categories: publicProcedure.query(() => listPublicCategories()),
    pickupStations: publicProcedure.query(() => listPickupStations()),
    products: publicProcedure.input(z.object({ categorySlug: z.string().trim().max(96).optional(), search: safeSearch.optional(), limit: z.number().int().min(1).max(60).optional() }).optional()).query(({ input }) => listProducts(input)),
    productBySlug: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(220) })).query(({ input }) => getPublicProductBySlug(input.slug)),
    approvedVendors: publicProcedure.query(() => listApprovedVendors()),
    reviewsByProduct: publicProcedure.input(z.object({ productId: z.union([z.number().int().positive(), z.string().uuid()]) })).query(({ input }) => listVerifiedReviewsForProduct(input.productId)),
    mpesaStatus: publicProcedure.query(() => ({ configured: isMpesaConfigured(), environment: "sandbox" as const })),
    createV3HubOrder: publicProcedure.input(z.object({ productId: z.string().uuid() })).mutation(({ ctx, input }) => createV3HubOrder(ctx.supabaseIdentity, input)),
    v3BuyerOrderAccess: publicProcedure.query(({ ctx }) => getV3BuyerOrderAccess(ctx.supabaseIdentity)),
    saveV3BuyerOrderProfile: publicProcedure.input(z.object({ fullName: z.string().trim().min(2).max(90).optional(), phone: z.string().trim().regex(/^\+?254[17]\d{8}$/, "Use a Kenyan number beginning with 254.").optional() }).refine(input => Boolean(input.fullName || input.phone), "Add your name or Kenyan contact number.")).mutation(({ ctx, input }) => saveV3BuyerOrderProfile(ctx.supabaseIdentity, input)),
    v3ModerationProducts: publicProcedure.query(({ ctx }) => listV3ModerationProducts(ctx.supabaseIdentity)),
    moderateV3Product: publicProcedure.input(z.object({ productId: z.string().uuid(), status: z.enum(["ACTIVE", "REJECTED", "FLAGGED"]) })).mutation(({ ctx, input }) => moderateV3Product(ctx.supabaseIdentity, input.productId, input.status)),
    deleteV3Product: publicProcedure.input(z.object({ productId: z.string().uuid() })).mutation(({ ctx, input }) => deleteV3Product(ctx.supabaseIdentity, input.productId)),
    submitV3VendorProduct: publicProcedure.input(z.object({ title: z.string().trim().min(3).max(180), price: z.number().positive().max(10_000_000), imageData: z.string().max(7_000_000), imageType: z.enum(["image/jpeg", "image/png", "image/webp"]) })).mutation(({ ctx, input }) => submitV3VendorProduct(ctx.supabaseIdentity, input)),
    bootstrapV3Owner: publicProcedure.mutation(({ ctx }) => bootstrapV3Owner(ctx.supabaseIdentity)),
    v3VendorAccess: publicProcedure.query(({ ctx }) => getV3VendorAccess(ctx.supabaseIdentity)),
    applyForV3Vendor: publicProcedure.input(z.object({ agreementAccepted: z.literal(true) })).mutation(({ ctx, input }) => applyForV3Vendor(ctx.supabaseIdentity, input.agreementAccepted)),
    v3VendorApplications: publicProcedure.query(({ ctx }) => listV3VendorApplications(ctx.supabaseIdentity)),
    updateV3VendorApproval: publicProcedure.input(z.object({ profileId: z.string().uuid(), approved: z.boolean() })).mutation(({ ctx, input }) => updateV3VendorApproval(ctx.supabaseIdentity, input.profileId, input.approved)),

    myProfile: protectedProcedure.query(({ ctx }) => ensureMarketplaceProfile(ctx.user.id, ctx.user.name)),
    buyerWorkspace: protectedProcedure.query(async ({ ctx }) => {
      const profile = await ensureMarketplaceProfile(ctx.user.id, ctx.user.name);
      assertMarketplaceRole(profile.role, ["buyer", "vendor", "admin"]);
      return profile;
    }),
    notifications: protectedProcedure.query(async ({ ctx }) => listNotifications((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id)),
    markNotificationRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => markNotificationRead((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id, input.notificationId)),
    createOrder: protectedProcedure.input(z.object({ items: z.array(orderItemSchema).min(1).max(30), fulfilmentMethod: z.enum(["siaya_pickup", "home_delivery", "collection_point", "special_order"]), pickupStationId: z.number().int().positive().optional(), paymentPhone: z.string().trim().min(9).max(20).optional(), customerFulfilmentNote: z.string().trim().max(1200).optional(), deliveryArea: z.string().trim().max(180).optional() })).mutation(async ({ ctx, input }) => createOrderFromBasket((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id, input)),
    buyerOrders: protectedProcedure.query(async ({ ctx }) => listBuyerOrders((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id)),
    buyerItemRequests: protectedProcedure.query(async ({ ctx }) => listBuyerItemRequests((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id)),
    createItemRequest: protectedProcedure.input(z.object({ title: z.string().trim().min(4).max(180), details: z.string().trim().min(10).max(3000), budgetHint: z.number().positive().max(10000000).optional(), preferredFulfilment: z.enum(["siaya_pickup", "home_delivery", "collection_point", "special_order"]), preferredLocation: z.string().trim().max(180).optional() })).mutation(async ({ ctx, input }) => createItemRequest((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id, input)),
    draftItemRequest: protectedProcedure.input(z.object({ title: z.string().trim().max(180).optional(), details: z.string().trim().max(1200).optional(), preferredFulfilment: z.enum(["siaya_pickup", "home_delivery", "collection_point", "special_order"]), preferredLocation: z.string().trim().max(180).optional() }).refine(input => Boolean(input.title || input.details), { message: "Add a few words about the item before using the request assistant." })).mutation(async ({ ctx, input }) => {
      const profile = await ensureMarketplaceProfile(ctx.user.id, ctx.user.name);
      assertMarketplaceRole(profile.role, ["buyer", "vendor", "admin"]);
      return createItemRequestDraft(profile.id, input);
    }),
    initiatePayment: protectedProcedure.input(z.object({ orderId: z.number().int().positive(), phone: z.string().trim().min(9).max(20) })).mutation(async ({ ctx, input }) => initiateMpesaStkPush((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id, input.orderId, input.phone)),
    confirmPickup: protectedProcedure.input(z.object({ orderId: z.number().int().positive() })).mutation(async ({ ctx, input }) => confirmPickup((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id, input.orderId)),
    openDispute: protectedProcedure.input(z.object({ orderId: z.number().int().positive(), reason: z.string().trim().min(3).max(120), details: z.string().trim().min(10).max(3000) })).mutation(async ({ ctx, input }) => openDispute((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id, input.orderId, input.reason, input.details)),

    vendorWorkspace: protectedProcedure.query(async ({ ctx }) => {
      const profile = await ensureMarketplaceProfile(ctx.user.id, ctx.user.name);
      assertMarketplaceRole(profile.role, ["vendor", "admin"]);
      return profile;
    }),
    vendorDashboard: protectedProcedure.query(async ({ ctx }) => {
      const profile = await ensureMarketplaceProfile(ctx.user.id, ctx.user.name);
      assertMarketplaceRole(profile.role, ["vendor", "admin"]);
      return { vendor: await getVendorForProfile(profile.id), products: await listVendorProducts(profile.id), orders: await listVendorOrders(profile.id) };
    }),
    becomeVendor: protectedProcedure.input(z.object({ storeName: z.string().trim().min(3).max(120), storeSlug: z.string().trim().min(3).max(140).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only."), description: z.string().trim().max(1500).optional(), supportPhone: phone, serviceArea: z.string().trim().min(3).max(240).optional() })).mutation(async ({ ctx, input }) => {
      const profile = await ensureMarketplaceProfile(ctx.user.id, ctx.user.name);
      assertMarketplaceRole(profile.role, ["buyer"]);
      return createVendorForProfile(profile.id, { ...input, storeSlug: makeSlug(input.storeSlug) });
    }),
    createVendorProduct: protectedProcedure.input(z.object({ categoryId: z.number().int().positive(), title: z.string().trim().min(4).max(180), description: z.string().trim().min(20).max(5000), price: z.number().positive().max(10000000), stockQuantity: z.number().int().min(0).max(100000), itemCondition: z.enum(["new", "used", "refurbished"]), availabilityStatus: z.enum(["ready", "seller_confirmed", "special_order"]), paymentTiming: z.enum(["pay_before", "pay_on_collection", "pay_on_delivery", "confirm_with_mtaamarket"]), fulfilmentOptions: z.array(z.enum(["siaya_pickup", "home_delivery", "collection_point", "special_order"])).min(1).max(4), imageDataUrl: z.string().max(3_000_000).optional() })).mutation(async ({ ctx, input }) => createVendorProduct((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id, input)),
    draftListingCopy: protectedProcedure.input(z.object({ title: z.string().trim().min(4).max(180), categoryName: z.string().trim().min(2).max(80), itemCondition: z.enum(["new", "used", "refurbished"]), facts: z.string().trim().max(900).optional() })).mutation(async ({ ctx, input }) => {
      const profile = await ensureMarketplaceProfile(ctx.user.id, ctx.user.name);
      assertMarketplaceRole(profile.role, ["vendor", "admin"]);
      return createListingDraft(profile.id, input);
    }),
    markReadyForPickup: protectedProcedure.input(z.object({ orderId: z.number().int().positive() })).mutation(async ({ ctx, input }) => markReadyForPickup((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id, input.orderId)),

    adminFoundation: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      const profile = await ensureMarketplaceProfile(ctx.user.id, ctx.user.name);
      assertMarketplaceRole(profile.role, ["admin"]);
      return { profile, access: "admin" as const };
    }),
    adminSummary: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return getAdminSummary();
    }),
    adminProductionReadiness: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return getProductionReadiness();
    }),
    adminVendors: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return listAdminVendors();
    }),
    adminProducts: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return listAdminProducts();
    }),
    adminUpdateVendor: protectedProcedure.input(z.object({ vendorId: z.number().int().positive(), approvalStatus: z.enum(["pending", "approved", "suspended", "rejected"]), ownerNotes: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return updateVendorGovernance(input.vendorId, input.approvalStatus, input.ownerNotes);
    }),
    adminModerateProduct: protectedProcedure.input(z.object({ productId: z.number().int().positive(), moderationStatus: z.enum(["visible", "paused", "removed"]) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return moderateProduct(input.productId, input.moderationStatus);
    }),
    adminItemRequests: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return listAdminItemRequests();
    }),
    adminAssistedOrders: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return listAdminAssistedOrders();
    }),
    adminCreateAssistedOrder: protectedProcedure.input(z.object({ customerName: z.string().trim().min(2).max(120), customerPhone: z.string().trim().min(9).max(20).optional(), title: z.string().trim().min(4).max(180), details: z.string().trim().min(10).max(3000), quotedAmount: z.number().positive().max(10000000).optional(), paymentTiming: z.enum(["pay_before", "pay_on_collection", "pay_on_delivery", "confirm_with_mtaamarket"]), fulfilmentMethod: z.enum(["siaya_pickup", "home_delivery", "collection_point", "special_order"]), preferredLocation: z.string().trim().max(180).optional(), sourceRoute: z.enum(["mtaa_select", "approved_vendor", "supplier", "external_marketplace", "other"]), externalSourceDisclosure: z.string().trim().max(600).optional(), externalContentAttestation: z.boolean().optional(), platformNotes: z.string().trim().max(3000).optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return createAssistedOrder((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id, input);
    }),
    adminCreateAssistedOrderFromRequest: protectedProcedure.input(z.object({ requestId: z.number().int().positive(), externalSourceDisclosure: z.string().trim().max(600).optional(), externalContentAttestation: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return createAssistedOrderFromRequest((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id, input.requestId, input.externalSourceDisclosure, input.externalContentAttestation);
    }),
    adminUpdateAssistedOrder: protectedProcedure.input(z.object({ assistedOrderId: z.number().int().positive(), status: z.enum(["recorded", "confirmed", "sourcing", "ready", "out_for_delivery", "completed", "cancelled"]), platformNotes: z.string().trim().max(3000).optional(), quotedAmount: z.number().positive().max(10000000).optional(), paymentTiming: z.enum(["pay_before", "pay_on_collection", "pay_on_delivery", "confirm_with_mtaamarket"]).optional(), fulfilmentMethod: z.enum(["siaya_pickup", "home_delivery", "collection_point", "special_order"]).optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return updateAssistedOrderByAdmin(input);
    }),
    adminCreateAssistedItemRequest: protectedProcedure.input(z.object({ customerName: z.string().trim().min(2).max(120), customerPhone: z.string().trim().min(9).max(20).optional(), title: z.string().trim().min(4).max(180), details: z.string().trim().min(10).max(3000), budgetHint: z.number().positive().max(10000000).optional(), preferredFulfilment: z.enum(["siaya_pickup", "home_delivery", "collection_point", "special_order"]), preferredLocation: z.string().trim().max(180).optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return createAssistedItemRequest((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id, input);
    }),
    adminUpdateItemRequest: protectedProcedure.input(z.object({ requestId: z.number().int().positive(), status: z.enum(["submitted", "reviewing", "quoted", "accepted", "sourcing", "completed", "unavailable", "cancelled"]), sourceRoute: z.enum(["mtaa_select", "approved_vendor", "supplier", "external_marketplace", "other"]).optional(), quotedPrice: z.number().positive().max(10000000).optional(), platformReply: z.string().trim().max(3000).optional() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return updateItemRequestByAdmin(input);
    }),
    adminReleaseEscrow: protectedProcedure.input(z.object({ orderId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return releaseEscrowOrder(input.orderId, (await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
