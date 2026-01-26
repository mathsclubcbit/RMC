"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import NetworkSidebar from "@/components/network/Sidebar";
import { createClient } from "@/lib/supabase/client";
import {
    Users,
    Plus,
    Layers,
    PartyPopper,
    UserPlus,
    Trash2,
    Edit3,
    ChevronRight,
    Loader2,
    X,
    Shield
} from "lucide-react";

export default function TeamsPage() {
    const { profile, canManageTeams } = useAuth();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const supabase = createClient();

    // Fetch teams
    useEffect(() => {
        fetchTeams();

        // Realtime subscription
        const channel = supabase
            .channel("teams-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => {
                fetchTeams();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchTeams = async () => {
        try {
            const { data, error } = await supabase
                .from("teams")
                .select(`
                    *,
                    team_members (
                        id,
                        role,
                        user_id,
                        profiles:user_id (
                            id,
                            full_name,
                            email,
                            role
                        )
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTeams(data || []);
        } catch (error) {
            console.error("Error fetching teams:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeam = async (teamId, teamName) => {
        if (!confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const { error } = await supabase.from("teams").delete().eq("id", teamId);
            if (error) throw error;
            fetchTeams();
        } catch (error) {
            console.error("Error deleting team:", error);
            alert("Failed to delete team");
        }
    };

    const getTeamHead = (team) => {
        const headMember = team.team_members?.find(m => m.role === "head");
        return headMember?.profiles?.full_name || headMember?.profiles?.email || "No Head Assigned";
    };

    const getMemberCount = (team) => {
        return team.team_members?.length || 0;
    };

    return (
        <div className="flex min-h-screen">
            <NetworkSidebar />

            <main className="flex-1 p-6 lg:p-10 overflow-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10"
                >
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-2">
                            Teams
                        </h1>
                        <p className="text-white/50">
                            Manage General and Fest teams
                        </p>
                    </div>

                    {canManageTeams() && (
                        <button
                            onClick={() => {
                                setEditingTeam(null);
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 px-5 py-3 bg-teal text-black font-bold rounded-xl hover:bg-teal/80 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Team
                        </button>
                    )}
                </motion.div>

                {/* Teams Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-teal animate-spin" />
                    </div>
                ) : teams.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <h3 className="text-xl text-white/50 mb-2">No Teams Yet</h3>
                        {canManageTeams() && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="text-teal hover:underline"
                            >
                                Create your first team
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map((team, index) => (
                            <motion.div
                                key={team.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden hover:border-teal/30 transition-colors"
                            >
                                {/* Team Header */}
                                <div className={`p-5 border-b border-white/5 ${team.type === "fest" ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10" : "bg-gradient-to-r from-teal/5 to-lime/5"}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {team.type === "fest" ? (
                                                <PartyPopper className="w-6 h-6 text-purple-400" />
                                            ) : (
                                                <Layers className="w-6 h-6 text-teal" />
                                            )}
                                            <div>
                                                <h3 className="text-lg font-serif font-bold text-white">{team.name}</h3>
                                                <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] uppercase tracking-widest rounded-full ${team.type === "fest"
                                                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                                        : "bg-teal/20 text-teal border border-teal/30"
                                                    }`}>
                                                    {team.type === "fest" ? "Fest Team" : "General Team"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Team Body */}
                                <div className="p-5">
                                    <p className="text-white/40 text-sm mb-4 line-clamp-2">
                                        {team.description || "No description"}
                                    </p>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-white/50">
                                            <Shield className="w-4 h-4" />
                                            <span className="truncate max-w-[150px]">{getTeamHead(team)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/50">
                                            <Users className="w-4 h-4" />
                                            <span>{getMemberCount(team)} members</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Team Actions */}
                                {canManageTeams() && (
                                    <div className="px-5 pb-5 flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingTeam(team);
                                                setShowModal(true);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTeam(team.id, team.name)}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-colors text-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create/Edit Team Modal */}
            <AnimatePresence>
                {showModal && (
                    <CreateTeamModal
                        team={editingTeam}
                        onClose={() => {
                            setShowModal(false);
                            setEditingTeam(null);
                        }}
                        onSuccess={() => {
                            setShowModal(false);
                            setEditingTeam(null);
                            fetchTeams();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function CreateTeamModal({ team, onClose, onSuccess }) {
    const { profile } = useAuth();
    const [name, setName] = useState(team?.name || "");
    const [type, setType] = useState(team?.type || "general");
    const [description, setDescription] = useState(team?.description || "");
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
                // Update existing team
                const { error: updateError } = await supabase
                    .from("teams")
                    .update({ name: name.trim(), type, description: description.trim() })
                    .eq("id", team.id);

                if (updateError) throw updateError;
            } else {
                // Create new team
                const { error: insertError } = await supabase
                    .from("teams")
                    .insert({
                        name: name.trim(),
                        type,
                        description: description.trim(),
                        created_by: profile.id
                    });

                if (insertError) throw insertError;
            }

            onSuccess();
        } catch (err) {
            console.error("Error saving team:", err);
            setError(err.message || "Failed to save team");
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="text-xl font-serif font-bold text-white">
                        {team ? "Edit Team" : "Create New Team"}
                    </h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Team Name */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Team Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Content Team"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none transition-all"
                        />
                    </div>

                    {/* Team Type */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Team Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setType("general")}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${type === "general"
                                        ? "bg-teal/10 border-teal/50 text-teal"
                                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                                    }`}
                            >
                                <Layers className="w-5 h-5" />
                                General
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("fest")}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${type === "fest"
                                        ? "bg-purple-500/10 border-purple-500/50 text-purple-400"
                                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                                    }`}
                            >
                                <PartyPopper className="w-5 h-5" />
                                Fest
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the team's purpose"
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-teal text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal/80 transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                {team ? "Update Team" : "Create Team"}
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}
