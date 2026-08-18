export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { signParticipantToken, setParticipantCookie } from '@/lib/ps-auth';

export async function POST(request) {
    try {
        const body = await request.json();
        const { eventId, rollNo, name: bodyName, year, branch, college } = body;

        if (!eventId || !rollNo || !year || !branch || !college) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const trimmedRollNo = rollNo.trim().toUpperCase();

        // 1. Get current logged-in Google user from Supabase session
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized. Please log in with Google first.' }, { status: 401 });
        }

        const email = user.email.trim().toLowerCase();
        // Prefer name from form; fall back to Google display name
        const name = (bodyName && bodyName.trim().length > 0)
            ? bodyName.trim()
            : (user.user_metadata?.full_name || user.email.split('@')[0]);

        const admin = createAdminClient();

        // 2. Check if roll number is already used by a DIFFERENT email
        const { data: existingUser } = await admin
            .from('ps_participants')
            .select('email')
            .eq('event_id', eventId)
            .eq('roll_no', trimmedRollNo)
            .single();

        if (existingUser && existingUser.email !== email) {
            return NextResponse.json(
                { error: 'Roll number is already registered with a different email address.' },
                { status: 409 }
            );
        }

        // 3. Upsert participant with extended profile fields
        const { data: participant, error: dbError } = await admin
            .from('ps_participants')
            .upsert(
                {
                    event_id: eventId,
                    email: email,
                    name: name,
                    roll_no: trimmedRollNo,
                    year: year.trim(),
                    branch: branch.trim(),
                    college: college.trim(),
                    is_verified: true, // Auto-verified because they used Google Auth
                },
                {
                    onConflict: 'event_id,email',
                    ignoreDuplicates: false,
                }
            )
            .select()
            .single();

        if (dbError) {
            console.error('DB Error upserting participant:', dbError);
            throw dbError;
        }

        // 4. Sign custom ps_token and set cookie
        const token = await signParticipantToken({
            participantId: participant.id,
            eventId: eventId,
            isVerified: true
        });

        const response = NextResponse.json({
            success: true,
            participant: {
                id: participant.id,
                name: participant.name,
                email: participant.email,
                rollNo: participant.roll_no,
                year: participant.year,
                branch: participant.branch,
                college: participant.college,
                isVerified: true
            }
        });

        setParticipantCookie(response, token);
        return response;

    } catch (error) {
        console.error('Complete Profile API Error:', error);
        return NextResponse.json({ error: 'Failed to complete profile' }, { status: 500 });
    }
}
