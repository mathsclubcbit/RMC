import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendWelcomeEmail, sendTicketEmail } from '@/lib/email';

export async function GET(request: Request) {
    // Check authorization to ensure only cron or admin can trigger
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const supabase = createAdminClient();

        // 1. Fetch up to 50 pending emails (to stay within Vercel execution limits)
        const { data: queueItems, error: fetchError } = await supabase
            .from('email_queue')
            .select('*')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: true })
            .limit(20);

        if (fetchError) throw fetchError;

        if (!queueItems || queueItems.length === 0) {
            return NextResponse.json({ message: 'No emails to process' });
        }

        // 2. Mark as processing to prevent concurrent cron jobs from picking them up
        const itemIds = queueItems.map(item => item.id);
        await supabase
            .from('email_queue')
            .update({ status: 'PROCESSING', updated_at: new Date().toISOString() })
            .in('id', itemIds);

        let successCount = 0;
        let failCount = 0;

        // 3. Process each email
        for (const item of queueItems) {
            try {
                let sent = false;

                if (item.type === 'WELCOME_EMAIL') {
                    await sendWelcomeEmail(item.payload.email, item.payload.name);
                    sent = true;
                } else if (item.type === 'TICKET_EMAIL') {
                    sent = await sendTicketEmail(item.payload);
                } else {
                    console.warn(`Unknown email type: ${item.type}`);
                }

                // Update status
                await supabase
                    .from('email_queue')
                    .update({
                        status: sent ? 'SENT' : 'FAILED',
                        updated_at: new Date().toISOString(),
                        error_message: sent ? null : 'Failed to send via Resend'
                    })
                    .eq('id', item.id);
                
                if (sent) successCount++;
                else failCount++;

            } catch (err: any) {
                console.error(`Error processing email ${item.id}:`, err);
                await supabase
                    .from('email_queue')
                    .update({
                        status: 'FAILED',
                        updated_at: new Date().toISOString(),
                        error_message: err.message,
                        attempts: (item.attempts || 0) + 1
                    })
                    .eq('id', item.id);
                failCount++;
            }

            // 2-second delay between sends to protect Gmail reputation
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return NextResponse.json({
            message: 'Queue processed',
            processed: queueItems.length,
            success: successCount,
            failed: failCount
        });
    } catch (error: any) {
        console.error('Process emails cron error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
