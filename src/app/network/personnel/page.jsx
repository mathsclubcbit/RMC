"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Shield, UserPlus, X, ChevronRight, Settings, Lock, Trash2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PersonnelPage() {
    const [profile, setProfile] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingMember, setDeletingMember] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [editData, setEditData] = useState({ fullName: '', password: '' });

    // New User State
    const [newUser, setNewUser] = useState({
        email: "",
        password: "",
        fullName: "",
        role: "member",
        team: "event"
    });
    const [createLoading, setCreateLoading] = useState(false);
    const [createMessage, setCreateMessage] = useState(null);

    const roles = [
        { id: "president", label: "President" },
        { id: "vice_president", label: "Vice President" },
        { id: "general_secretary", label: "General Secretary" },
        { id: "joint_secretary", label: "Joint Secretary" },
        { id: "head", label: "Team Head" },
        { id: "member", label: "Team Member" }
    ];

    const coreRoles = ["president", "vice_president", "general_secretary", "joint_secretary"];

    const teams = [
        { id: "council", label: "Core Council" },
        { id: "event", label: "Event Team" },
        { id: "content", label: "Content Team" },
        { id: "visual_media", label: "Visual Media Team" },
        { id: "pr", label: "PR & Social Media Team" },
        { id: "tech", label: "Tech Team" }
    ];

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Parallelize Profile and Members fetching
            const [profileRes, membersRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('profiles').select('*').order('team', { ascending: true })
            ]);

            setProfile(profileRes.data);
            setMembers(membersRes.data || []);
            setLoading(false);
        };
        fetchData();
    }, []);

    const hasPresident = members.some(m => m.role === 'president');

    const handleRoleChange = (roleId) => {
        const isCore = coreRoles.includes(roleId);
        setNewUser(prev => ({
            ...prev,
            role: roleId,
            team: isCore ? "council" : (prev.team === "council" ? "event" : prev.team)
        }));
    };

    const handleTeamChange = (teamId) => {
        const isCouncil = teamId === "council";
        setNewUser(prev => ({
            ...prev,
            team: teamId,
            role: isCouncil ? "vice_president" : (coreRoles.includes(prev.role) ? "member" : prev.role)
        }));
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        setCreateMessage(null);

        if (newUser.role === 'president' && hasPresident) {
            setCreateMessage({ type: 'error', text: "A President already exists in the club." });
            setCreateLoading(false);
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    ...newUser,
                    requesterId: profile.id
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setCreateMessage({ type: 'success', text: `Agent ${newUser.fullName} recruited successfully.` });
            setNewUser({ email: "", password: "", fullName: "", role: "member", team: "event" });

            const { data: allMembers } = await supabase.from('profiles').select('*').order('team', { ascending: true });
            setMembers(allMembers || []);

            setTimeout(() => { setShowAddModal(false); setCreateMessage(null); }, 2000);
        } catch (err) {
            setCreateMessage({ type: 'error', text: err.message });
        } finally {
            setCreateLoading(false);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        setCreateMessage(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/update-user', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    targetUserId: editingMember.id,
                    fullName: editData.fullName,
                    password: editData.password
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setMembers(members.map(m => m.id === editingMember.id ? { ...m, full_name: editData.fullName } : m));
            setShowEditModal(false);
            setEditingMember(null);
        } catch (err) {
            setCreateMessage({ type: 'error', text: err.message });
        } finally {
            setCreateLoading(false);
        }
    };

    const openEditModal = (member) => {
        setEditingMember(member);
        setEditData({ fullName: member.full_name, password: '' });
        setShowEditModal(true);
        setCreateMessage(null);
    };

    const openDeleteModal = (member) => {
        setDeletingMember(member);
        setShowDeleteModal(true);
    };

    const handleDeleteUser = async () => {
        if (!deletingMember) return;
        setCreateLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ targetUserId: deletingMember.id })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setMembers(members.filter(m => m.id !== deletingMember.id));
            setShowDeleteModal(false);
            setDeletingMember(null);
        } catch (err) {
            alert("Security Breach: " + err.message);
        } finally {
            setCreateLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20 px-8">
            <div className="text-teal font-mono animate-pulse uppercase tracking-widest text-sm">Loading Members Database...</div>
        </div>
    );

    const isPresident = profile?.role === 'president';

    return (
        <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-teal/10 border border-teal/20 rounded-xl flex items-center justify-center">
                            <Shield className="w-4 h-4 md:w-5 md:h-5 text-teal" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-cinzel)] font-bold text-white">Team Members</h1>
                    </div>
                    <p className="text-white/40 font-mono text-[10px] md:text-xs pl-11 md:pl-14">
                        TOTAL AGENTS: <span className="text-teal">{members.length}</span> // ACCESS: <span className="uppercase text-white/70">{profile?.role}</span>
                    </p>
                </div>

                {isPresident && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-teal hover:bg-teal-400 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(45,212,191,0.2)] transition-all uppercase tracking-wide text-xs group"
                    >
                        <UserPlus className="w-4 h-4" />
                        Recruit Member
                    </button>
                )}
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {teams.map(team => {
                    const teamMembers = members.filter(m => m.team === team.id);
                    if (teamMembers.length === 0) return null;

                    return (
                        <div key={team.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-teal/30 transition-all">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-[family-name:var(--font-cinzel)]">
                                {team.label} <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full font-mono text-teal">{teamMembers.length}</span>
                            </h3>
                            <div className="space-y-3">
                                {teamMembers.map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5 hover:border-teal/20 transition-colors group/item">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/70">
                                            {member.full_name?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate group-hover/item:text-teal transition-colors">{member.full_name}</p>
                                            <p className="text-[10px] text-white/40 uppercase font-mono">{member.role?.replace('_', ' ')}</p>
                                        </div>
                                        {isPresident && member.role !== 'president' && (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEditModal(member)}
                                                    className="p-2 text-white/20 hover:text-teal opacity-0 group-hover/item:opacity-100 transition-all"
                                                    title="Edit Member Credentials"
                                                >
                                                    <Settings className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(member)}
                                                    className="p-2 text-white/20 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                                                    title="Expel Agent"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Recruitment Modal remains same logic ... */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-teal/10"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white font-[family-name:var(--font-cinzel)] flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-teal" /> New Recruitment
                                </h2>
                                <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateUser} className="p-8 space-y-4">
                                {createMessage && (
                                    <div className={`p-4 rounded-xl text-xs font-mono border ${createMessage.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                                        {createMessage.text}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-white/50 font-mono tracking-widest pl-2">Full Name</label>
                                    <input
                                        type="text" required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal outline-none transition-all"
                                        placeholder="Full Name"
                                        value={newUser.fullName}
                                        onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-white/50 font-mono tracking-widest pl-2">Email Address</label>
                                    <input
                                        type="email" required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal outline-none transition-all"
                                        placeholder="email@example.com"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-white/50 font-mono tracking-widest pl-2">Designation</label>
                                        <div className="relative group">
                                            <select
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal outline-none appearance-none transition-all cursor-pointer"
                                                value={newUser.role}
                                                onChange={e => handleRoleChange(e.target.value)}
                                            >
                                                {roles.filter(r => {
                                                    if (r.id === 'president' && hasPresident) return false;
                                                    if (newUser.team === 'council') return coreRoles.includes(r.id);
                                                    return !coreRoles.includes(r.id);
                                                }).map(r => <option key={r.id} value={r.id} className="bg-[#0a0a0a] text-white">{r.label}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-teal transition-colors">
                                                <ChevronRight className="w-4 h-4 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-white/50 font-mono tracking-widest pl-2">Team</label>
                                        <div className="relative group">
                                            <select
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal outline-none appearance-none transition-all cursor-pointer"
                                                value={newUser.team}
                                                onChange={e => handleTeamChange(e.target.value)}
                                            >
                                                {teams.filter(t => {
                                                    if (coreRoles.includes(newUser.role)) return t.id === 'council';
                                                    return t.id !== 'council';
                                                }).map(t => <option key={t.id} value={t.id} className="bg-[#0a0a0a] text-white">{t.label}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-teal transition-colors">
                                                <ChevronRight className="w-4 h-4 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-white/50 font-mono tracking-widest pl-2">Password</label>
                                    <input
                                        type="password" required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal outline-none transition-all"
                                        placeholder="••••••••"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit" disabled={createLoading}
                                    className="w-full py-4 bg-teal hover:bg-[#2dcdc2] text-black font-bold rounded-xl uppercase tracking-widest transition-all mt-4 disabled:opacity-50 shadow-[0_4px_20px_rgba(58,188,179,0.2)]"
                                >
                                    {createLoading ? "Recruiting..." : "Confirm Recruit"}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {showEditModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-teal/5"
                        >
                            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                                <h2 className="text-xl font-bold font-[family-name:var(--font-cinzel)] flex items-center gap-3">
                                    <Settings className="w-5 h-5 text-teal" /> Edit Agent
                                </h2>
                                <button onClick={() => setShowEditModal(false)} className="text-white/40 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateUser} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-white/50 font-mono tracking-widest pl-2">Full Name</label>
                                    <input
                                        type="text" required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal outline-none transition-all"
                                        value={editData.fullName}
                                        onChange={e => setEditData({ ...editData, fullName: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-white/50 font-mono tracking-widest pl-2">Override Password</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal outline-none transition-all pr-10"
                                            placeholder="Leave blank to keep current"
                                            value={editData.password}
                                            onChange={e => setEditData({ ...editData, password: e.target.value })}
                                        />
                                        <Lock className="w-4 h-4 text-white/20 absolute right-4 top-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="text-[9px] text-white/30 px-2 mt-1 italic leading-tight">For security, current passwords remain hidden. You may only set a new override.</p>
                                </div>

                                {createMessage && (
                                    <div className={`p-4 rounded-xl text-xs font-mono uppercase ${createMessage.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-teal/10 text-teal border border-teal/20'}`}>
                                        {createMessage.text}
                                    </div>
                                )}

                                <button
                                    type="submit" disabled={createLoading}
                                    className="w-full py-4 bg-teal hover:bg-[#2dcdc2] text-black font-bold rounded-xl uppercase tracking-widest transition-all mt-4 disabled:opacity-50 shadow-[0_4px_20px_rgba(45,212,191,0.2)]"
                                >
                                    {createLoading ? "Saving..." : "Update Credentials"}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {showDeleteModal && deletingMember && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-[#0a0a0a] border border-red-500/20 rounded-3xl p-8 shadow-2xl shadow-red-500/10"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                                    <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold font-[family-name:var(--font-cinzel)] text-white mb-2 uppercase tracking-widest">
                                        Expulsion Protocol
                                    </h2>
                                    <p className="text-white/40 text-xs font-mono leading-relaxed">
                                        Confirming the permanent removal of agent <span className="text-white font-bold underline">{deletingMember.full_name}</span>.
                                        This action will immediately terminate all access keys and revoke their presence from the network.
                                    </p>
                                </div>

                                <div className="w-full grid grid-cols-2 gap-4 pt-4">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="py-3 border border-white/10 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/5 font-bold uppercase transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        onClick={handleDeleteUser}
                                        disabled={createLoading}
                                        className="py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                                    >
                                        {createLoading ? "Executing..." : "Confirm Expulsion"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
