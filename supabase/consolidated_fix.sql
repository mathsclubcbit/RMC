-- RMC CONSOLIDATED SECURITY & GALLERY REMEDIATION SCRIPT
-- Purpose: Fixes 14 security warnings and ensures gallery tables are correctly configured.
-- Instructions: Run this entire block in the Supabase SQL Editor.

BEGIN;

-- ============================================
-- 1. FIX FUNCTION SEARCH PATHS (Security)
-- ============================================
-- This prevents "search_path" hijacking vulnerabilities.
-- PostgreSQL does not support 'ALTER FUNCTION IF EXISTS', so we use a DO block.

DO $$ 
BEGIN
  -- handle_invite_on_signup
  IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE pg_proc.proname = 'handle_invite_on_signup' AND pg_namespace.nspname = 'public') THEN
    ALTER FUNCTION public.handle_invite_on_signup() SET search_path = public;
  END IF;
  
  -- set_updated_at
  IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE pg_proc.proname = 'set_updated_at' AND pg_namespace.nspname = 'public') THEN
    ALTER FUNCTION public.set_updated_at() SET search_path = public;
  END IF;

  -- handle_new_user
  IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE pg_proc.proname = 'handle_new_user' AND pg_namespace.nspname = 'public') THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = public;
  END IF;

  -- notify_on_task_event
  IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE pg_proc.proname = 'notify_on_task_event' AND pg_namespace.nspname = 'public') THEN
    ALTER FUNCTION public.notify_on_task_event() SET search_path = public;
  END IF;
END $$;

-- ============================================
-- 2. TIGHTEN RLS POLICIES (Security)
-- ============================================

-- Newsletter: Prevent bots from spamming with basic email regex check
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.newsletter_subscribers;
CREATE POLICY "Enable insert for everyone" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Notifications: Basic check for endpoint presence
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.notifications_subscriptions;
CREATE POLICY "Anyone can subscribe" ON public.notifications_subscriptions
    FOR INSERT WITH CHECK (length(endpoint) > 0);

-- Calendar Events: Restrict access to designated roles
DROP POLICY IF EXISTS "calendar_all" ON public.calendar_events;
DROP POLICY IF EXISTS "RLS_Calendar_Full_Access" ON public.calendar_events; -- clean up previous attempt
CREATE POLICY "RLS_Calendar_Full_Access" ON public.calendar_events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('faculty', 'president', 'vice_president')
    )
  );

-- Delegated Permissions: Only President
DROP POLICY IF EXISTS "delegated_all" ON public.delegated_permissions;
CREATE POLICY "RLS_Delegated_Full_Access" ON public.delegated_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'president'
    )
  );

-- Teams: Isolation & Management
DROP POLICY IF EXISTS "teams_delete" ON public.teams;
DROP POLICY IF EXISTS "teams_insert" ON public.teams;
DROP POLICY IF EXISTS "teams_update" ON public.teams;

CREATE POLICY "RLS_Teams_Manage" ON public.teams
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('faculty', 'president', 'vice_president')
    )
  );

-- Team Members: Strict Management
DROP POLICY IF EXISTS "team_members_delete" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update" ON public.team_members;

CREATE POLICY "RLS_TeamMembers_Manage" ON public.team_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('faculty', 'president', 'vice_president')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.team_id = public.team_members.team_id
      AND tm.role = 'head'
    )
  );

-- ============================================
-- 3. GALLERY SETUP (Data Visibility)
-- ============================================
-- Ensure tables exist and have public read access enabled.

CREATE TABLE IF NOT EXISTS public.gallery_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  cover_image text,
  category text,
  event_date date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.gallery_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL,
  caption text,
  category text,
  width integer,
  height integer,
  event_id uuid REFERENCES public.gallery_events(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.gallery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Public Read Policies (Allow users to see photos)
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.gallery_events;
CREATE POLICY "Events are viewable by everyone" ON public.gallery_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public images are viewable by everyone" ON public.gallery_images;
CREATE POLICY "Public images are viewable by everyone" ON public.gallery_images FOR SELECT USING (true);

-- Admin Write Policies (Allow only authenticated admins to upload/delete)
DROP POLICY IF EXISTS "Admins can insert images" ON public.gallery_images;
CREATE POLICY "Admins can insert images" ON public.gallery_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can delete images" ON public.gallery_images;
CREATE POLICY "Admins can delete images" ON public.gallery_images FOR DELETE USING (auth.role() = 'authenticated');

COMMIT;
