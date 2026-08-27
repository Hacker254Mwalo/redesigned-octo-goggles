# MtaaMarket Google Sign-In Preparation Record

**Status:** Preparation only. Google sign-in remains unavailable in the public MtaaMarket account dialog. No OAuth client, secret, provider setting, role, public invitation, payment, order, delivery, or seller workflow has been activated.

## Verified provider requirements

For a Supabase-backed browser application, Google sign-in requires a Google OAuth client of type **Web application**. The approved MtaaMarket production origin must be listed under **Authorized JavaScript origins**, and the exact Supabase Auth callback URL shown in the Google provider settings must be listed under **Authorized redirect URIs**. Supabase then holds the Google client ID and client secret in its Google provider configuration. [1]

Google validates redirect URIs and recommends that applications request only the scopes required for the current action. MtaaMarket’s initial Google sign-in should use only basic identity authentication through the Supabase provider. It must not request Drive, Gmail, contact, offline, or other Google API scopes, and it must not use a browser-exposed or chat-shared client secret. [2]

| Configuration surface | Required founder-controlled value | MtaaMarket rule |
|---|---|---|
| Google Auth Platform | OAuth client type: **Web application** | Create a separate client for MtaaMarket; do not reuse a client from another platform. |
| Google Auth Platform | Authorized JavaScript origin: `https://siayaonlinemarket.vercel.app` | Add only the active default-domain origin. Do not add wildcards or unrelated origins. |
| Google Auth Platform | Authorized redirect URI: the exact callback copied from the isolated MtaaMarket Supabase Google provider page | This is the Supabase Auth callback—not the browser’s `/auth/callback` route. It must match exactly. |
| Supabase Auth | Google provider enabled, with the new MtaaMarket client ID and secret | Enter the secret only in the secured provider dashboard; never commit it or paste it in chat. |
| Supabase Auth URL Configuration | Site URL and redirect list include `https://siayaonlinemarket.vercel.app` and `https://siayaonlinemarket.vercel.app/auth/callback` | Keep the existing PKCE callback path as the post-provider browser destination. |
| MtaaMarket application | An explicit `signInWithOAuth({ provider: 'google', options: { redirectTo } })` path guarded by configured-provider readiness | Do not render an actionable button until the provider settings are saved and a controlled browser verification has passed. |

## Required founder handoff

The founder must create the Google OAuth client while signed in to the Google Auth Platform console and copy the **exact Supabase-provided callback URI** into Google. The client secret belongs only in the MtaaMarket Supabase provider settings. The founder should not send any Google account details, client ID, client secret, browser callback URL containing parameters, password, code, or email address through chat.

## Read-only MtaaMarket provider audit

The isolated MtaaMarket project’s Supabase Google provider was opened in read-only mode on 27 August 2026. The provider is currently **disabled** and has no saved Google client ID or client secret. Supabase displays the exact callback URI that must be registered with Google:

`https://mfgjpjtlmfdtsnkoluco.supabase.co/auth/v1/callback`

The nonce-skipping control is not enabled and must remain off. The option to permit Google users without an email address must also remain off because MtaaMarket’s buyer-session foundation depends on an email-bearing identity. No Save action was selected and no provider, URL, or user setting was changed.

The application already contains a Supabase `signInWithGoogle` browser-bridge method that redirects to its established `/auth/callback` path, but the public account dialog intentionally does not expose an active Google button. This is the correct current boundary: it prevents a known-disabled provider from producing a failed or misleading sign-in attempt.

## Founder-authorized Google Cloud setup progress

The founder authorized creation of a separate Google Cloud project named **MtaaMarket OAuth**. The project was created under the signed-in founder account without starting a Google Cloud free trial or enabling billable Google APIs. The Google Auth Platform branding wizard was opened and the application name was prepared as **Siaya Online MtaaMarket**.

The browser automation then lost the dynamic consent-screen form before its first step could be advanced. No OAuth client was created, no client ID or secret was generated, no Supabase provider setting was changed, and no Google sign-in control was enabled. The next safe action is to recover the selected `mtaamarket-oauth` project view, complete the consent-screen wizard with a private support contact, and create the Web application client using only the origins and callback listed above.

Once these settings are complete, a separate controlled browser test is required: open the MtaaMarket account dialog, choose Google only after it is visibly enabled, complete consent in the provider window, confirm return to the deployed `/auth/callback` route, and verify that the session is buyer-only. That test must not assign a founder, vendor, or administrator role and must not create an order, request, payment, delivery, or seller record.

## References

[1]: https://supabase.com/docs/guides/auth/social-login/auth-google "Supabase Docs — Login with Google"
[2]: https://developers.google.com/identity/protocols/oauth2/web-server "Google for Developers — Using OAuth 2.0 for Web Server Applications"
