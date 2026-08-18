import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

const getJwtSecret = () => {
    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret) return null;
    return new TextEncoder().encode(rawSecret);
};

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

// GET — All sessions for coordinator monitoring
export async function GET(request) {
    const coord = await requireCoordinator(request);
    if (!coord) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId') || coord.eventId;

    const supabase = createAdminClient();
    const { data: sessions, error } = await supabase
        .from('quiz_sessions')
        .select('id, participant_name, participant_email, score, total_possible, started_at, submitted_at, time_taken_seconds, tab_switch_count')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching quiz sessions:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Compute summary stats
    const all = sessions || [];
    const submitted = all.filter(s => s.submitted_at);
    const inProgress = all.filter(s => !s.submitted_at);

    const stats = {
        total: all.length,
        submitted: submitted.length,
        inProgress: inProgress.length,
        avgScore: submitted.length > 0
            ? Math.round(submitted.reduce((sum, s) => sum + s.score, 0) / submitted.length * 100) / 100
            : 0,
        avgTime: submitted.length > 0
            ? Math.round(submitted.reduce((sum, s) => sum + (s.time_taken_seconds || 0), 0) / submitted.length)
            : 0,
        highestScore: submitted.length > 0 ? Math.max(...submitted.map(s => s.score)) : 0,
    };

    return NextResponse.json({ sessions: all, stats });
}
