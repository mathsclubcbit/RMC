import { createAdminClient } from '@/lib/supabase/server';
import { requireMplAdmin } from '@/lib/mpl/admin-auth';

export async function GET(request, { params }) {
    const authError = await requireMplAdmin();
    if (authError) return authError;
    const { id } = await params;
    const admin = createAdminClient();

    const { data: teams, error: teamsError } = await admin
        .from('mpl_match_teams')
        .select('team_id, innings_number, mpl_teams(id, team_name, team_code)')
        .eq('match_id', id)
        .order('innings_number');
    if (teamsError) return Response.json({ error: teamsError.message }, { status: 500 });

    const teamIds = (teams || []).map((team) => team.team_id);
    const { data: players, error: playersError } = await admin
        .from('mpl_players')
        .select('id, team_id, name, roll_number, is_leader')
        .in('team_id', teamIds)
        .order('created_at');
    if (playersError) return Response.json({ error: playersError.message }, { status: 500 });

    const activeSince = new Date(Date.now() - 15000).toISOString();
    const { data: presence, error: presenceError } = await admin
        .from('mpl_match_player_presence')
        .select('player_id')
        .eq('match_id', id)
        .is('left_at', null)
        .gte('last_seen_at', activeSince);
    if (presenceError) return Response.json({ error: presenceError.message }, { status: 500 });
    const joinedPlayerIds = new Set((presence || []).map((entry) => entry.player_id));

    return Response.json({ teams: (teams || []).map((team) => ({
        ...team,
        players: (players || []).filter((player) => player.team_id === team.team_id && joinedPlayerIds.has(player.id))
    })) });
}