-- Governed V3 poultry and livestock listings.
-- No data seed, RLS policy, automated fulfilment, payment, or public-write change.

alter table public.products
  add column if not exists livestock_type text,
  add column if not exists livestock_details text,
  add column if not exists livestock_welfare_attested boolean not null default false,
  add column if not exists livestock_movement_acknowledged boolean not null default false;

alter table public.products
  drop constraint if exists products_v3_poultry_livestock_safeguards_check;

alter table public.products
  add constraint products_v3_poultry_livestock_safeguards_check
    check (
      category_slug <> 'poultry-livestock'
      or (
        livestock_type is not null
        and char_length(trim(livestock_type)) between 2 and 80
        and livestock_details is not null
        and char_length(trim(livestock_details)) between 10 and 500
        and livestock_welfare_attested = true
        and livestock_movement_acknowledged = true
        and allow_pay_on_pickup = false
      )
    );
