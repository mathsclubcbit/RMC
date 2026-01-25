"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Shield, Target, Users, Activity, ArrowLeft } from "lucide-react";

export default function NetworkDashboard() {
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ activeTasks: 0, teamMembers: 0, completionRate: 0 });
    const [tasks, setTasks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Parallelize Profile & baseline query
            const { data: profileRes } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            const profileData = profileRes || {
                full_name: user.user_metadata.full_name,
                role: user.user_metadata.role || 'member',
                team: user.user_metadata.team || 'council'
            };

            let taskQuery = supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(5);

            // Apply team isolation
            if (profileData.role !== 'faculty' && profileData.role !== 'president' && profileData.team !== 'council') {
                taskQuery = taskQuery.eq('team_scope', profileData.team);
            }

            const [taskRes, notifRes] = await Promise.all([
                taskQuery,
                supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10)
            ]);

            setProfile(profileData);
            setNotifications(notifRes.data || []);
            setLoadingNotifications(false);
            setTasks(taskRes.data || []);

            setStats({
                activeTasks: (taskRes.data || []).length,
                teamMembers: profileData.team === 'council' ? 12 : 5,
                completionRate: 85
            });
            setLoading(false);
        };

        fetchDashboardData();
    }, []);

    const markAsRead = async (notifId) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
        setNotifications(notifications.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="text-teal font-mono animate-pulse uppercase tracking-widest text-sm">Loading Dashboard...</div>
        </div>
    );

    return (
        <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-[family-name:var(--font-cinzel)] font-bold text-white mb-2 leading-tight">
                        Hello, {profile?.full_name?.split(' ')[0] || 'Member'}
                    </h1>
                    <p className="text-white/40 font-mono text-[10px] md:text-xs">
                        {profile?.team?.toUpperCase()?.replace('_', ' ')} // STATUS: <span className="text-teal">ACTIVE</span>
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={() => router.push('/')}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-teal hover:bg-teal-400 text-black font-bold rounded-full text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)] flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Exit to Main Site
                    </button>

                    <div className="hidden sm:flex px-4 py-2 bg-white/5 rounded-full border border-white/10 items-center justify-center gap-2 text-[10px] text-teal font-mono">
                        <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                        SYNCED
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[
                    profile?.role === 'faculty'
                        ? { label: "System Integrity", value: "SECURE", icon: (props) => <div className="relative w-full h-full"><Image src="/RMC logo-circular.png" alt="RMC" fill className="object-contain" {...props} /></div>, color: "text-purple-400", border: "border-purple-500/20" }
                        : { label: "Active Tasks", value: stats.activeTasks, icon: Target, color: "text-blue-400", border: "border-blue-500/20" },
                    { label: "Team Strength", value: stats.teamMembers, icon: Users, color: "text-teal", border: "border-teal/20" },
                    { label: "Completion Rate", value: `${stats.completionRate}%`, icon: Activity, color: "text-purple-400", border: "border-purple-500/20" },
                ].map((stat, i) => (
                    <div key={i} className={`bg-black/40 backdrop-blur-xl border ${stat.border} rounded-3xl p-5 md:p-6 relative group overflow-hidden`}>
                        <div className={`absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity ${stat.color} w-32 h-32`}>
                            {typeof stat.icon === 'function' ? (
                                <stat.icon />
                            ) : (
                                <stat.icon className="w-16 h-16 md:w-20 md:h-20" />
                            )}
                        </div>
                        <div className="relative z-10">
                            {typeof stat.icon === 'function' ? (
                                <div className="w-6 h-6 md:w-8 md:h-8 mb-3 md:mb-4 relative">
                                    <Image src="/RMC logo-circular.png" alt="Icon" fill className="object-contain opacity-70" />
                                </div>
                            ) : (
                                <stat.icon className={`w-6 h-6 md:w-8 md:h-8 ${stat.color} mb-3 md:mb-4`} />
                            )}
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-1 font-[family-name:var(--font-cinzel)]">{stat.value}</h3>
                            <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className={`grid grid-cols-1 ${profile?.role === 'faculty' ? '' : 'lg:grid-cols-3'} gap-8 pb-10`}>
                {profile?.role !== 'faculty' && (
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-white font-bold text-base md:text-lg flex items-center gap-2">
                                <div className="w-5 h-5 relative">
                                    <Image src="/RMC logo-circular.png" alt="" fill className="object-contain" sizes="20px" />
                                </div> Recent Tasks
                            </h3>
                            <button className="text-teal text-[10px] font-mono uppercase tracking-widest hover:text-white transition-colors" onClick={() => router.push('/network/missions')}>View All</button>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden min-h-[200px]">
                            {tasks.length === 0 ? (
                                <div className="p-8 text-center text-white/30 font-mono text-sm">
                                    No active tasks for {profile?.team} team.
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <div key={task.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-1 md:w-2 h-10 md:h-12 rounded-full flex-shrink-0 ${task.priority === 'critical' ? 'bg-red-500' : 'bg-teal'}`} />
                                            <div className="min-w-0">
                                                <h4 className="text-white font-bold text-sm md:text-base mb-1 group-hover:text-teal transition-colors truncate">{task.title}</h4>
                                                <p className="text-[10px] text-white/40 font-mono">Status: <span className="text-white/70 uppercase">{task.status}</span></p>
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right pl-5 sm:pl-0">
                                            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] text-white/60 mb-1 inline-block">
                                                {new Date(task.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <h3 className="text-white font-bold text-base md:text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-400" /> Recent Activity
                    </h3>
                    <div className="bg-black/20 border border-white/5 rounded-3xl p-6 h-[300px] md:h-[400px] overflow-y-auto no-scrollbar space-y-6">
                        {loadingNotifications ? (
                            <div className="flex items-center justify-center h-full text-white/20 font-mono text-[10px] uppercase">Loading logs...</div>
                        ) : notifications.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-white/20 font-mono text-[10px] uppercase">No new alerts.</div>
                        ) : (
                            notifications.map((notif) => (
                                <div key={notif.id} className={`flex gap-4 group transition-opacity ${notif.is_read ? 'opacity-40' : 'opacity-100'}`}>
                                    <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg
                                        ${notif.type === 'task_assigned' ? 'bg-blue-500/10 text-blue-400 shadow-blue-500/20' :
                                            notif.type === 'review_required' ? 'bg-purple-500/10 text-purple-400 shadow-purple-500/20' :
                                                'bg-teal/10 text-teal shadow-teal/500/20'}`}
                                    >
                                        {notif.type === 'task_assigned' ? 'TSK' : notif.type === 'review_required' ? 'REV' : 'INF'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-white/90 leading-relaxed mb-1 font-sans">
                                            <span className="font-bold block text-white/60 text-[9px] uppercase tracking-tighter mb-0.5">{notif.title}</span>
                                            {notif.message}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] text-white/30 font-mono uppercase">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {!notif.is_read && (
                                                <button
                                                    onClick={() => markAsRead(notif.id)}
                                                    className="text-[8px] text-teal/40 hover:text-teal font-mono uppercase tracking-widest transition-colors"
                                                >
                                                    [ Ack ]
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
