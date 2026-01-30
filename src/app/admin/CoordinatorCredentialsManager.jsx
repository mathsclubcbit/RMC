"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Copy, Save, Check, Key, RefreshCw, ShieldCheck, ShieldAlert, X } from "lucide-react";
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

    const hasPassword = (event) => Boolean(event.payload?.password);
    const isPasswordHashed = (event) => event.payload?.passwordHashed === true;

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
        setNewPassword("");
        setShowNewPassword(true);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setNewPassword("");
        setShowNewPassword(false);
    };

    const generatePassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
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
            setMessage({ type: "success", text: "Password updated successfully!" });
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="rounded-2xl md:rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 md:p-6">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-white/60 text-sm">Loading...</span>
                </div>
            </div>
        );
    }

    // Render event card for mobile
    const renderMobileCard = (event) => (
        <div key={event.id} className="p-4 border-b border-white/5 last:border-b-0">
            {/* Event Title Row */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-white/90 leading-tight">{event.title}</h3>
                {hasPassword(event) ? (
                    <div className="flex items-center gap-1 shrink-0">
                        <ShieldCheck className="w-4 h-4 text-teal-400" />
                        <span className="text-[11px] text-teal-400/80">Set</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 shrink-0">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span className="text-[11px] text-amber-400/80">None</span>
                    </div>
                )}
            </div>

            {/* Edit Mode */}
            {editingId === event.id ? (
                <div className="space-y-3">
                    <div className="relative">
                        <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2.5 pr-24 text-sm text-white outline-none focus:border-teal-500/50 font-mono"
                            placeholder="Enter new password"
                            autoFocus
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="p-1.5 text-white/40 hover:text-white active:scale-95 transition"
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={generatePassword}
                                className="p-1.5 text-white/40 hover:text-teal-400 active:scale-95 transition"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            {newPassword && (
                                <button
                                    onClick={copyNewPassword}
                                    className="p-1.5 text-white/40 hover:text-white active:scale-95 transition"
                                >
                                    {copiedId === "new" ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => savePassword(event.id)}
                            disabled={saving || !newPassword.trim()}
                            className="flex-1 py-2.5 bg-teal-500/20 border border-teal-500/30 rounded-xl text-teal-400 text-sm font-medium hover:bg-teal-500/30 active:scale-[0.98] transition disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Password"}
                        </button>
                        <button
                            onClick={cancelEditing}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 active:scale-[0.98] transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => startEditing(event)}
                    className="w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm font-medium hover:bg-white/10 active:scale-[0.98] transition"
                >
                    {hasPassword(event) ? "Change Password" : "Set Password"}
                </button>
            )}
        </div>
    );

    // Render table row for desktop
    const renderDesktopRow = (event) => (
        <div key={event.id} className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-white/5 items-center">
            <div className="col-span-5">
                <div className="text-sm font-semibold text-white/90 truncate" title={event.title}>
                    {event.title}
                </div>
            </div>

            <div className="col-span-4">
                {editingId === event.id ? (
                    <div className="relative">
                        <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-2 py-1.5 pr-20 text-xs text-white outline-none focus:border-teal-500/50 font-mono"
                            placeholder="New password"
                            autoFocus
                        />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                            <button onClick={() => setShowNewPassword(!showNewPassword)} className="p-1 text-white/40 hover:text-white transition">
                                {showNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button onClick={generatePassword} className="p-1 text-white/40 hover:text-teal-400 transition">
                                <RefreshCw className="w-3 h-3" />
                            </button>
                            {newPassword && (
                                <button onClick={copyNewPassword} className="p-1 text-white/40 hover:text-white transition">
                                    {copiedId === "new" ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        {hasPassword(event) ? (
                            <div className="flex items-center gap-1.5 text-xs">
                                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                                <span className="text-teal-400/90">Password set</span>
                                {isPasswordHashed(event) && <span className="text-[10px] text-white/30">(secured)</span>}
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

            <div className="col-span-3 flex items-center justify-end gap-1">
                {editingId === event.id ? (
                    <>
                        <button
                            onClick={() => savePassword(event.id)}
                            disabled={saving || !newPassword.trim()}
                            className="p-1.5 bg-teal-500/20 border border-teal-500/30 rounded-lg text-teal-400 hover:bg-teal-500/30 transition disabled:opacity-50"
                        >
                            <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={cancelEditing} className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 transition">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => startEditing(event)}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 transition text-xs font-medium"
                    >
                        {hasPassword(event) ? "Change" : "Set"}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="rounded-2xl md:rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-4 md:p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                    <div className="text-[10px] md:text-[11px] font-mono text-white/50 uppercase tracking-widest">Credentials</div>
                    <div className="mt-1.5 text-base md:text-lg font-semibold">Coordinator Access</div>
                    <div className="mt-0.5 text-xs md:text-sm text-white/60 hidden sm:block">Manage passwords for event coordinators.</div>
                </div>
                <Key className="w-5 h-5 md:w-6 md:h-6 text-orange-400/70 shrink-0" />
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-4 px-3 py-2.5 rounded-xl text-xs md:text-sm ${message.type === "success"
                        ? "bg-teal-500/10 border border-teal-500/20 text-teal-400"
                        : "bg-red-500/10 border border-red-500/20 text-red-400"
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Content */}
            <div className="rounded-xl md:rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                {/* Desktop Header - hidden on mobile */}
                <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 text-[11px] font-mono text-white/50 uppercase tracking-widest border-b border-white/10">
                    <div className="col-span-5">Event</div>
                    <div className="col-span-4">Status</div>
                    <div className="col-span-3 text-right">Actions</div>
                </div>

                {/* List */}
                <div className="max-h-[400px] md:max-h-[320px] overflow-auto">
                    {events.length === 0 ? (
                        <div className="px-4 py-8 text-sm text-white/60 text-center">
                            No events found.
                        </div>
                    ) : (
                        <>
                            {/* Mobile Cards */}
                            <div className="md:hidden">
                                {events.map(renderMobileCard)}
                            </div>
                            {/* Desktop Rows */}
                            <div className="hidden md:block">
                                {events.map(renderDesktopRow)}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Footer Tips */}
            <div className="mt-3 md:mt-4 text-[11px] md:text-xs text-white/40 space-y-0.5">
                <p>💡 Login at <code className="text-white/50">/coordinator/login</code></p>
                <p className="hidden sm:block">🔒 Copy password BEFORE saving to share it.</p>
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

