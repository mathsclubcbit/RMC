-- RMC Security Hardening Migration
-- Resolve Supabase Linter Warnings

-- 1. Fix Function Search Paths (MANDATORY for SECURITY DEFINER)
ALTER FUNCTION public.handle_invite_on_signup() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 2. Hardening Permissive RLS Policies (Always True Warnings)

-- Calendar Events: Restrict ALL access to specific roles instead of 'authenticated' + 'true'
DROP POLICY IF EXISTS "calendar_all" ON public.calendar_events;
CREATE POLICY "RLS_Calendar_Full_Access" ON public.calendar_events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('faculty', 'president', 'vice_president')
    )
  );

-- Delegated Permissions: Tighten 'all' access
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

-- Teams: Tighten policies
DROP POLICY IF EXISTS "teams_delete" ON public.teams;
DROP POLICY IF EXISTS "teams_insert" ON public.teams;
DROP POLICY IF EXISTS "teams_update" ON public.teams;

CREATE POLICY "RLS_Teams_Manage" ON public.teams
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role IN ('faculty', 'president', 'vice_president') OR team = 'council')
    )
  );

-- Team Members: Tighten policies
DROP POLICY IF EXISTS "team_members_delete" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update" ON public.team_members;

CREATE POLICY "RLS_TeamMembers_Manage" ON public.team_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role IN ('faculty', 'president', 'vice_president') OR team = 'council')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.team_id = public.team_members.team_id
      AND tm.role = 'head'
    )
  );
