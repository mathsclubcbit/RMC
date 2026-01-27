import Link from "next/link";
import AdminEventsClient from "./AdminEventsClient";

async function getEvents() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/events`, { cache: "no-store" });
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

export default async function AdminEventsPage() {
    const events = await getEvents();

    return (
        <div className="min-h-screen bg-black text-white px-4 py-10">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Events</h1>
                        <p className="text-white/60 text-sm mt-1">Create, edit, and delete events (admin only).</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin"
                            className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/admin/scan"
                            className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition"
                        >
                            Back to Scanner
                        </Link>
                        <Link
                            href="/admin/events/new"
                            className="px-4 py-2 rounded-xl bg-teal-400 text-black font-semibold hover:bg-teal-300 transition"
                        >
                            + New Event
                        </Link>
                    </div>
                </div>

                <AdminEventsClient initialEvents={events} />
            </div>
        </div>
    );
}
