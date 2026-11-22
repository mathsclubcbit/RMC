import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';
import { isAdminAuthenticated } from '@/app/admin/actions';

// Explicit runtime for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'RMC <noreply@rmccbit.in>';

export async function POST(request) {
    try {
        // 1. Authorization check
        if (!(await isAdminAuthenticated())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { subject, body, testEmail } = await request.json();

        if (!subject || !body) {
            return NextResponse.json({ error: "Subject and Body required" }, { status: 400 });
        }

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&display=swap');</style>
</head>
<body style="background-color:#000000; color:#ffffff; font-family:'Cormorant Garamond', serif; padding:0; margin:0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#000000;">
        <tr>
            <td style="padding:40px 10px;">
                <div style="max-width:600px; margin:0 auto; background:#050505; border:1px solid rgba(45,212,191,0.2); border-radius:4px; box-shadow:0 0 40px rgba(45,212,191,0.05); overflow:hidden;">
                    
                    <!-- Header -->
                    <div style="padding:40px 40px 20px; text-align:center;">
                        <p style="margin:0 0 10px; color:#52525b; font-size:10px; text-transform:uppercase; letter-spacing:3px;">RMC Updates</p>
                        <h1 style="margin:0; color:#2dd4bf; font-weight:300; letter-spacing:2px; font-size:28px;">ANNOUNCEMENT</h1>
                        <div style="width:40px; height:1px; background:#2dd4bf; margin:20px auto;"></div>
                    </div>

                    <!-- Body -->
                    <div style="padding:0 40px 40px; font-size:18px; line-height:1.8; color:#e4e4e7;">
                        ${DOMPurify.sanitize(body.replace(/\n/g, '<br/>'), { ALLOWED_TAGS: ['b', 'i', 'u', 'a', 'p', 'br', 'strong', 'em', 'ul', 'ol', 'li'], ALLOWED_ATTR: ['href'] })}
                    </div>

                    <!-- Footer -->
                    <div style="background:rgba(45,212,191,0.05); border-top:1px solid rgba(45,212,191,0.1); padding:20px; text-align:center;">
                        <p style="margin:0; color:#52525b; font-size:11px; letter-spacing:1px;">
                            RAMANUJAN MATHS CLUB | CBIT
                        </p>
                        <p style="margin:5px 0 0; color:#3f3f46; font-size:10px;">
                            ${new Date().getFullYear()} &copy; All Rights Reserved
                        </p>
                    </div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        // TEST MODE
        if (testEmail) {
            await resend.emails.send({
                from: EMAIL_FROM,
                to: testEmail,
                subject: `[TEST] ${subject}`,
                html: htmlContent
            });
            return NextResponse.json({ success: true, message: "Test email sent" });
        }

        // BROADCAST MODE
        const { data: subscribers, error } = await supabase
            .from('newsletter_subscribers')
            .select('email')
            .eq('is_active', true);

        if (error) throw error;
        if (!subscribers?.length) return NextResponse.json({ message: "No active subscribers" });

        // Resend supports up to 50 recipients per 'to' array call
        let successCount = 0;
        const BATCH_SIZE = 50;
        for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
            const batch = subscribers.slice(i, i + BATCH_SIZE).map(s => s.email);
            await resend.emails.send({
                from: EMAIL_FROM,
                to: batch,
                subject: subject,
                html: htmlContent
            });
            successCount += batch.length;
        }

        return NextResponse.json({ success: true, sent: successCount });

    } catch (error) {
        console.error("Newsletter Send Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
