"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import NetworkSidebar from "@/components/network/Sidebar";
import { createClient } from "@/lib/supabase/client";
import {
    Users,
    ListTodo,
    Calendar,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle
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
    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch team count
                const { count: teamCount } = await supabase
                    .from("teams")
                    .select("*", { count: "exact", head: true });

                // Fetch member count
                const { count: memberCount } = await supabase
                    .from("profiles")
                    .select("*", { count: "exact", head: true });

                setStats({
                    totalMembers: memberCount || 0,
                    totalTeams: teamCount || 0,
                    pendingTasks: 0, // Will be implemented in Phase 5
                    upcomingEvents: 0 // Will be implemented in Phase 6
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

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
        <div className="flex min-h-screen">
            <NetworkSidebar />

            <main className="flex-1 p-6 lg:p-10 overflow-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-2">
                        {getGreeting()}, <span className="text-teal">{profile?.full_name?.split(' ')[0] || 'Member'}</span>
                    </h1>
                    <p className="text-white/50">
                        Welcome to the RMC Network. Here's your overview.
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {statCards.filter(card => card.visible).map((card, index) => {
                        const Icon = card.icon;
                        const colorClass = {
                            teal: 'from-teal/20 to-teal/5 border-teal/20',
                            lime: 'from-lime/20 to-lime/5 border-lime/20',
                            orange: 'from-orange/20 to-orange/5 border-orange/20',
                            purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20'
                        }[card.color];

                        const iconColor = {
                            teal: 'text-teal',
                            lime: 'text-lime',
                            orange: 'text-orange',
                            purple: 'text-purple-400'
                        }[card.color];

                        return (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`bg-gradient-to-br ${colorClass} backdrop-blur-xl border rounded-2xl p-6`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Icon className={`w-8 h-8 ${iconColor}`} />
                                    {loading ? (
                                        <div className="w-8 h-8 bg-white/10 rounded animate-pulse" />
                                    ) : (
                                        <span className="text-3xl font-bold text-white">{card.value}</span>
                                    )}
                                </div>
                                <h3 className="text-white/60 text-sm font-medium">{card.title}</h3>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6"
                >
                    <h2 className="text-xl font-serif font-bold text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickAction
                            href="/network/tasks"
                            icon={ListTodo}
                            label="View Tasks"
                            color="teal"
                        />
                        <QuickAction
                            href="/network/calendar"
                            icon={Calendar}
                            label="Calendar"
                            color="lime"
                        />
                        <QuickAction
                            href="/network/resources"
                            icon={CheckCircle}
                            label="Resources"
                            color="orange"
                        />
                        {isPresident() && (
                            <QuickAction
                                href="/network/settings"
                                icon={AlertCircle}
                                label="Settings"
                                color="purple"
                            />
                        )}
                    </div>
                </motion.div>

                {/* Placeholder for Calendar Widget (Phase 6) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6"
                >
                    <h2 className="text-xl font-serif font-bold text-white mb-4">Upcoming</h2>
                    <div className="flex items-center justify-center h-48 border border-dashed border-white/10 rounded-xl">
                        <p className="text-white/30 text-sm">Calendar widget coming soon...</p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

function QuickAction({ href, icon: Icon, label, color }) {
    const colorClass = {
        teal: 'hover:border-teal/50 hover:bg-teal/5',
        lime: 'hover:border-lime/50 hover:bg-lime/5',
        orange: 'hover:border-orange/50 hover:bg-orange/5',
        purple: 'hover:border-purple-500/50 hover:bg-purple-500/5'
    }[color];

    const iconColor = {
        teal: 'group-hover:text-teal',
        lime: 'group-hover:text-lime',
        orange: 'group-hover:text-orange',
        purple: 'group-hover:text-purple-400'
    }[color];

    return (
        <a
            href={href}
            className={`group flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl transition-all ${colorClass}`}
        >
            <Icon className={`w-6 h-6 text-white/50 ${iconColor} transition-colors`} />
            <span className="text-white/70 text-sm text-center group-hover:text-white transition-colors">{label}</span>
        </a>
    );
}
