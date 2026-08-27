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

## References

[1]: https://supabase.com/docs/guides/auth/auth-email-passwordless "Supabase — Passwordless email logins"

[2]: https://clerk.com/pricing "Clerk — Pricing"

[3]: https://clerk.com/docs/guides/development/custom-flows/authentication/email-password "Clerk — Custom email/password authentication flow"

[4]: https://clerk.com/docs/guides/development/integrations/databases/supabase "Clerk — Integrate Supabase with Clerk"

[5]: https://supabase.com/docs/guides/auth/third-party/clerk "Supabase — Clerk third-party authentication"

[6]: https://supabase.com/pricing "Supabase — Pricing"
