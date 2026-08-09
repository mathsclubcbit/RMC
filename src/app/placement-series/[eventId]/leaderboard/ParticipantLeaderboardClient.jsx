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
        <div className="min-h-[100dvh] pt-20 sm:pt-24 md:pt-28 pb-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-25 z-0">
                <div className="absolute top-10 sm:top-20 right-10 sm:right-20 w-[280px] sm:w-[450px] h-[280px] sm:h-[450px] bg-yellow-500/15 blur-[90px] sm:blur-[120px] rounded-full" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10 space-y-6 sm:space-y-8">
                <div className="text-center max-w-2xl mx-auto px-2">
                    <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black mb-3 sm:mb-4 flex items-center justify-center gap-3 sm:gap-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-emerald-400 to-yellow-400">
                        <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-teal-400 shrink-0" />
                        Leaderboard
                    </h1>
                    <p className="text-white/60 text-xs sm:text-sm md:text-base leading-relaxed">
                        Global ranking based on weekly contests, daily challenges, and podium placements.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 flex-wrap">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 border cursor-pointer min-h-[40px] active:scale-95 ${
                                    isActive
                                        ? 'bg-teal-500 text-black border-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.35)] scale-[1.02]'
                                        : 'bg-white/5 border-white/10 text-white/60 hover:border-teal-500/40 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-2 sm:p-3 max-w-lg mx-auto backdrop-blur-xl shadow-lg focus-within:border-teal-400/60 focus-within:ring-1 focus-within:ring-teal-400/30 transition-all">
                    <div className="relative flex items-center">
                        <Search className="absolute left-3.5 w-4 h-4 sm:w-5 sm:h-5 text-white/40 pointer-events-none" />
                        <input 
                            type="text" 
                            placeholder="Search by name or roll number..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full bg-transparent pl-10 pr-4 py-2 text-xs sm:text-sm outline-none text-white placeholder-white/40 min-h-[40px]"
                        />
                    </div>
                </div>

                {loading && leaderboard.length === 0 ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-teal-400" /></div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-16 sm:py-20 bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-6">
                        <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-lg sm:text-xl font-bold">No participants found</h3>
                    </div>
                ) : (
                    <div className="space-y-2.5 sm:space-y-3">
                        {/* Header row */}
                        <div className="flex gap-3 sm:gap-4 px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/50 bg-white/5 rounded-xl border border-white/10 hidden md:flex">
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
                                    className={`flex items-center gap-2.5 sm:gap-4 px-3.5 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border transition-all duration-300 ${
                                        isMe 
                                            ? 'bg-teal-500/10 border-teal-500/50 shadow-[0_0_20px_rgba(45,212,191,0.15)] ring-1 ring-teal-500/50 scale-[1.01] z-10 relative' 
                                            : p.rank === 1 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30 shadow-[0_0_15px_rgba(250,204,21,0.1)]'
                                            : p.rank === 2 ? 'bg-gradient-to-r from-gray-300/10 to-transparent border-gray-300/30'
                                            : p.rank === 3 ? 'bg-gradient-to-r from-amber-600/10 to-transparent border-amber-600/30'
                                            : 'bg-white/5 border-white/10 hover:border-teal-500/30 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="w-7 sm:w-12 shrink-0 flex justify-center items-center">
                                        {getRankIcon(p.rank)}
                                    </div>
                                    <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
                                        <div className="min-w-0">
                                            <h4 className={`font-bold flex items-center gap-1.5 truncate text-xs sm:text-base ${isMe ? 'text-teal-300' : 'text-white'}`}>
                                                <span className="truncate">{p.name}</span> {isMe && <span className="text-[10px] bg-teal-500/20 border border-teal-500/30 text-teal-300 px-1.5 py-0.5 rounded-full shrink-0">You</span>}
                                                {hasMedal && <Star className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                                            </h4>
                                            <p className="text-[10px] sm:text-xs text-white/50 font-mono mt-0.5 truncate">{p.rollNo}</p>
                                        </div>
                                    </div>

                                    {/* Score with breakdown tooltip */}
                                    <div className="w-16 sm:w-24 shrink-0 text-center flex flex-col items-center justify-center relative"
                                        onMouseEnter={() => setHoveredScore(p.participantId)}
                                        onMouseLeave={() => setHoveredScore(null)}
                                        onClick={() => setHoveredScore(hoveredScore === p.participantId ? null : p.participantId)}
                                    >
                                        <span className={`font-mono font-extrabold text-xs sm:text-base px-2.5 sm:px-3.5 py-1 rounded-lg cursor-pointer transition-all ${isMe ? 'bg-teal-500 text-black shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'bg-black/50 border border-white/10 text-teal-300'}`}>
                                            {scoreVal}
                                        </span>
                                        {/* Breakdown tooltip on hover — only on overall tab */}
                                        {activeTab === 'overall' && hoveredScore === p.participantId && (
                                            <div className="absolute bottom-full right-0 md:left-1/2 md:-translate-x-1/2 mb-2 w-44 sm:w-48 bg-[#090d16] border border-white/20 rounded-xl p-3 shadow-2xl z-50 pointer-events-none md:pointer-events-auto">
                                                <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-1.5 text-left md:text-center">Score Breakdown</p>
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

                                    <div className="w-16 sm:w-20 shrink-0 hidden md:flex justify-center items-center gap-1.5">
                                        <Flame className={`w-4 h-4 ${p.streakCurrent > 2 ? 'text-orange-500' : 'text-white/30'}`} />
                                        <span className="font-mono font-bold text-sm">{p.streakCurrent}</span>
                                    </div>
                                    <div className="w-28 sm:w-32 shrink-0 hidden md:flex justify-center">
                                        <div className="flex -space-x-2.5 hover:space-x-1 transition-all duration-300">
                                            {p.badges.slice(0, 3).map((b, i) => (
                                                <div 
                                                    key={`${b.id || 'badge'}-${i}`} 
                                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-white/20 to-white/5 border border-white/30 shadow-md flex items-center justify-center text-xs sm:text-base z-10 hover:z-50 relative group transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:border-teal-400 cursor-default backdrop-blur-sm"
                                                >
                                                    <span className="leading-none">{b.badgeIcon}</span>
                                                </div>
                                            ))}
                                            {p.badges.length > 3 && (
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-white/10 to-black/50 border border-white/20 flex items-center justify-center text-[10px] font-bold z-0 text-white/70 relative backdrop-blur-sm">
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
                                className="px-3.5 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-xl disabled:opacity-50 hover:bg-white/10 transition-colors text-xs sm:text-sm font-semibold cursor-pointer active:scale-95"
                            >
                                Previous
                            </button>
                            <span className="text-xs sm:text-sm text-white/50 font-medium">Page {page} of {Math.ceil(total / 50) || 1}</span>
                            <button 
                                disabled={page >= Math.ceil(total / 50)}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3.5 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-xl disabled:opacity-50 hover:bg-white/10 transition-colors text-xs sm:text-sm font-semibold cursor-pointer active:scale-95"
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
