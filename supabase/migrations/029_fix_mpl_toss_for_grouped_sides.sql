-- Rebuild toss assignment after grouped match sides removed the old
-- (match_id, innings_number) uniqueness constraint.
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
    first_side_name TEXT;
    first_side_innings INTEGER;
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

    SELECT side_name, innings_number INTO first_side_name, first_side_innings
    FROM public.mpl_match_teams
    WHERE match_id = p_match_id AND team_id = p_first_batting_team_id
    LIMIT 1;

    UPDATE public.mpl_matches
    SET toss_winner_team_id = p_toss_winner_team_id,
        first_batting_team_id = p_first_batting_team_id,
        status = 'innings_1',
        started_at = COALESCE(started_at, timezone('utc'::text, now()))
    WHERE id = p_match_id
    RETURNING * INTO selected_match;

    UPDATE public.mpl_match_teams
    SET innings_number = CASE
        WHEN (first_side_name IS NOT NULL AND side_name = first_side_name)
          OR (first_side_name IS NULL AND team_id = p_first_batting_team_id)
        THEN 1 ELSE 2 END
    WHERE match_id = p_match_id;

    RETURN selected_match;
END;
$$;