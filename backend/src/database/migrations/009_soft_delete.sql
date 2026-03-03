-- Migration 009: Add deleted_at column to users for soft-delete
-- Differentiates "deleted" (hidden from lists, history preserved) from
-- "disabled" (visible in lists but cannot log in).
-- deleted_at IS NOT NULL  → soft-deleted, excluded from all active user lists
-- deleted_at IS NULL + is_active = false → disabled, visible but inactive

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL DEFAULT NULL;

-- Index for efficient filtering in listUsers and manager-scoped queries
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
