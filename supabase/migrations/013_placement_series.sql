-- ============================================================
-- Placement Series Feature — Migration 013
-- ============================================================
-- Tables: ps_participants, ps_question_bank, ps_daily_questions,
--         ps_daily_submissions, ps_contests, ps_contest_questions,
--         ps_contest_submissions, ps_badges
-- Views:  ps_leaderboard_view
-- ============================================================

-- =============================================
-- 1. PARTICIPANTS
--    One row per user per series event.
--    is_verified = true only after OTP for contest.
-- =============================================
CREATE TABLE IF NOT EXISTS ps_participants (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id        TEXT        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    email           TEXT        NOT NULL,
    roll_no         TEXT        NOT NULL,
    phone           TEXT,
    -- OTP fields (used for contest verification only)
    otp_hash        TEXT,               -- bcrypt hash of current 6-digit OTP
    otp_expires_at  TIMESTAMPTZ,        -- OTP valid for 10 minutes
    is_verified     BOOLEAN     NOT NULL DEFAULT false,  -- true after OTP verified
    -- Streak tracking
    streak_current  INTEGER     NOT NULL DEFAULT 0,
    streak_longest  INTEGER     NOT NULL DEFAULT 0,
    last_daily_date DATE,               -- last date they answered at least 1 daily Q
    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Constraints
    CONSTRAINT ps_participants_event_email_unique UNIQUE (event_id, email),
    CONSTRAINT ps_participants_event_roll_unique  UNIQUE (event_id, roll_no)
);

CREATE INDEX IF NOT EXISTS idx_ps_participants_event    ON ps_participants (event_id);
CREATE INDEX IF NOT EXISTS idx_ps_participants_email    ON ps_participants (event_id, email);
CREATE INDEX IF NOT EXISTS idx_ps_participants_roll     ON ps_participants (event_id, roll_no);

