export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireCoordinator } from '@/lib/ps-auth';

// Helper to normalize question objects into standard database format
function parseQuestionPayload(q, defaultCreatedBy) {
    // 1. Question text
    const questionText = (q.question || q.question_text || q.questionText || '').trim();

    // 2. Options: object {"A": "...", "B": "..."} or array ["...", "..."]
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

    // 3. Correct option: "A" / "B" / "C" / "D" or integer index 0 / 1 / 2 / 3
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

    // 5. Category & Difficulty
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

        const coordinator = await requireCoordinator(request, eventId);
        if (!coordinator) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const category = searchParams.get('category');
        const difficulty = searchParams.get('difficulty');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        const admin = createAdminClient();
        let query = admin.from('ps_question_bank').select('*', { count: 'exact' });

        if (category) query = query.eq('category', category);
        if (difficulty) query = query.eq('difficulty', difficulty);
        if (search) query = query.ilike('question_text', `%${search}%`);

        query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        const { data: questions, count, error } = await query;
        if (error) throw error;

        return NextResponse.json({
            questions,
            total: count,
            page,
            limit
        });

    } catch (error) {
        console.error('Question Bank GET API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
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

        // Check if this is an explanations bulk upload
        if (body.explanations && Array.isArray(body.explanations)) {
            return await handleExplanationsUpdate(admin, body.explanations);
        }

        // Bulk questions insert
        if (body.questions && Array.isArray(body.questions)) {
            // If the array contains explanation objects without question statements
            const isPureExplanations = body.questions.every(item => 
                (item.explanation || item.solution) && !item.question && !item.question_text && !item.questionText
            );

            if (isPureExplanations) {
                return await handleExplanationsUpdate(admin, body.questions);
            }

            const insertData = body.questions.map(q => parseQuestionPayload(q, eventId));

            // Validate all
            for (let i = 0; i < insertData.length; i++) {
                const q = insertData[i];
                if (!q.question_text) {
                    return NextResponse.json({ error: `Question #${i + 1} is missing question text` }, { status: 400 });
                }
                if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some(opt => opt === '')) {
                    return NextResponse.json({ error: `Question #${i + 1} must have 4 non-empty options (A, B, C, D)` }, { status: 400 });
                }
                if (q.correct_option < 0 || q.correct_option > 3) {
                    return NextResponse.json({ error: `Question #${i + 1} has invalid correct_option (must be A/B/C/D or 0-3)` }, { status: 400 });
                }
            }

            const { data: insertedQuestions, error } = await admin
                .from('ps_question_bank')
                .insert(insertData)
                .select();

            if (error) throw error;
            return NextResponse.json({ questions: insertedQuestions, count: insertedQuestions?.length || 0 });
        }

        // Single insert
        const parsed = parseQuestionPayload(body, eventId);

        if (!parsed.question_text) {
            return NextResponse.json({ error: 'Missing question text' }, { status: 400 });
        }

        if (!Array.isArray(parsed.options) || parsed.options.length !== 4 || parsed.options.some(opt => opt === '')) {
            return NextResponse.json({ error: 'Options must have exactly 4 non-empty choices (A, B, C, D)' }, { status: 400 });
        }
        
        const { data: question, error } = await admin
            .from('ps_question_bank')
            .insert(parsed)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ question });

    } catch (error) {
        console.error('Question Bank POST API Error:', error);
        return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const body = await request.json();
        const { eventId, explanations } = body;

        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        const coordinator = await requireCoordinator(request, eventId);
        if (!coordinator) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const admin = createAdminClient();
        const items = explanations || body.questions || [];
        return await handleExplanationsUpdate(admin, items);

    } catch (error) {
        console.error('Question Bank PATCH API Error:', error);
        return NextResponse.json({ error: 'Failed to update explanations' }, { status: 500 });
    }
}

// Helper to batch update question explanations by company_label and question_no
async function handleExplanationsUpdate(admin, explanations) {
    if (!Array.isArray(explanations) || explanations.length === 0) {
        return NextResponse.json({ error: 'No explanations provided' }, { status: 400 });
    }

    // 1. Fetch all questions from ps_question_bank
    const { data: allQuestions, error: qErr } = await admin
        .from('ps_question_bank')
        .select('*')
        .order('created_at', { ascending: true });

    if (qErr) throw qErr;

    let updatedCount = 0;
    const errors = [];

    // 2. Iterate through each explanation item
    for (let i = 0; i < explanations.length; i++) {
        const item = explanations[i];
        const explanationText = (item.explanation || item.solution || item.explain || '').trim();
        if (!explanationText) continue;

        const companyLabel = (item.company_label || item.company || item.companyLabel || item.tag || '').trim().toLowerCase();
        const questionNo = parseInt(item.question_no || item.questionNo || item.question_number || item.questionNumber || '0');

        let targetQuestionId = null;

        // Direct ID match
        if (item.id || item.questionId) {
            targetQuestionId = item.id || item.questionId;
        } 
        // Match by company_label + question_no
        else if (companyLabel && questionNo > 0) {
            const companyQuestions = (allQuestions || []).filter(bq => {
                const hasTag = Array.isArray(bq.tags) && bq.tags.some(t => String(t).toLowerCase() === companyLabel);
                const matchCat = (bq.category || '').toLowerCase() === companyLabel;
                return hasTag || matchCat;
            });

            // 1. Check exact q_no tag
            const exactTagMatch = companyQuestions.find(bq => 
                Array.isArray(bq.tags) && bq.tags.includes(`q_no:${questionNo}`)
            );

            if (exactTagMatch) {
                targetQuestionId = exactTagMatch.id;
            } else if (companyQuestions.length > 0 && questionNo <= companyQuestions.length) {
                // 2. Fallback to 1-indexed order
                targetQuestionId = companyQuestions[questionNo - 1].id;
            } else if (companyQuestions.length > 0) {
                errors.push(`Item #${i + 1} (${item.company_label} #${questionNo}): Exceeds available questions in bank (${companyQuestions.length} found)`);
            } else {
                errors.push(`Item #${i + 1}: No questions found matching company "${item.company_label || item.company}"`);
            }
        } 
        // Match by question statement
        else if (item.question || item.question_text) {
            const qText = (item.question || item.question_text).trim().toLowerCase();
            const matched = (allQuestions || []).find(bq => bq.question_text.trim().toLowerCase() === qText);
            if (matched) targetQuestionId = matched.id;
        }

        if (targetQuestionId) {
            const { error: updErr } = await admin
                .from('ps_question_bank')
                .update({ 
                    explanation: explanationText,
                    updated_at: new Date().toISOString()
                })
                .eq('id', targetQuestionId);

            if (!updErr) {
                updatedCount++;
            } else {
                errors.push(`Item #${i + 1}: Update failed (${updErr.message})`);
            }
        }
    }

    return NextResponse.json({
        success: true,
        updatedCount,
        totalItems: explanations.length,
        errors: errors.length > 0 ? errors : undefined
    });
}
