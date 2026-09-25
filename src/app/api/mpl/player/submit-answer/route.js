import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(request) {
    const sessionClient = await createClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user?.email) return Response.json({ error: 'Player authentication required.' }, { status: 401 });

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
    const deliveryId = String(body.deliveryId || '').trim();
    const answerOption = Number(body.answerOption);
    const phase = body.phase === 'bowler' ? 'bowler' : 'batter';
    const powerShot = body.powerShot === true;
    if (!deliveryId || !Number.isInteger(answerOption) || answerOption < 0) return Response.json({ error: 'A valid delivery and answer option are required.' }, { status: 400 });

    const admin = createAdminClient();
    const [{ data: player, error: playerError }, { data: delivery, error: deliveryError }] = await Promise.all([
        admin.from('mpl_players').select('id').eq('email', user.email).single(),
        admin.from('mpl_match_deliveries').select('id, batter_id, bowler_id, status, metadata').eq('id', deliveryId).single()
    ]);
    if (playerError || !player) return Response.json({ error: 'No MPL player record found.' }, { status: 404 });
    if (deliveryError || !delivery) return Response.json({ error: 'Delivery not found.' }, { status: 404 });
    if (phase === 'batter' && delivery.batter_id !== player.id) return Response.json({ error: 'Only the selected batter can answer this question.' }, { status: 403 });
    if (phase === 'bowler' && delivery.bowler_id !== player.id) return Response.json({ error: 'Only the selected bowler can answer the rescue attempt.' }, { status: 403 });
    if (delivery.status !== 'active') return Response.json({ error: 'This question is no longer active.' }, { status: 409 });
    if (phase === 'bowler' && delivery.metadata?.rescue_available !== true) return Response.json({ error: 'The bowler rescue attempt is not available yet.' }, { status: 409 });

    const { data, error } = await admin.rpc('mpl_submit_answer', {
        p_delivery_id: deliveryId,
        p_phase: phase,
        p_answer_option: answerOption,
        p_power_shot: powerShot
    });
    if (error) return Response.json({ error: error.message }, { status: 409 });
    return Response.json({ delivery: data });
}
