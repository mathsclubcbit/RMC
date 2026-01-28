"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function AdminEventsClient({ initialEvents }) {
    const [events, setEvents] = useState(Array.isArray(initialEvents) ? initialEvents : []);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, eventId: null, eventTitle: null });
    const [isDeleting, setIsDeleting] = useState(false);

    const sorted = useMemo(() => {
        return events
            .slice()
            .sort((a, b) => String(b?.date || "").localeCompare(String(a?.date || "")));
    }, [events]);

    const handleDelete = async () => {
        if (!deleteModal.eventId) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/events/${encodeURIComponent(deleteModal.eventId)}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data?.error || "Failed to delete event");
            }

            setEvents((prev) => prev.filter((e) => e.id !== deleteModal.eventId));
            setDeleteModal({ isOpen: false, eventId: null, eventTitle: null });
        } catch (error) {
            alert(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                {/* Desktop Header */}
                <div className="hidden md:grid grid-cols-12 gap-2 px-6 py-3 text-xs uppercase tracking-widest text-white/60 border-b border-white/10 bg-white/[0.02]">
                    <div className="col-span-3">Title</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-3">Location</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {sorted.length === 0 ? (
                    <div className="px-6 py-12 text-center text-white/40 italic">No events found. Create one to get started.</div>
                ) : (
                    sorted.map((event) => (
                        <div key={event.id} className="group border-b border-white/10 last:border-0 hover:bg-white/[0.02] transition-colors">
                            {/* Desktop Row */}
                            <div className="hidden md:grid grid-cols-12 gap-2 px-6 py-4 items-center">
                                <div className="col-span-3">
                                    <div className="font-semibold text-white/90 truncate pr-4">{event.title}</div>
                                    <div className="text-[10px] text-white/40 font-mono truncate">{event.id}</div>
                                </div>
                                <div className="col-span-2 text-sm text-white/70">{event.date || "—"}</div>
                                <div className="col-span-3 text-sm text-white/60 truncate pr-4">{event.location || "—"}</div>
                                <div className="col-span-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${event.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white/50'}`}>
                                        {event.status || "Draft"}
                                    </span>
                                </div>
                                <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link
                                        href={`/register/${event.id}`}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs transition-colors"
                                        target="_blank"
                                    >
                                        View
                                    </Link>
                                    <Link
                                        href={`/admin/events/${event.id}/edit`}
                                        className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs transition-colors"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteModal({ isOpen: true, eventId: event.id, eventTitle: event.title })}
                                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Row (Card) */}
                            <div className="md:hidden p-4 flex flex-col gap-3 relative">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <div className="font-semibold text-white/90 text-lg leading-tight">{event.title}</div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
                                            <span>{event.date || "No Date"}</span>
                                            <span>•</span>
                                            <span className="truncate max-w-[150px]">{event.location || "No Location"}</span>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${event.status === 'published' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                            {event.status || "Draft"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <Link href={`/register/${event.id}`} className="flex-1 py-2 text-center rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/70 active:bg-white/10">
                                        View
                                    </Link>
                                    <Link href={`/admin/events/${event.id}/edit`} className="flex-1 py-2 text-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 active:bg-indigo-500/20">
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => setDeleteModal({ isOpen: true, eventId: event.id, eventTitle: event.title })}
                                        className="flex-1 py-2 text-center rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400 active:bg-red-500/20"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, eventId: null, eventTitle: null })}
                onConfirm={handleDelete}
                title="Delete Event"
                message={`Are you sure you want to delete "${deleteModal.eventTitle}"?\n\nThis action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                isDangerous={true}
                isLoading={isDeleting}
            />
        </>
    );
}

