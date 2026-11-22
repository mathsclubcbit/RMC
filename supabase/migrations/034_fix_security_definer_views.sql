-- Migration: 034_fix_security_definer_views.sql
-- Description: Fix Supabase Security Advisor warnings by setting security_invoker = true
-- on views so they respect Row Level Security (RLS).

ALTER VIEW public.ps_leaderboard_view SET (security_invoker = true);
ALTER VIEW public.ps_contest_winners_view SET (security_invoker = true);
