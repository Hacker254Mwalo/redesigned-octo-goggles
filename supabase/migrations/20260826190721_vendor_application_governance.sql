-- MtaaMarket: protected vendor-application governance foundation.
-- Apply only to isolated project mfgjpjtlmfdtsnkoluco. This migration creates
-- no vendor role, no admin role, no public onboarding endpoint, and no listing write path.

do $$
begin
  create type public.vendor_application_status as enum (
    'draft',
    'submitted',
    'information_requested',
    'approved',
    'rejected',
    'withdrawn'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_profile_id uuid not null references public.marketplace_profiles(id) on delete cascade,
  business_name varchar(120) not null,
  proposed_store_name varchar(120) not null,
  service_area varchar(240) not null default 'Serves Siaya County',
  application_note text,
  original_content_acknowledged boolean not null default false,
  platform_mediation_acknowledged boolean not null default false,
  status public.vendor_application_status not null default 'draft',
  owner_notes text,
  reviewed_by_profile_id uuid references public.marketplace_profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_applications_required_attestations check (
    status = 'draft'
    or (original_content_acknowledged = true and platform_mediation_acknowledged = true)
  ),
  constraint vendor_applications_review_consistency check (
    (reviewed_at is null and reviewed_by_profile_id is null)
    or (reviewed_at is not null and reviewed_by_profile_id is not null)
  )
);

create unique index if not exists vendor_applications_one_open_per_applicant
  on public.vendor_applications (applicant_profile_id)
  where status in ('draft', 'submitted', 'information_requested', 'approved');

create index if not exists vendor_applications_review_queue_index
  on public.vendor_applications (status, created_at asc);

create index if not exists vendor_applications_applicant_index
  on public.vendor_applications (applicant_profile_id, updated_at desc);

drop trigger if exists vendor_applications_set_updated_at on public.vendor_applications;
create trigger vendor_applications_set_updated_at
  before update on public.vendor_applications
  for each row execute function public.set_updated_at();

alter table public.vendor_applications enable row level security;
revoke all on table public.vendor_applications from anon, authenticated;
grant select on table public.vendor_applications to authenticated;

drop policy if exists "vendor applications read self or admin" on public.vendor_applications;
create policy "vendor applications read self or admin"
  on public.vendor_applications
  for select
  to authenticated
  using (
    applicant_profile_id = (select auth.uid())
    or (select private.is_admin())
  );

-- There are intentionally no client INSERT, UPDATE, or DELETE grants/policies.
-- A later server-side, audited procedure may submit or review applications only
-- after the founder role binding, PostgreSQL procedure migration, and SQL policy tests pass.
