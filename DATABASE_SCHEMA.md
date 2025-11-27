# Database Schema Overview

This document describes the PostgreSQL schema that powers the reports application. It covers the purpose of each table, core columns, and how the records are linked together.

## Tables

### `users`
| Column | Type | Notes |
| --- | --- | --- |
| `telegram_id` | bigint (PK) | Unique Telegram identifier for each user. |
| `first_name` | text | Required display name. |
| `last_name` | text | Optional. |
| `username` | text | Optional Telegram username. |
| `photo_url` | text | Optional avatar URL. |
| `team_id` | uuid | References `teams.id`; nullable when a user is unassigned. |
| `role` | text | Application role (e.g. `admin`, `employee`). |
| `created_at` | timestamptz | Defaults to the insertion timestamp. |

### `templates`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid (PK) | Template identifier. |
| `name` | text | Display name shown in the UI. |
| `description` | text | Optional context for admins. |
| `questions` | jsonb | Structured definition describing each form field. |
| `created_at` | timestamptz | Defaults to the insertion timestamp. |
| `created_by` | bigint | References `users.telegram_id`; nullable for system templates. |

### `teams`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid (PK) | Team identifier. |
| `name` | text | Required unique team name. |
| `description` | text | Optional extra context. |
| `template_id` | uuid | Legacy field - kept for backward compatibility. |
| `created_at` | timestamptz | Defaults to the insertion timestamp. |
| `created_by` | bigint | References `users.telegram_id`; nullable for seeded teams. |

### `team_templates` (Junction Table)
| Column | Type | Notes |
| --- | --- | --- |
| `team_id` | uuid (PK) | References `teams.id`; ON DELETE CASCADE. |
| `template_id` | uuid (PK) | References `templates.id`; ON DELETE CASCADE. |
| `created_at` | timestamptz | Defaults to the insertion timestamp. |

This junction table enables many-to-many relationships between teams and templates, allowing:
- A team to have multiple templates assigned
- A template to be used by multiple teams
- Employees to choose which template to use when submitting reports

### `reports`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid (PK) | Report identifier. |
| `user_id` | bigint | References `users.telegram_id`; the author of the report. |
| `team_id` | uuid | References `teams.id`; the team receiving the report. |
| `template_id` | uuid | The template that shaped the form (no FK constraint - template may be deleted). |
| `title` | text | Human readable headline. |
| `answers` | jsonb | Form responses keyed by question id. |
| `template_data` | jsonb | Snapshot of the template at submission time. |
| `created_at` | timestamptz | Defaults to the insertion timestamp. |

### `template_sheet_registry`
| Column | Type | Notes |
| --- | --- | --- |
| `template_key` | text (PK) | Sanitized template identifier for Google Sheets. |
| `sheet_id` | bigint | The Google Sheets sheet ID for this template. |

This table maps templates to their corresponding Google Sheets tabs. Each template gets its own sheet for data organization.

## Relationships
- **Users → Teams**: `users.team_id` points to `teams.id`, allowing a user to belong to at most one team.
- **Users → Reports**: `reports.user_id` identifies the author; deleting a user should be done carefully to avoid orphaned reports.
- **Templates → Teams**: Through `team_templates` junction table; teams can have multiple templates assigned.
- **Templates → Reports**: `reports.template_id` shows which template was used, while `reports.template_data` preserves the template snapshot for historical accuracy.
- **Teams → Reports**: `reports.team_id` connects each report with the team that receives it.

## Template Management
- Templates are fully manageable through the admin UI
- Admins can create new templates by uploading JSON files
- Templates can be edited (name/description) and deleted
- When a template is deleted:
  - Existing reports keep their `template_data` snapshot
  - The template is removed from all team assignments
  - Google Sheets data remains intact
  - If a new template is created with the same ID, new reports go to that sheet

## Google Sheets Integration
- Each template has its own sheet tab in the configured Google Spreadsheet
- The `template_sheet_registry` table caches the mapping between templates and sheet IDs
- Sheet headers are dynamically created based on template fields
- Reports are appended with: Report ID, Submitted At, Team Name, User Name, and all template field values

## Lifecycle Highlights
1. **User joins**: a record is inserted into `users`, optionally tied to a team and role.
2. **Template management**: admins create templates that describe the questionnaire via JSON upload or the UI.
3. **Team setup**: teams can have multiple templates assigned via the junction table.
4. **Report submission**: employees select a template (if multiple are available), fill out the form, and submit. The report captures the author, team, template ID, answers, and a template snapshot.

## Notes
- All JSON fields should contain valid JSON data; use `jsonb` operators when querying.
- The `reports.template_id` FK constraint is removed to allow template deletion while preserving reports.
- UUIDs can be generated in the application layer or via PostgreSQL functions such as `gen_random_uuid()`.
