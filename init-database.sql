-- PostgreSQL Database Schema for Reports System
-- Fresh start - delete and recreate everything

BEGIN;

-- Drop tables in dependency order
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS templates;
DROP TABLE IF EXISTS users;

-- Users capture Telegram accounts connecting to the system
CREATE TABLE users (
    telegram_id BIGINT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT,
    username TEXT,
    photo_url TEXT,
    team_id UUID,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Templates define the dynamic questions shown in report forms
CREATE TABLE templates (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by BIGINT REFERENCES users(telegram_id)
);

-- Teams group users and optionally enforce a report template
CREATE TABLE teams (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_id UUID REFERENCES templates(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by BIGINT REFERENCES users(telegram_id)
);

-- Reports store submitted answers along with a template snapshot
CREATE TABLE reports (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(telegram_id),
    team_id UUID NOT NULL REFERENCES teams(id),
    template_id UUID NOT NULL REFERENCES templates(id),
    title TEXT NOT NULL,
    answers JSONB NOT NULL,
    template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Useful indexes for common queries
CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_teams_template_id ON teams(template_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_team_id ON reports(team_id);
CREATE INDEX idx_reports_template_id ON reports(template_id);
CREATE INDEX idx_reports_created_at ON reports(created_at);

COMMIT;