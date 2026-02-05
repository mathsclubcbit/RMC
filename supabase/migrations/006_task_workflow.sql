-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  message text,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Trigger function for task notifications
CREATE OR REPLACE FUNCTION public.notify_on_task_event()
RETURNS trigger AS $$
DECLARE
  member_record record;
  commander_name text;
BEGIN
  -- Get commander name
  SELECT full_name INTO commander_name FROM public.profiles WHERE id = NEW.assigned_by;

  -- 1. Notification for New Task
  IF (TG_OP = 'INSERT') THEN
    FOR member_record IN 
      SELECT id FROM public.profiles 
      WHERE team = NEW.team_scope 
      AND id != NEW.assigned_by -- Don't notify the person who created it
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (
        member_record.id,
        'New Mission: ' || NEW.title,
        commander_name || ' assigned a new task to your team: ' || NEW.team_scope,
        'task_assigned'
      );
    END LOOP;
  END IF;

  -- 2. Notification for Status Change (Review Required)
  IF (TG_OP = 'UPDATE' AND NEW.status = 'review' AND OLD.status != 'review') THEN
    -- Notify the Head of the team and Commanders
    FOR member_record IN 
      SELECT id FROM public.profiles 
      WHERE (team = NEW.team_scope AND role = 'head')
      OR role IN ('faculty', 'president', 'vice_president')
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (
        member_record.id,
        'Review Required: ' || NEW.title,
        'A task is ready for approval in ' || NEW.team_scope,
        'review_required'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind trigger
DROP TRIGGER IF EXISTS tr_notify_on_task ON public.tasks;
CREATE TRIGGER tr_notify_on_task
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.notify_on_task_event();

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. STRICT TASK VISIBILITY & MANAGEMENT (Hardening)
-- Drop old lax policies
DROP POLICY IF EXISTS "Commanders manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Heads manage team tasks" ON public.tasks;
DROP POLICY IF EXISTS "Members update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Strict Team Isolation for Tasks" ON public.tasks;
-- Drop new hardened policies (for idempotency)
DROP POLICY IF EXISTS "RLS_Task_Isolation" ON public.tasks;
DROP POLICY IF EXISTS "RLS_Commanders_Manage" ON public.tasks;
DROP POLICY IF EXISTS "RLS_Heads_Manage_Team" ON public.tasks;
DROP POLICY IF EXISTS "RLS_Members_Update_Self" ON public.tasks;

-- 1. Global View Policy (Isolation)
CREATE POLICY "RLS_Task_Isolation" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (role IN ('faculty', 'president', 'vice_president') OR team = 'council')
    )
    OR team_scope = (SELECT team FROM public.profiles WHERE id = auth.uid())
    OR assigned_to = auth.uid()
  );

-- 2. Management: High Command (Global)
CREATE POLICY "RLS_Commanders_Manage" ON public.tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('faculty', 'president', 'vice_president')
    )
  );

-- 3. Management: Heads (Team-Specific)
CREATE POLICY "RLS_Heads_Manage_Team" ON public.tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'head' 
      AND team = team_scope
    )
  );

-- 4. Management: Members (Self-Update Only)
CREATE POLICY "RLS_Members_Update_Self" ON public.tasks
  FOR UPDATE USING (
    assigned_to = auth.uid()
  );

