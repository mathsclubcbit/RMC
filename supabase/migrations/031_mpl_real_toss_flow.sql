ALTER TABLE public.mpl_matches
    ADD COLUMN IF NOT EXISTS toss_calling_team_id UUID REFERENCES public.mpl_teams(id),
    ADD COLUMN IF NOT EXISTS toss_choice TEXT CHECK (toss_choice IN ('heads', 'tails')),
    ADD COLUMN IF NOT EXISTS toss_result TEXT CHECK (toss_result IN ('heads', 'tails'));