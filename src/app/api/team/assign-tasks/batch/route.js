import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { sendTaskEmail } from '@/lib/email';

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('team_token')?.value;
        const payload = token ? await verifyToken(token) : null;

        if (!payload || payload.type !== 'team') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const teamName = payload.team;
        const body = await request.json();
        const { applicant_ids } = body;

        if (!Array.isArray(applicant_ids) || applicant_ids.length === 0) {
            return NextResponse.json({ error: 'applicant_ids array is required and must not be empty' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Fetch the team's task URLs
        const { data: teamTask, error: taskErr } = await supabase
            .from('recruitment_team_tasks')
            .select('*')
            .eq('team_name', teamName)
            .single();

        if (taskErr || !teamTask) {
            return NextResponse.json({ error: 'No task URLs configured for this team' }, { status: 400 });
        }

        const taskUrls = [teamTask.task_1_url, teamTask.task_2_url, teamTask.task_3_url].filter(Boolean);
        if (taskUrls.length === 0) {
            return NextResponse.json({ error: 'No task URLs configured for this team' }, { status: 400 });
        }

        // 2. Fetch all requested applicants (to ensure they belong to this team and are PENDING)
        const { data: applicants, error: fetchErr } = await supabase
            .from('recruitment_applications')
            .select('id, name, email, task_status')
            .in('id', applicant_ids)
            .ilike('team', `%${teamName}%`);

        if (fetchErr) throw fetchErr;

        if (!applicants || applicants.length === 0) {
            return NextResponse.json({ error: 'No matching applicants found for this team.' }, { status: 404 });
        }

        const results = { successful: [], failed: [], errors: [] };

        // Process sequentially
        for (const applicant of applicants) {
            if (applicant.task_status !== 'PENDING' && applicant.task_status !== null) {
                results.failed.push(applicant.id);
                results.errors.push(`Applicant ${applicant.id} task_status is ${applicant.task_status}`);
                continue;
            }

            try {
                // Randomly assign one of the available task URLs
                const assignedUrl = taskUrls[Math.floor(Math.random() * taskUrls.length)];

                // Update DB with assigned URL
                const { error: assignErr } = await supabase
                    .from('recruitment_applications')
                    .update({ task_file_url: assignedUrl })
                    .eq('id', applicant.id);

                if (assignErr) throw assignErr;

                // Send email
                const emailSent = await sendTaskEmail({
                    toEmail: applicant.email,
                    name: applicant.name,
                    applicationId: applicant.id,
                    teamName: teamName
                });

                if (!emailSent) {
                    throw new Error("Email sending failed");
                }

                // If email successful, mark as SENT
                const { error: updateErr } = await supabase
                    .from('recruitment_applications')
                    .update({ task_status: 'SENT' })
                    .eq('id', applicant.id);

                if (updateErr) throw updateErr;

                results.successful.push(applicant.id);

            } catch (err) {
                console.error(`Failed processing applicant ${applicant.id}:`, err);
                results.failed.push(applicant.id);
                results.errors.push(`Applicant ${applicant.email}: ${err.message || "Unknown error"}`);
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error('[team/assign-tasks/batch POST] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
