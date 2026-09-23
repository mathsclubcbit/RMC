import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { IPL_TEAMS_2026 } from '@/constants/mpl';

export async function PATCH(request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
        }

        const { preferredIplTeam } = await request.json();
        const isValidTeam = IPL_TEAMS_2026.some(team => team.name === preferredIplTeam);

        if (!isValidTeam) {
            return NextResponse.json({ error: 'Please select a valid IPL team.' }, { status: 400 });
        }

        const admin = createAdminClient();
        const { data: player, error: lookupError } = await admin
            .from('mpl_players')
            .select('id, is_leader')
            .eq('email', session.user.email)
            .single();

        if (lookupError || !player) {
            return NextResponse.json({ error: 'MPL participant record not found.' }, { status: 404 });
        }

        if (!player.is_leader) {
            return NextResponse.json({ error: 'Only the team leader can choose the preferred IPL team.' }, { status: 403 });
        }

        const { error: updateError } = await admin
            .from('mpl_players')
            .update({ preferred_ipl_team: preferredIplTeam })
            .eq('id', player.id);

        if (updateError) {
            console.error('MPL preferred IPL team update error:', updateError);
            return NextResponse.json({ error: 'Failed to save your preferred team.' }, { status: 500 });
        }

        return NextResponse.json({ preferredIplTeam });
    } catch (error) {
        console.error('MPL preferred IPL team API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
