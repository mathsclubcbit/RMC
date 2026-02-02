import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function getCoordinatorEventId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user?.app_metadata?.role !== 'coordinator' || !user?.app_metadata?.event_id) {
        return null;
    }

    return user.app_metadata.event_id;
}

export async function POST(request) {
    try {
        const coordinatorEventId = await getCoordinatorEventId();

        if (!coordinatorEventId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { ticketId } = body;

        if (!ticketId) {
            return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Fetch the ticket registration
        const { data: registration, error } = await supabase
            .from('registrations')
            .select('*, events(title)')
            .eq('id', ticketId)
            .single();

        if (error || !registration) {
            return NextResponse.json({ valid: false, message: 'Ticket Not Found' });
        }

        // 2. Check if it matches the coordinator's event
        if (String(registration.event_id) !== String(coordinatorEventId)) {
            return NextResponse.json({
                valid: false,
                message: 'Wrong Event',
                detail: `This ticket is for "${registration.events?.title || 'Another Event'}"`
            });
        }

        // 3. Valid ticket for this event
        return NextResponse.json({
            valid: true,
            data: registration
        });

    } catch (error) {
        console.error('Verify error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
