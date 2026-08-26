-- Applies only to mfgjpjtlmfdtsnkoluco (Siaya Online MtaaMarket).
alter table public.assisted_orders
  add column if not exists external_source_disclosure text,
  add column if not exists external_source_confirmed_at timestamptz;

alter table public.assisted_orders
  add constraint assisted_orders_external_marketplace_disclosure_check
  check (
    source_route <> 'external_marketplace'
    or (external_source_disclosure is not null and char_length(trim(external_source_disclosure)) >= 12 and external_source_confirmed_at is not null)
  ) not valid;

alter table public.assisted_orders
  validate constraint assisted_orders_external_marketplace_disclosure_check;
