# Siaya Mtaa Market — Role Workspaces and Marketplace Management

## Objective

Complete the most important missing buyer, vendor, and admin workflows in the existing Siaya Mtaa Market website. Preserve founder-only admin authority. Admin approval is for the vendor account once; an approved vendor can publish listings automatically without a second approval for every product, edit their own listings, and use guided upload helpers. Buyers can follow their own orders, and the admin can track fulfillment and accounts in the same protected website.

## Implementation approach

### Admin authority and account visibility

Keep admin assignment founder-only; do not add a UI for granting admin roles, deleting buyer accounts, or changing buyer roles. Add an admin-only, paginated account directory using Supabase Auth users joined to the corresponding V3 profile. Show name, email, account type, vendor approval state, and join date; do not expose full phone numbers in the directory. Every sensitive endpoint must check the authenticated identity and persisted owner role on the server before returning or changing data.

The production `marketplace_profiles` table currently grants browser roles broad write privileges, and its self-update row policy permits changing the current user's own row, including the admin role. The server creates this legacy profile through the service-role client. Add an additive migration that removes browser-side insert/update/delete capability on this legacy table while preserving authenticated read policy and server/service-role writes, then verify the resulting grants. V3 `profiles` is already service-role-only. Do not change email or Google authentication logic.

### Vendor workspace and listing lifecycle

The owner approves or suspends the vendor account once. After approval, new seller listings publish automatically as `ACTIVE`; do not require a separate owner approval for every listing. Retain server-side checks that only a signed-in, agreement-backed, approved vendor can create or edit their own products. Add a seller-facing listing manager in `/vendor/upload` so vendors can review their listings and edit the listing fields and replace the image. Keep ordinary active listings active after edits; if a product is flagged, rejected, or removed by a separately authorized process, vendor edits must not silently undo that state. Do not reintroduce the removed per-product moderation queue in Admin.

Upgrade the upload experience using the existing local image-preparation and AI copy-drafting helpers: make supported formats and size/dimension rules easy to understand, show a preview, offer a clear replace-image flow, and provide accurate guidance while composing or editing a listing. Do not add an external paid service or upload an image the seller did not select.

Make repeat vendor onboarding idempotent: a previously approved seller who revisits the agreement/request action must not lose approval. A suspended seller remains unable to publish until the owner restores access.

### Buyer, vendor, and admin order tracking

Keep the stable `buyer_profile_id` relationship on V3 hub-pickup orders. Add a real server-recorded order submission from an active listing, with quantity and a customer-entered preferred Siaya pickup area. Require the signed-in buyer's saved name and Kenyan phone. A newly placed order begins in a separate `stock_review_status=pending` state; payment is not collected. The buyer sees “Order placed” while pending, “Order confirmed” only after the owner verifies stock, or “Unavailable” if the owner cannot fulfil it. Never show a pickup PIN before owner confirmation. Preserve fulfillment states `PENDING_DROPOFF`, `RECEIVED_AT_HUB`, `COMPLETED`, and `CANCELLED` and keep payment status pending until hand-off.

Show a buyer's own V3 orders alongside existing order updates in `/dashboard`, including item, quantity, amount, clear order state, preferred/confirmed pickup point, and a pickup PIN only after owner confirmation. Add an admin-only order-review queue in `/admin`: show buyer contact only to the owner; allow the owner to confirm availability (atomically reserve the verified quantity), mark unavailable (optionally set listing stock to zero), and advance valid fulfillment transitions. Preserve the order record for audit rather than deleting it. Payment status remains pending until hand-off. Give approved vendors a read-only view of their own product orders without buyer phone or pickup PIN. No online payment is added.

### Responsive owner workspace

Add an “Accounts” section to the existing `/admin` owner control centre with role/vendor-state filters, search within the loaded page, and next/previous pagination. Preserve vendor approval/governance, requests, assisted-order and wider-selection fulfillment tools, and the V3 hub-order review queue; do not restore per-product moderation. Make the directory, order cards, and action controls wrap cleanly at phone widths. Keep the current protected console treatment, typography, navy surface, muted neutral backgrounds, and amber approval cues; avoid unrelated public-page redesign or decorative imagery.

## Project structure

- `client/src/pages/Admin.tsx` remains the `/admin` owner-console shell and existing operational queues.
- `client/src/components/OwnerAccountDirectory.tsx` contains the paginated all-account view and its filters.
- `client/src/pages/VendorUpload.tsx` contains guided listing creation, image preview/replacement, and the seller’s own listing manager.
- `client/src/pages/DashboardPage.tsx` presents account details and the buyer’s own hub/Jumia order activity.
- `server/v3-profiles.ts` owns owner-checked account listing and stable role/vendor checks; `server/v3-vendor.ts` owns automatic listing creation, owner-checked listing edits, and vendor-owned listing/order views; `server/v3-moderation.ts` remains the owner moderation boundary.
- `server/v3-orders.ts` owns identity-scoped buyer/vendor order lists, buyer order creation, owner-only stock review, and fulfillment updates; `server/routers.ts` exposes narrow validated inputs.
- `client/src/pages/ProductDetail.tsx` collects order quantity and preferred pickup area, then submits a real order without collecting payment.
- `client/src/components/OwnerHubOrdersPanel.tsx` separates pending stock checks from confirmed fulfillment and shows buyer contact only within the protected owner console.
- `supabase/migrations/` contains additive role-write hardening, buyer/order linking, and atomic stock-review/inventory reservation migration.
- `client/src/index.css` contains the account-directory, listing-manager and narrow-screen layout rules; existing V3 profile, commerce and moderation tests are extended for the new behavior.

## Design

Reuse the existing operational retail control-room style: crisp navy headers, calm neutral cards, clear green/amber status cues, legible account and order rows that become stacked cards on narrow screens, and compact but explicit action labels. Seller tools should feel practical and confidence-building, with immediate photo preview and clear feedback after save; the buyer workspace should make order state easy to scan. The result remains one Siaya Mtaa Market website, not a separate portal.
