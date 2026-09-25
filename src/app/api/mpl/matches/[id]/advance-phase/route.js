import { createAdminClient } from '@/lib/supabase/server';
import { requireMplAdmin } from '@/lib/mpl/admin-auth';

export async function POST(request, { params }) {
    const authError = await requireMplAdmin();
    if (authError) return authError;
    const { id } = await params;

    const admin = createAdminClient();
    
    const { data: match, error: fetchError } = await admin
        .from('mpl_matches')
        .select('status, total_questions_per_innings')
        .eq('id', id)
        .single();
        
    if (fetchError || !match) {
        return Response.json({ error: 'Match not found.' }, { status: 404 });
    }
    
    if (match.status === 'innings_1' || match.status === 'innings_2') {
        const inningsNumber = match.status === 'innings_1' ? 1 : 2;
        const [{ data: inningsTeam, error: teamError }, { data: deliveries, error: deliveriesError }] = await Promise.all([
            admin.from('mpl_match_teams').select('batting_order').eq('match_id', id).eq('innings_number', inningsNumber).single(),
            admin.from('mpl_match_deliveries').select('status').eq('match_id', id).eq('innings_number', inningsNumber)
        ]);
        if (teamError || deliveriesError || !inningsTeam) {
            return Response.json({ error: teamError?.message || deliveriesError?.message || 'Unable to verify innings completion.' }, { status: 500 });
        }
        const legalDeliveries = (deliveries || []).filter((delivery) => !['wide', 'no_ball', 'cancelled'].includes(delivery.status)).length;
        const wickets = (deliveries || []).filter((delivery) => delivery.status === 'wicket').length;
        const allOut = wickets >= (Array.isArray(inningsTeam.batting_order) ? inningsTeam.batting_order.length : 10);
        if (legalDeliveries < match.total_questions_per_innings && !allOut) {
            return Response.json({ error: 'The innings can advance only after the legal delivery limit or all-out condition is reached.' }, { status: 409 });
        }
    }

    let newStatus = match.status;
    let completedAt = null;
    if (match.status === 'innings_1') newStatus = 'innings_break';
    else if (match.status === 'innings_break') newStatus = 'innings_2';
    else if (match.status === 'innings_2') {
        newStatus = 'completed';
        completedAt = new Date().toISOString();
    }
    else {
        return Response.json({ error: 'Cannot advance phase from current status.' }, { status: 400 });
    }
    
    const updatePayload = { status: newStatus };
    if (completedAt) updatePayload.completed_at = completedAt;

    const { data, error } = await admin
        .from('mpl_matches')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
        
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ match: data });
}
