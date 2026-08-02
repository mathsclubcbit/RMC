"use client";

import { useState, useEffect } from "react";
import { Trophy, Search, Medal, Loader2, Star, Flame, Crown, X, User } from "lucide-react";

export default function LeaderboardClient({ eventId }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedParticipant, setSelectedParticipant] = useState(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchLeaderboard();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [search, page]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
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
        if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.8)]" />;
        if (rank === 3) return <Medal className="w-5 h-5 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.8)]" />;
        return <span className="text-white/40 font-mono font-bold text-lg">{rank}</span>;
    };

    return (
        <div className="min-h-[100dvh] bg-black text-white relative pb-24">
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-20 right-20 w-[600px] h-[600px] bg-yellow-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 px-4 pt-24 pb-8 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-teal-400" />
                            Leaderboard
                        </h1>
                        <p className="text-white/50 mt-1">Global ranking for Placement Series participants.</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
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
                    <div className="text-center py-20 border border-white/5 bg-white/5 rounded-2xl">
                        <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No participants found</h3>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white/50 bg-white/5 rounded-xl border border-white/10">
                            <div className="col-span-1 text-center">Rank</div>
                            <div className="col-span-5">Participant</div>
                            <div className="col-span-2 text-center">Score</div>
                            <div className="col-span-2 text-center">Streak</div>
                            <div className="col-span-2 text-center">Badges</div>
                        </div>

                        {leaderboard.map((p) => (
                            <div 
                                key={p.participantId} 
                                onClick={() => setSelectedParticipant(p)}
                                className="grid grid-cols-12 gap-4 items-center px-6 py-4 bg-white/5 border border-white/10 rounded-xl hover:border-teal-500/50 hover:bg-white/10 transition-all cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-0.5"
                            >
                                <div className="col-span-1 flex justify-center items-center">
                                    {getRankIcon(p.rank)}
                                </div>
                                <div className="col-span-5">
                                    <h4 className="font-bold text-white">{p.name}</h4>
                                    <p className="text-xs text-white/50 font-mono mt-0.5">{p.rollNo}</p>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className="font-mono font-bold text-teal-300 bg-teal-500/10 px-3 py-1 rounded-lg">
                                        {p.totalScore}
                                    </span>
                                </div>
                                <div className="col-span-2 flex justify-center items-center gap-1.5">
                                    <Flame className={`w-4 h-4 ${p.streakCurrent > 2 ? 'text-orange-500' : 'text-white/30'}`} />
                                    <span className="font-mono font-bold">{p.streakCurrent}</span>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    <div className="flex -space-x-2">
                                        {p.badges.slice(0, 3).map((b, i) => (
                                            <div key={b.id} className="w-8 h-8 rounded-full bg-black border-2 border-white/10 flex items-center justify-center text-lg z-10 hover:z-20 relative group" title={b.badgeLabel}>
                                                {b.badgeIcon}
                                            </div>
                                        ))}
                                        {p.badges.length > 3 && (
                                            <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-white/10 flex items-center justify-center text-xs font-bold z-0">
                                                +{p.badges.length - 3}
                                            </div>
                                        )}
                                        {p.badges.length === 0 && (
                                            <span className="text-white/20 text-sm">-</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        <div className="flex justify-between items-center mt-6">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-white/50">Page {page} of {Math.ceil(total / 50)}</span>
                            <button 
                                disabled={page >= Math.ceil(total / 50)}
                                onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Participant Profile Modal */}
            {selectedParticipant && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />
                        
                        <div className="flex items-center justify-between p-6 border-b border-white/10 relative z-10">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <User className="w-5 h-5 text-teal-400" /> Participant Details
                            </h2>
                            <button onClick={() => setSelectedParticipant(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 custom-scrollbar">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-white/5 p-6 rounded-2xl border border-white/10">
                                <div className="w-20 h-20 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-3xl shadow-[0_0_20px_rgba(45,212,191,0.2)]">
                                    {getRankIcon(selectedParticipant.rank)}
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <h3 className="text-2xl font-bold text-white mb-1">{selectedParticipant.name}</h3>
                                    <p className="text-white/50 font-mono mb-4">{selectedParticipant.rollNo}</p>
                                    
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                        <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                                            <Trophy className="w-4 h-4 text-teal-400" />
                                            <div>
                                                <div className="text-[10px] uppercase text-white/50">Total Score</div>
                                                <div className="font-bold font-mono">{selectedParticipant.totalScore}</div>
                                            </div>
                                        </div>
                                        <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                                            <Flame className="w-4 h-4 text-orange-400" />
                                            <div>
                                                <div className="text-[10px] uppercase text-white/50">Current Streak</div>
                                                <div className="font-bold font-mono">{selectedParticipant.streakCurrent}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                <h4 className="font-bold mb-4 flex items-center gap-2">
                                    <Medal className="w-5 h-5 text-purple-400" /> Earned Badges ({selectedParticipant.badges.length})
                                </h4>
                                
                                {selectedParticipant.badges.length === 0 ? (
                                    <div className="text-center py-6 text-white/40 bg-black/30 rounded-xl border border-white/5">
                                        No badges earned yet.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {selectedParticipant.badges.map(b => (
                                            <div key={b.id} className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-3 rounded-xl flex flex-col items-center justify-center text-center group hover:border-teal-500/40 transition-colors">
                                                <span className="text-4xl mb-2 group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{b.badgeIcon}</span>
                                                <span className="text-xs font-bold text-white/90">{b.badgeLabel}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
