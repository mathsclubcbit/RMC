import { createAdminClient } from "@/lib/supabase/server";
import PlacementSeriesNav from "./PlacementSeriesNav";

export const dynamic = 'force-dynamic';

export default async function PlacementSeriesLayout({ children, params }) {
    const eventId = (await params).eventId;
    
    // Fetch event details to show title
    const admin = createAdminClient();
    const { data: event } = await admin
        .from("events")
        .select("title")
        .eq("id", eventId)
        .single();

    return (
        <div className="min-h-[100dvh] bg-black text-white font-sans selection:bg-teal-500/20 selection:text-teal-400">
            <PlacementSeriesNav eventId={eventId} eventTitle={event?.title || "Placement Series"} />
            <main>
                {children}
            </main>
        </div>
    );
}
