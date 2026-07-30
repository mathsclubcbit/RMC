export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireParticipant, generateOtp } from '@/lib/ps-auth';
import bcrypt from 'bcrypt';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'RMC <noreply@rmccbit.in>';

export async function POST(request) {
    try {
        const participant = await requireParticipant(request, false);
        if (participant.error) {
            return NextResponse.json({ error: participant.error }, { status: 401 });
        }

        const admin = createAdminClient();

        // 1. Fetch participant to check rate limiting and get email
        const { data: dbUser, error: fetchErr } = await admin
            .from('ps_participants')
            .select('email, otp_expires_at')
            .eq('id', participant.participantId)
            .single();

        if (fetchErr || !dbUser) {
            return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
        }

        // 2. Rate limit check (wait 60 seconds before generating a new OTP)
        if (dbUser.otp_expires_at) {
            const expiresAt = new Date(dbUser.otp_expires_at).getTime();
            const now = Date.now();
            // Assuming OTP is valid for 10 mins (600,000 ms). 
            // If it expires in > 9 mins, we just sent it within the last 60 seconds.
            if (expiresAt - now > 9 * 60 * 1000) {
                return NextResponse.json({ error: 'Please wait before requesting a new OTP' }, { status: 429 });
            }
        }

        // 3. Generate and hash OTP
        const otp = generateOtp();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const expiresAtDate = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins from now

        // 4. Update DB
        const { error: updateErr } = await admin
            .from('ps_participants')
            .update({
                otp_hash: hashedOtp,
                otp_expires_at: expiresAtDate
            })
            .eq('id', participant.participantId);

        if (updateErr) throw updateErr;

        // 5. Send email
        if (process.env.RESEND_API_KEY) {
            const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="margin: 0; padding: 0; font-family: monospace; background-color: #000; color: #fff;">
                <div style="padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #3ABCB3; border-radius: 8px;">
                    <h2 style="color: #3ABCB3; margin-top: 0;">Contest Verification</h2>
                    <p style="color: #a1a1aa;">Here is your One-Time Password to unlock the Placement Series contest. It is valid for 10 minutes.</p>
                    <div style="margin: 30px 0; padding: 20px; background: rgba(58,188,179,0.1); border: 1px dashed #3ABCB3; text-align: center;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #fff;">${otp}</span>
                    </div>
                    <p style="color: #71717a; font-size: 12px;">If you did not request this, please ignore this email.</p>
                </div>
            </body>
            </html>`;

            await resend.emails.send({
                from: EMAIL_FROM,
                to: dbUser.email,
                subject: '[RMC Placement Series] Your Contest Verification Code',
                html: html
            });
        } else {
            console.warn('RESEND_API_KEY not set. OTP generated but not emailed:', otp);
        }

        return NextResponse.json({ success: true, message: 'OTP sent to your email' });

    } catch (error) {
        console.error('Request OTP API Error:', error);
        return NextResponse.json({ error: 'Failed to request OTP' }, { status: 500 });
    }
}
