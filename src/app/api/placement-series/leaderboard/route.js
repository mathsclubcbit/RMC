export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireParticipant, requireCoordinator } from '@/lib/ps-auth';

// BUG-8 FIX: Mask roll number for non-authenticated or non-coordinator viewers.
// Shows first 4 characters and replaces the rest with ****
function maskRollNo(rollNo) {
    if (!rollNo || rollNo.length <= 4) return '****';
    return rollNo.substring(0, 4) + '****';
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        // BUG-8 FIX: Require authentication. Check for coordinator first, then participant.
        // Unauthenticated callers are rejected — leaderboard exposes names + roll numbers.
        const coordinator = await requireCoordinator(request, eventId);
        const participant = coordinator ? null : await requireParticipant(request, false);

        if (!coordinator && participant?.error) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        // Coordinators see full roll numbers; participants see masked roll numbers
        const isCoordinator = Boolean(coordinator);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search');
        const tab = searchParams.get('tab') || 'overall'; // overall | contest | daily
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

        // Sort depends on tab
        if (tab === 'contest') {
            query = query.order('contest_score', { ascending: false })
                         .order('streak_longest', { ascending: false });
        } else if (tab === 'daily') {
            query = query.order('streak_current', { ascending: false })
                         .order('streak_longest', { ascending: false })
                         .order('daily_questions_answered', { ascending: false });
        } else {
            // Overall — sort by total_points (new unified column)
            query = query.order('total_points', { ascending: false })
                         .order('streak_longest', { ascending: false });
        }

        query = query.range(offset, offset + limit - 1);

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
                    badgesMap[b.participant_id].push({
                        ...b,
                        badgeType: b.badge_type,
                        badgeLabel: b.badge_label,
                        badgeIcon: b.badge_icon
                    });
                });
            }
        }

        // 3. Format response with computed ranks
        const formattedLeaderboard = (leaderboard || []).map((p, index) => {
            const contestScore = p.contest_score || 0;
            const totalPoints = p.total_points || 0;

            return {
                rank: offset + index + 1,
                participantId: p.participant_id,
                name: p.name,
                // BUG-8 FIX: Mask roll number for non-coordinator viewers to protect PII
                rollNo: isCoordinator ? p.roll_no : maskRollNo(p.roll_no),
                totalPoints,
                contestScore,
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
            limit,
            tab
        });

    } catch (error) {
        console.error('Leaderboard API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
