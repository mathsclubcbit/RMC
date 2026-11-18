import { createAdminClient } from '@/lib/supabase/server';
import { requireMplAdmin } from '@/lib/mpl/admin-auth';

export async function GET(request, { params }) {
    const authError = await requireMplAdmin();
    if (authError) return authError;
    const { id } = await params;

    const admin = createAdminClient();
    const [{ data: match, error: matchError }, { data: teams, error: teamsError }, { data: deliveries, error: deliveriesError }] = await Promise.all([
        admin.from('mpl_matches').select('*').eq('id', id).single(),
        admin.from('mpl_match_teams').select('*, mpl_teams(id, team_code, team_name), batting_order, bowling_order').eq('match_id', id).order('innings_number'),
        admin.from('mpl_match_deliveries').select('*, mpl_questions(question_text, options, explanation), batter:mpl_players!mpl_match_deliveries_batter_id_fkey(id, name), bowler:mpl_players!mpl_match_deliveries_bowler_id_fkey(id, name)').eq('match_id', id).order('innings_number').order('delivery_number')
    ]);

    if (matchError) return Response.json({ error: matchError.message }, { status: 404 });
    if (teamsError || deliveriesError) return Response.json({ error: teamsError?.message || deliveriesError?.message }, { status: 500 });

    const teamIds = (teams || []).map((team) => team.team_id);
    const { data: players, error: playersError } = await admin
        .from('mpl_players')
        .select('id, team_id, name, roll_number, is_leader')
        .in('team_id', teamIds)
        .order('created_at');
    if (playersError) return Response.json({ error: playersError.message }, { status: 500 });

    const teamsWithPlayers = (teams || []).map((team) => ({
        ...team,
        players: (players || []).filter((player) => player.team_id === team.team_id)
    }));
    return Response.json({ match, teams: teamsWithPlayers, deliveries: deliveries || [], server_time: new Date().toISOString() });
}

export async function POST(request, { params }) {
    const authError = await requireMplAdmin();
    if (authError) return authError;
    const { id } = await params;

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
    const tossWinnerTeamId = String(body.tossWinnerTeamId || '');
    const firstBattingTeamId = String(body.firstBattingTeamId || '');
    if (!tossWinnerTeamId || !firstBattingTeamId) return Response.json({ error: 'Toss winner and first batting team are required.' }, { status: 400 });

    const { data, error } = await createAdminClient().rpc('mpl_record_toss', {
        p_match_id: id,
        p_toss_winner_team_id: tossWinnerTeamId,
        p_first_batting_team_id: firstBattingTeamId
    });
    if (error) return Response.json({ error: error.message }, { status: 409 });
    return Response.json({ match: data });
}
