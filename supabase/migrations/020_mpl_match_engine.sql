-- MPL match engine foundation
-- Ball types are intentionally data-driven so organizers can adjust metadata without
-- changing question records or application code.

CREATE TABLE IF NOT EXISTS public.mpl_ball_types (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    default_runs INTEGER,
    default_timer_seconds INTEGER NOT NULL CHECK (default_timer_seconds > 0),
    timer_adjustment_seconds INTEGER NOT NULL DEFAULT 0,
    is_special BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.mpl_ball_types
    (slug, name, description, default_runs, default_timer_seconds, timer_adjustment_seconds, is_special, metadata)
VALUES
    ('normal_1', '1 Run', 'Normal ball worth one run.', 1, 60, 0, FALSE, '{"difficulty":"very_easy"}'::jsonb),
    ('normal_2', '2 Runs', 'Normal ball worth two runs.', 2, 60, 0, FALSE, '{"difficulty":"easy"}'::jsonb),
    ('normal_4', '4 Runs', 'Normal ball worth four runs.', 4, 60, 0, FALSE, '{"difficulty":"medium"}'::jsonb),
    ('normal_6', '6 Runs', 'Normal ball worth six runs.', 6, 60, 0, FALSE, '{"difficulty":"hard"}'::jsonb),
    ('bouncer', 'Bouncer', 'Question with reduced answering time.', NULL, 50, -10, TRUE, '{"difficulty":"variable","time_rule":"base_timer_minus_10"}'::jsonb),
    ('yorker', 'Yorker', 'The toughest question variation.', NULL, 60, 0, TRUE, '{"difficulty":"toughest"}'::jsonb),
    ('full_toss', 'Full Toss', 'Easy question with a higher score.', NULL, 60, 0, TRUE, '{"difficulty":"easy","score_rule":"organizer_defined"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    default_runs = EXCLUDED.default_runs,
    default_timer_seconds = EXCLUDED.default_timer_seconds,
    timer_adjustment_seconds = EXCLUDED.timer_adjustment_seconds,
    is_special = EXCLUDED.is_special,
    metadata = EXCLUDED.metadata;

CREATE TABLE IF NOT EXISTS public.mpl_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ball_type_slug TEXT NOT NULL REFERENCES public.mpl_ball_types(slug),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL CHECK (jsonb_typeof(options) = 'array'),
    correct_option INTEGER NOT NULL CHECK (correct_option >= 0),
    explanation TEXT,
    runs INTEGER CHECK (runs IS NULL OR runs >= 0),
    timer_seconds INTEGER CHECK (timer_seconds IS NULL OR timer_seconds > 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_mpl_questions_ball_type
    ON public.mpl_questions(ball_type_slug) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS public.mpl_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'ready', 'toss_pending', 'innings_1', 'innings_break', 'innings_2', 'completed', 'abandoned')),
    total_questions_per_innings INTEGER NOT NULL CHECK (total_questions_per_innings > 0),
    question_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
    timer_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    rules_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    toss_winner_team_id UUID REFERENCES public.mpl_teams(id),
    first_batting_team_id UUID REFERENCES public.mpl_teams(id),
    created_by TEXT NOT NULL DEFAULT 'mpl_admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.mpl_match_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.mpl_matches(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.mpl_teams(id),
    innings_number INTEGER NOT NULL CHECK (innings_number IN (1, 2)),
    batting_order JSONB NOT NULL DEFAULT '[]'::jsonb,
    bowling_order JSONB NOT NULL DEFAULT '[]'::jsonb,
    UNIQUE (match_id, team_id),
    UNIQUE (match_id, innings_number)
);

