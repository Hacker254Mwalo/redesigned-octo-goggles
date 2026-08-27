# Vercel deployment guide

## Why the raw code appeared

The original Vercel deployment used the repository’s normal `build` script. That script intentionally creates two outputs for Manus hosting: `dist/public` for the Vite browser application and `dist/index.js` for a long-running Express server. Vercel treated the backend bundle as the public entry instead of serving `dist/public/index.html`, so the browser displayed compiled server code.

The repository now includes `vercel.json`, `build:vercel`, and `api/[...path].ts`. Vercel should build only the storefront into `dist/public`, serve that directory as the website, and route `/api/*` to the Express application as one serverless function. The SPA fallback deliberately excludes `/api` so tRPC, OAuth callbacks, storage proxy routes, payment callbacks, and scheduled endpoints are not rewritten to the homepage.

> **Important:** This corrects the code-serving error. It does not make the full marketplace production-ready on Vercel by itself. MtaaMarket’s V3 paths now use isolated Supabase identity, database, and storage services, but founder activation, real original inventory, and controlled authenticated operational testing remain required before protected marketplace workflows are treated as live.

## Vercel project settings

| Setting | Required value |
|---|---|
| Root Directory | Repository root (`redesigned-octo-goggles`) |
| Framework Preset | Leave automatic or use **Vite**; repository `vercel.json` is authoritative |
| Build Command | Do not override the repository configuration; it runs `pnpm run build:vercel` |
| Output Directory | Do not override the repository configuration; it is `dist/public` |
| Node.js | Node 22 or the current Vercel-supported Node LTS version |
| Deployment source | `main` branch |

After the Git push containing the configuration, open **Deployments** in Vercel and choose **Redeploy** on the newest `main` commit. Do not reuse the earlier deployment’s manually overridden output directory or build command.

## Environment requirements

Never paste secrets into GitHub, chat, the browser source code, or the public Vercel project settings. Add them only through Vercel’s encrypted **Environment Variables** interface for Preview and Production as appropriate.

| Variable or service | Status on Vercel | What it is for |
|---|---|---|
| `DATABASE_URL` | Legacy-path dependency only | V3 public discovery and controlled V3 procedures use the isolated Supabase project. Do not route V3 features through legacy MySQL/TiDB operations; retire residual legacy procedures only through a separate review. |
| `JWT_SECRET` | Required for protected sessions | A new long, random secret controlled by the owner. |
| `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` | **Configured for MtaaMarket Production** | Browser-safe connection values for the isolated `mfgjpjtlmfdtsnkoluco` Supabase project. They are safe to expose only because Supabase Row Level Security remains active. |
| `SUPABASE_SECRET_KEY` and `SUPABASE_JWKS_URL` | **Configured as MtaaMarket Production secrets** | Server-only isolated-project access and Supabase Auth token verification. They must never be imported into browser code, GitHub, or another project. |
| Authentication provider | **Supabase password accounts configured** | Returning users sign in with email/password; six-digit codes are reserved for new-password-account verification and recovery. Server-side JWKS verification and founder-only owner bootstrap are deployed; Google OAuth remains unavailable without a separately configured provider. |
| Object storage | V3 adapter configured; founder user-flow validation pending | The server-only storage adapter uses isolated Supabase buckets and temporary public/private integration checks pass. Do not treat a real seller upload as operational until a controlled founder browser test is recorded. |
| AI listing assistance | Manual-first; no provider active | The V3 interface provides only transparent inactive/manual guidance. Do not send images or listing facts to a provider, or activate a model, Cloudinary, queue, automated Sheng copy, or commercial decision without a scoped server-side provider, consent, retention, rate-limit, and budget decision. |
| M-Pesa/courier/supplier credentials | Intentionally not activated | Add only after an approved provider relationship, public callback URL, and end-to-end sandbox test. |

## Verified public data path

The deployed public tRPC path now uses the isolated MtaaMarket Supabase project for **categories, visible products, approved sellers, active Siaya pickup stations, and verified reviews**. These reads are deliberately anonymous and RLS-compatible. The empty marketplace state is legitimate until the owner adds original, verified catalogue content through the final protected write flow; no sample or copied supplier products are seeded to make the page look populated.

UUID-backed Supabase listings intentionally do **not** enter the existing numeric MySQL basket or order mutations. Their dedicated V3 controlled hub-order route uses verified Supabase identity, server-derived price, a private buyer profile, duplicate-open-order prevention, and pay-on-pickup only. Residual legacy routes remain separate and must not be used by V3 screens.

## What should work after the routing repair

The browser should receive the Siaya Online MtaaMarket interface rather than compiled source code. The public interface calls `/api/trpc` and its discovery endpoints use isolated Supabase. A verified Supabase session can use the dedicated V3 buyer-profile, vendor-application, approved-vendor listing, owner bootstrap/moderation, and controlled pay-on-pickup contracts. Founder activation, real original inventory, and controlled end-to-end evidence remain launch gates. If a required variable is missing, the correct next symptom is an API/authentication error—not raw JavaScript on the homepage.

### Latest public verification

After the public-discovery commit was deployed, `marketplace.products`, `marketplace.pickupStations`, and `marketplace.approvedVendors` each returned successful empty arrays from the isolated MtaaMarket catalogue rather than the earlier `Marketplace database is unavailable` error. An empty result is expected because no original, verified products, operational stations, or approved sellers have been added yet; it is not a signal to seed examples or turn on checkout.

The next deployed milestone added the MtaaMarket-only email sign-in dialog and verified its safe anonymous status endpoint. The live `auth.supabaseSession` response reports `signedIn: false` and `protectedCommerceReady: false` when no authenticated bearer token is present. This proves the deployed UI and API boundary render correctly; it does **not** test delivery of an email link, create an account, assign an owner, or enable buyer/vendor/order/payment actions.

## Safe launch order

1. Redeploy the configuration fix and confirm that the homepage renders as a marketplace.
2. Use the isolated MtaaMarket Supabase project and its reviewed PostgreSQL migrations; never reuse Dumiropay resources.
3. Have the configured founder complete a controlled Supabase password-account sign-in and founder-only owner bootstrap test without sharing credentials or codes in chat.
4. Add only rights-cleared original inventory through the V3 PENDING-to-owner-review route, then perform one controlled deployed seller-photo flow.
5. Select an AI provider only after a server-side privacy, consent, retention, rate-limit, editable-output, and usage-budget decision; model calls can consume credits.
6. Add verified fulfilment choices and a payment provider only after separate operational testing. Keep payment confirmation and Assisted Market order control manual until then.

## Alternative hosting

Because this is a Manus full-stack project, **Manus managed hosting** is the lower-operations path: it already provides the database, OAuth, storage, server runtime, and built-in services that the project was created with. Vercel can host the repaired frontend and serverless API, but requires the external service migration described above. Choose one primary production environment before inviting customers so data, authentication, uploads, and callbacks do not become split between incompatible systems.
