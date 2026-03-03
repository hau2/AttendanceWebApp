-- Migration 008: Employee Lifecycle + Per-User Timezone
-- Run via Supabase SQL editor before testing Phase 7 endpoints
-- Adds: users.timezone nullable column for per-employee timezone override

-- Add timezone override column to users table.
-- NULL = use company timezone (existing behavior preserved).
-- Non-null = use this IANA timezone string for late/early classification.
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Sparse index — only rows where timezone is set
CREATE INDEX IF NOT EXISTS idx_users_timezone ON users(timezone) WHERE timezone IS NOT NULL;

-- NOTE: Employee "delete" behavior (EMPL-01/EMPL-02)
-- Architecture decision: employee delete is a soft-delete, not a hard DB delete.
-- Implementation:
--   1. Delete the Supabase Auth user (revokes login access immediately)
--   2. Set is_active = false on the public.users row (removes from active employee lists)
--   3. The public.users ROW IS RETAINED — so attendance_records.user_id can still
--      JOIN to users and display the employee's full_name in historical reports.
--
-- This means attendance_records.user_id FK (ON DELETE CASCADE from migration 004)
-- is never triggered — the users row remains in place indefinitely.
-- Historical attendance data is always preserved and attributable by name.
