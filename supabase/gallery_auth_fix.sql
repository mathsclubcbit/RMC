-- RMC GALLERY AUTH FIX
-- Run this if you are getting "new row violates row-level security policy"

BEGIN;

-- 1. Tighten 'INSERT' policy using 'TO authenticated'
-- This is more robust than checking auth.role() in the expression
DROP POLICY IF EXISTS "Admins can insert images" ON public.gallery_images;
CREATE POLICY "RLS_Gallery_Insert_Auth" 
ON public.gallery_images 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. Ensure Grant permissions are correct
GRANT INSERT, UPDATE, DELETE, SELECT ON TABLE public.gallery_images TO authenticated;
GRANT SELECT ON TABLE public.gallery_images TO anon;

-- 3. Do the same for gallery_events just in case
DROP POLICY IF EXISTS "Admins can insert events" ON public.gallery_events;
CREATE POLICY "RLS_Gallery_Events_Insert_Auth" 
ON public.gallery_events 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

GRANT ALL ON TABLE public.gallery_events TO authenticated;
GRANT SELECT ON TABLE public.gallery_events TO anon;

COMMIT;
