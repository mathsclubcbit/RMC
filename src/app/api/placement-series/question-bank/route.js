export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireCoordinator } from '@/lib/ps-auth';

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

        // Bulk insert
        if (body.questions && Array.isArray(body.questions)) {
            const insertData = body.questions.map(q => ({
                question_text: q.questionText || q.question_text,
                options: q.options,
                correct_option: q.correctOption ?? q.correct_option,
                explanation: q.explanation || null,
                category: q.category || null,
                difficulty: q.difficulty || 'medium',
                tags: q.tags || [],
                created_by: eventId
            }));

            // Validate all
            for (let q of insertData) {
                if (!q.question_text || !q.options || q.correct_option === undefined) {
                    return NextResponse.json({ error: 'Missing required fields in bulk data' }, { status: 400 });
                }
                if (!Array.isArray(q.options) || q.options.length !== 4) {
                    return NextResponse.json({ error: 'Options must be exactly 4 items' }, { status: 400 });
                }
                if (q.correct_option < 0 || q.correct_option > 3) {
                    return NextResponse.json({ error: 'correctOption must be 0-3' }, { status: 400 });
                }
            }

            const { data: insertedQuestions, error } = await admin
                .from('ps_question_bank')
                .insert(insertData)
                .select();

            if (error) throw error;
            return NextResponse.json({ questions: insertedQuestions });
        }

        // Single insert
        const { questionText, options, correctOption, explanation, category, difficulty, tags } = body;

        if (!questionText || !options || correctOption === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!Array.isArray(options) || options.length !== 4) {
            return NextResponse.json({ error: 'Options must be an array of exactly 4 strings' }, { status: 400 });
        }

        if (correctOption < 0 || correctOption > 3) {
            return NextResponse.json({ error: 'correctOption must be between 0 and 3' }, { status: 400 });
        }
        
        const { data: question, error } = await admin
            .from('ps_question_bank')
            .insert({
                question_text: questionText,
                options,
                correct_option: correctOption,
                explanation: explanation || null,
                category: category || null,
                difficulty: difficulty || 'medium',
                tags: tags || [],
                created_by: eventId
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ question });

    } catch (error) {
        console.error('Question Bank POST API Error:', error);
        return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
    }
}
