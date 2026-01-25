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
        const { targetUserId, fullName, password, role } = body;

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

        if (profileError || !requesterProfile || !['president', 'faculty'].includes(requesterProfile.role)) {
            return NextResponse.json({ error: 'Forbidden: Insufficient clearance level.' }, { status: 403 });
        }

        // Only Faculty can change roles
        if (role && requesterProfile.role !== 'faculty') {
            return NextResponse.json({ error: 'Forbidden: Only Faculty can modify agent roles.' }, { status: 403 });
        }

        // 3. EXECUTE UPDATES
        const updateData = {};
        if (password) updateData.password = password;
        if (fullName || role) {
            updateData.user_metadata = {
                ...(fullName && { full_name: fullName }),
                ...(role && { role: role })
            };
        }

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            targetUserId,
            updateData
        );

        if (updateError) throw updateError;

        // Sync Profile Table
        const profileUpdate = {};
        if (fullName) profileUpdate.full_name = fullName;
        if (role) {
            // If promoting to president, demote current president
            if (role === 'president') {
                await supabaseAdmin
                    .from('profiles')
                    .update({ role: 'member', team: 'event' })
                    .eq('role', 'president');
            }
            profileUpdate.role = role;
        }

        if (Object.keys(profileUpdate).length > 0) {
            await supabaseAdmin
                .from('profiles')
                .update(profileUpdate)
                .eq('id', targetUserId);
        }

        return NextResponse.json({ success: true, user: updatedUser });

    } catch (error) {
        console.error("Admin Update User Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
