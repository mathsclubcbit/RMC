import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// POST — Submit quiz answers
export async function POST(request) {
    try {
        const body = await request.json();
        const { sessionId, answers, tabSwitchCount } = body;

        if (!sessionId || !answers || typeof answers !== 'object') {
            return NextResponse.json({ error: 'sessionId and answers are required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Fetch session
        const { data: session, error: sessErr } = await supabase
            .from('quiz_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessErr || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // 2. Check if already submitted
        if (session.submitted_at) {
            return NextResponse.json({
                error: 'Quiz already submitted',
                score: session.score,
                totalPossible: session.total_possible,
            }, { status: 409 });
        }

        // 3. Fetch event for quiz config (negative marking)
        const { data: event } = await supabase
            .from('events')
            .select('payload')
            .eq('id', session.event_id)
            .single();

        const quizConfig = event?.payload?.quizConfig || {};
        const negativeMarking = quizConfig.negativeMarking || false;
        const negativeMarkValue = parseFloat(quizConfig.negativeMarkValue) || 0;
        const durationMinutes = quizConfig.durationMinutes || 20;

        // 4. Check timer — allow 60-second grace period for network latency
        const startedAt = new Date(session.started_at);
        const now = new Date();
        const elapsedSeconds = Math.floor((now - startedAt) / 1000);
        const maxSeconds = durationMinutes * 60 + 60; // 60s grace

        if (elapsedSeconds > maxSeconds) {
            console.error(`Quiz session ${sessionId} submitted ${elapsedSeconds - durationMinutes * 60}s late. Rejecting due to time limit.`);
            // Update session as submitted with 0 score to prevent retries
            await supabase
                .from('quiz_sessions')
                .update({
                    submitted_at: now.toISOString(),
                    score: 0,
                    time_taken_seconds: elapsedSeconds
                })
                .eq('id', sessionId);
                
            return NextResponse.json({ error: 'Time limit exceeded. Submission rejected.' }, { status: 403 });
        }

        // 5. Process each answer using the option mapping
        const assignedQuestions = session.assigned_questions || [];
        const submissions = [];
        let totalScore = 0;

        for (const aq of assignedQuestions) {
            const selectedOption = answers[aq.questionId];
            
            if (selectedOption === undefined || selectedOption === null || selectedOption === -1) {
                // Unanswered — no penalty, no points
                continue;
            }

            const displayIndex = parseInt(selectedOption);
            if (isNaN(displayIndex) || displayIndex < 0 || displayIndex >= aq.optionMap.length) {
                // Invalid answer index — treat as unanswered
                continue; 
            }

            // Map display index back to original index using optionMap
            const actualOption = aq.optionMap[displayIndex];
            
            // Check correctness: Does the index they clicked match the shuffled index of the correct answer?
            const correct = displayIndex === aq.correctShuffledIndex;

            if (correct) {
                totalScore += aq.points;
            } else if (negativeMarking && negativeMarkValue > 0) {
                totalScore -= negativeMarkValue;
            }

            submissions.push({
                session_id: sessionId,
                question_id: aq.questionId,
                selected_option: displayIndex,
                actual_option: actualOption,
                is_correct: correct,
                points_earned: correct ? aq.points : (negativeMarking ? -negativeMarkValue : 0),
                answered_at: now.toISOString(),
            });
        }

        // Ensure score doesn't go below 0
        totalScore = Math.max(0, Math.round(totalScore * 100) / 100);

        // 6. Insert submissions
        if (submissions.length > 0) {
            const { error: subErr } = await supabase
                .from('quiz_submissions')
                .insert(submissions);

            if (subErr) {
                console.error('Error inserting quiz submissions:', subErr);
                return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 });
            }
        }

        // 7. Update session
        const timeTaken = Math.floor((now - startedAt) / 1000);
        const { error: updateErr } = await supabase
            .from('quiz_sessions')
            .update({
                score: totalScore,
                submitted_at: now.toISOString(),
                time_taken_seconds: timeTaken,
                tab_switch_count: tabSwitchCount || 0,
            })
            .eq('id', sessionId);

        if (updateErr) {
            console.error('Error updating quiz session:', updateErr);
            return NextResponse.json({ error: 'Failed to finalize quiz' }, { status: 500 });
        }

        // 8. Build result summary
        const totalQuestions = assignedQuestions.length;
        const answered = submissions.length;
        const correct = submissions.filter(s => s.is_correct).length;
        const incorrect = answered - correct;
        const unanswered = totalQuestions - answered;

        return NextResponse.json({
            score: totalScore,
            totalPossible: session.total_possible,
            timeTakenSeconds: timeTaken,
            summary: {
                totalQuestions,
                answered,
                correct,
                incorrect,
                unanswered,
            },
        });

    } catch (err) {
        console.error('Error in quiz submit:', err);
        return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
    }
}
