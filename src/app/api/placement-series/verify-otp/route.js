export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireParticipant, signParticipantToken, setParticipantCookie } from '@/lib/ps-auth';
import bcrypt from 'bcrypt';

export async function POST(request) {
    try {
        const body = await request.json();
        const { otp } = body;

        if (!otp) {
            return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
        }

        const participant = await requireParticipant(request, false);
        if (participant.error) {
            return NextResponse.json({ error: participant.error }, { status: 401 });
        }

        const admin = createAdminClient();

        // 1. Fetch participant
        const { data: dbUser, error: fetchErr } = await admin
            .from('ps_participants')
            .select('otp_hash, otp_expires_at')
            .eq('id', participant.participantId)
            .single();

        if (fetchErr || !dbUser) {
            return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
        }

        // 2. Validate state
        if (!dbUser.otp_hash || !dbUser.otp_expires_at) {
            return NextResponse.json({ error: 'No OTP request found' }, { status: 400 });
        }

        const expiresAt = new Date(dbUser.otp_expires_at).getTime();
        if (Date.now() > expiresAt) {
            return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
        }

        // 3. Compare OTP
        const isMatch = await bcrypt.compare(otp.trim(), dbUser.otp_hash);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        // 4. Update DB to verified
        const { error: updateErr } = await admin
            .from('ps_participants')
            .update({
                is_verified: true,
                otp_hash: null,
                otp_expires_at: null
            })
            .eq('id', participant.participantId);

        if (updateErr) throw updateErr;

        // 5. Sign new verified token
        const newToken = await signParticipantToken({
            participantId: participant.participantId,
            eventId: participant.eventId,
            isVerified: true
        });

        const response = NextResponse.json({ success: true, isVerified: true });
        setParticipantCookie(response, newToken);

        return response;

    } catch (error) {
        console.error('Verify OTP API Error:', error);
        return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
    }
}
