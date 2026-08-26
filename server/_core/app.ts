import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerPaymentRoutes } from "../payment-routes";
import { registerScheduledRoutes } from "../scheduled-routes";

/**
 * Creates the API application without binding a port.
 * Local Manus hosting attaches Vite/static serving in index.ts; Vercel imports
 * this app as an API function while its CDN serves the Vite build separately.
 */
export function createMarketplaceApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerPaymentRoutes(app);
  registerScheduledRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );
  return app;
}
