"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import NetworkSidebar from "@/components/network/Sidebar";
import { createClient } from "@/lib/supabase/client";
import {
    Users,
    ListTodo,
    Calendar,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    RefreshCw
} from "lucide-react";

export default function DashboardPage() {
    const { profile, isPresident, isCoreCouncil } = useAuth();
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalTeams: 0,
        pendingTasks: 0,
        upcomingEvents: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const supabase = useMemo(() => createClient(), []);

    const fetchStats = useCallback(async () => {
        if (!profile?.id) return;
        setLoading(true);
        setError(false);

        try {
            // Fetch team count
            const teamPromise = supabase
                .from("teams")
                .select("*", { count: "exact", head: true });

            // Fetch member count
            const memberPromise = supabase
                .from("profiles")
                .select("*", { count: "exact", head: true });

            // Promise.race to handle timeout elegantly without throwing unhandled rejection
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => resolve({ timeout: true }), 15000); // 15s timeout
            });

            const result = await Promise.race([
                Promise.all([teamPromise, memberPromise]),
                timeoutPromise
            ]);

            if (result.timeout) {
                console.warn("Stats fetch timed out");
                setError(true);
            } else {
                const [teamResult, memberResult] = result;

                if (teamResult.error || memberResult.error) {
                    console.warn("Stats fetch error:", teamResult.error || memberResult.error);
                    setError(true);
                } else {
                    setStats({
                        totalMembers: memberResult.count || 0,
                        totalTeams: teamResult.count || 0,
                        pendingTasks: 0,
                        upcomingEvents: 0
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [profile?.id, supabase]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const statCards = [
        {
            title: "Total Members",
            value: stats.totalMembers,
            icon: Users,
            color: "teal",
            visible: isPresident() || isCoreCouncil()
        },
        {
            title: "Active Teams",
            value: stats.totalTeams,
            icon: TrendingUp,
            color: "lime",
            visible: true
        },
        {
            title: "Pending Tasks",
            value: stats.pendingTasks,
            icon: ListTodo,
            color: "orange",
            visible: true
        },
        {
            title: "Upcoming Events",
            value: stats.upcomingEvents,
            icon: Calendar,
            color: "purple",
            visible: true
        }
    ];

    return (
        <div className="flex h-full">
            <NetworkSidebar />

            <main className="flex-1 p-4 lg:p-10 pt-24 lg:pt-14 overflow-y-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8 md:mb-12"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-[1px] w-8 bg-teal/40" />
                        <span className="text-teal font-mono text-xs uppercase tracking-[0.3em]">Operational Overview</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-[family-name:var(--font-cinzel)] font-bold text-white mb-4 tracking-tighter">
                        {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-teal/40">{profile?.full_name?.split(' ')[0] || 'Member'}</span>
                    </h1>
                    <p className="text-white/40 font-[family-name:var(--font-cormorant)] text-lg md:text-xl italic max-w-2xl">
                        Welcome to the Ramanujan Math Club Dashboard. Precision in logic, excellence in execution.
                    </p>
                </motion.div>

                {/* Error State with Retry */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3 text-red-400">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm">Failed to load data. Check your connection.</span>
                        </div>
                        <button
                            onClick={fetchStats}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </motion.div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-16">
                    {statCards.filter(card => card.visible).map((card, index) => {
                        const Icon = card.icon;
                        const accentColor = {
                            teal: 'teal',
                            lime: 'lime',
                            orange: 'orange-400',
                            purple: 'purple-500'
                        }[card.color];

                        return (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group"
                            >
                                {/* Hover Glow */}
                                <div className={`absolute -inset-0.5 bg-${accentColor}/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl`} />

                                <div className="relative h-full bg-white/[0.02] backdrop-blur-[40px] border border-white/5 rounded-2xl md:rounded-[2rem] p-6 md:p-8 flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-500">
                                    <div className={`w-12 h-12 rounded-2xl bg-${accentColor}/10 border border-${accentColor}/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(0,0,0,0.3)]`}>
                                        <Icon className={`w-6 h-6 text-${accentColor}`} />
                                    </div>
                                    <div>
                                        {loading ? (
                                            <div className="w-16 h-8 bg-white/5 rounded-lg animate-pulse mb-2" />
                                        ) : (
                                            <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tighter">
                                                {card.value}
                                            </div>
                                        )}
                                        <h3 className="text-white/30 text-xs md:text-sm font-mono uppercase tracking-[0.2em]">{card.title}</h3>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-1 bg-white/[0.02] backdrop-blur-[30px] border border-white/5 rounded-3xl p-8"
                    >
                        <h2 className="text-xl font-[family-name:var(--font-cinzel)] font-bold text-white mb-8 tracking-tight">Standard Vectors</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <QuickAction
                                href="/network/tasks"
                                icon={ListTodo}
                                label="View Active Tasks"
                                color="teal"
                            />
                            <QuickAction
                                href="/network/calendar"
                                icon={Calendar}
                                label="Operational Calendar"
                                color="lime"
                            />
                            <QuickAction
                                href="/network/resources"
                                icon={CheckCircle}
                                label="Resource Repository"
                                color="orange"
                            />
                            {isPresident() && (
                                <QuickAction
                                    href="/network/settings"
                                    icon={AlertCircle}
                                    label="Network Parameters"
                                    color="purple"
                                />
                            )}
                        </div>
                    </motion.div>

                    {/* Upcoming Widget */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 bg-white/[0.02] backdrop-blur-[30px] border border-white/5 rounded-3xl p-8 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-[family-name:var(--font-cinzel)] font-bold text-white tracking-tight">Timeline Analysis</h2>
                            <span className="text-white/20 font-mono text-[10px] uppercase">Alpha Build 1.0</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-teal/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Calendar className="w-12 h-12 text-white/5 mb-4 group-hover:text-teal/10 transition-colors duration-700" />
                            <p className="text-white/20 text-sm font-[family-name:var(--font-cormorant)] italic">Data stream initialization in progress...</p>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

function QuickAction({ href, icon: Icon, label, color }) {
    const colorClass = {
        teal: 'hover:border-teal/50 hover:bg-teal/5 active:bg-teal/10',
        lime: 'hover:border-lime/50 hover:bg-lime/5 active:bg-lime/10',
        orange: 'hover:border-orange/50 hover:bg-orange/5 active:bg-orange/10',
        purple: 'hover:border-purple-500/50 hover:bg-purple-500/5 active:bg-purple-500/10'
    }[color];

    const iconColor = {
        teal: 'group-hover:text-teal',
        lime: 'group-hover:text-lime',
        orange: 'group-hover:text-orange',
        purple: 'group-hover:text-purple-400'
    }[color];

    return (
        <Link
            href={href}
            className={`group flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl transition-all duration-300 ${colorClass}`}
        >
            <div className={`p-3 rounded-xl bg-white/[0.02] border border-white/5 group-hover:scale-110 transition-transform ${iconColor}`}>
                <Icon className="w-5 h-5 text-current opacity-70 group-hover:opacity-100" />
            </div>
            <span className="text-white/60 text-sm font-medium group-hover:text-white transition-colors">{label}</span>
        </Link>
    );
}
