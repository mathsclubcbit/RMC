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

        const teamLabels = {
            "WebDev": "Web Dev",
            "Content": "Content",
            "PR": "PR",
            "Events": "Events",
            "Visual Media": "Visual Media"
        };
        const searchLabel = teamLabels[teamName] || teamName;

        // 2. Fetch all requested applicants (to ensure they belong to this team and are PENDING)
        const { data: applicants, error: fetchErr } = await supabase
            .from('recruitment_applications')
            .select('id, name, email, task_status, team, task_responses')
            .in('id', applicant_ids)
            .ilike('team', `%${searchLabel}%`);

        if (fetchErr) throw fetchErr;

        if (!applicants || applicants.length === 0) {
            return NextResponse.json({ error: 'No matching applicants found for this team.' }, { status: 404 });
        }

        const results = { successful: [], failed: [], errors: [] };

        // Process sequentially
        for (const applicant of applicants) {
            const currentResponses = applicant.task_responses || {};
            const teamTracking = currentResponses.team_tracking || {};
            const currentTeamStatus = teamTracking[teamName]?.status;

            if (currentTeamStatus === 'SENT' || currentTeamStatus === 'SUBMITTED' || currentTeamStatus === 'EVALUATED') {
                results.failed.push(applicant.id);
                results.errors.push(`Applicant ${applicant.id} task already processed for this team.`);
                continue;
            }

            try {
                // Randomly assign one of the available task URLs
                const assignedUrl = taskUrls[Math.floor(Math.random() * taskUrls.length)];

                // Calculate applicant's priority for this team
                const normalize = (s) => s.replace(/[^a-z0-9]/gi, '').toLowerCase();
                const matchTeam = normalize(teamName);
                let priority = 1;
                const teamStr = applicant.team || "";
                const parts = teamStr.split('|').map(s => s.trim());
                for (let i = 0; i < parts.length; i++) {
                    if (normalize(parts[i]).includes(matchTeam)) {
                        priority = i + 1;
                        break;
                    }
                }

                if (priority > 2) {
                    results.failed.push(applicant.id);
                    results.errors.push(`Applicant ${applicant.id} is priority ${priority}. Tasks can only be sent to priority 1 and 2.`);
                    continue;
                }

                // Calculate deadline
                const deadlineDays = teamTask.deadline_days || 3;
                const deadlineTimestamp = new Date(Date.now() + (deadlineDays * 24 * 60 * 60 * 1000)).toISOString();

                // Update DB FIRST before sending email
                teamTracking[teamName] = { status: 'SENT', assignedUrl, deadline: deadlineTimestamp };
                const updatedResponses = {
                    ...currentResponses,
                    team_tracking: teamTracking
                };

                const { error: updateErr } = await supabase
                    .from('recruitment_applications')
                    .update({ 
                        task_status: 'SENT',
                        task_file_url: assignedUrl,
                        task_responses: updatedResponses
                    })
                    .eq('id', applicant.id);

                if (updateErr) throw updateErr;

                // Send email with a small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
                const emailSent = await sendTaskEmail({
                    toEmail: applicant.email,
                    name: applicant.name,
                    applicationId: applicant.id,
                    teamName: teamName,
                    priority: priority,
                    deadline: deadlineTimestamp
                });

                if (!emailSent) {
                    console.error(`[batch-assign] Email failed for ${applicant.email}. DB updated successfully.`);
                    // Optionally push warning, but we consider it a success since DB is updated
                    results.errors.push(`Applicant ${applicant.email}: Email failed to send, but task assigned in DB.`);
                }

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
