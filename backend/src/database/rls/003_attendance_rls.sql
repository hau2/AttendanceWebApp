-- RLS for attendance_records: tenant isolation
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_tenant_isolation"
  ON attendance_records
  FOR ALL
  TO authenticated
  USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);
