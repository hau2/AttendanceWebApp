-- Run via Supabase SQL editor or supabase db push

-- Enable RLS on all tenant tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Helper: extract company_id from JWT claims
-- The app must set app.company_id claim in the JWT (set by backend when signing tokens)
-- For Supabase service-role operations, RLS is bypassed — only anon/authenticated roles are restricted

-- companies: users can only see their own company
CREATE POLICY "companies_tenant_isolation"
  ON companies
  FOR ALL
  TO authenticated
  USING (id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);

-- users: can only see users in the same company
CREATE POLICY "users_tenant_isolation"
  ON users
  FOR ALL
  TO authenticated
  USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);
