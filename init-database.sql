-- SQLite Database Schema for Reports System
-- Fresh start - delete and recreate everything

-- Drop existing tables if they exist
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS templates;

-- Create users table
CREATE TABLE users (
    telegram_id INTEGER PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT,
    username TEXT,
    photo_url TEXT,
    team_id TEXT,
    role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create templates table
CREATE TABLE templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    questions JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (created_by) REFERENCES users (telegram_id)
);

-- Create teams table
CREATE TABLE teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (template_id) REFERENCES templates (id),
    FOREIGN KEY (created_by) REFERENCES users (telegram_id)
);

-- Create reports table (simplified - no status, priority, category)
CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    team_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    title TEXT NOT NULL,
    answers JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (telegram_id),
    FOREIGN KEY (team_id) REFERENCES teams (id),
    FOREIGN KEY (template_id) REFERENCES templates (id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_teams_template_id ON teams(template_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_team_id ON reports(team_id);
CREATE INDEX idx_reports_template_id ON reports(template_id);
CREATE INDEX idx_reports_created_at ON reports(created_at);