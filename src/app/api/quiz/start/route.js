import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Fisher-Yates (Knuth) shuffle — in-place, O(n)
 */
function fisherYatesShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Select questions from pool by difficulty counts, then randomize
 * question order and option order per question.
 */
function selectAndRandomize(allQuestions, config) {
    let { easyCount, mediumCount, hardCount } = config;

    // Partition by difficulty
    const pools = {
        easy: allQuestions.filter(q => q.difficulty === 'easy'),
        medium: allQuestions.filter(q => q.difficulty === 'medium'),
        hard: allQuestions.filter(q => q.difficulty === 'hard'),
    };

    // If no specific counts are configured, fallback to serving ALL available questions
    if (easyCount === undefined && mediumCount === undefined && hardCount === undefined) {
        easyCount = pools.easy.length;
        mediumCount = pools.medium.length;
        hardCount = pools.hard.length;
    }

    // Shuffle each pool
    fisherYatesShuffle(pools.easy);
    fisherYatesShuffle(pools.medium);
    fisherYatesShuffle(pools.hard);

    // Pick required count from each (cap at available)
    const selected = [
        ...pools.easy.slice(0, easyCount),
        ...pools.medium.slice(0, mediumCount),
        ...pools.hard.slice(0, hardCount),
    ];

    // Shuffle the combined selection (question order)
    fisherYatesShuffle(selected);

    // For each question, shuffle options and record the mapping
    const assigned = selected.map(q => {
        const optionCount = q.options.length;
        const indices = Array.from({ length: optionCount }, (_, i) => i);
        fisherYatesShuffle(indices);

        return {
            questionId: q.id,
            questionText: q.question_text,
            difficulty: q.difficulty,
            points: q.points,
            // Shuffled options (sent to client)
            shuffledOptions: indices.map(i => q.options[i]),
            // Mapping: optionMap[displayIndex] = originalIndex (server-side only, stored in DB)
            optionMap: indices,
            // The correct answer in the shuffled order (server-side only)
            correctShuffledIndex: indices.indexOf(q.correct_option),
        };
    });

    return assigned;
}

