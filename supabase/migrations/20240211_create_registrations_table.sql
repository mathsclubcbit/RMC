
-- ============================================
-- 15. REGISTRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    registration_id TEXT NOT NULL, -- Ticket Code
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    roll_no TEXT NOT NULL,
    department TEXT NOT NULL,
    team_members JSONB DEFAULT '[]'::jsonb, -- Array of objects
    team_size INTEGER DEFAULT 1,
    amount NUMERIC DEFAULT 0,
    utr_id TEXT NOT NULL, -- Payment Transaction ID
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    screenshot_url TEXT,
    abstract TEXT,
    ppt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_utr_id ON registrations(utr_id);
CREATE INDEX IF NOT EXISTS idx_registrations_registration_id ON registrations(registration_id);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS trg_registrations_updated_at ON registrations;
CREATE TRIGGER trg_registrations_updated_at
BEFORE UPDATE ON registrations
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================
-- 16. RLS FOR REGISTRATIONS
-- ============================================
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Admins (President/Core) can view all registrations
CREATE POLICY "Admins can view all registrations"
    ON registrations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('president', 'vice_president', 'general_secretary', 'joint_secretary', 'head', 'faculty')
        )
    );

-- Admins can update registrations
CREATE POLICY "Admins can update registrations"
    ON registrations FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('president', 'vice_president', 'general_secretary', 'joint_secretary', 'head', 'faculty')
        )
    );

-- Service Role (API) has full access (implicit, but we can verify policies don't block it if we don't grant public access)
-- note: Service role bypasses RLS.
