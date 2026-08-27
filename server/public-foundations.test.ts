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

  it("distinguishes the public Seller Studio guide from the protected legacy workspace", () => {
    const dashboard = readFileSync(resolve(projectRoot, "client/src/pages/DashboardPage.tsx"), "utf8");

    expect(dashboard).toContain("Workspace access is being prepared.");
    expect(dashboard).toContain("Open Seller Studio guide");
    expect(dashboard).toContain("protected account and role migration is complete");
    expect(dashboard).not.toContain("Sign in to manage orders and listings.");
  });

  it("keeps a conservative vendor-chunk strategy for public performance", () => {
    const config = readFileSync(resolve(projectRoot, "vite.config.ts"), "utf8");

    expect(config).toContain("manualChunks(id: string)");
    expect(config).toContain('return "react-vendor"');
    expect(config).toContain('return "data-vendor"');
    expect(config).toContain('return "ui-vendor"');
  });
});
