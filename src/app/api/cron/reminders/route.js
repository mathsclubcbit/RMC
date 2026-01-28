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

// Optimization for Vercel
export const dynamic = 'force-dynamic'; // Ensure it's not cached
export const maxDuration = 60; // Allow longer runtime for batch sending

export async function GET(request) {
    // 1. Security Check (Vercel Cron)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
        return new Response('Unauthorized', { status: 401 });
    }

    // 2. Fetch upcoming tasks (e.g. within 24 hours)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'pending')
        .lt('deadline', tomorrow.toISOString())
        .gt('deadline', now.toISOString()); // Due within next 24h

    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    if (!tasks || tasks.length === 0) return new Response(JSON.stringify({ message: "No reminders needed" }));

    let sentCount = 0;

    // 2. For each task, find subscribers and send PUSH
    for (const task of tasks) {
        let query = supabase.from('notifications_subscriptions').select('*');

        if (task.assigned_to_user) {
            // Task assigned to specific user
            query = query.eq('user_id', task.assigned_to_user);
        } else if (task.assigned_to_team) {
            // Task assigned to team -> Fetch team members first
            const { data: teamMembers } = await supabase
                .from('team_members')
                .select('user_id')
                .eq('team_id', task.assigned_to_team);

            if (teamMembers && teamMembers.length > 0) {
                const userIds = teamMembers.map(tm => tm.user_id);
                query = query.in('user_id', userIds);
            } else {
                continue;
            }
        } else {
            // Unassigned task? Skip.
            continue;
        }

        const { data: subs } = await query;
        if (!subs || subs.length === 0) continue;

        const payload = JSON.stringify({
            title: "Task Reminder: " + task.title,
            body: `Due soon: ${new Date(task.deadline).toLocaleString()}. ${task.description || ''}`,
            url: "/network/tasks",
            icon: '/RMC logo-circular.png'
        });

        const promises = subs.map(sub => {
            return webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, payload).catch(e => {
                console.error("Push Error", e);
                if (e.statusCode === 410 || e.statusCode === 404) {
                    supabase.from('notifications_subscriptions').delete().eq('id', sub.id);
                }
            });
        });

        await Promise.all(promises);
        sentCount += subs.length;
    }

    return new Response(JSON.stringify({ success: true, sent: sentCount }));
}
