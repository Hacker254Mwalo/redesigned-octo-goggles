# MtaaMarket Sign-in Options

## Decision for the next release

MtaaMarket will use a staged account experience: **email magic link** remains the currently verified method; **email/password** is the next candidate once its signup, verification, recovery, and rate-limit paths are tested; and **Google** stays unavailable until the founder creates and configures the required OAuth client. No UI will imply that an unconfigured provider is usable.

Neither option will unlock checkout, seller publishing, administration, payment, delivery, or live-animal activity. A successful sign-in creates only a lowest-privilege buyer identity until the separate UUID profile and role migration is complete.

| Option | What a customer sees | Required configuration | Current implementation position |
|---|---|---|---|
| Email one-time code | Enter email, receive a six- or eight-digit code, type it into MtaaMarket. | A Supabase Email OTP template containing `{{ .Token }}` and a tested sender configuration. | UI and verification step can be built now; template switch and sender activation require controlled configuration. |
| Email/password | Create an account, confirm the email, sign in with the password, and use a non-enumerating password-reset request if needed. | Email provider, confirmation template, password requirements, reset redirect, delivery rate limits, and a tested custom SMTP sender. | Local UI and `/auth/reset-password` foundations are built and tested. Public activation remains gated on hosted password-policy alignment, one fresh real verification/reset test, and delivery-domain remediation. |
| Google sign-in | A Continue with Google button and the Google consent screen. | Google Cloud OAuth client ID/secret, authorized MtaaMarket origin, Supabase Auth callback URI, and provider activation. | Provider is verified disabled in the MtaaMarket Supabase project; do not render an active button until the founder adds real Google OAuth credentials. |
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

The founder-created Brevo Free workspace is named **Siaya Online MtaaMarket**, and its temporary MtaaMarket sender identity has been verified. Brevo marks the sender as a freemail address, which is acceptable only as a temporary low-volume sender and not a final brand identity. A purpose-limited SMTP credential was generated and entered directly into the Supabase encrypted SMTP form without being printed, committed, or shared in chat. MtaaMarket has sent only guarded founder-approved authentication tests through this sender. Any additional provider verification shown at first-send time must be completed only in the relevant email-delivery flow, not through a separate calling product.

The provider's separate **Brevo Phone** product is not the required verification route for MtaaMarket email delivery and is excluded from this setup because it is a paid business-calling feature. A personal phone number is not entered into that product. Sender/domain verification and SMTP configuration remain the only relevant email-delivery steps.

The first temporary SMTP key generated during configuration was deliberately **not saved** in Supabase after the unsaved form was discarded. Brevo rejected the first revocation attempt. It remains inactive and permanently **do not use**; no MtaaMarket configuration points to it. Two further short-lived keys were generated during dashboard-session recovery but their unsaved Supabase forms were also deliberately discarded. The Supabase SMTP settings now show the custom-SMTP toggle enabled, the verified Brevo sender/relay values retained, no password displayed, and a disabled Save action—evidence that the final encrypted save completed. Earlier inactive keys should be removed from Brevo when that provider control becomes available.

Founder-provided evidence subsequently verified both delivery and the repaired same-device callback: the MtaaMarket message arrived, and the callback showed **“Sign-in complete”** with only a lowest-privilege buyer-profile preparation message. The email appeared in Gmail’s Spam folder. This proves the temporary sender and callback work; it does **not** demonstrate production-quality inbox placement.

## Deliverability remediation: custom domain required

The temporary freemail sender must be treated as a launch test path only. Brevo’s official guidance recommends sending from a professional address on a custom domain, authenticating that domain with DKIM and DMARC, and aligning the visible From-domain with the authenticated domain. [8] Google recommends SPF, DKIM, and DMARC for every sending domain; it explains that unauthenticated messages can be marked as spam or rejected, and that DMARC alignment requires the authenticated domain to match the domain shown in the From header. [9]

The safe next remediation is therefore **not** repeated sends or copy changes. It is a founder-owned MtaaMarket domain, followed by Brevo-provided DNS records for domain verification and 2048-bit DKIM where supported, an SPF record that includes the selected sender, and a monitored DMARC policy beginning at `p=none`. Only after Brevo reports the domain authenticated should MtaaMarket switch the sender to a dedicated address such as `no-reply@<mtaamarket-domain>` and run a fresh low-volume inbox-placement test. Until then, the verified temporary sender remains usable for controlled internal tests but is not appropriate for public launch.

