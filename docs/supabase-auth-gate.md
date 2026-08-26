# Supabase Auth Gate for Protected MtaaMarket Workflows

## Current decision

MtaaMarket will use **Supabase Auth** for its Vercel-compatible production identity layer, while the existing Manus OAuth path remains a local-development compatibility path only. This is a design and safety record; it does not activate sign-in, create an account, seed an owner, or enable any protected customer operation.

The isolated project already has a server-side JWT verifier that checks the Supabase JWKS endpoint and enforces the `authenticated` audience. The remaining work is to establish a complete browser session flow, bind each verified Auth UUID to a `marketplace_profiles` record, and migrate every protected database procedure away from numeric MySQL identities.

## Required launch sequence

| Gate | Required completion evidence | Current status |
|---|---|---|
| Auth URL configuration | The production site URL and exact allowed authentication redirects are configured in the isolated Supabase project. | Blocked; hosted Auth URL configuration has not been verified. |
| Browser authentication | A browser-safe client uses only the publishable key, obtains a session, and forwards a bearer token only over HTTPS to the MtaaMarket API. | Implemented; local and deployed dialog reviews passed. A read-only isolated Auth settings check confirms Email is enabled, signups are permitted, and email auto-confirmation is off. |
| Server verification | The API verifies the bearer token using the configured JWKS, maps its `sub` UUID to a Supabase profile, and never trusts client-supplied roles. | Implemented for verified, lowest-privilege buyer-profile preparation. Protected procedures still do not consume this identity. |
| Founder role assignment | The founder signs in using the final flow; a server-side one-time owner assignment maps that exact Auth UUID to `admin`. | Not started; no profile is seeded or elevated. |
| Protected procedure adapter | Buyer, vendor, owner, order, review-write, and media metadata procedures use one PostgreSQL UUID data model end to end. | Blocked; legacy procedures still require numeric MySQL identities. |
| Recovery and misuse controls | Passwordless/email authentication settings, rate limits, redirect allow-list, and the no-self-promotion policy are reviewed before inviting customers. | Blocked. |

### Latest configuration inspection

The isolated project’s hosted **Authentication → URL Configuration** page was updated only after founder approval. Its Site URL is `https://siayaonlinemarket.vercel.app`, and its redirect allow-list now contains exactly `https://siayaonlinemarket.vercel.app`. The production URL prerequisite for the MtaaMarket email magic-link flow is complete.

## Authentication method boundary

Supabase documents email magic links and email OTP as passwordless sign-in methods. Both require the hosted project's **Site URL** and redirect allow-list to be configured before redirect-based delivery is relied on. The documented `signInWithOtp` client call can create a user by default, so MtaaMarket must choose explicitly whether public self-registration is allowed before enabling it. [1]

> **Do not create an admin by email match alone.** The founder role must be assigned only after a verified sign-in and through a server-side, one-time ownership mapping bound to the exact Supabase Auth UUID. The API must derive authority from the profile/role record rather than browser metadata.

## What remains deliberately unavailable

Until every gate above is complete, the site must not accept a real basket checkout, vendor application, seller listing upload, customer account workspace, owner administrative action, payment instruction, or payment/courier integration. UUID-backed public listings route prospective customers to the Request Desk rather than crossing into the legacy numeric MySQL order path.

## References

[1]: https://supabase.com/docs/guides/auth/auth-email-passwordless "Supabase: Passwordless email logins"
