-- Add optional split-day window columns to shifts
ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS morning_end_time TIME,
  ADD COLUMN IF NOT EXISTS afternoon_start_time TIME;

-- Extend check_out_status constraint to allow 'absent_afternoon'
ALTER TABLE attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_check_out_status_check;
ALTER TABLE attendance_records
  ADD CONSTRAINT attendance_records_check_out_status_check
  CHECK (check_out_status IN ('on-time', 'early', 'absent_afternoon'));
