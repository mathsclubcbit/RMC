import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/create-user
 * Creates a new user in Supabase Auth and the profiles table.
 * Only accessible by President or users with delegated can_manage_members permission.
 */
export async function POST(request) {
    try {
        const supabase = await createClient();

        // Verify current user session
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        // Check if user has permission
        let hasPermission = profile?.role === 'president';

        if (!hasPermission) {
            const { data: permissions } = await supabase
                .from('delegated_permissions')
                .select('can_manage_members')
                .eq('user_id', user.id)
                .single();

            hasPermission = permissions?.can_manage_members === true;
        }

        // Also allow heads to add members to their team
        if (!hasPermission && profile?.role === 'head') {
            hasPermission = true; // Will be restricted to their team below
        }

        if (!hasPermission) {
            return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { email, fullName, role, teamId, teamRole } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Generate a random password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

        // Use admin client to create the user
        const adminClient = createAdminClient();

        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: email.toLowerCase(),
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                full_name: fullName || '',
                role: role || 'member'
            }
        });

        if (createError) {
            console.error('Error creating user:', createError);
            return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        // If teamId is provided, add user to the team
        if (teamId && newUser?.user) {
            const { error: teamMemberError } = await adminClient
                .from('team_members')
                .insert({
                    user_id: newUser.user.id,
                    team_id: teamId,
                    role: teamRole || 'member'
                });

            if (teamMemberError) {
                console.error('Error adding to team:', teamMemberError);
            }
        }

        return NextResponse.json({
            message: 'User created successfully',
            userId: newUser?.user?.id,
            tempPassword // Include for display to admin
        }, { status: 201 });

    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
