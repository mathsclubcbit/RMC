"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
    Plus,
    Search,
    Trash2,
    Key,
    Users,
    Loader2,
    X,
    Mail,
    User,
    ChevronDown,
    AlertCircle,
    Shield
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

const CORE_COUNCIL_ROLES = [
    { value: "president", label: "President" },
    { value: "vice_president", label: "Vice President" },
    { value: "general_secretary", label: "General Secretary" },
    { value: "joint_secretary", label: "Joint Secretary" },
    { value: "faculty", label: "Faculty Advisor" }
];

const TEAM_ROLES = [
    { value: "head", label: "Head" },
    { value: "member", label: "Member" }
];

function AddMemberModal({ teams, onClose, onSuccess }) {
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("member");
    const [teamId, setTeamId] = useState("");
    const [teamRole, setTeamRole] = useState("member");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const isCoreCouncilRole = CORE_COUNCIL_ROLES.some(r => r.value === role);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("Email is required");
            return;
        }

        if (!isCoreCouncilRole && !teamId) {
            setError("Please select a team for this member");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch("/api/admin/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    fullName: fullName.trim(),
                    role,
                    teamId: isCoreCouncilRole ? null : teamId,
                    teamRole: isCoreCouncilRole ? null : teamRole
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create user");
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-gray-900/95 backdrop-blur-xl">
                    <h2 className="text-xl font-serif font-bold text-white">Add New Member</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Email Address *
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="member@cbit.ac.in"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Full Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Member Type *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole("member")}
                                className={`px-4 py-3 rounded-xl border transition-all ${!isCoreCouncilRole
                                    ? "bg-teal/10 border-teal/50 text-teal"
                                    : "bg-white/5 border-white/10 text-white/50"
                                    }`}
                            >
                                Team Member
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("president")}
                                className={`px-4 py-3 rounded-xl border transition-all ${isCoreCouncilRole
                                    ? "bg-purple-500/10 border-purple-500/50 text-purple-400"
                                    : "bg-white/5 border-white/10 text-white/50"
                                    }`}
                            >
                                Core Council
                            </button>
                        </div>
                    </div>

                    {isCoreCouncilRole && (
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                Council Position *
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full appearance-none bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none"
                                style={{ colorScheme: 'dark' }}
                            >
                                {CORE_COUNCIL_ROLES.map(r => (
                                    <option key={r.value} value={r.value} className="bg-gray-800 text-white">{r.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {!isCoreCouncilRole && (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                    Assign to Team *
                                </label>
                                <select
                                    value={teamId}
                                    onChange={(e) => setTeamId(e.target.value)}
                                    required
                                    className="w-full appearance-none bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none"
                                    style={{ colorScheme: 'dark' }}
                                >
                                    <option value="" className="bg-gray-800 text-white/50">Select a team...</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id} className="bg-gray-800 text-white">
                                            {team.name} ({team.type === "fest" ? "Fest" : "General"})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                    Role in Team
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setTeamRole("member")}
                                        className={`px-4 py-3 rounded-xl border transition-all ${teamRole === "member"
                                            ? "bg-teal/10 border-teal/50 text-teal"
                                            : "bg-white/5 border-white/10 text-white/50"
                                            }`}
                                    >
                                        Member
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTeamRole("head")}
                                        className={`px-4 py-3 rounded-xl border transition-all ${teamRole === "head"
                                            ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-400"
                                            : "bg-white/5 border-white/10 text-white/50"
                                            }`}
                                    >
                                        Head
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <p className="text-white/30 text-xs">
                        A temporary password will be generated. You can share it with the member or reset it later.
                    </p>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-teal text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal/80 transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Add Member
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}

function CredentialsModal({ member, onClose }) {
    const [newPassword, setNewPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const res = await fetch("/api/admin/update-credentials", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: member.id,
                    newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update password");
            }

            setSuccess(true);
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="text-xl font-serif font-bold text-white">Reset Password</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal/20 to-purple-500/20 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                {member.full_name?.[0] || member.email?.[0] || "?"}
                            </span>
                        </div>
                        <div>
                            <p className="text-white font-medium">{member.full_name || "Unnamed"}</p>
                            <p className="text-white/40 text-sm">{member.email}</p>
                        </div>
                    </div>

                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Key className="w-8 h-8 text-green-400" />
                            </div>
                            <h3 className="text-lg text-white font-medium mb-2">Password Updated!</h3>
                            <p className="text-white/50 text-sm">The new password has been set successfully.</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                    New Password
                                </label>
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none"
                                />
                                <p className="text-white/30 text-xs">Minimum 6 characters</p>
                            </div>

                            <button
                                onClick={handleResetPassword}
                                disabled={saving}
                                className="w-full bg-teal text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal/80 transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Key className="w-5 h-5" />
                                        Reset Password
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function PersonnelClient() {
    const { profile, canManageMembers, isPresident } = useAuth();
    const [members, setMembers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(null);

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

    const fetchData = useCallback(async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            const { data: profilesData, error: profilesError } = await supabase
                .from("profiles")
                .select(`
                    *,
                    team_members (
                        id,
                        role,
                        team_id,
                        teams:team_id (
                            id,
                            name,
                            type
                        )
                    )
                `)
                .order("created_at", { ascending: false });

            if (profilesError) throw profilesError;
            setMembers(profilesData || []);

            const { data: teamsData, error: teamsError } = await supabase
                .from("teams")
                .select("id, name, type")
                .order("name");

            if (teamsError) throw teamsError;
            setTeams(teamsData || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [profile?.id, supabase]);

    useEffect(() => {
        fetchData();

        const profilesChannel = supabase
            .channel("profiles-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchData)
            .subscribe();

        const membersChannel = supabase
            .channel("team-members-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(profilesChannel);
            supabase.removeChannel(membersChannel);
        };
    }, [fetchData, supabase]);

    const handleDeleteMember = async (memberId, memberEmail) => {
        showConfirm(
            "Remove Member",
            `Are you sure you want to remove "${memberEmail}" from the system? This will also delete their Supabase Auth account.`,
            async () => {
                try {
                    const res = await fetch("/api/admin/delete-user", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: memberId })
                    });

                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || "Failed to delete user");
                    }

                    fetchData();
                    showAlert("Removed", "Member has been successfully removed from the system.", "success");
                } catch (error) {
                    console.error("Error deleting member:", error);
                    showAlert("Error", error.message, "error");
                }
            },
            true
        );
    };

    const filteredMembers = members.filter(member => {
        const matchesSearch =
            member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = filterRole === "all" || member.role === filterRole;

        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (role) => {
        const colors = {
            president: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            vice_president: "bg-purple-500/20 text-purple-400 border-purple-500/30",
            general_secretary: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            joint_secretary: "bg-orange-500/20 text-orange-400 border-orange-500/30",
            faculty: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
            head: "bg-teal/20 text-teal border-teal/30",
            member: "bg-white/10 text-white/60 border-white/20"
        };

        return colors[role] || colors.member;
    };

    const formatRole = (role) => {
        return role.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };

    if (!canManageMembers() && !isPresident()) {
        return (
            <main className="flex-1 p-10 flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
                    <h1 className="text-2xl font-serif text-white mb-2">Access Denied</h1>
                    <p className="text-white/50">You don&apos;t have permission to view personnel.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 p-6 lg:p-10 pt-20 lg:pt-14 overflow-y-auto w-full">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
            >
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-[1px] w-8 bg-teal/40" />
                        <span className="text-teal font-mono text-xs uppercase tracking-[0.3em]">Directory Analysis</span>
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-[family-name:var(--font-cinzel)] font-bold text-white mb-4 tracking-tighter">
                        PERSONNEL
                    </h1>
                    <p className="text-white/40 font-[family-name:var(--font-cormorant)] text-lg italic max-w-xl">
                        The human capital of RMC. Structured by logic, defined by contribution.
                    </p>
                </div>

                {canManageMembers() && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-teal text-black font-bold rounded-2xl hover:bg-teal/80 transition-all duration-300 shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Add Member
                    </button>
                )}
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col md:flex-row gap-6 mb-10"
            >
                {/* Search */}
                <div className="relative flex-1 group">
                    <div className="absolute inset-0 bg-teal/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full pointer-events-none" />
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-teal transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email identifier..."
                        className="w-full bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl pl-13 pr-6 py-4 text-white placeholder-white/20 focus:border-teal/30 outline-none transition-all duration-300 focus:bg-white/[0.04]"
                    />
                </div>

                {/* Role Filter */}
                <div className="relative min-w-[220px]">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="w-full appearance-none bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 pr-12 text-white focus:border-teal/30 outline-none hover:bg-white/[0.04] transition-all"
                        style={{ colorScheme: 'dark' }}
                    >
                        <option value="all" className="bg-[#020617] text-white">All Subsets</option>
                        <optgroup label="Core Council" className="bg-[#020617] text-white/50">
                            {CORE_COUNCIL_ROLES.map(role => (
                                <option key={role.value} value={role.value} className="bg-[#020617] text-white">{role.label}</option>
                            ))}
                        </optgroup>
                        <optgroup label="Team Roles" className="bg-[#020617] text-white/50">
                            {TEAM_ROLES.map(role => (
                                <option key={role.value} value={role.value} className="bg-[#020617] text-white">{role.label}</option>
                            ))}
                        </optgroup>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                </div>
            </motion.div>

            {/* Members List */}
            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-12 h-12 border-2 border-teal/20 border-t-teal rounded-full animate-spin" />
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="text-center py-32 border border-dashed border-white/5 rounded-[3rem]">
                    <Users className="w-16 h-16 text-white/5 mx-auto mb-6" />
                    <h3 className="text-2xl font-[family-name:var(--font-cinzel)] text-white/40 mb-2">No Vectors Identified</h3>
                    <p className="text-white/20 font-[family-name:var(--font-cormorant)] italic">Adjust your search parameters...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map((member, index) => (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative"
                        >
                            <div className="relative bg-white/[0.02] backdrop-blur-[40px] border border-white/5 rounded-3xl p-6 hover:bg-white/[0.05] transition-all duration-500 overflow-hidden">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                    <button
                                        onClick={() => setShowCredentialsModal(member)}
                                        className="p-2 bg-teal/10 text-teal rounded-xl border border-teal/20 hover:bg-teal/20 transition-colors"
                                        title="Update Credentials"
                                    >
                                        <Key className="w-4 h-4" />
                                    </button>
                                    {member.id !== profile?.id && member.role !== 'president' && (
                                        <button
                                            onClick={() => handleDeleteMember(member.id, member.email)}
                                            className="p-2 bg-red-400/10 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                            title="Remove Vector"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-start gap-5">
                                    <div className="relative flex-shrink-0">
                                        <div className="absolute inset-0 bg-gradient-to-br from-teal/40 to-indigo-500/40 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full" />
                                        <div className="relative w-16 h-16 bg-[#020617] border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
                                            <span className="text-white font-[family-name:var(--font-cinzel)] text-2xl font-bold opacity-80 group-hover:scale-110 transition-transform duration-500">
                                                {member.full_name?.[0] || member.email?.[0] || "?"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 pr-12">
                                        <h3 className="text-xl font-[family-name:var(--font-cinzel)] font-bold text-white truncate mb-1">
                                            {member.full_name || "Unnamed"}
                                        </h3>
                                        <p className="text-white/30 text-xs font-mono truncate mb-4 tracking-tighter">
                                            {member.email}
                                        </p>

                                        <div className="flex flex-col gap-3">
                                            <div>
                                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] border ${getRoleBadge(member.role)}`}>
                                                    {formatRole(member.role)}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {member.team_members?.length > 0 ? (
                                                    member.team_members.map(tm => (
                                                        <div
                                                            key={tm.id}
                                                            className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded bg-white/[0.03] border border-white/5 ${tm.teams?.type === "fest"
                                                                ? "text-purple-400/70"
                                                                : "text-teal/70"
                                                                }`}
                                                        >
                                                            {tm.teams?.name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-white/10 text-[10px] italic">Not Assigned</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:via-teal/20 transition-all duration-700" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {showAddModal && (
                    <AddMemberModal
                        teams={teams}
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            setShowAddModal(false);
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showCredentialsModal && (
                    <CredentialsModal
                        member={showCredentialsModal}
                        onClose={() => setShowCredentialsModal(null)}
                    />
                )}
            </AnimatePresence>

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
        </main>
    );
}
