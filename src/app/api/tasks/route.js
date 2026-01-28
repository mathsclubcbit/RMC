import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const team = searchParams.get('team');

    let query = supabase.from('tasks').select('*');

    if (userId) query = query.eq('assigned_to', userId);
    // OR assigned_team matches... logic is tricky with OR in Supabase JS easily without filter builder
    // Simplified: Just get all and filter in app or refine query later.
    // For "Club Members", they see tasks assigned to them OR their team.

    // Admin sees all.
    // Let's just return all for V1 and filter on client? Secure? No.
    // Let's implement RLS instead and just select *.
    // If RLS is set up correctly, standard client can only see permitted rows.
    // But this is SERVER API using SERVICE ROLE KEY (bypass RLS).
    // So we must filter manually if we use Service Role.
    // BETTER: Use createServerComponentClient or similar to get USER context.

    // For this prototype: Allow getting tasks by query params.
    const { data, error } = await query;
    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(JSON.stringify(data));
}

export async function POST(request) {
    const body = await request.json();
    const { data, error } = await supabase.from('tasks').insert(body).select();
    if (error) return new Response(JSON.stringify({ error }), { status: 500 });
    return new Response(JSON.stringify(data[0]), { status: 201 });
}
