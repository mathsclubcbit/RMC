-- Update mpl_record_toss to allow 'toss_won' status as well, since the flow is now:
-- toss_pending -> toss_won (admin records winner) -> innings_1 (player chooses bat/bowl)

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
    IF selected_match.status NOT IN ('toss_pending', 'toss_won') THEN
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

    -- Re-assign innings_number based on the choice
    -- We update both teams in a single statement so that the unique constraint 
    -- (match_id, innings_number) is checked at the end of the statement,
    -- avoiding collision and obeying the CHECK (innings_number IN (1, 2)).
    UPDATE public.mpl_match_teams
    SET innings_number = CASE 
        WHEN team_id = p_first_batting_team_id THEN 1
        ELSE 2
    END
    WHERE match_id = p_match_id;

    RETURN selected_match;
END;
$$;
