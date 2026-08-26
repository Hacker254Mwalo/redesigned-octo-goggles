-- Siaya Online MtaaMarket: isolated Supabase PostgreSQL baseline.
-- Apply only to project mfgjpjtlmfdtsnkoluco. Never apply to Dumiropay.

create schema if not exists private;
revoke all on schema private from public;

create type public.marketplace_role as enum ('buyer', 'vendor', 'admin');
create type public.vendor_approval_status as enum ('pending', 'approved', 'suspended', 'rejected');
create type public.product_source_type as enum ('mtaa_select', 'approved_seller', 'special_order');
create type public.product_condition as enum ('new', 'used', 'refurbished');
create type public.product_availability_status as enum ('ready', 'seller_confirmed', 'special_order');
create type public.payment_timing as enum ('pay_before', 'pay_on_collection', 'pay_on_delivery', 'confirm_with_mtaamarket');
create type public.product_moderation_status as enum ('visible', 'paused', 'removed');
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.fulfilment_method as enum ('siaya_pickup', 'home_delivery', 'collection_point', 'special_order');
create type public.order_payment_status as enum ('unpaid', 'initiated', 'paid', 'failed', 'refunded');
create type public.order_status as enum ('pending_payment', 'paid_escrow', 'ready_for_pickup', 'picked_up', 'released_vendor', 'disputed', 'cancelled');
create type public.item_request_status as enum ('submitted', 'reviewing', 'quoted', 'accepted', 'sourcing', 'completed', 'unavailable', 'cancelled');
create type public.source_route as enum ('mtaa_select', 'approved_vendor', 'supplier', 'external_marketplace', 'other');
create type public.assisted_order_status as enum ('recorded', 'confirmed', 'sourcing', 'ready', 'out_for_delivery', 'completed', 'cancelled');
create type public.dispute_status as enum ('open', 'under_review', 'resolved_buyer', 'resolved_vendor', 'closed');
create type public.notification_type as enum ('payment', 'pickup', 'delivery', 'dispute', 'order', 'system');

