import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(request) {
    const sessionClient = await createClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user?.email) return Response.json({ error: 'Player authentication required.' }, { status: 401 });

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
    
    const matchId = String(body.matchId || '').trim();
    const inningsNumber = Number(body.inningsNumber);
    if (!matchId || !inningsNumber) return Response.json({ error: 'Match ID and innings number are required.' }, { status: 400 });

    const admin = createAdminClient();
    const { data: player } = await admin.from('mpl_players').select('id, is_leader').eq('email', user.email).single();
    if (!player || !player.is_leader) return Response.json({ error: 'Only the captain can arm the Power Shot.' }, { status: 403 });

    const { data: match } = await admin.from('mpl_matches').select('rules_config, status').eq('id', matchId).single();
    if (!match) return Response.json({ error: 'Match not found.' }, { status: 404 });
    
    if (match.status !== `innings_${inningsNumber}`) return Response.json({ error: 'This innings is not active.' }, { status: 409 });

    const rulesConfig = typeof match.rules_config === 'object' && match.rules_config !== null ? match.rules_config : {};
    rulesConfig[`power_shot_armed_${inningsNumber}`] = true;
    
    const { error } = await admin.from('mpl_matches').update({ rules_config: rulesConfig }).eq('id', matchId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    
    return Response.json({ success: true });
}
