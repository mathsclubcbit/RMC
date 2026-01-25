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
        const { targetUserId, fullName, password } = body;

        // 1. VERIFY AUTH TOKEN (Don't trust the client)
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !requester) {
            return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
        }

        // 2. VERIFY PRESIDENT ROLE (Strict authorization)
        const { data: requesterProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', requester.id)
            .single();

        if (profileError || !requesterProfile || requesterProfile.role !== 'president') {
            return NextResponse.json({ error: 'Forbidden: Only the President can modify existing agent credentials.' }, { status: 403 });
        }

        // 3. EXECUTE UPDATES
        const updateData = {};
        if (password) updateData.password = password;
        if (fullName) updateData.user_metadata = { full_name: fullName };

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            targetUserId,
            updateData
        );

        if (updateError) throw updateError;

        // Sync Name change in profiles table if applicable
        if (fullName) {
            await supabaseAdmin
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', targetUserId);
        }

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (error) {
        console.error("Admin Update User Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
