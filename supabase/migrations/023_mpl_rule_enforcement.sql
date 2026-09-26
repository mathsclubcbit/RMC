-- MPL rule enforcement: scoring defaults, streaks, Power Shot, mentors and
-- server-side delivery finalization.

ALTER TABLE public.mpl_match_deliveries
    ADD COLUMN IF NOT EXISTS score_adjustment INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.mpl_match_teams
    ADD COLUMN IF NOT EXISTS mentor_name TEXT,
    ADD COLUMN IF NOT EXISTS mentor_email TEXT;

-- Full Toss is the easy, higher-reward variation. Organisers can still set a
-- question-level runs override for any special delivery.
UPDATE public.mpl_ball_types
SET default_runs = 4
WHERE slug = 'full_toss' AND default_runs IS NULL;

CREATE OR REPLACE FUNCTION public.mpl_apply_streak_bonus(
    p_delivery_id UUID
)
RETURNS public.mpl_match_deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    selected_delivery public.mpl_match_deliveries;
    previous_delivery public.mpl_match_deliveries;
    match_rules JSONB;
    threshold INTEGER := 3;
    bonus_runs INTEGER := 2;
    deduction_runs INTEGER := 2;
    consecutive INTEGER := 0;
    current_success BOOLEAN := FALSE;
    current_failure BOOLEAN := FALSE;
    next_adjustment INTEGER := 0;
BEGIN
    SELECT * INTO selected_delivery
    FROM public.mpl_match_deliveries
    WHERE id = p_delivery_id
    FOR UPDATE;

    IF selected_delivery.id IS NULL THEN
        RAISE EXCEPTION 'Delivery not found';
    END IF;

    IF COALESCE((selected_delivery.metadata->>'streak_processed')::boolean, false) THEN
        RETURN selected_delivery;
    END IF;

    SELECT rules_config INTO match_rules
    FROM public.mpl_matches
    WHERE id = selected_delivery.match_id;

    threshold := GREATEST(1, COALESCE((match_rules->>'streak_threshold')::INTEGER, 3));
    bonus_runs := GREATEST(0, COALESCE((match_rules->>'batting_streak_bonus_runs')::INTEGER, 2));
    deduction_runs := GREATEST(0, COALESCE((match_rules->>'bowling_streak_deduction_runs')::INTEGER, 2));

    current_success := selected_delivery.status = 'answered'
        AND COALESCE((selected_delivery.metadata->>'answer_phase') = 'batter', false)
        AND COALESCE((selected_delivery.metadata->>'answer_correct')::boolean, false);
    current_failure := selected_delivery.status IN ('dot', 'wicket');

    IF NOT current_success AND NOT current_failure THEN
        UPDATE public.mpl_match_deliveries
        SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('streak_processed', true)
        WHERE id = p_delivery_id
        RETURNING * INTO selected_delivery;
        RETURN selected_delivery;
    END IF;

    FOR previous_delivery IN
        SELECT *
        FROM public.mpl_match_deliveries
        WHERE match_id = selected_delivery.match_id
          AND innings_number = selected_delivery.innings_number
          AND delivery_number < selected_delivery.delivery_number
          AND status NOT IN ('wide', 'no_ball', 'cancelled')
        ORDER BY delivery_number DESC
    LOOP
        IF current_success THEN
            IF previous_delivery.status = 'answered'
               AND COALESCE((previous_delivery.metadata->>'answer_phase') = 'batter', false)
               AND COALESCE((previous_delivery.metadata->>'answer_correct')::boolean, false) THEN
                consecutive := consecutive + 1;
            ELSE
                EXIT;
            END IF;
        ELSE
            IF previous_delivery.status IN ('dot', 'wicket') THEN
                consecutive := consecutive + 1;
            ELSE
                EXIT;
            END IF;
        END IF;
    END LOOP;

    consecutive := consecutive + 1;
    IF MOD(consecutive, threshold) = 0 THEN
        next_adjustment := CASE WHEN current_success THEN bonus_runs ELSE -deduction_runs END;
    END IF;

    UPDATE public.mpl_match_deliveries
    SET score_adjustment = COALESCE(score_adjustment, 0) + next_adjustment,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'streak_processed', true,
            'streak_count', consecutive,
            'streak_adjustment', next_adjustment
        )
    WHERE id = p_delivery_id
    RETURNING * INTO selected_delivery;

    RETURN selected_delivery;
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
    ball_default_runs INTEGER;
    base_runs INTEGER := 0;
    answer_correct BOOLEAN;
    delivery_metadata JSONB;
