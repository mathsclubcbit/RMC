export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireCoordinator } from '@/lib/ps-auth';

export async function GET(request, { params }) {
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

        const { data: submissions, error } = await admin
            .from('ps_contest_submissions')
            .select(`
                *,
                ps_participants (
                    name,
                    roll_no,
                    email
                )
            `)
            .eq('contest_id', id)
            .order('score', { ascending: false })
            .order('time_taken_seconds', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ submissions });
    } catch (error) {
        console.error('Contest Submissions GET API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }
}
