import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const body = await request.json();
        const { eventId, password } = body;

        if (!eventId || !password) {
            return NextResponse.json({ error: 'Event ID and Password are required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Fetch event payload to check password
        const { data: event, error } = await supabase
            .from('events')
            .select('payload')
            .eq('id', eventId)
            .single();

        if (error || !event) {
            return NextResponse.json({ error: 'Invalid Event ID' }, { status: 401 });
        }

        const storedPassword = event.payload?.password;

        if (!storedPassword) {
            return NextResponse.json({ error: 'This event has no password set. Contact Admin.' }, { status: 403 });
        }

        if (storedPassword !== password) {
            return NextResponse.json({ error: 'Incorrect Password' }, { status: 401 });
        }

        // Set session cookie
        // In a real app, use a secure signed token (JWT). 
        // For this MVP, we store the eventId directly signed/encrypted or just simple value if acceptable for this scope.
        // Assuming simple cookie usage for now as per existing admin pattern.

        const cookieStore = await cookies();
        cookieStore.set('coordinator_session', eventId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 // 1 day
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Coordinator login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
