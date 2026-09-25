-- Track which registered players have joined a specific live match.
CREATE TABLE IF NOT EXISTS public.mpl_match_player_presence (
    match_id UUID NOT NULL REFERENCES public.mpl_matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.mpl_players(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    left_at TIMESTAMPTZ,
    PRIMARY KEY (match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_mpl_match_presence_active
    ON public.mpl_match_player_presence(match_id, last_seen_at)
    WHERE left_at IS NULL;

ALTER TABLE public.mpl_match_player_presence ENABLE ROW LEVEL SECURITY;
