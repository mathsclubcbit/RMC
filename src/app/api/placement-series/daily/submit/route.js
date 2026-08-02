export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireParticipant, deterministicShuffle } from '@/lib/ps-auth';
import { processDailyBadges, awardPoints } from '@/lib/ps-badges';

export async function POST(request) {
    try {
        // Daily submissions don't require OTP verification
        const participant = await requireParticipant(request, false);
        if (participant.error) {
            return NextResponse.json({ error: participant.error }, { status: 401 });
        }

        const body = await request.json();
        const { dailyQuestionId, selectedOption } = body;

        if (!dailyQuestionId || selectedOption === undefined) {
            return NextResponse.json({ error: 'Missing dailyQuestionId or selectedOption' }, { status: 400 });
        }

        const admin = createAdminClient();

        // 1. Fetch daily question + bank details
        const { data: dq, error: dqErr } = await admin
            .from('ps_daily_questions')
            .select(`
                id, 
                question_date, 
                event_id,
                question:ps_question_bank ( id, options, correct_option, explanation, difficulty )
            `)
            .eq('id', dailyQuestionId)
            .eq('event_id', participant.eventId)
            .single();

        if (dqErr || !dq) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        // 2. Validate timing (±12h tolerance for IST/UTC differences)
        const todayStr = new Date().toISOString().split('T')[0];
        if (dq.question_date !== todayStr) {
            // Basic date check. In a production app, strict timezone parsing is better.
            const qDate = new Date(dq.question_date).getTime();
            const now = Date.now();
            const diffHours = Math.abs(now - qDate) / (1000 * 60 * 60);
            if (diffHours > 24) {
                return NextResponse.json({ error: 'Question is not active today' }, { status: 400 });
            }
        }

        // 3. Check existing submission
        const { data: existingSub } = await admin
            .from('ps_daily_submissions')
            .select('is_correct')
            .eq('daily_question_id', dailyQuestionId)
            .eq('participant_id', participant.participantId)
            .single();

        if (existingSub) {
            return NextResponse.json(
                { error: 'already_submitted', isCorrect: existingSub.is_correct }, 
                { status: 409 }
            );
        }

        // 4. Unshuffle option
        const q = dq.question;
        const { mapping } = deterministicShuffle(q.options, participant.participantId + q.id);
        const actualOption = mapping[selectedOption];

        // 5. Determine correctness
        const isCorrect = actualOption === q.correct_option;

        // 6. Insert submission
        const { error: insertErr } = await admin
            .from('ps_daily_submissions')
            .insert({
                daily_question_id: dailyQuestionId,
                participant_id: participant.participantId,
                selected_option: selectedOption,
                actual_option: actualOption,
                is_correct: isCorrect
            });

        if (insertErr) {
            // Handle race condition double-submit gracefully
            if (insertErr.code === '23505') {
                 return NextResponse.json({ error: 'already_submitted' }, { status: 409 });
            }
            throw insertErr;
        }

        // 7. Update Streak Logic
        const { data: dbUser } = await admin
            .from('ps_participants')
            .select('streak_current, streak_longest, last_daily_date')
            .eq('id', participant.participantId)
            .single();

        let newStreak = dbUser.streak_current;
        let newLongest = dbUser.streak_longest;
        
        if (dbUser.last_daily_date !== todayStr) {
            const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            
            if (dbUser.last_daily_date === yesterdayStr) {
                newStreak += 1; // Continued streak
            } else {
                newStreak = 1; // Broken streak
            }
            
            newLongest = Math.max(newLongest, newStreak);

            // Update participant table
            await admin
                .from('ps_participants')
                .update({
                    streak_current: newStreak,
                    streak_longest: newLongest,
                    last_daily_date: todayStr
                })
                .eq('id', participant.participantId);
        }

        // 8. Award Points
        // +5 for attempting, +10 for correct (easy/medium), +15 for correct (hard)
        let pointsToAward = 5; // base attempt points
        if (isCorrect) {
            pointsToAward += q.difficulty === 'hard' ? 15 : 10;
        }
        await awardPoints(participant.participantId, pointsToAward);

        // 9. Process Badges
        const { newBadges } = await processDailyBadges({ 
            participantId: participant.participantId, 
            eventId: participant.eventId 
        });

        return NextResponse.json({
            isCorrect,
            explanation: q.explanation || null,
            streakCurrent: newStreak,
            pointsAwarded: pointsToAward,
            newBadges
        });

    } catch (error) {
        console.error('Daily Submit API Error:', error);
        return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
    }
}
