export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireCoordinator, requireParticipant, deterministicShuffle } from '@/lib/ps-auth';
import { publishContestBadges } from '@/lib/ps-badges';

export async function GET(request, { params }) {
    try {
        const id = (await params).id;
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        const coordinator = await requireCoordinator(request, eventId);
        const participant = coordinator ? null : await requireParticipant(request, false);

        if (!coordinator && participant?.error) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const admin = createAdminClient();

        // 1. Fetch contest
        const { data: contest, error: contestErr } = await admin
            .from('ps_contests')
            .select('*')
            .eq('id', id)
            .eq('event_id', eventId)
            .single();

        if (contestErr || !contest) {
            return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
        }

        if (!coordinator && !contest.is_published) {
            return NextResponse.json({ error: 'Contest not published' }, { status: 403 });
        }

        // 2. Fetch questions
        let query = admin
            .from('ps_contest_questions')
            .select('id, question_number, question_text, options, correct_option, points, question_bank_id')
            .eq('contest_id', id)
            .order('question_number', { ascending: true });
        
        const { data: questions } = await query;
        let formattedQuestions = questions || [];
        let submission = null;

        // 3. Handle participant view formatting
        if (!coordinator) {
            const now = Date.now();
            const startsAt = new Date(contest.starts_at).getTime();
            const endsAt = new Date(contest.ends_at).getTime();
            const isEnded = now > endsAt;
            const isActive = now >= startsAt && now <= endsAt;

            // Get participant submission
            const { data: sub } = await admin
                .from('ps_contest_submissions')
                .select('*')
                .eq('contest_id', id)
                .eq('participant_id', participant.participantId)
                .single();
            
            if (sub) submission = sub;

            if (!isActive && !isEnded) {
                // Upcoming contest — hide questions
                formattedQuestions = [];
            } else {
                formattedQuestions = formattedQuestions.map(q => {
                    const shuffleResult = deterministicShuffle(q.options, participant.participantId + q.id);
                    
                    let returnQ = {
                        id: q.id,
                        question_number: q.question_number,
                        question_text: q.question_text,
                        options: shuffleResult.shuffled,
                        points: q.points,
                    };

                    // Include correct_option and user's answer only if results are published
                    if (isEnded && contest.results_published) {
                        returnQ.correct_option = shuffleResult.mapping.indexOf(q.correct_option); // Shuffled index
                        if (submission?.answers?.[q.id] !== undefined) {
                            returnQ.user_answer = submission.answers[q.id]; // Shuffled index from client
                        }
                    }

                    return returnQ;
                });
            }
        }

        return NextResponse.json({ contest, questions: formattedQuestions, submission });

    } catch (error) {
        console.error('Contest Detail GET API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch contest' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const id = (await params).id;
        const body = await request.json();
        let { eventId, questions, ...updateFields } = body;
        
        // Map camelCase to snake_case for DB
        if ('isPublished' in updateFields) {
            updateFields.is_published = updateFields.isPublished;
            delete updateFields.isPublished;
        }
        if ('resultsPublished' in updateFields) {
            updateFields.results_published = updateFields.resultsPublished;
            delete updateFields.resultsPublished;
        }

        if (!eventId) return NextResponse.json({ error: 'eventId is required' }, { status: 400 });

        const coordinator = await requireCoordinator(request, eventId);
        if (!coordinator) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

        const admin = createAdminClient();

        // 1. Update contest details
        if (Object.keys(updateFields).length > 0) {
            updateFields.updated_at = new Date().toISOString();
            
            // Check if results_published is flipping to true to trigger badges
            if (updateFields.results_published === true) {
                const { data: currentContest } = await admin.from('ps_contests').select('title, results_published').eq('id', id).single();
                if (currentContest && !currentContest.results_published) {
                    // Fire-and-forget badge processing
                    publishContestBadges({ 
                        contestId: id, 
                        eventId, 
                        contestTitle: updateFields.title || currentContest.title 
                    }).catch(err => console.error("Badge processing error:", err));
                }
            }

            await admin.from('ps_contests').update(updateFields).eq('id', id);
        }

        // 2. Upsert questions if provided
        if (questions && Array.isArray(questions)) {
            let totalQuestions = 0;
            // First, delete existing questions that aren't in the new list to allow clean replacement
            // (A more robust sync would check IDs, but for simplicity we assume the coordinator sends full lists)
            const questionNumbersToKeep = questions.map(q => q.questionNumber).filter(Boolean);
            if (questionNumbersToKeep.length > 0) {
                await admin.from('ps_contest_questions').delete().eq('contest_id', id).not('question_number', 'in', `(${questionNumbersToKeep.join(',')})`);
            } else {
                await admin.from('ps_contest_questions').delete().eq('contest_id', id);
            }

            for (const q of questions) {
                const { questionNumber, questionText, options, correctOption, points, questionBankId } = q;
                if (!questionNumber || !questionText || !options || correctOption === undefined) continue;

                await admin.from('ps_contest_questions').upsert({
                    contest_id: id,
                    question_number: questionNumber,
                    question_text: questionText,
                    options: options,
                    correct_option: correctOption,
                    points: points || 10,
                    question_bank_id: questionBankId || null
                }, {
                    onConflict: 'contest_id,question_number'
                });
                totalQuestions++;
            }
            
            // Update total questions count
            await admin.from('ps_contests').update({ total_questions: totalQuestions }).eq('id', id);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Contest Detail PUT API Error:', error);
        return NextResponse.json({ error: 'Failed to update contest' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const id = (await params).id;
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        
        if (!eventId) return NextResponse.json({ error: 'eventId is required' }, { status: 400 });

        const coordinator = await requireCoordinator(request, eventId);
        if (!coordinator) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

        const admin = createAdminClient();
        await admin.from('ps_contests').delete().eq('id', id).eq('event_id', eventId);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Contest Detail DELETE API Error:', error);
        return NextResponse.json({ error: 'Failed to delete contest' }, { status: 500 });
    }
}
