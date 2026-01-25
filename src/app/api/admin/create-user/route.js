import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize a SERVER-SIDE ONLY admin client
// This has full access to the DB, so we must be very careful using it
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
        const { email, password, fullName, role, team } = body;

        // 1. VERIFY AUTH TOKEN (Don't trust the body)
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !requester) {
            return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
        }

        // 2. VERIFY PERMISSIONS
        const { data: requesterProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', requester.id)
            .single();

        if (profileError || !requesterProfile) {
            return NextResponse.json({ error: 'Unauthorized: Could not verify identity' }, { status: 401 });
        }

        // Only President or Vice President can recruit
        if (requesterProfile.role !== 'president' && requesterProfile.role !== 'vice_president') {
            return NextResponse.json({ error: 'Forbidden: Insufficient clearance level.' }, { status: 403 });
        }

        // 3. CREATE THE USER
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: role,
                team: team
            }
        });

        if (createError) throw createError;

        return NextResponse.json({ success: true, user: newUser });

    } catch (error) {
        console.error("Admin Create User Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
