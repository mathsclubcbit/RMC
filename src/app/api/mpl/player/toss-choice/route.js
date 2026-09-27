import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(request) {
    const sessionClient = await createClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user?.email) return Response.json({ error: 'Player authentication required.' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const matchId = String(body.matchId || '');
    const choice = String(body.choice || '').toLowerCase();
    if (!matchId || !['heads', 'tails'].includes(choice)) return Response.json({ error: 'Choose heads or tails.' }, { status: 400 });

    const admin = createAdminClient();
    const [{ data: player }, { data: match }] = await Promise.all([
        admin.from('mpl_players').select('id, team_id, is_leader').eq('email', user.email).maybeSingle(),
        admin.from('mpl_matches').select('status, toss_calling_team_id, toss_choice').eq('id', matchId).maybeSingle()
    ]);
    if (!player || !match) return Response.json({ error: 'Player or match not found.' }, { status: 404 });
    if (!player.is_leader || player.team_id !== match.toss_calling_team_id) return Response.json({ error: 'Only the selected team captain can call the toss.' }, { status: 403 });
    if (match.status !== 'toss_pending' || match.toss_choice) return Response.json({ error: 'The toss choice has already been submitted.' }, { status: 409 });

    const { data, error } = await admin.from('mpl_matches').update({ toss_choice: choice }).eq('id', matchId).eq('status', 'toss_pending').select().single();
    if (error) return Response.json({ error: error.message }, { status: 409 });
    return Response.json({ match: data });
}