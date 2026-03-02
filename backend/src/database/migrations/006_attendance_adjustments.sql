-- Migration 006: Attendance Adjustments Audit Table
-- Run via Supabase SQL editor

CREATE TABLE IF NOT EXISTS attendance_adjustments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id    UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  adjusted_by  UUID NOT NULL REFERENCES users(id),
  field_name   TEXT NOT NULL,         -- 'check_in_at' or 'check_out_at'
  old_value    TEXT,                  -- ISO timestamp string or null
  new_value    TEXT NOT NULL,         -- ISO timestamp string
  reason       TEXT NOT NULL,
  adjusted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adjustments_record_id  ON attendance_adjustments(record_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_company_id ON attendance_adjustments(company_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_adjusted_by ON attendance_adjustments(adjusted_by);
