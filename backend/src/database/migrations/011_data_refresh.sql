-- Migration 011: Data Refresh support
-- Extends check_in_status to include 'absent' and 'absent_morning' status values
-- Adds last_refresh_at to companies for tracking manual refresh runs

-- Step 1: Drop existing check_in_status CHECK constraint
-- (constraint name from migration 004: attendance_records_check_in_status_check)
ALTER TABLE attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_check_in_status_check;

-- Step 2: Re-add constraint with new values
ALTER TABLE attendance_records
  ADD CONSTRAINT attendance_records_check_in_status_check
  CHECK (check_in_status IN ('on-time', 'within-grace', 'late', 'absent', 'absent_morning'));

-- Step 3: Add last_refresh_at to companies (nullable — NULL means never run)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS last_refresh_at TIMESTAMPTZ;

COMMENT ON COLUMN attendance_records.check_in_status IS 'Check-in classification: on-time, within-grace, late, absent, absent_morning';
COMMENT ON COLUMN companies.last_refresh_at IS 'Timestamp of last manual Data Refresh run by Admin';
