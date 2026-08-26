import "dotenv/config";
import { createMarketplaceApp } from "../server/_core/app";

// Build entry for the Vercel API bundle. It keeps the Express application and
// its shared marketplace routes in one serverless-compatible module.
export default createMarketplaceApp();
