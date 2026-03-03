-- RLS policies for Phase 6: Division Architecture
-- Run via Supabase SQL editor AFTER migration 007_divisions.sql
-- Note: division_id is a column on the users table.
-- The users table already has RLS enabled (see 001_rls_policies.sql).
-- No additional RLS policy is needed for the division_id column.

-- Enable RLS on the divisions table
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy: users can only read/write their own company's divisions
CREATE POLICY "divisions_tenant_isolation"
  ON divisions
  FOR ALL
  TO authenticated
  USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);