CREATE TABLE IF NOT EXISTS public.mpl_match_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.mpl_matches(id) ON DELETE CASCADE,
    innings_number INTEGER NOT NULL CHECK (innings_number IN (1, 2)),
    delivery_number INTEGER NOT NULL CHECK (delivery_number > 0),
    question_id UUID NOT NULL REFERENCES public.mpl_questions(id),
    ball_type_slug TEXT NOT NULL REFERENCES public.mpl_ball_types(slug),
    batter_id UUID NOT NULL REFERENCES public.mpl_players(id),
    bowler_id UUID NOT NULL REFERENCES public.mpl_players(id),
    timer_seconds INTEGER NOT NULL CHECK (timer_seconds > 0),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'answered', 'dot', 'wicket', 'wide', 'no_ball', 'cancelled')),
    answer_option INTEGER,
    answer_started_at TIMESTAMPTZ,
    answer_submitted_at TIMESTAMPTZ,
    runs_awarded INTEGER NOT NULL DEFAULT 0 CHECK (runs_awarded >= 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (match_id, question_id),
    UNIQUE (match_id, innings_number, delivery_number)
);

CREATE INDEX IF NOT EXISTS idx_mpl_match_deliveries_match
    ON public.mpl_match_deliveries(match_id, innings_number, delivery_number);

ALTER TABLE public.mpl_ball_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpl_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpl_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpl_match_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpl_match_deliveries ENABLE ROW LEVEL SECURITY;

-- These tables are accessed through server-side admin APIs. No anonymous policies
-- are intentionally added because questions and answers are match-sensitive.

CREATE OR REPLACE FUNCTION public.mpl_select_delivery(
    p_match_id UUID,
    p_innings_number INTEGER,
    p_delivery_number INTEGER,
    p_ball_type_slug TEXT,
    p_batter_id UUID,
    p_bowler_id UUID,
    p_timer_seconds INTEGER
)
RETURNS public.mpl_match_deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    selected_question public.mpl_questions;
    selected_delivery public.mpl_match_deliveries;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.mpl_match_teams mt
        WHERE mt.match_id = p_match_id
          AND mt.team_id IN (
              SELECT team_id FROM public.mpl_players WHERE id = p_batter_id
              UNION
              SELECT team_id FROM public.mpl_players WHERE id = p_bowler_id
          )
    ) THEN
        RAISE EXCEPTION 'Players are not assigned to this match';
    END IF;

    SELECT q.* INTO selected_question
    FROM public.mpl_questions q
    WHERE q.ball_type_slug = p_ball_type_slug
      AND q.is_active = TRUE
      AND NOT EXISTS (
          SELECT 1 FROM public.mpl_match_deliveries d
          WHERE d.match_id = p_match_id AND d.question_id = q.id
      )
    ORDER BY random()
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF selected_question.id IS NULL THEN
        RAISE EXCEPTION 'No unused question is available for ball type %', p_ball_type_slug;
    END IF;

    INSERT INTO public.mpl_match_deliveries (
        match_id, innings_number, delivery_number, question_id,
        ball_type_slug, batter_id, bowler_id, timer_seconds,
        status, answer_started_at
    ) VALUES (
        p_match_id, p_innings_number, p_delivery_number, selected_question.id,
        p_ball_type_slug, p_batter_id, p_bowler_id, p_timer_seconds,
        'active', timezone('utc'::text, now())
    )
    RETURNING * INTO selected_delivery;

    RETURN selected_delivery;
END;
$$;

CREATE OR REPLACE FUNCTION public.mpl_record_toss(
    p_match_id UUID,
    p_toss_winner_team_id UUID,
    p_first_batting_team_id UUID
)
RETURNS public.mpl_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    selected_match public.mpl_matches;
BEGIN
    SELECT * INTO selected_match
    FROM public.mpl_matches
    WHERE id = p_match_id
    FOR UPDATE;

    IF selected_match.id IS NULL THEN
        RAISE EXCEPTION 'Match not found';
    END IF;
    IF selected_match.status <> 'toss_pending' THEN
        RAISE EXCEPTION 'Toss can only be recorded before the innings starts';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.mpl_match_teams
        WHERE match_id = p_match_id AND team_id = p_toss_winner_team_id
    ) OR NOT EXISTS (
        SELECT 1 FROM public.mpl_match_teams
        WHERE match_id = p_match_id AND team_id = p_first_batting_team_id
    ) THEN
        RAISE EXCEPTION 'Toss teams must belong to the match';
    END IF;

    UPDATE public.mpl_matches
    SET toss_winner_team_id = p_toss_winner_team_id,
        first_batting_team_id = p_first_batting_team_id,
        status = 'innings_1',
        started_at = COALESCE(started_at, timezone('utc'::text, now()))
    WHERE id = p_match_id
    RETURNING * INTO selected_match;

    RETURN selected_match;
