import { NextResponse } from 'next/server';
import { createAdminClient, findUserByEmail } from '@/lib/supabase/server';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';

export const runtime = 'nodejs';

const getJwtSecret = () => {
    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret) {
        throw new Error('JWT_SECRET is not set');
    }
    return new TextEncoder().encode(rawSecret);
};

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

        const coordinatorEmail = `coord-${cleanEventId}@rmccbit.in`.toLowerCase();

        let userId = null;
        
        try {
            // Find existing user across all auth pages
            let existingUser = await findUserByEmail(admin, coordinatorEmail);

            if (!existingUser) {
                // Try creating new coordinator user
                const { data: newUser, error: createError } = await admin.auth.admin.createUser({
                    email: coordinatorEmail,
                    password: cleanPassword,
                    email_confirm: true,
                    app_metadata: { role: 'coordinator', event_id: cleanEventId }
                });
                
                if (createError) {
                    // If user already exists (e.g. pagination race or previous creation), re-fetch user
                    if (createError.code === 'email_exists' || createError.status === 422 || createError.message?.toLowerCase().includes('already')) {
                        existingUser = await findUserByEmail(admin, coordinatorEmail);
                    } else {
                        console.error('[Coordinator Login] Failed to create user:', createError);
                    }
                } else {
                    userId = newUser?.user?.id;
                }
            }

            if (existingUser) {
                // Update existing user password and metadata
                const { error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
                    password: cleanPassword,
                    app_metadata: { role: 'coordinator', event_id: cleanEventId }
                });
                
                if (updateError) {
                    console.error('[Coordinator Login] Failed to update user:', updateError);
                }
                userId = existingUser.id;
            }
        } catch (authErr) {
            console.error('[Coordinator Login] Error managing auth user:', authErr);
        }

        // Fallback userId if Supabase auth user sync had any issue
        userId = userId || `coord-${cleanEventId}`;
        
        console.log('[Coordinator Login] User ready:', coordinatorEmail, 'ID:', userId);

        // Create JWT token for coordinator session
        const token = await new SignJWT({
            type: 'coordinator',
            eventId: cleanEventId,
            email: coordinatorEmail,
            userId: userId,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .setIssuedAt()
            .sign(getJwtSecret());

        console.log('[Coordinator Login] Success for event:', event.title);

        // Create response
        const response = isForm
            ? NextResponse.redirect(new URL('/coordinator/dashboard', request.url), 303)
            : NextResponse.json({
                success: true,
                event: {
                    id: event.id,
                    title: event.title
                }
            });

        // Set simple JWT cookie
        response.cookies.set('coordinator_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
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
