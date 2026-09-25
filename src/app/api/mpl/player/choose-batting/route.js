import { createAdminClient, createClient } from '@/lib/supabase/server';

// POST /api/mpl/player/choose-batting
// Called by the toss-winning team's player to choose bat or bowl.
export async function POST(request) {
    const sessionClient = await createClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user?.email) return Response.json({ error: 'Player authentication required.' }, { status: 401 });

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }

    const matchId = String(body.matchId || '');
    const choice = String(body.choice || ''); // 'bat' or 'bowl'
    if (!matchId) return Response.json({ error: 'Match ID is required.' }, { status: 400 });
    if (!['bat', 'bowl'].includes(choice)) return Response.json({ error: 'Choice must be "bat" or "bowl".' }, { status: 400 });

    const admin = createAdminClient();

    // Verify the player and their team
    const { data: player, error: playerError } = await admin
        .from('mpl_players')
        .select('id, team_id, is_leader')
        .eq('email', user.email)
        .single();
    if (playerError || !player) return Response.json({ error: 'No MPL player record found.' }, { status: 404 });

    // Verify the match is in toss_won state and this player's team won the toss
    const { data: match, error: matchError } = await admin
        .from('mpl_matches')
        .select('id, status, toss_winner_team_id')
        .eq('id', matchId)
        .single();
    if (matchError || !match) return Response.json({ error: 'Match not found.' }, { status: 404 });
    if (match.status !== 'toss_won') return Response.json({ error: 'The toss has not been decided yet, or the choice has already been made.' }, { status: 409 });
    if (match.toss_winner_team_id !== player.team_id) return Response.json({ error: 'Only a player from the toss-winning team can make this choice.' }, { status: 403 });

    // Get both teams to determine who bats first
    const { data: matchTeams, error: teamsError } = await admin
        .from('mpl_match_teams')
        .select('team_id, innings_number, side_name')
        .eq('match_id', matchId);
    if (teamsError || !matchTeams || matchTeams.length < 2) return Response.json({ error: 'Match teams not configured.' }, { status: 500 });

    const playerSide = matchTeams.find((team) => team.team_id === player.team_id);
    const opponentSide = matchTeams.find((team) => team.innings_number !== playerSide?.innings_number);
    const firstBattingTeamId = choice === 'bat' ? player.team_id : opponentSide?.team_id;
    if (!playerSide || !opponentSide || !firstBattingTeamId) {
        return Response.json({ error: 'Match sides are not configured correctly.' }, { status: 500 });
    }

    // Re-assign innings numbers via mpl_record_toss RPC
    const { data: updatedMatch, error: rpcError } = await admin.rpc('mpl_record_toss', {
        p_match_id: matchId,
        p_toss_winner_team_id: player.team_id,
        p_first_batting_team_id: firstBattingTeamId,
    });
    if (rpcError) {
        console.error("RPC Error in mpl_record_toss:", rpcError);
        return Response.json({ error: rpcError.message }, { status: 500 });
    }

    return Response.json({ match: updatedMatch, choice, firstBattingTeamId });
}
