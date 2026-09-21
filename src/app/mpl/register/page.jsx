import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import MPLRegistrationClient from "./MPLRegistrationClient";

export const metadata = {
    title: "MPL 2026 Registration | RMC",
    description: "Register for the Mathematics Premier League 2026",
};

export default async function MPLRegistrationPage() {
    // Check session on the server
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        const userEmail = session.user.email;
        const admin = createAdminClient();
        
        // Fetch to see if user is in any MPL team
        const { data: playerRecord } = await admin
            .from('mpl_players')
            .select('team_id')
            .eq('email', userEmail)
            .single();

        if (playerRecord?.team_id) {
            // If they are already in a team, redirect straight to their dashboard
            redirect('/mpl/dashboard');
        }
    }

    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-mono">Loading Interface...</div>}>
            <MPLRegistrationClient />
        </Suspense>
    );
}
