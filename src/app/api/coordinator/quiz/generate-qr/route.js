import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCoordinatorEventId } from '@/app/coordinator/actions';

export async function POST(request) {
    const coordinatorEventId = await getCoordinatorEventId();
    if (!coordinatorEventId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { eventId } = body;

        // Verify the coordinator is trying to generate a QR for their own event
        if (eventId !== coordinatorEventId) {
             console.log("Generate QR Forbidden: ", { requestedEventId: eventId, coordinatorTokenEventId: coordinatorEventId });
             return NextResponse.json({ error: `Forbidden: Mismatch between requested event and coordinator token.` }, { status: 403 });
        }

        const supabase = createAdminClient();
        
        // Expiration in 6 seconds
        const expiresAt = new Date(Date.now() + 6000).toISOString();

        const { data, error } = await supabase
            .from('quiz_entry_qrs')
            .insert({
                event_id: eventId,
                expires_at: expiresAt,
                max_scans: 6
            })
            .select('id')
            .single();

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({ error: 'quiz_entry_qrs table is missing. Please run 017_rotating_qr.sql migration.' }, { status: 500 });
            }
            throw error;
        }

        return NextResponse.json({ id: data.id });
    } catch (err) {
        console.error("QR Generation Error:", err);
        return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 });
    }
}
