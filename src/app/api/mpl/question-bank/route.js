import { createAdminClient } from '@/lib/supabase/server';
import { requireMplAdmin } from '@/lib/mpl/admin-auth';

function parseNullableInteger(value, minimum) {
    if (value === '' || value == null) return null;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= minimum ? parsed : undefined;
}

function normalizeQuestion(input) {
    const options = Array.isArray(input.options) ? input.options.map((option) => String(option).trim()) : [];
    const correctOption = Number(input.correctOption ?? input.correct_option);
    const questionText = String(input.questionText ?? input.question_text ?? '').trim();
    const ballTypeSlug = String(input.ballTypeSlug ?? input.ball_type_slug ?? '').trim();
    const runs = parseNullableInteger(input.runs, 0);
    const timerSeconds = parseNullableInteger(input.timerSeconds ?? input.timer_seconds, 1);

    if (!questionText || !ballTypeSlug || options.length < 2 || options.some((option) => !option) ||
        !Number.isInteger(correctOption) || correctOption < 0 || correctOption >= options.length ||
        runs === undefined || timerSeconds === undefined) {
        return null;
    }

    return {
        question_text: questionText,
        ball_type_slug: ballTypeSlug,
        options,
        correct_option: correctOption,
        explanation: input.explanation ? String(input.explanation) : null,
        runs,
        timer_seconds: timerSeconds,
        metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
        is_active: input.isActive !== false
    };
}

export async function GET(request) {
    const authError = await requireMplAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const ballType = searchParams.get('ballType');
    const search = searchParams.get('search');
    const admin = createAdminClient();
    let query = admin.from('mpl_questions').select('*, mpl_ball_types!inner(name)').order('created_at', { ascending: false });

    if (ballType) query = query.eq('ball_type_slug', ballType);
    if (search) query = query.ilike('question_text', `%${search}%`);

    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ questions: data || [] });
}

export async function POST(request) {
    const authError = await requireMplAdmin();
    if (authError) return authError;

    const body = await request.json();
    const inputs = Array.isArray(body.questions) ? body.questions : [body];
    const questions = inputs.map(normalizeQuestion);
    if (questions.some((question) => !question)) {
        return Response.json({ error: 'Each question needs text, a valid ball type, at least two options, and a valid correct option.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const slugs = [...new Set(questions.map((question) => question.ball_type_slug))];
    const { data: ballTypes, error: ballTypeError } = await admin.from('mpl_ball_types').select('slug, default_runs').in('slug', slugs);
    if (ballTypeError) return Response.json({ error: ballTypeError.message }, { status: 500 });
    if ((ballTypes || []).length !== slugs.length) {
        return Response.json({ error: 'One or more ball type slugs are not supported by MPL.' }, { status: 400 });
    }
    const defaultRuns = new Map((ballTypes || []).map((ballType) => [ballType.slug, ballType.default_runs]));
    if (questions.some((question) => question.runs == null && defaultRuns.get(question.ball_type_slug) == null)) {
        return Response.json({ error: 'Bouncer and Yorker questions must define a run value; Full Toss uses its configured higher-score default unless overridden.' }, { status: 400 });
    }

    const { data, error } = await admin.from('mpl_questions').insert(questions).select();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ questions: data || [], count: data?.length || 0 }, { status: 201 });
}
