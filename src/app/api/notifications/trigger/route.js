import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@rmc-cbit.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export async function POST(request) {
    try {
        const { type, team, title, url, assigned_to } = await request.json();

        // 1. Identify Target Users
        let query = supabase.from('profiles').select('id, team, role');

        if (assigned_to) {
            // Specific User
            query = query.eq('id', assigned_to);
        } else if (team) {
            // Team Broadcast
            query = query.eq('team', team);
        } else {
            // Everyone (Broad) - Careful with this
            return NextResponse.json({ error: 'Target unspecified' }, { status: 400 });
        }

        const { data: targets } = await query;
        if (!targets || targets.length === 0) return NextResponse.json({ message: 'No targets found' });

        const userIds = targets.map(t => t.id);

        // 2. Get Subscriptions for these users
        const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .in('user_id', userIds);

        if (!subscriptions || subscriptions.length === 0) return NextResponse.json({ message: 'No subscriptions found' });

        // 3. Send Notifications
        const payload = JSON.stringify({
            title: title || 'New Task Assignment',
            body: `New mission assigned to ${team ? team.toUpperCase() + ' team' : 'you'}.`,
            url: url || '/network/missions',
            icon: '/RMC logo-circular.png'
        });

        const promises = subscriptions.map(sub => {
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: { auth: sub.auth, p256dh: sub.p256dh }
            };
            return webpush.sendNotification(pushConfig, payload).catch(err => {
                if (err.statusCode === 410) {
                    // Cleanup dead subscription
                    supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
                }
            });
        });

        await Promise.all(promises);

        return NextResponse.json({ success: true, count: promises.length });

    } catch (error) {
        console.error('Push Trigger Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
