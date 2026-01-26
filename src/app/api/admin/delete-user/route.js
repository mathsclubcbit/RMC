import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * DELETE /api/admin/delete-user
 * Deletes a user from Supabase Auth (which cascades to profiles via trigger).
 * Only accessible by President or users with delegated can_manage_members permission.
 */
export async function DELETE(request) {
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

        if (!hasPermission) {
            return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Prevent self-deletion
        if (userId === user.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        // Use admin client to delete the user
        const adminClient = createAdminClient();

        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error('Error deleting user:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 400 });
        }

        return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });

    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
