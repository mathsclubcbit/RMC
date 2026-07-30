export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireParticipant, deterministicShuffle } from '@/lib/ps-auth';
import { checkPerfectScore } from '@/lib/ps-badges';

export async function POST(request, { params }) {
    try {
        const id = (await params).id;
        const participant = await requireParticipant(request, true);
        if (participant.error) {
            return NextResponse.json({ error: participant.error }, { status: 401 });
        }

        const body = await request.json();
        const { answers = {}, tabSwitchCount = 0 } = body;

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

        // 2. Timing validation
        const now = Date.now();
        const startedAtMs = new Date(submission.started_at).getTime();
        const durationMs = contestRes.data.duration_minutes * 60 * 1000;
        const contestEndsAtMs = new Date(contestRes.data.ends_at).getTime();
        
        // 15 seconds grace period for network latency
        const maxAllowedTime = Math.min(startedAtMs + durationMs, contestEndsAtMs) + 15000;
        
        // If they submit extremely late, we still accept it but they might get flagged.
        const timeTakenSeconds = Math.floor((now - startedAtMs) / 1000);

        // 3. Fetch questions (with correct_option)
        const { data: questions } = await admin
            .from('ps_contest_questions')
            .select('id, options, correct_option, points')
            .eq('contest_id', id);

        // 4. Grade answers
        let score = 0;
        let totalPoints = 0;
        
        for (const q of (questions || [])) {
            totalPoints += q.points || 10;
            
            const selectedShuffledIndex = answers[q.id];
            if (selectedShuffledIndex !== undefined && selectedShuffledIndex !== null) {
                const { mapping } = deterministicShuffle(q.options, participant.participantId + q.id);
                const actualIndex = mapping[selectedShuffledIndex];
                
                if (actualIndex === q.correct_option) {
                    score += q.points || 10;
                }
            }
        }

        // 5. Update submission
        const { error: updateErr } = await admin
            .from('ps_contest_submissions')
            .update({
                answers,
                score,
                total_points: totalPoints,
                submitted_at: new Date().toISOString(),
                time_taken_seconds: timeTakenSeconds,
                tab_switch_count: tabSwitchCount
            })
            .eq('id', submission.id);

        if (updateErr) throw updateErr;

        // 6. Check for perfect score badge
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
            percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0,
            timeTakenSeconds
        });

    } catch (error) {
        console.error('Contest Submit API Error:', error);
        return NextResponse.json({ error: 'Failed to submit contest' }, { status: 500 });
    }
}
