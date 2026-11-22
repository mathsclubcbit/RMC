import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET — Leaderboard or individual result
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const sessionId = searchParams.get('sessionId');

    const supabase = createAdminClient();

    // Individual result
    if (sessionId) {
        const { data: session, error } = await supabase
            .from('quiz_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (error || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        if (!session.submitted_at) {
            return NextResponse.json({ error: 'Quiz not yet submitted' }, { status: 400 });
        }

        // Fetch event to check if answers should be shown
        const { data: event } = await supabase
            .from('events')
            .select('payload')
            .eq('id', session.event_id)
            .single();

        const quizConfig = event?.payload?.quizConfig || {};
        const showAnswers = quizConfig.showAnswersAfter !== false;

        // Fetch submissions for this session
        const { data: submissions } = await supabase
            .from('quiz_submissions')
            .select('*')
            .eq('session_id', sessionId)
            .order('answered_at', { ascending: true });

        // Build question review (with or without correct answers)
        const assignedQuestions = session.assigned_questions || [];
        const review = assignedQuestions.map(aq => {
            const sub = (submissions || []).find(s => s.question_id === aq.questionId);
            const base = {
                questionId: aq.questionId,
                questionText: aq.questionText,
                difficulty: aq.difficulty,
                points: aq.points,
                options: aq.shuffledOptions,
                selectedOption: sub?.selected_option ?? null,
                isCorrect: sub?.is_correct ?? null,
                answered: !!sub,
            };

            if (showAnswers) {
                base.correctOption = aq.correctShuffledIndex;
                base.explanation = null; // Would need to fetch from quiz_questions if needed
            }

            return base;
        });

        // Get rank
        const { data: allSessions } = await supabase
            .from('quiz_sessions')
            .select('id, score, time_taken_seconds')
            .eq('event_id', session.event_id)
            .not('submitted_at', 'is', null)
            .order('score', { ascending: false })
            .order('time_taken_seconds', { ascending: true });

        const rank = (allSessions || []).findIndex(s => s.id === sessionId) + 1;
        const totalParticipants = (allSessions || []).length;

        const totalQuestions = assignedQuestions.length;
        const answered = (submissions || []).length;
        const correct = (submissions || []).filter(s => s.is_correct).length;

        return NextResponse.json({
            session: {
                id: session.id,
                participantName: session.participant_name,
                score: session.score,
                totalPossible: session.total_possible,
                timeTakenSeconds: session.time_taken_seconds,
                submittedAt: session.submitted_at,
                tabSwitchCount: session.tab_switch_count,
            },
            summary: {
                totalQuestions,
                answered,
                correct,
                incorrect: answered - correct,
                unanswered: totalQuestions - answered,
                accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
            },
            rank,
            totalParticipants,
            review: showAnswers ? review : review.map(r => ({ ...r, correctOption: undefined })),
        });
    }

    // Leaderboard
    if (eventId) {
        const { data: sessions, error } = await supabase
            .from('quiz_sessions')
            .select('id, participant_name, participant_email, score, total_possible, time_taken_seconds, submitted_at, tab_switch_count, started_at')
            .eq('event_id', eventId)
            .not('submitted_at', 'is', null)
            .order('score', { ascending: false })
            .order('time_taken_seconds', { ascending: true });

        if (error) {
            console.error('Error fetching quiz results:', error);
            return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
        }

        const leaderboard = (sessions || []).map((s, idx) => ({
            rank: idx + 1,
            name: s.participant_name,
            email: s.participant_email,
            score: s.score,
            totalPossible: s.total_possible,
            timeTakenSeconds: s.time_taken_seconds,
            accuracy: s.total_possible > 0 ? Math.round((s.score / s.total_possible) * 100) : 0,
            tabSwitches: s.tab_switch_count,
            submittedAt: s.submitted_at,
        }));

        return NextResponse.json({ leaderboard, totalParticipants: leaderboard.length });
    }

    return NextResponse.json({ error: 'eventId or sessionId required' }, { status: 400 });
}
