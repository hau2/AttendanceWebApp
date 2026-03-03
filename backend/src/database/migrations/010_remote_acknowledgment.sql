-- Migration 010: Remote Work flag + Manager Acknowledgment columns
-- Run via Supabase SQL editor

ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS is_remote BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS remote_acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS remote_acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN attendance_records.is_remote IS 'True if employee selected Remote Work at check-in';
COMMENT ON COLUMN attendance_records.acknowledged_at IS 'When manager acknowledged a late/early-leave event';
COMMENT ON COLUMN attendance_records.acknowledged_by IS 'Manager user ID who acknowledged the late/early event';
COMMENT ON COLUMN attendance_records.remote_acknowledged_at IS 'When manager acknowledged a remote work check-in';
COMMENT ON COLUMN attendance_records.remote_acknowledged_by IS 'Manager user ID who acknowledged remote work';
