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

        const { data: badges, error } = await admin
            .from('ps_badges')
            .select('id, badge_type, badge_label, badge_icon, linkedin_text, earned_at, contest_id')
            .eq('participant_id', participant.participantId)
            .order('earned_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            badges: (badges || []).map(b => ({
                id: b.id,
                badgeType: b.badge_type,
                badgeLabel: b.badge_label,
                badgeIcon: b.badge_icon,
                linkedinText: b.linkedin_text,
                earnedAt: b.earned_at,
                contestId: b.contest_id
            }))
        });

    } catch (error) {
        console.error('Badges GET API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
    }
}
