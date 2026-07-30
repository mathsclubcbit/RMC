export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { signParticipantToken, setParticipantCookie } from '@/lib/ps-auth';

export async function POST(request) {
    try {
        const body = await request.json();
        const { eventId, name, email, rollNo, phone } = body;

        if (!eventId || !name || !email || !rollNo) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const trimmedRollNo = rollNo.trim().toUpperCase();
        const trimmedEmail = email.trim().toLowerCase();

        const admin = createAdminClient();

        // Check if the roll number is already used by a DIFFERENT email
        const { data: existingUser } = await admin
            .from('ps_participants')
            .select('email')
            .eq('event_id', eventId)
            .eq('roll_no', trimmedRollNo)
            .single();

        if (existingUser && existingUser.email !== trimmedEmail) {
            return NextResponse.json(
                { error: 'Roll number is already registered with a different email address.' },
                { status: 409 }
            );
        }

        // Upsert participant
        const { data: participant, error } = await admin
            .from('ps_participants')
            .upsert(
                {
                    event_id: eventId,
                    email: trimmedEmail,
                    name: name.trim(),
                    roll_no: trimmedRollNo,
                    phone: phone?.trim() || null,
                },
                {
                    onConflict: 'event_id,email',
                    ignoreDuplicates: false,
                }
            )
            .select()
            .single();

        if (error) throw error;

        // Sign token and set cookie
        const token = await signParticipantToken({
            participantId: participant.id,
            eventId: eventId,
            isVerified: Boolean(participant.is_verified)
        });

        const response = NextResponse.json({
            success: true,
            participant: {
                id: participant.id,
                name: participant.name,
                email: participant.email,
                rollNo: participant.roll_no,
                isVerified: Boolean(participant.is_verified)
            }
        });

        setParticipantCookie(response, token);
        return response;

    } catch (error) {
        console.error('Registration API Error:', error);
        return NextResponse.json({ error: 'Failed to process registration' }, { status: 500 });
    }
}
