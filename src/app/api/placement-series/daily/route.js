export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireCoordinator, requireParticipant, deterministicShuffle } from '@/lib/ps-auth';

// Helper to normalize dates to YYYY-MM-DD
function normalizeDate(rawDate) {
    if (!rawDate) return null;
    const str = String(rawDate).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    const parts = str.split(/[-/]/);
    if (parts.length === 3) {
        if (parts[0].length === 4) {
            // YYYY-MM-DD
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else if (parts[2].length === 4) {
            // DD-MM-YYYY
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    return str;
}

// Helper to parse question options & correct_option if full question is provided
function parseQuestionPayload(q, defaultCreatedBy) {
    const questionText = (q.question || q.question_text || q.questionText || '').trim();

    let options = [];
    if (q.options) {
        if (Array.isArray(q.options)) {
            options = q.options.map(opt => String(opt ?? '').trim());
        } else if (typeof q.options === 'object' && q.options !== null) {
            const optA = q.options['A'] ?? q.options['a'] ?? q.options[0] ?? '';
            const optB = q.options['B'] ?? q.options['b'] ?? q.options[1] ?? '';
            const optC = q.options['C'] ?? q.options['c'] ?? q.options[2] ?? '';
            const optD = q.options['D'] ?? q.options['d'] ?? q.options[3] ?? '';
            options = [String(optA).trim(), String(optB).trim(), String(optC).trim(), String(optD).trim()];
        }
    }

    let correctOption = 0;
    const rawCorrect = q.correct_option ?? q.correctOption ?? q.answer;
    if (typeof rawCorrect === 'string') {
        const upper = rawCorrect.trim().toUpperCase();
        if (upper === 'A' || upper === '0') correctOption = 0;
        else if (upper === 'B' || upper === '1') correctOption = 1;
        else if (upper === 'C' || upper === '2') correctOption = 2;
        else if (upper === 'D' || upper === '3') correctOption = 3;
        else {
            const matchIdx = options.findIndex(opt => opt.toLowerCase() === rawCorrect.trim().toLowerCase());
            correctOption = matchIdx >= 0 ? matchIdx : 0;
        }
    } else if (typeof rawCorrect === 'number') {
        correctOption = Math.max(0, Math.min(3, Math.floor(rawCorrect)));
    }

    // 4. Company label, question_no, and tags
    const companyLabel = (q.company_label || q.company || q.companyLabel || '').trim();
    const questionNo = q.question_no ?? q.questionNo ?? q.question_number ?? null;
    let tags = Array.isArray(q.tags) ? [...q.tags] : [];

    if (companyLabel && !tags.includes(companyLabel)) {
        tags.unshift(companyLabel);
    }
    if (questionNo !== null && questionNo !== undefined && !tags.some(t => t.startsWith('q_no:'))) {
        tags.push(`q_no:${questionNo}`);
    }

    const category = q.category || (companyLabel ? companyLabel : 'Aptitude');
    const difficulty = q.difficulty || 'medium';
    const explanation = q.explanation || q.solution || null;

    return {
        question_text: questionText,
        options,
        correct_option: correctOption,
        explanation,
        category,
        difficulty,
        tags,
        created_by: defaultCreatedBy
    };
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        
        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        const dateParam = searchParams.get('date');
        const queryDate = normalizeDate(dateParam) || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        // Auth is optional for GET. If token exists, we personalize options and check submissions.
        const participant = await requireParticipant(request, false);
        const admin = createAdminClient();

        // 1. Fetch daily questions for queryDate
        const { data: dailyQuestions, error: dailyErr } = await admin
            .from('ps_daily_questions')
            .select(`
                id, 
                question_number,
                question_date,
                question:ps_question_bank (
                    id, question_text, options, category, difficulty, explanation, correct_option, tags
                )
            `)
            .eq('event_id', eventId)
            .eq('question_date', queryDate)
            .order('question_number', { ascending: true });

        if (dailyErr) throw dailyErr;

        let formattedQuestions = [];

        if (dailyQuestions && dailyQuestions.length > 0) {
            // Active Question Day: fetch submissions
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

            // Format questions for the client
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
                    tags: q.tags || [],
                    question: q,
                    // Send submission details
                    submission: submission ? {
                        selectedOption: submission.selected_option,
                        isCorrect: submission.is_correct,
                        explanation: q.explanation
                    } : null
                };
            });

            return NextResponse.json({
                date: queryDate,
                isExplanationDay: false,
                questions: formattedQuestions
            });
        }

        // 2. Off-Day / Alternate Day: No questions for queryDate -> Fallback to previous day's solutions!
        const { data: prevDq } = await admin
            .from('ps_daily_questions')
            .select(`
                id, 
                question_number,
                question_date,
                question:ps_question_bank (
                    id, question_text, options, category, difficulty, explanation, correct_option, tags
                )
            `)
            .eq('event_id', eventId)
            .lt('question_date', queryDate)
            .order('question_date', { ascending: false })
            .order('question_number', { ascending: true })
            .limit(6);

        if (prevDq && prevDq.length > 0) {
            const sourceDate = prevDq[0].question_date;
            const sameDateItems = prevDq.filter(d => d.question_date === sourceDate);

            // BUG-10 FIX: Only include correctOption and explanation if the caller is authenticated.
            // Previously, any unauthenticated user could hit this endpoint after question-day
            // and get all correct answers, which they could then use to farm the daily submit
            // endpoint within the ±24h tolerance window.
            const isAuthenticated = !participant.error;

            const solutionQuestions = sameDateItems.map(dq => {
                const q = dq.question;
                const base = {
                    id: dq.id,
                    questionNumber: dq.question_number,
                    questionText: q?.question_text || '',
                    options: q?.options || [],
                    category: q?.category || 'Aptitude',
                    difficulty: q?.difficulty || 'medium',
                    tags: q?.tags || [],
                    isExplanationOnly: true,
                    sourceDate: sourceDate
                };

                if (isAuthenticated) {
                    // Authenticated participants may see the answers for learning
                    base.correctOption = q?.correct_option ?? 0;
                    base.explanation = q?.explanation || '';
                }

                return base;
            });

            return NextResponse.json({
                date: queryDate,
                isExplanationDay: true,
                sourceDate: sourceDate,
                questions: solutionQuestions
            });
        }

        return NextResponse.json({
            date: queryDate,
            isExplanationDay: false,
            questions: []
        });

    } catch (error) {
        console.error('Daily Questions GET API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch daily questions' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { eventId } = body;

        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        const coordinator = await requireCoordinator(request, eventId);
        if (!coordinator) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const admin = createAdminClient();

        // ── 1. Batch Schedule JSON Upload (e.g. company_label, question_no, date) ──
        if (body.schedule && Array.isArray(body.schedule)) {
            const rawSchedule = body.schedule;
            
            // Fetch all questions in question bank for matching
            const { data: allBankQuestions, error: bankErr } = await admin
                .from('ps_question_bank')
                .select('*')
                .order('created_at', { ascending: true });

            if (bankErr) throw bankErr;

            let assignedCount = 0;
            const errors = [];
            const dateSlots = {}; // Track slot count per date to assign 1, 2, 3

            for (let i = 0; i < rawSchedule.length; i++) {
                const item = rawSchedule[i];
                const rawDate = item.date || item.question_date || body.date;
                const formattedDate = normalizeDate(rawDate);

                if (!formattedDate) {
                    errors.push(`Item #${i + 1}: Missing or invalid date`);
                    continue;
                }

                if (!dateSlots[formattedDate]) dateSlots[formattedDate] = 0;
                
                // Determine question slot (1, 2, 3)
                let slot = item.question_number || item.questionNumber || item.slot;
                if (!slot || ![1, 2, 3].includes(slot)) {
                    dateSlots[formattedDate]++;
                    slot = ((dateSlots[formattedDate] - 1) % 3) + 1;
                }

                let targetQuestionId = null;

                // Case A: Full question content provided inline
                if (item.question || item.question_text || item.questionText) {
                    const parsed = parseQuestionPayload(item, eventId);
                    
                    // Check if question already exists in bank by matching text
                    const existing = (allBankQuestions || []).find(bq => 
                        bq.question_text.trim().toLowerCase() === parsed.question_text.trim().toLowerCase()
                    );

                    if (existing) {
                        targetQuestionId = existing.id;
                    } else {
                        const { data: inserted, error: insErr } = await admin
                            .from('ps_question_bank')
                            .insert(parsed)
                            .select('id')
                            .single();
                        if (insErr) {
                            errors.push(`Item #${i + 1}: Failed to save question to bank (${insErr.message})`);
                            continue;
                        }
                        targetQuestionId = inserted.id;
                        allBankQuestions.push({ ...parsed, id: inserted.id });
                    }
                } 
                // Case B: Reference by company_label and question_no
                else {
                    const companyLabel = (item.company_label || item.company || item.companyLabel || item.tag || '').trim().toLowerCase();
                    const questionNo = parseInt(item.question_no || item.questionNo || item.question_number || item.questionNumber || '1');

                    // Find questions matching company_label in tags or category
                    const matchedCompanyQuestions = (allBankQuestions || []).filter(bq => {
                        const hasTag = Array.isArray(bq.tags) && bq.tags.some(t => String(t).toLowerCase() === companyLabel);
                        const matchCat = (bq.category || '').toLowerCase() === companyLabel;
                        return hasTag || matchCat;
                    });

                    if (matchedCompanyQuestions.length === 0) {
                        errors.push(`Item #${i + 1}: No questions found in bank matching company "${item.company_label || item.company}"`);
                        continue;
                    }

                    // 1. Check exact q_no tag match
                    const exactTagMatch = matchedCompanyQuestions.find(bq => 
                        Array.isArray(bq.tags) && bq.tags.includes(`q_no:${questionNo}`)
                    );

                    if (exactTagMatch) {
                        targetQuestionId = exactTagMatch.id;
                    } else {
                        // 2. Select the question by 1-indexed question_no fallback
                        const matchIndex = questionNo - 1;
                        if (matchIndex < 0 || matchIndex >= matchedCompanyQuestions.length) {
                            targetQuestionId = matchedCompanyQuestions[matchIndex % matchedCompanyQuestions.length].id;
                        } else {
                            targetQuestionId = matchedCompanyQuestions[matchIndex].id;
                        }
                    }
                }

                if (targetQuestionId) {
                    const { error: assignErr } = await admin
                        .from('ps_daily_questions')
                        .upsert({
                            event_id: eventId,
                            question_date: formattedDate,
                            question_number: slot,
                            question_id: targetQuestionId
                        }, {
                            onConflict: 'event_id,question_date,question_number'
                        });

                    if (assignErr) {
                        errors.push(`Item #${i + 1}: Failed to assign to date ${formattedDate} (${assignErr.message})`);
                    } else {
                        assignedCount++;
                    }
                }
            }

            return NextResponse.json({
                success: true,
                assigned: assignedCount,
                errors: errors.length > 0 ? errors : undefined
            });
        }

        // ── 2. Standard Single Date Manual Assignments ──
        const { date, assignments } = body;

        if (!date || !Array.isArray(assignments)) {
            return NextResponse.json({ error: 'Missing date or assignments' }, { status: 400 });
        }

        const formattedDate = normalizeDate(date);
        let assignedCount = 0;
        
        for (const assignment of assignments) {
            const { questionNumber, questionId } = assignment;
            if (![1, 2, 3].includes(questionNumber) || !questionId) continue;

            const { error } = await admin
                .from('ps_daily_questions')
                .upsert({
                    event_id: eventId,
                    question_date: formattedDate,
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
