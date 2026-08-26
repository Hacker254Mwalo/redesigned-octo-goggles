# MtaaMarket Sign-in Options

## Decision for the next release

MtaaMarket will present two passwordless choices: **Google** and **email one-time code**. Both are safer and easier for a new marketplace than asking customers to remember a password. The code path should be the default fallback because it works for people who do not use Google, while Google can reduce inbox friction once its provider credentials are configured.

Neither option will unlock checkout, seller publishing, administration, payment, delivery, or live-animal activity. A successful sign-in creates only a lowest-privilege buyer identity until the separate UUID profile and role migration is complete.

| Option | What a customer sees | Required configuration | Current implementation position |
|---|---|---|---|
| Email one-time code | Enter email, receive a six-digit code, type it into MtaaMarket. | A Supabase Email OTP template containing `{{ .Token }}` and a tested sender configuration. | UI and verification step can be built now; template switch and sender activation require controlled configuration. |
| Google sign-in | A Continue with Google button and the Google consent screen. | Google Cloud OAuth client ID/secret, authorized MtaaMarket origin, Supabase Auth callback URI, and provider activation. | UI can be safely disabled until the founder adds real Google OAuth credentials. |
| Branded authentication email | A simple security email from a MtaaMarket sender address. | A verified domain or sending identity plus SMTP credentials in Supabase Auth. | Planned; do not claim a branded sender until domain/sender verification succeeds. |

## Why the sender cannot simply hide the provider

Supabase's default email service is intended for testing, limits delivery to pre-authorized team addresses, and is not a production sending service. A branded sender therefore requires custom SMTP or an approved email-sending service. The sender name can be **MtaaMarket**, but the From address must be one the service permits and the sending identity must be verified. [1]

> The recommended first template is short and transactional: **“Your MtaaMarket sign-in code is: 123456. It expires soon. Do not share it.”** It should contain no marketing language, customer details, product content, or extra links.

## Zero-cost SMTP options for the founder to choose

| Provider | Current official free position | Fit for MtaaMarket now | Important boundary |
|---|---|---|---|
| Brevo | Its free SMTP page states up to 300 emails per day with no credit card required. [4] | Recommended first option for a gradual local launch because it supports SMTP and provides room for code delivery tests. | The sender identity/domain still needs verification. A verified address can say **MtaaMarket** as its sender name, but it cannot pretend to use an unverified MtaaMarket domain. |
| MailerSend | Its published Free plan includes 500 emails per month and SMTP/API documentation. [5] | Suitable for a small invite-only launch if the founder prefers lower-volume, separate transactional mail. | Current signup details state the Free plan requires account approval and billing details; review that requirement before choosing it. |
| Resend | Its SMTP documentation requires an API key and a verified domain. [6] | Good after MtaaMarket owns a domain and can add DNS records. | It is not the simplest immediate path if no verified domain exists. |

**Recommendation:** Start with **Brevo Free**, using a verified sender identity and the display name **MtaaMarket**. When MtaaMarket later owns a custom domain, authenticate it with SPF, DKIM, and DMARC and move the From address to a dedicated address such as `no-reply@auth.example.com`. [1] This is an external account setup; the founder must create the account and supply SMTP credentials only through secure settings.

### Current MtaaMarket sender status

The founder-created Brevo Free workspace is named **Siaya Online MtaaMarket**, and its temporary MtaaMarket sender identity has been verified. Brevo marks the sender as a freemail address, which is acceptable only as a temporary low-volume sender and not a final brand identity. No SMTP/API credential has been created, saved, or exposed, and MtaaMarket has not sent any customer email through Brevo. Any additional provider verification shown at first-send time must be completed only in the relevant email-delivery flow, not through a separate calling product.

The provider's separate **Brevo Phone** product is not the required verification route for MtaaMarket email delivery and is excluded from this setup because it is a paid business-calling feature. A personal phone number is not entered into that product. Sender/domain verification and SMTP configuration remain the only relevant email-delivery steps.

