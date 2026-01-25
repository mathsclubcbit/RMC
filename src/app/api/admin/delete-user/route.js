import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request) {
    try {
        const body = await request.json();
        const { targetUserId } = body;

        // 1. VERIFY AUTH TOKEN
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !requester) {
            return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
        }

        // 2. VERIFY PRESIDENT ROLE
        const { data: requesterProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', requester.id)
            .single();

        if (profileError || !requesterProfile || requesterProfile.role !== 'president') {
            return NextResponse.json({ error: 'Forbidden: Only the President can remove agents from the network.' }, { status: 403 });
        }

        // Prevent self-deletion
        if (targetUserId === requester.id) {
            return NextResponse.json({ error: 'Forbidden: You cannot remove yourself from the high command.' }, { status: 403 });
        }

        // 3. EXECUTE DELETE
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
            targetUserId
        );

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true, message: 'Agent removed successfully' });

    } catch (error) {
        console.error("Admin Delete User Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
