# Multiple Templates Per Team - Implementation Summary

## Overview

Successfully implemented support for multiple templates per team with admin template management capabilities.

## Changes Implemented

### 1. Database Schema Changes

**New Junction Table**: `team_templates`
- Enables many-to-many relationship between teams and templates
- Fields: `team_id`, `template_id`, `assigned_at`
- Cascade deletes when team or template is deleted

**Migration Files Created**:
- `migration-multiple-templates.sql` - Creates junction table and migrates existing data
- `migrate-templates-to-db.sql` - Inserts hardcoded templates into database

### 2. Database Layer (`lib/database.ts`)

**Updated**:
- `Team` interface: Changed `templateId` → `templateIds` (array)
- `getAllTeams()`: Now joins with `team_templates` to fetch all template IDs
- `getTeamById()`: Includes template IDs from junction table

**New Functions**:
- `assignTemplatesToTeam(teamId, templateIds[])` - Assigns multiple templates to a team
- `addTemplateToTeam(teamId, templateId)` - Adds single template to team
- `removeTemplateFromTeam(teamId, templateId)` - Removes single template from team
- `getTemplatesByTeam(teamId)` - Fetches all templates for a team

### 3. API Routes

**`/api/templates`** - Completely Rewritten:
- `GET` - Fetch all templates from database
- `POST` - Create new template (supports JSON upload)
- `PATCH` - Update existing template
- `DELETE` - Delete template (allows deletion even if reports exist)

**`/api/teams`** - Updated PATCH:
- Now accepts `templateIds` array instead of single `templateId`
- Validates all template IDs before assignment
- Uses `assignTemplatesToTeam()` function

### 4. Admin UI Components

**New Component**: `components/template-management.tsx`
- List all templates with details
- Create new templates manually or via JSON upload
- View template questions (JSON format)
- Delete templates with confirmation
- Integrated into Admin Dashboard as new "Templates" tab

**Updated**: `components/admin-dashboard.tsx`
- Added 5th tab for "Templates"
- Updated grid layout from 4 to 5 columns

**Updated**: `components/team-management.tsx`
- Changed from single-select dropdown to multi-select checkbox interface
- Displays all assigned templates as badges
- Updated API calls to send array of template IDs

### 5. Employee UI Components

**Updated**: `components/employee-dashboard.tsx`
- Added template selection screen before report creation
- Fetches and displays templates assigned to user's team
- Users select template before filling out report
- Template ID passed to ReportForm component

**Report Form Integration**:
- Added `templateId` prop to ReportForm
- Template selection is required before report creation

## Deployment Instructions

### Step 1: Backup Database
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Run Database Migrations

```bash
# Set your database URL
export DATABASE_URL="your_postgres_connection_string"

# Create junction table and migrate existing data
psql $DATABASE_URL < migration-multiple-templates.sql

# Insert static templates into database
psql $DATABASE_URL < migrate-templates-to-db.sql

# IMPORTANT: After verifying data, uncomment the DROP COLUMN line in
# migration-multiple-templates.sql and run again to remove old template_id column
```

### Step 3: Verify Migration

```sql
-- Check junction table
SELECT * FROM team_templates;

-- Check templates table
SELECT id, name, created_at FROM templates;

-- Verify teams have templateIds
SELECT t.id, t.name,
  json_agg(tt.template_id) as template_ids
FROM teams t
LEFT JOIN team_templates tt ON t.id = tt.team_id
GROUP BY t.id;
```

### Step 4: Install Dependencies (if needed)
```bash
bun install
```

### Step 5: Build and Deploy
```bash
bun run build
bun run start
```

## Key Features

### For Admins

1. **Template Management**
   - View all templates
   - Create templates manually or upload JSON
   - Delete templates (existing reports keep their snapshot)
   - Templates are now database-managed, not hardcoded

2. **Team Template Assignment**
   - Assign multiple templates to each team
   - Multi-select checkbox interface
   - Visual display of all assigned templates

### For Employees

1. **Template Selection**
   - See all templates assigned to their team
   - Choose template before creating report
   - Clear template descriptions and field counts
   - Cannot create reports without selecting a template

### For System

1. **Template Flexibility**
   - Templates stored in database, fully manageable
   - Reports keep template snapshot for historical accuracy
   - Sheets remain organized per-template
   - Deleting templates doesn't affect existing reports

## JSON Template Format

When uploading templates via JSON, use this format:

```json
{
  "name": "Template Name",
  "description": "Template description (optional)",
  "questions": [
    {
      "id": "field_id",
      "label": "Question label",
      "type": "text|number|date|textarea|select",
      "required": true,
      "placeholder": "Placeholder text",
      "options": [
        {"value": "val1", "label": "Label 1"},
        {"value": "val2", "label": "Label 2"}
      ],
      "validation": {"min": 0, "max": 100}
    }
  ]
}
```

## Testing Checklist

- [ ] Verify database migration completed successfully
- [ ] Check that existing teams retain their template assignments
- [ ] Confirm admin can create new templates
- [ ] Confirm admin can delete templates
- [ ] Verify admin can upload JSON templates
- [ ] Check team management shows multiple templates correctly
- [ ] Verify employees see only their team's templates
- [ ] Confirm report creation requires template selection
- [ ] Test report submission with different templates
- [ ] Verify Google Sheets integration still works per-template
- [ ] Check that deleting a template doesn't break existing reports

## Notes

- The old `lib/report-templates.ts` file can be removed after migration (it's no longer used)
- Template IDs must remain unique for Google Sheets mapping to work correctly
- If a template is deleted and recreated with the same ID, new reports will go to the same sheet

## Rollback Plan

If issues occur:

1. Restore database from backup
2. Revert code changes: `git revert <commit-hash>`
3. Rebuild and redeploy: `npm run build && npm start`

The migration is designed to be non-destructive - old data is preserved even after running migrations.
