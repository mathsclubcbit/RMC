import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';

const generateTicketCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');
const EVENT_ID = 'mpl-2026';
const EVENT_NAME = 'Mathematics Premier League 2026';

export async function POST(req) {
    try {
        const body = await req.json();
        const { teamName, name, email, avatar_url, phone, rollNo, section, branch, year, preferredIplTeam, consent } = body;

        if (!teamName || !name || !email || !phone || !rollNo || !branch || !year || !preferredIplTeam) {
            return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Check if Event is Open
        const { data: eventData, error: eventError } = await supabase
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

        // 2. Check if user is already registered in MPL
        const { data: existingPlayer } = await supabase
            .from('mpl_players')
            .select('id')
            .eq('email', email)
            .single();

        if (existingPlayer) {
            return NextResponse.json({ error: 'You are already registered in a team for MPL 2026.' }, { status: 400 });
        }

        // 3. Generate unique 6-character alphanumeric registration ID for the team
        const registrationId = Math.random().toString(36).substring(2, 8).toUpperCase();

        // 2. Insert into mpl_teams
        const { data: teamData, error: teamError } = await supabase
            .from('mpl_teams')
            .insert({
                team_code: registrationId,
                team_name: teamName,
                status: 'APPROVED'
            })
            .select('id')
            .single();

        if (teamError || !teamData) {
            console.error('Supabase insert team error:', teamError);
            return NextResponse.json({ error: 'Failed to create team.' }, { status: 500 });
        }

        const teamId = teamData.id;

        // 3. Insert leader into mpl_players
        const { error: playerError } = await supabase
            .from('mpl_players')
            .insert({
                team_id: teamId,
                is_leader: true,
                name,
                roll_number: rollNo,
                email,
                avatar_url: avatar_url || null,
                section: section || null,
                branch,
                year,
                preferred_ipl_team: preferredIplTeam,
                phone_number: phone
            });

        if (playerError) {
            console.error('Supabase insert player error:', playerError);
            return NextResponse.json({ error: 'Failed to register team leader.' }, { status: 500 });
        }

        // 4. Handle Email Consent
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

        return NextResponse.json({
            message: 'Team created successfully',
            teamCode: registrationId,
            team_members: []
        }, { status: 201 });

    } catch (error) {
        console.error('MPL Create Team Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
