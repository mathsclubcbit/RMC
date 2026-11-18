export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PS_TOKEN_COOKIE } from '@/lib/ps-auth';

export async function POST(request) {
    try {
        // Sign out from Supabase (clears Google OAuth session cookies)
        const supabase = await createClient();
        await supabase.auth.signOut();

        // Build redirect response and clear the ps_token cookie
        const url = new URL(request.url);
        const eventId = url.searchParams.get('eventId');
        const redirectTo = eventId ? `/placement-series/${eventId}` : '/';

        const response = NextResponse.json({ success: true, redirectTo });

        response.cookies.set(PS_TOKEN_COOKIE, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0, // immediately expire
        });

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
    }
}
