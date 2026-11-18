"use client";

import { useState, useEffect } from "react";
import { Users, Loader2, RefreshCw, Clock, CheckCircle2, AlertTriangle, Download } from "lucide-react";

function formatTime(seconds) {
    if (!seconds && seconds !== 0) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

export default function QuizSessionsClient({ eventId }) {
    const [sessions, setSessions] = useState([]);
    const [stats, setStats] = useState({ total: 0, submitted: 0, inProgress: 0, avgScore: 0, avgTime: 0, highestScore: 0 });
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/quiz/sessions?eventId=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
                setStats(data.stats || {});
            }
        } catch (err) {
            console.error("Failed to fetch sessions:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSessions(); }, []);

    // Auto-refresh every 15s
    useEffect(() => {
        const interval = setInterval(fetchSessions, 15000);
        return () => clearInterval(interval);
    }, []);

    const exportCSV = () => {
        const headers = ["Name", "Email", "Status", "Score", "Total Possible", "Time Taken", "Tab Switches", "Started At", "Submitted At"];
        const rows = sessions.map(s => [
            s.participant_name,
            s.participant_email,
            s.submitted_at ? "Submitted" : "In Progress",
            s.score,
            s.total_possible,
            s.time_taken_seconds ? formatTime(s.time_taken_seconds) : "",
            s.tab_switch_count,
            s.started_at ? new Date(s.started_at).toLocaleString() : "",
            s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "",
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `quiz-sessions-${eventId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-black text-white px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            <Users className="w-6 h-6 text-violet-400" />
                            Quiz Sessions
                        </h1>
                        <p className="text-sm text-white/50 mt-1">Live monitoring · Auto-refreshes every 15s</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button onClick={fetchSessions} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 text-sm hover:bg-violet-500/30 transition">
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                    {[
                        { label: "Total Started", value: stats.total, icon: Users, color: "text-white" },
                        { label: "Submitted", value: stats.submitted, icon: CheckCircle2, color: "text-emerald-400" },
                        { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-amber-400" },
                        { label: "Avg Score", value: stats.avgScore, icon: CheckCircle2, color: "text-violet-400" },
                        { label: "Highest", value: stats.highestScore, icon: CheckCircle2, color: "text-teal-400" },
                    ].map(s => (
                        <div key={s.label} className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Sessions Table */}
                {loading && sessions.length === 0 ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-20 text-white/30">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No one has started the quiz yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                    <th className="text-left px-4 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">#</th>
                                    <th className="text-left px-4 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Participant</th>
                                    <th className="text-left px-4 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Status</th>
                                    <th className="text-right px-4 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Score</th>
                                    <th className="text-right px-4 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Time</th>
                                    <th className="text-right px-4 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Tab Switches</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((s, idx) => (
                                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                                        <td className="px-4 py-3 text-white/30 font-mono">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white/90">{s.participant_name}</div>
                                            <div className="text-xs text-white/40">{s.participant_email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {s.submitted_at ? (
                                                <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Submitted</span>
                                            ) : (
                                                <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">In Progress</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {s.submitted_at ? (
                                                <span className="font-bold text-white">{s.score}<span className="text-white/30 font-normal">/{s.total_possible}</span></span>
                                            ) : (
                                                <span className="text-white/20">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-white/60">
                                            {s.submitted_at ? formatTime(s.time_taken_seconds) : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {s.tab_switch_count > 3 ? (
                                                <span className="text-red-400 flex items-center justify-end gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> {s.tab_switch_count}
                                                </span>
                                            ) : (
                                                <span className="text-white/40">{s.tab_switch_count}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
