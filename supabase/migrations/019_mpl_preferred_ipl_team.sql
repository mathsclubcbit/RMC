-- Store each MPL player's preferred IPL team.
ALTER TABLE public.mpl_players
    ADD COLUMN IF NOT EXISTS preferred_ipl_team TEXT;
