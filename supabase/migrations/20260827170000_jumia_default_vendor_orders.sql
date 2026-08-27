-- Jumia is a platform-managed default fulfilment channel, not a vendor listing.
-- Customers can place an unpaid order; the founder fulfils it through JForce.

create table if not exists public.jumia_orders (
  id uuid primary key default gen_random_uuid(),
  order_number varchar(40) not null unique,
  buyer_profile_id uuid not null references public.marketplace_profiles(id) on delete cascade,
  customer_name varchar(120) not null,
  customer_phone varchar(20) not null,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  fulfilment_method public.fulfilment_method not null default 'siaya_pickup',
  payment_timing public.payment_timing not null default 'pay_on_collection',
  payment_status text not null default 'not_due' check (payment_status in ('not_due', 'paid', 'refunded')),
  status text not null default 'placed' check (status in ('placed', 'confirming', 'accepted', 'sourcing', 'ready', 'out_for_delivery', 'completed', 'cancelled')),
  preferred_location varchar(180),
  delivery_schedule varchar(120),
  order_note text,
  quoted_amount numeric(12,2) check (quoted_amount is null or quoted_amount >= 0),
  owner_notes text,
  cancellation_reason varchar(600),
  confirmed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jumia_orders_method_timing_check check (
    (fulfilment_method = 'home_delivery' and payment_timing = 'pay_on_delivery')
    or (fulfilment_method <> 'home_delivery' and payment_timing = 'pay_on_collection')
  )
);

create index if not exists jumia_orders_buyer_status_index on public.jumia_orders (buyer_profile_id, status, created_at desc);
create index if not exists jumia_orders_status_index on public.jumia_orders (status, created_at asc);

drop trigger if exists jumia_orders_set_updated_at on public.jumia_orders;
create trigger jumia_orders_set_updated_at
  before update on public.jumia_orders
  for each row execute function public.set_updated_at();

alter table public.jumia_orders enable row level security;
revoke all on table public.jumia_orders from anon, authenticated;

create policy "jumia orders read by buyer or owner"
  on public.jumia_orders
  for select
  to authenticated
  using (buyer_profile_id = (select auth.uid()) or (select private.is_admin()));

comment on table public.jumia_orders is 'Customer orders placed through the MtaaMarket default Jumia-assisted fulfilment channel; supplier fulfilment remains founder-managed.';
