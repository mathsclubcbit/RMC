import EventForm from "../../EventForm";
import { createAdminClient } from "@/lib/supabase/server";

function hasSupabaseConfig() {
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getEvent(id) {
    if (!hasSupabaseConfig()) {
        return null;
    }

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('events')
            .select('id,title,date,payload,created_at,updated_at')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error('Error loading event from Supabase:', error);
            return null;
        }

        return {
            ...(data.payload || {}),
            id: String(data.id),
            title: data.title,
            date: data.date,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    } catch (error) {
        console.error('Error reading event:', error);
        return null;
    }
}

export default async function EditEventPage({ params }) {
    const { id } = await params;
    const event = await getEvent(id);

    if (!event) {
        return (
            <div className="min-h-screen bg-black text-white px-4 py-10">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl font-bold">Event not found</h1>
                    <p className="text-white/60 mt-2">No event exists with id: {id}</p>
                </div>
            </div>
        );
    }

    return <EventForm mode="edit" initialEvent={event} />;
}
