"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import NetworkSidebar from "@/components/network/Sidebar";
import { createClient } from "@/lib/supabase/client";
import {
    UserCog,
    Plus,
    Search,
    Trash2,
    Key,
    Shield,
    Users,
    Loader2,
    X,
    Mail,
    User,
    ChevronDown,
    AlertCircle
} from "lucide-react";

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

export default function PersonnelPage() {
    const { profile, canManageMembers, isPresident } = useAuth();
    const [members, setMembers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(null);
    const supabase = createClient();

    useEffect(() => {
        fetchData();

        // Realtime subscription
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
    }, []);

    const fetchData = async () => {
        try {
            // Fetch all profiles with their team memberships
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

            // Fetch teams for the dropdown
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
    };

    const handleDeleteMember = async (memberId, memberEmail) => {
        if (!confirm(`Are you sure you want to remove "${memberEmail}" from the system? This will also delete their Supabase Auth account.`)) {
            return;
        }

        try {
            // Call admin API to delete user
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
        } catch (error) {
            console.error("Error deleting member:", error);
            alert(error.message);
        }
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
            <div className="flex min-h-screen">
                <NetworkSidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="text-center">
                        <Shield className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
                        <h1 className="text-2xl font-serif text-white mb-2">Access Denied</h1>
                        <p className="text-white/50">You don't have permission to view personnel.</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <NetworkSidebar />

            <main className="flex-1 p-6 lg:p-10 overflow-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                >
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-2">
                            Personnel
                        </h1>
                        <p className="text-white/50">
                            Manage all club members and their roles
                        </p>
                    </div>

                    {canManageMembers() && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-teal text-black font-bold rounded-xl hover:bg-teal/80 transition-colors"
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
                    className="flex flex-col md:flex-row gap-4 mb-6"
                >
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none"
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="relative">
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="appearance-none bg-gray-800 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:border-teal/50 outline-none min-w-[180px]"
                            style={{ colorScheme: 'dark' }}
                        >
                            <option value="all" className="bg-gray-800 text-white">All Roles</option>
                            <optgroup label="Core Council" className="bg-gray-800 text-white">
                                {CORE_COUNCIL_ROLES.map(role => (
                                    <option key={role.value} value={role.value} className="bg-gray-800 text-white">{role.label}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Team Roles" className="bg-gray-800 text-white">
                                {TEAM_ROLES.map(role => (
                                    <option key={role.value} value={role.value} className="bg-gray-800 text-white">{role.label}</option>
                                ))}
                            </optgroup>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    </div>
                </motion.div>

                {/* Members Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-teal animate-spin" />
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <h3 className="text-xl text-white/50 mb-2">No Members Found</h3>
                        <p className="text-white/30">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-mono">Member</th>
                                        <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-mono">Role</th>
                                        <th className="text-left px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-mono">Team(s)</th>
                                        {canManageMembers() && (
                                            <th className="text-right px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-mono">Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.map((member, index) => (
                                        <tr
                                            key={member.id}
                                            className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
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
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-2 py-1 text-[10px] uppercase tracking-widest rounded-full border ${getRoleBadge(member.role)}`}>
                                                    {formatRole(member.role)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {member.team_members?.length > 0 ? (
                                                        member.team_members.map(tm => (
                                                            <span
                                                                key={tm.id}
                                                                className={`inline-block px-2 py-0.5 text-xs rounded ${tm.teams?.type === "fest"
                                                                    ? "bg-purple-500/20 text-purple-400"
                                                                    : "bg-teal/20 text-teal"
                                                                    }`}
                                                            >
                                                                {tm.teams?.name} {tm.role === "head" && "(Head)"}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-white/30 text-sm">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            {canManageMembers() && (
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setShowCredentialsModal(member)}
                                                            className="p-2 text-white/40 hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
                                                            title="Reset Password"
                                                        >
                                                            <Key className="w-4 h-4" />
                                                        </button>
                                                        {member.id !== profile?.id && (
                                                            <button
                                                                onClick={() => handleDeleteMember(member.id, member.email)}
                                                                className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                title="Remove Member"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Add Member Modal */}
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

            {/* Credentials Modal */}
            <AnimatePresence>
                {showCredentialsModal && (
                    <CredentialsModal
                        member={showCredentialsModal}
                        onClose={() => setShowCredentialsModal(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function AddMemberModal({ teams, onClose, onSuccess }) {
    const { profile } = useAuth();
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

                    {/* Email */}
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

                    {/* Full Name */}
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

                    {/* Member Type Toggle */}
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

                    {/* Core Council Role Selection */}
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

                    {/* Team Selection (Only for Team Members) */}
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

                    {/* Submit */}
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
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="text-xl font-serif font-bold text-white">Reset Password</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
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
