"use client";

import { useState, useEffect } from "react";
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
    Key
} from "lucide-react";

export default function MyTeamPage() {
    const { profile } = useAuth();
    const [myTeams, setMyTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchMyTeams();
    }, [profile]);

    const fetchMyTeams = async () => {
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
        } catch (error) {
            console.error("Error fetching my teams:", error);
        } finally {
            setLoading(false);
        }
    };

    const getHead = (team) => {
        const headMember = team.team_members?.find(m => m.role === "head");
        return headMember?.profiles;
    };

    const getMembers = (team) => {
        return team.team_members?.filter(m => m.role === "member").map(m => m.profiles) || [];
    };

    if (loading) {
        return (
            <div className="flex min-h-screen">
                <NetworkSidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-teal animate-spin" />
                </main>
            </div>
        );
    }

    if (myTeams.length === 0) {
        return (
            <div className="flex min-h-screen">
                <NetworkSidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="text-center">
                        <Users className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <h1 className="text-2xl font-serif text-white mb-2">No Teams</h1>
                        <p className="text-white/50">You're not part of any team yet.</p>
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
                                                        You're the Head
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-white/40 text-sm mt-1">{team.description || "No description"}</p>
                                        </div>
                                        <span className={`px-3 py-1 text-xs uppercase tracking-widest rounded-full ${team.type === "fest"
                                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                                : "bg-teal/20 text-teal border border-teal/30"
                                            }`}>
                                            {team.type === "fest" ? "Fest Team" : "General Team"}
                                        </span>
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
                                                        className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl"
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
        </div>
    );
}
