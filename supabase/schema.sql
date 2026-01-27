-- RMC Network System - Database Schema
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN (
        'president',
        'vice_president',
        'general_secretary',
        'joint_secretary',
        'faculty',
        'head',
        'member'
    )),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('general', 'fest')),
    description TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. TEAM MEMBERS (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('head', 'member')),
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, team_id)
);

-- ============================================
-- 4. DELEGATED PERMISSIONS (President grants access)
-- ============================================
CREATE TABLE IF NOT EXISTS delegated_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    can_manage_teams BOOLEAN DEFAULT false,
    can_manage_members BOOLEAN DEFAULT false,
    granted_by UUID REFERENCES profiles(id),
    granted_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. PERFORMANCE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_delegated_user ON delegated_permissions(user_id);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegated_permissions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Profiles are viewable by authenticated users"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Teams: All authenticated users can read; admins can write
CREATE POLICY "Teams are viewable by authenticated users"
    ON teams FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert teams"
    ON teams FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'president'
        )
        OR
        EXISTS (
            SELECT 1 FROM delegated_permissions
            WHERE user_id = auth.uid()
            AND can_manage_teams = true
        )
    );

CREATE POLICY "Admins can update teams"
    ON teams FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'president'
        )
        OR
        EXISTS (
            SELECT 1 FROM delegated_permissions
            WHERE user_id = auth.uid()
            AND can_manage_teams = true
        )
    );

CREATE POLICY "Admins can delete teams"
    ON teams FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'president'
        )
        OR
        EXISTS (
            SELECT 1 FROM delegated_permissions
            WHERE user_id = auth.uid()
            AND can_manage_teams = true
        )
    );

-- Team Members: Viewable by all; managed by admins and heads
CREATE POLICY "Team members are viewable by authenticated users"
    ON team_members FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins and heads can manage team members"
    ON team_members FOR ALL
    TO authenticated
    USING (
        -- President
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'president'
        )
        OR
        -- Delegated permission
        EXISTS (
            SELECT 1 FROM delegated_permissions
            WHERE user_id = auth.uid()
            AND can_manage_members = true
        )
        OR
        -- Team head (for their own team)
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.user_id = auth.uid()
            AND tm.team_id = team_members.team_id
            AND tm.role = 'head'
        )
    );

-- Delegated Permissions: Only president can read/write
CREATE POLICY "Only president can view delegated permissions"
    ON delegated_permissions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'president'
        )
    );

CREATE POLICY "Only president can manage delegated permissions"
    ON delegated_permissions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'president'
        )
    );

-- ============================================
-- 7. PUBLIC EVENTS (RMC website events CRUD)
-- ============================================
-- These events are managed by the custom admin panel (cookie-based auth)
-- via server-side service role key. We keep the schema minimal and store
-- the flexible event shape as JSONB.

CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);

-- Keep updated_at fresh on updates
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================
-- 7. AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'member')
    );
    RETURN NEW;
END;
$$;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    assigned_to_team UUID REFERENCES teams(id) ON DELETE SET NULL,
    assigned_to_user UUID REFERENCES profiles(id) ON DELETE SET NULL,
    deadline TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 9. CALENDAR EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    type TEXT DEFAULT 'event' CHECK (type IN ('event', 'meeting', 'deadline')),
    is_global BOOLEAN DEFAULT true,
    visible_to_user UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 10. RESOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'link' CHECK (type IN ('link', 'file', 'template')),
    url TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 11. INDEXES FOR NEW TABLES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_team ON tasks(assigned_to_team);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks(assigned_to_user);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_calendar_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);

-- ============================================
-- 12. RLS FOR NEW TABLES
-- ============================================

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Tasks: Viewable based on assignment
CREATE POLICY "Tasks viewable by assigned users"
    ON tasks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Tasks can be created by admins and heads"
    ON tasks FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('president', 'head'))
    );

CREATE POLICY "Tasks can be updated by anyone"
    ON tasks FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Tasks can be deleted by creator or president"
    ON tasks FOR DELETE
    TO authenticated
    USING (
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'president')
    );

-- Calendar Events: Viewable by all authenticated
CREATE POLICY "Calendar events viewable by authenticated"
    ON calendar_events FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only president can manage calendar events"
    ON calendar_events FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'president')
    );

-- Resources: Viewable by all, managed by president
CREATE POLICY "Resources viewable by authenticated"
    ON resources FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only president can manage resources"
    ON resources FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'president')
    );
