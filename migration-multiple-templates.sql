-- Migration: Multiple Templates Per Team
-- This migration adds support for assigning multiple templates to a team

BEGIN;

-- Step 1: Create junction table for team-template many-to-many relationship
CREATE TABLE IF NOT EXISTS team_templates (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, template_id)
);

CREATE INDEX idx_team_templates_team_id ON team_templates(team_id);
CREATE INDEX idx_team_templates_template_id ON team_templates(template_id);

-- Step 2: Migrate existing team template assignments to junction table
-- Only insert if the team has a template assigned
INSERT INTO team_templates (team_id, template_id)
SELECT id, template_id
FROM teams
WHERE template_id IS NOT NULL
ON CONFLICT (team_id, template_id) DO NOTHING;

-- Step 3: Drop the old template_id column from teams table
-- Commented out for safety - uncomment after verifying data migration
-- ALTER TABLE teams DROP COLUMN IF EXISTS template_id;

COMMIT;

-- IMPORTANT: After running this migration:
-- 1. Verify data in team_templates table matches expectations
-- 2. Update application code to use new junction table
-- 3. Uncomment and run the DROP COLUMN statement above
