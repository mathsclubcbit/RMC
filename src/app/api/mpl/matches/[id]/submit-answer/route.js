import { createAdminClient } from '@/lib/supabase/server';
import { requireMplAdmin } from '@/lib/mpl/admin-auth';

export async function POST(request, { params }) {
    const authError = await requireMplAdmin();
    if (authError) return authError;
    const { id } = await params;

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
    const phase = String(body.phase || '');
    const answerOption = Number(body.answerOption);
    const powerShot = body.powerShot === true;
    if (!['batter', 'bowler'].includes(phase) || !Number.isInteger(answerOption) || answerOption < 0) {
        return Response.json({ error: 'A valid answer phase and option are required.' }, { status: 400 });
    }

    const { data, error } = await createAdminClient().rpc('mpl_submit_answer', {
        p_delivery_id: id,
        p_phase: phase,
        p_answer_option: answerOption,
        p_power_shot: powerShot
    });
    if (error) return Response.json({ error: error.message }, { status: 409 });
    return Response.json({ delivery: data });
}
