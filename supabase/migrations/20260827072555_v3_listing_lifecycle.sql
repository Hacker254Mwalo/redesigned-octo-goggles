alter table public.products drop constraint if exists products_status_check;
alter table public.products add constraint products_status_check check (status in ('PENDING', 'ACTIVE', 'REJECTED', 'FLAGGED'));
alter table public.profiles add column if not exists vendor_agreement_accepted_at timestamptz;
