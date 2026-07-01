-- Create the email_queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED')),
    attempts INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for efficient polling
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status, created_at);

-- RLS Policies
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (it's internal to the backend)
CREATE POLICY "Service role has full access to email_queue" ON public.email_queue
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');
