-- Migration 004: Attendance Records
-- Run via Supabase SQL editor

CREATE TABLE IF NOT EXISTS attendance_records (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id         UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_date          DATE NOT NULL,

  -- Check-in fields
  check_in_at        TIMESTAMPTZ,
  check_in_photo_url TEXT,
  check_in_ip        TEXT,
  check_in_status    TEXT CHECK (check_in_status IN ('on-time', 'within-grace', 'late')),
  minutes_late       INT NOT NULL DEFAULT 0,
  late_reason        TEXT,
  check_in_ip_within_allowlist BOOLEAN,

  -- Check-out fields
  check_out_at       TIMESTAMPTZ,
  check_out_photo_url TEXT,
  check_out_ip       TEXT,
  check_out_status   TEXT CHECK (check_out_status IN ('on-time', 'early')),
  minutes_early      INT NOT NULL DEFAULT 0,
  early_note         TEXT,
  check_out_ip_within_allowlist BOOLEAN,

  -- System status
  missing_checkout   BOOLEAN NOT NULL DEFAULT FALSE,
  source             TEXT NOT NULL DEFAULT 'employee' CHECK (source IN ('employee', 'system', 'admin')),

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One record per employee per work_date
  UNIQUE (user_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_company_id ON attendance_records(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_work_date ON attendance_records(work_date);
CREATE INDEX IF NOT EXISTS idx_attendance_company_work_date ON attendance_records(company_id, work_date);
