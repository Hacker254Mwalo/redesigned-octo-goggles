# MtaaMarket Authentication Decision — 27 August 2026

## Decision

**Keep Supabase Auth as MtaaMarket’s authentication provider.** The marketplace already verifies Supabase JWTs on its Express/tRPC server and binds protected buyer, vendor, and owner profiles to Supabase UUIDs. Introducing Clerk now would require a third-party-auth integration in Supabase, new JWT/RLS design, server-token verification changes, migration handling for existing Supabase identities, and a second provider account. That adds operational surface without solving a requirement that Supabase’s existing email OTP flow already supports.

## Verified capability comparison

| Need | Supabase Auth | Clerk | MtaaMarket decision |
| --- | --- | --- | --- |
| Six-digit passwordless email code | Uses `signInWithOtp`, then `verifyOtp` with email, code, and type `email`; Magic Link versus OTP is determined by the hosted **Magic link or OTP** email template. [1] | Email verification codes and password support are included in the current free offering. [2] | Use the existing Supabase OTP path. |
| Password sign-up confirmation code | Existing password flow is usable, but its confirmation template/verification type requires a dedicated code-UI design before conversion. | Clerk documents a dedicated password-signup code flow. [3] | Do not claim password signup is code-complete until its separate Supabase flow is designed and tested. |
| Password reset | Existing recovery link is a distinct secure recovery mechanism. | Available, but would introduce a second account stack. | Preserve the current recovery route until a scoped recovery-code flow is tested. |
| Existing V3 roles and profile UUIDs | Native identity source for the server’s current JWKS verification and V3 profiles. | Requires Clerk’s Supabase third-party-auth configuration, Clerk session role claim, and revised RLS/token handling. [4] [5] | Do not migrate now. |
| Zero-cost launch fit | Current Free plan lists up to 50,000 MAUs and includes custom SMTP; projects may pause after one inactive week. [6] | Current Hobby plan lists 50,000 monthly retained users and email codes, but custom email templates are not included. [2] | Avoid duplicate provider setup and retain the deployed SMTP/auth configuration. |

## Implemented direction

The hosted Supabase **Magic link or OTP**, **Confirm sign up**, and **Reset password** templates were changed from confirmation URLs to distinct code-only bodies using `{{ .Token }}`. The browser account dialog is password-first for returning users; it uses code entry only after a new password account is created and for a password-recovery request. The resulting code states include an email-dispatch cooldown, resend path, generic failure handling, and Spam/Junk guidance without promising inbox placement.

> A six-digit code is an authentication secret. Users should enter it only in the MtaaMarket account window and should never send it to support, vendors, or the owner.

No Clerk project, Clerk key, provider migration, SMS, Google OAuth change, new account, or customer data transfer was created by this decision. A real end-to-end signup or recovery verification remains a founder-controlled browser test; no account, email code, password, or recovery action was submitted as part of the implementation review.

## Low-friction repeat-account safeguards

MtaaMarket does not add a CAPTCHA, ID check, or phone requirement to normal browsing and password sign-in. Supabase already limits signup-confirmation and password-recovery email requests to a 60-second window for the same user, and applies verification request limits by IP address.[7] The customer interface preserves that cooldown and uses generic account-failure wording to avoid revealing whether an email address is registered.

For the stronger controlled hub-pickup action only, one canonical Kenyan contact number may belong to one verified buyer profile. PostgreSQL’s existing unique phone constraint is enforced through the server-side UUID-bound profile operation. A duplicate contact attempt returns a general instruction to use the already-linked account or contact MtaaMarket support; it does not reveal the other account’s name, email, or identifier. This discourages duplicate buyer identities at the point where a private fulfilment contact becomes necessary, while leaving ordinary local shopping simple.

> CAPTCHA is deferred rather than silently enabled. Supabase supports CAPTCHA for sign-up, sign-in, and recovery, but it would add an external bot-check experience and new configuration. MtaaMarket can enable it only after abuse evidence and a founder-approved provider configuration justify that additional friction.[8]

## References

[1]: https://supabase.com/docs/guides/auth/auth-email-passwordless "Supabase — Passwordless email logins"

[2]: https://clerk.com/pricing "Clerk — Pricing"

[3]: https://clerk.com/docs/guides/development/custom-flows/authentication/email-password "Clerk — Custom email/password authentication flow"

[4]: https://clerk.com/docs/guides/development/integrations/databases/supabase "Clerk — Integrate Supabase with Clerk"

[5]: https://supabase.com/docs/guides/auth/third-party/clerk "Supabase — Clerk third-party authentication"

[6]: https://supabase.com/pricing "Supabase — Pricing"

[7]: https://supabase.com/docs/guides/auth/rate-limits "Supabase — Auth rate limits"

[8]: https://supabase.com/docs/guides/auth/auth-captcha "Supabase — CAPTCHA protection"
