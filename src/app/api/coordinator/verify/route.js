import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-replace-in-production');

async function getCoordinatorEventId() {
    const cookieStore = await cookies();
    const token = cookieStore.get("coordinator_token")?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        if (payload?.type !== 'coordinator' || !payload?.eventId) {
            return null;
        }
        return payload.eventId;
    } catch {
        return null;
    }
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
