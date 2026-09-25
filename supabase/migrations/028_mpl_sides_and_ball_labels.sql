-- Allow a match side to contain multiple registered teams while preserving
-- each team's player membership and match participation.
ALTER TABLE public.mpl_match_teams
    DROP CONSTRAINT IF EXISTS mpl_match_teams_match_id_innings_number_key;

ALTER TABLE public.mpl_match_teams
    ADD COLUMN IF NOT EXISTS side_name TEXT;

UPDATE public.mpl_match_teams
SET side_name = COALESCE(side_name, 'Team ' || innings_number);

CREATE INDEX IF NOT EXISTS idx_mpl_match_teams_match_innings
    ON public.mpl_match_teams(match_id, innings_number);

-- Match setup labels use cricket delivery names rather than run counts.
UPDATE public.mpl_ball_types
SET name = CASE slug
        WHEN 'normal_1' THEN 'In-swinger'
        WHEN 'normal_2' THEN 'Leg-cutter'
        WHEN 'normal_4' THEN 'Out-swinger'
        WHEN 'normal_6' THEN 'Off-cutter'
        ELSE name
    END,
    description = CASE slug
        WHEN 'normal_1' THEN '1 run delivery.'
        WHEN 'normal_2' THEN '2 run delivery.'
        WHEN 'normal_4' THEN '4 run delivery.'
        WHEN 'normal_6' THEN '6 run delivery.'
        ELSE description
    END,
    metadata = metadata || CASE slug
        WHEN 'normal_1' THEN '{"icon":"in_swinger"}'::jsonb
        WHEN 'normal_2' THEN '{"icon":"leg_cutter"}'::jsonb
        WHEN 'normal_4' THEN '{"icon":"out_swinger"}'::jsonb
        WHEN 'normal_6' THEN '{"icon":"off_cutter"}'::jsonb
        ELSE '{}'::jsonb
    END;