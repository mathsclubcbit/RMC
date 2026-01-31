import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import EventForm from "@/app/admin/events/EventForm";
import { jwtVerify } from "jose";
import { getSecret } from "@/lib/jwt";
import { unstable_noStore as noStore } from 'next/cache';

// Prevent Vercel from caching this page's auth state
export const dynamic = 'force-dynamic';

async function getCoordinatorEventId() {
    const cookieStore = await cookies();
    const token = cookieStore.get("coordinator_token")?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getSecret());
        if (payload?.type !== 'coordinator' || !payload?.eventId) {
            return null;
        }
        return payload.eventId;
    } catch {
        return null;
    }
}

export default async function CoordinatorEditPage() {
    noStore(); // Completely disable caching for auth
    const eventId = await getCoordinatorEventId();

    if (!eventId) {
        redirect("/coordinator/login");
    }

    const supabase = createAdminClient();

    // Fetch Event Details
    const { data: eventRow, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (error || !eventRow) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-4">
                <div className="text-center rounded-3xl border border-red-500/30 bg-red-500/10 p-8 max-w-md">
                    <div className="text-red-400 text-lg font-semibold mb-2">Error loading event</div>
                    <p className="text-white/60 text-sm">Could not fetch event details. Please try again.</p>
                </div>
            </div>
        );
    }

    // Prepare event data for the form
    const eventData = {
        ...eventRow.payload,
        id: String(eventRow.id),
        title: eventRow.title,
        date: eventRow.date,
        created_at: eventRow.created_at,
    };

    return (
        <div className="min-h-screen bg-black relative">
            {/* Tech background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_10%,rgba(45,212,191,0.20),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.18),transparent_55%),radial-gradient(circle_at_60%_90%,rgba(59,130,246,0.16),transparent_55%)]" />
                <div className="absolute inset-0 opacity-[0.25] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
            </div>

            {/* Form content - navigation is handled by layout */}
            <div className="relative z-10">
                <EventForm
                    mode="edit"
                    initialEvent={eventData}
                    backLink="/coordinator/dashboard"
                />
            </div>
        </div>
    );
}
