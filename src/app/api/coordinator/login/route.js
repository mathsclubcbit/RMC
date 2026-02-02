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
        const contentType = request.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        const isForm = contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');

        // Parse request body
        let eventId;
        let password;

        if (isJson) {
            const body = await request.json();
            eventId = body?.eventId;
            password = body?.password;
        } else if (isForm) {
            const form = await request.formData();
            eventId = form.get('eventId');
            password = form.get('password');
        }

        // Validate inputs
        if (!eventId || typeof eventId !== 'string') {
            const msg = 'Event ID is required';
            if (isForm) {
                return NextResponse.redirect(new URL(`/coordinator/login?error=${encodeURIComponent(msg)}`, request.url));
            }
            return NextResponse.json({ error: msg }, { status: 400 });
        }

        if (!password || typeof password !== 'string') {
            const msg = 'Password is required';
            if (isForm) {
                return NextResponse.redirect(new URL(`/coordinator/login?error=${encodeURIComponent(msg)}`, request.url));
            }
            return NextResponse.json({ error: msg }, { status: 400 });
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
            const msg = 'Invalid Event ID';
            if (isForm) {
                return NextResponse.redirect(new URL(`/coordinator/login?error=${encodeURIComponent(msg)}`, request.url));
            }
            return NextResponse.json({ error: msg }, { status: 401 });
        }

        // Get stored password from event payload
        const storedPassword = event.payload?.password;
        const isHashed = event.payload?.passwordHashed === true;

        // Check if event has a password set
        if (!storedPassword) {
            console.log('[Coordinator Login] No password set for event:', cleanEventId);
            const msg = 'This event has no password set. Please contact the admin.';
            if (isForm) {
                return NextResponse.redirect(new URL(`/coordinator/login?error=${encodeURIComponent(msg)}`, request.url));
            }
            return NextResponse.json({ error: msg }, { status: 403 });
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
            const msg = 'Incorrect password';
            if (isForm) {
                return NextResponse.redirect(new URL(`/coordinator/login?error=${encodeURIComponent(msg)}`, request.url));
            }
            return NextResponse.json({ error: msg }, { status: 401 });
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
        const response = isForm
            ? NextResponse.redirect(new URL('/coordinator/dashboard', request.url), 303)
            : NextResponse.json({
                success: true,
                event: {
                    id: event.id,
                    title: event.title
                }
            });

        response.cookies.set('coordinator_token', token, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            path: '/',
            ...(domain ? { domain } : {}),
            maxAge: 60 * 60 * 24 // 24 hours
        });

        console.log('[Coordinator Login] Success for event:', event.title);

        return response;

    } catch (error) {
        console.error('[Coordinator Login] Error:', error);
        const msg = 'Internal server error';
        const contentType = request.headers.get('content-type') || '';
        const isForm = contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');
        if (isForm) {
            return NextResponse.redirect(new URL(`/coordinator/login?error=${encodeURIComponent(msg)}`, request.url));
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
