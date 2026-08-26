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

## Completed public-read cutover

The anonymous discovery adapter now runs on the isolated Supabase project. Its server-only mapper translates PostgreSQL snake-case rows and UUID identities into the existing frontend-friendly response shape for categories, visible products, approved sellers, active Siaya pickup stations, product detail, and verified reviews. Read-only integration checks cover every discovery resource without inserting test products, vendor accounts, collection points, or reviews.

This is intentionally **not** a protected commerce cutover. Supabase UUID product and station IDs are not passed into the legacy numeric MySQL basket/order mutations. Where a future UUID-backed listing is visible before the full write-path migration, the user is directed to the Request Desk instead of being allowed to create a cross-database order.

## Migration gates

The baseline and anonymous discovery adapter do **not** yet replace the protected Manus/MySQL database adapter, Manus OAuth, or identity-linked seller/order operations. The next implementation stage must add a PostgreSQL-compatible protected server adapter, validated Supabase Auth sessions, founder role assignment, and deployed seller media workflow validation before protected marketplace workflows are accepted on the Vercel deployment.

The owner role is intentionally not seeded during database creation. It will be assigned only after the founder signs in through the final Auth flow and the ownership mapping is verified using the server-side administration path.

## Applied follow-up safeguards

Five reviewed migrations are now applied **only** to the isolated MtaaMarket project. The first establishes the marketplace schema, RLS, storage buckets, and Siaya taxonomy. The next two require an external-marketplace customer-disclosure note and owner original-content attestation. The fourth provides a governed poultry/livestock discovery foundation. The fifth creates a least-privilege vendor-application record with no client write path or role assignment. These guardrails support owner-managed assisted sourcing and gradual seller governance; they do not connect MtaaMarket to Jumia or any other supplier.

| Migration | Applied safeguard | Operational effect |
|---|---|---|
| `20260826112501_initial_mtaamarket_postgres_baseline.sql` | Marketplace PostgreSQL baseline, RLS, buckets, categories | A clean isolated MtaaMarket database foundation. |
| `20260826113917_external_marketplace_disclosure.sql` | Customer-confirmation text and timestamp | External-marketplace assisted orders cannot exist without a recorded manual-sourcing disclosure. |
| `20260826114613_external_content_attestation.sql` | Original-content attestation timestamp | External-marketplace assisted orders require the owner to attest that MtaaMarket did not copy supplier materials. |
| `20260826152111_mtaamarket_poultry_livestock_listings.sql` | Poultry/livestock category and manual-review safeguards | No automated animal checkout, transport, welfare claim, or payment flow is enabled. |
| `20260826190721_vendor_application_governance.sql` | Owner-governed vendor-application records, attestations, RLS, and read-only client scope | No vendor/admin role, seller self-service write, listing write, or storage upload is enabled. |

The corresponding development-database schema changes and server validation are covered by Vitest. The migration filenames were normalized to the exact remote history versions after the GitHub Supabase Preview check detected a history mismatch. The already-applied vendor-governance migration was marked applied in history without re-running its SQL, following Supabase’s documented repair model. [2] The next GitHub commit did not receive a new Supabase Preview check because the current dashboard reports the GitHub connection as not connected; however, its Vercel deployment completed successfully. The still-pending work is not a SQL migration: it is the controlled application migration from the current Manus data, OAuth, and storage adapters to Supabase/Vercel-compatible adapters.

## Reference

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security documentation"
[2]: https://supabase.com/docs/guides/deployment/database-migrations "Supabase database-migration history repair guidance"
