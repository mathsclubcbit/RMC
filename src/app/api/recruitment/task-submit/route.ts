import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const teamName = searchParams.get('team');

        if (!id) {
            return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
        }

        // teamName is required — without it we can't validate access or serve the right task URL
        if (!teamName || teamName === 'Unknown Team') {
            return NextResponse.json({ error: 'Team name is required. Please use the link sent to your email.' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Securely fetch only the data the applicant needs
        const { data: app, error } = await supabase
            .from('recruitment_applications')
            .select('name, team, task_status, task_file_url, task_responses')
            .eq('id', id)
            .single();

        if (error || !app) {
            return NextResponse.json({ error: 'Application not found or invalid ID' }, { status: 404 });
        }

        // Strict Validation: Ensure the requested team task was actually assigned to this applicant
        if (teamName && teamName !== 'Unknown Team') {
            const teamTracking = app.task_responses?.team_tracking || {};
            const teamStatus = teamTracking[teamName]?.status;
            
            if (!teamStatus || !['SENT', 'SUBMITTED', 'EVALUATED'].includes(teamStatus)) {
                return NextResponse.json({ error: 'Task not assigned for this team or invalid team name.' }, { status: 403 });
            }
        }

        let teamTaskUrl = null;
        if (teamName) {
            const { data: teamTask } = await supabase
                .from('recruitment_team_tasks')
                .select('*')
                .eq('team_name', teamName)
                .single();
            
            if (teamTask) {
                teamTaskUrl = teamTask.task_1_url || teamTask.task_2_url || teamTask.task_3_url;
            }
        }

        return NextResponse.json({ application: app, teamTaskUrl });
    } catch (err: unknown) {
        const e = err as Error;
        console.error('[recruitment/task-submit GET] Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { applicationId, why_join, why_team, why_select_you, other_clubs, previous_work, dynamic_answers, drive_link, teamName } = body;

        if (!applicationId || !why_join || !why_team || !why_select_you || !other_clubs || !previous_work || !drive_link || !teamName) {
            return NextResponse.json({ error: 'All mandatory fields are required.' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Check if application exists and is in the correct state
        const { data: app, error: fetchErr } = await supabase
            .from('recruitment_applications')
            .select('status, task_status, task_responses')
            .eq('id', applicationId)
            .single();

        if (fetchErr || !app) {
            return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
        }

        // Block rejected applicants from submitting
        if (app.status === 'REJECTED') {
            return NextResponse.json({ error: 'Your application has been closed. You are no longer eligible to submit tasks.' }, { status: 403 });
        }

        const currentResponses = app.task_responses || {};
        const teamTracking = currentResponses.team_tracking || {};
        
        if (teamTracking[teamName]?.status !== 'SENT') {
            return NextResponse.json({ error: 'Task for this team not assigned or already submitted.' }, { status: 400 });
        }

        teamTracking[teamName] = {
            ...teamTracking[teamName],
            status: 'SUBMITTED',
            why_join,
            why_team,
            why_select_you,
            other_clubs,
            previous_work,
            dynamic_answers,
            drive_link
        };

        const updatedResponses = {
            ...currentResponses,
            team_tracking: teamTracking
        };

        // Update with task responses
        const { error: updateErr } = await supabase
            .from('recruitment_applications')
            .update({
                task_responses: updatedResponses,
                task_status: 'SUBMITTED',
                updated_at: new Date().toISOString()
            })
            .eq('id', applicationId);

        if (updateErr) throw updateErr;

        return NextResponse.json({ success: true });

    } catch (err: unknown) {
        const e = err as Error;
        console.error('[recruitment/task-submit POST] Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
