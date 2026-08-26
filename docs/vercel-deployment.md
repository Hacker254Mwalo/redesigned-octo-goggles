# Vercel deployment guide

## Why the raw code appeared

The original Vercel deployment used the repository’s normal `build` script. That script intentionally creates two outputs for Manus hosting: `dist/public` for the Vite browser application and `dist/index.js` for a long-running Express server. Vercel treated the backend bundle as the public entry instead of serving `dist/public/index.html`, so the browser displayed compiled server code.

The repository now includes `vercel.json`, `build:vercel`, and `api/[...path].ts`. Vercel should build only the storefront into `dist/public`, serve that directory as the website, and route `/api/*` to the Express application as one serverless function. The SPA fallback deliberately excludes `/api` so tRPC, OAuth callbacks, storage proxy routes, payment callbacks, and scheduled endpoints are not rewritten to the homepage.

> **Important:** This corrects the code-serving error. It does not make the full marketplace production-ready on Vercel by itself. The existing project was built with Manus-managed database, OAuth, storage, and built-in AI services. Those need compatible external services or an intentional migration before the protected marketplace workflows can operate on Vercel.

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
| `DATABASE_URL` | Required for marketplace data | A Vercel-reachable MySQL/TiDB-compatible database; database migrations must be applied separately. |
| `JWT_SECRET` | Required for protected sessions | A new long, random secret controlled by the owner. |
| `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` | **Configured for MtaaMarket Production** | Browser-safe connection values for the isolated `mfgjpjtlmfdtsnkoluco` Supabase project. They are safe to expose only because Supabase Row Level Security remains active. |
| `SUPABASE_SECRET_KEY` and `SUPABASE_JWKS_URL` | **Configured as MtaaMarket Production secrets** | Server-only isolated-project access and Supabase Auth token verification. They must never be imported into browser code, GitHub, or another project. |
| Authentication provider | Requires a migration decision | The present login flow uses Manus OAuth (`VITE_APP_ID`, `OAUTH_SERVER_URL`) and cannot simply be assumed to work from Vercel. Configure a supported external identity provider and adapt the auth layer before relying on sign-in. |
| Object storage | Requires a migration decision | Vendor photo upload currently uses Manus-managed storage. Use an owner-controlled compatible storage provider and update the storage adapter before enabling real seller uploads on Vercel. |
| AI listing assistance | Optional; requires a provider choice | The current built-in AI helper relies on Manus-managed credentials. Keep the button disabled or migrate it to a server-side AI provider with a budget and privacy policy. |
| M-Pesa/courier/supplier credentials | Intentionally not activated | Add only after an approved provider relationship, public callback URL, and end-to-end sandbox test. |

## What should work after the routing repair

The browser should receive the Siaya Online MtaaMarket interface rather than compiled source code. The public interface will call `/api/trpc`; public catalogue data and protected functions still need the compatible database and service configuration above. If a required variable is missing, the correct next symptom is an API/authentication error—not raw JavaScript on the homepage.

## Safe launch order

1. Redeploy the configuration fix and confirm that the homepage renders as a marketplace.
2. Use the isolated MtaaMarket Supabase project and its reviewed PostgreSQL migrations; never reuse Dumiropay resources.
3. Port the running MySQL/TiDB server procedures to the isolated PostgreSQL model and complete Supabase Auth account/session integration before inviting real users.
4. Validate the Supabase Storage compatibility layer with a full seller-photo flow in the deployed environment, then switch MtaaMarket media operations deliberately.
5. Replace or migrate the Manus-specific AI integration only after choosing a server-side provider and usage budget.
6. Add verified fulfilment choices and a payment provider only after operational testing. Keep payment confirmation and Assisted Market order control manual until then.

## Alternative hosting

Because this is a Manus full-stack project, **Manus managed hosting** is the lower-operations path: it already provides the database, OAuth, storage, server runtime, and built-in services that the project was created with. Vercel can host the repaired frontend and serverless API, but requires the external service migration described above. Choose one primary production environment before inviting customers so data, authentication, uploads, and callbacks do not become split between incompatible systems.
