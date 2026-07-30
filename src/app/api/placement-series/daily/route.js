export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireCoordinator, requireParticipant, deterministicShuffle } from '@/lib/ps-auth';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        
        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        const dateParam = searchParams.get('date');
        const queryDate = dateParam || new Date().toISOString().split('T')[0];

        // Auth is optional for GET. If token exists, we personalize options and check submissions.
        const participant = await requireParticipant(request, false);
        const admin = createAdminClient();

        // 1. Fetch daily questions joined with question bank
        const { data: dailyQuestions, error: dailyErr } = await admin
            .from('ps_daily_questions')
            .select(`
                id, 
                question_number,
                question:ps_question_bank (
                    id, question_text, options, category, difficulty, explanation, correct_option
                )
            `)
            .eq('event_id', eventId)
            .eq('question_date', queryDate)
            .order('question_number', { ascending: true });

        if (dailyErr) throw dailyErr;

        let formattedQuestions = [];

        if (dailyQuestions && dailyQuestions.length > 0) {
            // 2. If participant exists, fetch their submissions for today
            let submissionsMap = {};
            if (!participant.error) {
                const dailyQuestionIds = dailyQuestions.map(q => q.id);
                const { data: submissions } = await admin
                    .from('ps_daily_submissions')
                    .select('*')
                    .eq('participant_id', participant.participantId)
                    .in('daily_question_id', dailyQuestionIds);

                if (submissions) {
                    submissions.forEach(sub => {
                        submissionsMap[sub.daily_question_id] = sub;
                    });
                }
            }

            // 3. Format questions for the client
            formattedQuestions = dailyQuestions.map(dq => {
                const q = dq.question;
                const submission = submissionsMap[dq.id];
                
                // Shuffle options if we have a participant context
                let finalOptions = q.options;
                if (!participant.error) {
                    const shuffleResult = deterministicShuffle(q.options, participant.participantId + q.id);
                    finalOptions = shuffleResult.shuffled;
                }

                return {
                    id: dq.id,
                    questionNumber: dq.question_number,
                    questionText: q.question_text,
                    options: finalOptions,
                    category: q.category,
                    difficulty: q.difficulty,
                    // Only send submission details (including explanation) if they already answered
                    submission: submission ? {
                        selectedOption: submission.selected_option,
                        isCorrect: submission.is_correct,
                        explanation: q.explanation
                    } : null
                };
            });
        }

        return NextResponse.json({
            date: queryDate,
            questions: formattedQuestions
        });

    } catch (error) {
        console.error('Daily Questions GET API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch daily questions' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { eventId, date, assignments } = body;

        if (!eventId || !date || !Array.isArray(assignments)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const coordinator = await requireCoordinator(request, eventId);
        if (!coordinator) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const admin = createAdminClient();
        
        let assignedCount = 0;
        
        for (const assignment of assignments) {
            const { questionNumber, questionId } = assignment;
            
            if (![1, 2, 3].includes(questionNumber) || !questionId) continue;

            // Upsert assignment
            const { error } = await admin
                .from('ps_daily_questions')
                .upsert({
                    event_id: eventId,
                    question_date: date,
                    question_number: questionNumber,
                    question_id: questionId
                }, {
                    onConflict: 'event_id,question_date,question_number'
                });
                
            if (!error) assignedCount++;
        }

        return NextResponse.json({ success: true, assigned: assignedCount });

    } catch (error) {
        console.error('Daily Questions POST API Error:', error);
        return NextResponse.json({ error: 'Failed to assign daily questions' }, { status: 500 });
    }
}
