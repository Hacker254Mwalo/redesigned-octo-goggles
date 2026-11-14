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
      name: "Siaya Mtaa Market",
      display: "standalone",
      start_url: "/",
    });
    expect(manifest).not.toHaveProperty("icons");
  });

  it("uses truthful Siaya-focused public metadata without disabling browser zoom", () => {
    const head = readFileSync(resolve(projectRoot, "client/index.html"), "utf8");
    const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
    const productDetail = readFileSync(resolve(projectRoot, "client/src/pages/ProductDetail.tsx"), "utf8");
    const layout = readFileSync(resolve(projectRoot, "client/src/components/MarketplaceLayout.tsx"), "utf8");
    const sharePrompt = readFileSync(resolve(projectRoot, "client/src/components/MtaaSharePrompt.tsx"), "utf8");
    const privacy = readFileSync(resolve(projectRoot, "client/src/pages/PrivacyPage.tsx"), "utf8");
    const vendorProductForm = readFileSync(resolve(projectRoot, "client/src/components/VendorProductForm.tsx"), "utf8");

    const jsonLdMatch = head.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
    expect(jsonLdMatch).not.toBeNull();
    const jsonLd = JSON.parse(jsonLdMatch?.[1] ?? "{}") as {
      "@graph": Array<{ "@type": string; [key: string]: unknown }>;
    };
    const organization = jsonLd["@graph"].find(entity => entity["@type"] === "Organization");
    const website = jsonLd["@graph"].find(entity => entity["@type"] === "WebSite");

    expect(organization).toMatchObject({
      name: "Siaya Mtaa Market",
      alternateName: "MtaaMarket",
      url: "https://www.siayaonlinemarket.online/",
      areaServed: [
        "Siaya town, Siaya County, Kenya",
        "Bondo, Siaya County, Kenya",
        "Ugunja, Siaya County, Kenya",
        "Yala, Siaya County, Kenya",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Orders via WhatsApp",
        url: "https://wa.me/254707976424",
      },
    });
    expect(organization).not.toHaveProperty("sameAs");
    expect(website).toMatchObject({
      name: "Siaya Mtaa Market",
      alternateName: "MtaaMarket",
      publisher: { "@id": "https://www.siayaonlinemarket.online/#organization" },
    });
    expect(head).toContain("Siaya Mtaa Market — Buy local in Siaya, Bondo &amp; Ugunja");
    expect(head).toContain('property="og:description"');
    expect(head).toContain('name="description"');
    expect(head).toContain('name="robots" content="index,follow"');
    expect(head).toContain('rel="canonical" href="https://www.siayaonlinemarket.online/"');
    expect(head).toContain('property="og:type" content="website"');
    expect(head).toContain('name="keywords"');
    expect(head).toContain('property="og:site_name" content="Siaya Mtaa Market"');
    expect(head).toContain("Siaya town, Bondo, Ugunja and Yala");
    expect(head).toContain("tilapia, fresh vegetables, household goods");
    expect(head).toContain("Find what is listed.");
    expect(head).toContain("Confirm before you go ahead.");
    expect(head).not.toContain("maximum-scale=1");
    expect(app).not.toContain("Siaya Online Market");
    expect(app).toContain("Local products in Siaya | Siaya Mtaa Market");
    expect(productDetail).toContain("${product.title} | Siaya Mtaa Market");
    expect(productDetail).toContain('meta[property="og:url"]');
    expect(productDetail).toContain('meta[property="og:image"]');
    expect(layout).toContain('aria-label="Siaya Mtaa Market home"');
    expect(layout).not.toContain("Siaya Online");
    expect(sharePrompt).toContain('const shareTitle = "Siaya Mtaa Market"');
    expect(privacy).toContain("Kenyan mobile number you add");
    expect(privacy).not.toContain("buyer-only account preparation");
    expect(vendorProductForm).toContain("Listing is now live on Siaya Mtaa Market.");
  });

  it("uses the same real Google logo and accessible sign-in controls in both account flows", () => {
    const signup = readFileSync(resolve(projectRoot, "client/src/components/SignUpModal.tsx"), "utf8");
    const accountDialog = readFileSync(resolve(projectRoot, "client/src/components/MtaaAccountDialog.tsx"), "utf8");

    expect(signup).toContain("export function GoogleLogo()");
    expect(signup).toContain('fill="#4285F4"');
    expect(accountDialog).toContain('import { GoogleLogo, SignUpModal } from "./SignUpModal";');
    expect(accountDialog).toContain("<GoogleLogo />");
    expect(accountDialog).toContain('aria-label={showPassword ? "Hide password" : "Show password"}');
    expect(accountDialog).toContain('type="button" className="secondary-cta w-full justify-center" disabled={googleSubmitting}');
    expect(accountDialog).not.toContain('<span aria-hidden="true">G</span>');
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

    expect(layout).toContain('aria-current={isCurrent(href) ? "page" : undefined}');
    expect(layout).toContain('const isCurrent = (href: string) => href === "/" ? location === "/" : location.startsWith(href);');
    expect(layout).toContain('aria-expanded={open}');
    expect(layout).toContain('aria-controls="mtaa-market-mobile-menu"');
    expect(layout).toContain('id="mtaa-market-mobile-menu"');
    expect(layout).toContain('aria-label={open ? "Close navigation" : "Open navigation"}');
    expect(layout).toContain('event.key === "Escape"');
    expect(layout).toContain("window.addEventListener(\"keydown\", closeOnEscape)");
    expect(layout).toContain("setOpen(false);");
  });

  it("publishes a truthful privacy route and branded callback for public Google sign-in", () => {
    const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
    const layout = readFileSync(resolve(projectRoot, "client/src/components/MarketplaceLayout.tsx"), "utf8");
    const dialog = readFileSync(resolve(projectRoot, "client/src/components/MtaaAccountDialog.tsx"), "utf8");
    const privacy = readFileSync(resolve(projectRoot, "client/src/pages/PrivacyPage.tsx"), "utf8");
    const callback = readFileSync(resolve(projectRoot, "client/src/pages/SupabaseAuthCallbackPage.tsx"), "utf8");

    expect(app).toContain('path={"/privacy"}');
    expect(app).toContain('"/auth/callback": {');
    expect(app).toContain('title: "Secure sign-in | Siaya Mtaa Market"');
    expect(app).toContain('"/auth/reset-password": {');
    expect(app).toContain('title: "Reset your password | Siaya Mtaa Market"');
    expect(layout).toContain('href="/privacy"');
    expect(layout).toContain('href="/terms"');
    expect(dialog).toContain("How account data is used");
    expect(privacy).toContain("Google sign-in");
    expect(privacy).toContain("does not request access to your Google Drive");
    expect(privacy).toContain("role-scoped buyer and seller tools");
    expect(privacy).toContain("Signing in alone does not place an order or take payment");
    expect(callback).toContain("Siaya Mtaa Market secure sign-in");
    expect(callback).not.toContain("You are signed in with email.");
  });

  it("publishes clear order and sourcing terms and links them from signup", () => {
    const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
    const terms = readFileSync(resolve(projectRoot, "client/src/pages/TermsPage.tsx"), "utf8");
    const signup = readFileSync(resolve(projectRoot, "client/src/components/SignUpModal.tsx"), "utf8");
    const sitemap = readFileSync(resolve(projectRoot, "client/public/sitemap.xml"), "utf8");

    expect(app).toContain('path={"/terms"} component={TermsPage}');
    expect(app).toContain('"/terms": {');
    expect(signup).toContain('href="/terms">Terms</Link>');
    expect(sitemap).toContain("https://www.siayaonlinemarket.online/terms");
    expect(terms).toContain("does not mean availability or a collection point has been confirmed");
    expect(terms).toContain("clearly disclosed sourcing or handling margin");
    expect(terms).toContain("Nothing in these terms excludes responsibility that cannot lawfully be excluded");
    expect(terms).toContain("We are not affiliated with Jumia");
  });

  it("keeps the dashboard on the unified V3 founder workspace without invoking legacy operations panels", () => {
    const dashboard = readFileSync(resolve(projectRoot, "client/src/pages/DashboardPage.tsx"), "utf8");

    expect(dashboard).toContain("Everything in one place.");
    expect(dashboard).toContain("Request an item");
    expect(dashboard).toContain("Seller Studio");
    expect(dashboard).toContain("Owner console");
    expect(dashboard).toContain("trpc.marketplace.v3VendorAccess.useQuery");
    expect(dashboard).not.toContain("VendorProductForm");
    expect(dashboard).not.toContain("AdminOperationsPanel");
  });

  it("provides a user-controlled no-tracking public market share prompt", () => {
    const home = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");
    const sharePrompt = readFileSync(resolve(projectRoot, "client/src/components/MtaaSharePrompt.tsx"), "utf8");

    expect(home).toContain("<MtaaSharePrompt />");
    expect(sharePrompt).toContain("navigator.share");
    expect(sharePrompt).toContain("navigator.clipboard?.writeText");
    expect(sharePrompt).toContain("Only the public market link is shared.");
    expect(sharePrompt).toContain('role="status"');
    expect(sharePrompt).not.toMatch(/(?:fetch|axios|analytics|pixel|advertis)/i);
  });

  it("publishes public-only crawl guidance while excluding protected and account-action routes", () => {
    const robots = readFileSync(resolve(projectRoot, "client/public/robots.txt"), "utf8");
    const sitemap = readFileSync(resolve(projectRoot, "client/public/sitemap.xml"), "utf8");

    expect(robots).toContain("Sitemap: https://www.siayaonlinemarket.online/sitemap.xml");
    expect(robots).toContain("Disallow: /dashboard");
    expect(robots).toContain("Disallow: /cart");
    expect(robots).toContain("Disallow: /auth/callback");
    expect(robots).toContain("Disallow: /auth/reset-password");
    expect(sitemap).toContain("https://www.siayaonlinemarket.online/");
    expect(sitemap).toContain("https://www.siayaonlinemarket.online/vendor");
    expect(sitemap).toContain("https://www.siayaonlinemarket.online/privacy");
    expect(sitemap).toContain("https://www.siayaonlinemarket.online/stations");
    expect(sitemap).not.toContain("/jumia");
    expect(sitemap).not.toContain("/dashboard");
    expect(sitemap).not.toContain("/cart");
    expect(sitemap).not.toContain("/auth/");
  });

  it("keeps the retailer-neutral marketplace route out of search results without blocking crawlers", () => {
    const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
    const vercel = readFileSync(resolve(projectRoot, "vercel.json"), "utf8");
    const vercelConfig = JSON.parse(vercel);
    const robots = readFileSync(resolve(projectRoot, "client/public/robots.txt"), "utf8");
    const catalog = readFileSync(resolve(projectRoot, "client/src/pages/JumiaStorePage.tsx"), "utf8");

    expect(app).toContain('path={"/marketplace"} component={JumiaStorePage}');
    expect(app).toContain('path={"/jumia"} component={LegacyCatalogueRedirect}');
    expect(app).toContain('"/marketplace": {');
    expect(app).toContain("index: false");
    expect(vercel).toContain('"source": "/marketplace/:path*"');
    expect(vercel).toContain('"source": "/jumia/:path*"');
    expect(vercelConfig.redirects).toContainEqual({ source: "/jumia", destination: "/marketplace", permanent: true });
    expect(vercelConfig.redirects).toContainEqual({ source: "/jumia/:path*", destination: "/marketplace/:path*", permanent: true });
    expect(vercel).toContain('"key": "X-Robots-Tag"');
    expect(vercel).toContain('"value": "noindex, follow"');
    expect(robots).not.toContain("Disallow: /jumia");
    expect(catalog).toContain('label: "Mattresses"');
    expect(catalog).toContain('label: "Fridges"');
    expect(catalog).toContain('label: "Freezers"');
    expect(catalog).toContain('label: "Gas cookers"');
    expect(catalog).toContain('label: "Power banks"');
    expect(catalog).toContain('label: "Solar panels & kits"');
    expect(catalog).toContain('label: "Furniture"');
    expect(catalog).toContain("Seen online");
    expect(catalog).toContain("We confirm the item and final total before payment.");
    expect(catalog).toContain("We’ll confirm availability and collection or delivery details before payment.");
    expect(catalog).toContain("catalog-image-fallback");
    expect(catalog).not.toContain("View retailer details");
    expect(catalog).not.toContain("catalog-source-link");
    expect(catalog).toContain("staleTime: 5 * 60_000");
    expect(catalog).toContain("localStorage.setItem(BASKET_STORAGE_KEY");
    expect(catalog).toContain("onAdd={addResult}");
    expect(catalog).toContain("changeQuantity(index");
    expect(catalog).toContain("referrerPolicy=\"no-referrer\"");
    expect(catalog).not.toContain("JumiaGoogleSearch");
    expect(catalog).not.toContain('label: "Shoes"');
    expect(catalog).not.toContain('label: "Smartwatches"');
  });

  it("does not expose a Request Desk AI action that relies on the pending protected account migration", () => {
    const requestDesk = readFileSync(resolve(projectRoot, "client/src/pages/RequestDeskPage.tsx"), "utf8");

    expect(requestDesk).not.toContain("draftItemRequest.useMutation");
    expect(requestDesk).not.toContain("Use AI to organise these facts");
    expect(requestDesk).toContain("Before you send:");
    expect(requestDesk).toContain("Clear details help us return a useful answer.");
    expect(requestDesk).not.toMatch(/(?:Jumia|JForce|founder)/i);
  });

  it("keeps Request Desk on the Supabase account dialog and V3 request path without collecting a phone or entering the legacy workspace", () => {
    const requestDesk = readFileSync(resolve(projectRoot, "client/src/pages/RequestDeskPage.tsx"), "utf8");
    const v3Requests = readFileSync(resolve(projectRoot, "server/v3-requests.ts"), "utf8");

    expect(requestDesk).toContain("useSupabaseAuth");
    expect(requestDesk).toContain("MtaaAccountDialog");
    expect(requestDesk).toContain("createV3ItemRequest");
    expect(requestDesk).not.toContain("@/_core/hooks/useAuth");
    expect(requestDesk).not.toContain("startLogin");
    expect(requestDesk).not.toContain("marketplace.createItemRequest");
    expect(requestDesk).not.toContain('setLocation("/dashboard")');
    expect(v3Requests).toContain('from("item_requests")');
    expect(v3Requests).toContain("customer_phone: null");
    expect(v3Requests).toContain('source_route: "external_marketplace"');
    expect(v3Requests).not.toContain("delivery_fee");
  });

  it("keeps the public Seller Studio entry on the Supabase account handoff and V3 upload route", () => {
    const vendorPage = readFileSync(resolve(projectRoot, "client/src/pages/VendorPage.tsx"), "utf8");

    expect(vendorPage).toContain("useSupabaseAuth");
    expect(vendorPage).toContain("MtaaAccountDialog");
    expect(vendorPage).toContain('setLocation("/vendor/upload")');
    expect(vendorPage).toContain("Start as a seller");
    expect(vendorPage).not.toContain("@/_core/hooks/useAuth");
    expect(vendorPage).not.toContain("startLogin");
    expect(vendorPage).not.toContain('setLocation("/dashboard")');
  });

  it("puts real local listings and popular categories ahead of catalogue explanations", () => {
    const home = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");

    expect(home).toContain("From Siaya sellers");
    expect(home).toContain("Shop by category");
    expect(home).toContain("Search local listings");
    expect(home).toContain("Good finds, close to home.");
    expect(home).toContain("/marketplace?item=");
    expect(home).toContain('aria-label="Filter local products by category"');
    expect(home).toContain("aria-pressed={!category}");
    expect(home).not.toContain("Many approved local sellers");
    expect(home).not.toContain("Sellers serve Siaya buyers");
  });

  it("offers a public shopping guide without exposing internal operations", () => {
    const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
    const layout = readFileSync(resolve(projectRoot, "client/src/components/MarketplaceLayout.tsx"), "utf8");
    const home = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");
    const guide = readFileSync(resolve(projectRoot, "client/src/pages/AssistedSourcingPage.tsx"), "utf8");

    expect(app).toContain('lazy(() => import("./pages/AssistedSourcingPage"))');
    expect(app).toContain('path={"/how-it-works"}');
    expect(layout).not.toContain('href="/how-it-works"');
    expect(home).not.toContain('href="/how-it-works"');
    expect(guide).toContain("Shopping in Siaya");
    expect(guide).toContain("Browse the market");
    expect(guide).toContain("One place for local shopping.");
    expect(guide).not.toMatch(/(?:founder|JForce|assisted sourcing|payment before|approval|fetch\(|axios|invokeLLM|signIn|checkout\()/i);
  });

  it("uses hydration-safe semantic markup for the shopping guide", () => {
    const guide = readFileSync(resolve(projectRoot, "client/src/pages/AssistedSourcingPage.tsx"), "utf8");
    const styles = readFileSync(resolve(projectRoot, "client/src/index.css"), "utf8");

    expect(guide).toContain('aria-label="How MtaaMarket shopping works"');
    expect(guide).toContain('number: "01"');
    expect(guide).not.toContain("guide-boundary-list");
    expect(styles).toContain(".guide-boundary-list li{");
    expect(styles).toContain(".guide-boundary-list li>div{min-width:0}");
  });

  it("keeps the public Request Desk separate from any future supplier-sourced collection", () => {
    const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
    const requestDesk = readFileSync(resolve(projectRoot, "client/src/pages/RequestDeskPage.tsx"), "utf8");

    expect(app).toContain('path={"/request"} component={RequestDeskPage}');
    expect(requestDesk).toContain("MtaaMarket checks the request");
    expect(requestDesk).toContain("How requesting works");
    expect(requestDesk).toContain("does not charge you");
    expect(requestDesk).not.toMatch(/(?:Jumia|JForce|founder|fetch\(|axios|invokeLLM|checkout\()/i);
  });

  it("keeps the Siaya pickup area as an order preference and takes no online payment", () => {
    const cart = readFileSync(resolve(projectRoot, "client/src/pages/CartPage.tsx"), "utf8");
    const detail = readFileSync(resolve(projectRoot, "client/src/pages/ProductDetail.tsx"), "utf8");

    expect(cart).toContain("Confirmed by MtaaMarket");
    expect(cart).toContain("Pay on collection after confirmation");
    expect(cart).not.toMatch(/G4S|Jumia Hub/);
    expect(detail).toContain("Preferred Siaya pickup area");
    expect(detail).toContain("No payment is collected here.");
    expect(detail).not.toMatch(/G4S|Jumia Hub/);
    expect(cart).toContain("Pay via M-Pesa");
    expect(cart).toContain("Pay on collection after confirmation");
    expect(cart).toContain("MtaaMarket does not collect payment from this basket");
    expect(cart).not.toMatch(/\.from\("orders"\)|insert\(.*orders/i);
  });

  it("links hub orders only to unique buyer profiles and removes browser role-write grants", () => {
    const orderLink = readFileSync(resolve(projectRoot, "supabase/migrations/20261112073645_v3_order_buyer_profile_link.sql"), "utf8");
    const roleHardening = readFileSync(resolve(projectRoot, "supabase/migrations/20261112073656_harden_legacy_marketplace_profile_roles.sql"), "utf8");

    expect(orderLink).toContain("REFERENCES public.profiles(id) ON DELETE SET NULL");
    expect(orderLink).toContain("HAVING COUNT(*) = 1");
    expect(roleHardening).toContain("REVOKE ALL PRIVILEGES ON TABLE public.marketplace_profiles FROM PUBLIC, anon, authenticated;");
    expect(roleHardening).toContain("GRANT SELECT ON TABLE public.marketplace_profiles TO authenticated;");
    expect(roleHardening).toContain('DROP POLICY IF EXISTS "profiles update self or admin"');
    expect(roleHardening).not.toMatch(/GRANT\s+(?:INSERT|UPDATE|DELETE).*marketplace_profiles/i);
  });

  it("uses the server-authorized V3 hub-order contract rather than a direct client database write", () => {
    const router = readFileSync(resolve(projectRoot, "server/routers.ts"), "utf8");
    const orders = readFileSync(resolve(projectRoot, "server/v3-orders.ts"), "utf8");
    const detail = readFileSync(resolve(projectRoot, "client/src/pages/ProductDetail.tsx"), "utf8");
    const profiles = readFileSync(resolve(projectRoot, "server/v3-profiles.ts"), "utf8");
    const orderReviewMigration = readFileSync(resolve(projectRoot, "supabase/migrations/20261113221200_v3_order_stock_review.sql"), "utf8");

    expect(router).toContain("createV3HubOrder");
    expect(router).toContain("v3BuyerOrderAccess");
    expect(router).toContain("saveV3BuyerOrderProfile");
    expect(router).toContain("ctx.supabaseIdentity");
    expect(orders).toContain('payment_status: "PENDING"');
    expect(orders).toContain("randomInt(0, 10_000)");
    expect(orders).toContain('eq("buyer_profile_id", identity.subject)');
    expect(orders).toContain("buyer_profile_id: identity.subject");
    expect(orders).toContain('in("order_status", ["PENDING_DROPOFF", "RECEIVED_AT_HUB"])');
    expect(profiles).toContain("normalizedKenyanPhone");
    expect(profiles).toContain("normalizedBuyerName");
    expect(orders).toContain("buyer?.full_name");
    expect(detail).toContain("Place order ·");
    expect(detail).toContain("Save collection details & continue");
    expect(detail).toContain("confirmV3Order.mutate({ productId: product.id, quantity, pickupPreference })");
    expect(orders).toContain('stock_review_status: "pending"');
    expect(orders).toContain('order.stock_review_status === "confirmed" ? order.pickup_pin : null');
    expect(orders).not.toContain("buyerPhone");
    expect(orderReviewMigration).toContain("FOR UPDATE");
    expect(orderReviewMigration).toContain("GRANT EXECUTE ON FUNCTION public.review_v3_order_stock(uuid, text, boolean) TO service_role");
    expect(orderReviewMigration).toContain("ADD COLUMN IF NOT EXISTS stock_review_status text NOT NULL DEFAULT 'confirmed'");
    expect(detail).not.toMatch(/\.from\("orders"\)|insert\(.*orders/i);
  });

  it("keeps Admin behind server-verified owner access and removes product moderation UI", () => {
    const app = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
    const admin = readFileSync(resolve(projectRoot, "client/src/pages/Admin.tsx"), "utf8");
    const moderation = readFileSync(resolve(projectRoot, "server/v3-moderation.ts"), "utf8");
    const profiles = readFileSync(resolve(projectRoot, "server/v3-profiles.ts"), "utf8");

    expect(app).toContain('path={"/admin"}');
    expect(admin).toContain("v3OwnerAccounts.useQuery");
    expect(admin).toContain("v3OwnerItemRequests.useQuery");
    expect(admin).toContain("Approve vendor");
    expect(admin).not.toContain("v3ModerationProducts.useQuery");
    expect(admin).not.toContain("moderateV3Product");
    expect(admin).not.toContain("deleteV3Product");
    expect(admin).not.toContain("Founder inventory intake");
    expect(admin).not.toContain("Moderation queue");
    expect(moderation).toContain('import { requireV3Owner } from "./v3-profiles"');
    expect(profiles).toContain('data?.role !== "admin"');
    expect(moderation).toContain('in("status", ["PENDING", "ACTIVE", "FLAGGED"])');
    expect(moderation).toContain('status: "ACTIVE" | "REJECTED" | "FLAGGED"');
    expect(moderation).toContain("deleteV3Product");
    expect(admin).not.toMatch(/\.from\("products"\)|\.update\(/);
  });

  it("keeps poultry and livestock listings on a manual handover path outside automated hub orders", () => {
    const vendorUpload = readFileSync(resolve(projectRoot, "client/src/pages/VendorUpload.tsx"), "utf8");
    const vendor = readFileSync(resolve(projectRoot, "server/v3-vendor.ts"), "utf8");
    const orders = readFileSync(resolve(projectRoot, "server/v3-orders.ts"), "utf8");

    expect(vendorUpload).toContain("livestockWelfareAttested");
    expect(vendorUpload).toContain("livestockMovementAcknowledged");
    expect(vendor).toContain('categorySlug === "poultry-livestock"');
    expect(vendor).toContain("Poultry and livestock listings must use manual MtaaMarket handover confirmation");
    expect(orders).toContain("Poultry and livestock handovers require manual MtaaMarket confirmation");
  });

  it("keeps a conservative vendor-chunk strategy for public performance", () => {
    const config = readFileSync(resolve(projectRoot, "vite.config.ts"), "utf8");

    expect(config).toContain("manualChunks(id: string)");
    expect(config).toContain('return "react-vendor"');
    expect(config).toContain('return "data-vendor"');
    expect(config).toContain('return "ui-vendor"');
  });
});
