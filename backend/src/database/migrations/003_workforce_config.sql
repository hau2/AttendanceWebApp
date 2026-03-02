-- Migration 003: Workforce Configuration
-- Run via Supabase SQL editor or supabase db push

-- Add manager_id column to users table (self-referential FK)
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for fast manager_id lookups
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

-- Employee shift assignments table
-- Tracks which shift is assigned to which employee, effective from a given date.
-- One assignment per user per effective_date (UNIQUE constraint).
-- The shift_id references the shifts table from migration 002.
CREATE TABLE IF NOT EXISTS employee_shifts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_id       UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, effective_date)  -- prevents duplicate assignments on same date
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_employee_shifts_company_id ON employee_shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_user_id ON employee_shifts(user_id);
