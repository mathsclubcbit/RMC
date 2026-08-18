"use client";

import { useState, useEffect } from "react";
import { Trophy, Loader2, Medal, Clock, RefreshCw } from "lucide-react";

function formatTime(seconds) {
    if (!seconds && seconds !== 0) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

const PODIUM_COLORS = [
    "from-amber-400/20 to-amber-600/5 border-amber-500/40 text-amber-400",
    "from-gray-300/20 to-gray-500/5 border-gray-400/40 text-gray-300",
    "from-orange-400/20 to-orange-600/5 border-orange-500/40 text-orange-400",
];

const PODIUM_ICONS = ["🥇", "🥈", "🥉"];

export default function QuizLeaderboardClient({ eventId }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [totalParticipants, setTotalParticipants] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/quiz/results?eventId=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data.leaderboard || []);
                setTotalParticipants(data.totalParticipants || 0);
            }
        } catch (err) {
            console.error("Failed to fetch leaderboard:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLeaderboard(); }, []);

    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <div className="min-h-screen bg-black text-white px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            <Trophy className="w-6 h-6 text-amber-400" />
                            Quiz Leaderboard
                        </h1>
                        <p className="text-sm text-white/50 mt-1">{totalParticipants} participant{totalParticipants !== 1 ? "s" : ""} ranked</p>
                    </div>
                    <button onClick={fetchLeaderboard} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                </div>

                {loading && leaderboard.length === 0 ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-amber-400" /></div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-20 text-white/30">
                        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No submissions yet.</p>
                    </div>
                ) : (
                    <>
                        {/* Podium - Top 3 */}
                        {top3.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {top3.map((entry, idx) => (
                                    <div key={entry.email} className={`p-5 rounded-2xl bg-gradient-to-b border ${PODIUM_COLORS[idx]} text-center relative overflow-hidden`}>
                                        <div className="text-4xl mb-2">{PODIUM_ICONS[idx]}</div>
                                        <div className="text-lg font-bold text-white">{entry.name}</div>
                                        <div className="text-xs text-white/40 mb-3">{entry.email}</div>
                                        <div className="text-3xl font-black">{entry.score}<span className="text-sm font-normal text-white/30">/{entry.totalPossible}</span></div>
                                        <div className="flex items-center justify-center gap-3 mt-3 text-xs text-white/50">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(entry.timeTakenSeconds)}</span>
                                            <span>{entry.accuracy}% accuracy</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Rest of leaderboard */}
                        {rest.length > 0 && (
                            <div className="overflow-x-auto rounded-xl border border-white/10">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-white/[0.02]">
                                            <th className="text-left px-4 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Rank</th>
                                            <th className="text-left px-4 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Name</th>
                                            <th className="text-right px-4 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Score</th>
                                            <th className="text-right px-4 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Time</th>
                                            <th className="text-right px-4 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">Accuracy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rest.map(entry => (
                                            <tr key={entry.email} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                                                <td className="px-4 py-3 text-white/30 font-mono">#{entry.rank}</td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-white/90">{entry.name}</div>
                                                    <div className="text-xs text-white/40">{entry.email}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold">{entry.score}<span className="text-white/30 font-normal">/{entry.totalPossible}</span></td>
                                                <td className="px-4 py-3 text-right text-white/60">{formatTime(entry.timeTakenSeconds)}</td>
                                                <td className="px-4 py-3 text-right text-white/60">{entry.accuracy}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
