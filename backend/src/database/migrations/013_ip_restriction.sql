-- Migration 013: IP Restriction Phase 11
-- Adds 'disabled' mode, ip_violation flag, and JSONB allowlist with labels

-- Step 1: Extend ip_mode CHECK constraint to include 'disabled'
ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_ip_mode_check;
ALTER TABLE companies
  ADD CONSTRAINT companies_ip_mode_check
  CHECK (ip_mode IN ('disabled', 'log-only', 'enforce-block'));

-- Step 2: Add ip_violation column to attendance_records
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS ip_violation BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 3: Change ip_allowlist from TEXT[] to JSONB
-- Existing rows: empty TEXT[] '{}' converts to '[]'::jsonb
ALTER TABLE companies
  ALTER COLUMN ip_allowlist DROP DEFAULT;
ALTER TABLE companies
  ALTER COLUMN ip_allowlist TYPE JSONB
  USING (
    CASE
      WHEN ip_allowlist = '{}' THEN '[]'::jsonb
      ELSE to_jsonb(ip_allowlist)
    END
  );
ALTER TABLE companies
  ALTER COLUMN ip_allowlist SET DEFAULT '[]'::jsonb;
ALTER TABLE companies
  ALTER COLUMN ip_allowlist SET NOT NULL;

COMMENT ON COLUMN companies.ip_mode IS 'IP restriction mode: disabled (no check), log-only (flag violation), enforce-block (block non-matching)';
COMMENT ON COLUMN companies.ip_allowlist IS 'JSONB array of {cidr: string, label?: string} entries';
COMMENT ON COLUMN attendance_records.ip_violation IS 'true when check-in/out IP was outside allowlist in log-only mode';
