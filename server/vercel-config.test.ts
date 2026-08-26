import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Vercel deployment configuration", () => {
  it("publishes the Vite storefront while reserving /api for the Express function", () => {
    const config = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
    expect(config).toMatchObject({ framework: "vite", buildCommand: "pnpm run build:vercel", outputDirectory: "dist/public" });
    expect(config.rewrites).toContainEqual({ source: "/api/:path*", destination: "/api/[...path]" });
    expect(config.rewrites).toContainEqual({ source: "/:path((?!api(?:/|$)).*)", destination: "/index.html" });
    expect(fs.existsSync(path.join(root, "api", "[...path].ts"))).toBe(true);
  });

  it("exports the marketplace API without starting a second web server", () => {
    const functionSource = fs.readFileSync(path.join(root, "api", "[...path].ts"), "utf8");
    expect(functionSource).toContain("export default createMarketplaceApp()");
    expect(functionSource).not.toContain("listen(");
  });
});
