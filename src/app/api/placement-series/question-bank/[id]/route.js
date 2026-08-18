export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireCoordinator } from '@/lib/ps-auth';

export async function PUT(request, { params }) {
    try {
        const id = (await params).id;
        const body = await request.json();
        const { eventId, questionText, options, correctOption, explanation, category, difficulty, tags } = body;

        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        const coordinator = await requireCoordinator(request, eventId);
        if (!coordinator) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const updateData = { updated_at: new Date().toISOString() };
        if (questionText !== undefined) updateData.question_text = questionText;
        if (options !== undefined) {
            if (!Array.isArray(options) || options.length !== 4) {
                return NextResponse.json({ error: 'Options must be an array of exactly 4 strings' }, { status: 400 });
            }
            updateData.options = options;
        }
        if (correctOption !== undefined) {
            if (correctOption < 0 || correctOption > 3) {
                return NextResponse.json({ error: 'correctOption must be between 0 and 3' }, { status: 400 });
            }
            updateData.correct_option = correctOption;
        }
        if (explanation !== undefined) updateData.explanation = explanation;
        if (category !== undefined) updateData.category = category;
        if (difficulty !== undefined) updateData.difficulty = difficulty;
        if (tags !== undefined) updateData.tags = tags;

        const admin = createAdminClient();
        
        const { data: question, error } = await admin
            .from('ps_question_bank')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ question });

    } catch (error) {
        console.error('Question Bank PUT API Error:', error);
        return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const id = (await params).id;
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        
        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        const coordinator = await requireCoordinator(request, eventId);
        if (!coordinator) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const admin = createAdminClient();
        
        const { error } = await admin
            .from('ps_question_bank')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Question Bank DELETE API Error:', error);
        return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
    }
}
