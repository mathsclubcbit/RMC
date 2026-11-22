"use client";

import { Bell, Send, Users, Shield, Loader2, AlertTriangle, Calendar, Trash2, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function AdminAnnouncementsPage() {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [targetRole, setTargetRole] = useState("all");
    const [category, setCategory] = useState("Bell");
    const [url, setUrl] = useState("/");
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    async function fetchAnnouncements() {
        setLoadingAnnouncements(true);
        try {
            const res = await fetch("/api/announcements");
            const data = await res.json();
            if (Array.isArray(data)) {
                setAnnouncements(data);
            }
        } catch (err) {
            console.error("Failed to load announcements", err);
        } finally {
            setLoadingAnnouncements(false);
        }
    }

    async function handleSend(e) {
        e.preventDefault();
        setSending(true);
        setStatus(null);

        try {
            const res = await fetch("/api/notifications/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, body, target_role: targetRole, url, category }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send");
            setStatus({ success: true, message: `Sent to ${data.count || 0} devices and synced to Home Widget!` });
            setTitle("");
            setBody("");
            fetchAnnouncements();
        } catch (err) {
            setStatus({ success: false, message: err.message });
        } finally {
            setSending(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm("Are you sure you want to delete this announcement? This will remove it from the Home Page widget as well.")) return;

        try {
            const res = await fetch("/api/announcements/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete");

            setAnnouncements(prev => prev.filter(a => a.id !== id));
            setStatus({ success: true, message: "Announcement deleted successfully!" });
        } catch (err) {
            setStatus({ success: false, message: err.message });
        }
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-24 md:pt-32">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Bell className="w-8 h-8 text-teal-400" />
                        Announcements
                    </h1>
                    <p className="text-white/50 mt-2">Send push notifications to the RMC community and update the Home Page widget.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left: Creation Form */}
                    <div className="lg:col-span-3">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Send className="w-5 h-5 text-teal-400" />
                                Create New
                            </h2>
                            <form onSubmit={handleSend} className="space-y-6">
                                {/* Target Audience & Category */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-3">Target Audience</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: "all", label: "Everyone", icon: Users },
                                                { id: "member", label: "Members", icon: Shield },
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
                                                    <div className="text-sm font-semibold">{role.label}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-3">Widget Category</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: "Critical", icon: AlertTriangle },
                                                { id: "Bell", icon: Bell },
                                                { id: "Event", icon: Calendar },
                                                { id: "System", icon: Shield },
                                            ].map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setCategory(cat.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${category === cat.id
                                                        ? "bg-teal-500/20 border-teal-500/50 text-teal-300"
                                                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                                                        }`}
                                                >
                                                    <cat.icon className="w-4 h-4" />
                                                    <div className="text-sm font-semibold">{cat.id}</div>
                                                </button>
                                            ))}
                                        </div>
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
                                    {sending ? "Broadcasting & Syncing..." : "Send Announcement"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right: Management List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Bell className="w-5 h-5 text-teal-400" />
                                Recent
                            </h2>
                            <button
                                onClick={fetchAnnouncements}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingAnnouncements ? "animate-spin" : ""}`} />
                            </button>
                        </div>

                        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                            {loadingAnnouncements ? (
                                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                    <p>Loading announcements...</p>
                                </div>
                            ) : announcements.length === 0 ? (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white/30">
                                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                    <p>No announcements found.</p>
                                </div>
                            ) : (
                                announcements.map((announcement) => (
                                    <div
                                        key={announcement.id}
                                        className="bg-white/5 border border-white/10 rounded-2xl p-4 group hover:border-white/20 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${announcement.category === 'Critical' ? 'bg-red-500/20 text-red-300' :
                                                announcement.category === 'Event' ? 'bg-amber-500/20 text-amber-300' :
                                                    'bg-teal-500/20 text-teal-300'
                                                }`}>
                                                {announcement.category}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(announcement.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg transition-all text-red-400/50 hover:text-red-400"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-sm mb-1 line-clamp-1">{announcement.title}</h3>
                                        <p className="text-white/50 text-xs line-clamp-2 mb-3">{announcement.content}</p>
                                        <div className="flex items-center justify-between text-[10px] text-white/30">
                                            <span>{announcement.date}</span>
                                            <span>By {announcement.postedBy}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