// POST — Start a quiz session
export async function POST(request) {
    try {
        const body = await request.json();
        const { eventId, participantName, participantEmail, phone, rollNo, department, registrationId, clientFingerprint, entryCode } = body;

        if (!eventId || !participantName || !participantEmail) {
            return NextResponse.json({ error: 'eventId, participantName, and participantEmail are required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Fetch event to get quiz config
        const { data: event, error: eventErr } = await supabase
            .from('events')
            .select('payload')
            .eq('id', eventId)
            .single();

        if (eventErr || !event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const payload = event.payload || {};
        if (payload.eventType !== 'Quiz') {
            return NextResponse.json({ error: 'This event is not a Quiz' }, { status: 400 });
        }

        if (payload.secureWalkInMode) {
            if (!entryCode) {
                return NextResponse.json({ error: 'This arena requires a live QR scan to enter.' }, { status: 401 });
            }
            
            const { data: isValid, error: rpcErr } = await supabase.rpc('increment_qr_scan', { qr_id: entryCode });
            
            if (rpcErr || !isValid) {
                return NextResponse.json({ error: 'QR Code Expired or Invalid. Please scan the current code on the screen.' }, { status: 401 });
            }
        }

        const quizConfig = payload.quizConfig || {};

        // 2. Check if quiz window is active
        const now = new Date();
        const eventDate = payload.startDate || payload.date;
        const eventStartTime = payload.startTime;
        const eventEndTime = payload.endTime;

        if (eventDate && eventStartTime) {
            const windowStart = new Date(`${eventDate}T${eventStartTime}`);
            if (now < windowStart) {
                return NextResponse.json({ error: 'Quiz has not started yet', startsAt: windowStart.toISOString() }, { status: 403 });
            }
        }
        if (eventDate && eventEndTime) {
            const windowEnd = new Date(`${eventDate}T${eventEndTime}`);
            if (now > windowEnd) {
                return NextResponse.json({ error: 'Quiz window has ended' }, { status: 403 });
            }
        }

        // 3. Check for existing session
        const { data: existing } = await supabase
            .from('quiz_sessions')
            .select('id, submitted_at, score, total_possible, started_at')
            .eq('event_id', eventId)
            .eq('participant_email', participantEmail.toLowerCase().trim())
            .single();

        if (existing) {
            if (existing.submitted_at) {
                return NextResponse.json({
                    error: 'You have already submitted this quiz',
                    session: { id: existing.id, submitted: true, score: existing.score, totalPossible: existing.total_possible }
                }, { status: 409 });
            }
            // Session exists but not submitted — return existing (resume)
            // Fetch assigned questions to return to client (without correct answers)
            const { data: sessionData } = await supabase
                .from('quiz_sessions')
                .select('id, assigned_questions, started_at, total_possible')
                .eq('id', existing.id)
                .single();

            const clientQuestions = (sessionData.assigned_questions || []).map(q => ({
                questionId: q.questionId,
                questionText: q.questionText,
                difficulty: q.difficulty,
                points: q.points,
                options: q.shuffledOptions,
            }));

            return NextResponse.json({
                sessionId: sessionData.id,
                questions: clientQuestions,
                startedAt: sessionData.started_at,
                totalPossible: sessionData.total_possible,
                durationMinutes: quizConfig.durationMinutes || 20,
                resumed: true,
            });
        }

        // 4. Fetch all questions for this event
        const { data: allQuestions, error: qErr } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('event_id', eventId);

        if (qErr) {
            console.error('Error fetching quiz questions:', qErr);
            return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
        }

        if (!allQuestions || allQuestions.length === 0) {
            return NextResponse.json({ error: 'No questions available for this quiz' }, { status: 400 });
        }

        // 5. Select and randomize questions
        const assigned = selectAndRandomize(allQuestions, quizConfig);

        if (assigned.length === 0) {
            return NextResponse.json({ error: 'No questions match the configured difficulty distribution' }, { status: 400 });
        }

        const totalPossible = assigned.reduce((sum, q) => sum + q.points, 0);

        // 6. Create quiz session
        const { data: session, error: sessErr } = await supabase
            .from('quiz_sessions')
            .insert({
                event_id: eventId,
                registration_id: registrationId || null,
                participant_name: participantName.trim(),
                participant_email: participantEmail.toLowerCase().trim(),
                assigned_questions: assigned,
                total_possible: totalPossible,
                started_at: now.toISOString(),
                client_fingerprint: clientFingerprint || null,
            })
            .select('id, started_at')
            .single();

        if (sessErr) {
            if (String(sessErr.message || '').includes('unique') || String(sessErr.message || '').includes('duplicate')) {
                return NextResponse.json({ error: 'You have already started this quiz' }, { status: 409 });
            }
            console.error('Error creating quiz session:', sessErr);
            return NextResponse.json({ error: 'Failed to start quiz' }, { status: 500 });
        }

        // 6.5 Auto-register Walk-In if needed
        if (entryCode) {
            const { data: existingReg } = await supabase
                .from('registrations')
                .select('id')
                .eq('event_id', eventId)
                .eq('email', participantEmail.toLowerCase().trim())
                .maybeSingle();
            
            if (!existingReg) {
                const ticketCode = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
                await supabase.from('registrations').insert({
                    event_id: eventId,
                    name: participantName.trim(),
                    email: participantEmail.toLowerCase().trim(),
                    phone: phone?.trim() || null,
                    roll_no: rollNo?.trim() || null,
                    department: department?.trim() || null,
                    ticket_code: ticketCode,
                    amount: 0,
                    status: 'completed',
                    payment_status: 'completed',
                    utr_id: 'WALKIN_QUIZ'
                });
            }
        }

        // 7. Return questions to client (WITHOUT correct answers or option mapping)
        const clientQuestions = assigned.map(q => ({
            questionId: q.questionId,
            questionText: q.questionText,
            difficulty: q.difficulty,
            points: q.points,
            options: q.shuffledOptions,
        }));

        return NextResponse.json({
            sessionId: session.id,
            questions: clientQuestions,
            startedAt: session.started_at,
            totalPossible,
            durationMinutes: quizConfig.durationMinutes || 20,
        }, { status: 201 });

    } catch (err) {
        console.error('Error in quiz start:', err);
        return NextResponse.json({ error: 'Failed to start quiz' }, { status: 500 });
    }
}
