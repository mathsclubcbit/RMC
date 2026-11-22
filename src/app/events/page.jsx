import { getCachedEvents } from "@/lib/supabase/server";
import EventsClient from "./EventsClient";

export const revalidate = 3600; // ISR: Revalidate every hour

export default async function EventsPage() {
    // Fetch cached events on the server
    const events = await getCachedEvents();

    return <EventsClient initialEvents={events} />;
}
