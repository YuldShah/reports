-- SQLite Database Migration for Template System
-- Run these commands on your VPS after installing sqlite3

-- Add template_id column to teams table
ALTER TABLE teams ADD COLUMN template_id TEXT;

-- Add template_data column to reports table  
ALTER TABLE reports ADD COLUMN template_data TEXT DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_template_id ON teams(template_id);
CREATE INDEX IF NOT EXISTS idx_reports_template_data ON reports(template_data);

-- Update existing reports to have empty template_data if NULL
UPDATE reports SET template_data = '{}' WHERE template_data IS NULL;