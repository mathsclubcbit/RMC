import { redirect } from "next/navigation";
import CoordinatorScanClient from "./CoordinatorScanClient";
import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from "@/lib/supabase/server";

async function isCoordinatorAuthenticated() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.app_metadata?.role === 'coordinator' && !!user?.app_metadata?.event_id;
}

export const metadata = {
    title: "Coordinator - Scan QR",
};

// Prevent Vercel from caching this page's auth state
export const dynamic = 'force-dynamic';

export default async function CoordinatorScanPage() {
    noStore(); // Completely disable caching for auth
    if (!(await isCoordinatorAuthenticated())) {
        redirect("/coordinator/login");
    }

    return <CoordinatorScanClient />;
}
