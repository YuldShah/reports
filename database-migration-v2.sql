-- PostgreSQL Database Migration for Multi-Template Support
-- This migration adds support for teams having multiple templates

BEGIN;

-- Create team_templates junction table for many-to-many relationship
-- Teams can now have multiple templates assigned
CREATE TABLE IF NOT EXISTS team_templates (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, template_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_team_templates_team_id ON team_templates(team_id);
CREATE INDEX IF NOT EXISTS idx_team_templates_template_id ON team_templates(template_id);

-- Migrate existing team-template relationships to junction table
-- This preserves any existing single template assignments
INSERT INTO team_templates (team_id, template_id)
SELECT id, template_id FROM teams 
WHERE template_id IS NOT NULL
ON CONFLICT (team_id, template_id) DO NOTHING;

-- Note: We keep the template_id column in teams for backward compatibility during transition
-- It can be dropped in a future migration after confirming everything works

-- Update reports table to remove template_id foreign key constraint
-- This allows reports to keep their template reference even if the template is deleted
-- The template_data column already stores a snapshot, so historical accuracy is preserved
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_template_id_fkey;

COMMIT;
