-- ============================================
-- 010: Recruitment Workflow Phase 2
-- Tasks & Interviews
-- ============================================

-- 1. Add Workflow Columns to recruitment_applications
ALTER TABLE public.recruitment_applications
ADD COLUMN IF NOT EXISTS task_status TEXT DEFAULT 'PENDING'
    CHECK (task_status IN ('PENDING', 'SENT', 'SUBMITTED', 'EVALUATED')),
ADD COLUMN IF NOT EXISTS task_file_url TEXT,
ADD COLUMN IF NOT EXISTS task_responses JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS interview_status TEXT DEFAULT 'PENDING'
    CHECK (interview_status IN ('PENDING', 'SCHEDULED', 'COMPLETED', 'NO_SHOW')),
ADD COLUMN IF NOT EXISTS interview_link TEXT,
ADD COLUMN IF NOT EXISTS interview_time TIMESTAMPTZ;

-- 2. Create Storage Bucket for Task Submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'recruitment_tasks', 
    'recruitment_tasks', 
    true, 
    5242880, -- 5MB limit
    ARRAY['application/pdf']
) ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Storage Bucket Policies
-- Allow public viewing (needed for admins to view easily)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'recruitment_tasks');

-- Allow anyone to upload to this bucket (public uploads, secured via application ID path generation in the API)
CREATE POLICY "Public Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'recruitment_tasks');
