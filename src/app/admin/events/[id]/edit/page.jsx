import EventForm from "../../EventForm";

async function getEvent(id) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/events/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
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
