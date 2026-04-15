-- Safe migration: add updated_at column to existing reports table
-- Run this once on existing databases. Safe to run multiple times.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reports' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE reports ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    -- Back-fill existing rows so updated_at matches created_at
    UPDATE reports SET updated_at = created_at WHERE updated_at = NOW();
    RAISE NOTICE 'updated_at column added to reports table';
  ELSE
    RAISE NOTICE 'updated_at column already exists, skipping';
  END IF;
END $$;