END;
$$;

CREATE OR REPLACE FUNCTION public.mpl_submit_answer(
    p_delivery_id UUID,
    p_phase TEXT,
    p_answer_option INTEGER,
    p_power_shot BOOLEAN DEFAULT FALSE
)
RETURNS public.mpl_match_deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    selected_delivery public.mpl_match_deliveries;
    selected_question public.mpl_questions;
    base_runs INTEGER := 0;
    answer_correct BOOLEAN;
    delivery_metadata JSONB;
BEGIN
    SELECT * INTO selected_delivery
    FROM public.mpl_match_deliveries
    WHERE id = p_delivery_id
    FOR UPDATE;

    SELECT * INTO selected_question
    FROM public.mpl_questions
    WHERE id = selected_delivery.question_id;

    IF selected_delivery.id IS NULL THEN
        RAISE EXCEPTION 'Delivery not found';
    END IF;
    IF p_phase NOT IN ('batter', 'bowler') THEN
        RAISE EXCEPTION 'Answer phase must be batter or bowler';
    END IF;
    IF p_answer_option IS NULL OR p_answer_option < 0 OR p_answer_option >= jsonb_array_length(selected_question.options) THEN
        RAISE EXCEPTION 'Answer option is invalid';
    END IF;
    IF p_phase = 'batter' AND selected_delivery.status <> 'active' THEN
        RAISE EXCEPTION 'This delivery is no longer awaiting the batter';
    END IF;
    IF p_phase = 'bowler' AND (selected_delivery.status <> 'active' OR COALESCE((selected_delivery.metadata->>'rescue_available')::boolean, false) IS NOT TRUE) THEN
        RAISE EXCEPTION 'This delivery is not awaiting a bowler rescue attempt';
    END IF;

    answer_correct := p_answer_option = selected_question.correct_option;
    base_runs := COALESCE(selected_question.runs, 0);
    delivery_metadata := COALESCE(selected_delivery.metadata, '{}'::jsonb) || jsonb_build_object(
        'answer_phase', p_phase,
        'answer_correct', answer_correct,
        'power_shot', CASE WHEN p_phase = 'batter' THEN p_power_shot ELSE COALESCE((selected_delivery.metadata->>'power_shot')::boolean, false) END
    );

    IF p_phase = 'batter' AND answer_correct THEN
        UPDATE public.mpl_match_deliveries
        SET status = 'answered', answer_option = p_answer_option,
            answer_submitted_at = timezone('utc'::text, now()),
            runs_awarded = CASE WHEN p_power_shot THEN base_runs * 2 ELSE base_runs END,
            metadata = delivery_metadata
        WHERE id = p_delivery_id
        RETURNING * INTO selected_delivery;
    ELSIF p_phase = 'batter' THEN
        UPDATE public.mpl_match_deliveries
        SET answer_option = p_answer_option, metadata = delivery_metadata || '{"rescue_available":true}'::jsonb
        WHERE id = p_delivery_id
        RETURNING * INTO selected_delivery;
    ELSIF answer_correct THEN
        UPDATE public.mpl_match_deliveries
        SET status = 'answered', answer_submitted_at = timezone('utc'::text, now()),
            runs_awarded = 0, metadata = delivery_metadata || '{"rescue_saved":true}'::jsonb
        WHERE id = p_delivery_id
        RETURNING * INTO selected_delivery;
    ELSE
        UPDATE public.mpl_match_deliveries
        SET status = 'wicket', answer_option = p_answer_option,
            answer_submitted_at = timezone('utc'::text, now()), runs_awarded = 0,
            metadata = delivery_metadata || '{"rescue_saved":false}'::jsonb
        WHERE id = p_delivery_id
        RETURNING * INTO selected_delivery;
    END IF;

    RETURN selected_delivery;
END;
$$;
