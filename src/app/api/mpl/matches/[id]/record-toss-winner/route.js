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

    const tossWinnerTeamId = String(body.tossWinnerTeamId || '');
    if (!tossWinnerTeamId) return Response.json({ error: 'Toss winner team ID is required.' }, { status: 400 });

    const admin = createAdminClient();

    // Verify match is in toss_pending state
    const { data: match, error: matchError } = await admin
        .from('mpl_matches')
        .select('status')
        .eq('id', id)
        .single();
    if (matchError || !match) return Response.json({ error: 'Match not found.' }, { status: 404 });
    if (match.status !== 'toss_pending') return Response.json({ error: 'Match is not awaiting a toss.' }, { status: 409 });

    // Verify the team is part of this match
    const { data: team, error: teamError } = await admin
        .from('mpl_match_teams')
        .select('team_id')
        .eq('match_id', id)
        .eq('team_id', tossWinnerTeamId)
        .single();
    if (teamError || !team) return Response.json({ error: 'That team is not part of this match.' }, { status: 400 });

    const { data: updated, error: updateError } = await admin
        .from('mpl_matches')
        .update({ status: 'toss_won', toss_winner_team_id: tossWinnerTeamId })
        .eq('id', id)
        .select()
        .single();
    if (updateError) return Response.json({ error: updateError.message }, { status: 500 });

    return Response.json({ match: updated });
}
