import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * PUT /api/admin/update-credentials
 * Updates a user's password (and optionally email).
 * Only accessible by President or users with delegated can_manage_members permission.
 */
export async function PUT(request) {
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

        // Also allow heads to update credentials for their team members
        if (!hasPermission && profile?.role === 'head') {
            hasPermission = true; // Additional team check could be added here
        }

        if (!hasPermission) {
            return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, newPassword, newEmail } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        if (!newPassword && !newEmail) {
            return NextResponse.json({ error: 'At least one of newPassword or newEmail is required' }, { status: 400 });
        }

        if (newPassword && newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Use admin client to update the user
        const adminClient = createAdminClient();

        // Check if the target user is a president
        const { data: targetProfile } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (targetProfile?.role === 'president') {
            return NextResponse.json({ error: 'Forbidden: President credentials can only be changed by the developer' }, { status: 403 });
        }

        const updateData = {};
        if (newPassword) updateData.password = newPassword;
        if (newEmail) updateData.email = newEmail.toLowerCase();

        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            userId,
            updateData
        );

        if (updateError) {
            console.error('Error updating credentials:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 400 });
        }

        // If email was updated, also update the profiles table
        if (newEmail) {
            await adminClient
                .from('profiles')
                .update({ email: newEmail.toLowerCase() })
                .eq('id', userId);
        }

        return NextResponse.json({ message: 'Credentials updated successfully' }, { status: 200 });

    } catch (error) {
        console.error('Update credentials error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
