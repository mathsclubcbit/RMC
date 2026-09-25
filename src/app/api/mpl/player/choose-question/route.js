import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(request) {
    const sessionClient = await createClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user?.email) return Response.json({ error: 'Player authentication required.' }, { status: 401 });

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
    const matchId = String(body.matchId || '').trim();
    const requestId = String(body.requestId || '').trim();
    const ballNumber = Number(body.ballNumber);
    if (!matchId || !requestId || !Number.isInteger(ballNumber)) return Response.json({ error: 'Match, delivery request, and ball selection are required.' }, { status: 400 });

    const admin = createAdminClient();
    const [{ data: player, error: playerError }, { data: pending, error: requestError }, { data: match, error: matchError }] = await Promise.all([
        admin.from('mpl_players').select('id, team_id').eq('email', user.email).single(),
        admin.from('mpl_match_delivery_requests').select('*').eq('id', requestId).eq('match_id', matchId).single(),
        admin.from('mpl_matches').select('id, status, total_questions_per_innings, question_distribution, timer_config, rules_config').eq('id', matchId).single()
    ]);
    if (playerError || !player) return Response.json({ error: 'No MPL player record found.' }, { status: 404 });
    if (requestError || !pending) return Response.json({ error: 'Delivery request not found.' }, { status: 404 });
    if (matchError || !match) return Response.json({ error: 'Match not found.' }, { status: 404 });
    if (pending.bowler_id !== player.id) return Response.json({ error: 'Only the selected bowler can choose this question type.' }, { status: 403 });
    if (pending.status !== 'pending') return Response.json({ error: 'This delivery is no longer awaiting question selection.' }, { status: 409 });
    if (match.status !== `innings_${pending.innings_number}`) return Response.json({ error: 'This innings is not currently active.' }, { status: 409 });

    const distribution = match.question_distribution && typeof match.question_distribution === 'object' ? match.question_distribution : {};
    const plan = Array.isArray(match.rules_config?.question_plan) ? match.rules_config.question_plan : [];
    const { data: deliveries, error: deliveriesError } = await admin
        .from('mpl_match_deliveries')
        .select('ball_type_slug, status')
        .eq('match_id', matchId)
        .eq('innings_number', pending.innings_number);
    if (deliveriesError) return Response.json({ error: deliveriesError.message }, { status: 500 });

    const usedCounts = (deliveries || []).reduce((counts, delivery) => {
        if (!['no_ball', 'cancelled'].includes(delivery.status)) counts[delivery.ball_type_slug] = (counts[delivery.ball_type_slug] || 0) + 1;
        return counts;
    }, {});
    const plannedCounts = plan.reduce((counts, item) => {
        const kind = typeof item === 'string' ? 'question' : item?.kind;
        const slug = typeof item === 'string' ? item : item?.slug;
        const key = kind === 'wide' ? 'wide' : slug;
        if (key) counts[key] = (counts[key] || 0) + 1;
        return counts;
    }, {});
    if (!Object.keys(plannedCounts).length) {
        Object.assign(plannedCounts, distribution, { wide: Number(match.rules_config?.wide_ball_count || 4) });
    }
    const availableTypes = Object.entries(plannedCounts).flatMap(([slug, count]) =>
        Array.from({ length: Math.max(0, Number(count) - Number(usedCounts[slug] || 0)) }, () => slug)
    );
    if (!availableTypes.length) return Response.json({ error: 'No balls remain in this innings.' }, { status: 409 });
    const ballTypeSlug = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const isWide = ballTypeSlug === 'wide';
    if (isWide) {
        const { error: lockError } = await admin
            .from('mpl_match_delivery_requests')
            .update({ status: 'selecting' })
            .eq('id', pending.id)
            .eq('status', 'pending');
        if (lockError) return Response.json({ error: lockError.message }, { status: 500 });
        const { data: delivery, error: deliveryError } = await admin
            .from('mpl_match_deliveries')
            .insert({
                match_id: matchId,
                innings_number: pending.innings_number,
                delivery_number: pending.delivery_number,
                question_id: null,
                ball_type_slug: 'wide',
                batter_id: pending.batter_id,
                bowler_id: pending.bowler_id,
                timer_seconds: 1,
                status: 'wide',
                runs_awarded: 1,
                answer_submitted_at: new Date().toISOString(),
                metadata: { automatic_wide: true }
            })
            .select()
            .single();
        if (deliveryError) {
            await admin.from('mpl_match_delivery_requests').update({ status: 'pending' }).eq('id', pending.id);
            return Response.json({ error: deliveryError.message }, { status: 409 });
        }
        await admin.from('mpl_match_delivery_requests').update({ status: 'selected', delivery_id: delivery.id, selected_at: new Date().toISOString() }).eq('id', pending.id).eq('status', 'selecting');
        return Response.json({ delivery, wide: true });
    }
    const { data: ballType, error: ballTypeError } = await admin
        .from('mpl_ball_types')
        .select('slug, default_timer_seconds, timer_adjustment_seconds')
        .eq('slug', ballTypeSlug)
        .single();
    if (ballTypeError || !ballType) return Response.json({ error: 'Question type not found.' }, { status: 404 });

    const { error: lockError } = await admin
        .from('mpl_match_delivery_requests')
        .update({ status: 'selecting' })
        .eq('id', pending.id)
        .eq('status', 'pending');
    if (lockError) return Response.json({ error: lockError.message }, { status: 500 });

    const baseTimer = Number(match.timer_config?.base_seconds || 60);
    const adjustment = Number(match.timer_config?.adjustment_seconds || 0);
    const effectiveTimer = Math.max(10, baseTimer + adjustment + (ballType.default_timer_seconds - 60));
    const { data: delivery, error: deliveryError } = await admin.rpc('mpl_select_delivery', {
        p_match_id: matchId,
        p_innings_number: pending.innings_number,
        p_delivery_number: pending.delivery_number,
        p_ball_type_slug: ballTypeSlug,
        p_batter_id: pending.batter_id,
        p_bowler_id: pending.bowler_id,
        p_timer_seconds: effectiveTimer
    });
    if (deliveryError) {
        await admin.from('mpl_match_delivery_requests').update({ status: 'pending' }).eq('id', pending.id);
        return Response.json({ error: deliveryError.message }, { status: 409 });
    }

    const { data: question, error: questionError } = await admin
        .from('mpl_questions')
        .select('id, ball_type_slug, question_text, options, runs, timer_seconds, metadata')
        .eq('id', delivery.question_id)
        .single();
    if (questionError) return Response.json({ error: questionError.message }, { status: 500 });

    let selectedDelivery = delivery;
    if (question.timer_seconds && question.timer_seconds !== delivery.timer_seconds) {
        const { data: adjustedDelivery, error: timerError } = await admin
            .from('mpl_match_deliveries')
            .update({ timer_seconds: question.timer_seconds, answer_started_at: new Date().toISOString() })
            .eq('id', delivery.id)
            .select()
            .single();
        if (timerError) return Response.json({ error: timerError.message }, { status: 500 });
        selectedDelivery = adjustedDelivery;
    }

    const { error: completeError } = await admin
        .from('mpl_match_delivery_requests')
        .update({ status: 'selected', delivery_id: selectedDelivery.id, selected_at: new Date().toISOString() })
        .eq('id', pending.id)
        .eq('status', 'selecting');
    if (completeError) return Response.json({ error: completeError.message }, { status: 500 });
    return Response.json({ delivery: selectedDelivery, question });
}
