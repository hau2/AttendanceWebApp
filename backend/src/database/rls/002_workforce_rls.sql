-- RLS policies for Phase 2: Workforce Configuration
-- Run via Supabase SQL editor or supabase db push
-- Must be run AFTER migration 003_workforce_config.sql

-- Enable RLS on employee_shifts
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: users can only see employee_shifts for their own company
CREATE POLICY "employee_shifts_tenant_isolation"
  ON employee_shifts
  FOR ALL
  TO authenticated
  USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

-- Note: manager_id is a column on the existing users table.
-- The users table already has RLS enabled (see 001_rls_policies.sql).
-- No additional RLS policy is needed for the manager_id column.
