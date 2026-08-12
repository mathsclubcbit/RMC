export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireCoordinator } from '@/lib/ps-auth';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        const date = searchParams.get('date'); // YYYY-MM-DD

        if (!eventId || !date) {
            return NextResponse.json({ error: 'eventId and date are required' }, { status: 400 });
        }

        const coordinator = await requireCoordinator(request, eventId);
        if (!coordinator) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        const admin = createAdminClient();

        // Fetch the daily questions for this date
        const { data: questions, error: qError } = await admin
            .from('ps_daily_questions')
            .select(`
                id,
                question_number,
                ps_question_bank (
                    question_text
                )
            `)
            .eq('event_id', eventId)
            .eq('question_date', date)
            .order('question_number', { ascending: true });

        if (qError) throw qError;

        // For each question, get submissions stats
        const stats = [];
        for (const q of questions) {
            const { data: subs, error: sError } = await admin
                .from('ps_daily_submissions')
                .select('is_correct')
                .eq('daily_question_id', q.id);
            
            if (sError) throw sError;

            const totalSubmissions = subs.length;
            const correctSubmissions = subs.filter(s => s.is_correct).length;
            
            stats.push({
                questionId: q.id,
                questionNumber: q.question_number,
                questionText: q.ps_question_bank?.question_text,
                totalSubmissions,
                correctSubmissions,
                accuracy: totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0
            });
        }

        return NextResponse.json({ stats });
    } catch (error) {
        console.error('Daily Stats API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
