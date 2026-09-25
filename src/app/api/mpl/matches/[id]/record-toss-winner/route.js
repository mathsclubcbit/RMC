import { createAdminClient } from '@/lib/supabase/server';
import { requireMplAdmin } from '@/lib/mpl/admin-auth';

// POST /api/mpl/matches/[id]/record-toss-winner
// Admin announces who won the coin flip. The winning team then chooses bat/bowl
// from their own player screen (status transitions to 'toss_won').
export async function POST(request, { params }) {
    const authError = await requireMplAdmin();
    if (authError) return authError;
    const { id } = await params;

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }

    const tossCallingTeamId = String(body.tossCallingTeamId || '');
    const flip = body.flip === true;
    if (!tossCallingTeamId && !flip) return Response.json({ error: 'Select the team whose captain will call the toss.' }, { status: 400 });

    const admin = createAdminClient();

    // Verify match is in toss_pending state
    const { data: match, error: matchError } = await admin
        .from('mpl_matches')
        .select('status, toss_calling_team_id, toss_choice')
        .eq('id', id)
        .single();
    if (matchError || !match) return Response.json({ error: 'Match not found.' }, { status: 404 });
    if (match.status !== 'toss_pending') return Response.json({ error: 'Match is not awaiting a toss.' }, { status: 409 });

    if (!flip) {
        const { data: team } = await admin.from('mpl_match_teams').select('team_id').eq('match_id', id).eq('team_id', tossCallingTeamId).maybeSingle();
        if (!team) return Response.json({ error: 'That team is not part of this match.' }, { status: 400 });
        const { data: updated, error: updateError } = await admin.from('mpl_matches').update({ toss_calling_team_id: tossCallingTeamId, toss_choice: null, toss_result: null }).eq('id', id).select().single();
        if (updateError) return Response.json({ error: updateError.message }, { status: 500 });
        return Response.json({ match: updated });
    }

    if (!match.toss_calling_team_id || !match.toss_choice) return Response.json({ error: 'The captain must choose heads or tails first.' }, { status: 409 });
    const { data: tossTeams } = await admin.from('mpl_match_teams').select('team_id').eq('match_id', id);
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const winnerTeamId = result === match.toss_choice ? match.toss_calling_team_id : tossTeams?.find((team) => team.team_id !== match.toss_calling_team_id)?.team_id;
    const { data: updated, error: updateError } = await admin.from('mpl_matches').update({ status: 'toss_won', toss_result: result, toss_winner_team_id: winnerTeamId }).eq('id', id).select().single();
    if (updateError) return Response.json({ error: updateError.message }, { status: 500 });

    return Response.json({ match: updated });
}
