-- MtaaMarket V3 core replacement.
-- Apply only to isolated project mfgjpjtlmfdtsnkoluco after the owner-confirmed
-- dependency inventory. This intentionally replaces the former products/orders
-- schema and cascades to direct dependent tables.

drop table if exists public.orders cascade;
drop table if exists public.products cascade;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone_number text unique,
  is_vendor boolean not null default false,
  is_vendor_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  vendor_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  image_url text not null,
  base_price numeric(10,2) not null check (base_price >= 0),
  final_price numeric(10,2) not null check (final_price >= 0),
  is_admin_concierge boolean not null default false,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACTIVE', 'REJECTED')),
  allow_pay_on_pickup boolean not null default true,
  constraint final_price_not_below_base_price check (final_price >= base_price)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  buyer_phone text not null,
  product_id uuid references public.products(id) on delete set null,
  amount numeric(10,2) not null check (amount >= 0),
  payment_method text check (payment_method in ('MPESA_STK', 'PAY_ON_PICKUP')),
  payment_status text not null default 'PENDING' check (payment_status in ('PENDING', 'PAID_HELD', 'DISBURSED', 'REFUNDED')),
  order_status text not null default 'PENDING_DROPOFF' check (order_status in ('PENDING_DROPOFF', 'RECEIVED_AT_HUB', 'COMPLETED', 'CANCELLED')),
  pickup_pin varchar(4) not null check (pickup_pin ~ '^[0-9]{4}$'),
  pickup_station text not null default 'Siaya Town collection point — confirm with MtaaMarket'
);

create index products_v3_public_active_index on public.products (status, created_at desc);
create index products_v3_vendor_index on public.products (vendor_id, created_at desc);
create index orders_v3_product_index on public.orders (product_id, created_at desc);

-- The replacement does not create public vendor, profile, order, payment, or
-- settlement writes. Service-side procedures remain the only future write path.
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.products from anon, authenticated;
grant select on table public.products to anon, authenticated;

create policy "v3 public active products read"
  on public.products
  for select
  to anon, authenticated
  using (status = 'ACTIVE');

-- No INSERT, UPDATE, or DELETE policies are created for these V3 core tables.
