"use client";

import { useState, useEffect } from "react";
import { Trophy, Clock, Loader2, Crown, Medal, Share2, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const PODIUM_CONFIG = [
    { rank: 1, icon: Crown, color: "text-yellow-400", bg: "from-yellow-500/20 to-yellow-600/5", border: "border-yellow-500/40", glow: "shadow-[0_0_30px_rgba(250,204,21,0.15)]", label: "1st Place", height: "h-28", badgeType: "contest_gold" },
    { rank: 2, icon: Medal, color: "text-gray-300", bg: "from-gray-300/10 to-gray-300/5", border: "border-gray-300/30", glow: "shadow-[0_0_20px_rgba(209,213,219,0.1)]", label: "2nd Place", height: "h-20", badgeType: "contest_silver" },
    { rank: 3, icon: Medal, color: "text-amber-600", bg: "from-amber-600/10 to-amber-600/5", border: "border-amber-600/30", glow: "shadow-[0_0_20px_rgba(217,119,6,0.1)]", label: "3rd Place", height: "h-14", badgeType: "contest_bronze" },
];

function formatTime(seconds) {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

function PodiumCard({ winner, config, delay }) {
    const Icon = config.icon;
    const linkedinBadge = winner?.badges?.find(b => b.badge_type === config.badgeType);

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={`flex-1 min-w-0 flex flex-col items-center`}
        >
            {winner ? (
                <div className={`w-full bg-gradient-to-b ${config.bg} border ${config.border} ${config.glow} rounded-2xl p-4 text-center`}>
                    <Icon className={`w-8 h-8 ${config.color} mx-auto mb-2 drop-shadow-[0_0_10px_currentColor]`} />
                    <p className={`text-xs font-bold uppercase tracking-widest ${config.color} mb-1`}>{config.label}</p>
                    <h3 className="font-bold text-white text-[10px] md:text-sm truncate w-full px-1">{winner.name}</h3>
                    <p className="text-[9px] md:text-xs text-white/50 font-mono truncate w-full px-1">{winner.rollNo}</p>
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                        <div className="flex justify-between text-[10px] md:text-xs flex-col xl:flex-row xl:items-center">
                            <span className="text-white/50">Score</span>
                            <span className="font-mono font-bold text-teal-300">{winner.score}/{winner.maxPoints}</span>
                        </div>
                        <div className="flex justify-between text-[10px] md:text-xs flex-col xl:flex-row xl:items-center">
                            <span className="text-white/50">Time</span>
                            <span className="font-mono text-white/70">{formatTime(winner.timeTakenSeconds)}</span>
                        </div>
                    </div>
                    {linkedinBadge && (
                        <a
                            href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&summary=${encodeURIComponent(linkedinBadge.linkedin_text)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg bg-[#0077b5]/20 hover:bg-[#0077b5]/40 border border-[#0077b5]/40 text-[#0077b5] transition-colors"
                        >
                            <Share2 className="w-3 h-3" />
                            Share
                        </a>
                    )}
                </div>
            ) : (
                <div className={`w-full bg-white/3 border border-white/10 rounded-2xl p-4 text-center opacity-40`}>
                    <Icon className={`w-8 h-8 ${config.color} mx-auto mb-2`} />
                    <p className="text-xs text-white/30">{config.label}</p>
                    <p className="text-xs text-white/20 mt-2">No entry</p>
                </div>
            )}
            {/* Podium base */}
            <div className={`w-full mt-1 ${config.height} bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-b-xl flex items-end justify-center pb-2`}>
                <span className={`font-black text-3xl ${config.color} opacity-30`}>{config.rank}</span>
            </div>
        </motion.div>
    );
}

function ContestCard({ contest, index }) {
    const podiumOrder = [2, 1, 3]; // Display order: silver (2), gold (1), bronze (3)
    const byRank = {};
    (contest.podium || []).forEach(w => { byRank[w.rank] = w; });

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden"
        >
            {/* Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/50 via-teal-500/50 to-yellow-500/50" />
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {contest.weekNumber && (
                            <span className="text-xs font-bold px-3 py-1 bg-white/10 rounded-md uppercase tracking-wider">
                                Week {contest.weekNumber}
                            </span>
                        )}
                        <span className="text-xs font-bold px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-md uppercase tracking-wider">
                            🏆 Results Published
                        </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">{contest.contestTitle}</h2>
                </div>
                <div className="flex items-center gap-2 text-white/40 text-xs">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(contest.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
            </div>

            {/* Podium */}
            <div className="flex items-end gap-3">
                {podiumOrder.map(rank => {
                    const config = PODIUM_CONFIG.find(c => c.rank === rank);
                    const winner = byRank[rank];
                    return (
                        <PodiumCard
                            key={rank}
                            winner={winner}
                            config={config}
                            delay={index * 0.1 + (4 - rank) * 0.15}
                        />
                    );
                })}
            </div>
        </motion.div>
    );
}

export default function WinnersClient({ eventId }) {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/placement-series/contest-winners?eventId=${eventId}`)
            .then(r => r.json())
            .then(data => setContests(data.contests || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [eventId]);

    return (
        <div className="min-h-[100dvh] pt-24 pb-12 px-4 relative">
            <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-yellow-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 flex items-center justify-center gap-4">
                        <Trophy className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                        Hall of Fame
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto">
                        The champions who dominated each weekly contest. Their victories live on here forever.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                    </div>
                ) : contests.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                        <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-xl font-bold">No published results yet</h3>
                        <p className="text-white/50 mt-2">Contest results will appear here once the coordinator publishes them.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {contests.map((contest, index) => (
                            <ContestCard key={contest.contestId} contest={contest} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
