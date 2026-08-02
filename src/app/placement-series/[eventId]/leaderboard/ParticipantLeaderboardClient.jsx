"use client";

import { useState, useEffect } from "react";
import { Trophy, Search, Medal, Loader2, Flame, Crown, Swords, Star, BarChart3 } from "lucide-react";
import Link from "next/link";

const TABS = [
    { id: "overall", label: "Overall", icon: Trophy },
    { id: "contest", label: "Contest Champions", icon: Swords },
    { id: "daily", label: "Daily Stars", icon: Flame },
];

export default function ParticipantLeaderboardClient({ eventId }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState("overall");
    const [hoveredScore, setHoveredScore] = useState(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [search, page, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const sessRes = await fetch(`/api/placement-series/session`);
            if (sessRes.ok) {
                const sessData = await sessRes.json();
                setSession(sessData.participant);
            }

            const params = new URLSearchParams({ eventId, page, limit: 50, tab: activeTab });
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

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setPage(1);
        setLeaderboard([]);
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />;
        if (rank === 2) return <Medal className="w-6 h-6 text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.8)]" />;
        if (rank === 3) return <Medal className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.8)]" />;
        return <span className="text-white/40 font-mono font-bold text-lg">{rank}</span>;
    };

    const getScoreLabel = () => {
        if (activeTab === "daily") return "Questions";
        return "Points";
    };

    const getScoreValue = (p) => {
        if (activeTab === "daily") return p.dailyQuestionsAnswered;
        if (activeTab === "contest") return p.contestScore;
        return p.totalPoints;
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
                        Global ranking based on weekly contests, daily challenges, and podium placements.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 border ${
                                    isActive
                                        ? 'bg-teal-500 text-black border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.4)]'
                                        : 'bg-white/5 border-white/10 text-white/60 hover:border-teal-500/40 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 max-w-lg mx-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input 
                            type="text" 
                            placeholder="Search by name or roll number..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
                        {/* Header row */}
                        <div className="flex gap-4 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white/50 bg-white/5 rounded-xl border border-white/10 hidden md:flex">
                            <div className="w-12 text-center shrink-0">Rank</div>
                            <div className="flex-1">Participant</div>
                            <div className="w-24 text-center shrink-0">{getScoreLabel()}</div>
                            <div className="w-20 text-center shrink-0">Streak</div>
                            <div className="w-32 text-center shrink-0">Badges</div>
                        </div>

                        {leaderboard.map((p) => {
                            const isMe = session?.id === p.participantId;
                            const scoreVal = getScoreValue(p);
                            const hasMedal = p.badges?.some(b => ['contest_gold','contest_silver','contest_bronze'].includes(b.badge_type));

                            return (
                                <div 
                                    key={p.participantId} 
                                    className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 rounded-xl border transition-all duration-300 ${
                                        isMe 
                                            ? 'bg-teal-500/10 border-teal-500/50 shadow-[0_0_20px_rgba(45,212,191,0.15)] ring-1 ring-teal-500/50 scale-[1.02] z-10 relative' 
                                            : p.rank === 1 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30 shadow-[0_0_15px_rgba(250,204,21,0.1)]'
                                            : p.rank === 2 ? 'bg-gradient-to-r from-gray-300/10 to-transparent border-gray-300/30'
                                            : p.rank === 3 ? 'bg-gradient-to-r from-amber-600/10 to-transparent border-amber-600/30'
                                            : 'bg-white/5 border-white/10 hover:border-teal-500/30 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="w-8 md:w-12 shrink-0 flex justify-center items-center">
                                        {getRankIcon(p.rank)}
                                    </div>
                                    <div className="flex-1 flex items-center gap-3 min-w-0">
                                        <div className="min-w-0">
                                            <h4 className={`font-bold flex items-center gap-2 truncate ${isMe ? 'text-teal-400' : 'text-white'}`}>
                                                <span className="truncate">{p.name}</span> {isMe && <span className="text-xs bg-teal-500/20 border border-teal-500/30 text-teal-300 px-2 py-0.5 rounded-full shrink-0">You</span>}
                                                {hasMedal && <Star className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                                            </h4>
                                            <p className="text-xs text-white/50 font-mono mt-0.5 truncate">{p.rollNo}</p>
                                        </div>
                                    </div>

                                    {/* Score with breakdown tooltip */}
                                    <div className="w-16 md:w-24 shrink-0 text-center flex flex-col items-center justify-center relative"
                                        onMouseEnter={() => setHoveredScore(p.participantId)}
                                        onMouseLeave={() => setHoveredScore(null)}
                                        onClick={() => setHoveredScore(hoveredScore === p.participantId ? null : p.participantId)}
                                    >
                                        <span className={`font-mono font-extrabold text-sm md:text-lg px-2 md:px-3 py-1 rounded-lg cursor-pointer md:cursor-default ${isMe ? 'bg-teal-500 text-black shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'bg-black/50 border border-white/10 text-teal-300'}`}>
                                            {scoreVal}
                                        </span>
                                        {/* Breakdown tooltip on hover — only on overall tab */}
                                        {activeTab === 'overall' && hoveredScore === p.participantId && (
                                            <div className="absolute bottom-full right-0 md:left-1/2 md:-translate-x-1/2 mb-2 w-48 bg-[#0f1a2b] border border-white/20 rounded-xl p-3 shadow-2xl z-50 pointer-events-none md:pointer-events-auto">
                                                <p className="text-xs text-white/60 font-bold uppercase tracking-widest mb-2 text-left md:text-center">Score Breakdown</p>
                                                <div className="space-y-1 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-teal-400">Contest</span>
                                                        <span className="font-mono font-bold">{p.contestScore || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-orange-400">Daily</span>
                                                        <span className="font-mono font-bold">{Math.max(0, (p.totalPoints || 0) - (p.contestScore || 0))}</span>
                                                    </div>
                                                    <div className="border-t border-white/10 pt-1 mt-1 flex justify-between">
                                                        <span className="text-white font-bold">Total</span>
                                                        <span className="font-mono font-bold text-teal-300">{p.totalPoints || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-20 shrink-0 hidden md:flex justify-center items-center gap-1.5">
                                        <Flame className={`w-4 h-4 ${p.streakCurrent > 2 ? 'text-orange-500' : 'text-white/30'}`} />
                                        <span className="font-mono font-bold">{p.streakCurrent}</span>
                                    </div>
                                    <div className="w-32 shrink-0 hidden md:flex justify-center">
                                        <div className="flex -space-x-3 hover:space-x-1 transition-all duration-300">
                                            {p.badges.slice(0, 3).map((b, i) => (
                                                <div 
                                                    key={`${b.id || 'badge'}-${i}`} 
                                                    className="w-8 h-8 rounded-full bg-gradient-to-b from-white/20 to-white/5 border border-white/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center text-sm md:text-base z-10 hover:z-50 relative group transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:border-teal-400 hover:shadow-[0_0_20px_rgba(45,212,191,0.6),inset_0_1px_2px_rgba(255,255,255,0.8)] cursor-default backdrop-blur-sm"
                                                >
                                                    <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-none">{b.badgeIcon}</span>
                                                    {/* Custom Premium Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max px-3 py-1.5 bg-[#050505]/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 origin-bottom">
                                                        <span className="text-[10px] font-extrabold text-white uppercase tracking-wider whitespace-nowrap">{b.badgeLabel}</span>
                                                        {/* Tooltip Arrow */}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#050505]/95 border-b border-r border-white/20 rotate-45 -mt-1" />
                                                    </div>
                                                </div>
                                            ))}
                                            {p.badges.length > 3 && (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-b from-white/10 to-black/50 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center text-[10px] font-bold z-0 text-white/70 relative group transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:text-white hover:border-teal-400 hover:shadow-[0_0_20px_rgba(45,212,191,0.6)] cursor-default backdrop-blur-sm">
                                                    +{p.badges.length - 3}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max px-3 py-1.5 bg-[#050505]/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 origin-bottom">
                                                        <span className="text-[10px] font-extrabold text-white uppercase tracking-wider whitespace-nowrap">{p.badges.length - 3} more badges</span>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#050505]/95 border-b border-r border-white/20 rotate-45 -mt-1" />
                                                    </div>
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
