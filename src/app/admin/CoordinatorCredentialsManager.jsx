"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Copy, Save, Check, Key, RefreshCw, ShieldCheck, ShieldAlert } from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function CoordinatorCredentialsManager() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [message, setMessage] = useState(null);
    const [modal, setModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info"
    });

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

    // Check if password is set (either hashed or plaintext)
    const hasPassword = (event) => {
        return Boolean(event.payload?.password);
    };

    // Check if password is properly hashed
    const isPasswordHashed = (event) => {
        return event.payload?.passwordHashed === true;
    };

    const copyNewPassword = async () => {
        if (!newPassword) return;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(newPassword);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = newPassword;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
            }
            setCopiedId("new");
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
        }
    };

    const startEditing = (event) => {
        setEditingId(event.id);
        setNewPassword(""); // Always start with empty - never show existing hash
        setShowNewPassword(true); // Show the new password by default
    };

    const cancelEditing = () => {
        setEditingId(null);
        setNewPassword("");
        setShowNewPassword(false);
    };

    const generatePassword = () => {
        // Generate a more secure, user-friendly password
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing chars like O/0, I/1/l
        let password = "";
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(password);
    };

    const savePassword = async (eventId) => {
        if (!newPassword.trim()) {
            setMessage({ type: "error", text: "Please enter a password" });
            return;
        }

        if (newPassword.trim().length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters" });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch(`/api/admin/events/${eventId}/password`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword.trim() }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update password");
            }

            // Update local state to reflect password is now set (without storing the actual password)
            setEvents((prev) =>
                prev.map((e) =>
                    e.id === eventId
                        ? { ...e, payload: { ...e.payload, password: "[HASHED]", passwordHashed: true } }
                        : e
                )
            );

            setEditingId(null);
            setNewPassword("");
            setShowNewPassword(false);
            setMessage({ type: "success", text: "Password updated! Make sure to share it with the coordinator securely." });
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
                    <div className="mt-1 text-sm text-white/60">Manage login passwords for event coordinators.</div>
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
                    <div className="col-span-5">Event</div>
                    <div className="col-span-4">Password Status</div>
                    <div className="col-span-3 text-right">Actions</div>
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
                                <div className="col-span-5">
                                    <div className="text-sm font-semibold text-white/90 truncate" title={event.title}>
                                        {event.title}
                                    </div>
                                </div>

                                {/* Password Status / Edit */}
                                <div className="col-span-4">
                                    {editingId === event.id ? (
                                        <div className="flex items-center gap-1">
                                            <div className="relative flex-1">
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/20 rounded-lg px-2 py-1.5 pr-16 text-xs text-white outline-none focus:border-teal-500/50 font-mono"
                                                    placeholder="New password"
                                                    autoFocus
                                                />
                                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                                    <button
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className="p-1 text-white/40 hover:text-white transition"
                                                        title={showNewPassword ? "Hide" : "Show"}
                                                    >
                                                        {showNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                    </button>
                                                    <button
                                                        onClick={generatePassword}
                                                        className="p-1 text-white/40 hover:text-teal-400 transition"
                                                        title="Generate random"
                                                    >
                                                        <RefreshCw className="w-3 h-3" />
                                                    </button>
                                                    {newPassword && (
                                                        <button
                                                            onClick={copyNewPassword}
                                                            className="p-1 text-white/40 hover:text-white transition"
                                                            title="Copy"
                                                        >
                                                            {copiedId === "new" ? (
                                                                <Check className="w-3 h-3 text-teal-400" />
                                                            ) : (
                                                                <Copy className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {hasPassword(event) ? (
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                                                    <span className="text-teal-400/90">Password set</span>
                                                    {isPasswordHashed(event) && (
                                                        <span className="text-[10px] text-white/30">(secured)</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                                    <span className="text-amber-400/90">No password</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="col-span-3 flex items-center justify-end gap-1">
                                    {editingId === event.id ? (
                                        <>
                                            <button
                                                onClick={() => savePassword(event.id)}
                                                disabled={saving || !newPassword.trim()}
                                                className="p-1.5 bg-teal-500/20 border border-teal-500/30 rounded-lg text-teal-400 hover:bg-teal-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Save"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 transition"
                                                title="Cancel"
                                            >
                                                ✕
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => startEditing(event)}
                                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 transition text-xs font-medium"
                                        >
                                            {hasPassword(event) ? "Change" : "Set Password"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-4 text-xs text-white/40 space-y-1">
                <p>💡 Coordinators select an event and enter the password at <code className="text-white/50">/coordinator/login</code></p>
                <p>🔒 Passwords are securely hashed. Copy the password BEFORE saving to share it.</p>
            </div>

            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                isToast={true}
                duration={5000}
            />
        </div>
    );
}

