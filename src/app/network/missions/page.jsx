"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    Target, Plus, Clock, CheckCircle2, AlertCircle,
    User, X, Info, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MissionsPage() {
    const [profile, setProfile] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");

    // New Mission State
    const [newMission, setNewMission] = useState({
        title: "",
        description: "",
        priority: "medium",
        assigned_to: "",
        due_date: "",
        team_scope: ""
    });
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Profile First
            const { data: pData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(pData);
            if (pData) setNewMission(prev => ({ ...prev, team_scope: pData.team }));

            // 2. Fetch Members (Filtered by Team if Head)
            let membersQuery = supabase.from('profiles').select('id, full_name, team, role').order('full_name');
            if (pData?.role === 'head') {
                membersQuery = membersQuery.eq('team', pData.team);
            }

            const { data: mData } = await membersQuery;
            setMembers(mData || []);

            // 3. Fetch Tasks
            await fetchTasks(pData);
            setLoading(false);
        };
        fetchInitialData();
    }, []);

    const fetchTasks = async (currentProfile) => {
        let query = supabase.from('tasks').select(`
            *,
            assignee:profiles!tasks_assigned_to_fkey(full_name, role),
            commander:profiles!tasks_assigned_by_fkey(full_name)
        `);

        if (currentProfile?.role !== 'faculty' && currentProfile?.role !== 'president' && currentProfile?.team !== 'council') {
            query = query.eq('team_scope', currentProfile?.team);
        }

        const { data } = await query.order('created_at', { ascending: false });
        setTasks(data || []);
    };

    const handleCreateMission = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        const { error } = await supabase.from('tasks').insert([{
            ...newMission,
            assigned_by: profile.id,
            status: 'pending'
        }]);

        if (!error) {
            setShowAddModal(false);
            setNewMission({ title: "", description: "", priority: "medium", assigned_to: "", due_date: "", team_scope: profile?.team || "" });
            fetchTasks(profile);
        }
        setCreateLoading(false);
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="text-teal font-mono animate-pulse uppercase tracking-widest text-sm">Loading Project Tasks...</div>
        </div>
    );

    const canCreate = ['faculty', 'president', 'vice_president', 'head'].includes(profile?.role);
    const filteredTasks = tasks.filter(t => filterStatus === 'all' || t.status === filterStatus);

    const getPriorityColor = (p) => {
        switch (p) {
            case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-teal bg-teal/10 border-teal/20';
        }
    };

    const getStatusIcon = (s) => {
        switch (s) {
            case 'done': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'in_progress': return <Clock className="w-4 h-4 text-blue-400 animate-pulse" />;
            case 'review': return <Info className="w-4 h-4 text-purple-400" />;
            default: return <AlertCircle className="w-4 h-4 text-white/40" />;
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-8 md:space-y-12 pb-10">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="w-full md:w-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-teal/10 border border-teal/20 rounded-xl flex items-center justify-center">
                            <Target className="w-4 h-4 md:w-5 md:h-5 text-teal" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-cinzel)] font-bold text-white">Tasks & Projects</h1>
                    </div>
                    <p className="text-white/40 font-mono text-[10px] md:text-xs pl-11 md:pl-14 uppercase tracking-widest">
                        TEAM: <span className="text-teal">{profile?.team?.toUpperCase()}</span> // ACTIVE: <span className="text-white">{tasks.length}</span>
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
                    <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl overflow-x-auto no-scrollbar">
                        {['all', 'pending', 'in_progress', 'review', 'done'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === s ? 'bg-teal text-black font-bold' : 'text-white/40 hover:text-white'
                                    }`}
                            >
                                {s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {canCreate && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-teal hover:bg-teal-400 text-black font-bold rounded-xl transition-all uppercase tracking-wide text-xs shadow-[0_0_20px_rgba(45,212,191,0.2)]"
                        >
                            <Plus className="w-4 h-4" /> Create Task
                        </button>
                    )}
                </div>
            </div>

            {/* Task Board */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredTasks.map((task) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={task.id}
                        className="bg-white/5 border border-white/10 rounded-3xl p-6 relative group hover:border-teal/30 transition-all flex flex-col"
                    >
                        <div className={`absolute top-6 right-6 px-2 py-1 rounded-md text-[8px] font-mono uppercase border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center gap-2 text-white/40 mb-2">
                                {getStatusIcon(task.status)}
                                <span className="text-[10px] font-mono uppercase tracking-widest">{task.status.replace('_', ' ')}</span>
                            </div>
                            <h3 className="text-lg font-bold group-hover:text-teal transition-colors mb-2">{task.title}</h3>
                            <p className="text-sm text-white/50 leading-relaxed line-clamp-3 mb-4">{task.description}</p>
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-mono uppercase">
                                <div className="flex items-center gap-2 text-white/60">
                                    <User className="w-3 h-3 text-teal" />
                                    <span>{task.assignee?.full_name || 'Unassigned'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-white/30">
                                    <Clock className="w-3 h-3" />
                                    <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Deadline'}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                {task.status !== 'done' && (
                                    <>
                                        {/* Start Task (Visible to Assignee or anyone if unassigned) */}
                                        {task.status === 'pending' && (task.assigned_to === profile?.id || !task.assigned_to) && (
                                            <button
                                                onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                                className="flex-1 py-3 bg-white/5 hover:bg-teal hover:text-black border border-white/10 rounded-xl text-[10px] uppercase font-bold transition-all"
                                            >
                                                Start Task
                                            </button>
                                        )}

                                        {/* Submit for Review (Visible to Assignee or Team Member) */}
                                        {task.status === 'in_progress' && (task.assigned_to === profile?.id || profile?.team === task.team_scope) && (
                                            <button
                                                onClick={() => updateTaskStatus(task.id, 'review')}
                                                className="flex-1 py-3 bg-white/5 hover:bg-purple-500 hover:text-white border border-white/10 rounded-xl text-[10px] uppercase font-bold transition-all"
                                            >
                                                Submit for Review
                                            </button>
                                        )}

                                        {/* Final Approval (Only for Head, Faculty, President) */}
                                        {task.status === 'review' && canCreate && (
                                            <button
                                                onClick={() => updateTaskStatus(task.id, 'done')}
                                                className="flex-1 py-3 bg-teal hover:bg-teal-400 text-black border border-white/10 rounded-xl text-[10px] uppercase font-bold transition-all shadow-[0_0_15px_rgba(45,212,191,0.2)]"
                                            >
                                                Approve Mission
                                            </button>
                                        )}

                                        {/* Basic Start/Update if Commander */}
                                        {canCreate && task.status === 'pending' && task.assigned_to !== profile?.id && !task.assigned_to && (
                                            <span className="text-[8px] text-white/20 uppercase font-mono py-3">Awaiting Agent...</span>
                                        )}
                                    </>
                                )}

                                {task.status === 'done' && (
                                    <div className="w-full py-3 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-[10px] uppercase font-bold text-center">
                                        Mission Accomplished
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal remains same logic ... */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-teal/5"
                        >
                            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                                <h2 className="text-xl font-bold font-[family-name:var(--font-cinzel)] flex items-center gap-3">
                                    <Plus className="w-5 h-5 text-teal" /> Create New Task
                                </h2>
                                <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateMission} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-white/50 font-mono tracking-widest pl-2">Title</label>
                                    <input
                                        type="text" required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal outline-none transition-all"
                                        placeholder="Enter task title"
                                        value={newMission.title}
                                        onChange={e => setNewMission({ ...newMission, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-white/50 font-mono tracking-widest pl-2">Description</label>
                                    <textarea
                                        rows={4}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal outline-none resize-none transition-all"
                                        placeholder="Task requirements and details..."
                                        value={newMission.description}
                                        onChange={e => setNewMission({ ...newMission, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-white/50 font-mono tracking-widest pl-2">Assign To</label>
                                        <div className="relative group">
                                            <select
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal outline-none appearance-none cursor-pointer transition-all"
                                                value={newMission.assigned_to}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setNewMission({
                                                        ...newMission,
                                                        assigned_to: val || null,
                                                        team_scope: val ? members.find(m => m.id === val)?.team : newMission.team_scope
                                                    });
                                                }}
                                            >
                                                <option value="" className="bg-[#0a0a0a]">Entire Team (Broad)</option>
                                                {members.map(m => (
                                                    <option key={m.id} value={m.id} className="bg-[#0a0a0a] text-white">
                                                        {m.full_name} ({m.team})
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                                                <ChevronRight className="w-4 h-4 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-white/50 font-mono tracking-widest pl-2">Priority Level</label>
                                        <div className="relative group">
                                            <select
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal outline-none appearance-none cursor-pointer transition-all"
                                                value={newMission.priority}
                                                onChange={e => setNewMission({ ...newMission, priority: e.target.value })}
                                            >
                                                <option value="low" className="bg-[#0a0a0a]">Low</option>
                                                <option value="medium" className="bg-[#0a0a0a]">Medium</option>
                                                <option value="high" className="bg-[#0a0a0a]">High</option>
                                                <option value="critical" className="bg-[#0a0a0a]">Critical</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                                                <ChevronRight className="w-4 h-4 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-white/50 font-mono tracking-widest pl-2">Due Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal outline-none transition-all"
                                        value={newMission.due_date}
                                        onChange={e => setNewMission({ ...newMission, due_date: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit" disabled={createLoading}
                                    className="w-full py-4 bg-teal hover:bg-[#2dcdc2] text-black font-bold rounded-xl uppercase tracking-widest transition-all mt-4 disabled:opacity-50 shadow-[0_4px_20px_rgba(58,188,179,0.2)]"
                                >
                                    {createLoading ? "Saving..." : "Create Task"}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
