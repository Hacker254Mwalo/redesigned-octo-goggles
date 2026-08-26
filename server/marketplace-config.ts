import { z } from "zod";

const optionalText = z.string().trim().min(1).optional();

const marketplaceEnvironmentSchema = z.object({
  mpesaEnvironment: z.enum(["sandbox", "production"]).default("sandbox"),
  mpesaConsumerKey: optionalText,
  mpesaConsumerSecret: optionalText,
  mpesaPasskey: optionalText,
  mpesaShortcode: optionalText,
  mpesaCallbackUrl: optionalText,
  mpesaCallbackSecret: optionalText,
  marketplaceBaseUrl: optionalText,
});

export type MarketplaceEnvironment = z.infer<typeof marketplaceEnvironmentSchema>;

export function getMarketplaceEnvironment(): MarketplaceEnvironment {
  return marketplaceEnvironmentSchema.parse({
    mpesaEnvironment: process.env.MPESA_ENVIRONMENT ?? "sandbox",
    mpesaConsumerKey: process.env.DARAJA_CONSUMER_KEY,
    mpesaConsumerSecret: process.env.DARAJA_CONSUMER_SECRET,
    mpesaPasskey: process.env.DARAJA_PASSKEY,
    mpesaShortcode: process.env.DARAJA_SHORTCODE,
    mpesaCallbackUrl: process.env.MPESA_CALLBACK_URL,
    mpesaCallbackSecret: process.env.MPESA_CALLBACK_SECRET,
    marketplaceBaseUrl: process.env.MARKETPLACE_BASE_URL,
  });
}

export function assertMpesaSandboxConfigured() {
  const config = getMarketplaceEnvironment();
  const required = [
    ["DARAJA_CONSUMER_KEY", config.mpesaConsumerKey],
    ["DARAJA_CONSUMER_SECRET", config.mpesaConsumerSecret],
    ["DARAJA_PASSKEY", config.mpesaPasskey],
    ["DARAJA_SHORTCODE", config.mpesaShortcode],
    ["MPESA_CALLBACK_URL", config.mpesaCallbackUrl],
    ["MPESA_CALLBACK_SECRET", config.mpesaCallbackSecret],
  ].filter(([, value]) => !value).map(([key]) => key);
  if (required.length) {
    throw new Error(`M-Pesa sandbox is not configured. Missing: ${required.join(", ")}.`);
  }
  return config;
}
