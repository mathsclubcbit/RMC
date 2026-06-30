import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/app/admin/actions';
import { sendTaskEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { team_name, applicant_ids } = body;

        if (!team_name || !Array.isArray(applicant_ids) || applicant_ids.length === 0) {
            return NextResponse.json({ error: 'team_name and non-empty applicant_ids array are required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Fetch the 3 task URLs for this team
        const { data: teamTasks, error: taskErr } = await supabase
            .from('recruitment_team_tasks')
            .select('task_1_url, task_2_url, task_3_url')
            .eq('team_name', team_name)
            .single();

        if (taskErr || !teamTasks) {
            return NextResponse.json({ error: 'Team tasks not found. Please upload tasks first.' }, { status: 404 });
        }

        const availableTasks = [teamTasks.task_1_url, teamTasks.task_2_url, teamTasks.task_3_url].filter(Boolean);
        
        if (availableTasks.length === 0) {
             return NextResponse.json({ error: 'No task URLs found for this team.' }, { status: 400 });
        }

        // 2. Fetch applicant details
        const { data: applicants, error: fetchErr } = await supabase
            .from('recruitment_applications')
            .select('id, name, email')
            .in('id', applicant_ids)
            .eq('status', 'APPROVED')
            .eq('task_status', 'PENDING');

        if (fetchErr) throw fetchErr;

        if (!applicants || applicants.length === 0) {
            return NextResponse.json({ error: 'No eligible applicants found in the provided IDs.' }, { status: 404 });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        // 3. Process each applicant sequentially (to avoid rate limits on email sending and handle errors gracefully)
        for (const applicant of applicants) {
            try {
                // Pick a random task
                const randomTaskUrl = availableTasks[Math.floor(Math.random() * availableTasks.length)];

                // Try to send email
                const emailSent = await sendTaskEmail({
                    toEmail: applicant.email,
                    name: applicant.name,
                    applicationId: applicant.id,
                    teamName: team_name
                });

                if (emailSent) {
                    // Update DB ONLY if email succeeds
                    const { error: updateErr } = await supabase
                        .from('recruitment_applications')
                        .update({
                            task_status: 'SENT',
                            task_file_url: randomTaskUrl
                        })
                        .eq('id', applicant.id);

                    if (updateErr) {
                         results.failed++;
                         results.errors.push(`Failed to update DB for ${applicant.email} after email sent.`);
                         console.error(`[batch-assign] DB update failed for ${applicant.email}:`, updateErr);
                    } else {
                         results.success++;
                    }
                } else {
                    results.failed++;
                    results.errors.push(`Email failed for ${applicant.email}`);
                }
            } catch (err: any) {
                results.failed++;
                results.errors.push(`Exception for ${applicant.email}: ${err.message}`);
                console.error(`[batch-assign] Error processing ${applicant.email}:`, err);
            }
        }

        return NextResponse.json({
            message: 'Batch processing complete',
            results
        });

    } catch (err: unknown) {
        const e = err as Error;
        console.error('[admin/recruitment/assign-tasks/batch POST] Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
