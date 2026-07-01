import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendTaskEmail } from '@/lib/email';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('team_token')?.value;
        const payload = token ? await verifyToken(token) : null;

        if (!payload || payload.type !== 'team') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { applicationId, teamName } = await request.json();

        if (!applicationId || !teamName) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const supabase = createAdminClient();
        
        // Get applicant details
        const { data: applicant, error: fetchErr } = await supabase
            .from('recruitment_applications')
            .select('email, name, team, task_responses')
            .eq('id', applicationId)
            .single();

        if (fetchErr || !applicant) {
            return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
        }

        // Idempotency guard: don't send again if already sent or submitted
        const existingStatus = applicant.task_responses?.team_tracking?.[teamName]?.status;
        if (existingStatus === 'SENT' || existingStatus === 'SUBMITTED' || existingStatus === 'EVALUATED') {
            return NextResponse.json({ error: 'Task has already been sent to this applicant for this team.' }, { status: 409 });
        }

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
            return NextResponse.json({ error: 'Tasks can only be sent to applicants who selected this team as Priority 1 or 2.' }, { status: 400 });
        }

        // Fetch the team's task URLs
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

        // Randomly assign one of the available task URLs
        const assignedUrl = taskUrls[Math.floor(Math.random() * taskUrls.length)];

        // --- FIX #1: Update DB FIRST before sending email ---
        // If email fails after DB update, the team head can resend manually.
        // If we emailed first and DB failed, the applicant would be permanently locked out.
        const currentResponses = applicant.task_responses || {};
        const teamTracking = currentResponses.team_tracking || {};
        teamTracking[teamName] = { status: 'SENT', assignedUrl };
        
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
            .eq('id', applicationId);

        if (updateErr) {
            console.error('Update task_status error:', updateErr);
            return NextResponse.json({ error: 'Failed to update status in DB. No email sent.' }, { status: 500 });
        }

        // Send email after DB is successfully updated
        const emailSent = await sendTaskEmail({
            toEmail: applicant.email,
            name: applicant.name,
            applicationId,
            teamName,
            priority
        });

        if (!emailSent) {
            // DB is updated, so the applicant can still access the page.
            // Log this for manual follow-up but don't fail the request.
            console.error(`[send-task] Email failed for ${applicant.email} (${applicationId}). DB updated successfully.`);
            return NextResponse.json({ success: true, warning: 'Task assigned but email failed to send. Please contact the applicant manually.' });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Send Task Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
