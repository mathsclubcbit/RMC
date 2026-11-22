import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendInterviewEmail } from '@/lib/email';
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

        const { applicationId, teamName, meetLink, meetTime } = await request.json();

        if (!applicationId || !teamName || !meetLink || !meetTime) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const supabase = createAdminClient();
        
        // Get applicant details
        const { data: applicant, error: fetchErr } = await supabase
            .from('recruitment_applications')
            .select('email, name')
            .eq('id', applicationId)
            .single();

        if (fetchErr || !applicant) {
            return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
        }

        // Send email
        const emailSent = await sendInterviewEmail({
            toEmail: applicant.email,
            name: applicant.name,
            teamName,
            meetLink,
            meetTime
        });

        if (!emailSent) {
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        // Update status
        const { error: updateErr } = await supabase
            .from('recruitment_applications')
            .update({ 
                interview_status: 'SCHEDULED',
                interview_link: meetLink,
                interview_time: meetTime
            })
            .eq('id', applicationId);

        if (updateErr) {
            console.error('Update interview_status error:', updateErr);
            return NextResponse.json({ error: 'Email sent but failed to update status in DB' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Schedule Interview Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
