import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = createAdminClient();

        // 1. Fetch all MPL teams
        const { data: teams, error } = await supabase
            .from('mpl_teams')
            .select('team_code, team_name');

        if (error) {
            console.error('Supabase fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch teams.' }, { status: 500 });
        }

        const formattedTeams = teams.map(team => ({
            registrationId: team.team_code,
            teamName: team.team_name || 'Unknown Team'
        }));

        return NextResponse.json({
            teams: formattedTeams
        }, { status: 200 });

    } catch (error) {
        console.error('MPL Search Teams Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
