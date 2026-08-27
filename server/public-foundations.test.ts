import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

describe("public performance and mobile foundations", () => {
  it("lazy-loads non-home routes while keeping the public home route immediate", () => {
    const source = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");

    expect(source).toContain('import Home from "./pages/Home"');
    expect(source).toContain('lazy(() => import("./pages/RequestDeskPage"))');
    expect(source).toContain('lazy(() => import("./pages/DashboardPage"))');
    expect(source).toContain("<Suspense fallback={<RouteLoadingState />}>");
  });

  it("exposes a non-caching web-app manifest and mobile theme metadata", () => {
    const head = readFileSync(resolve(projectRoot, "client/index.html"), "utf8");
    const manifest = JSON.parse(readFileSync(resolve(projectRoot, "client/public/manifest.webmanifest"), "utf8"));

    expect(head).toContain('rel="manifest" href="/manifest.webmanifest"');
    expect(head).toContain('name="theme-color" content="#0e2f27"');
    expect(manifest).toMatchObject({
      name: "Siaya Online MtaaMarket",
      display: "standalone",
      start_url: "/",
    });
    expect(manifest).not.toHaveProperty("icons");
  });

  it("uses truthful Siaya-focused public metadata without disabling browser zoom", () => {
    const head = readFileSync(resolve(projectRoot, "client/index.html"), "utf8");

    expect(head).toContain("Siaya Online MtaaMarket");
    expect(head).toContain('name="description"');
    expect(head).toContain('name="robots" content="index,follow"');
    expect(head).toContain('rel="canonical" href="https://siayaonlinemarket.vercel.app/"');
    expect(head).toContain('property="og:type" content="website"');
    expect(head).not.toContain("maximum-scale=1");
  });

  it("does not load an unresolved analytics provider placeholder in the public document", () => {
    const head = readFileSync(resolve(projectRoot, "client/index.html"), "utf8");

    expect(head).not.toContain("VITE_ANALYTICS_ENDPOINT");
    expect(head).not.toContain("VITE_ANALYTICS_WEBSITE_ID");
    expect(head).not.toContain("/umami");
  });

  it("keeps public error recovery branded and avoids exposing technical error details", () => {
    const boundary = readFileSync(resolve(projectRoot, "client/src/components/ErrorBoundary.tsx"), "utf8");
    const notFound = readFileSync(resolve(projectRoot, "client/src/pages/NotFound.tsx"), "utf8");

    expect(boundary).toContain("Your request has not been sent.");
    expect(boundary).toContain("Return to MtaaMarket");
    expect(boundary).toContain("technical details are not shown");
    expect(boundary).not.toContain("this.state.error?.stack");
    expect(notFound).toContain("MtaaMarket route guide");
    expect(notFound).toContain("Return to MtaaMarket");
  });

  it("provides a shared keyboard skip path past repeated MtaaMarket navigation", () => {
    const layout = readFileSync(resolve(projectRoot, "client/src/components/MarketplaceLayout.tsx"), "utf8");
    const styles = readFileSync(resolve(projectRoot, "client/src/index.css"), "utf8");

    expect(layout).toContain('href="#main-content"');
    expect(layout).toContain('id="main-content" tabIndex={-1}');
    expect(styles).toContain(".skip-link");
    expect(styles).toContain(".skip-link:focus-visible");
  });

  it("exposes clear current-page and mobile-menu semantics in the shared public navigation", () => {
    const layout = readFileSync(resolve(projectRoot, "client/src/components/MarketplaceLayout.tsx"), "utf8");

    expect(layout).toContain('aria-current={location === href ? "page" : undefined}');
    expect(layout).toContain('aria-expanded={open}');
    expect(layout).toContain('aria-controls="mtaa-market-mobile-menu"');
    expect(layout).toContain('id="mtaa-market-mobile-menu"');
    expect(layout).toContain('aria-label={open ? "Close navigation" : "Open navigation"}');
    expect(layout).toContain('event.key === "Escape"');
    expect(layout).toContain("window.addEventListener(\"keydown\", closeOnEscape)");
    expect(layout).toContain("setOpen(false);");
  });

  it("publishes a truthful privacy route before public Google sign-in is enabled", () => {
    const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
    const layout = readFileSync(resolve(projectRoot, "client/src/components/MarketplaceLayout.tsx"), "utf8");
    const dialog = readFileSync(resolve(projectRoot, "client/src/components/MtaaAccountDialog.tsx"), "utf8");
    const privacy = readFileSync(resolve(projectRoot, "client/src/pages/PrivacyPage.tsx"), "utf8");
    const callback = readFileSync(resolve(projectRoot, "client/src/pages/SupabaseAuthCallbackPage.tsx"), "utf8");

    expect(app).toContain('path={"/privacy"}');
    expect(layout).toContain('href="/privacy"');
    expect(dialog).toContain("How account data is used");
    expect(privacy).toContain("Google sign-in");
    expect(privacy).toContain("does not request access to your Google Drive");
    expect(privacy).toContain("Seller access, owner roles, orders, payment, delivery");
    expect(callback).toContain("MtaaMarket secure sign-in");
    expect(callback).not.toContain("You are signed in with email.");
  });

  it("keeps the public dashboard route on a V3 transition gate instead of invoking legacy protected operations", () => {
    const dashboard = readFileSync(resolve(projectRoot, "client/src/pages/DashboardPage.tsx"), "utf8");

    expect(dashboard).toContain("Workspace access is being prepared.");
    expect(dashboard).toContain("Open Seller Studio guide");
    expect(dashboard).toContain("protected V3 account and role migration is independently verified");
    expect(dashboard).toContain("does not open an older profile, order, seller, payment, or operations system");
    expect(dashboard).not.toMatch(/trpc\.marketplace\./);
    expect(dashboard).not.toContain("VendorProductForm");
    expect(dashboard).not.toContain("AdminOperationsPanel");
  });

  it("provides a user-controlled no-tracking public market share prompt", () => {
    const home = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");
    const sharePrompt = readFileSync(resolve(projectRoot, "client/src/components/MtaaSharePrompt.tsx"), "utf8");

    expect(home).toContain("<MtaaSharePrompt />");
    expect(sharePrompt).toContain("navigator.share");
    expect(sharePrompt).toContain("navigator.clipboard?.writeText");
    expect(sharePrompt).toContain("We do not add tracking or send a message on your behalf.");
    expect(sharePrompt).toContain('role="status"');
    expect(sharePrompt).not.toMatch(/(?:fetch|axios|analytics|pixel|advertis)/i);
  });

  it("publishes public-only crawl guidance while excluding protected and account-action routes", () => {
    const robots = readFileSync(resolve(projectRoot, "client/public/robots.txt"), "utf8");
    const sitemap = readFileSync(resolve(projectRoot, "client/public/sitemap.xml"), "utf8");

    expect(robots).toContain("Sitemap: https://siayaonlinemarket.vercel.app/sitemap.xml");
    expect(robots).toContain("Disallow: /dashboard");
    expect(robots).toContain("Disallow: /cart");
    expect(robots).toContain("Disallow: /auth/callback");
    expect(robots).toContain("Disallow: /auth/reset-password");
    expect(sitemap).toContain("https://siayaonlinemarket.vercel.app/");
    expect(sitemap).toContain("https://siayaonlinemarket.vercel.app/vendor");
    expect(sitemap).toContain("https://siayaonlinemarket.vercel.app/privacy");
    expect(sitemap).not.toContain("/dashboard");
    expect(sitemap).not.toContain("/cart");
    expect(sitemap).not.toContain("/auth/");
  });

  it("does not expose a Request Desk AI action that relies on the pending protected account migration", () => {
    const requestDesk = readFileSync(resolve(projectRoot, "client/src/pages/RequestDeskPage.tsx"), "utf8");

    expect(requestDesk).not.toContain("draftItemRequest.useMutation");
    expect(requestDesk).not.toContain("Use AI to organise these facts");
    expect(requestDesk).toContain("Before you send:");
    expect(requestDesk).toContain("MtaaMarket will review every request manually.");
  });

  it("keeps launch-stage seller and catalogue messaging truthful while the first listings are being prepared", () => {
    const home = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");

    expect(home).toContain("as owner-reviewed listings are added");
    expect(home).toContain("Owner-reviewed local market");
    expect(home).toContain("Built for Siaya buyers and sellers");
    expect(home).toContain("Search current listings or use the Request Desk");
    expect(home).toContain("Search physical products, livestock, accessories, home items and more");
    expect(home).toContain("Tell MtaaMarket what you need and we will begin with a managed request");
    expect(home).toContain("Ask MtaaMarket for this item");
    expect(home).toContain("Shop local categories");
    expect(home).toContain("Swipe to explore");
    expect(home).toContain('aria-label="Browse local product categories"');
    expect(home).toContain("aria-pressed={!category}");
    expect(home).not.toContain("Many approved local sellers");
    expect(home).not.toContain("Sellers serve Siaya buyers");
  });

  it("offers a public owner-managed assisted-sourcing guide without activating supplier or payment actions", () => {
    const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
    const layout = readFileSync(resolve(projectRoot, "client/src/components/MarketplaceLayout.tsx"), "utf8");
    const home = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");
    const guide = readFileSync(resolve(projectRoot, "client/src/pages/AssistedSourcingPage.tsx"), "utf8");

    expect(app).toContain('lazy(() => import("./pages/AssistedSourcingPage"))');
    expect(app).toContain('path={"/how-it-works"}');
    expect(layout).toContain('href="/how-it-works"');
    expect(home).toContain('href="/how-it-works"');
    expect(guide).toContain("MtaaMarket checks possible routes");
    expect(guide).toContain("Before any payment instruction");
    expect(guide).toContain("No automatic supplier purchase");
    expect(guide).toContain("No affiliation claim.");
    expect(guide).toContain("No copied catalogue content.");
    expect(guide).toContain("No automatic checkout.");
    expect(guide).not.toMatch(/(?:fetch\(|axios|invokeLLM|signIn|checkout\()/);
  });

  it("uses hydration-safe semantic list markup for assisted-sourcing boundaries", () => {
    const guide = readFileSync(resolve(projectRoot, "client/src/pages/AssistedSourcingPage.tsx"), "utf8");
    const styles = readFileSync(resolve(projectRoot, "client/src/index.css"), "utf8");

    expect(guide).toContain('<ul className="guide-boundary-list">');
    expect(guide).toContain("<li><span><ShieldCheck size={16} /></span><div>");
    expect(guide).not.toContain("<p><span><ShieldCheck size={16} /></span><div>");
    expect(styles).toContain(".guide-boundary-list li{");
    expect(styles).toContain(".guide-boundary-list li>div{min-width:0}");
  });

  it("keeps the public Request Desk separate from any future supplier-sourced collection", () => {
    const requestDesk = readFileSync(resolve(projectRoot, "client/src/pages/RequestDeskPage.tsx"), "utf8");

    expect(requestDesk).toContain("MtaaMarket checks a real route.");
    expect(requestDesk).toContain("availability, the actual hand-off route, and payment timing");
    expect(requestDesk).not.toContain("separate external route");
    expect(requestDesk).not.toContain("source route, availability");
    expect(requestDesk).not.toMatch(/(?:fetch\(|axios|invokeLLM|checkout\()/);
  });

  it("keeps the Siaya hub and payment choices as confirmation-gated basket preferences", () => {
    const cart = readFileSync(resolve(projectRoot, "client/src/pages/CartPage.tsx"), "utf8");

    expect(cart).toContain("Pickup Location: G4S / Jumia Hub, Siaya Town CBD");
    expect(cart).toContain("Pay via M-Pesa");
    expect(cart).toContain("Pay on Pickup at Siaya Hub");
    expect(cart).toContain("MtaaMarket does not collect payment from this basket");
    expect(cart).not.toMatch(/\.from\("orders"\)|insert\(.*orders/i);
  });

  it("uses the server-authorized V3 hub-order contract rather than a direct client database write", () => {
    const router = readFileSync(resolve(projectRoot, "server/routers.ts"), "utf8");
    const orders = readFileSync(resolve(projectRoot, "server/v3-orders.ts"), "utf8");
    const detail = readFileSync(resolve(projectRoot, "client/src/pages/ProductDetail.tsx"), "utf8");
    const profiles = readFileSync(resolve(projectRoot, "server/v3-profiles.ts"), "utf8");

    expect(router).toContain("createV3HubOrder");
    expect(router).toContain("v3BuyerOrderAccess");
    expect(router).toContain("saveV3BuyerOrderProfile");
    expect(router).toContain("ctx.supabaseIdentity");
    expect(orders).toContain('payment_status: "PENDING"');
    expect(orders).toContain("randomInt(0, 10_000)");
    expect(orders).toContain('eq("buyer_phone", buyer.phone_number)');
    expect(orders).toContain('in("order_status", ["PENDING_DROPOFF", "RECEIVED_AT_HUB"])');
    expect(profiles).toContain("normalizedKenyanPhone");
    expect(profiles).toContain("normalizedBuyerName");
    expect(orders).toContain("buyer?.full_name");
    expect(detail).toContain("Confirm Order for Hub Pickup");
    expect(detail).toContain("Save pickup details & continue");
    expect(detail).toContain("Your Siaya Hub Pickup PIN is:");
    expect(detail).not.toContain("confirmV3Order.mutate({ productId: product.id, buyerPhone");
    expect(detail).not.toMatch(/\.from\("orders"\)|insert\(.*orders/i);
  });

  it("keeps V3 product moderation behind a server-side owner role check", () => {
    const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
    const admin = readFileSync(resolve(projectRoot, "client/src/pages/Admin.tsx"), "utf8");
    const moderation = readFileSync(resolve(projectRoot, "server/v3-moderation.ts"), "utf8");
    const profiles = readFileSync(resolve(projectRoot, "server/v3-profiles.ts"), "utf8");

    expect(app).toContain('path={"/admin"}');
    expect(admin).toContain("v3ModerationProducts.useQuery");
    expect(admin).toContain("Approve");
    expect(admin).toContain("Reject");
    expect(moderation).toContain('import { requireV3Owner } from "./v3-profiles"');
    expect(profiles).toContain('data?.role !== "admin"');
    expect(moderation).toContain('in("status", ["PENDING", "ACTIVE", "FLAGGED"])');
    expect(moderation).toContain('status: "ACTIVE" | "REJECTED" | "FLAGGED"');
    expect(moderation).toContain("deleteV3Product");
    expect(admin).not.toMatch(/\.from\("products"\)|\.update\(/);
  });

  it("keeps poultry and livestock listings owner-reviewed and outside the automated hub-order path", () => {
    const vendorUpload = readFileSync(resolve(projectRoot, "client/src/pages/VendorUpload.tsx"), "utf8");
    const admin = readFileSync(resolve(projectRoot, "client/src/pages/Admin.tsx"), "utf8");
    const vendor = readFileSync(resolve(projectRoot, "server/v3-vendor.ts"), "utf8");
    const orders = readFileSync(resolve(projectRoot, "server/v3-orders.ts"), "utf8");

    expect(vendorUpload).toContain("livestockWelfareAttested");
    expect(vendorUpload).toContain("livestockMovementAcknowledged");
    expect(admin).toContain("Manual handover only.");
    expect(vendor).toContain('categorySlug === "poultry-livestock"');
    expect(vendor).toContain("Poultry and livestock listings must use manual MtaaMarket handover confirmation");
    expect(orders).toContain("Poultry and livestock handovers require MtaaMarket confirmation");
  });

  it("keeps a conservative vendor-chunk strategy for public performance", () => {
    const config = readFileSync(resolve(projectRoot, "vite.config.ts"), "utf8");

    expect(config).toContain("manualChunks(id: string)");
    expect(config).toContain('return "react-vendor"');
    expect(config).toContain('return "data-vendor"');
    expect(config).toContain('return "ui-vendor"');
  });
});
