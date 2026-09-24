import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import MatchSetupClient from './MatchSetupClient';

export const metadata = { title: 'Create MPL Match | RMC' };

export default async function MplMatchSetupPage() {
    const cookieStore = await cookies();
    if (cookieStore.get('mpl_admin_auth')?.value !== 'true') redirect('/mpl/admin');

    const admin = createAdminClient();
    const [{ data: teams, error: teamsError }, { data: ballTypes, error: ballTypesError }] = await Promise.all([
        admin.from('mpl_teams').select('id, team_code, team_name, mpl_players(id, name, is_leader, created_at)').order('created_at', { ascending: false }),
        admin.from('mpl_ball_types').select('slug, name, description, default_runs, default_timer_seconds, is_special').order('slug')
    ]);

    if (teamsError || ballTypesError) {
        return <main className="min-h-screen bg-[#050505] p-8 text-red-300">Unable to load match setup data.</main>;
    }

    return <MatchSetupClient teams={teams || []} ballTypes={ballTypes || []} />;
}
