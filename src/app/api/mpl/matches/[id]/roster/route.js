import { createAdminClient } from '@/lib/supabase/server';
import { requireMplAdmin } from '@/lib/mpl/admin-auth';

export async function GET(request, { params }) {
    const authError = await requireMplAdmin();
    if (authError) return authError;
    const { id } = await params;
    const admin = createAdminClient();

    const { data: teams, error: teamsError } = await admin
        .from('mpl_match_teams')
        .select('team_id, innings_number, batting_order, bowling_order, mentor_name, mentor_email, mpl_teams(id, team_name, team_code)')
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

    const activeSince = new Date(Date.now() - 45000).toISOString();
    const { data: presence, error: presenceError } = await admin
        .from('mpl_match_player_presence')
        .select('player_id')
        .eq('match_id', id)
        .is('left_at', null)
        .gte('last_seen_at', activeSince);
    if (presenceError) return Response.json({ error: presenceError.message }, { status: 500 });
    const { data: wickets, error: wicketsError } = await admin
        .from('mpl_match_deliveries')
        .select('batter_id')
        .eq('match_id', id)
        .eq('status', 'wicket');
    if (wicketsError) return Response.json({ error: wicketsError.message }, { status: 500 });
    const dismissedPlayerIds = new Set((wickets || []).map((delivery) => delivery.batter_id));
    const joinedPlayerIds = new Set((presence || []).map((entry) => entry.player_id));
    // The organiser must still be able to assign the registered lineup before
    // players open the live room. Once presence exists, use only available
    // players so absences follow the announced rotation rule.
    return Response.json({ teams: (teams || []).map((team) => ({
        ...team,
        online_count: joinedPlayerIds.size > 0
            ? (players || []).filter((player) => player.team_id === team.team_id && joinedPlayerIds.has(player.id)).length
            : 0,
        players: (players || []).filter((player) => player.team_id === team.team_id).map((player) => ({
            ...player,
            is_online: joinedPlayerIds.has(player.id),
            is_out: dismissedPlayerIds.has(player.id)
        }))
    })) });
}
