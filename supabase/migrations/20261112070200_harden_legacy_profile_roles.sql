-- Prevent browser JWT roles from inserting or changing legacy account roles.
-- The current application writes this table from its trusted server/service-role client.

REVOKE ALL PRIVILEGES ON TABLE public.marketplace_profiles FROM PUBLIC, anon, authenticated;

-- Revoke separately granted column permissions as well as table-level grants.
DO $$
DECLARE
  grant_row record;
  grantee_sql text;
BEGIN
  FOR grant_row IN
    SELECT DISTINCT grantee, privilege_type, column_name
    FROM information_schema.column_privileges
    WHERE table_schema = 'public'
      AND table_name = 'marketplace_profiles'
      AND grantee IN ('PUBLIC', 'anon', 'authenticated')
      AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'REFERENCES')
  LOOP
    grantee_sql := CASE
      WHEN grant_row.grantee = 'PUBLIC' THEN 'PUBLIC'
      ELSE quote_ident(grant_row.grantee)
    END;
    EXECUTE format(
      'REVOKE %s (%I) ON TABLE public.marketplace_profiles FROM %s',
      grant_row.privilege_type,
      grant_row.column_name,
      grantee_sql
    );
  END LOOP;
END $$;

-- Keep existing authenticated account reads; server/service-role writes are unchanged.
GRANT SELECT ON TABLE public.marketplace_profiles TO authenticated;

-- Even if DML is later granted accidentally, the old self-update policy must not allow
-- a user to set their own role and then satisfy private.is_admin().
DROP POLICY IF EXISTS "profiles update self or admin" ON public.marketplace_profiles;
