import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// SMTP Transporter (Same as in lib/email.ts, duplicated here for API route isolation or import it)
// Better to simple import logic, but for raw API speed, let's redefine or import if possible.
// We'll use nodemailer directly here.

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for batch sending

export async function POST(request) {
    try {
        const { subject, body, testEmail } = await request.json();

        // 1. Authorization check would be handled by middleware or assumed protected if this route is only called by admin
        // Ideally verify session here. For V1 prototype, we assume the caller (Admin UI) is authenticated.

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
                        ${body.replace(/\n/g, '<br/>')}
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
            await transporter.sendMail({
                from: `"RMC Inner Circle" <${process.env.EMAIL_USER}>`,
                to: testEmail,
                subject: `[TEST] ${subject}`,
                html: htmlContent
            });
            return NextResponse.json({ success: true, message: "Test email sent" });
        }

        // BROADCAST MODE
        // 1. Fetch active subscribers
        const { data: subscribers, error } = await supabase
            .from('newsletter_subscribers')
            .select('email')
            .eq('is_active', true);

        if (error) throw error;
        if (!subscribers?.length) return NextResponse.json({ message: "No active subscribers" });

        // 2. Send in batches (simple for loop for <500)
        let successCount = 0;
        const bccBatches = []; // Gmail limit is ~100 recipients per Bcc usually, or 500 total/day.
        // Let's send individual emails for better deliverability/personalization potential later,
        // OR use BCC for speed if list is small. 
        // For "Inner Circle" feel, individual is better, but slower. 
        // Let's do individual for now (assuming <50 users initially).

        // Actually, for rate limits, let's use BCC in chunks of 50 to be safe and fast.
        const BATCH_SIZE = 50;
        for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
            const batch = subscribers.slice(i, i + BATCH_SIZE).map(s => s.email);

            await transporter.sendMail({
                from: `"RMC Inner Circle" <${process.env.EMAIL_USER}>`,
                bcc: batch, // Blind Carbon Copy
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
