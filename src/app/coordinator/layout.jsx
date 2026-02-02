import { createClient, createAdminClient } from "@/lib/supabase/server";
import CoordinatorNav from "./CoordinatorNav";
import CoordinatorLayoutClient from "./CoordinatorLayoutClient";

// Prevent Next.js from caching this layout's auth state
export const dynamic = 'force-dynamic';

async function getEventInfo() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user?.app_metadata?.role !== 'coordinator' || !user?.app_metadata?.event_id) {
        return null;
    }

    // Fetch event title
    const admin = createAdminClient();
    const { data: event } = await admin
        .from("events")
        .select("title")
        .eq("id", user.app_metadata.event_id)
        .single();

    return {
        eventId: user.app_metadata.event_id,
        eventTitle: event?.title || null
    };
}

export default async function CoordinatorLayout({ children }) {
    const eventInfo = await getEventInfo();

    return (
        <CoordinatorLayoutClient
            eventInfo={eventInfo}
            nav={eventInfo ? <CoordinatorNav eventTitle={eventInfo.eventTitle} /> : null}
        >
            {children}
        </CoordinatorLayoutClient>
    );
}
