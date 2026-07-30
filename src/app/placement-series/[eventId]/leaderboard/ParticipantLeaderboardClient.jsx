"use client";

import { useState, useEffect } from "react";
import { Trophy, Search, Medal, Loader2, Flame, Crown } from "lucide-react";

export default function ParticipantLeaderboardClient({ eventId }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [session, setSession] = useState(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [search, page]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch session just to highlight current user
            const sessRes = await fetch(`/api/placement-series/session`);
            if (sessRes.ok) {
                const sessData = await sessRes.json();
                setSession(sessData.participant);
            }

            const params = new URLSearchParams({ eventId, page, limit: 50 });
            if (search) params.append('search', search);
            
            const res = await fetch(`/api/placement-series/leaderboard?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data.leaderboard || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />;
        if (rank === 2) return <Medal className="w-6 h-6 text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.8)]" />;
        if (rank === 3) return <Medal className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.8)]" />;
        return <span className="text-white/40 font-mono font-bold text-lg">{rank}</span>;
    };

    return (
        <div className="min-h-[100dvh] pt-24 pb-12 px-4 relative">
            <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-yellow-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 flex items-center justify-center gap-4">
                        <Trophy className="w-10 h-10 text-teal-400" />
                        Leaderboard
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto">
                        Global ranking based on weekly contests and daily challenges.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 max-w-lg mx-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input 
                            type="text" 
                            placeholder="Search by name or roll number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent pl-10 pr-4 py-2 outline-none text-white placeholder-white/40"
                        />
                    </div>
                </div>

                {loading && leaderboard.length === 0 ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-400" /></div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                        <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-xl font-bold">No participants found</h3>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white/50 bg-white/5 rounded-xl border border-white/10 hidden md:grid">
                            <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                            <div className="col-span-5 md:col-span-5">Participant</div>
                            <div className="col-span-3 md:col-span-2 text-center">Score</div>
                            <div className="col-span-2 hidden md:block text-center">Streak</div>
                            <div className="col-span-2 hidden md:block text-center">Badges</div>
                        </div>

                        {leaderboard.map((p) => {
                            const isMe = session?.id === p.participantId;
                            return (
                                <div 
                                    key={p.participantId} 
                                    className={`grid grid-cols-12 gap-4 items-center px-4 md:px-6 py-4 rounded-xl border transition-colors ${
                                        isMe 
                                            ? 'bg-teal-500/10 border-teal-500/50' 
                                            : 'bg-white/5 border-white/10 hover:border-teal-500/30'
                                    }`}
                                >
                                    <div className="col-span-2 md:col-span-1 flex justify-center items-center">
                                        {getRankIcon(p.rank)}
                                    </div>
                                    <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                                        <div>
                                            <h4 className={`font-bold ${isMe ? 'text-teal-400' : 'text-white'}`}>
                                                {p.name} {isMe && "(You)"}
                                            </h4>
                                            <p className="text-xs text-white/50 font-mono mt-0.5">{p.rollNo}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-4 md:col-span-2 text-center flex flex-col items-center justify-center">
                                        <span className={`font-mono font-bold px-3 py-1 rounded-lg ${isMe ? 'bg-teal-500 text-black' : 'bg-teal-500/10 text-teal-300'}`}>
                                            {p.totalScore}
                                        </span>
                                    </div>
                                    <div className="col-span-2 hidden md:flex justify-center items-center gap-1.5">
                                        <Flame className={`w-4 h-4 ${p.streakCurrent > 2 ? 'text-orange-500' : 'text-white/30'}`} />
                                        <span className="font-mono font-bold">{p.streakCurrent}</span>
                                    </div>
                                    <div className="col-span-2 hidden md:flex justify-center">
                                        <div className="flex -space-x-2">
                                            {p.badges.slice(0, 3).map((b) => (
                                                <div key={b.id} className="w-8 h-8 rounded-full bg-black border-2 border-white/10 flex items-center justify-center text-lg z-10 hover:z-20 relative group" title={b.badgeLabel}>
                                                    {b.badgeIcon}
                                                </div>
                                            ))}
                                            {p.badges.length > 3 && (
                                                <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-white/10 flex items-center justify-center text-xs font-bold z-0">
                                                    +{p.badges.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl disabled:opacity-50 hover:bg-white/10 transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-white/50">Page {page} of {Math.ceil(total / 50)}</span>
                            <button 
                                disabled={page >= Math.ceil(total / 50)}
                                onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl disabled:opacity-50 hover:bg-white/10 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
