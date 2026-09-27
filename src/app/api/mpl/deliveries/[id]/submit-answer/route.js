import { createAdminClient } from '@/lib/supabase/server';
import { requireMplAdmin } from '@/lib/mpl/admin-auth';

// POST /api/mpl/deliveries/[id]/submit-answer
// [id] is the delivery ID
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

    const admin = createAdminClient();
    const { data, error } = await admin.rpc('mpl_submit_answer', {
        p_delivery_id: id,
        p_phase: phase,
        p_answer_option: answerOption,
        p_power_shot: powerShot
    });
    if (error) return Response.json({ error: error.message }, { status: 409 });

    if (data && data.status !== 'active') {
        const { data: match } = await admin.from('mpl_matches').select('status, total_questions_per_innings').eq('id', data.match_id).single();
        const { data: allDeliveries } = await admin
            .from('mpl_match_deliveries')
            .select('innings_number, status, runs_awarded, score_adjustment')
            .eq('match_id', data.match_id);
        
        let innings1Runs = 0;
        let innings2Runs = 0;
        let legal1 = 0;
        let legal2 = 0;
        
        for (const d of (allDeliveries || [])) {
            const isLegal = !['wide', 'no_ball', 'cancelled'].includes(d.status);
            if (d.innings_number === 1) {
                innings1Runs += (Number(d.runs_awarded) || 0) + (Number(d.score_adjustment) || 0);
                if (isLegal) legal1++;
            }
            if (d.innings_number === 2) {
                innings2Runs += (Number(d.runs_awarded) || 0) + (Number(d.score_adjustment) || 0);
                if (isLegal) legal2++;
            }
        }
        
        if (data.innings_number === 1 && match?.status === 'innings_1' && legal1 >= match.total_questions_per_innings) {
            await admin.from('mpl_matches').update({ status: 'innings_2' }).eq('id', data.match_id);
        } else if (data.innings_number === 2) {
            if (innings2Runs > innings1Runs || legal2 >= match?.total_questions_per_innings) {
                await admin.from('mpl_matches').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', data.match_id);
            }
        }
    }

    return Response.json({ delivery: data });
}
