export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireCoordinator } from '@/lib/ps-auth';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        const date = searchParams.get('date'); // YYYY-MM-DD

        if (!eventId || !date) {
            return NextResponse.json({ error: 'eventId and date are required' }, { status: 400 });
        }

        const coordinator = await requireCoordinator(request, eventId);
        if (!coordinator) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const admin = createAdminClient();

        // 1. Fetch total enrolled participants count for this event
        const { count: totalEnrolledParticipants } = await admin
            .from('ps_participants')
            .select('id', { count: 'exact', head: true })
            .eq('event_id', eventId);

        // 2. Fetch the daily questions for this date
        const { data: questions, error: qError } = await admin
            .from('ps_daily_questions')
            .select(`
                id,
                question_number,
                question:ps_question_bank (
                    id,
                    question_text,
                    category,
                    difficulty
                )
            `)
            .eq('event_id', eventId)
            .eq('question_date', date)
            .order('question_number', { ascending: true });

        if (qError) throw qError;

        // 3. Fetch submissions for these questions
        const questionIds = (questions || []).map(q => q.id);
        let submissions = [];
        if (questionIds.length > 0) {
            const { data: subs, error: sError } = await admin
                .from('ps_daily_submissions')
                .select(`
                    id,
                    daily_question_id,
                    participant_id,
                    is_correct,
                    submitted_at,
                    participant:ps_participants (
                        id,
                        name,
                        email,
                        roll_no,
                        streak_current
                    )
                `)
                .in('daily_question_id', questionIds)
                .order('submitted_at', { ascending: false });

            if (sError) throw sError;
            submissions = subs || [];
        }

        // 4. Per-question stats
        const stats = (questions || []).map(q => {
            const qSubs = submissions.filter(s => s.daily_question_id === q.id);
            const totalSubmissions = qSubs.length;
            const correctSubmissions = qSubs.filter(s => s.is_correct).length;
            const incorrectSubmissions = totalSubmissions - correctSubmissions;
            const accuracy = totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0;

            return {
                questionId: q.id,
                questionNumber: q.question_number,
                questionText: q.question?.question_text || '',
                category: q.question?.category || 'General',
                difficulty: q.question?.difficulty || 'medium',
                totalSubmissions,
                correctSubmissions,
                incorrectSubmissions,
                accuracy
            };
        });

        // 5. Compute summary metrics for the selected date
        const totalSubmissions = submissions.length;
        const totalCorrect = submissions.filter(s => s.is_correct).length;
        const overallAccuracy = totalSubmissions > 0 ? Math.round((totalCorrect / totalSubmissions) * 100) : 0;

        const participantMap = new Map();
        submissions.forEach(s => {
            const pId = s.participant_id;
            if (!participantMap.has(pId)) {
                participantMap.set(pId, {
                    total: 0,
                    correct: 0,
                    participant: s.participant
                });
            }
            const p = participantMap.get(pId);
            p.total += 1;
            if (s.is_correct) p.correct += 1;
        });

        const uniqueParticipantsCount = participantMap.size;
        const assignedQuestionsCount = (questions || []).length;

        let perfectScorersCount = 0;
        if (assignedQuestionsCount > 0) {
            for (const [, pData] of participantMap.entries()) {
                if (pData.total === assignedQuestionsCount && pData.correct === assignedQuestionsCount) {
                    perfectScorersCount++;
                }
            }
        }

        const enrolledCount = totalEnrolledParticipants || 0;
        const participationRate = enrolledCount > 0
            ? Math.round((uniqueParticipantsCount / enrolledCount) * 100)
            : 0;

        // 6. Compute Streak Gain and Loss Metrics
        const dateObj = new Date(date + 'T00:00:00Z');
        const prevDateObj = new Date(dateObj);
        prevDateObj.setUTCDate(prevDateObj.getUTCDate() - 1);
        const yesterdayStr = prevDateObj.toISOString().split('T')[0];

        // Fetch yesterday's questions and submissions
        const { data: yesterdayQuestions } = await admin
            .from('ps_daily_questions')
            .select('id')
            .eq('event_id', eventId)
            .eq('question_date', yesterdayStr);

        const yQIds = (yesterdayQuestions || []).map(q => q.id);
        let yesterdaySubmissions = [];
        if (yQIds.length > 0) {
            const { data: ySubs } = await admin
                .from('ps_daily_submissions')
                .select(`
                    participant_id,
                    participant:ps_participants (
                        id,
                        name,
                        email,
                        roll_no,
                        streak_current,
                        streak_longest
                    )
                `)
                .in('daily_question_id', yQIds);
            yesterdaySubmissions = ySubs || [];
        }

        const yesterdayParticipantsMap = new Map();
        yesterdaySubmissions.forEach(s => {
            if (s.participant_id && !yesterdayParticipantsMap.has(s.participant_id)) {
                yesterdayParticipantsMap.set(s.participant_id, s.participant);
            }
        });
        const yesterdayParticipantIds = new Set(yesterdayParticipantsMap.keys());
        const todayParticipantIds = new Set(participantMap.keys());

        // Gained/Extended Streak: Submitted both yesterday and today
        const gainedStreakIds = [...todayParticipantIds].filter(id => yesterdayParticipantIds.has(id));
        // Started/Restarted Streak: Submitted today but NOT yesterday
        const startedStreakIds = [...todayParticipantIds].filter(id => !yesterdayParticipantIds.has(id));
        // Lost Streak: Submitted yesterday but NOT today
        const lostStreakIds = [...yesterdayParticipantIds].filter(id => !todayParticipantIds.has(id));

        const lostStreakUsers = lostStreakIds.map(id => {
            const p = yesterdayParticipantsMap.get(id);
            return {
                id,
                name: p?.name || 'Unknown Student',
                email: p?.email || '',
                rollNo: p?.roll_no || 'N/A',
                previousStreak: p?.streak_longest || p?.streak_current || 1
            };
        });

        const streakStats = {
            gainedStreakCount: gainedStreakIds.length,
            startedStreakCount: startedStreakIds.length,
            lostStreakCount: lostStreakIds.length,
            yesterdayActiveCount: yesterdayParticipantIds.size,
            retentionRate: yesterdayParticipantIds.size > 0
                ? Math.round((gainedStreakIds.length / yesterdayParticipantIds.size) * 100)
                : 0
        };

        const summary = {
            date,
            assignedQuestionsCount,
            totalSubmissions,
            uniqueParticipants: uniqueParticipantsCount,
            totalCorrect,
            overallAccuracy,
            perfectScorersCount,
            totalEnrolled: enrolledCount,
            participationRate,
            streakStats
        };

        // 7. Recent submissions list (up to 100)
        const questionMap = new Map((questions || []).map(q => [q.id, q.question_number]));
        const recentSubmissions = submissions.slice(0, 100).map(s => ({
            id: s.id,
            participantId: s.participant_id,
            name: s.participant?.name || 'Unknown Student',
            email: s.participant?.email || '',
            rollNo: s.participant?.roll_no || 'N/A',
            streak: s.participant?.streak_current || 0,
            streakType: yesterdayParticipantIds.has(s.participant_id) ? 'gained' : 'started',
            questionNumber: questionMap.get(s.daily_question_id) || 1,
            isCorrect: s.is_correct,
            submittedAt: s.submitted_at
        }));

        // 8. Calculate 7-day trend with day-over-day streak transitions
        const trendDays = [];
        const baseDate = new Date(date + 'T00:00:00Z');
        // Fetch 8 days back to compute streak continuity for day 0 of the 7-day window
        for (let i = 7; i >= 0; i--) {
            const d = new Date(baseDate);
            d.setUTCDate(d.getUTCDate() - i);
            trendDays.push(d.toISOString().split('T')[0]);
        }

        const startDate = trendDays[0];
        const endDate = trendDays[trendDays.length - 1];

        const { data: pastQuestions } = await admin
            .from('ps_daily_questions')
            .select('id, question_date, question_number')
            .eq('event_id', eventId)
            .gte('question_date', startDate)
            .lte('question_date', endDate);

        const pastQIds = (pastQuestions || []).map(q => q.id);
        let pastSubs = [];
        if (pastQIds.length > 0) {
            const { data: pSubs } = await admin
                .from('ps_daily_submissions')
                .select('daily_question_id, participant_id, is_correct')
                .in('daily_question_id', pastQIds);
            pastSubs = pSubs || [];
        }

        const qIdToDate = new Map((pastQuestions || []).map(q => [q.id, q.question_date]));

        // Group participants by date for the 8 days
        const dayParticipantsMap = new Map();
        trendDays.forEach(dStr => dayParticipantsMap.set(dStr, new Set()));

        pastSubs.forEach(s => {
            const d = qIdToDate.get(s.daily_question_id);
            if (d && dayParticipantsMap.has(d)) {
                dayParticipantsMap.get(d).add(s.participant_id);
            }
        });

        // Compute the 7-day trend (skipping the buffer day 0)
        const trend = trendDays.slice(1).map((dStr, idx) => {
            const prevDStr = trendDays[idx]; // The preceding day
            const dayQs = (pastQuestions || []).filter(q => q.question_date === dStr);
            const dayQIds = new Set(dayQs.map(q => q.id));
            const daySubs = pastSubs.filter(s => dayQIds.has(s.daily_question_id));
            const totalDaySubs = daySubs.length;
            const correctDaySubs = daySubs.filter(s => s.is_correct).length;
            const currentDayParticipants = dayParticipantsMap.get(dStr) || new Set();
            const prevDayParticipants = dayParticipantsMap.get(prevDStr) || new Set();

            const gainedStreak = [...currentDayParticipants].filter(id => prevDayParticipants.has(id)).length;
            const lostStreak = [...prevDayParticipants].filter(id => !currentDayParticipants.has(id)).length;
            const accuracy = totalDaySubs > 0 ? Math.round((correctDaySubs / totalDaySubs) * 100) : 0;

            return {
                date: dStr,
                assignedQuestionsCount: dayQs.length,
                totalSubmissions: totalDaySubs,
                uniqueParticipants: currentDayParticipants.size,
                gainedStreak,
                lostStreak,
                accuracy
            };
        });

        return NextResponse.json({
            stats,
            summary,
            lostStreakUsers,
            recentSubmissions,
            trend
        });
    } catch (error) {
        console.error('Daily Stats API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
