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

        // Send email
        const emailSent = await sendTaskEmail({
            toEmail: applicant.email,
            name: applicant.name,
            applicationId,
            teamName,
            priority
        });

        if (!emailSent) {
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        // Update status and tracking
        const currentResponses = applicant.task_responses || {};
        const teamTracking = currentResponses.team_tracking || {};
        teamTracking[teamName] = { status: 'SENT' };
        
        const updatedResponses = {
            ...currentResponses,
            team_tracking: teamTracking
        };

        const { error: updateErr } = await supabase
            .from('recruitment_applications')
            .update({ 
                task_status: 'SENT',
                task_responses: updatedResponses 
            })
            .eq('id', applicationId);

        if (updateErr) {
            console.error('Update task_status error:', updateErr);
            return NextResponse.json({ error: 'Email sent but failed to update status in DB' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Send Task Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
