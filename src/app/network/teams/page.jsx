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
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function TeamsPage() {
    const { profile, canManageTeams } = useAuth();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [selectedTeamForMembers, setSelectedTeamForMembers] = useState(null);
    const [editingTeam, setEditingTeam] = useState(null);

    // Global Alert/Confirm State
    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: "confirm",
        title: "",
        message: "",
        onConfirm: null
    });

    const showAlert = (title, message, type = "success") => {
        setStatusModal({ isOpen: true, title, message, type, onConfirm: null });
    };

    const showConfirm = (title, message, onConfirm, isDangerous = false) => {
        setStatusModal({ isOpen: true, title, message, type: "confirm", onConfirm, isDangerous });
    };
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
        showConfirm(
            "Delete Team",
            `Are you sure you want to delete "${teamName}"? This action cannot be undone.`,
            async () => {
                try {
                    const { error } = await supabase.from("teams").delete().eq("id", teamId);
                    if (error) throw error;
                    fetchTeams();
                    showAlert("Deleted", "Team has been removed successfully.", "success");
                } catch (error) {
                    console.error("Error deleting team:", error);
                    showAlert("Error", "Failed to delete team.", "error");
                }
            },
            true
        );
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

            <main className="flex-1 p-6 lg:p-10 pt-24 lg:pt-10 overflow-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10"
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
                    <div className="space-y-12">
                        {/* Fest Teams Section */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <PartyPopper className="w-6 h-6 text-purple-400" />
                                <h2 className="text-2xl font-serif font-bold text-white">Fest Teams</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {teams.filter(t => t.type === 'fest').length > 0 ? (
                                    teams.filter(t => t.type === 'fest').map((team, index) => (
                                        <TeamCard
                                            key={team.id}
                                            team={team}
                                            index={index}
                                            canManageTeams={canManageTeams}
                                            onEdit={() => {
                                                setEditingTeam(team);
                                                setShowModal(true);
                                            }}
                                            onDelete={() => handleDeleteTeam(team.id, team.name)}
                                            onManageMembers={() => {
                                                setSelectedTeamForMembers(team);
                                                setShowMembersModal(true);
                                            }}
                                        />
                                    ))
                                ) : (
                                    <p className="text-white/30 text-sm">No fest teams created yet.</p>
                                )}
                            </div>
                        </section>

                        {/* General Teams Section */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <Layers className="w-6 h-6 text-teal" />
                                <h2 className="text-2xl font-serif font-bold text-white">General Teams</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {teams.filter(t => t.type !== 'fest').length > 0 ? (
                                    teams.filter(t => t.type !== 'fest').map((team, index) => (
                                        <TeamCard
                                            key={team.id}
                                            team={team}
                                            index={index}
                                            canManageTeams={canManageTeams}
                                            onEdit={() => {
                                                setEditingTeam(team);
                                                setShowModal(true);
                                            }}
                                            onDelete={() => handleDeleteTeam(team.id, team.name)}
                                            onManageMembers={() => {
                                                setSelectedTeamForMembers(team);
                                                setShowMembersModal(true);
                                            }}
                                        />
                                    ))
                                ) : (
                                    <p className="text-white/30 text-sm">No general teams created yet.</p>
                                )}
                            </div>
                        </section>
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

            {/* Manage Members Modal */}
            <AnimatePresence>
                {showMembersModal && selectedTeamForMembers && (
                    <ManageTeamMembersModal
                        team={selectedTeamForMembers}
                        onClose={() => {
                            setShowMembersModal(false);
                            setSelectedTeamForMembers(null);
                        }}
                        onSuccess={() => {
                            fetchTeams();
                        }}
                        // Pass global alerts to child
                        showAlert={showAlert}
                        showConfirm={showConfirm}
                    />
                )}
            </AnimatePresence>

            {/* Global Status/Confirmation Modal */}
            <ConfirmationModal
                isOpen={statusModal.isOpen}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
                isDangerous={statusModal.isDangerous}
                onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={statusModal.onConfirm ? () => {
                    statusModal.onConfirm();
                    setStatusModal(prev => ({ ...prev, isOpen: false }));
                } : null}
            />
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

function TeamCard({ team, index, canManageTeams, onEdit, onDelete, onManageMembers }) {
    const getTeamHead = (t) => {
        const headMember = t.team_members?.find(m => m.role === "head");
        return headMember?.profiles?.full_name || headMember?.profiles?.email || "No Head Assigned";
    };

    const getMemberCount = (t) => {
        return t.team_members?.length || 0;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden hover:border-teal/30 transition-colors flex flex-col h-full"
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
                            <h3 className="text-lg font-serif font-bold text-white line-clamp-1">{team.name}</h3>
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
            <div className="p-5 flex-1">
                <p className="text-white/40 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {team.description || "No description"}
                </p>

                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-white/50">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span className="truncate max-w-[120px]" title={getTeamHead(team)}>{getTeamHead(team)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/50">
                        <Users className="w-4 h-4 text-teal" />
                        <span>{getMemberCount(team)} members</span>
                    </div>
                </div>
            </div>

            {/* Team Actions */}
            {canManageTeams() && (
                <div className="px-5 pb-5 pt-0 flex flex-col gap-2">
                    {team.type === "fest" && (
                        <button
                            onClick={onManageMembers}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm"
                        >
                            <UserPlus className="w-4 h-4" />
                            Manage Members
                        </button>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={onEdit}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit
                        </button>
                        <button
                            onClick={onDelete}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-colors text-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function ManageTeamMembersModal({ team, onClose, onSuccess, showAlert, showConfirm }) {
    const { profile } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState("member");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const supabase = createClient();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                searchUsers();
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const searchUsers = async () => {
        setLoading(true);
        try {
            const existingMemberIds = team.team_members?.map(m => m.user_id) || [];

            let query = supabase
                .from("profiles")
                .select("id, full_name, email, role")
                .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
                .limit(10);

            const { data, error } = await query;
            if (error) throw error;

            const availableUsers = data?.filter(u => !existingMemberIds.includes(u.id)) || [];
            setSearchResults(availableUsers);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!selectedUser) return;
        setSaving(true);
        setError("");

        try {
            const { error: insertError } = await supabase
                .from("team_members")
                .insert({
                    team_id: team.id,
                    user_id: selectedUser.id,
                    role: selectedRole
                });

            if (insertError) throw insertError;

            setSearchQuery("");
            setSearchResults([]);
            onSuccess();
            showAlert("Member Added", `Added ${selectedUser.full_name || selectedUser.email} as ${selectedRole}`, "success");

        } catch (err) {
            console.error("Error adding member:", err);
            showAlert("Error", err.message || "Failed to add member", "error");
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
                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-white">Manage Members</h2>
                        <p className="text-white/40 text-xs mt-0.5">{team.name}</p>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Add New Member
                        </label>

                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none"
                            />
                            {loading && (
                                <div className="absolute right-4 top-3.5">
                                    <Loader2 className="w-5 h-5 text-teal animate-spin" />
                                </div>
                            )}
                        </div>

                        {searchResults.length > 0 && (
                            <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                                {searchResults.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => setSelectedUser(user)}
                                        className={`w-full flex items-center justify-between p-3 text-left transition-colors ${selectedUser?.id === user.id ? 'bg-teal/20' : 'hover:bg-white/5'}`}
                                    >
                                        <div>
                                            <p className="text-white text-sm font-medium">{user.full_name || "Unnamed User"}</p>
                                            <p className="text-white/40 text-xs">{user.email}</p>
                                        </div>
                                        {selectedUser?.id === user.id && <div className="w-2 h-2 bg-teal rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedUser && (
                            <div className="p-4 bg-teal/5 border border-teal/20 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-teal font-bold text-sm">Selected User</p>
                                        <p className="text-white text-sm">{selectedUser.full_name}</p>
                                    </div>
                                    <button onClick={() => setSelectedUser(null)} className="text-white/30 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Assign Role</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedRole("member")}
                                            className={`flex-1 py-2 rounded-lg text-sm border font-medium ${selectedRole === "member"
                                                ? "bg-teal text-black border-teal"
                                                : "bg-transparent border-white/10 text-white/50 hover:text-white"}`}
                                        >
                                            Member
                                        </button>
                                        <button
                                            onClick={() => setSelectedRole("head")}
                                            className={`flex-1 py-2 rounded-lg text-sm border font-medium ${selectedRole === "head"
                                                ? "bg-purple-500 text-white border-purple-500"
                                                : "bg-transparent border-white/10 text-white/50 hover:text-white"}`}
                                        >
                                            Head
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddMember}
                                    disabled={saving}
                                    className="w-full bg-teal text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal/80 transition-colors disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                    Confirm Addition
                                </button>
                                {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <h3 className="text-white/50 text-xs uppercase tracking-widest mb-3">Current Members ({team.team_members?.length || 0})</h3>
                        <div className="space-y-2">
                            {team.team_members?.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${member.role === 'head' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-white/70'}`}>
                                            {member.profiles?.full_name?.[0] || "?"}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{member.profiles?.full_name || member.profiles?.email}</p>
                                            <p className="text-white/30 text-[10px] uppercase">{member.role}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            showConfirm(
                                                "Remove Member",
                                                `Are you sure you want to remove ${member.profiles?.full_name || 'this member'} from the team?`,
                                                async () => {
                                                    const { error } = await supabase.from('team_members').delete().eq('id', member.id);
                                                    if (error) showAlert("Error", "Failed to remove member", "error");
                                                    else {
                                                        onSuccess();
                                                        showAlert("Removed", "Member has been removed from the team.", "success");
                                                    }
                                                },
                                                true
                                            );
                                        }}
                                        className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
