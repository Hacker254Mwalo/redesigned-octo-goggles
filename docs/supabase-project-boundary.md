# Supabase Project Boundary — Siaya Online MtaaMarket

## Current verified state

Siaya Online MtaaMarket now has its **own isolated Supabase project**. The previous legacy Dumiropay project was permanently deleted only after the founder explicitly authorized that exact project reference. The verified working Dumiropay project remains separate and unchanged.

| Project reference | Organization | Verified role | Current rule |
|---|---|---|---|
| `jwnhluxftefqciwomqig` | `hacker254mwalo's projects` | **Working Dumiropay runtime**. It is `ACTIVE_HEALTHY`, contains real Dumiropay data, and received recent Node/Supabase application traffic. | Never pause, rename, delete, migrate, reuse, or share credentials with MtaaMarket. |
| `mfgjpjtlmfdtsnkoluco` | `Siaya Online MtaaMarket` | **Isolated MtaaMarket production foundation**. Named `siaya-online-mtaamarket-production`, `ACTIVE_HEALTHY`, region `eu-west-1`. | MtaaMarket only. No Dumiropay data, configuration, users, storage, or credentials may enter this project. |

The new MtaaMarket project was created at **$0 per month** after the current cost was checked and confirmed by the founder. Its `public` schema was empty before migration. The initial MtaaMarket PostgreSQL baseline is now applied: it created only marketplace tables, two MtaaMarket storage buckets, ten product categories, and Row Level Security on every marketplace table. Supabase security advisors returned no security lints after migration.

## Historical capacity decision

The former `Dreaps venture` project `qlzfhogkbfsipmrurbfo` contained legacy Dumiropay records and was not reused. It was permanently deleted through the authenticated Supabase dashboard after the founder explicitly instructed deletion of that exact reference. The organization project list then showed no projects and zero database/storage usage. A direct check confirmed `jwnhluxftefqciwomqig` remained `ACTIVE_HEALTHY` after the deletion.

> The removal is irreversible. The active Dumiropay runtime is **not** the project that was deleted.

## MtaaMarket database foundation

The source-controlled migration is [`supabase/migrations/20260826_001_initial_mtaamarket.sql`](../supabase/migrations/20260826_001_initial_mtaamarket.sql). It is written for PostgreSQL and Supabase Auth rather than copied from the existing MySQL/TiDB Drizzle schema. It uses Auth UUID profile keys, PostgreSQL enums, `jsonb`, `timestamptz`, explicit indexes, privacy-safe order access, audit events, and future payment/fulfilment records.

| Layer | Verified now | Still required before accepting protected Vercel marketplace traffic |
|---|---|---|
| Database | Isolated PostgreSQL tables, categories, indexes, constraints, and RLS are applied. | Replace the current MySQL/TiDB server adapter and port every data procedure to PostgreSQL. |
| Authentication | Schema is ready for Supabase Auth UUIDs. | Build Supabase Auth session validation, founder owner-role assignment, and Vercel-compatible account flows. |
| Storage | `catalogue-media` and `marketplace-private` buckets and scoped file policies exist. | Replace the Manus storage adapter and validate original-photo uploads, private files, and owner access. |
| Public storefront | The visual MtaaMarket storefront remains live on `siayaonlinemarket.vercel.app`. | Configure secure Vercel environment values and test protected API, sign-in, listing, request, order, and upload flows. |
| Payments and delivery | Future preference/status fields exist only. | Keep external payment, courier, and supplier integrations disabled until each provider and legal/operational workflow is approved. |

## Security model

Every marketplace table in the exposed `public` schema has Row Level Security enabled. Public browsing is restricted to active categories, pickup stations, approved vendors, visible active products, and reviews. Buyer, vendor, owner, fulfilment, and payment-sensitive access remains server-mediated until the final Supabase Auth and Vercel API migration is implemented. This avoids exposing buyer contact information or owner operational records to vendors or anonymous visitors. [1]

The migration creates a **public** product-media bucket and a **private** marketplace-records bucket. Upload policies scope file paths to authenticated user UUID folders. No product images, customer documents, or supplier content were copied during setup.

## Non-negotiable separation rules

MtaaMarket must never access the Dumiropay database, its Edge Function, its Auth users, storage, data, service credentials, or application configuration. Likewise, Dumiropay must never point to the MtaaMarket Supabase URL or use MtaaMarket secrets.

No current claim should say that protected MtaaMarket login, transactions, product uploads, vendor onboarding, or checkout are fully migrated to Supabase/Vercel. The database foundation is complete; the application adapters and end-to-end validation remain the next gate.

## Reference

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security documentation"
