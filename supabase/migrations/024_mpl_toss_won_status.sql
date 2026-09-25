-- Add 'toss_won' as a valid match status so we can wait for the toss winner
-- to choose bat or bowl from their player screen before innings begin.
ALTER TABLE public.mpl_matches
    DROP CONSTRAINT IF EXISTS mpl_matches_status_check;

ALTER TABLE public.mpl_matches
    ADD CONSTRAINT mpl_matches_status_check
    CHECK (status IN ('draft', 'ready', 'toss_pending', 'toss_won', 'innings_1', 'innings_break', 'innings_2', 'completed', 'abandoned'));
