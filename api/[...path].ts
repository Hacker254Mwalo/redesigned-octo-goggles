import "dotenv/config";
import { createMarketplaceApp } from "../server/_core/app";

// Vercel imports this Express app as one serverless API function for /api/*.
// The Vite storefront is published from dist/public by vercel.json.
export default createMarketplaceApp();
