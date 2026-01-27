"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const defaultEvent = {
    id: "",
    title: "",
    date: "",
    time: "",
    location: "",
    category: "Competition",
    status: "Registration Open",
    description: "",
    year: "",
    registrationFee: "",
    password: "",
    img: "",
    posterDesktop: "",
    posterMobile: "",
    qrCode: "",
    teamSize: "",
    regStartDate: "",
    regEndDate: "",
    isOneDay: true,
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
};

function toNumberOrKeep(value) {
    if (value === "") return value;
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
}

export default function EventForm({ mode, initialEvent }) {
    const [event, setEvent] = useState({ ...defaultEvent, ...(initialEvent || {}) });
    const [imgFile, setImgFile] = useState(null);
    const [posterDesktopFile, setPosterDesktopFile] = useState(null);
    const [posterMobileFile, setPosterMobileFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const isEdit = mode === "edit";

    const payload = useMemo(() => {
        // Keep existing flexible schema, but normalize a few numeric fields if provided.
        const out = { ...event };
        out.teamSize = toNumberOrKeep(out.teamSize);
        out.participants = out.participants ?? 0;

        // If one-day event, keep date/time derived for compatibility.
        if (out.isOneDay) {
            if (out.startDate) out.date = out.startDate;
            if (out.startTime || out.endTime) out.time = `${out.startTime || ""}${out.startTime && out.endTime ? " - " : ""}${out.endTime || ""}`.trim();
        }

        // Trim empty strings so JSON stays cleaner.
        Object.keys(out).forEach((k) => {
            if (out[k] === "") delete out[k];
        });

        return out;
    }, [event]);

    async function onSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!event.title) return setError("Title is required");
        if (!(event.date || event.startDate)) return setError("Date is required");

        setSaving(true);
        try {
            const url = isEdit ? `/api/events/${encodeURIComponent(initialEvent.id)}` : "/api/events";
            const method = isEdit ? "PUT" : "POST";

            const form = new FormData();
            form.append("payload", JSON.stringify(payload));
            if (imgFile) form.append("imgFile", imgFile);
            if (posterDesktopFile) form.append("posterDesktopFile", posterDesktopFile);
            if (posterMobileFile) form.append("posterMobileFile", posterMobileFile);

            const res = await fetch(url, {
                method,
                body: form,
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data?.error || "Failed to save event");
            }

            setSuccess(isEdit ? "Event updated" : "Event created");

            // Clear staged uploads after successful save.
            setImgFile(null);
            setPosterDesktopFile(null);
            setPosterMobileFile(null);

            // If created, go to edit screen for further changes.
            if (!isEdit && data?.id) {
                window.location.href = `/admin/events/${encodeURIComponent(data.id)}/edit`;
            }
        } catch (err) {
            setError(err?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    function setField(name, value) {
        setEvent((prev) => ({ ...prev, [name]: value }));
    }

    return (
        <div className="min-h-screen bg-black text-white px-4 py-10">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-start justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">{isEdit ? "Edit Event" : "Create Event"}</h1>
                        <p className="text-white/60 text-sm mt-1">
                            {isEdit ? `Event ID: ${initialEvent?.id}` : "Add a new event (stored in the database)"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/events"
                            className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition"
                        >
                            Back
                        </Link>
                        {isEdit ? (
                            <Link
                                href={`/register/${initialEvent?.id}`}
                                className="px-4 py-2 rounded-xl bg-teal-400 text-black font-semibold hover:bg-teal-300 transition"
                                target="_blank"
                            >
                                View Registration
                            </Link>
                        ) : null}
                    </div>
                </div>

                <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
                    {error ? (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
                            {error}
                        </div>
                    ) : null}
                    {success ? (
                        <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-100 px-4 py-3 text-sm">
                            {success}
                        </div>
                    ) : null}

                    {!isEdit ? (
                        <Field label="Custom ID (optional)" hint="If empty, one will be generated" >
                            <input
                                value={event.id || ""}
                                onChange={(e) => setField("id", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                placeholder="e.g. math-heist-2026"
                            />
                        </Field>
                    ) : null}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Title" required>
                            <input
                                value={event.title || ""}
                                onChange={(e) => setField("title", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                            />
                        </Field>

                        <Field label="Category">
                            <input
                                value={event.category || ""}
                                onChange={(e) => setField("category", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                            />
                        </Field>

                        <Field label="Status">
                            <input
                                value={event.status || ""}
                                onChange={(e) => setField("status", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                placeholder="Registration Open"
                            />
                        </Field>

                        <Field label="Location">
                            <input
                                value={event.location || ""}
                                onChange={(e) => setField("location", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                            />
                        </Field>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <label className="flex items-center gap-3 text-sm text-white/80">
                            <input
                                type="checkbox"
                                checked={!!event.isOneDay}
                                onChange={(e) => setField("isOneDay", e.target.checked)}
                            />
                            One-day event
                        </label>
                        <div className="text-xs text-white/50">Date/time affects registration and listings</div>
                    </div>

                    {event.isOneDay ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field label="Date" required>
                                <input
                                    type="date"
                                    value={event.startDate || event.date || ""}
                                    onChange={(e) => {
                                        setField("startDate", e.target.value);
                                        setField("date", e.target.value);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                />
                            </Field>
                            <Field label="Start time">
                                <input
                                    type="time"
                                    value={event.startTime || ""}
                                    onChange={(e) => setField("startTime", e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                />
                            </Field>
                            <Field label="End time">
                                <input
                                    type="time"
                                    value={event.endTime || ""}
                                    onChange={(e) => setField("endTime", e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                />
                            </Field>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Start date" required>
                                <input
                                    type="date"
                                    value={event.startDate || ""}
                                    onChange={(e) => setField("startDate", e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                />
                            </Field>
                            <Field label="End date">
                                <input
                                    type="date"
                                    value={event.endDate || ""}
                                    onChange={(e) => setField("endDate", e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                />
                            </Field>
                            <Field label="Start time">
                                <input
                                    type="time"
                                    value={event.startTime || ""}
                                    onChange={(e) => setField("startTime", e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                />
                            </Field>
                            <Field label="End time">
                                <input
                                    type="time"
                                    value={event.endTime || ""}
                                    onChange={(e) => setField("endTime", e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                />
                            </Field>
                        </div>
                    )}

                    <Field label="Description">
                        <textarea
                            rows={5}
                            value={event.description || ""}
                            onChange={(e) => setField("description", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                        />
                    </Field>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Year">
                            <input
                                value={event.year || ""}
                                onChange={(e) => setField("year", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                placeholder="2025-26"
                            />
                        </Field>

                        <Field label="Registration fee">
                            <input
                                value={event.registrationFee || ""}
                                onChange={(e) => setField("registrationFee", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                placeholder="150"
                            />
                        </Field>

                        <Field label="Team size">
                            <input
                                value={event.teamSize ?? ""}
                                onChange={(e) => setField("teamSize", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                placeholder="e.g. 4"
                            />
                        </Field>

                        <Field label="Password">
                            <input
                                value={event.password || ""}
                                onChange={(e) => setField("password", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                placeholder="eventpassword2026"
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Card image path">
                            <input
                                value={event.img || ""}
                                onChange={(e) => setField("img", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                placeholder="/assets/events/my-event.jpg"
                            />
                        </Field>
                        <Field label="Upload card image" hint={imgFile ? imgFile.name : "Optional"}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImgFile(e.target.files?.[0] || null)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                            />
                        </Field>
                        <Field label="QR image path (optional)">
                            <input
                                value={event.qrCode || ""}
                                onChange={(e) => setField("qrCode", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                placeholder="/qr-placeholder.png"
                            />
                        </Field>
                        <Field label="Poster desktop path (optional)">
                            <input
                                value={event.posterDesktop || ""}
                                onChange={(e) => setField("posterDesktop", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                            />
                        </Field>
                        <Field label="Upload poster (desktop)" hint={posterDesktopFile ? posterDesktopFile.name : "Optional"}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPosterDesktopFile(e.target.files?.[0] || null)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                            />
                        </Field>
                        <Field label="Poster mobile path (optional)">
                            <input
                                value={event.posterMobile || ""}
                                onChange={(e) => setField("posterMobile", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                            />
                        </Field>
                        <Field label="Upload poster (mobile)" hint={posterMobileFile ? posterMobileFile.name : "Optional"}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPosterMobileFile(e.target.files?.[0] || null)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Registration start date">
                            <input
                                type="date"
                                value={event.regStartDate || ""}
                                onChange={(e) => setField("regStartDate", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                            />
                        </Field>
                        <Field label="Registration end date">
                            <input
                                type="date"
                                value={event.regEndDate || ""}
                                onChange={(e) => setField("regEndDate", e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                            />
                        </Field>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link
                            href="/admin/events"
                            className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition"
                        >
                            Cancel
                        </Link>
                        <button
                            disabled={saving}
                            className="px-5 py-2 rounded-xl bg-teal-400 text-black font-semibold hover:bg-teal-300 transition disabled:opacity-60"
                        >
                            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Event"}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-xs text-white/50">
                    Note: Events are stored in Supabase (database + storage), so CRUD works after deployment.
                </div>
            </div>
        </div>
    );
}

function Field({ label, hint, required, children }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <label className="text-sm text-white/80">
                    {label}{required ? <span className="text-red-300"> *</span> : null}
                </label>
                {hint ? <span className="text-xs text-white/40">{hint}</span> : null}
            </div>
            {children}
        </div>
    );
}
