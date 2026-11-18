-- ============================================================
-- Quiz System Feature — Migration 016
-- ============================================================
-- Tables: quiz_questions, quiz_sessions, quiz_submissions
-- ============================================================

-- =============================================
-- 1. QUIZ QUESTIONS
--    Question bank per quiz event.
--    Coordinator adds questions with difficulty.
--    Points auto-mapped: easy=1, medium=2, hard=3
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_questions (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id        TEXT        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    question_text   TEXT        NOT NULL,
    options         JSONB       NOT NULL,   -- ["Option A", "Option B", "Option C", "Option D"]
    correct_option  INTEGER     NOT NULL,   -- 0-indexed
    difficulty      TEXT        NOT NULL DEFAULT 'medium'
                        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    explanation     TEXT,                   -- shown after quiz ends
    points          INTEGER     NOT NULL DEFAULT 2,  -- easy=1, medium=2, hard=3
    sort_order      INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_event      ON quiz_questions (event_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty  ON quiz_questions (event_id, difficulty);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS trg_quiz_questions_updated_at ON quiz_questions;
CREATE TRIGGER trg_quiz_questions_updated_at
BEFORE UPDATE ON quiz_questions
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =============================================
-- 2. QUIZ SESSIONS
--    One per participant per quiz event.
--    Stores the randomized question set and score.
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id            TEXT        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registration_id     UUID        REFERENCES registrations(id) ON DELETE SET NULL,
    participant_name    TEXT        NOT NULL,
    participant_email   TEXT        NOT NULL,
    -- Randomized question assignment (server-side only)
    -- [{questionId, shuffledOptions, optionMap}]
    assigned_questions  JSONB       NOT NULL DEFAULT '[]'::jsonb,
    score               INTEGER     NOT NULL DEFAULT 0,
    total_possible      INTEGER     NOT NULL DEFAULT 0,
    -- Timing
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at        TIMESTAMPTZ,            -- NULL = in progress
    time_taken_seconds  INTEGER,
    -- Anti-cheat
    tab_switch_count    INTEGER     NOT NULL DEFAULT 0,
    client_fingerprint  TEXT,
    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Constraints
    CONSTRAINT quiz_sessions_event_email_unique UNIQUE (event_id, participant_email)
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_event       ON quiz_sessions (event_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_email       ON quiz_sessions (event_id, participant_email);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_leaderboard ON quiz_sessions (event_id, score DESC, time_taken_seconds ASC);

-- =============================================
-- 3. QUIZ SUBMISSIONS
--    Individual answer records per question per session.
--    Prevents re-answering via UNIQUE constraint.
-- =============================================
CREATE TABLE IF NOT EXISTS quiz_submissions (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id      UUID        NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id     UUID        NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_option INTEGER     NOT NULL,   -- what they picked (shuffled display index)
    actual_option   INTEGER     NOT NULL,   -- mapped back to canonical index
    is_correct      BOOLEAN     NOT NULL,
    points_earned   INTEGER     NOT NULL DEFAULT 0,
    answered_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT quiz_submissions_unique UNIQUE (session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_submissions_session  ON quiz_submissions (session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_question ON quiz_submissions (question_id);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
--    All access via service role key from API.
--    No direct public access.
-- =============================================
ALTER TABLE quiz_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

-- No public RLS policies — service role bypasses RLS entirely.
-- This matches the pattern used in all other tables in this project.
