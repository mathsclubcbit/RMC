import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@rmc-cbit.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

export async function POST(request) {
    try {
        const { subscription } = await request.json();

        // 1. Identify User (if logged in)
        // We can't rely on request cookies here easily unless we use supabase auth helpers
        // But the client can send user_id if we trust it, or better:
        // Use headers().get('cookie') with createServerComponentClient to get auth user server-side.
        // For simplicity V1: We'll accept anonymous for now, or minimal auth.
        // Better: receive 'userId' in body? No, insecure.
        // Let's reuse standard Supabase Auth if possible.

        // For now, we just save the subscription.
        const { error } = await supabase
            .from('notifications_subscriptions')
            .upsert({
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                // user_id: ... (TODO: Extract from session)
            }, { onConflict: 'endpoint' });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Subscription error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
