import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import EventForm from "@/app/admin/events/EventForm";

export default async function CoordinatorEditPage() {
    const cookieStore = await cookies();
    const eventId = cookieStore.get("coordinator_session")?.value;

    if (!eventId) redirect("/coordinator/login");

    const supabase = createAdminClient();

    // Fetch Event Details (payload includes password, descriptions etc)
    const { data: eventRow, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (error || !eventRow) return <div>Error loading event</div>;

    const eventData = {
        ...eventRow.payload,
        id: String(eventRow.id),
        title: eventRow.title,
        date: eventRow.date,
        created_at: eventRow.created_at,
    };

    return (
        <div className="min-h-screen bg-black relative">
            {/* Custom Header to replace Admin Layout */}
            <div className="absolute top-6 right-6 z-50">
                {/* Just a spacer, the form has its own layout */}
            </div>

            {/* Reuse Admin Form. 
                We might need to adjust styles or context, but since EventForm 
                is self-contained with its own API calls (which check session), 
                we need to ensure the /api/events/[id] endpoint allows coordinator session too.
            */}

            <EventForm
                mode="edit"
                initialEvent={eventData}
                backLink="/coordinator/dashboard"
            />

            {/* Note: The /api/events routes currently require Admin Cookie. 
                We need to patch them or providing a special coordinator endpoint?
                
                 ACTUALLY: The easiest way is to let the API Route check for EITHER admin_session OR coordinator_session.
                 I will need to update /src/app/api/events/[id]/route.js (and POST route) to allow this.
                 
                 Let's assume for this specific task I should also ensure the API works for them.
            */}
        </div>
    );
}
