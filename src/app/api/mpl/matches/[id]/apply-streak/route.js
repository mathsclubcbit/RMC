import { requireMplAdmin } from '@/lib/mpl/admin-auth';

export async function POST() {
    const authError = await requireMplAdmin();
    if (authError) return authError;
    return Response.json({ error: 'Streak bonuses and deductions are calculated automatically.' }, { status: 410 });
}
