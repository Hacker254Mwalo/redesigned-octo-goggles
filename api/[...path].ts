import marketplaceApp from "./_bundle.mjs";

// The Vercel build creates _bundle.mjs from the shared Express application.
// Importing the bundle prevents a serverless runtime from resolving source-only
// TypeScript modules that are not emitted beside this function.
export default marketplaceApp;
