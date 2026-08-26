import type { Express, Request, Response } from "express";
import { getMarketplaceEnvironment } from "./marketplace-config";
import { processDarajaCallback } from "./payments";

export function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index++) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

export function registerPaymentRoutes(app: Express) {
  app.post("/api/payments/daraja-callback", async (req: Request, res: Response) => {
    const configuredSecret = getMarketplaceEnvironment().mpesaCallbackSecret;
    const suppliedToken = typeof req.query.token === "string" ? req.query.token : "";
    if (!configuredSecret) return res.status(503).json({ accepted: false, error: "payment_callback_not_configured" });
    if (!safeEqual(suppliedToken, configuredSecret)) return res.status(401).json({ accepted: false, error: "invalid_callback_token" });
    try {
      const result = await processDarajaCallback(req.body);
      return res.status(200).json(result);
    } catch (error) {
      console.error("[M-Pesa callback]", error);
      return res.status(400).json({ accepted: false, error: "invalid_callback_payload" });
    }
  });
}
