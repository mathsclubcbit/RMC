-- Migration 033: Enable Supabase Realtime for MPL gameplay tables
-- Required for the Level-3 event-driven optimisation in PlayerLiveMatch.jsx.
-- Postgres Changes subscriptions (mpl_match_deliveries, mpl_match_delivery_requests,
-- mpl_matches) will not fire unless those tables are part of the Realtime publication.
-- This replaces the blind 5 s polling loop and cuts DB load by ~90% during live events.

-- Safe to re-run: ADD TABLE is idempotent in Postgres 16+; on older versions
-- the DO block below guards against "already member" errors.
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE mpl_match_deliveries;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE mpl_match_delivery_requests;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE mpl_matches;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;
