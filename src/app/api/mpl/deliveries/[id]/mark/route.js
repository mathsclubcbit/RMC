import { createAdminClient } from '@/lib/supabase/server';
import { requireMplAdmin } from '@/lib/mpl/admin-auth';

// POST /api/mpl/deliveries/[id]/mark
// [id] is the delivery ID
export async function POST(request, { params }) {
    const authError = await requireMplAdmin();
    if (authError) return authError;
    const { id } = await params;

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }

    const status = String(body.status || '');
    if (!['dot', 'wicket', 'wide', 'no_ball', 'cancelled'].includes(status)) {
        return Response.json({ error: 'A valid delivery status is required.' }, { status: 400 });
    }

    const { data, error } = await createAdminClient().rpc('mpl_mark_delivery', {
        p_delivery_id: id,
        p_status: status
    });

    if (error) return Response.json({ error: error.message }, { status: 409 });

    if (data && data.status !== 'active') {
        const admin = createAdminClient();
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
