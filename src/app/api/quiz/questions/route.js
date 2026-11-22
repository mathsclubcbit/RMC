import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

const getJwtSecret = () => {
    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret) return null;
    return new TextEncoder().encode(rawSecret);
};

const DIFFICULTY_POINTS = { easy: 1, medium: 2, hard: 3 };

async function requireCoordinator(request) {
    const token = request.cookies.get('coordinator_token')?.value;
    if (!token) return null;
    try {
        const secret = getJwtSecret();
        if (!secret) return null;
        const { payload } = await jwtVerify(token, secret);
        if (payload.type !== 'coordinator' || !payload.eventId) return null;
        return payload;
    } catch {
        return null;
    }
}

// GET — List questions for an event (coordinator only)
export async function GET(request) {
    const coord = await requireCoordinator(request);
    if (!coord) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId') || coord.eventId;

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching quiz questions:', error);
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Summary stats
    const stats = {
        total: data.length,
        easy: data.filter(q => q.difficulty === 'easy').length,
        medium: data.filter(q => q.difficulty === 'medium').length,
        hard: data.filter(q => q.difficulty === 'hard').length,
    };

    return NextResponse.json({ questions: data, stats });
}

// POST — Add question(s) (coordinator only)
export async function POST(request) {
    const coord = await requireCoordinator(request);
    if (!coord) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const eventId = body.eventId || coord.eventId;

        // Support single or bulk insert
        const questions = Array.isArray(body.questions) ? body.questions : [body];

        const rows = questions.map((q, idx) => ({
            event_id: eventId,
            question_text: q.questionText || q.question_text,
            options: q.options,
            correct_option: parseInt(q.correctOption ?? q.correct_option),
            difficulty: q.difficulty || 'medium',
            explanation: q.explanation || null,
            points: DIFFICULTY_POINTS[q.difficulty || 'medium'] || 2,
            sort_order: q.sortOrder ?? q.sort_order ?? idx,
        }));

        // Validate
        for (const row of rows) {
            if (!row.question_text) return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
            if (!Array.isArray(row.options) || row.options.length < 2) return NextResponse.json({ error: 'At least 2 options required' }, { status: 400 });
            if (row.correct_option < 0 || row.correct_option >= row.options.length) return NextResponse.json({ error: 'Invalid correct option index' }, { status: 400 });
        }

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('quiz_questions')
            .insert(rows)
            .select('*');

        if (error) {
            console.error('Error creating quiz question:', error);
            return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
        }

        return NextResponse.json({ questions: data }, { status: 201 });
    } catch (err) {
        console.error('Error in quiz questions POST:', err);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

// PUT — Update a question (coordinator only)
export async function PUT(request) {
    const coord = await requireCoordinator(request);
    if (!coord) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        if (!body.id) return NextResponse.json({ error: 'Question id is required' }, { status: 400 });

        const updates = {};
        if (body.questionText !== undefined || body.question_text !== undefined) updates.question_text = body.questionText || body.question_text;
        if (body.options !== undefined) updates.options = body.options;
        if (body.correctOption !== undefined || body.correct_option !== undefined) updates.correct_option = parseInt(body.correctOption ?? body.correct_option);
        if (body.difficulty !== undefined) {
            updates.difficulty = body.difficulty;
            updates.points = DIFFICULTY_POINTS[body.difficulty] || 2;
        }
        if (body.explanation !== undefined) updates.explanation = body.explanation;
        if (body.sortOrder !== undefined || body.sort_order !== undefined) updates.sort_order = body.sortOrder ?? body.sort_order;

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('quiz_questions')
            .update(updates)
            .eq('id', body.id)
            .eq('event_id', coord.eventId)
            .select('*')
            .single();

        if (error) {
            console.error('Error updating quiz question:', error);
            return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
        }

        return NextResponse.json({ question: data });
    } catch (err) {
        console.error('Error in quiz questions PUT:', err);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}

// DELETE — Delete a question (coordinator only)
export async function DELETE(request) {
    const coord = await requireCoordinator(request);
    if (!coord) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Question id is required' }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', id)
        .eq('event_id', coord.eventId);

    if (error) {
        console.error('Error deleting quiz question:', error);
        return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
