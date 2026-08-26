# Multi-Vendor Onboarding and Moderation Gate

## Operating decision

MtaaMarket is designed to serve many local vendors, but no public self-service vendor application, listing write, original-media upload, buyer-contact disclosure, order assignment, or payout workflow may be activated until the protected marketplace model is fully migrated from the legacy numeric system to isolated Supabase PostgreSQL UUID identities.

The public Seller Studio remains a transparent explanation of the owner-approved model. A successful buyer sign-in does not make a user a vendor, an owner, or a moderator. Vendor elevation must be a deliberate, auditable owner action tied to a verified Supabase Auth UUID.

## Required protected records

| Record | Purpose | Required owner control |
|---|---|---|
| `marketplace_profiles` | Buyer identity keyed by `auth.users.id`. | Default buyer role only. |
| `vendor_applications` | Seller facts, business details, service area, and original-content acknowledgement. | Owner approves, requests changes, suspends, or rejects. |
| `vendors` | Approved selling entity and operational status. | Owner creates only after application review. |
| `vendor_memberships` | Relationship between a vendor and a verified Auth UUID. | Owner grants/revokes; one account cannot self-assign. |
| `vendor_listings` | Draft, submitted, approved, paused, removed, or livestock-review listing state. | Owner approves public visibility and can immediately pause. |
| `listing_media` | Original-product photos and moderation outcome. | Media must be original, type/size validated, and removable by owner. |
| `collection_confirmations` | Private, owner-approved collection instructions. | Never visible to unrelated vendors or public visitors. |
| `audit_events` | Role grants, application decisions, listing decisions, and collection actions. | Append-only operational trace. |

## RLS and Storage requirements

Supabase advises enabling Row Level Security on every exposed table, revoking default client grants, granting only necessary operations, and testing each operation for `anon` and `authenticated` roles. [1] Storage similarly requires explicit RLS policies on `storage.objects`; its service key bypasses RLS and must stay server-side. [2]

| Principal | Read scope | Write scope | Prohibited actions |
|---|---|---|---|
| Public visitor | Approved public listings, approved vendor display details, public categories. | None. | Any profile, application, private media, collection, payment, or audit record. |
| Buyer | Own profile and own private request/collection records after migration. | Own low-risk preferences only. | Vendor roles, other buyers, seller contact data, listing approval, order/payment actions. |
| Applicant | Own application and own pending-media status. | Create/update own draft application and original media in UUID-prefixed paths. | Self-approval, vendor membership, public listing publication. |
| Approved vendor | Own approved listings and assigned minimum fulfilment data. | Draft/submit listings and own unapproved media. | Public approval, buyer private contact, other vendors’ data, payout decisions. |
| Owner/moderator | Scoped review queues and audit records. | Approve/suspend/restore records and issue collection instructions. | Unlogged role changes or client-side service-key access. |

## Migration and test gate

The next protected implementation must introduce the records above through a single schema-first PostgreSQL migration; include RLS enablement, explicit grants, policies per operation, indexes for policy-filter columns, and SQL allow/deny tests. The initial Storage policy must permit only authenticated uploads in a path beginning with the caller UUID, with server-side MIME/size/original-content checks before any owner review. [1] [2]

Poultry and livestock remain a stricter branch: an owner must review the welfare declaration, lawful-sale acknowledgement, original photographs, broad area, and manual collection plan before any public visibility. They never enter a public checkout or automated transport workflow.

## Activation checklist

| Requirement | Evidence needed before activation |
|---|---|
| Founder authority | A real signed-in founder UUID and an explicit one-time server-side elevation record. |
| Data isolation | RLS/grant tests prove public, buyer, vendor, and owner isolation. |
| Media safety | UUID-prefixed Storage policy plus upload validation and deletion/moderation tests. |
| Moderation | Owner review queue, suspension, removal, restoration, and audit events tested. |
| Buyer privacy | Vendor view proves it contains only minimum fulfilment information. |
| Collection | Protected collection confirmation records and no public payment/delivery claim. |
| Operations | Owner can pause onboarding globally and remove a vendor/listing immediately. |

## References

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase: Row Level Security"
[2]: https://supabase.com/docs/guides/storage/security/access-control "Supabase Storage: Access Control"
