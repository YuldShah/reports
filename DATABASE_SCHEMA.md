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
| `template_id` | uuid | References `templates.id`; nullable if the team has no template. |
| `created_at` | timestamptz | Defaults to the insertion timestamp. |
| `created_by` | bigint | References `users.telegram_id`; nullable for seeded teams. |

### `reports`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid (PK) | Report identifier. |
| `user_id` | bigint | References `users.telegram_id`; the author of the report. |
| `team_id` | uuid | References `teams.id`; the team receiving the report. |
| `template_id` | uuid | References `templates.id`; the template that shaped the form. |
| `title` | text | Human readable headline. |
| `answers` | jsonb | Form responses keyed by question id. |
| `template_data` | jsonb | Snapshot of the template at submission time. |
| `created_at` | timestamptz | Defaults to the insertion timestamp. |

## Relationships
- **Users → Teams**: `users.team_id` points to `teams.id`, allowing a user to belong to at most one team.
- **Users → Reports**: `reports.user_id` identifies the author; deleting a user should be done carefully to avoid orphaned reports.
- **Templates → Teams**: `teams.template_id` links a team to the template chosen by an admin.
- **Templates → Reports**: `reports.template_id` shows which template was used, while `reports.template_data` preserves the template snapshot for historical accuracy.
- **Teams → Reports**: `reports.team_id` connects each report with the team that receives it.

## Lifecycle Highlights
1. **User joins**: a record is inserted into `users`, optionally tied to a team and role.
2. **Template management**: admins create templates that describe the questionnaire (`templates.questions`).
3. **Team setup**: teams reference a preferred template, enabling custom forms per team.
4. **Report submission**: when an employee submits a form, a `reports` row captures the author, the team, the associated template, and the answers.

## Notes
- All JSON fields should contain valid JSON data; use `jsonb` operators when querying.
- Foreign keys are enforced by PostgreSQL; deleting referenced rows requires either cascading rules or manual cleanup.
- UUIDs can be generated in the application layer or via PostgreSQL functions such as `gen_random_uuid()`.
