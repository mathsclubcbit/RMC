import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('team_token')?.value;
        const payload = token ? await verifyToken(token) : null;

        if (!payload || payload.type !== 'team') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const teamName = payload.team;
        const supabase = createAdminClient();
        
        const { data, error } = await supabase
            .from('recruitment_team_tasks')
            .select('*')
            .eq('team_name', teamName)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
        
        return NextResponse.json({ task: data || null });
    } catch (error) {
        console.error('[team/tasks GET] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

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
        const { task_1_url, task_2_url, task_3_url, deadline_days } = body;

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('recruitment_team_tasks')
            .upsert({
                team_name: teamName,
                task_1_url: task_1_url || null,
                task_2_url: task_2_url || null,
                task_3_url: task_3_url || null,
                deadline_days: deadline_days !== undefined ? Number(deadline_days) : 3,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'team_name' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, task: data });
    } catch (error) {
        console.error('[team/tasks POST] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
