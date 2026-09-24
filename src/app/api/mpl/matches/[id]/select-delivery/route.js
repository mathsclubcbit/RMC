import { createAdminClient } from '@/lib/supabase/server';
import { requireMplAdmin } from '@/lib/mpl/admin-auth';

export async function POST(request, { params }) {
    const authError = await requireMplAdmin();
    if (authError) return authError;
    const { id } = await params;

    const body = await request.json();
    const inningsNumber = Number(body.inningsNumber);
    const deliveryNumber = Number(body.deliveryNumber);
    const timerSeconds = Number(body.timerSeconds);
    const ballTypeSlug = String(body.ballTypeSlug || '').trim();
    const batterId = String(body.batterId || '').trim();
    const bowlerId = String(body.bowlerId || '').trim();

    if (!Number.isInteger(inningsNumber) || ![1, 2].includes(inningsNumber) ||
        !Number.isInteger(deliveryNumber) || deliveryNumber < 1 ||
        !ballTypeSlug || !batterId || !bowlerId) {
        return Response.json({ error: 'A valid innings, delivery number, ball type, batter, and bowler are required.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const [{ data: match, error: matchError }, { data: ballType, error: ballTypeError }] = await Promise.all([
        admin.from('mpl_matches').select('status, total_questions_per_innings, rules_config, timer_config').eq('id', id).single(),
        admin.from('mpl_ball_types').select('slug, default_timer_seconds, timer_adjustment_seconds').eq('slug', ballTypeSlug).single()
    ]);
    if (matchError || ballTypeError || !match || !ballType) {
        return Response.json({ error: matchError?.message || ballTypeError?.message || 'Match or ball type not found.' }, { status: 404 });
    }

    const questionPlan = Array.isArray(match.rules_config?.question_plan) ? match.rules_config.question_plan : [];
    const expectedBallType = questionPlan[deliveryNumber - 1];
    if (!expectedBallType || expectedBallType !== ballTypeSlug) {
        return Response.json({ error: `Delivery ${deliveryNumber} must use the planned ball type ${expectedBallType || 'none'}.` }, { status: 409 });
    }
    if (deliveryNumber > match.total_questions_per_innings) {
        return Response.json({ error: 'The innings delivery limit has been reached.' }, { status: 409 });
    }

    const configuredTimer = Number(match.timer_config?.base_seconds) + Number(match.timer_config?.adjustment_seconds || 0);
    const timerFromType = ballType.default_timer_seconds + ballType.timer_adjustment_seconds;
    const effectiveTimer = Number.isInteger(configuredTimer) ? Math.max(10, configuredTimer + (timerFromType - 60)) : timerSeconds;
    if (!Number.isInteger(effectiveTimer) || effectiveTimer < 1 || (timerSeconds && timerSeconds !== effectiveTimer)) {
        return Response.json({ error: `This delivery must use a ${effectiveTimer}-second timer.` }, { status: 409 });
    }

    const { data: delivery, error: deliveryError } = await admin.rpc('mpl_select_delivery', {
        p_match_id: id,
        p_innings_number: inningsNumber,
        p_delivery_number: deliveryNumber,
        p_ball_type_slug: ballTypeSlug,
        p_batter_id: batterId,
        p_bowler_id: bowlerId,
        p_timer_seconds: effectiveTimer
    });

    if (deliveryError) return Response.json({ error: deliveryError.message }, { status: 409 });

    const { data: question, error: questionError } = await admin
        .from('mpl_questions')
        .select('id, ball_type_slug, question_text, options, runs, timer_seconds, metadata')
        .eq('id', delivery.question_id)
        .single();

    if (questionError) return Response.json({ error: questionError.message }, { status: 500 });
    return Response.json({ delivery, question });
}
