import { createAdminClient, createClient } from '@/lib/supabase/server';

// Lightweight heartbeat endpoint — called every 30 s instead of on every poll.
// Moves the WRITE off the hot /api/mpl/player/match path.
export async function POST() {
    const sessionClient = await createClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user?.email) return Response.json({ ok: false }, { status: 401 });

    const admin = createAdminClient();

    // Get player id + team
    const { data: player } = await admin
        .from('mpl_players')
        .select('id, team_id')
        .eq('email', user.email)
        .maybeSingle();
    if (!player) return Response.json({ ok: false }, { status: 404 });

    // Find their active match
    const { data: matchTeam } = await admin
        .from('mpl_match_teams')
        .select('match_id, mpl_matches!inner(status)')
        .eq('team_id', player.team_id)
        .not('mpl_matches.status', 'eq', 'abandoned')
        .order('created_at', { foreignTable: 'mpl_matches', ascending: false })
        .limit(1)
        .maybeSingle();

    if (!matchTeam?.match_id) return Response.json({ ok: true }); // No active match — nothing to upsert

    await admin
        .from('mpl_match_player_presence')
        .upsert(
            { match_id: matchTeam.match_id, player_id: player.id, last_seen_at: new Date().toISOString(), left_at: null },
            { onConflict: 'match_id,player_id' }
        );

    return Response.json({ ok: true });
}
