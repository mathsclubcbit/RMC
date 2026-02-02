import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import bcrypt from 'bcrypt';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';

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
        const admin = createAdminClient();
        const { data: event, error: dbError } = await admin
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

        const coordinatorEmail = `coord-${cleanEventId}@rmccbit.in`;

        const { data: existingUser, error: userLookupError } = await admin.auth.admin.getUserByEmail(coordinatorEmail);

        if (userLookupError) {
            console.error('[Coordinator Login] Auth lookup error:', userLookupError);
        }

        if (!existingUser?.user) {
            await admin.auth.admin.createUser({
                email: coordinatorEmail,
                password: cleanPassword,
                email_confirm: true,
                app_metadata: { role: 'coordinator', event_id: cleanEventId }
            });
        } else {
            await admin.auth.admin.updateUserById(existingUser.user.id, {
                password: cleanPassword,
                app_metadata: { role: 'coordinator', event_id: cleanEventId }
            });
        }

        const response = isForm
            ? NextResponse.redirect(new URL('/coordinator/dashboard', request.url), 303)
            : NextResponse.json({
                success: true,
                event: {
                    id: event.id,
                    title: event.title
                }
            });

        const routeSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        const { error: signInError } = await routeSupabase.auth.signInWithPassword({
            email: coordinatorEmail,
            password: cleanPassword
        });

        if (signInError) {
            console.error('[Coordinator Login] Supabase sign-in error:', signInError);
            const msg = 'Authentication failed. Please try again.';
            if (isForm) {
                return NextResponse.redirect(new URL(`/coordinator/login?error=${encodeURIComponent(msg)}`, request.url));
            }
            return NextResponse.json({ error: msg }, { status: 401 });
        }

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
