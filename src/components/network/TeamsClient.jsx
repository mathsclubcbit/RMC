"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
    Users,
    Plus,
    Loader2,
    Search,
    User,
    Shield,
    Trash2,
    Edit3,
    ArrowRight,
    Trophy,
    Target
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { CreateTeamModal, ManageTeamMembersModal } from "./TeamModals";

export default function TeamsClient() {

    const { profile, canManageTeams } = useAuth();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [managingTeam, setManagingTeam] = useState(null);

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

    const supabase = useMemo(() => createClient(), []);

    const fetchTeams = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("teams")
                .select("*, team_members(count)")
                .order("name");

            if (error) throw error;
            setTeams(data || []);
        } catch (error) {
            console.error("Error fetching teams:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    const handleDeleteTeam = async (teamId) => {
        showConfirm(
            "Delete Team",
            "Are you sure you want to delete this team? This will remove all members from the team record. Tasks will remain but lose their team association.",
            async () => {
                try {
                    const { error } = await supabase.from("teams").delete().eq("id", teamId);
                    if (error) throw error;
                    fetchTeams();
                    showAlert("Deleted", "Team has been removed successfully.", "success");
                } catch (err) {
                    showAlert("Error", err.message, "error");
                }
            },
            true
        );
    };

    const filteredTeams = teams.filter(team => {
        const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType === "all" || team.type === selectedType;
        return matchesSearch && matchesType;
    });

    const TeamCard = ({ team }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 hover:border-teal/30 transition-all duration-500 overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                {team.type === 'fest' ? <Trophy className="w-24 h-24" /> : <Target className="w-24 h-24" />}
            </div>

            <div className="relative flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl border ${team.type === 'fest' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-teal/10 border-teal/50 text-teal'}`}>
                        <Users className="w-6 h-6" />
                    </div>
                    {canManageTeams() && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setEditingTeam(team);
                                    setShowCreateModal(true);
                                }}
                                className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDeleteTeam(team.id)}
                                className="p-2 text-red-500/20 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-teal transition-colors font-serif">{team.name}</h3>
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[8px] uppercase tracking-widest font-bold rounded border ${team.type === 'fest' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                            {team.type}
                        </span>
                    </div>
                    <p className="text-white/50 text-sm mb-6 line-clamp-2 leading-relaxed">{team.description || "No description provided."}</p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {[1].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border border-gray-900 bg-teal/20 flex items-center justify-center text-[8px] text-teal font-bold">
                                    {(team.team_members?.[0]?.count || 0)}
                                </div>
                            ))}
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono">Members</span>
                    </div>
                    <button
                        onClick={() => setManagingTeam(team)}
                        className="flex items-center gap-2 text-xs font-bold text-teal hover:gap-3 transition-all group/btn"
                    >
                        View Team <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );

    return (
        <main className="flex-1 p-6 lg:p-10 pt-20 lg:pt-14 overflow-y-auto w-full">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-4xl lg:text-5xl font-serif font-bold text-white mb-3">The Council</h1>
                        <p className="text-white/40 max-w-md leading-relaxed">System architecture and collaborative units. Manage organizational teams and personnel.</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        {canManageTeams() && (
                            <button
                                onClick={() => {
                                    setEditingTeam(null);
                                    setShowCreateModal(true);
                                }}
                                className="px-6 py-3 bg-teal text-black font-bold rounded-xl hover:bg-teal/80 transition-all flex items-center gap-2 shadow-lg shadow-teal/20"
                            >
                                <Plus className="w-5 h-5" /> Create Team
                            </button>
                        )}
                        <button
                            onClick={fetchTeams}
                            className={`p-3 bg-white/5 text-white/40 hover:text-white rounded-xl border border-white/10 hover:bg-white/10 transition-all ${loading ? "animate-spin" : ""}`}
                        >
                            <Loader2 className="w-5 h-5" />
                        </button>
                    </motion.div>
                </div>

                {/* Filters & Search */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col md:flex-row md:items-center gap-4 mb-10"
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                            type="text"
                            placeholder="Search teams..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-white/20 focus:border-teal/50 focus:bg-white/[0.07] outline-none transition-all"
                        />
                    </div>
                    <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl">
                        {["all", "general", "fest"].map(t => (
                            <button
                                key={t}
                                onClick={() => setSelectedType(t)}
                                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${selectedType === t ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white/60"}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Grid */}
                {loading && teams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="w-12 h-12 text-teal animate-spin" />
                        <p className="text-white/20 font-mono text-xs uppercase tracking-widest">Accessing records...</p>
                    </div>
                ) : filteredTeams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                        <Users className="w-16 h-16 text-white/5 mb-4" />
                        <h3 className="text-xl text-white/40 font-serif">No squads found</h3>
                        <p className="text-white/20 text-xs">Try adjusting your filters or search metrics.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-20">
                        {filteredTeams.map((team) => (
                            <TeamCard key={team.id} team={team} />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateTeamModal
                        team={editingTeam}
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={() => {
                            setShowCreateModal(false);
                            fetchTeams();
                        }}
                    />
                )}
                {managingTeam && (
                    <ManageTeamMembersModal
                        team={managingTeam}
                        onClose={() => setManagingTeam(null)}
                    />
                )}
            </AnimatePresence>

            <ConfirmationModal
                {...statusModal}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
            />
        </main>
    );
}
