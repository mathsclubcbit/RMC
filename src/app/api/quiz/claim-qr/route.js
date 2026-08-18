import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const body = await request.json();
        const { eventId, entryCode } = body;

        if (!eventId || !entryCode) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const cookieStore = await cookies();
        
        // If they already have an active session for this event, no need to claim again
        const hasSession = !!cookieStore.get(`qr_session_${eventId}`)?.value;
        if (hasSession) {
            return NextResponse.json({ success: true, message: 'Existing session found' });
        }

        // Validate the QR code using the RPC
        const { data: isValid, error: rpcErr } = await supabase.rpc('increment_qr_scan', { qr_id: entryCode });
        
        if (rpcErr || !isValid) {
            return NextResponse.json({ error: 'QR Code Expired or Invalid. Please scan the current code on the screen.' }, { status: 401 });
        }

        // Generate a simple token for cookie
        const claimToken = Math.random().toString(36).substring(2, 15);
        
        // Set HTTP-only cookie valid for 10 minutes (600 seconds)
        cookieStore.set(`qr_session_${eventId}`, claimToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 600,
            path: '/',
            sameSite: 'lax',
        });

        return NextResponse.json({ success: true, message: 'QR claimed successfully' });

    } catch (err) {
        console.error('Error claiming QR:', err);
        return NextResponse.json({ error: 'Failed to claim QR code' }, { status: 500 });
    }
}
