-- Migration: Add is_student_tracker column to templates table
-- Run this on the VPS database before deploying the new code

BEGIN;

ALTER TABLE templates
ADD COLUMN IF NOT EXISTS is_student_tracker BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
