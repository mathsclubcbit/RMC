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
        const { title, body, target_role, url } = await request.json();

        // 1. Fetch Subscriptions based on target_role
        let query = supabase.from('notifications_subscriptions').select('*');

        if (target_role && target_role !== 'all') {
            // e.g. target_role = 'member'
            // We need to implement role checking logic.
            // For now, assume 'role' column in subscriptions is populated.
            query = query.eq('role', target_role);
        }

        const { data: subscriptions, error } = await query;
        if (error) throw error;

        // 2. Send Notifications
        const notificationPayload = JSON.stringify({
            title,
            body,
            url: url || '/',
            icon: '/rmc-logo.png'
        });

        const promises = subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            return webpush.sendNotification(pushSubscription, notificationPayload)
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Subscription expired/gone, remove from DB
                        return supabase.from('notifications_subscriptions').delete().eq('id', sub.id);
                    }
                    console.error('Push error:', err);
                });
        });

        await Promise.all(promises);

        // 3. Log Announcement to DB
        await supabase.from('announcements').insert({
            title,
            body,
            target_role: target_role || 'all'
        });

        return new Response(JSON.stringify({ success: true, count: subscriptions.length }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Send error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
