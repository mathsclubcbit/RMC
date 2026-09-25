UPDATE public.mpl_ball_types
SET default_runs = 4
WHERE slug = 'yorker';

UPDATE public.mpl_questions
SET runs = 4
WHERE ball_type_slug = 'yorker';