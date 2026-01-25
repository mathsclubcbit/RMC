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

export async function GET(request) {
    // Basic security check (ideally use a secret header)
    // const authHeader = request.headers.get('x-cron-secret');
    // if (authHeader !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const today = new Date();
        const twoDaysFromNow = new Date(today);
        twoDaysFromNow.setDate(today.getDate() + 2);

        // Format for comparison (YYYY-MM-DD)
        const targetDate = twoDaysFromNow.toISOString().split('T')[0];

        // 1. Find Tasks due in 2 days (created via date selector -> YYYY-MM-DD)
        const { data: tasks } = await supabase
            .from('tasks')
            .select('*, assignee:profiles!tasks_assigned_to_fkey(full_name)')
            .eq('due_date', targetDate)
            .neq('status', 'done');

        if (!tasks || tasks.length === 0) {
            return NextResponse.json({ message: 'No tasks due in 2 days' });
        }

        // 2. Collate Targets
        // Groups: Assigned Users OR Teams
        // Doing simple per-task iteration for clarity
        let notificationCount = 0;

        for (const task of tasks) {
            let userIds = [];

            if (task.assigned_to) {
                userIds = [task.assigned_to];
            } else if (task.team_scope) {
                // Fetch team members
                const { data: teamMembers } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('team', task.team_scope);
                userIds = teamMembers.map(m => m.id);
            }

            if (userIds.length > 0) {
                // Fetch subscriptions
                const { data: subs } = await supabase
                    .from('push_subscriptions')
                    .select('*')
                    .in('user_id', userIds);

                if (subs && subs.length > 0) {
                    const payload = JSON.stringify({
                        title: '⚠️ Deadline Approaching',
                        body: `Task "${task.title}" is due in 2 days!`,
                        url: '/network/missions',
                        icon: '/RMC logo-circular.png'
                    });

                    const promises = subs.map(sub =>
                        webpush.sendNotification({
                            endpoint: sub.endpoint,
                            keys: { auth: sub.auth, p256dh: sub.p256dh }
                        }, payload).catch(() => { })
                    );

                    await Promise.all(promises);
                    notificationCount += promises.length;
                }
            }
        }

        return NextResponse.json({ success: true, notificationsSent: notificationCount });

    } catch (error) {
        console.error('Check Deadlines Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
