-- =====================================================
-- Rename "mitra" to "staff" in user roles
-- Migration: phase 1 of role restructuring
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

BEGIN;

-- 1. Update any legacy "mitra" role references to "staff"
UPDATE public.users
SET role = 'staff'
WHERE role = 'mitra';

-- 2. Update trigger that sets default role to 'staff' (already correct in schema)
-- No changes needed if trigger already uses 'staff'

-- 3. Update deposits that might reference mitra role (commented - not needed if no mitra in deposits)
-- This migration ensures all existing users with 'mitra' role are converted to 'staff'

-- 4. Verify the change
SELECT role, COUNT(*) as count
FROM public.users
GROUP BY role
ORDER BY role;

COMMIT;
