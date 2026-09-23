import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';

const EVENT_ID = 'mpl-2026';

export async function POST(req) {
    try {
        const body = await req.json();
        const { teamCode, name, email, avatar_url, phone, rollNo, section, branch, year, consent } = body;

        if (!teamCode || !name || !email || !phone || !rollNo || !branch || !year) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Check if Event is Open
        const { data: eventData } = await supabase
            .from('events')
            .select('payload')
            .eq('id', EVENT_ID)
            .single();

        if (eventData?.payload) {
            const payload = eventData.payload;
            const deadlineStr = payload.regEndDate || payload.endDate || payload.date || payload.startDate;
            if (deadlineStr) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (new Date(deadlineStr) < today) {
                    return NextResponse.json(
                        { error: 'Registration for MPL 2026 has ended.' },
                        { status: 400 }
                    );
                }
            }
        }

        // 2. Fetch Existing Team
        const { data: teamData, error: fetchError } = await supabase
            .from('mpl_teams')
            .select('id, team_name')
            .eq('team_code', teamCode.trim())
            .single();

        if (fetchError || !teamData) {
            return NextResponse.json({ error: 'Invalid Team Code.' }, { status: 404 });
        }

        const teamId = teamData.id;

        // 3. Limit & Duplicate Check
        const { data: currentPlayers, error: playersError } = await supabase
            .from('mpl_players')
            .select('id, email, roll_number, name, is_leader, avatar_url')
            .eq('team_id', teamId);

        if (playersError) {
            return NextResponse.json({ error: 'Failed to fetch team members.' }, { status: 500 });
        }

        if (currentPlayers.length >= 10) {
            return NextResponse.json({ error: 'This team is already full (10 players max).' }, { status: 400 });
        }

        const isDuplicate = currentPlayers.some(p => p.email === email || p.roll_number === rollNo);
        if (isDuplicate) {
            return NextResponse.json({ error: 'You are already registered in this team.' }, { status: 400 });
        }

        // 4. Insert New Member
        const { error: insertError } = await supabase
            .from('mpl_players')
            .insert({
                team_id: teamId,
                is_leader: false,
                name,
                roll_number: rollNo,
                email,
                avatar_url: avatar_url || null,
                section: section || null,
                branch,
                year,
                phone_number: phone
            });

        if (insertError) {
            console.error('Supabase insert error:', insertError);
            return NextResponse.json({ error: 'Failed to join team.' }, { status: 500 });
        }

        // 5. Handle Email Consent
        if (consent) {
            const { data: existingSub } = await supabase.from('newsletter_subscribers').select('id').eq('email', email).single();
            if (!existingSub) {
                await supabase.from('newsletter_subscribers').insert({
                    email,
                    name,
                    is_active: true
                });
            }
        }

        revalidatePath('/admin');
        revalidatePath('/coordinator');
        revalidateTag('registrations');

        // Formulate complete team roster for the frontend success view
        const teamRoster = [
            ...currentPlayers.map(p => ({ name: p.name, rollNo: p.roll_number, isLeader: p.is_leader, avatar_url: p.avatar_url })),
            { name, rollNo, isLeader: false, avatar_url }
        ];

        return NextResponse.json({
            message: 'Successfully joined the team',
            team_members: teamRoster,
            teamName: teamData.team_name
        }, { status: 200 });

    } catch (error) {
        console.error('MPL Join Team Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
