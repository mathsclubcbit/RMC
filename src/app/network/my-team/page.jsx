"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import NetworkSidebar from "@/components/network/Sidebar";
import { createClient } from "@/lib/supabase/client";
import {
    Users,
    Shield,
    Loader2,
    UserPlus,
    Trash2,
    Key,
    X
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { updateMemberPassword, createTeamMember } from "@/app/network/actions";

export default function MyTeamPage() {
    const { profile } = useAuth();
    const [invites, setInvites] = useState({}); // Map of teamId -> invites[]
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [myTeams, setMyTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        isDangerous: false
    });

    // Password Modal State
    const [passwordModal, setPasswordModal] = useState({
        isOpen: false,
        teamId: null,
        memberId: null,
        memberName: ""
    });

    const supabase = useMemo(() => createClient(), []);

    const fetchInvites = useCallback(async (teamIds) => {
        try {
            const { data, error } = await supabase
                .from("team_invites")
                .select("*")
                .in("team_id", teamIds)
                .eq("status", "pending");

            if (error) throw error;

            // Group by team_id
            const invitesMap = {};
            data?.forEach(invite => {
                if (!invitesMap[invite.team_id]) invitesMap[invite.team_id] = [];
                invitesMap[invite.team_id].push(invite);
            });
            setInvites(invitesMap);
        } catch (error) {
            console.error("Error fetching invites:", error);
        }
    }, [supabase]);

    const fetchMyTeams = useCallback(async () => {
        if (!profile?.id) return;

        try {
            // Get teams the user belongs to
            const { data: teamMemberships, error } = await supabase
                .from("team_members")
                .select(`
                    id,
                    role,
                    team_id,
                    teams:team_id (
                        id,
                        name,
                        type,
                        description,
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
                    )
                `)
                .eq("user_id", profile.id);

            if (error) throw error;

            // Process data
            const teams = teamMemberships?.map(tm => ({
                ...tm.teams,
                myRole: tm.role
            })) || [];

            setMyTeams(teams);

            // Fetch invites for teams where user is head
            const headTeams = teams.filter(t => t.myRole === 'head');
            if (headTeams.length > 0) {
                fetchInvites(headTeams.map(t => t.id));
            }
        } catch (error) {
            console.error("Error fetching my teams:", error);
        } finally {
            setLoading(false);
        }
    }, [profile?.id, supabase, fetchInvites]);

    useEffect(() => {
        fetchMyTeams();
    }, [fetchMyTeams]);

    const getHead = (team) => {
        const headMember = team.team_members?.find(m => m.role === "head");
        return headMember?.profiles;
    };

    const getMembers = (team) => {
        return team.team_members?.filter(m => m.role === "member").map(m => m.profiles) || [];
    };

    if (loading) {
        return (
            <div className="flex h-full">
                <NetworkSidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-teal animate-spin" />
                </main>
            </div>
        );
    }

    if (myTeams.length === 0) {
        return (
            <div className="flex h-full">
                <NetworkSidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="text-center">
                        <Users className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <h1 className="text-2xl font-serif text-white mb-2">No Teams</h1>
                        <p className="text-white/50">You&apos;re not part of any team yet.</p>
                    </div>
                </main>
            </div>
        );
    }



    const executeRemoveMember = async (teamId, memberId) => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from("team_members")
                .delete()
                .match({ team_id: teamId, user_id: memberId });

            if (error) throw error;

            fetchMyTeams();
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error("Error removing member:", error);
            setConfirmModal({
                isOpen: true,
                type: "error",
                title: "Error",
                message: "Failed to remove member. You might not have permission.",
                onConfirm: null
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRemoveMember = (teamId, memberId, memberName) => {
        setConfirmModal({
            isOpen: true,
            type: "confirm",
            title: "Remove Member",
            message: `Are you sure you want to remove ${memberName} from the team? This action cannot be undone.`,
            confirmText: "Remove Member",
            isDangerous: true,
            onConfirm: () => executeRemoveMember(teamId, memberId)
        });
    };

    return (
        <div className="flex h-full">
            <NetworkSidebar />

            <main className="flex-1 p-6 lg:p-10 pt-20 lg:pt-14 overflow-y-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-2">
                        My Team{myTeams.length > 1 ? "s" : ""}
                    </h1>
                    <p className="text-white/50">
                        View your team memberships and colleagues
                    </p>
                </motion.div>

                {/* Teams */}
                <div className="space-y-8">
                    {myTeams.map((team, index) => {
                        const head = getHead(team);
                        const members = getMembers(team);
                        const isHead = team.myRole === "head";
                        const teamInvites = invites[team.id] || [];

                        return (
                            <motion.div
                                key={team.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden"
                            >
                                {/* Team Header */}
                                <div className={`px-6 py-5 border-b border-white/5 ${team.type === "fest"
                                    ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10"
                                    : "bg-gradient-to-r from-teal/5 to-lime/5"
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-xl font-serif font-bold text-white">{team.name}</h2>
                                                {isHead && (
                                                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full">
                                                        You&apos;re the Head
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-white/40 text-sm mt-1">{team.description || "No description"}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 text-xs uppercase tracking-widest rounded-full ${team.type === "fest"
                                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                                : "bg-teal/20 text-teal border border-teal/30"
                                                }`}>
                                                {team.type === "fest" ? "Fest Team" : "General Team"}
                                            </span>

                                            {isHead && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedTeam(team);
                                                        setShowAddModal(true);
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors border border-white/10"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    Add Member
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Team Members */}
                                <div className="p-6">
                                    {/* Head */}
                                    {head && (
                                        <div className="mb-6">
                                            <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-mono mb-3">Team Head</h3>
                                            <div className="flex items-center gap-3 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-full flex items-center justify-center">
                                                    <Shield className="w-5 h-5 text-yellow-400" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{head.full_name || "Unnamed"}</p>
                                                    <p className="text-white/40 text-sm">{head.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Invites (Only for Head) */}
                                    {isHead && teamInvites.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-mono mb-3">
                                                Pending Invites ({teamInvites.length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {teamInvites.map(invite => (
                                                    <div
                                                        key={invite.id}
                                                        className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 border-dashed rounded-xl"
                                                    >
                                                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                                                            <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white font-medium truncate">{invite.full_name || "Invited User"}</p>
                                                            <p className="text-white/40 text-sm truncate">{invite.email}</p>
                                                        </div>
                                                        <div className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-[10px] rounded">
                                                            Pending
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Members */}
                                    <div>
                                        <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-mono mb-3">
                                            Members ({members.length})
                                        </h3>
                                        {members.length === 0 ? (
                                            <p className="text-white/30 text-sm">No other members in this team</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {members.map(member => (
                                                    <div
                                                        key={member.id}
                                                        className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl group relative"
                                                    >
                                                        <div className="w-10 h-10 bg-gradient-to-br from-teal/20 to-purple-500/20 rounded-full flex items-center justify-center">
                                                            <span className="text-white font-bold text-sm">
                                                                {member.full_name?.[0] || member.email?.[0] || "?"}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white font-medium truncate">{member.full_name || "Unnamed"}</p>
                                                            <p className="text-white/40 text-sm truncate">{member.email}</p>
                                                        </div>

                                                        {isHead && (
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => setPasswordModal({
                                                                        isOpen: true,
                                                                        teamId: team.id,
                                                                        memberId: member.id,
                                                                        memberName: member.full_name
                                                                    })}
                                                                    className="p-2 bg-white/10 text-white/50 hover:text-white rounded-lg hover:bg-white/20"
                                                                    title="Update Password"
                                                                >
                                                                    <Key className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRemoveMember(team.id, member.id, member.full_name)}
                                                                    disabled={isDeleting}
                                                                    className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                                                                    title="Remove Member"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </main>

            {/* Add Member Modal */}
            {showAddModal && selectedTeam && (
                <AddMemberModal
                    team={selectedTeam}
                    onClose={() => {
                        setShowAddModal(false);
                        setSelectedTeam(null);
                    }}
                    onSuccess={() => {
                        fetchMyTeams(); // Refresh list
                    }}
                />
            )}


            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                isDangerous={confirmModal.isDangerous}
                isLoading={isDeleting}
            />

            {/* Password Update Modal */}
            {passwordModal.isOpen && (
                <UpdatePasswordModal
                    isOpen={passwordModal.isOpen}
                    onClose={() => setPasswordModal({ ...passwordModal, isOpen: false })}
                    teamId={passwordModal.teamId}
                    memberId={passwordModal.memberId}
                    memberName={passwordModal.memberName}
                />
            )}
        </div>
    );
}

function AddMemberModal({ team, onClose, onSuccess }) {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setLoading(true);

        try {
            const cleanEmail = email.trim().toLowerCase();
            const cleanName = name.trim() || cleanEmail.split('@')[0];
            const cleanPassword = password.trim();

            if (cleanPassword.length < 6) {
                throw new Error("Password must be at least 6 characters.");
            }

            // Call Server Action
            const result = await createTeamMember(team.id, cleanEmail, cleanPassword, cleanName);

            if (!result.success) {
                throw new Error(result.error || "Failed to add member");
            }

            setSuccessMsg("Member added successfully! They can log in immediately.");

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);

        } catch (err) {
            console.error("Error adding member:", err);
            setError(err.message || "Failed to add member");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-serif font-bold text-white">Add Member to {team.name}</h3>
                    <button onClick={onClose}><X className="text-white/50 hover:text-white" /></button>
                </div>

                {!successMsg ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg">{error}</div>}

                        <div>
                            <label className="block text-xs uppercase text-white/40 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none"
                                placeholder="member@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-white/40 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none"
                                placeholder="e.g. John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-white/40 mb-1">Set Password</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input
                                    type="text"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-teal/50 outline-none font-mono"
                                    placeholder="Enter initial password"
                                    minLength={6}
                                />
                            </div>
                            <p className="text-[10px] text-white/30 mt-1">Share this password with the member.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal/80 transition-colors"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <UserPlus className="w-5 h-5" />}
                            Create & Add Member
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-6">
                        <div className="w-12 h-12 bg-teal/20 text-teal rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <h4 className="text-white font-bold mb-2">Success!</h4>
                        <p className="text-white/60 mb-4">{successMsg}</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}


function UpdatePasswordModal({ isOpen, onClose, teamId, memberId, memberName }) {
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await updateMemberPassword(teamId, memberId, newPassword);

            if (!result.success) {
                throw new Error(result.error || "Failed to update password");
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setNewPassword("");
            }, 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-serif font-bold text-white">Update Credentials</h3>
                    <button onClick={onClose}><X className="text-white/50 hover:text-white" /></button>
                </div>

                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-300">
                            Updating password for <span className="font-bold text-white">{memberName || "User"}</span>.
                        </div>

                        {error && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg">{error}</div>}

                        <div>
                            <label className="block text-xs uppercase text-white/40 mb-1">New Password</label>
                            <input
                                type="text"
                                required
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none font-mono"
                                placeholder="Enter new password"
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal/80 transition-colors"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Key className="w-5 h-5" />}
                            Update Password
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-6">
                        <div className="w-12 h-12 bg-teal/20 text-teal rounded-full flex items-center justify-center mx-auto mb-4">
                            <Key className="w-6 h-6" />
                        </div>
                        <h4 className="text-white font-bold mb-2">Password Updated!</h4>
                        <p className="text-white/60">The user can now log in with the new credentials.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
