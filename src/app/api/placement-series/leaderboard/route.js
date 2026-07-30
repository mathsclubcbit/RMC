export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        
        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search');
        const offset = (page - 1) * limit;

        const admin = createAdminClient();

        // 1. Fetch leaderboard data from view
        let query = admin
            .from('ps_leaderboard_view')
            .select('*', { count: 'exact' })
            .eq('event_id', eventId);

        if (search) {
            query = query.or(`name.ilike.%${search}%,roll_no.ilike.%${search}%`);
        }

        // Primary sort: contest score, Secondary sort: highest streak
        query = query.order('total_score', { ascending: false })
                     .order('streak_longest', { ascending: false })
                     .range(offset, offset + limit - 1);

        const { data: leaderboard, count, error } = await query;
        if (error) throw error;

        // 2. Fetch badges for the returned participants
        let badgesMap = {};
        if (leaderboard && leaderboard.length > 0) {
            const participantIds = leaderboard.map(p => p.participant_id);
            const { data: badges } = await admin
                .from('ps_badges')
                .select('participant_id, badge_type, badge_label, badge_icon, earned_at, contest_id')
                .in('participant_id', participantIds)
                .order('earned_at', { ascending: false });

            if (badges) {
                badges.forEach(b => {
                    if (!badgesMap[b.participant_id]) badgesMap[b.participant_id] = [];
                    badgesMap[b.participant_id].push(b);
                });
            }
        }

        // 3. Format response with computed ranks
        const formattedLeaderboard = (leaderboard || []).map((p, index) => {
            return {
                rank: offset + index + 1,
                participantId: p.participant_id,
                name: p.name,
                rollNo: p.roll_no,
                totalScore: p.total_score,
                contestsParticipated: p.contests_participated,
                dailyQuestionsAnswered: p.daily_questions_answered,
                streakCurrent: p.streak_current,
                streakLongest: p.streak_longest,
                badges: badgesMap[p.participant_id] || []
            };
        });

        return NextResponse.json({
            leaderboard: formattedLeaderboard,
            total: count || 0,
            page,
            limit
        });

    } catch (error) {
        console.error('Leaderboard API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
