-- ============================================================
-- Placement Series — Migration 014
-- Points / XP Economy System
-- ============================================================
-- Adds total_points to ps_participants.
-- Updates ps_leaderboard_view to sort by total_points.
-- Adds ps_contest_winners_view for the Hall of Fame page.
-- ============================================================

-- ── 1. Add total_points column to participants ──────────────
ALTER TABLE ps_participants
    ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_ps_participants_points
    ON ps_participants (total_points DESC);

-- ── 2. Replace leaderboard view to use total_points ─────────
DROP VIEW IF EXISTS ps_leaderboard_view;

CREATE OR REPLACE VIEW ps_leaderboard_view AS
SELECT
    p.id                AS participant_id,
    p.event_id,
    p.name,
    p.roll_no,
    p.streak_current,
    p.streak_longest,
    p.total_points,
    -- Contest score component (for breakdown)
    COALESCE(cs.contest_score,    0) AS contest_score,
    COALESCE(cs.contests_taken,   0) AS contests_participated,
    COALESCE(cs.total_possible,   0) AS total_possible_score,
    -- Daily component (for breakdown)
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

-- ── 3. Contest Winners view (for Hall of Fame) ───────────────
CREATE OR REPLACE VIEW ps_contest_winners_view AS
WITH ranked_subs AS (
    SELECT
        cs.contest_id,
        cs.participant_id,
        cs.score,
        cs.total_points         AS max_points,
        cs.time_taken_seconds,
        cs.submitted_at,
        ROW_NUMBER() OVER (
            PARTITION BY cs.contest_id
            ORDER BY cs.score DESC, cs.time_taken_seconds ASC
        ) AS rank_position
    FROM ps_contest_submissions cs
    WHERE cs.submitted_at IS NOT NULL
)
SELECT
    c.id                    AS contest_id,
    c.event_id,
    c.title                 AS contest_title,
    c.week_number,
    c.ends_at,
    c.results_published,
    rs.rank_position,
    rs.participant_id,
    p.name                  AS participant_name,
    p.roll_no               AS participant_roll,
    rs.score,
    rs.max_points,
    rs.time_taken_seconds,
    rs.submitted_at
FROM ps_contests c
JOIN ranked_subs rs ON rs.contest_id = c.id AND rs.rank_position <= 3
JOIN ps_participants p ON p.id = rs.participant_id
WHERE c.results_published = true
ORDER BY c.ends_at DESC, rs.rank_position ASC;
