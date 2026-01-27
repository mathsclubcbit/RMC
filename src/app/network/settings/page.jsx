"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import NetworkSidebar from "@/components/network/Sidebar";
import { createClient } from "@/lib/supabase/client";
import { Settings, Shield, Users, ToggleLeft, ToggleRight, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
    const { profile, isPresident } = useAuth();
    const [delegatedUsers, setDelegatedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [message, setMessage] = useState(null);
    const supabase = useMemo(() => createClient(), []);

    const fetchDelegatedUsers = useCallback(async () => {
        try {
            // Fetch core council members who can receive delegated permissions
            const { data: coreUsers, error: usersError } = await supabase
                .from("profiles")
                .select("id, email, full_name, role")
                .in("role", ["vice_president", "general_secretary", "joint_secretary"]);

            if (usersError) throw usersError;

            // Fetch existing permissions
            const { data: permissions, error: permError } = await supabase
                .from("delegated_permissions")
                .select("*");

            if (permError && permError.code !== "PGRST116") throw permError;

            // Merge data
            const merged = (coreUsers || []).map(user => {
                const perm = permissions?.find(p => p.user_id === user.id);
                return {
                    ...user,
                    can_manage_teams: perm?.can_manage_teams || false,
                    can_manage_members: perm?.can_manage_members || false,
                    has_permission_row: !!perm,
                    permission_id: perm?.id
                };
            });

            setDelegatedUsers(merged);
        } catch (error) {
            console.error("Error fetching delegated users:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        if (isPresident()) {
            fetchDelegatedUsers();
        } else {
            setLoading(false);
        }
    }, [isPresident, fetchDelegatedUsers]);

    const togglePermission = async (userId, permissionType, currentValue) => {
        setSaving(userId);
        setMessage(null);

        try {
            const user = delegatedUsers.find(u => u.id === userId);

            if (user.has_permission_row) {
                // Update existing row
                const { error } = await supabase
                    .from("delegated_permissions")
                    .update({ [permissionType]: !currentValue })
                    .eq("user_id", userId);

                if (error) throw error;
            } else {
                // Insert new row
                const { error } = await supabase
                    .from("delegated_permissions")
                    .insert({
                        user_id: userId,
                        [permissionType]: true,
                        granted_by: profile.id
                    });

                if (error) throw error;
            }

            // Update local state
            setDelegatedUsers(prev =>
                prev.map(u => {
                    if (u.id === userId) {
                        return {
                            ...u,
                            [permissionType]: !currentValue,
                            has_permission_row: true
                        };
                    }
                    return u;
                })
            );

            setMessage({ type: "success", text: "Permission updated successfully" });
        } catch (error) {
            console.error("Error updating permission:", error);
            setMessage({ type: "error", text: "Failed to update permission" });
        } finally {
            setSaving(null);
        }
    };


    if (!isPresident()) {
        return (
            <div className="flex min-h-screen">
                <NetworkSidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="text-center">
                        <Shield className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
                        <h1 className="text-2xl font-serif text-white mb-2">Access Denied</h1>
                        <p className="text-white/50">Only the President can access settings.</p>
                    </div>
                </main>
            </div>
        );
    }

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case "vice_president": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
            case "general_secretary": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "joint_secretary": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
            default: return "bg-white/10 text-white/70 border-white/20";
        }
    };

    const formatRole = (role) => {
        return role.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };

    return (
        <div className="flex min-h-screen">
            <NetworkSidebar />

            <main className="flex-1 p-6 lg:p-10 pt-24 lg:pt-10 overflow-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Settings className="w-8 h-8 text-teal" />
                        <h1 className="text-3xl lg:text-4xl font-serif font-bold text-white">Settings</h1>
                    </div>
                    <p className="text-white/50">Manage system settings and delegated permissions.</p>
                </motion.div>

                {/* Message Toast */}
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === "success"
                            ? "bg-green-500/10 border border-green-500/20 text-green-400"
                            : "bg-red-500/10 border border-red-500/20 text-red-400"
                            }`}
                    >
                        {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </motion.div>
                )}

                {/* Delegated Permissions Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                        <Shield className="w-5 h-5 text-teal" />
                        <h2 className="text-lg font-serif font-bold text-white">Delegated Permissions</h2>
                    </div>

                    <div className="p-6">
                        <p className="text-white/50 text-sm mb-6">
                            Grant VP, GS, or JS the ability to manage teams and members on your behalf.
                        </p>

                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-8 h-8 text-teal animate-spin" />
                            </div>
                        ) : delegatedUsers.length === 0 ? (
                            <div className="text-center py-10 text-white/30">
                                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No VP, GS, or JS members found.</p>
                                <p className="text-xs mt-1">Add core council members to delegate permissions.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {delegatedUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className="bg-white/5 border border-white/10 rounded-xl p-4"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-white font-medium">{user.full_name || user.email}</h3>
                                                <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] uppercase tracking-widest rounded-full border ${getRoleBadgeColor(user.role)}`}>
                                                    {formatRole(user.role)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Team Management Toggle */}
                                            <div className="flex items-center justify-between bg-black/20 rounded-lg px-4 py-3">
                                                <div>
                                                    <p className="text-white text-sm font-medium">Manage Teams</p>
                                                    <p className="text-white/40 text-xs">Create, edit, delete teams</p>
                                                </div>
                                                <button
                                                    onClick={() => togglePermission(user.id, "can_manage_teams", user.can_manage_teams)}
                                                    disabled={saving === user.id}
                                                    className="relative"
                                                >
                                                    {saving === user.id ? (
                                                        <Loader2 className="w-8 h-8 text-teal animate-spin" />
                                                    ) : user.can_manage_teams ? (
                                                        <ToggleRight className="w-10 h-10 text-teal" />
                                                    ) : (
                                                        <ToggleLeft className="w-10 h-10 text-white/30" />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Member Management Toggle */}
                                            <div className="flex items-center justify-between bg-black/20 rounded-lg px-4 py-3">
                                                <div>
                                                    <p className="text-white text-sm font-medium">Manage Members</p>
                                                    <p className="text-white/40 text-xs">Add, remove members</p>
                                                </div>
                                                <button
                                                    onClick={() => togglePermission(user.id, "can_manage_members", user.can_manage_members)}
                                                    disabled={saving === user.id}
                                                    className="relative"
                                                >
                                                    {saving === user.id ? (
                                                        <Loader2 className="w-8 h-8 text-teal animate-spin" />
                                                    ) : user.can_manage_members ? (
                                                        <ToggleRight className="w-10 h-10 text-teal" />
                                                    ) : (
                                                        <ToggleLeft className="w-10 h-10 text-white/30" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

            </main>
        </div>
    );
}
