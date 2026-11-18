-- Enforce MPL delivery expiry on the server.
-- A late batter or bowler submission is recorded as a dot ball.

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

    IF selected_delivery.id IS NULL THEN
        RAISE EXCEPTION 'Delivery not found';
    END IF;

    SELECT * INTO selected_question
    FROM public.mpl_questions
    WHERE id = selected_delivery.question_id;

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

    IF selected_delivery.answer_started_at IS NOT NULL
       AND timezone('utc'::text, now()) >= selected_delivery.answer_started_at + make_interval(secs => selected_delivery.timer_seconds) THEN
        UPDATE public.mpl_match_deliveries
        SET status = 'dot',
            answer_submitted_at = timezone('utc'::text, now()),
            runs_awarded = 0,
            metadata = COALESCE(selected_delivery.metadata, '{}'::jsonb) || jsonb_build_object(
                'timed_out', true,
                'answer_phase', p_phase,
                'answer_correct', false
            )
        WHERE id = p_delivery_id
        RETURNING * INTO selected_delivery;

        RETURN selected_delivery;
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
        SET status = 'wicket', answer_submitted_at = timezone('utc'::text, now()),
            runs_awarded = 0, metadata = delivery_metadata || '{"rescue_saved":true}'::jsonb
        WHERE id = p_delivery_id
        RETURNING * INTO selected_delivery;
    ELSE
        UPDATE public.mpl_match_deliveries
        SET status = 'dot', answer_option = p_answer_option,
            answer_submitted_at = timezone('utc'::text, now()), runs_awarded = 0,
            metadata = delivery_metadata || '{"rescue_saved":false}'::jsonb
        WHERE id = p_delivery_id
        RETURNING * INTO selected_delivery;
    END IF;

    RETURN selected_delivery;
END;
$$;
