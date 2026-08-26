import { build } from "esbuild";

await build({
  entryPoints: ["api/marketplace-function.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outfile: "api/_bundle.mjs",
});
