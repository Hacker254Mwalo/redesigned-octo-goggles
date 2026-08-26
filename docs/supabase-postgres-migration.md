# Supabase PostgreSQL Migration Baseline

## Project boundary

This baseline applies **only** to `mfgjpjtlmfdtsnkoluco`, named `siaya-online-mtaamarket-production`, inside the `Siaya Online MtaaMarket` organization. The project was created at **$0/month**, is `ACTIVE_HEALTHY`, and had an empty `public` schema before the migration was prepared. It is not connected to Dumiropay.

| Resource | Production responsibility | Boundary |
|---|---|---|
| Supabase PostgreSQL | Marketplace records, profiles, governance, order data, and audit trails | MtaaMarket only; no Dumiropay import or shared tables. |
| Supabase Auth | Future Vercel-compatible identity provider | Profiles use the Auth UUID as their primary key. No customer account has been created or imported yet. |
| `catalogue-media` bucket | Public product photos that sellers upload as original content | Product images only; no copied supplier photos or customer delivery data. |
| `marketplace-private` bucket | Future delivery proof, customer support, and owner-only documents | Private; access is scoped to the uploading account, with controlled server-side owner access planned. |

## Why this is a separate migration

The existing `drizzle/schema.ts` targets MySQL/TiDB and uses MySQL tables, numeric identity keys, MySQL enums, and JSON semantics. It must not be sent directly to Supabase PostgreSQL. The new SQL baseline instead uses UUIDs compatible with Supabase Auth, PostgreSQL enums, `jsonb`, `timestamptz`, explicit indexes, and Row Level Security policies.

> Row Level Security is enabled on every marketplace table in the exposed `public` schema. Public users can read only categories, active pickup stations, approved vendors, visible active listings, and reviews. Buyer, vendor, owner, payment, and fulfilment writes stay server-managed until the Vercel-compatible API and Supabase Auth session validation are implemented. [1]

## Migration gates

The baseline creates the database foundation only. It does **not** yet replace the live Manus database adapter, Manus OAuth, Manus storage helper, or unapproved payment and courier integrations. The next implementation stage must add a PostgreSQL-compatible server adapter, validated Supabase Auth sessions, isolated Vercel secrets, and a Supabase storage adapter before protected marketplace workflows are accepted on the Vercel deployment.

The owner role is intentionally not seeded during database creation. It will be assigned only after the founder signs in through the final Auth flow and the ownership mapping is verified using the server-side administration path.

## Applied follow-up safeguards

Three reviewed migrations are now applied **only** to the isolated MtaaMarket project. The first establishes the marketplace schema, RLS, storage buckets, and Siaya taxonomy. The second requires an external-marketplace customer-disclosure note. The third records an owner original-content attestation for the same route. These guardrails support owner-managed assisted sourcing; they do not connect MtaaMarket to Jumia or any other supplier.

| Migration | Applied safeguard | Operational effect |
|---|---|---|
| `20260826_001_initial_mtaamarket.sql` | Marketplace PostgreSQL baseline, RLS, buckets, categories | A clean isolated MtaaMarket database foundation. |
| `20260826_002_external_marketplace_disclosure.sql` | Customer-confirmation text and timestamp | External-marketplace assisted orders cannot exist without a recorded manual-sourcing disclosure. |
| `20260826_003_external_content_attestation.sql` | Original-content attestation timestamp | External-marketplace assisted orders require the owner to attest that MtaaMarket did not copy supplier materials. |

The corresponding development-database schema changes and server validation are covered by Vitest. The still-pending work is not a SQL migration: it is the controlled application migration from the current Manus data, OAuth, and storage adapters to Supabase/Vercel-compatible adapters.

## Reference

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security documentation"
