-- Migration 005b: Supabase Storage RLS policies for attendance-photos bucket
-- Run in Supabase SQL editor AFTER creating the attendance-photos bucket.
--
-- NOTE: These policies are required for createSignedUploadUrl to work,
-- even when called with the service-role key.

-- Allow authenticated users to upload photos to the bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attendance-photos');

-- Allow authenticated users to read photos from the bucket
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'attendance-photos');

-- Allow authenticated users to delete photos (e.g. retakes)
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attendance-photos');

-- IMPORTANT: Also set the bucket to Public in Supabase Dashboard
-- (Storage → attendance-photos → Edit → Public: ON)
-- This allows <img src="..."> tags to load photos directly using the
-- /storage/v1/object/public/ URL format stored in attendance_records.
