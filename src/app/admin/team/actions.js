"use server";

import { isAdminAuthenticated } from "../actions";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveTeamMemberAction(member) {
    if (!(await isAdminAuthenticated())) {
        return { error: "Unauthorized" };
    }

    const supabase = createAdminClient();
    const { id, ...data } = member;

    try {
        if (id) {
            // Update
            const { error } = await supabase
                .from('rmc_council')
                .update(data)
                .eq('id', id);

            if (error) throw error;
        } else {
            // Insert
            const { error } = await supabase
                .from('rmc_council')
                .insert(data);

            if (error) throw error;
        }

        revalidatePath('/admin/team');
        return { success: true };
    } catch (error) {
        console.error("Save Member Error:", error);
        return { error: error.message };
    }
}

export async function deleteTeamMemberAction(id) {
    if (!(await isAdminAuthenticated())) {
        return { error: "Unauthorized" };
    }

    const supabase = createAdminClient();

    try {
        const { error } = await supabase
            .from('rmc_council')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/team');
        return { success: true };
    } catch (error) {
        console.error("Delete Member Error:", error);
        return { error: error.message };
    }
}

export async function promoteMemberToTeamAction(memberId) {
    // 1. Auth check: Must be Admin OR authorized Network user
    const isAdmin = await isAdminAuthenticated();
    const supabase = createAdminClient();

    try {
        if (!isAdmin) {
            // Check for Supabase Auth + President role if not Admin
            const { createClient } = await import("@/lib/supabase/server");
            const supabaseClient = await createClient();
            const { data: { user } } = await supabaseClient.auth.getUser();

            if (!user) return { error: "Unauthorized" };

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'president') {
                return { error: "Permission denied. Only Presidents or Admins can promote to Team." };
            }
        }

        // 2. Fetch Member Details
        const { data: member, error: memberError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', memberId)
            .single();

        if (memberError || !member) throw new Error("Member not found");

        // 3. Map to RMC Council
        // Check if already exists
        const { data: existing } = await supabase
            .from('rmc_council')
            .select('id')
            .eq('email', member.email)
            .single();

        if (existing) {
            return { error: "Member is already in the Team list." };
        }

        const councilData = {
            name: member.full_name,
            email: member.email,
            position: member.role?.charAt(0).toUpperCase() + member.role?.slice(1) || "Member",
            category: "Member", // Default category
            image_url: null, // User will need to upload professional photo in Admin
            priority_order: 100 // Default low priority
        };

        const { error: insertError } = await supabase
            .from('rmc_council')
            .insert(councilData);

        if (insertError) throw insertError;

        revalidatePath('/admin/team');
        revalidatePath('/team');
        return { success: true };

    } catch (error) {
        console.error("Promote Error:", error);
        return { error: error.message };
    }
}
