-- MtaaMarket: governed local Poultry & Livestock listings.
-- Apply only to the isolated MtaaMarket Supabase project.

do $$
begin
  create type public.product_listing_kind as enum ('standard', 'live_animal');
exception
  when duplicate_object then null;
end $$;

alter table public.products
  add column if not exists listing_kind public.product_listing_kind not null default 'standard',
  add column if not exists animal_type varchar(80),
  add column if not exists animal_details varchar(500),
  add column if not exists animal_welfare_attested boolean not null default false,
  add column if not exists movement_requirements_acknowledged boolean not null default false;

alter table public.products
  drop constraint if exists products_live_animal_required_details;

alter table public.products
  add constraint products_live_animal_required_details check (
    listing_kind <> 'live_animal'
    or (
      animal_type is not null
      and length(trim(animal_type)) >= 2
      and animal_welfare_attested = true
      and movement_requirements_acknowledged = true
      and payment_timing = 'confirm_with_mtaamarket'
      and status = 'draft'
    )
  );

create index if not exists products_listing_kind_index
  on public.products (listing_kind, status, moderation_status, created_at desc);

insert into public.categories (name, slug, icon, description, sort_order)
values (
  'Poultry & Livestock',
  'poultry-livestock',
  'Beef',
  'Owner-approved local poultry and livestock listings with manual welfare and collection checks.',
  75
)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;
