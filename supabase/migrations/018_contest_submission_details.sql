-- Migration 018: Add detailed question tracking for contest submissions
ALTER TABLE ps_contest_submissions
ADD COLUMN answered_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN unanswered_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN detailed_results JSONB NOT NULL DEFAULT '{}'::jsonb;
