import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/app/admin/actions';

export async function GET(req: NextRequest) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('recruitment_team_tasks')
            .select('*');

        if (error) throw error;
        
        return NextResponse.json({ tasks: data ?? [] });
    } catch (err: unknown) {
        const e = err as Error;
        console.error('[admin/recruitment/tasks GET] Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { team_name, task_1_url, task_2_url, task_3_url } = body;

        if (!team_name) {
            return NextResponse.json({ error: 'team_name is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('recruitment_team_tasks')
            .upsert({
                team_name,
                task_1_url: task_1_url || null,
                task_2_url: task_2_url || null,
                task_3_url: task_3_url || null,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'team_name' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, task: data });
    } catch (err: unknown) {
        const e = err as Error;
        console.error('[admin/recruitment/tasks POST] Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
