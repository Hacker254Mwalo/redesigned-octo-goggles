-- Apply 20260826_005_vendor_application_governance.sql before running.
-- Run with `supabase test db` in an isolated local/branch database.

begin;
select plan(8);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'vendor-applicant@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'unrelated-user@example.test');

insert into public.marketplace_profiles (id, display_name, role)
values
  ('11111111-1111-1111-1111-111111111111', 'Vendor Applicant', 'buyer'),
  ('22222222-2222-2222-2222-222222222222', 'Unrelated User', 'buyer');

insert into public.vendor_applications (
  applicant_profile_id,
  business_name,
  proposed_store_name,
  original_content_acknowledged,
  platform_mediation_acknowledged,
  status
)
values (
  '11111111-1111-1111-1111-111111111111',
  'Siaya Goods',
  'Siaya Goods Shop',
  true,
  true,
  'submitted'
);

select ok(
  not has_table_privilege('anon', 'public.vendor_applications', 'select,insert,update,delete'),
  'anon holds no vendor-application grant'
);

select ok(
  has_table_privilege('authenticated', 'public.vendor_applications', 'select')
  and not has_table_privilege('authenticated', 'public.vendor_applications', 'insert,update,delete'),
  'authenticated users have read-only table grants'
);

set local role anon;
select throws_ok(
  $$select * from public.vendor_applications$$,
  '42501',
  null,
  'anon cannot read vendor applications'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$select proposed_store_name from public.vendor_applications order by created_at$$,
  array['Siaya Goods Shop'::varchar],
  'applicant reads only their own application'
);

select throws_ok(
  $$insert into public.vendor_applications (applicant_profile_id, business_name, proposed_store_name) values ('11111111-1111-1111-1111-111111111111', 'Bypass', 'Bypass Shop')$$,
  '42501',
  null,
  'applicant cannot self-submit through an unreviewed client path'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is_empty(
  $$select * from public.vendor_applications$$,
  'unrelated authenticated user reads no application'
);

select throws_ok(
  $$update public.vendor_applications set status = 'approved'$$,
  '42501',
  null,
  'unrelated authenticated user cannot approve an application'
);

select results_eq(
  $$select status::text from public.vendor_applications where applicant_profile_id = '11111111-1111-1111-1111-111111111111'$$,
  array['submitted'::text],
  'blocked approval leaves the application unchanged'
);

select * from finish();
rollback;