create table public.marketplace_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name varchar(120) not null,
  phone_number varchar(20),
  role public.marketplace_role not null default 'buyer',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phone_number)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null,
  slug varchar(96) not null unique,
  icon varchar(48) not null,
  description varchar(240),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.marketplace_profiles(id) on delete cascade,
  store_name varchar(120) not null,
  store_slug varchar(140) not null unique,
  description text,
  support_phone varchar(20),
  logo_url text,
  pickup_notes text,
  service_area varchar(240) not null default 'Serves Siaya County',
  approval_status public.vendor_approval_status not null default 'pending',
  owner_notes text,
  approved_at timestamptz,
  suspended_at timestamptz,
  is_verified boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id) on delete set null,
  category_id uuid not null references public.categories(id),
  title varchar(180) not null,
  slug varchar(220) not null unique,
  description text not null,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url text,
  image_key varchar(512),
  image_alt varchar(180),
  is_local_inventory boolean not null default false,
  source_type public.product_source_type not null default 'approved_seller',
  item_condition public.product_condition not null default 'new',
  availability_status public.product_availability_status not null default 'ready',
  payment_timing public.payment_timing not null default 'confirm_with_mtaamarket',
  fulfilment_options jsonb not null default '[]'::jsonb check (jsonb_typeof(fulfilment_options) = 'array'),
  moderation_status public.product_moderation_status not null default 'visible',
  status public.product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pickup_stations (
  id uuid primary key default gen_random_uuid(),
  name varchar(140) not null,
  slug varchar(160) not null unique,
  county varchar(80) not null,
  town varchar(80) not null,
  address text not null,
  landmark varchar(180),
  opening_hours varchar(180),
  contact_phone varchar(20),
  latitude numeric(10,7),
  longitude numeric(10,7),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.marketplace_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number varchar(32) not null unique,
  buyer_profile_id uuid not null references public.marketplace_profiles(id),
  vendor_id uuid references public.vendors(id) on delete set null,
  pickup_station_id uuid references public.pickup_stations(id) on delete set null,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  pickup_fee numeric(12,2) not null default 0 check (pickup_fee >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  payment_status public.order_payment_status not null default 'unpaid',
  status public.order_status not null default 'pending_payment',
  mpesa_checkout_request_id varchar(128) unique,
  mpesa_merchant_request_id varchar(128),
  mpesa_receipt_number varchar(64),
  payment_phone varchar(20),
  fulfilment_method public.fulfilment_method not null default 'siaya_pickup',
  customer_fulfilment_note text,
  delivery_area varchar(180),
  buyer_contact_shared boolean not null default false,
  payment_timing_snapshot public.payment_timing not null default 'confirm_with_mtaamarket',
  platform_notes text,
  auto_release_at timestamptz,
  picked_up_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  title_snapshot varchar(180) not null,
  image_url_snapshot text,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create table public.item_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_profile_id uuid references public.marketplace_profiles(id) on delete cascade,
  created_by_profile_id uuid not null references public.marketplace_profiles(id),
  is_assisted boolean not null default false,
  customer_name varchar(120),
  customer_phone varchar(20),
  title varchar(180) not null,
  details text not null,
  budget_hint numeric(12,2) check (budget_hint is null or budget_hint >= 0),
  preferred_fulfilment public.fulfilment_method not null default 'siaya_pickup',
  preferred_location varchar(180),
  status public.item_request_status not null default 'submitted',
  source_route public.source_route,
  quoted_price numeric(12,2) check (quoted_price is null or quoted_price >= 0),
  platform_reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assisted_orders (
  id uuid primary key default gen_random_uuid(),
  assisted_order_number varchar(36) not null unique,
  item_request_id uuid references public.item_requests(id) on delete set null,
  owner_profile_id uuid not null references public.marketplace_profiles(id),
  vendor_id uuid references public.vendors(id) on delete set null,
  customer_name varchar(120) not null,
  customer_phone varchar(20),
  title varchar(180) not null,
  details text not null,
  quoted_amount numeric(12,2) check (quoted_amount is null or quoted_amount >= 0),
  payment_timing public.payment_timing not null default 'confirm_with_mtaamarket',
  fulfilment_method public.fulfilment_method not null default 'siaya_pickup',
  preferred_location varchar(180),
  source_route public.source_route not null default 'other',
  status public.assisted_order_status not null default 'recorded',
  platform_notes text,
  confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_profile_id uuid not null references public.marketplace_profiles(id) on delete cascade,
  order_item_id uuid not null unique references public.order_items(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  image_url text,
  created_at timestamptz not null default now()
);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  opened_by_profile_id uuid not null references public.marketplace_profiles(id),
  reason varchar(120) not null,
  details text not null,
  status public.dispute_status not null default 'open',
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.marketplace_profiles(id) on delete cascade,
  type public.notification_type not null,
  title varchar(180) not null,
  body text not null,
  order_id uuid references public.orders(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_profile_id uuid references public.marketplace_profiles(id) on delete set null,
  event_type varchar(80) not null,
  from_status varchar(48),
  to_status varchar(48),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.platform_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.marketplace_profiles(id) on delete set null,
  entity_type varchar(64) not null,
  entity_id uuid,
  event_type varchar(80) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index products_discovery_index on public.products (status, moderation_status, category_id, created_at desc);
create index products_vendor_index on public.products (vendor_id, status, created_at desc);
create index pickup_stations_location_index on public.pickup_stations (county, town, is_active);
create index orders_buyer_status_index on public.orders (buyer_profile_id, status, created_at desc);
create index orders_vendor_status_index on public.orders (vendor_id, status, created_at desc);
create index order_items_order_index on public.order_items (order_id);
create index item_requests_buyer_status_index on public.item_requests (buyer_profile_id, status, created_at desc);
create index item_requests_assisted_status_index on public.item_requests (is_assisted, status, created_at desc);
create index assisted_orders_status_index on public.assisted_orders (status, created_at desc);
create index assisted_orders_owner_index on public.assisted_orders (owner_profile_id, status, created_at desc);
create index assisted_orders_request_index on public.assisted_orders (item_request_id);
create index reviews_product_index on public.reviews (product_id, created_at desc);
create index notifications_profile_index on public.notifications (profile_id, is_read, created_at desc);
create index order_events_order_index on public.order_events (order_id, created_at desc);
create index platform_audit_events_entity_index on public.platform_audit_events (entity_type, entity_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger marketplace_profiles_set_updated_at before update on public.marketplace_profiles for each row execute function public.set_updated_at();
create trigger vendors_set_updated_at before update on public.vendors for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger carts_set_updated_at before update on public.carts for each row execute function public.set_updated_at();
create trigger cart_items_set_updated_at before update on public.cart_items for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger item_requests_set_updated_at before update on public.item_requests for each row execute function public.set_updated_at();
create trigger assisted_orders_set_updated_at before update on public.assisted_orders for each row execute function public.set_updated_at();
create trigger disputes_set_updated_at before update on public.disputes for each row execute function public.set_updated_at();

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.marketplace_profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

alter table public.marketplace_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.vendors enable row level security;
alter table public.products enable row level security;
alter table public.pickup_stations enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.item_requests enable row level security;
alter table public.assisted_orders enable row level security;
alter table public.reviews enable row level security;
alter table public.disputes enable row level security;
alter table public.notifications enable row level security;
alter table public.order_events enable row level security;
alter table public.platform_audit_events enable row level security;

create policy "profiles read self or admin" on public.marketplace_profiles for select to authenticated using (id = (select auth.uid()) or (select private.is_admin()));
create policy "profiles update self or admin" on public.marketplace_profiles for update to authenticated using (id = (select auth.uid()) or (select private.is_admin())) with check (id = (select auth.uid()) or (select private.is_admin()));
create policy "categories public read" on public.categories for select to anon, authenticated using (is_active = true);
create policy "vendors public read approved" on public.vendors for select to anon, authenticated using ((approval_status = 'approved' and is_active = true) or profile_id = (select auth.uid()) or (select private.is_admin()));
create policy "products public read discoverable" on public.products for select to anon, authenticated using (status = 'active' and moderation_status = 'visible');
create policy "pickup stations public read" on public.pickup_stations for select to anon, authenticated using (is_active = true);
create policy "carts read own" on public.carts for select to authenticated using (profile_id = (select auth.uid()));
create policy "cart items read own" on public.cart_items for select to authenticated using (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.profile_id = (select auth.uid())));
create policy "orders read buyer or admin" on public.orders for select to authenticated using (buyer_profile_id = (select auth.uid()) or (select private.is_admin()));
create policy "order items read buyer or admin" on public.order_items for select to authenticated using (exists (select 1 from public.orders where orders.id = order_items.order_id and (orders.buyer_profile_id = (select auth.uid()) or (select private.is_admin()))));
create policy "item requests read creator or admin" on public.item_requests for select to authenticated using (created_by_profile_id = (select auth.uid()) or (select private.is_admin()));
create policy "assisted orders admin only" on public.assisted_orders for select to authenticated using ((select private.is_admin()));
create policy "reviews public read" on public.reviews for select to anon, authenticated using (true);
create policy "disputes read opener or admin" on public.disputes for select to authenticated using (opened_by_profile_id = (select auth.uid()) or (select private.is_admin()));
create policy "notifications read own" on public.notifications for select to authenticated using (profile_id = (select auth.uid()));
create policy "order events read buyer or admin" on public.order_events for select to authenticated using (exists (select 1 from public.orders where orders.id = order_events.order_id and (orders.buyer_profile_id = (select auth.uid()) or (select private.is_admin()))));
create policy "audit events admin only" on public.platform_audit_events for select to authenticated using ((select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('catalogue-media', 'catalogue-media', true, 6291456, array['image/jpeg', 'image/png', 'image/webp']),
  ('marketplace-private', 'marketplace-private', false, 6291456, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "authenticated users upload own catalogue folder" on storage.objects for insert to authenticated with check (bucket_id = 'catalogue-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "authenticated users update own catalogue folder" on storage.objects for update to authenticated using (bucket_id = 'catalogue-media' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'catalogue-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "authenticated users delete own catalogue folder" on storage.objects for delete to authenticated using (bucket_id = 'catalogue-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "authenticated users access own private files" on storage.objects for select to authenticated using (bucket_id = 'marketplace-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "authenticated users upload own private folder" on storage.objects for insert to authenticated with check (bucket_id = 'marketplace-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "authenticated users update own private folder" on storage.objects for update to authenticated using (bucket_id = 'marketplace-private' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'marketplace-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "authenticated users delete own private folder" on storage.objects for delete to authenticated using (bucket_id = 'marketplace-private' and (storage.foldername(name))[1] = (select auth.uid())::text);

insert into public.categories (name, slug, icon, description, sort_order)
values
  ('Home & Kitchen', 'home-kitchen', 'Home', 'Home essentials, cookware, furnishings, and appliances.', 10),
  ('Phones & Electronics', 'phones-electronics', 'Smartphone', 'Phones, accessories, audio, computing, and household electronics.', 20),
  ('Fashion', 'fashion', 'Shirt', 'Clothing, footwear, bags, and original fashion items.', 30),
  ('Groceries & Pantry', 'groceries-pantry', 'ShoppingBasket', 'Packaged pantry items and everyday household essentials.', 40),
  ('Beauty & Personal Care', 'beauty-personal-care', 'Sparkles', 'Beauty, grooming, wellness, and personal-care products.', 50),
  ('Baby & Kids', 'baby-kids', 'Baby', 'Baby, child, school, and family products.', 60),
  ('Farm & Garden', 'farm-garden', 'Sprout', 'Farm inputs, garden items, and practical outdoor supplies.', 70),
  ('Building & Tools', 'building-tools', 'Hammer', 'Tools, hardware, building materials, and repair supplies.', 80),
  ('School & Office', 'school-office', 'BookOpen', 'Learning, stationery, and office essentials.', 90),
  ('Auto & Motorbike', 'auto-motorbike', 'Bike', 'Vehicle accessories, maintenance, and motorbike essentials.', 100)
on conflict (slug) do nothing;
