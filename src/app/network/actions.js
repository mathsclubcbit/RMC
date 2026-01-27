"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Updates a team member's password.
 * Securely verifies that the requester is a Head of the team the member belongs to.
 */
export async function updateMemberPassword(teamId, memberId, newPassword) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    try {
        // 1. Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Unauthorized");

        // 2. Verify Requester is HEAD of the team
        const { data: requesterMembership, error: reqError } = await supabase
            .from("team_members")
            .select("role")
            .eq("team_id", teamId)
            .eq("user_id", user.id)
            .eq("role", "head")
            .single();

        if (reqError || !requesterMembership) {
            throw new Error("You do not have permission to manage this team.");
        }

        // 3. Verify Target is a MEMBER of the team (and exists)
        const { data: targetMembership, error: targetError } = await supabase
            .from("team_members")
            .select("role")
            .eq("team_id", teamId)
            .eq("user_id", memberId)
            .single();

        if (targetError || !targetMembership) {
            throw new Error("Target user is not in this team.");
        }

        if (targetMembership.role === "head" && memberId !== user.id) {
            throw new Error("You cannot change the password of another Head.");
        }

        // 4. Update Password using Admin Client
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            memberId,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        return { success: true };

    } catch (error) {
        console.error("Server Action Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Creates a new team member with a specific password.
 * Robustly handles cases where user exists (Auth) but profile is missing.
 */
export async function createTeamMember(teamId, email, password, fullName) {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    try {
        // 1. Auth & Permission Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Unauthorized");

        const { data: requesterMembership, error: reqError } = await supabase
            .from("team_members")
            .select("role")
            .eq("team_id", teamId)
            .eq("user_id", user.id)
            .eq("role", "head")
            .single();

        if (reqError || !requesterMembership) {
            throw new Error("You do not have permission to add members to this team.");
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanName = fullName?.trim();

        if (!cleanName) {
            throw new Error("Full name is required.");
        }

        let targetUserId;

        // 2. Try to Create User
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: password,
            email_confirm: true,
            user_metadata: { full_name: cleanName }
        });

        if (createError) {
            // Check if user already exists
            if (createError.message?.includes("already registered") || createError.status === 422) {
                // User exists -> Fetch their ID to ensure we can add them
                // We cannot search by email easily without listUsers (which requires permission), 
                // but we can try to find them in PROFILES.
                // If they are not in profiles, we are in a tough spot if we can't search Auth.
                // However, createClient() (service role) can list users.

                const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
                const existingUser = users?.find(u => u.email?.toLowerCase() === cleanEmail);

                if (existingUser) {
                    targetUserId = existingUser.id;
                    // If password was provided, we MIGHT want to update it? 
                    // No, "Add Member" shouldn't overwrite password of existing user unless explicit.
                    // But user asked "set the password...".
                    // If the user ALREADY exists, we assume we just add them. 
                    // Overwriting password here might be unexpected if they are an old user.
                    // Let's NOT update password for existing users.
                } else {
                    throw new Error("User exists but could not be retrieved. Contact admin.");
                }
            } else {
                throw createError;
            }
        } else {
            targetUserId = newUser.user.id;
        }

        // 3. Upsert Profile (Ensure it exists)
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id: targetUserId,
                email: cleanEmail,
                full_name: cleanName,
                role: "member",
                updated_at: new Date().toISOString()
            });

        if (profileError) {
            console.error("Profile creation warning:", profileError);
        }

        // 4. Add to Team Members
        const { error: insertError } = await supabaseAdmin
            .from("team_members")
            .insert({
                team_id: teamId,
                user_id: targetUserId,
                role: "member"
            });

        if (insertError) {
            if (insertError.code === '23505') {
                return { success: true, message: "User is already in the team." };
            }
            throw insertError;
        }

        return { success: true, message: "Member added successfully." };

    } catch (error) {
        console.error("Create Member Error:", error);
        return { success: false, error: error.message };
    }
}
