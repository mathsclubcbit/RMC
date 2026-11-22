import { createAdminClient } from '@/lib/supabase/server';
import { requireMplAdmin } from '@/lib/mpl/admin-auth';

export async function POST(request) {
    const authError = await requireMplAdmin();
    if (authError) return authError;

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
    const teamId = String(body.teamId || '').trim();
    const rows = Array.isArray(body.players) ? body.players : [];
    if (!teamId || rows.length === 0) return Response.json({ error: 'A team and at least one player are required.' }, { status: 400 });

    const admin = createAdminClient();
    const [{ data: team, error: teamError }, { data: currentPlayers, error: playersError }] = await Promise.all([
        admin.from('mpl_teams').select('id').eq('id', teamId).single(),
        admin.from('mpl_players').select('id, email, roll_number').eq('team_id', teamId)
    ]);
    if (teamError || !team) return Response.json({ error: teamError?.message || 'Team not found.' }, { status: 404 });
    if (playersError) return Response.json({ error: playersError.message }, { status: 500 });
    if ((currentPlayers || []).length + rows.length > 10) return Response.json({ error: 'A team cannot have more than 10 players.' }, { status: 400 });

    const existingEmails = new Set((currentPlayers || []).map((player) => player.email.toLowerCase()));
    const existingRollNumbers = new Set((currentPlayers || []).map((player) => player.roll_number));
    const seenEmails = new Set();
    const seenRollNumbers = new Set();
    const players = rows.map((row) => ({
        team_id: teamId,
        is_leader: false,
        name: String(row.name || '').trim(),
        roll_number: String(row.roll_number || row.rollNo || '').trim(),
        email: String(row.email || '').trim().toLowerCase(),
        avatar_url: row.avatar_url ? String(row.avatar_url) : null,
        section: row.section ? String(row.section) : null,
        branch: String(row.branch || 'MPL').trim(),
        year: String(row.year || '1st').trim(),
        phone_number: String(row.phone_number || row.phone || '0000000000').trim()
    }));
    for (const player of players) {
        const invalid = !player.name || !player.roll_number || !player.email
            || existingEmails.has(player.email)
            || existingRollNumbers.has(player.roll_number)
            || seenEmails.has(player.email)
            || seenRollNumbers.has(player.roll_number);
        if (invalid) return Response.json({ error: 'Each imported player needs a unique name, roll number, and email.' }, { status: 400 });
        seenEmails.add(player.email);
        seenRollNumbers.add(player.roll_number);
    }

    const { data, error } = await admin.from('mpl_players').insert(players).select('id, name, roll_number, email');
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ players: data || [], count: data?.length || 0 }, { status: 201 });
}
