-- ============================================
-- 009: Recruitment Applications System
-- ============================================

-- Table: recruitment_applications
CREATE TABLE IF NOT EXISTS public.recruitment_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Core identity fields (always collected, locked in form builder)
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    phone TEXT NOT NULL,
    branch TEXT NOT NULL,
    year TEXT NOT NULL,

    -- Dynamic field responses (mirrors the form schema stored in settings)
    extra_fields JSONB DEFAULT '{}'::jsonb,

    -- Application status lifecycle
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),

    -- Admin review metadata
    reviewed_by TEXT,       -- admin username
    review_note TEXT,       -- optional note visible to applicant
    reviewed_at TIMESTAMPTZ,

    -- Timestamps
    applied_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Academic year tag (e.g. "2025-26")
    academic_year TEXT NOT NULL DEFAULT '2025-26'
);

-- Unique: one active (PENDING or APPROVED) application per email per academic year
-- Rejected applicants may re-apply
CREATE UNIQUE INDEX IF NOT EXISTS recruitment_unique_active
    ON public.recruitment_applications(email, academic_year)
    WHERE status IN ('PENDING', 'APPROVED');

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_recruitment_email ON public.recruitment_applications(email);
CREATE INDEX IF NOT EXISTS idx_recruitment_status ON public.recruitment_applications(status);
CREATE INDEX IF NOT EXISTS idx_recruitment_year ON public.recruitment_applications(academic_year);
CREATE INDEX IF NOT EXISTS idx_recruitment_applied_at ON public.recruitment_applications(applied_at DESC);

-- Auto-update updated_at on change
DROP TRIGGER IF EXISTS trg_recruitment_updated_at ON public.recruitment_applications;
CREATE TRIGGER trg_recruitment_updated_at
    BEFORE UPDATE ON public.recruitment_applications
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE public.recruitment_applications ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can INSERT a new application.
-- The API route handles all validation before inserting via service role key,
-- but we explicitly allow anon inserts here as a fallback.
CREATE POLICY "Anyone can submit a recruitment application"
    ON public.recruitment_applications FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Authenticated members (internal network) can read their own application
CREATE POLICY "Users can view their own application"
    ON public.recruitment_applications FOR SELECT
    TO authenticated
    USING (email = auth.jwt() ->> 'email');

-- Admins (via service role) bypass RLS entirely — no additional policies needed.
-- The admin panel queries use the service role key (createAdminClient).

-- ============================================
-- Seed Default Settings (recruitment config)
-- These live in the existing `settings` table (key-value store).
-- ============================================

-- Recruitment open/close toggle (default: TRUE = open)
INSERT INTO public.settings (key, value)
VALUES ('recruitment_open', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Current academic year label (update each year)
INSERT INTO public.settings (key, value)
VALUES ('recruitment_academic_year', '"2025-26"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Default form schema (dynamic fields only — core fields are always fixed)
-- Core fields: name, email, phone, roll_number, branch, year (locked, always collected)
-- This JSONB array defines all additional steps shown after the core steps.
INSERT INTO public.settings (key, value)
VALUES (
    'recruitment_form_schema',
    '[
        {
            "id": "interests",
            "type": "checkbox",
            "label": "Areas of Research Interest",
            "placeholder": "",
            "required": false,
            "options": [
                "Number Theory",
                "Algebra",
                "Geometry",
                "Calculus",
                "Probability & Statistics",
                "Cryptography",
                "Competitive Math",
                "Applied Mathematics"
            ]
        },
        {
            "id": "why_join",
            "type": "textarea",
            "label": "Statement of Purpose",
            "placeholder": "Why do you want to join RMC? (100–500 characters)",
            "required": true,
            "minLength": 100,
            "maxLength": 500
        }
    ]'::jsonb
)
ON CONFLICT (key) DO NOTHING;
