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

        let userId;
        
        // Try to find existing user by listing users (getUserByEmail doesn't exist in current Supabase JS)
        let existingUser = null;
        try {
            // Use listUsers to find the coordinator user
            const { data: listData, error: listError } = await admin.auth.admin.listUsers();
            
            if (!listError && listData?.users) {
                existingUser = listData.users.find(u => u.email === coordinatorEmail);
            }
        } catch (listErr) {
            console.error('[Coordinator Login] Error listing users:', listErr);
        }

        if (!existingUser) {
            // Create new coordinator user
            const { data: newUser, error: createError } = await admin.auth.admin.createUser({
                email: coordinatorEmail,
                password: cleanPassword,
                email_confirm: true,
                app_metadata: { role: 'coordinator', event_id: cleanEventId }
            });
            
            if (createError) {
                console.error('[Coordinator Login] Failed to create user:', createError);
                const msg = 'Failed to set up coordinator account. Please try again.';
                if (isForm) {
                    return NextResponse.redirect(new URL(`/coordinator/login?error=${encodeURIComponent(msg)}`, request.url));
                }
                return NextResponse.json({ error: msg }, { status: 500 });
            }
            userId = newUser?.user?.id;
        } else {
            // Update existing user
            const { error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
                password: cleanPassword,
                app_metadata: { role: 'coordinator', event_id: cleanEventId }
            });
            
            if (updateError) {
                console.error('[Coordinator Login] Failed to update user:', updateError);
                const msg = 'Failed to update coordinator account. Please try again.';
                if (isForm) {
                    return NextResponse.redirect(new URL(`/coordinator/login?error=${encodeURIComponent(msg)}`, request.url));
                }
                return NextResponse.json({ error: msg }, { status: 500 });
            }
            userId = existingUser.id;
        }
        
        console.log('[Coordinator Login] User ready:', coordinatorEmail, 'ID:', userId);

        // Create response object that will hold our cookies
        let cookiesToSet = [];

        // Create Supabase client with cookie handler
        const routeSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSetArray) {
                        // Store cookies to apply to response later
                        cookiesToSet = cookiesToSetArray.map(({ name, value, options }) => ({
                            name,
                            value,
                            options: {
                                ...options,
                                path: '/',
                                secure: process.env.NODE_ENV === 'production',
                                sameSite: 'lax',
                                httpOnly: true,
                                maxAge: options.maxAge || 60 * 60 * 24 * 7 // 7 days default
                            }
                        }));
                    },
                },
            }
        );

        // Sign in to create session and trigger cookie generation
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

        console.log('[Coordinator Login] Success for event:', event.title, '- Setting', cookiesToSet.length, 'cookies');

        // NOW create the response with all cookies
        const response = isForm
            ? NextResponse.redirect(new URL('/coordinator/dashboard', request.url), 303)
            : NextResponse.json({
                success: true,
                event: {
                    id: event.id,
                    title: event.title
                }
            });

        // Apply all cookies to response
        cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
        });

        return response;

    } catch (error) {
        console.error('[Coordinator Login] Error:', error);
        console.error('[Coordinator Login] Error stack:', error?.stack);
        console.error('[Coordinator Login] Error message:', error?.message);
        const msg = 'Internal server error';
        const contentType = request.headers.get('content-type') || '';
        const isForm = contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');
        if (isForm) {
            return NextResponse.redirect(new URL(`/coordinator/login?error=${encodeURIComponent(msg)}`, request.url));
        }
        return NextResponse.json({ error: msg, details: error?.message }, { status: 500 });
    }
}
