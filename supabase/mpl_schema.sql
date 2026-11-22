-- MPL 2026 Dedicated Tables Migration

-- 1. Create Teams Table
CREATE TABLE IF NOT EXISTS public.mpl_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_code TEXT UNIQUE NOT NULL,
    team_name TEXT NOT NULL,
    status TEXT DEFAULT 'APPROVED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Players Table
CREATE TABLE IF NOT EXISTS public.mpl_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.mpl_teams(id) ON DELETE CASCADE NOT NULL,
    is_leader BOOLEAN DEFAULT FALSE,
    name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    section TEXT,
    branch TEXT,
    year TEXT,
    preferred_ipl_team TEXT,
    phone_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.mpl_players
    ADD COLUMN IF NOT EXISTS preferred_ipl_team TEXT;

-- Enable RLS (Row Level Security)
ALTER TABLE public.mpl_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpl_players ENABLE ROW LEVEL SECURITY;

-- Allow Public/Anon Inserts (for registration)
CREATE POLICY "Enable insert for anonymous users" ON public.mpl_teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for anonymous users" ON public.mpl_players FOR INSERT WITH CHECK (true);

-- Allow Public Selects (for searching teams and checking dashboard)
CREATE POLICY "Enable read access for all users" ON public.mpl_teams FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.mpl_players FOR SELECT USING (true);
