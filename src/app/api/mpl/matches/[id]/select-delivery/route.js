import { createAdminClient } from '@/lib/supabase/server';
import { requireMplAdmin } from '@/lib/mpl/admin-auth';

export async function POST(request, { params }) {
    const authError = await requireMplAdmin();
    if (authError) return authError;
    const { id } = await params;

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
    const inningsNumber = Number(body.inningsNumber);
    const deliveryNumber = Number(body.deliveryNumber);
    const batterId = String(body.batterId || '').trim();
    const bowlerId = String(body.bowlerId || '').trim();
    if (!Number.isInteger(inningsNumber) || ![1, 2].includes(inningsNumber) || !Number.isInteger(deliveryNumber) || deliveryNumber < 1 || !batterId || !bowlerId) {
        return Response.json({ error: 'A valid innings, delivery number, batter, and bowler are required.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const [{ data: match, error: matchError }, { data: matchTeams, error: teamsError }, { data: existingDeliveries, error: deliveriesError }] = await Promise.all([
        admin.from('mpl_matches').select('status, total_questions_per_innings').eq('id', id).single(),
        admin.from('mpl_match_teams').select('team_id, innings_number, batting_order, bowling_order').eq('match_id', id).order('innings_number'),
        admin.from('mpl_match_deliveries').select('delivery_number, status, batter_id, bowler_id').eq('match_id', id).eq('innings_number', inningsNumber).order('delivery_number')
    ]);
    if (matchError || teamsError || deliveriesError || !match) return Response.json({ error: matchError?.message || teamsError?.message || deliveriesError?.message || 'Match not found.' }, { status: 404 });

    const expectedStatus = inningsNumber === 1 ? 'innings_1' : 'innings_2';
    if (match.status !== expectedStatus) return Response.json({ error: 'This innings is not currently active.' }, { status: 409 });
    const inningsTeam = (matchTeams || []).find((team) => team.innings_number === inningsNumber);
    const bowlingTeam = (matchTeams || []).find((team) => team.innings_number !== inningsNumber);
    if (!inningsTeam || !bowlingTeam) return Response.json({ error: 'Match lineups are incomplete.' }, { status: 409 });

    const inningsDeliveries = existingDeliveries || [];
    const legalDeliveryCount = inningsDeliveries.filter((delivery) => !['wide', 'no_ball', 'cancelled'].includes(delivery.status)).length;
    if (deliveryNumber !== legalDeliveryCount + 1) return Response.json({ error: `The next legal delivery is ${legalDeliveryCount + 1}.` }, { status: 409 });
    if (legalDeliveryCount >= match.total_questions_per_innings) return Response.json({ error: 'The innings delivery limit has been reached.' }, { status: 409 });

    const { data: activePresence, error: presenceError } = await admin
        .from('mpl_match_player_presence')
        .select('player_id')
        .eq('match_id', id)
        .is('left_at', null)
        .gte('last_seen_at', new Date(Date.now() - 15000).toISOString());
    if (presenceError) return Response.json({ error: presenceError.message }, { status: 500 });
    const joinedIds = new Set((activePresence || []).map((entry) => entry.player_id));
    const usePresence = joinedIds.size > 0;
    const dismissedPlayers = new Set(inningsDeliveries.filter((delivery) => delivery.status === 'wicket').map((delivery) => delivery.batter_id));
    const availableBatters = (Array.isArray(inningsTeam.batting_order) ? inningsTeam.batting_order : [])
        .filter((playerId) => !dismissedPlayers.has(playerId) && (!usePresence || joinedIds.has(playerId)));
    const lastDelivery = inningsDeliveries[inningsDeliveries.length - 1];
    const expectedBatterId = !lastDelivery || lastDelivery.status === 'wicket' ? availableBatters[0] : lastDelivery.batter_id;
    if (!expectedBatterId || batterId !== expectedBatterId) return Response.json({ error: 'The selected batter does not follow the finalized batting lineup.' }, { status: 409 });

    const availableBowlers = (Array.isArray(bowlingTeam.bowling_order) ? bowlingTeam.bowling_order : [])
        .filter((playerId) => !usePresence || joinedIds.has(playerId));
    const expectedBowlerId = availableBowlers.length ? availableBowlers[inningsDeliveries.length % availableBowlers.length] : null;
    if (!expectedBowlerId || bowlerId !== expectedBowlerId) return Response.json({ error: 'The selected bowler does not follow the reverse-order bowling system.' }, { status: 409 });

    const { data: existingRequest } = await admin
        .from('mpl_match_delivery_requests')
        .select('id, status, batter_id, bowler_id, delivery_number')
        .eq('match_id', id)
        .eq('innings_number', inningsNumber)
        .eq('status', 'pending')
        .maybeSingle();
    if (existingRequest) return Response.json({ error: 'This delivery is already waiting for the selected bowler.' }, { status: 409 });

    const { data: pendingDelivery, error: insertError } = await admin
        .from('mpl_match_delivery_requests')
        .insert({ match_id: id, innings_number: inningsNumber, delivery_number: inningsDeliveries.length + 1, batter_id: batterId, bowler_id: bowlerId })
        .select()
        .single();
    if (insertError) return Response.json({ error: insertError.message }, { status: 409 });
    return Response.json({ pendingDelivery, message: 'Players assigned. Waiting for the selected bowler to choose the question type.' });
}
