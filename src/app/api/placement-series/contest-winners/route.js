export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/placement-series/contest-winners?eventId=xxx
 * Returns all published contests with their top 3 finishers.
 * Powers the Hall of Fame / Winners page.
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        const admin = createAdminClient();

        // 1. Fetch winners from the view
        const { data: winners, error } = await admin
            .from('ps_contest_winners_view')
            .select('*')
            .eq('event_id', eventId)
            .order('ends_at', { ascending: false })
            .order('rank_position', { ascending: true });

        if (error) throw error;

        // 2. Fetch badges for all winning participants
        const participantIds = [...new Set((winners || []).map(w => w.participant_id))];
        let badgesMap = {};

        if (participantIds.length > 0) {
            const { data: badges } = await admin
                .from('ps_badges')
                .select('participant_id, badge_type, badge_label, badge_icon, linkedin_text, contest_id')
                .in('participant_id', participantIds)
                .in('badge_type', ['contest_gold', 'contest_silver', 'contest_bronze', 'perfect_contest']);

            if (badges) {
                badges.forEach(b => {
                    const key = `${b.participant_id}-${b.contest_id}`;
                    if (!badgesMap[key]) badgesMap[key] = [];
                    badgesMap[key].push(b);
                });
            }
        }

        // 3. Group by contest
        const contestMap = {};
        for (const w of (winners || [])) {
            if (!contestMap[w.contest_id]) {
                contestMap[w.contest_id] = {
                    contestId: w.contest_id,
                    contestTitle: w.contest_title,
                    weekNumber: w.week_number,
                    endsAt: w.ends_at,
                    podium: []
                };
            }
            const key = `${w.participant_id}-${w.contest_id}`;
            contestMap[w.contest_id].podium.push({
                rank: w.rank_position,
                participantId: w.participant_id,
                name: w.participant_name,
                rollNo: w.participant_roll,
                score: w.score,
                maxPoints: w.max_points,
                timeTakenSeconds: w.time_taken_seconds,
                badges: badgesMap[key] || []
            });
        }

        const contests = Object.values(contestMap).sort(
            (a, b) => new Date(b.endsAt) - new Date(a.endsAt)
        );

        return NextResponse.json({ contests });

    } catch (error) {
        console.error('Contest Winners API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch winners' }, { status: 500 });
    }
}
