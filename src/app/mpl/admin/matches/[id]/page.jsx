import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import MatchLiveClient from './MatchLiveClient';

export const metadata = { title: 'MPL Live Match | RMC' };

export default async function MplLiveMatchPage({ params }) {
    const { id } = await params;
    const cookieStore = await cookies();
    if (cookieStore.get('mpl_admin_auth')?.value !== 'true') redirect('/mpl/admin');

    const { data: match, error: matchError } = await createAdminClient().from('mpl_matches').select('*').eq('id', id).single();
    if (matchError || !match) return <main className="min-h-screen bg-[#050505] p-8 text-red-300">Match not found.</main>;

    const admin = createAdminClient();
    const { data: matchTeams, error: teamsError } = await admin
        .from('mpl_match_teams')
        .select('*, mpl_teams(id, team_name, team_code)')
        .eq('match_id', id)
        .order('innings_number');
    if (teamsError) return <main className="min-h-screen bg-[#050505] p-8 text-red-300">Unable to load match teams.</main>;

    const joinedPlayers = [];
    const { data: deliveries } = await admin.from('mpl_match_deliveries').select('*, mpl_questions(question_text, options, explanation)').eq('match_id', id).order('innings_number').order('delivery_number');
        const teamsWithPlayers = (matchTeams || []).map((team) => ({
            ...team,
            players: joinedPlayers.filter((player) => player.team_id === team.team_id)
        }));

        return <MatchLiveClient match={match} matchTeams={teamsWithPlayers} players={joinedPlayers} initialDeliveries={deliveries || []} />;
}
