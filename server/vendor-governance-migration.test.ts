import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(process.cwd(), "supabase/migrations/20260826190721_vendor_application_governance.sql");

function migrationSql() {
  return readFileSync(migrationPath, "utf8").toLowerCase();
}

describe("vendor application governance migration", () => {
  it("creates only an owner-governed application record, never a self-assigned marketplace role", () => {
    const sql = migrationSql();

    expect(sql).toContain("create table if not exists public.vendor_applications");
    expect(sql).toContain("original_content_acknowledged boolean not null default false");
    expect(sql).toContain("platform_mediation_acknowledged boolean not null default false");
    expect(sql).not.toContain("update public.marketplace_profiles set role = 'vendor'");
    expect(sql).not.toContain("update public.marketplace_profiles set role = 'admin'");
  });

  it("uses explicit read-only client grants and RLS while protected onboarding is inactive", () => {
    const sql = migrationSql();

    expect(sql).toContain("alter table public.vendor_applications enable row level security");
    expect(sql).toContain("revoke all on table public.vendor_applications from anon, authenticated");
    expect(sql).toContain("grant select on table public.vendor_applications to authenticated");
    expect(sql).toContain("vendor applications read self or admin");
    expect(sql).toContain("applicant_profile_id = (select auth.uid())");
    expect(sql).not.toContain("grant insert on table public.vendor_applications to authenticated");
    expect(sql).not.toContain("grant update on table public.vendor_applications to authenticated");
  });

  it("ships a database allow-and-deny policy test for the migration gate", () => {
    const policyTest = readFileSync(
      resolve(process.cwd(), "supabase/tests/vendor_applications_rls.test.sql"),
      "utf8",
    ).toLowerCase();

    expect(policyTest).toContain("select plan(8)");
    expect(policyTest).toContain("anon cannot read vendor applications");
    expect(policyTest).toContain("applicant cannot self-submit through an unreviewed client path");
    expect(policyTest).toContain("unrelated authenticated user cannot approve an application");
  });
});
