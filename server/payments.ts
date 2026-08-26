import { and, eq } from "drizzle-orm";
import { orders } from "../drizzle/schema";
import { getDb } from "./db";
import { assertMpesaSandboxConfigured, getMarketplaceEnvironment } from "./marketplace-config";
import { normalizeKenyanPhone } from "./marketplace-operations";

type CallbackItem = { Name: string; Value?: string | number };
type DarajaCallback = { Body?: { stkCallback?: { MerchantRequestID?: string; CheckoutRequestID?: string; ResultCode?: number; ResultDesc?: string; CallbackMetadata?: { Item?: CallbackItem[] } } } };

function nairobiTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(date);
  const read = (type: string) => parts.find(part => part.type === type)?.value || "00";
  return `${read("year")}${read("month")}${read("day")}${read("hour")}${read("minute")}${read("second")}`;
}

export function isMpesaConfigured() {
  const config = getMarketplaceEnvironment();
  return Boolean(config.mpesaConsumerKey && config.mpesaConsumerSecret && config.mpesaPasskey && config.mpesaShortcode && config.mpesaCallbackUrl && config.mpesaCallbackSecret);
}

export async function initiateMpesaStkPush(profileId: number, orderId: number, phone: string) {
  const db = await getDb(); if (!db) throw new Error("Marketplace database is unavailable.");
  const order = (await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.buyerProfileId, profileId))).limit(1))[0]; if (!order) throw new Error("Order not found.");
  if (order.paymentStatus === "paid") throw new Error("This order is already paid.");
  const config = assertMpesaSandboxConfigured(); const paymentPhone = normalizeKenyanPhone(phone); const base = config.mpesaEnvironment === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
  const credential = Buffer.from(`${config.mpesaConsumerKey}:${config.mpesaConsumerSecret}`).toString("base64");
  const tokenResponse = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${credential}` } }); if (!tokenResponse.ok) throw new Error("Could not authenticate with the M-Pesa payment service.");
  const tokenData = await tokenResponse.json() as { access_token?: string }; if (!tokenData.access_token) throw new Error("M-Pesa access token was not returned.");
  const timestamp = nairobiTimestamp(); const password = Buffer.from(`${config.mpesaShortcode}${config.mpesaPasskey}${timestamp}`).toString("base64"); const callbackUrl = new URL(config.mpesaCallbackUrl!); callbackUrl.searchParams.set("token", config.mpesaCallbackSecret!);
  const paymentResponse = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, { method: "POST", headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ BusinessShortCode: config.mpesaShortcode, Password: password, Timestamp: timestamp, TransactionType: "CustomerPayBillOnline", Amount: Math.round(Number(order.totalAmount)), PartyA: paymentPhone, PartyB: config.mpesaShortcode, PhoneNumber: paymentPhone, CallBackURL: callbackUrl.toString(), AccountReference: order.orderNumber, TransactionDesc: `MtaaMarket order ${order.orderNumber}` }) });
  const data = await paymentResponse.json() as { ResponseCode?: string; CheckoutRequestID?: string; MerchantRequestID?: string; errorMessage?: string }; if (!paymentResponse.ok || data.ResponseCode !== "0" || !data.CheckoutRequestID) throw new Error(data.errorMessage || "M-Pesa could not start the payment prompt.");
  await db.update(orders).set({ paymentStatus: "initiated", paymentPhone, mpesaCheckoutRequestId: data.CheckoutRequestID, mpesaMerchantRequestId: data.MerchantRequestID || null }).where(eq(orders.id, order.id)); return { checkoutRequestId: data.CheckoutRequestID };
}

export async function processDarajaCallback(payload: DarajaCallback) {
  const callback = payload?.Body?.stkCallback; if (!callback?.CheckoutRequestID || typeof callback.ResultCode !== "number") throw new Error("Invalid M-Pesa callback payload.");
  const db = await getDb(); if (!db) throw new Error("Marketplace database is unavailable.");
  const order = (await db.select().from(orders).where(eq(orders.mpesaCheckoutRequestId, callback.CheckoutRequestID)).limit(1))[0]; if (!order) return { accepted: true, matched: false };
  if (order.paymentStatus === "paid") return { accepted: true, matched: true, duplicate: true };
  if (callback.ResultCode !== 0) { await db.update(orders).set({ paymentStatus: "failed" }).where(eq(orders.id, order.id)); return { accepted: true, matched: true, paid: false }; }
  const metadata = new Map((callback.CallbackMetadata?.Item || []).map(item => [item.Name, item.Value])); const receipt = metadata.get("MpesaReceiptNumber");
  await db.update(orders).set({ paymentStatus: "paid", status: "paid_escrow", mpesaReceiptNumber: typeof receipt === "string" ? receipt : null }).where(eq(orders.id, order.id));
  await db.insert((await import("../drizzle/schema")).orderEvents).values({ orderId: order.id, eventType: "payment_confirmed", fromStatus: order.status, toStatus: "paid_escrow", metadata: { checkoutRequestId: callback.CheckoutRequestID } });
  await db.insert((await import("../drizzle/schema")).notifications).values({ profileId: order.buyerProfileId, type: "payment", title: "Payment confirmed", body: `${order.orderNumber} is paid and safely held in escrow until pickup.`, orderId: order.id });
  if (order.vendorId) { const vendor = await db.select().from((await import("../drizzle/schema")).vendors).where(eq((await import("../drizzle/schema")).vendors.id, order.vendorId)).limit(1); if (vendor[0]) await db.insert((await import("../drizzle/schema")).notifications).values({ profileId: vendor[0].profileId, type: "payment", title: "Payment confirmed", body: `${order.orderNumber} is ready to prepare for pickup.`, orderId: order.id }); }
  return { accepted: true, matched: true, paid: true };
}
