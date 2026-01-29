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
