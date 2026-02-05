# Supabase Migrations

This directory contains SQL migration files for the RMC database schema.

## Files

| File | Description |
|------|-------------|
| `schema.sql` | Main consolidated schema (source of truth) |
| `migrations/001_gallery_setup.sql` | Gallery table setup |
| `migrations/002_gallery_events.sql` | Gallery events configuration |
| `migrations/003_newsletter.sql` | Newsletter subscribers table |
| `migrations/004_notifications.sql` | Push notifications setup |
| `migrations/005_resources.sql` | Resources management tables |
| `migrations/006_task_workflow.sql` | Task and workflow tables |
| `migrations/007_team_setup.sql` | Team configuration |

## Usage

### Initial Setup
Run `schema.sql` first to create the base tables.

### Applying Migrations
Run migration files in numerical order for additional features:

```sql
-- In Supabase SQL Editor, run each file in order
-- 001_gallery_setup.sql
-- 002_gallery_events.sql
-- etc.
```

## Notes

- Always backup before running migrations in production
- Test migrations in a development environment first
- Check for existing tables/policies before running to avoid conflicts
