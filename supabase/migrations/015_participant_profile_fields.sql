-- ============================================================
-- Migration 015 -- Participant Extended Profile Fields
-- Adds: year, branch, college to ps_participants
-- ============================================================

ALTER TABLE ps_participants
    ADD COLUMN IF NOT EXISTS year    TEXT,   -- e.g. '2nd Year'
    ADD COLUMN IF NOT EXISTS branch  TEXT,   -- e.g. 'CSE', 'ECE'
    ADD COLUMN IF NOT EXISTS college TEXT;   -- e.g. 'CBIT'

COMMENT ON COLUMN ps_participants.year    IS 'Academic year of the participant (e.g. 2nd Year)';
COMMENT ON COLUMN ps_participants.branch  IS 'Branch / Department (e.g. CSE, ECE, MECH)';
COMMENT ON COLUMN ps_participants.college IS 'College name (e.g. CBIT)';
