-- Migration 007: Division Architecture
-- Run via Supabase SQL editor before testing Division endpoints
-- Adds: divisions table, users.division_id FK column

-- Create the divisions table
CREATE TABLE IF NOT EXISTS divisions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  manager_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- Indexes for divisions table
CREATE INDEX IF NOT EXISTS idx_divisions_company_id ON divisions(company_id);
CREATE INDEX IF NOT EXISTS idx_divisions_manager_id ON divisions(manager_id);

-- Add division_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES divisions(id) ON DELETE SET NULL;

-- Index for users.division_id
CREATE INDEX IF NOT EXISTS idx_users_division_id ON users(division_id);
