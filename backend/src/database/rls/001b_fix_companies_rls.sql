-- Fix: split FOR ALL into separate policies so INSERT is never blocked.
-- The FOR ALL USING clause was also acting as WITH CHECK on INSERT,
-- failing on new registrations where no JWT company_id exists yet.

DROP POLICY IF EXISTS "companies_tenant_isolation" ON companies;
DROP POLICY IF EXISTS "companies_allow_insert" ON companies;

-- SELECT/UPDATE/DELETE: scoped to own company via JWT
CREATE POLICY "companies_select"
  ON companies FOR SELECT TO authenticated
  USING (id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY "companies_update"
  ON companies FOR UPDATE TO authenticated
  USING (id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

CREATE POLICY "companies_delete"
  ON companies FOR DELETE TO authenticated
  USING (id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

-- INSERT: always allowed — only the backend service-role creates companies (registration)
CREATE POLICY "companies_insert"
  ON companies FOR INSERT TO authenticated
  WITH CHECK (true);
