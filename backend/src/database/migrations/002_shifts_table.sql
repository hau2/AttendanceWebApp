-- Shifts table (minimal v1 schema — Phase 2 may add more columns)
CREATE TABLE IF NOT EXISTS shifts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  start_time  TIME NOT NULL,           -- e.g. 08:00
  end_time    TIME NOT NULL,           -- e.g. 17:00
  grace_period_minutes INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_company_id ON shifts(company_id);

-- RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shifts_tenant_isolation"
  ON shifts
  FOR ALL
  TO authenticated
  USING (company_id = (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid);
