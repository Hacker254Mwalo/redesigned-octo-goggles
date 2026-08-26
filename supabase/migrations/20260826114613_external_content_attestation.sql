-- Applies only to mfgjpjtlmfdtsnkoluco (Siaya Online MtaaMarket).
alter table public.assisted_orders
  add column if not exists external_source_content_attested_at timestamptz;

alter table public.assisted_orders
  add constraint assisted_orders_external_marketplace_original_content_check
  check (
    source_route <> 'external_marketplace'
    or external_source_content_attested_at is not null
  ) not valid;

alter table public.assisted_orders
  validate constraint assisted_orders_external_marketplace_original_content_check;
