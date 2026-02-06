"use client";

import { useState } from "react";
import { Bell, Send, Users, Shield, Loader2 } from "lucide-react";

export default function AdminAnnouncementsPage() {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [targetRole, setTargetRole] = useState("all");
    const [url, setUrl] = useState("/");
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState(null);

    async function handleSend(e) {
        e.preventDefault();
        setSending(true);
        setStatus(null);

        try {
            const res = await fetch("/api/notifications/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, body, target_role: targetRole, url }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send");
            setStatus({ success: true, message: `Sent to ${data.count || 0} devices!` });
            setTitle("");
            setBody("");
        } catch (err) {
            setStatus({ success: false, message: err.message });
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-24 md:pt-32">
            <div className="max-w-2xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Bell className="w-8 h-8 text-teal-400" />
                        Announcements
                    </h1>
                    <p className="text-white/50 mt-2">Send push notifications to the RMC community.</p>
                </header>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                    <form onSubmit={handleSend} className="space-y-6">
                        {/* Target Audience */}
                        <div>
                            <label className="block text-sm font-medium text-white/70 mb-3">Target Audience</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: "all", label: "Everyone", icon: Users },
                                    { id: "member", label: "Club Members Only", icon: Shield },
                                ].map((role) => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setTargetRole(role.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${targetRole === role.id
                                            ? "bg-teal-500/20 border-teal-500/50 text-teal-300"
                                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                                            }`}
                                    >
                                        <role.icon className="w-5 h-5" />
                                        <div className="text-left">
                                            <div className="text-sm font-semibold">{role.label}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/40 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Event Reminder / Important Update"
                                    required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500/50 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/40 mb-1">Message Body</label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Write your announcement here..."
                                    required
                                    rows={4}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500/50 transition resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/40 mb-1">Link URL (Optional)</label>
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="/"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500/50 transition"
                                />
                            </div>
                        </div>

                        {/* Status Message */}
                        {status && (
                            <div className={`p-4 rounded-xl text-sm font-semibold ${status.success ? "bg-teal-500/20 text-teal-300" : "bg-red-500/20 text-red-300"}`}>
                                {status.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            {sending ? "Broadcasting..." : "Send Notification"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
