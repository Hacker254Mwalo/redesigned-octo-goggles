import type { Express, Request, Response } from "express";
import { releaseEligibleEscrowOrders } from "./marketplace-operations";
import { sdk } from "./_core/sdk";

/**
 * Heartbeat-only endpoint. A production schedule can be created only after the
 * deployed callback URL is available; the release operation itself is idempotent.
 */
export function registerScheduledRoutes(app: Express) {
  app.post("/api/scheduled/release-escrow", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron_only" });
      const result = await releaseEligibleEscrowOrders();
      return res.json({ ok: true, taskUid: user.taskUid, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown scheduled-release error";
      console.error("[Escrow release schedule]", error);
      return res.status(500).json({ error: message, timestamp: new Date().toISOString(), context: { path: req.path } });
    }
  });
}
