import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  assertMarketplaceRole,
  createVendorForProfile,
  ensureMarketplaceProfile,
  getPublicProductBySlug,
  listPickupStations,
  listProducts,
  listPublicCategories,
  listVerifiedReviewsForProduct,
  makeSlug,
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

const safeSearch = z.string().trim().max(100);
const phone = z.string().trim().regex(/^\+?254[17]\d{8}$/, "Use a Kenyan number beginning with 254.").optional();
const orderItemSchema = z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(20) });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
    reviewsByProduct: publicProcedure.input(z.object({ productId: z.number().int().positive() })).query(({ input }) => listVerifiedReviewsForProduct(input.productId)),
    mpesaStatus: publicProcedure.query(() => ({ configured: isMpesaConfigured(), environment: "sandbox" as const })),

    myProfile: protectedProcedure.query(({ ctx }) => ensureMarketplaceProfile(ctx.user.id, ctx.user.name)),
    buyerWorkspace: protectedProcedure.query(async ({ ctx }) => {
      const profile = await ensureMarketplaceProfile(ctx.user.id, ctx.user.name);
      assertMarketplaceRole(profile.role, ["buyer", "vendor", "admin"]);
      return profile;
    }),
    notifications: protectedProcedure.query(async ({ ctx }) => listNotifications((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id)),
    markNotificationRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => markNotificationRead((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id, input.notificationId)),
    createOrder: protectedProcedure.input(z.object({ items: z.array(orderItemSchema).min(1).max(30), pickupStationId: z.number().int().positive(), paymentPhone: z.string().trim().min(9).max(20) })).mutation(async ({ ctx, input }) => createOrderFromBasket((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id, input)),
    buyerOrders: protectedProcedure.query(async ({ ctx }) => listBuyerOrders((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id)),
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
    becomeVendor: protectedProcedure.input(z.object({ storeName: z.string().trim().min(3).max(120), storeSlug: z.string().trim().min(3).max(140).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only."), description: z.string().trim().max(1500).optional(), supportPhone: phone })).mutation(async ({ ctx, input }) => {
      const profile = await ensureMarketplaceProfile(ctx.user.id, ctx.user.name);
      assertMarketplaceRole(profile.role, ["buyer"]);
      return createVendorForProfile(profile.id, { ...input, storeSlug: makeSlug(input.storeSlug) });
    }),
    createVendorProduct: protectedProcedure.input(z.object({ categoryId: z.number().int().positive(), title: z.string().trim().min(4).max(180), description: z.string().trim().min(20).max(5000), price: z.number().positive().max(10000000), stockQuantity: z.number().int().min(0).max(100000), imageDataUrl: z.string().max(3_000_000).optional() })).mutation(async ({ ctx, input }) => createVendorProduct((await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id, input)),
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
    adminReleaseEscrow: protectedProcedure.input(z.object({ orderId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      return releaseEscrowOrder(input.orderId, (await ensureMarketplaceProfile(ctx.user.id, ctx.user.name)).id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
