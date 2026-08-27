-- The active V3 identity helpers use public.profiles, not the legacy marketplace_profiles table.
alter table public.jumia_orders
  drop constraint if exists jumia_orders_buyer_profile_id_fkey;

alter table public.jumia_orders
  add constraint jumia_orders_buyer_profile_id_fkey
  foreign key (buyer_profile_id) references public.profiles(id) on delete cascade;
