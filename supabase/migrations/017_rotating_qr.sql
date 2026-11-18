CREATE TABLE IF NOT EXISTS public.quiz_entry_qrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    max_scans INTEGER DEFAULT 6,
    current_scans INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.quiz_entry_qrs ENABLE ROW LEVEL SECURITY;

-- Function for atomic increment
CREATE OR REPLACE FUNCTION increment_qr_scan(qr_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE public.quiz_entry_qrs
    SET current_scans = current_scans + 1
    WHERE id = qr_id 
      AND expires_at > NOW() 
      AND current_scans < max_scans;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
