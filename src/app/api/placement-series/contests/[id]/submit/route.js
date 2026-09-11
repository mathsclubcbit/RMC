export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireParticipant, deterministicShuffle } from '@/lib/ps-auth';
import { checkPerfectScore, awardPoints } from '@/lib/ps-badges';

export async function POST(request, { params }) {
    try {
        const id = (await params).id;
        const participant = await requireParticipant(request, true);
        if (participant.error) {
            return NextResponse.json({ error: participant.error }, { status: 401 });
        }

        const body = await request.json();
        const { answers = {} } = body;
        // GAP-3 FIX: Sanitize tabSwitchCount — must be a non-negative integer
        const tabSwitchCount = Math.max(0, parseInt(body.tabSwitchCount, 10) || 0);

        const admin = createAdminClient();

        // 1. Fetch contest and existing submission
        const [contestRes, subRes] = await Promise.all([
            admin.from('ps_contests').select('duration_minutes, ends_at').eq('id', id).single(),
            admin.from('ps_contest_submissions').select('*').eq('contest_id', id).eq('participant_id', participant.participantId).single()
        ]);

        if (contestRes.error || !contestRes.data) return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
        if (subRes.error || !subRes.data) return NextResponse.json({ error: 'Contest not started' }, { status: 400 });

        const submission = subRes.data;
        if (submission.submitted_at) {
            return NextResponse.json({ error: 'Already submitted' }, { status: 409 });
        }

        // 2. Timing validation — BUG-1 FIX: actually enforce the deadline
        const now = Date.now();
        const startedAtMs = new Date(submission.started_at).getTime();
        const durationMs = contestRes.data.duration_minutes * 60 * 1000;
        const contestEndsAtMs = new Date(contestRes.data.ends_at).getTime();

        // 15 seconds grace period for network latency
        const maxAllowedTime = Math.min(startedAtMs + durationMs, contestEndsAtMs) + 15000;

        if (now > maxAllowedTime) {
            // BUG-1 FIX: Reject late submissions. Mark as submitted with 0 score to prevent retries.
            console.warn(`[Contest Submit] Late submission rejected for participant ${participant.participantId}, contest ${id}. Overdue by ${Math.round((now - maxAllowedTime) / 1000)}s`);
            await admin
                .from('ps_contest_submissions')
                .update({
                    submitted_at: new Date().toISOString(),
                    score: 0,
                    total_points: 0,
                    time_taken_seconds: Math.floor((now - startedAtMs) / 1000),
                    tab_switch_count: tabSwitchCount
                })
                .eq('id', submission.id)
                .is('submitted_at', null); // atomic guard

            return NextResponse.json({ error: 'Time limit exceeded. Submission rejected.' }, { status: 403 });
        }

        const timeTakenSeconds = Math.floor((now - startedAtMs) / 1000);

        // 3. Fetch questions (with correct_option)
        const { data: questions } = await admin
            .from('ps_contest_questions')
            .select('id, options, correct_option, points')
            .eq('contest_id', id);

        // 4. Grade answers and detailed tracking
        let score = 0;
        let totalPoints = 0;
        let answeredCount = 0;
        let unansweredCount = 0;
        const detailedResults = {};

        for (const q of (questions || [])) {
            totalPoints += q.points || 10;

            const selectedShuffledIndex = answers[q.id];
            if (selectedShuffledIndex !== undefined && selectedShuffledIndex !== null) {
                answeredCount++;
                const { mapping } = deterministicShuffle(q.options, participant.participantId + q.id);
                const actualIndex = mapping[selectedShuffledIndex];
                const isCorrect = actualIndex === q.correct_option;

                if (isCorrect) {
                    score += q.points || 10;
                }

                detailedResults[q.id] = {
                    status: 'answered',
                    selected_actual_index: actualIndex,
                    is_correct: isCorrect,
                    points_awarded: isCorrect ? (q.points || 10) : 0
                };
            } else {
                unansweredCount++;
                detailedResults[q.id] = {
                    status: 'not_answered',
                    selected_actual_index: null,
                    is_correct: false,
                    points_awarded: 0
                };
            }
        }

        // 5. Update submission — BUG-4 FIX: .is('submitted_at', null) makes this atomic.
        // If two concurrent requests race here, only one will match rows (the other gets count=0).
        const { data: updateData, error: updateErr } = await admin
            .from('ps_contest_submissions')
            .update({
                answers,
                score,
                total_points: totalPoints,
                answered_count: answeredCount,
                unanswered_count: unansweredCount,
                detailed_results: detailedResults,
                submitted_at: new Date().toISOString(),
                time_taken_seconds: timeTakenSeconds,
                tab_switch_count: tabSwitchCount
            })
            .eq('id', submission.id)
            .is('submitted_at', null) // BUG-4: atomic guard — only one concurrent request wins
            .select('id');

        if (updateErr) throw updateErr;

        // If no rows were updated, another concurrent request already submitted
        if (!updateData || updateData.length === 0) {
            return NextResponse.json({ error: 'Already submitted' }, { status: 409 });
        }

        // 6. Award points: +20 participation flat + raw score
        const participationBonus = 20;
        const totalPointsToAward = participationBonus + score;
        await awardPoints(participant.participantId, totalPointsToAward);

        // 7. Check for perfect score badge
        if (score === totalPoints && totalPoints > 0) {
            await checkPerfectScore({
                participantId: participant.participantId,
                eventId: participant.eventId,
                contestId: id,
                score,
                totalPoints
            });
        }

        return NextResponse.json({
            success: true,
            score,
            totalPoints,
            totalQuestions: questions?.length || 0,
            answeredCount,
            unansweredCount,
            percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0,
            timeTakenSeconds,
            pointsAwarded: totalPointsToAward
        });

    } catch (error) {
        console.error('Contest Submit API Error:', error);
        return NextResponse.json({ error: 'Failed to submit contest' }, { status: 500 });
    }
}