The first temporary SMTP key generated during configuration was deliberately **not saved** in Supabase after the unsaved form was discarded. Brevo rejected the first revocation attempt. It remains inactive and permanently **do not use**; no MtaaMarket configuration points to it. Two further short-lived keys were generated during dashboard-session recovery but their unsaved Supabase forms were also deliberately discarded. The Supabase SMTP settings now show the custom-SMTP toggle enabled, the verified Brevo sender/relay values retained, no password displayed, and a disabled Save action—evidence that the final encrypted save completed. One guarded founder-approved magic-link request was accepted by the deployed MtaaMarket UI after this change. Brevo’s log page did not finish loading in the current browser session, so receipt and full session completion remain explicitly unverified; do not treat email authentication as production-ready yet. Earlier inactive keys should be removed from Brevo when that provider control becomes available.

### Callback deployment verification

The callback repair has been validated locally and pushed to the selected GitHub `main` branch. An immediate public check after the push still rendered MtaaMarket's prior client-side 404 state at `/auth/callback`, which is treated as deployment propagation still pending rather than a successful release. The release gate remains open until a direct public check shows the callback recovery page without an authorization code, followed by one fresh same-browser email-link sign-in test.

## Primary and backup delivery design

Supabase supports only one active SMTP configuration, so it cannot provide automatic provider failover by itself. For a true primary/backup path, MtaaMarket should use the **Send Email Auth Hook**, which replaces the built-in Auth sender and can attempt a second provider when the primary fails. [7]

| Layer | Planned responsibility | Safety rule |
|---|---|---|
| Supabase Auth | Generates the one-time token and calls a protected email hook. | The hook signature must be verified before reading any token or customer email. |
| Primary provider | Delivers the code through the founder-approved, verified MtaaMarket sender. | It receives only the destination email, short transactional message, and OTP required for delivery. |
| Backup provider | Is attempted only after a defined, logged primary-provider failure. | It must use the same verified sender identity or clearly disclosed verified alternative; never silently change to an unverified address. |
| Owner recovery | Receives provider health alerts and can temporarily disable email signup if both providers fail. | Never resend repeatedly or expose whether an email account exists. |

The first launch should use **one verified provider**, with the second account prepared and tested but not automatically active. Automatic failover becomes appropriate only after both sender identities, rate limits, delivery logs, and duplicate-send handling are tested. The Auth Hook documentation expressly supports another provider as a fallback, but activating it requires a protected edge function and secure provider secrets. [7]

## Google configuration boundary

Google sign-in requires a Google Cloud OAuth web client. MtaaMarket's website origin must be registered in Google, and the Supabase project's Google callback URI—not the MtaaMarket website callback—must be registered as the OAuth redirect URI. Google also recommends configuring the consent-screen name and branding so customers can recognise the service. [2]

The Google client secret is a server-side credential. It must be entered only in the Supabase provider settings after the founder creates the OAuth client; it must never be pasted into chat, committed to GitHub, or placed in the browser bundle.

## Email OTP security boundary

Supabase uses the `signInWithOtp` client method to send both magic links and codes; the email template decides which content is delivered. Customers enter the code through `verifyOtp` to receive a session. By default, unregistered email addresses can create a user, which is appropriate for MtaaMarket's gradual public onboarding but must remain protected by rate limits and later abuse controls. [3]

MtaaMarket will retain the documented one-time-code expiry and rate-limit safeguards, add a visible retry timer, and never show whether a specific email address already has an account.

## References

[1]: https://supabase.com/docs/guides/auth/auth-smtp "Supabase Auth: Send emails with custom SMTP"
[2]: https://supabase.com/docs/guides/auth/social-login/auth-google "Supabase Auth: Sign in with Google"
[3]: https://supabase.com/docs/guides/auth/auth-email-passwordless "Supabase Auth: Passwordless email logins"
[4]: https://www.brevo.com/free-smtp-server/ "Brevo: Free SMTP server"
[5]: https://www.mailersend.com/pricing "MailerSend pricing"
[6]: https://resend.com/docs/send-with-smtp "Resend: Send emails with SMTP"
[7]: https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook "Supabase Auth: Send Email Hook"
