import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { signToken } from '@/lib/jwt';
import bcrypt from 'bcrypt';

export const runtime = 'nodejs';

function getCookieDomain(host) {
    if (!host) return undefined;
    const cleanHost = host.split(':')[0];
    if (cleanHost.endsWith('rmccbit.in')) {
        return '.rmccbit.in';
    }
    return undefined;
}

export async function POST(request) {
    try {
        // Parse request body
        const body = await request.json();
        const { eventId, password } = body;

        // Validate inputs
        if (!eventId || typeof eventId !== 'string') {
            return NextResponse.json(
                { error: 'Event ID is required' },
                { status: 400 }
            );
        }

        if (!password || typeof password !== 'string') {
            return NextResponse.json(
                { error: 'Password is required' },
                { status: 400 }
            );
        }

        // Clean inputs
        const cleanEventId = eventId.trim();
        const cleanPassword = password.trim();

        // Get event from database
        const supabase = createAdminClient();
        const { data: event, error: dbError } = await supabase
            .from('events')
            .select('id, title, payload')
            .eq('id', cleanEventId)
            .single();

        // Check if event exists
        if (dbError || !event) {
            console.log('[Coordinator Login] Event not found:', cleanEventId);
            return NextResponse.json(
                { error: 'Invalid Event ID' },
                { status: 401 }
            );
        }

        // Get stored password from event payload
        const storedPassword = event.payload?.password;
        const isHashed = event.payload?.passwordHashed === true;

        // Check if event has a password set
        if (!storedPassword) {
            console.log('[Coordinator Login] No password set for event:', cleanEventId);
            return NextResponse.json(
                { error: 'This event has no password set. Please contact the admin.' },
                { status: 403 }
            );
        }

        // Compare passwords - support both hashed (new) and plaintext (legacy)
        let passwordMatch = false;
        if (isHashed) {
            // New secure method: bcrypt comparison
            passwordMatch = await bcrypt.compare(cleanPassword, storedPassword);
        } else {
            // Legacy fallback: plaintext comparison (for migration period)
            // TODO: Remove this after all passwords are migrated to bcrypt
            console.warn('[Coordinator Login] Using legacy plaintext password for event:', cleanEventId);
            passwordMatch = storedPassword.trim() === cleanPassword;
        }

        if (!passwordMatch) {
            console.log('[Coordinator Login] Password mismatch for event:', cleanEventId);
            return NextResponse.json(
                { error: 'Incorrect password' },
                { status: 401 }
            );
        }

        // Create JWT token
        const token = await signToken(
            { type: 'coordinator', eventId: cleanEventId },
            '24h'
        );

        // Set cookie on the response (reliable in Route Handlers)
        const host = request.headers.get('host') || '';
        const domain = getCookieDomain(host);
        const isProd = process.env.NODE_ENV === 'production';
        const response = NextResponse.json({
            success: true,
            event: {
                id: event.id,
                title: event.title
            }
        });

        response.cookies.set('coordinator_token', token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            path: '/',
            ...(domain ? { domain } : {}),
            maxAge: 60 * 60 * 24 // 24 hours
        });

        console.log('[Coordinator Login] Success for event:', event.title);

        return response;

    } catch (error) {
        console.error('[Coordinator Login] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
