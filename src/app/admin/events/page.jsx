import Link from "next/link";
import AdminEventsClient from "./AdminEventsClient";
import { createAdminClient } from "@/lib/supabase/server";

function hasSupabaseConfig() {
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getEvents() {
    if (!hasSupabaseConfig()) {
        return [];
    }

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('events')
            .select('id,title,date,payload,created_at,updated_at')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error loading events from Supabase:', error);
            return [];
        }

        return (data || []).map((row) => ({
            ...(row.payload || {}),
            id: String(row.id),
            title: row.title,
            date: row.date,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    } catch (error) {
        console.error('Error reading events:', error);
        return [];
    }
}

export default async function AdminEventsPage() {
    const events = await getEvents();

    return (
        <div className="min-h-screen bg-black text-white px-4 py-10">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-start justify-between gap-4 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-mono text-white/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.9)]" />
                            Events Manager
                        </div>
                        <h1 className="mt-4 text-3xl font-bold tracking-tight">
                            Events
                            <span className="text-indigo-500">.</span>
                        </h1>
                        <p className="text-white/60 text-sm mt-2 max-w-lg">Create, edit, and delete events. Changes reflect instantly on the public site.</p>
                    </div>
                    <div>
                        <Link
                            href="/admin/events/new"
                            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)]"
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
