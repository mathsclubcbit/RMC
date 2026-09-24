import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function GET() {
    const sessionClient = await createClient();
    const { data: { session } } = await sessionClient.auth.getSession();
    if (!session?.user?.email) return Response.json({ error: 'Player authentication required.' }, { status: 401 });

    const admin = createAdminClient();
    const { data: player, error: playerError } = await admin
        .from('mpl_players')
        .select('id, team_id, name, team:mpl_teams(id, team_name, team_code)')
        .eq('email', session.user.email)
        .single();
    if (playerError || !player) return Response.json({ error: 'No MPL player record found.' }, { status: 404 });

    const { data: matchTeam, error: matchTeamError } = await admin
        .from('mpl_match_teams')
        .select('match_id, innings_number, mpl_matches!inner(id, status, total_questions_per_innings, first_batting_team_id, created_at)')
        .eq('team_id', player.team_id)
        .not('mpl_matches.status', 'in', '(completed,abandoned)')
        .order('created_at', { foreignTable: 'mpl_matches', ascending: false })
        .limit(1)
        .maybeSingle();
    if (matchTeamError) return Response.json({ error: matchTeamError.message }, { status: 500 });
    if (!matchTeam) return Response.json({ match: null });

    const match = matchTeam.mpl_matches;
    if (!match) return Response.json({ match: null });

    const { error: presenceError } = await admin
        .from('mpl_match_player_presence')
        .upsert({ match_id: match.id, player_id: player.id, last_seen_at: new Date().toISOString(), left_at: null }, { onConflict: 'match_id,player_id' });
    if (presenceError) return Response.json({ error: presenceError.message }, { status: 500 });

    const { data: matchTeams, error: teamsError } = await admin
        .from('mpl_match_teams')
        .select('team_id, innings_number, mpl_teams(id, team_name, team_code)')
        .eq('match_id', match.id)
        .order('innings_number');
    if (teamsError) return Response.json({ error: teamsError.message }, { status: 500 });

    const teamIds = (matchTeams || []).map((team) => team.team_id);
    const { data: players, error: playersError } = await admin
        .from('mpl_players')
        .select('id, team_id, name, roll_number, is_leader')
        .in('team_id', teamIds)
        .order('created_at');
    if (playersError) return Response.json({ error: playersError.message }, { status: 500 });

    const activeSince = new Date(Date.now() - 15000).toISOString();
    const { data: presence, error: presenceListError } = await admin
        .from('mpl_match_player_presence')
        .select('player_id')
        .eq('match_id', match.id)
        .is('left_at', null)
        .gte('last_seen_at', activeSince);
    if (presenceListError) return Response.json({ error: presenceListError.message }, { status: 500 });
    const joinedPlayerIds = new Set((presence || []).map((entry) => entry.player_id));

    const otherTeamId = teamIds.find((teamId) => teamId !== match.first_batting_team_id);
    const battingTeamId = match.status === 'innings_2' ? otherTeamId : match.first_batting_team_id;
    const orderedTeams = [...(matchTeams || [])].sort((first, second) => {
        if (first.team_id === battingTeamId) return -1;
        if (second.team_id === battingTeamId) return 1;
        return first.innings_number - second.innings_number;
    }).map((team) => ({
        ...team.mpl_teams,
        team_id: team.team_id,
        is_batting: team.team_id === battingTeamId,
        players: (players || []).filter((player) => player.team_id === team.team_id && joinedPlayerIds.has(player.id))
    }));

    const { data: activeDelivery, error: deliveryError } = await admin
        .from('mpl_match_deliveries')
        .select('id, innings_number, delivery_number, ball_type_slug, batter_id, bowler_id, timer_seconds, status, answer_started_at, metadata, mpl_questions(question_text, options)')
        .eq('match_id', match.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (deliveryError) return Response.json({ error: deliveryError.message }, { status: 500 });

    return Response.json({
        player: { id: player.id, name: player.name, team: player.team },
        match: { ...match, team_id: player.team_id, innings_number: matchTeam.innings_number, batting_team_id: battingTeamId },
        teams: orderedTeams,
        activeDelivery: activeDelivery ? {
            ...activeDelivery,
            question: activeDelivery.mpl_questions,
            mpl_questions: undefined
        } : null
    });
}

export async function POST(request) {
    const sessionClient = await createClient();
    const { data: { session } } = await sessionClient.auth.getSession();
    if (!session?.user?.email) return Response.json({ error: 'Player authentication required.' }, { status: 401 });

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
    const matchId = String(body.matchId || '');
    if (!matchId) return Response.json({ error: 'Match ID is required.' }, { status: 400 });

    const admin = createAdminClient();
    const { data: player } = await admin.from('mpl_players').select('id').eq('email', session.user.email).single();
    if (!player) return Response.json({ error: 'No MPL player record found.' }, { status: 404 });

    const { error } = await admin
        .from('mpl_match_player_presence')
        .update({ left_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .eq('player_id', player.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
}
