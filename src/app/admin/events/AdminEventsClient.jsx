"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function AdminEventsClient({ initialEvents }) {
    const [events, setEvents] = useState(Array.isArray(initialEvents) ? initialEvents : []);
    const sorted = useMemo(() => {
        return events
            .slice()
            .sort((a, b) => String(b?.date || "").localeCompare(String(a?.date || "")));
    }, [events]);

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs uppercase tracking-widest text-white/60 border-b border-white/10">
                <div className="col-span-3">Title</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
            </div>

            {sorted.length === 0 ? (
                <div className="px-4 py-10 text-white/60">No events found.</div>
            ) : (
                sorted.map((event) => (
                    <EventRow
                        key={event.id}
                        event={event}
                        onDeleted={() => setEvents((prev) => prev.filter((e) => e.id !== event.id))}
                    />
                ))
            )}
        </div>
    );
}

function EventRow({ event, onDeleted }) {
    return (
        <div className="grid grid-cols-12 gap-2 px-4 py-4 border-b border-white/10 items-center">
            <div className="col-span-3">
                <div className="font-semibold">{event.title}</div>
                <div className="text-xs text-white/50 font-mono">{event.id}</div>
            </div>
            <div className="col-span-2 text-white/80">{event.date || "—"}</div>
            <div className="col-span-3 text-white/70">{event.location || "—"}</div>
            <div className="col-span-2 text-white/70">{event.status || "—"}</div>
            <div className="col-span-2 flex justify-end gap-2">
                <Link
                    href={`/register/${event.id}`}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-xs"
                    target="_blank"
                >
                    View
                </Link>
                <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-xs"
                >
                    Edit
                </Link>
                <DeleteButton id={event.id} onDeleted={onDeleted} />
            </div>
        </div>
    );
}

function DeleteButton({ id, onDeleted }) {
    return (
        <button
            type="button"
            onClick={async () => {
                const ok = confirm(`Delete event ${id}?`);
                if (!ok) return;

                const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    alert(data?.error || "Failed to delete event");
                    return;
                }

                onDeleted?.();
            }}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-xs text-red-200"
        >
            Delete
        </button>
    );
}
