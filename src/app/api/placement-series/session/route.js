export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireParticipant } from '@/lib/ps-auth';

export async function GET(request) {
    try {
        const participant = await requireParticipant(request, false);
        if (participant.error) {
            return NextResponse.json({ error: participant.error }, { status: 401 });
        }

        const admin = createAdminClient();

        // Fetch participant details
        const { data: dbUser, error: fetchErr } = await admin
            .from('ps_participants')
            .select('id, name, email, roll_no, year, branch, college, is_verified, streak_current, streak_longest, last_daily_date, created_at')
            .eq('id', participant.participantId)
            .single();

        if (fetchErr || !dbUser) {
            return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
        }

        // Fetch badge count
        const { count: badgeCount } = await admin
            .from('ps_badges')
            .select('id', { count: 'exact', head: true })
            .eq('participant_id', participant.participantId);

        return NextResponse.json({
            participant: {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                rollNo: dbUser.roll_no,
                year: dbUser.year,
                branch: dbUser.branch,
                college: dbUser.college,
                isVerified: Boolean(dbUser.is_verified),
                streakCurrent: dbUser.streak_current,
                streakLongest: dbUser.streak_longest,
                lastDailyDate: dbUser.last_daily_date,
                createdAt: dbUser.created_at,
                badgeCount: badgeCount || 0
            }
        });

    } catch (error) {
        console.error('Session API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch session details' }, { status: 500 });
    }
}
