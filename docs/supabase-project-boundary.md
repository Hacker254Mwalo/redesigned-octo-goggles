# Supabase Project Boundary — Siaya Online MtaaMarket

## Decision record

**Decision:** No existing Supabase project may be reused for Siaya Online MtaaMarket. Both active project slots belong to separate Dumiropay systems, and the account's free-plan capacity is fully occupied. No schema, data, authentication, storage, credential, pause, deletion, or display-name change was made as part of this decision record.

| Project reference | Organization | Verified classification | Evidence | MtaaMarket rule |
|---|---|---|---|---|
| `jwnhluxftefqciwomqig` | `hacker254mwalo's projects` | **Active and healthy Dumiropay system** | Supabase reports `ACTIVE_HEALTHY`. Its public schema includes users, wallet transactions, deposits, withdrawals, investments, loans, app settings, audit records, workload records, and other Dumiropay features. The 24-hour log window contained 371 edge events plus recent Postgres and PostgREST activity. An active `clerk-webhook` Edge Function is deployed. | **Never modify or repurpose from MtaaMarket work. Do not pause.** |
| `qlzfhogkbfsipmrurbfo` | `Dreaps venture` | **Active and healthy Dumiropay system** | Supabase reports `ACTIVE_HEALTHY`. Its public schema includes 907 transactions, 3 users, 5 deposits, 10 withdrawals, 4 loans, 25 investments, support messages, password-reset requests, and application settings. Its 24-hour log window included recent Edge, Postgres, PgBouncer, PostgREST, Realtime, and Storage activity. | **Never modify or repurpose from MtaaMarket work. Do not pause.** |

The `qlzfhogkbfsipmrurbfo` display name has been restored to **`Dumiropay — Active`**. An earlier visual Table Editor view appeared empty, but it was not authoritative; table inventory and recent system activity proved the project contains active Dumiropay data. The project reference, not the display name, is the operational identity that must be protected.

## Capacity outcome

The account owner is limited to **two active free Supabase projects**. The `Siaya Online MtaaMarket` organization exists but contains no database project. Creating `siaya-online-mtaamarket-production` was cost-confirmed at **$0/month** and explicitly approved, but Supabase refused the creation because the owner's two active-project limit is already consumed by the two Dumiropay projects above.

> Separate Supabase organizations do not create separate free-project capacity when the same account owner is subject to the active-project limit.

## Separation rules

| Resource | Current state | Required boundary |
|---|---|---|
| MtaaMarket Vercel deployment | The public storefront renders correctly at `siayaonlinemarket.vercel.app`. | Keep it visually live, but do not present protected production transactions, login, uploads, or AI services as migrated until their independent replacements are configured and tested. |
| Manus project database, authentication, and storage | Current development services for MtaaMarket. | Keep separate from all Dumiropay Supabase resources. Do not copy Dumiropay data, storage objects, credentials, or auth configuration. |
| `Dumiropay` organization | No project currently visible. | Preserve it; no MtaaMarket resource may be created or migrated there. |
| `Siaya Online MtaaMarket` organization | Named organization with no database project. | Reserve it as the preferred future MtaaMarket home only after a project slot is made available through a safe, explicitly approved route. |

## Safe paths forward

MtaaMarket has three safe routes. The first is to continue using the existing managed development services while the public Vercel storefront remains a verified frontend deployment. The second is to create a dedicated MtaaMarket project under an eligible **separate Supabase owner/account** if the platform permits that arrangement; it must first be confirmed empty and controlled only for MtaaMarket. The third is a paid Supabase capacity change, but it requires the exact displayed price and the founder's explicit approval before any upgrade or project creation.

Neither Dumiropay project may be deleted, cleared, renamed again, paused, or reused merely to create a free slot. A pause would interrupt a project that has real domain data and recent service activity, while reuse would mix unrelated customers, transaction records, security policies, and operational risk.

## Required migration gate once an isolated project exists

The current `drizzle/schema.ts` is a MySQL/TiDB-style Drizzle schema and must **not** be applied directly to Supabase PostgreSQL. Before switching MtaaMarket backend traffic to Vercel, the team must complete the following ordered gate in the new isolated project:

1. Design and review a dedicated PostgreSQL schema and migrations for MtaaMarket only, including Row Level Security and marketplace data access rules.
2. Replace the MySQL database adapter with a PostgreSQL-compatible data layer and validate server procedures against the new schema.
3. Replace or migrate Manus OAuth with a Vercel-compatible authentication design, including owner/admin role mapping and secure session handling.
4. Move product media to isolated storage buckets with private upload controls and public delivery rules, without importing Dumiropay files.
5. Configure Vercel environment values securely through project settings; never copy secrets into source control or chat.
6. Test sign-in, role checks, listing management, media upload, order privacy, error paths, and rollback steps before accepting real buyer or vendor operations.

Until this gate is complete, MtaaMarket should not claim that production authentication, protected marketplace operations, media uploads, or transactions are operating from Supabase on Vercel.