-- =============================================
-- 2. QUESTION BANK (global, reused every year)
--    Coordinator adds questions here once; they
--    can be assigned to any year's series.
-- =============================================
CREATE TABLE IF NOT EXISTS ps_question_bank (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    question_text   TEXT        NOT NULL,
    options         JSONB       NOT NULL, -- ["Opt A", "Opt B", "Opt C", "Opt D"]
    correct_option  INTEGER     NOT NULL, -- 0-indexed
    explanation     TEXT,                 -- revealed after question deadline
    category        TEXT,                 -- "Aptitude" | "Reasoning" | "Technical" | "Verbal"
    difficulty      TEXT        NOT NULL DEFAULT 'medium'
                        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags            JSONB       NOT NULL DEFAULT '[]'::jsonb, -- ["TCS", "sorting", "arrays"]
    created_by      TEXT,                 -- coordinator event_id who added this
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ps_qbank_category   ON ps_question_bank (category);
CREATE INDEX IF NOT EXISTS idx_ps_qbank_difficulty ON ps_question_bank (difficulty);

-- =============================================
-- 3. DAILY QUESTIONS
--    Maps bank questions → specific date for a
--    specific placement series event.
--    Max 3 questions per day per event.
-- =============================================
CREATE TABLE IF NOT EXISTS ps_daily_questions (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id        TEXT        NOT NULL REFERENCES events(id)          ON DELETE CASCADE,
    question_date   DATE        NOT NULL,
    question_number INTEGER     NOT NULL CHECK (question_number BETWEEN 1 AND 3),
    question_id     UUID        NOT NULL REFERENCES ps_question_bank(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ps_daily_questions_unique UNIQUE (event_id, question_date, question_number)
);

CREATE INDEX IF NOT EXISTS idx_ps_daily_event_date ON ps_daily_questions (event_id, question_date);

-- =============================================
-- 4. DAILY SUBMISSIONS
--    One row per user per daily question.
--    Prevents re-submission via UNIQUE constraint.
-- =============================================
CREATE TABLE IF NOT EXISTS ps_daily_submissions (
    id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    daily_question_id   UUID        NOT NULL REFERENCES ps_daily_questions(id) ON DELETE CASCADE,
    participant_id      UUID        NOT NULL REFERENCES ps_participants(id)     ON DELETE CASCADE,
    selected_option     INTEGER     NOT NULL, -- 0-indexed (shuffled position from client)
    actual_option       INTEGER     NOT NULL, -- 0-indexed mapped back to canonical correct_option
    is_correct          BOOLEAN     NOT NULL,
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    client_fingerprint  TEXT,
    CONSTRAINT ps_daily_submissions_unique UNIQUE (daily_question_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_ps_daily_sub_participant ON ps_daily_submissions (participant_id);
CREATE INDEX IF NOT EXISTS idx_ps_daily_sub_question    ON ps_daily_submissions (daily_question_id);

-- =============================================
-- 5. CONTESTS (weekly, time-gated)
--    Coordinator sets start/end times and per-user
--    duration. Participants can only start during
--    the active window.
-- =============================================
CREATE TABLE IF NOT EXISTS ps_contests (
    id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id            TEXT        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title               TEXT        NOT NULL,        -- "Week 1 Contest"
    week_number         INTEGER,
    description         TEXT,
    starts_at           TIMESTAMPTZ NOT NULL,         -- coordinator sets
    ends_at             TIMESTAMPTZ NOT NULL,         -- coordinator sets
    duration_minutes    INTEGER     NOT NULL DEFAULT 30, -- per-user timer
    total_questions     INTEGER     NOT NULL DEFAULT 0,
    is_published        BOOLEAN     NOT NULL DEFAULT false,
    results_published   BOOLEAN     NOT NULL DEFAULT false, -- triggers badge awards
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ps_contests_times_check CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_ps_contests_event ON ps_contests (event_id);

-- =============================================
-- 6. CONTEST QUESTIONS
--    Questions within a contest. Inline copy of
--    text/options to avoid mutations affecting
--    past submissions if bank question is edited.
-- =============================================
CREATE TABLE IF NOT EXISTS ps_contest_questions (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    contest_id      UUID        NOT NULL REFERENCES ps_contests(id)      ON DELETE CASCADE,
    question_bank_id UUID       REFERENCES ps_question_bank(id) ON DELETE SET NULL,
    question_number INTEGER     NOT NULL,
    question_text   TEXT        NOT NULL,   -- inline copy from bank
    options         JSONB       NOT NULL,   -- inline copy from bank
    correct_option  INTEGER     NOT NULL,   -- inline copy from bank (server-side only)
    points          INTEGER     NOT NULL DEFAULT 10,
    CONSTRAINT ps_contest_questions_unique UNIQUE (contest_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_ps_cq_contest ON ps_contest_questions (contest_id);

-- =============================================
-- 7. CONTEST SUBMISSIONS
--    One per user per contest. Tracks answers,
--    score, timing, and anti-cheat signals.
-- =============================================
CREATE TABLE IF NOT EXISTS ps_contest_submissions (
    id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    contest_id          UUID        NOT NULL REFERENCES ps_contests(id)      ON DELETE CASCADE,
    participant_id      UUID        NOT NULL REFERENCES ps_participants(id)   ON DELETE CASCADE,
    -- Answers: { "contest_question_id": selected_option_index, ... }
    answers             JSONB       NOT NULL DEFAULT '{}'::jsonb,
    score               INTEGER     NOT NULL DEFAULT 0,
    total_points        INTEGER     NOT NULL DEFAULT 0,
    -- Timing
    started_at          TIMESTAMPTZ NOT NULL,   -- when user clicked "Start"
    submitted_at        TIMESTAMPTZ,            -- null = in progress
    time_taken_seconds  INTEGER,
    -- Anti-cheat signals
    tab_switch_count    INTEGER     NOT NULL DEFAULT 0,
    client_fingerprint  TEXT,
    CONSTRAINT ps_contest_submissions_unique UNIQUE (contest_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_ps_csub_contest     ON ps_contest_submissions (contest_id);
CREATE INDEX IF NOT EXISTS idx_ps_csub_participant ON ps_contest_submissions (participant_id);

-- =============================================
-- 8. BADGES
--    Awarded for: streaks, contest podium,
--    milestones. Contains LinkedIn share text.
-- =============================================
CREATE TABLE IF NOT EXISTS ps_badges (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id  UUID        NOT NULL REFERENCES ps_participants(id) ON DELETE CASCADE,
    event_id        TEXT        NOT NULL REFERENCES events(id)          ON DELETE CASCADE,
    badge_type      TEXT        NOT NULL,
    -- Allowed types:
    -- streak_3 | streak_7 | streak_14 | streak_21 | streak_30
    -- contest_gold | contest_silver | contest_bronze
    -- first_answer | fifty_answers | perfect_contest
    badge_label     TEXT        NOT NULL,   -- "🔥 3-Day Streak"
    badge_icon      TEXT,                   -- emoji or icon key
    contest_id      UUID        REFERENCES ps_contests(id) ON DELETE SET NULL,
    linkedin_text   TEXT,                   -- pre-formatted share text
    earned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ps_badges_unique UNIQUE (participant_id, badge_type, contest_id)
);

CREATE INDEX IF NOT EXISTS idx_ps_badges_participant ON ps_badges (participant_id);
CREATE INDEX IF NOT EXISTS idx_ps_badges_event       ON ps_badges (event_id);

-- =============================================
-- VIEW: ps_leaderboard_view
--    Leaderboard ranked by contest score only.
--    Daily answers tracked for display but NOT
--    counted in the score.
-- =============================================
CREATE OR REPLACE VIEW ps_leaderboard_view AS
SELECT
    p.id                AS participant_id,
    p.event_id,
    p.name,
    p.roll_no,
    p.streak_current,
    p.streak_longest,
    COALESCE(cs.contest_score,    0) AS total_score,
    COALESCE(cs.contests_taken,   0) AS contests_participated,
    COALESCE(cs.total_possible,   0) AS total_possible_score,
    COALESCE(ds.daily_answered,   0) AS daily_questions_answered,
    COALESCE(bs.badge_count,      0) AS badge_count
FROM ps_participants p
LEFT JOIN (
    SELECT
        participant_id,
        SUM(score)        AS contest_score,
        COUNT(*)          AS contests_taken,
        SUM(total_points) AS total_possible
    FROM ps_contest_submissions
    WHERE submitted_at IS NOT NULL
    GROUP BY participant_id
) cs ON cs.participant_id = p.id
LEFT JOIN (
    SELECT
        participant_id,
        COUNT(*) AS daily_answered
    FROM ps_daily_submissions
    GROUP BY participant_id
) ds ON ds.participant_id = p.id
LEFT JOIN (
    SELECT
        participant_id,
        COUNT(*) AS badge_count
    FROM ps_badges
    GROUP BY participant_id
) bs ON bs.participant_id = p.id;

-- =============================================
-- ENABLE ROW LEVEL SECURITY
--    All access via service role key from API.
--    No direct public access.
-- =============================================
ALTER TABLE ps_participants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_question_bank       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_daily_questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_daily_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_contests            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_contest_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_contest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_badges              ENABLE ROW LEVEL SECURITY;

-- No public RLS policies — service role bypasses RLS entirely.
-- This matches the pattern used in all other tables in this project.
