import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { signParticipantToken, setParticipantCookie } from '@/lib/ps-auth';

export async function GET(request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const eventId = requestUrl.searchParams.get('eventId');
    const next = requestUrl.searchParams.get('next') || (eventId ? `/placement-series/${eventId}` : '/');

    if (code) {
        const supabase = await createClient();
        const { error, data } = await supabase.auth.exchangeCodeForSession(code);
        
        if (!error && data?.session && eventId) {
            const user = data.session.user;
            const email = user.email;
            
            // Check if they exist in ps_participants
            const admin = createAdminClient();
            const { data: participant } = await admin
                .from('ps_participants')
                .select('id, roll_no, is_verified')
                .eq('event_id', eventId)
                .eq('email', email)
                .single();
                
            if (participant && participant.roll_no) {
                // They exist! Generate our custom ps_token
                const token = await signParticipantToken({
                    participantId: participant.id,
                    eventId: eventId,
                    isVerified: true // Google verified email
                });
                
                // Update their verification status if not already verified
                if (!participant.is_verified) {
                     await admin.from('ps_participants').update({ is_verified: true }).eq('id', participant.id);
                }

                const response = NextResponse.redirect(new URL(next, requestUrl.origin));
                setParticipantCookie(response, token);
                return response;
            } else {
                // They need to complete their profile to provide a Roll Number
                return NextResponse.redirect(new URL(`/placement-series/${eventId}/complete-profile`, requestUrl.origin));
            }
        } else if (error) {
            console.error('Auth Callback Error:', error.message);
        }
    }

    // Default redirect if something failed or no eventId
    return NextResponse.redirect(new URL(next, requestUrl.origin));
}
