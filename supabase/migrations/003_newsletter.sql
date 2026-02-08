-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL UNIQUE,
    name text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Everyone can insert (subscribe) with basic email format check
CREATE POLICY "Enable insert for everyone" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 2. Only authenticated users (admins) can view/select
CREATE POLICY "Enable select for authenticated users only" ON public.newsletter_subscribers
    FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Only admins can update (unsubscribe/resubscribe managment by admin for now, or self-service via separate logic)
CREATE POLICY "Enable update for authenticated users only" ON public.newsletter_subscribers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Only admins can delete
CREATE POLICY "Enable delete for authenticated users only" ON public.newsletter_subscribers
    FOR DELETE USING (auth.role() = 'authenticated');
