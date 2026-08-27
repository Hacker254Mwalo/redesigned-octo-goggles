alter table public.profiles add column if not exists role text not null default 'buyer'
  check (role in ('buyer', 'vendor', 'admin'));

-- No browser role-assignment policy is created. Assign the first owner only via
-- a separately verified, server-side administrative procedure.
alter table public.profiles enable row level security;
