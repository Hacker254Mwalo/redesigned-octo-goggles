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

  it("keeps a conservative vendor-chunk strategy for public performance", () => {
    const config = readFileSync(resolve(projectRoot, "vite.config.ts"), "utf8");

    expect(config).toContain("manualChunks(id: string)");
    expect(config).toContain('return "react-vendor"');
    expect(config).toContain('return "data-vendor"');
    expect(config).toContain('return "ui-vendor"');
  });
});
