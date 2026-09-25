import { createAdminClient } from '@/lib/supabase/server';
import { requireMplAdmin } from '@/lib/mpl/admin-auth';

export async function GET() {
    const authError = await requireMplAdmin();
    if (authError) return authError;

    const { data, error } = await createAdminClient()
        .from('mpl_ball_types')
        .select('*')
        .order('slug');

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ballTypes: data || [] });
}
