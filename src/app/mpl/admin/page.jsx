import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import AdminLogin from './AdminLogin';
import MPLAdminClient from './MPLAdminClient';

export const metadata = {
    title: 'MPL Organiser Dashboard | RMC',
};

export default async function MPLAdminDashboard() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('mpl_admin_auth');
    if (authCookie?.value !== 'true') {
        return <AdminLogin />;
    }

    const admin = createAdminClient();
    
    // Fetch all teams
    const { data: teamsData, error: teamsError } = await admin
        .from('mpl_teams')
        .select('*')
        .order('created_at', { ascending: false });

    // Fetch all players
    const { data: playersData, error: playersError } = await admin
        .from('mpl_players')
        .select('*');

    if (teamsError || playersError) {
        return <div className="p-8 text-red-500">Error loading data. Make sure the database tables exist.</div>;
    }

    const teams = teamsData || [];
    const players = playersData || [];

    // Group players by team
    const teamsWithPlayers = teams.map(team => {
        return {
            ...team,
            players: players.filter(p => p.team_id === team.id)
        };
    });

    const totalTeams = teams.length;
    const totalPlayers = players.length;

    return (
        <MPLAdminClient 
            initialTeamsWithPlayers={teamsWithPlayers}
            totalTeams={totalTeams}
            totalPlayers={totalPlayers}
        />
    );
}
