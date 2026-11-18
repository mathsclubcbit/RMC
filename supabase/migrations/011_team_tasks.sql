-- ============================================
-- 011: Team Tasks
-- ============================================

CREATE TABLE IF NOT EXISTS public.recruitment_team_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_name TEXT NOT NULL,
    task_1_url TEXT,
    task_2_url TEXT,
    task_3_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint so each team only has one row of tasks
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_team_tasks ON public.recruitment_team_tasks(team_name);

-- Enable RLS
ALTER TABLE public.recruitment_team_tasks ENABLE ROW LEVEL SECURITY;

-- Admins can do everything (via service_role key bypasses RLS)
-- We don't need anon/authenticated policies since only API uses it with admin privileges
-- But just in case, we can add a select policy for authenticated if needed. 
-- The tasks are sent to applicants via API so they don't directly read this table.
