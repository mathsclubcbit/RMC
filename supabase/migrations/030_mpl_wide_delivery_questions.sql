-- Wide deliveries do not have a question, so their delivery rows need a
-- nullable question reference.
ALTER TABLE public.mpl_match_deliveries
    ALTER COLUMN question_id DROP NOT NULL;

INSERT INTO public.mpl_ball_types
    (slug, name, description, default_runs, default_timer_seconds, timer_adjustment_seconds, is_special, metadata)
VALUES
    ('wide', 'Wide', 'Automatic wide ball worth one run.', 1, 1, 0, TRUE, '{"automatic":true}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    default_runs = EXCLUDED.default_runs,
    default_timer_seconds = EXCLUDED.default_timer_seconds,
    is_special = EXCLUDED.is_special,
    metadata = EXCLUDED.metadata;