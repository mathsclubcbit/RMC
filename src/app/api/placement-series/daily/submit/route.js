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

        // BUG-6 FIX: Validate selectedOption is a valid non-negative integer before use as array index
        const parsedOption = parseInt(selectedOption, 10);
        if (isNaN(parsedOption) || parsedOption < 0 || parsedOption > 3) {
            return NextResponse.json({ error: 'Invalid selectedOption. Must be an integer between 0 and 3.' }, { status: 400 });
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

        // 2. BUG-15 FIX: Strict date check — only accept submissions for today's question.
        // Removed the ±24h tolerance which allowed submitting after seeing the solution on explanation day.
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        if (dq.question_date !== todayStr) {
            return NextResponse.json({ error: 'Question is not active today' }, { status: 400 });
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

        // BUG-6 FIX: Also validate against actual options array length (could be != 4)
        if (parsedOption >= q.options.length) {
            return NextResponse.json({ error: 'Invalid selectedOption. Out of range for this question.' }, { status: 400 });
        }

        const { mapping } = deterministicShuffle(q.options, participant.participantId + q.id);
        const actualOption = mapping[parsedOption];

        // 5. Determine correctness
        const isCorrect = actualOption === q.correct_option;

        // 6. Insert submission
        const { error: insertErr } = await admin
            .from('ps_daily_submissions')
            .insert({
                daily_question_id: dailyQuestionId,
                participant_id: participant.participantId,
                selected_option: parsedOption,
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

        // 7. BUG-12 FIX: Proper streak logic — streak resets to 1 if last activity wasn't yesterday.
        // Previously streak_current was a lifetime cumulative counter (never reset).
        const { data: dbUser } = await admin
            .from('ps_participants')
            .select('streak_current, streak_longest, last_daily_date')
            .eq('id', participant.participantId)
            .single();

        let newStreak = dbUser?.streak_current || 0;
        let newLongest = dbUser?.streak_longest || 0;

        if (dbUser?.last_daily_date !== todayStr) {
            // BUG-12 FIX: Check if they answered yesterday (consecutive) — if not, reset streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

            if (dbUser?.last_daily_date === yesterdayStr) {
                // Consecutive day — extend the streak
                newStreak = (dbUser.streak_current || 0) + 1;
            } else {
                // Gap in activity — reset streak to 1
                newStreak = 1;
            }

            newLongest = Math.max(dbUser?.streak_longest || 0, newStreak);

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
