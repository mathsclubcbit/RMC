"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Copy, Save, Check, Key, RefreshCw } from "lucide-react";

export default function CoordinatorCredentialsManager() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [showPasswords, setShowPasswords] = useState({});
    const [copiedId, setCopiedId] = useState(null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/events");
            const data = await res.json();
            setEvents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch events:", error);
        } finally {
            setLoading(false);
        }
    };

    const togglePassword = (id) => {
        setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const copyCredentials = async (event) => {
        const password = event.payload?.password || "";
        if (!password) {
            alert("No password set for this event");
            return;
        }

        try {
            // Modern clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(password);
            } else {
                // Fallback for older browsers or non-secure contexts
                const textArea = document.createElement("textarea");
                textArea.value = password;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
            }
            setCopiedId(event.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
            // Show the text in an alert as last resort
            alert(`Copy this: ${password}`);
        }
    };

    const startEditing = (event) => {
        setEditingId(event.id);
        setNewPassword(event.payload?.password || "");
    };

    const cancelEditing = () => {
        setEditingId(null);
        setNewPassword("");
    };

    const generatePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let password = "";
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(password);
    };

    const savePassword = async (eventId) => {
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch(`/api/admin/events/${eventId}/password`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword }),
            });

            if (!res.ok) throw new Error("Failed to update password");

            // Update local state
            setEvents((prev) =>
                prev.map((e) =>
                    e.id === eventId
                        ? { ...e, payload: { ...e.payload, password: newPassword } }
                        : e
                )
            );

            setEditingId(null);
            setNewPassword("");
            setMessage({ type: "success", text: "Password updated successfully!" });
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 md:p-6">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-white/60 text-sm">Loading coordinator credentials...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 md:p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <div className="text-[11px] font-mono text-white/50 uppercase tracking-widest">Credentials</div>
                    <div className="mt-2 text-base md:text-lg font-semibold">Event Coordinator Access</div>
                    <div className="mt-1 text-sm text-white/60">Manage login credentials for event coordinators.</div>
                </div>
                <Key className="w-6 h-6 text-orange-400/70" />
            </div>

            {message && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${message.type === "success"
                    ? "bg-teal-500/10 border border-teal-500/20 text-teal-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[11px] font-mono text-white/50 uppercase tracking-widest border-b border-white/10">
                    <div className="col-span-6">Event</div>
                    <div className="col-span-4">Password</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Events List */}
                <div className="max-h-[320px] overflow-auto custom-scrollbar">
                    {events.length === 0 ? (
                        <div className="px-4 py-8 text-sm text-white/60 text-center">
                            No events found. Create events to manage coordinator access.
                        </div>
                    ) : (
                        events.map((event) => (
                            <div
                                key={event.id}
                                className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/5 items-center"
                            >
                                {/* Event Name */}
                                <div className="col-span-6">
                                    <div className="text-sm font-semibold text-white/90 truncate" title={event.title}>
                                        {event.title}
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="col-span-4">
                                    {editingId === event.id ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-teal-500/50"
                                                placeholder="New password"
                                            />
                                            <button
                                                onClick={generatePassword}
                                                className="p-1 text-white/40 hover:text-white transition"
                                                title="Generate random"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs text-white/80 font-mono">
                                                {showPasswords[event.id]
                                                    ? (event.payload?.password || "—")
                                                    : "••••••••"}
                                            </code>
                                            <button
                                                onClick={() => togglePassword(event.id)}
                                                className="p-1 text-white/40 hover:text-white transition"
                                            >
                                                {showPasswords[event.id] ? (
                                                    <EyeOff className="w-3.5 h-3.5" />
                                                ) : (
                                                    <Eye className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="col-span-2 flex items-center justify-end gap-1">
                                    {editingId === event.id ? (
                                        <>
                                            <button
                                                onClick={() => savePassword(event.id)}
                                                disabled={saving}
                                                className="p-1.5 bg-teal-500/20 border border-teal-500/30 rounded-lg text-teal-400 hover:bg-teal-500/30 transition disabled:opacity-50"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 transition"
                                            >
                                                ✕
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => startEditing(event)}
                                                className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 transition"
                                                title="Edit password"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => copyCredentials(event)}
                                                className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 transition"
                                                title="Copy credentials"
                                            >
                                                {copiedId === event.id ? (
                                                    <Check className="w-3.5 h-3.5 text-teal-400" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-4 text-xs text-white/40">
                💡 Share these credentials with event coordinators for ticket scanning access.
            </div>
        </div>
    );
}
