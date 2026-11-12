-- Record a three-working-day refund window when a paid Jumia order is cancelled.
alter table public.jumia_orders
  add column if not exists refund_due_at timestamptz,
  add column if not exists refund_completed_at timestamptz;

alter table public.jumia_orders
  drop constraint if exists jumia_orders_payment_status_check;

alter table public.jumia_orders
  add constraint jumia_orders_payment_status_check
  check (payment_status in ('not_due', 'paid', 'refund_due', 'refunded'));
