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
    const battingTeamIds = (matchTeams || []).filter((team) => team.innings_number === inningsNumber).map((team) => team.team_id);
    const bowlingTeamIds = (matchTeams || []).filter((team) => team.innings_number !== inningsNumber).map((team) => team.team_id);
    if (!battingTeamIds.length || !bowlingTeamIds.length) return Response.json({ error: 'Match sides are incomplete.' }, { status: 409 });
    const inningsDeliveries = existingDeliveries || [];
    const legalDeliveryCount = inningsDeliveries.filter((delivery) => !['wide', 'no_ball', 'cancelled'].includes(delivery.status)).length;
    if (deliveryNumber !== legalDeliveryCount + 1) return Response.json({ error: `The next legal delivery is ${legalDeliveryCount + 1}.` }, { status: 409 });
    if (legalDeliveryCount >= match.total_questions_per_innings) return Response.json({ error: 'The innings delivery limit has been reached.' }, { status: 409 });

    const { data: selectedPlayers, error: selectedPlayersError } = await admin
        .from('mpl_players')
        .select('id, team_id')
        .in('id', [batterId, bowlerId]);
    if (selectedPlayersError) return Response.json({ error: selectedPlayersError.message }, { status: 500 });
    const selectedBatter = selectedPlayers?.find((player) => player.id === batterId);
    const selectedBowler = selectedPlayers?.find((player) => player.id === bowlerId);
    if (!selectedBatter || !battingTeamIds.includes(selectedBatter.team_id)) {
        return Response.json({ error: 'The selected batter must belong to the batting side.' }, { status: 409 });
    }
    if (!selectedBowler || !bowlingTeamIds.includes(selectedBowler.team_id)) {
        return Response.json({ error: 'The selected bowler must belong to the bowling side.' }, { status: 409 });
    }

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