The current `siayaonlinemarket.vercel.app` address remains suitable for the public storefront and Auth callback/redirect URLs. It is not a founder-controlled email domain and cannot supply the DNS ownership required for a branded From address, SPF, DKIM, or DMARC. MtaaMarket therefore continues normal public-site hardening on the Vercel domain while deferring sender-domain authentication until the founder later owns and links a custom domain.

### Callback deployment verification

The callback repair was deployed, and founder evidence verified the completed same-device magic-link session. The callback continues to prepare only a lowest-privilege buyer profile; it does not create a founder, seller, payment, order, collection, or delivery permission.

## Verified email/password provider state

The MtaaMarket Supabase Email provider is enabled, signups are allowed, and email confirmation is enabled. Secure email-change confirmation is also enabled. Google is disabled. The hosted password policy now enforces an **eight-character minimum** plus **at least one letter and one digit**, matching the deployed client validation. The setting was saved and reopened in the provider panel to confirm that it persisted. Leaked-password protection is unavailable on the current Free plan. Reauthentication and current-password enforcement are currently disabled.

The current Supabase Security Advisor was rerun after the latest database-hardening work. It returned **zero errors** and one warning: leaked-password protection is disabled. This is the known Free-plan limitation above; it does not permit an unsafe bypass, and it does not remove the separate password-policy, deliverability, and end-to-end verification launch gates.

Supabase states that email/password signups and recovery require an SMTP sender in production; it also deliberately makes password-recovery requests non-enumerating. [10] The platform’s email-send endpoints are subject to per-project and per-user rate limits, including a default resend window for signup confirmation and password recovery. [11] MtaaMarket must therefore use the same generic success response for every reset request, add an in-form retry countdown, and never write password values to logs, analytics, browser storage, or application database tables.

MtaaMarket now has a local account dialog for magic-link sign-in, email/password sign-in, email/password signup, and a non-enumerating reset request. The recovery redirect has an explicit `/auth/reset-password` route that exchanges a recovery code, removes it from the visible URL, enforces an eight-character letters-and-digits password locally, and avoids browser/local storage of a password. Focused regression coverage confirms password validation and generic recovery wording. These screens have not yet been used to create a production password account or reset a real customer password.

The recommended safe activation order is: first complete one controlled production verification of signup/confirmation, password sign-in, reset-request, reset-completion, and generic error views. The hosted eight-character letters-and-digits policy is now in place. Reauthentication should be enabled only after the in-session password-change experience can collect and validate the nonce. Current-password enforcement should remain disabled until the recovery flow is separately confirmed compatible, because a reset user will not possess a current password. Supabase describes both reauthentication and current-password checks as additional update-password controls, not replacements for recovery. [12]

On 27 August 2026, the founder explicitly approved one controlled account-flow verification. The public dialog was opened on the Vercel deployment, but no email, password, code, recovery link, customer account, order, vendor record, payment, delivery, or role action had been submitted at the start of this controlled test.

Founder-provided mobile evidence later confirmed that the controlled email-link message reached the Inbox and the same-device link completed a buyer-only MtaaMarket session. A password-recovery request also displayed the intended generic confirmation and resend cooldown. The evidence contains no retained email address, password, code, or link in project documentation. Password-account signup, password sign-in, and reset completion remain unverified; therefore the password route is not represented as a general-public launch method.

Google needs a founder-owned Google Cloud OAuth web client, MtaaMarket’s authorised origin, the exact Supabase Google callback URI shown in its provider screen, and a private client secret entered only in Supabase. [2] Until those prerequisites exist, a visible active Google control would be misleading and is prohibited.

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
[8]: https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders "Brevo: Sender requirements for Gmail, Yahoo, and Microsoft"
[9]: https://support.google.com/mail/answer/81126?hl=en "Google: Email sender guidelines"
[10]: https://supabase.com/docs/guides/auth/passwords "Supabase Auth: Password-based authentication"
[11]: https://supabase.com/docs/guides/auth/rate-limits "Supabase Auth: Rate limits"
[12]: https://supabase.com/docs/guides/auth/password-security "Supabase Auth: Password security"