BEGIN
    SELECT * INTO selected_delivery
    FROM public.mpl_match_deliveries
    WHERE id = p_delivery_id
    FOR UPDATE;

    IF selected_delivery.id IS NULL THEN
        RAISE EXCEPTION 'Delivery not found';
    END IF;

    SELECT * INTO selected_question
    FROM public.mpl_questions
    WHERE id = selected_delivery.question_id;

    SELECT default_runs INTO ball_default_runs
    FROM public.mpl_ball_types
    WHERE slug = selected_delivery.ball_type_slug;

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

    IF p_phase = 'batter' AND p_power_shot AND EXISTS (
        SELECT 1
        FROM public.mpl_match_deliveries d
        WHERE d.match_id = selected_delivery.match_id
          AND d.innings_number = selected_delivery.innings_number
          AND COALESCE((d.metadata->>'power_shot')::boolean, false) = true
          AND d.id <> p_delivery_id
    ) THEN
        RAISE EXCEPTION 'The Power Shot has already been used in this innings';
    END IF;

    IF selected_delivery.answer_started_at IS NOT NULL
       AND timezone('utc'::text, now()) >= selected_delivery.answer_started_at + make_interval(secs => selected_delivery.timer_seconds) THEN
        UPDATE public.mpl_match_deliveries
        SET status = 'dot',
            answer_submitted_at = timezone('utc'::text, now()),
            runs_awarded = 0,
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                'timed_out', true,
                'answer_phase', p_phase,
                'answer_correct', false,
                'power_shot', CASE WHEN p_phase = 'batter' THEN p_power_shot ELSE false END
            )
        WHERE id = p_delivery_id
        RETURNING * INTO selected_delivery;

        SELECT * INTO selected_delivery FROM public.mpl_apply_streak_bonus(p_delivery_id);
        RETURN selected_delivery;
    END IF;

    answer_correct := p_answer_option = selected_question.correct_option;
    base_runs := COALESCE(selected_question.runs, ball_default_runs, 0);
    delivery_metadata := COALESCE(selected_delivery.metadata, '{}'::jsonb) || jsonb_build_object(
        'answer_phase', p_phase,
        'answer_correct', answer_correct,
        'base_runs', base_runs,
        'power_shot', CASE WHEN p_phase = 'batter' THEN p_power_shot ELSE COALESCE((selected_delivery.metadata->>'power_shot')::boolean, false) END
    );

    IF p_phase = 'batter' AND answer_correct THEN
        UPDATE public.mpl_match_deliveries
        SET status = 'answered', answer_option = p_answer_option,
            answer_submitted_at = timezone('utc'::text, now()),
            runs_awarded = CASE WHEN p_power_shot THEN base_runs * 2 ELSE base_runs END,
            metadata = delivery_metadata
        WHERE id = p_delivery_id;
    ELSIF p_phase = 'batter' AND p_power_shot THEN
        -- A Power Shot consumes the team's use and does not open a rescue attempt.
        UPDATE public.mpl_match_deliveries
        SET status = 'dot', answer_option = p_answer_option,
            answer_submitted_at = timezone('utc'::text, now()), runs_awarded = 0,
            metadata = delivery_metadata || '{"power_shot_failed":true}'::jsonb
        WHERE id = p_delivery_id;
    ELSIF p_phase = 'batter' THEN
        UPDATE public.mpl_match_deliveries
        SET answer_option = p_answer_option, metadata = delivery_metadata || '{"rescue_available":true}'::jsonb
        WHERE id = p_delivery_id
        RETURNING * INTO selected_delivery;
        RETURN selected_delivery;
    ELSIF answer_correct THEN
        UPDATE public.mpl_match_deliveries
        SET status = 'wicket', answer_option = p_answer_option,
            answer_submitted_at = timezone('utc'::text, now()), runs_awarded = 0,
            metadata = delivery_metadata || '{"rescue_saved":true}'::jsonb
        WHERE id = p_delivery_id;
    ELSE
        UPDATE public.mpl_match_deliveries
        SET status = 'dot', answer_option = p_answer_option,
            answer_submitted_at = timezone('utc'::text, now()), runs_awarded = 0,
            metadata = delivery_metadata || '{"rescue_saved":false}'::jsonb
        WHERE id = p_delivery_id;
    END IF;

    SELECT * INTO selected_delivery FROM public.mpl_apply_streak_bonus(p_delivery_id);
    RETURN selected_delivery;
END;
$$;

CREATE OR REPLACE FUNCTION public.mpl_mark_delivery(
    p_delivery_id UUID,
    p_status TEXT
)
RETURNS public.mpl_match_deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    selected_delivery public.mpl_match_deliveries;
    extra_runs INTEGER := 0;
BEGIN
    IF p_status NOT IN ('dot', 'wicket', 'wide', 'no_ball', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid delivery status';
    END IF;

    SELECT * INTO selected_delivery
    FROM public.mpl_match_deliveries
    WHERE id = p_delivery_id
    FOR UPDATE;

    IF selected_delivery.id IS NULL THEN
        RAISE EXCEPTION 'Delivery not found';
    END IF;
    IF selected_delivery.status <> 'active' THEN
        RAISE EXCEPTION 'Only active deliveries can be marked';
    END IF;

    IF p_status IN ('wide', 'no_ball') THEN extra_runs := 1; END IF;

    UPDATE public.mpl_match_deliveries
    SET status = p_status,
        runs_awarded = extra_runs,
        answer_submitted_at = timezone('utc'::text, now()),
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('manual_result', true)
    WHERE id = p_delivery_id;

    SELECT * INTO selected_delivery FROM public.mpl_apply_streak_bonus(p_delivery_id);
    RETURN selected_delivery;
END;
$$;
