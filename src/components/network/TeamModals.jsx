"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
    Plus,
    Loader2,
    X,
    Users,
    User,
    Shield,
    Trash2,
    UserPlus,
    XCircle,
    CheckCircle
} from "lucide-react";

export function CreateTeamModal({ team, onClose, onSuccess }) {
    const [name, setName] = useState(team?.name || "");
    const [description, setDescription] = useState(team?.description || "");
    const [type, setType] = useState(team?.type || "general");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const supabase = createClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Team name is required");
            return;
        }

        setSaving(true);
        try {
            if (team) {
                const { error: updateError } = await supabase
                    .from("teams")
                    .update({ name, description, type })
                    .eq("id", team.id);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("teams")
                    .insert({ name, description, type });
                if (insertError) throw insertError;
            }
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="text-xl font-serif font-bold text-white">
                        {team ? "Edit Team" : "Create Team"}
                    </h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Team Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none"
                            placeholder="e.g. Design Team"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none resize-none"
                            placeholder="Briefly describe the team's purpose..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Type</label>
                        <div className="flex gap-2">
                            {["general", "fest"].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`flex-1 py-2 rounded-lg border text-sm capitalize transition-all ${type === t ? "bg-teal/10 border-teal/50 text-teal" : "bg-white/5 border-white/10 text-white/50"}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-teal text-black font-bold py-3 rounded-xl hover:bg-teal/80 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {team ? "Update Team" : "Create Team"}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}

export function ManageTeamMembersModal({ team, onClose }) {
    const [members, setMembers] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const supabase = createClient();

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("team_members")
                .select("*, profiles(id, full_name, email)")
                .eq("team_id", team.id);
            if (error) throw error;
            setMembers(data || []);

            const { data: allProfiles } = await supabase
                .from("profiles")
                .select("id, full_name, email")
                .order("full_name");

            const memberIds = data?.map(m => m.user_id) || [];
            setCandidates(allProfiles?.filter(p => !memberIds.includes(p.id)) || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useState(() => {
        fetchMembers();
    }, []);

    const handleAddMember = async (userId) => {
        setAdding(true);
        try {
            const { error } = await supabase
                .from("team_members")
                .insert({ team_id: team.id, user_id: userId, role: "member" });
            if (error) throw error;
            fetchMembers();
        } catch (err) {
            alert(err.message);
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            const { error } = await supabase
                .from("team_members")
                .delete()
                .eq("team_id", team.id)
                .eq("user_id", userId);
            if (error) throw error;
            fetchMembers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleToggleRole = async (member) => {
        const newRole = member.role === "head" ? "member" : "head";
        try {
            const { error } = await supabase
                .from("team_members")
                .update({ role: newRole })
                .eq("id", member.id);
            if (error) throw error;
            fetchMembers();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-white uppercase tracking-tight">Team: {team.name}</h2>
                        <p className="text-white/40 text-xs">Manage members and roles</p>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Current Members */}
                    <section>
                        <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-4 flex items-center gap-2">
                            <Users className="w-3 h-3 text-teal" /> Current Members ({members.length})
                        </h3>
                        {loading ? (
                            <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-teal" /></div>
                        ) : members.length === 0 ? (
                            <p className="text-white/20 text-xs text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10 italic">No members in this team yet.</p>
                        ) : (
                            <div className="grid gap-2">
                                {members.map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl group hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${member.role === 'head' ? 'bg-teal text-black' : 'bg-white/10 text-white'}`}>
                                                {member.profiles?.full_name?.charAt(0) || <User className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{member.profiles?.full_name || member.profiles?.email}</p>
                                                <p className={`text-[9px] uppercase tracking-tighter font-mono ${member.role === 'head' ? 'text-teal' : 'text-white/40'}`}>{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => handleToggleRole(member)}
                                                className={`p-1.5 rounded-lg transition-all ${member.role === 'head' ? 'text-teal hover:bg-teal/10' : 'text-white/20 hover:text-teal hover:bg-teal/10'}`}
                                                title={member.role === 'head' ? "Demote to Member" : "Promote to Head"}
                                            >
                                                <Shield className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveMember(member.user_id)}
                                                className="p-1.5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Remove from Team"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Add New Members */}
                    <section>
                        <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-mono mb-4 flex items-center gap-2">
                            <UserPlus className="w-3 h-3 text-teal" /> Add New Members
                        </h3>
                        <div className="relative mb-4">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:border-teal/50 outline-none"
                                placeholder="Search students by name or email..."
                            />
                        </div>
                        <div className="grid gap-1 max-h-48 overflow-y-auto pr-1">
                            {candidates
                                .filter(c =>
                                    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .slice(0, 50)
                                .map(candidate => (
                                    <button
                                        key={candidate.id}
                                        onClick={() => handleAddMember(candidate.id)}
                                        disabled={adding}
                                        className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] border border-white/5 text-white/40">
                                                {candidate.full_name?.charAt(0) || "?"}
                                            </div>
                                            <div>
                                                <p className="text-sm text-white/80 group-hover:text-white transition-all">{candidate.full_name || "Unnamed User"}</p>
                                                <p className="text-[9px] text-white/30 font-mono">{candidate.email}</p>
                                            </div>
                                        </div>
                                        <Plus className="w-4 h-4 text-teal opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                ))
                            }
                            {candidates.length === 0 && <p className="text-white/20 text-[10px] text-center italic">No candidates available.</p>}
                        </div>
                    </section>
                </div>
            </motion.div>
        </motion.div>
    );
}
