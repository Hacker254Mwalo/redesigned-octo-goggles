export type EmailCodePurpose = "account verification" | "password recovery";

export function emailCodeDeliveryNotice(purpose: EmailCodePurpose): string {
  return `We sent a six-digit MtaaMarket ${purpose} code to your email. Check your inbox, then check Spam or Junk if it is not visible after a few minutes. Enter the code only in this MtaaMarket account window. If it still does not arrive, use Send another code.`;
}
