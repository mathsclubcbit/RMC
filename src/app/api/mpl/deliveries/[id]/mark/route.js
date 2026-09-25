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
    return Response.json({ delivery: data });
}
