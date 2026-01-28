import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-replace-in-production');

async function verifyAdmin(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return false;

    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        return payload?.type === 'admin';
    } catch {
        return false;
    }
}

export async function PATCH(request, { params }) {
    // Verify admin session
    if (!(await verifyAdmin(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { password } = await request.json();

        if (!password || typeof password !== 'string') {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Get current event
        const { data: event, error: fetchError } = await supabase
            .from('events')
            .select('payload')
            .eq('id', id)
            .single();

        if (fetchError || !event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Update password in payload
        const updatedPayload = {
            ...event.payload,
            password: password.trim()
        };

        const { error: updateError } = await supabase
            .from('events')
            .update({ payload: updatedPayload })
            .eq('id', id);

        if (updateError) {
            console.error('Failed to update password:', updateError);
            return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Password update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
