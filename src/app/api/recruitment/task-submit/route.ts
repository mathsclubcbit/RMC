import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Securely fetch only the data the applicant needs
        const { data: app, error } = await supabase
            .from('recruitment_applications')
            .select('name, team, task_status, task_file_url')
            .eq('id', id)
            .single();

        if (error || !app) {
            return NextResponse.json({ error: 'Application not found or invalid ID' }, { status: 404 });
        }

        return NextResponse.json({ application: app });
    } catch (err: unknown) {
        const e = err as Error;
        console.error('[recruitment/task-submit GET] Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { applicationId, why_join, why_team, drive_link } = body;

        if (!applicationId || !why_join || !why_team || !drive_link) {
            return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Check if application exists and is in the correct state
        const { data: app, error: fetchErr } = await supabase
            .from('recruitment_applications')
            .select('status, task_status')
            .eq('id', applicationId)
            .single();

        if (fetchErr || !app) {
            return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
        }

        if (app.task_status !== 'SENT') {
            return NextResponse.json({ error: 'Task already submitted or not assigned yet.' }, { status: 400 });
        }

        // Update with task responses
        const { error: updateErr } = await supabase
            .from('recruitment_applications')
            .update({
                task_responses: { why_join, why_team, drive_link },
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
