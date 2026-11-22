-- Delivery workflow: organiser assigns players first; the selected bowler then
-- chooses the question variation before the question becomes active.

CREATE TABLE IF NOT EXISTS public.mpl_match_delivery_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.mpl_matches(id) ON DELETE CASCADE,
    innings_number INTEGER NOT NULL CHECK (innings_number IN (1, 2)),
    delivery_number INTEGER NOT NULL CHECK (delivery_number > 0),
    batter_id UUID NOT NULL REFERENCES public.mpl_players(id),
    bowler_id UUID NOT NULL REFERENCES public.mpl_players(id),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'selecting', 'selected', 'cancelled')),
    delivery_id UUID REFERENCES public.mpl_match_deliveries(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    selected_at TIMESTAMPTZ,
    UNIQUE (match_id, innings_number, delivery_number)
);

CREATE INDEX IF NOT EXISTS idx_mpl_delivery_requests_bowler
    ON public.mpl_match_delivery_requests(match_id, bowler_id, status);

ALTER TABLE public.mpl_match_delivery_requests ENABLE ROW LEVEL SECURITY;
