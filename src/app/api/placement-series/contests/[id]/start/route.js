export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireParticipant, deterministicShuffle } from '@/lib/ps-auth';

export async function POST(request, { params }) {
    try {
        const id = (await params).id;
        // Require VERIFIED participant for contests
        const participant = await requireParticipant(request, true);
        if (participant.error) {
            return NextResponse.json({ error: participant.error }, { status: 401 });
        }

        const admin = createAdminClient();

        // 1. Fetch contest and check if active
        const { data: contest, error: contestErr } = await admin
            .from('ps_contests')
            .select('*')
            .eq('id', id)
            .eq('is_published', true)
            .single();

        if (contestErr || !contest) {
            return NextResponse.json({ error: 'Contest not found or not published' }, { status: 404 });
        }

        const now = Date.now();
        const startsAt = new Date(contest.starts_at).getTime();
        const endsAt = new Date(contest.ends_at).getTime();

        if (now < startsAt || now > endsAt) {
            return NextResponse.json({ error: 'Contest is not active' }, { status: 400 });
        }

        // 2. Check existing submission
        let submission;
        const { data: existingSub } = await admin
            .from('ps_contest_submissions')
            .select('*')
            .eq('contest_id', id)
            .eq('participant_id', participant.participantId)
            .single();

        if (existingSub) {
            if (existingSub.submitted_at) {
                return NextResponse.json({ error: 'already_submitted' }, { status: 409 });
            }
            // Resume existing submission
            submission = existingSub;
        } else {
            // Start new submission
            const { data: newSub, error: insertErr } = await admin
                .from('ps_contest_submissions')
                .insert({
                    contest_id: id,
                    participant_id: participant.participantId,
                    answers: {},
                    score: 0,
                    total_points: 0,
                    started_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (insertErr) throw insertErr;
            submission = newSub;
        }

        // 3. Calculate remaining time
        const startedAtMs = new Date(submission.started_at).getTime();
        const maxDurationMs = contest.duration_minutes * 60 * 1000;
        let timeRemainingSeconds = Math.max(0, Math.floor((startedAtMs + maxDurationMs - now) / 1000));
        
        // Also cap time remaining by the absolute contest end time
        const contestRemainingSeconds = Math.max(0, Math.floor((endsAt - now) / 1000));
        timeRemainingSeconds = Math.min(timeRemainingSeconds, contestRemainingSeconds);

        if (timeRemainingSeconds <= 0) {
            return NextResponse.json({ error: 'Time has expired' }, { status: 400 });
        }

        // 4. Fetch questions and shuffle options
        const { data: questions } = await admin
            .from('ps_contest_questions')
            .select('id, question_number, question_text, options, points')
            .eq('contest_id', id)
            .order('question_number', { ascending: true });

        const formattedQuestions = (questions || []).map(q => {
            const { shuffled } = deterministicShuffle(q.options, participant.participantId + q.id);
            return {
                id: q.id,
                question_number: q.question_number,
                question_text: q.question_text,
                options: shuffled,
                points: q.points
            };
        });

        return NextResponse.json({
            submission: {
                id: submission.id,
                startedAt: submission.started_at,
                timeRemainingSeconds
            },
            questions: formattedQuestions
        });

    } catch (error) {
        console.error('Contest Start API Error:', error);
        return NextResponse.json({ error: 'Failed to start contest' }, { status: 500 });
    }
}
