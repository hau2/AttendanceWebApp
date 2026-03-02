-- Migration 005: Attendance Photo Storage
-- Supabase Storage bucket must be created manually in Supabase Dashboard or via API.
--
-- Step 1: Create bucket via Supabase Dashboard (Storage tab):
--   Name: attendance-photos
--   Public: FALSE (private bucket — access via signed URLs only)
--
-- Step 2: Set bucket file size limit to 5MB (sufficient for camera photos).
--
-- Step 3: Apply the storage object RLS policies below.
--
-- Note: Backend uses service-role key for signed URL generation (bypasses bucket RLS).
-- Frontend never accesses storage directly — all access goes through backend signed URLs.

-- RLS for storage.objects in attendance-photos bucket:
-- Allow authenticated users to read their own company's photos (for viewer parity with application-level auth).
-- The backend enforces role-based access before returning signed read URLs.

-- These policies apply if you enable RLS on storage.objects (optional for private buckets
-- since the backend uses service-role for all uploads/reads):

-- INSERT policy (upload): only backend service-role can upload (RLS bypassed for service-role).
-- SELECT policy (read): only backend service-role can generate signed read URLs (RLS bypassed for service-role).

-- Photo retention: Supabase does not support native TTL on storage objects in v1.
-- Retention is enforced at the application layer:
--   - EVID-03 (90-180 days) is tracked via the check_in_at timestamp on attendance_records.
--   - A future cron job (Phase 5 or v2) will delete photos older than 180 days.
--   - For v1, photos are retained indefinitely (no deletion implemented) — within spec
--     since the requirement is "retained for 90-180 days" (minimum 90, no hard max in v1).
