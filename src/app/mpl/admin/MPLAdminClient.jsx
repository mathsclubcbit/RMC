'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { logoutFromMplAdmin } from './actions';
import { useRouter } from 'next/navigation';

export default function MPLAdminClient({ initialTeamsWithPlayers, totalTeams, totalPlayers }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedTeams, setExpandedTeams] = useState(new Set());
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logoutFromMplAdmin();
        router.refresh();
    };

    const toggleTeam = (teamId) => {
        const newExpanded = new Set(expandedTeams);
        if (newExpanded.has(teamId)) {
            newExpanded.delete(teamId);
        } else {
            newExpanded.add(teamId);
        }
        setExpandedTeams(newExpanded);
    };

    // Filter teams based on search query
    const filteredTeams = initialTeamsWithPlayers.filter(team => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        
        // Check team name or code
        if (team.team_name.toLowerCase().includes(query) || team.team_code.toLowerCase().includes(query)) {
            return true;
        }

        // Check players
        return team.players.some(player => 
            player.name.toLowerCase().includes(query) ||
            player.roll_number.toLowerCase().includes(query) ||
            player.branch.toLowerCase().includes(query)
        );
    });

    return (
        <div className="min-h-screen bg-[#050505] text-white py-24 px-4 font-sans selection:bg-white/20 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-teal-900/10 blur-[120px] pointer-events-none" />
            
            <Link
                href="/events"
                className="fixed top-8 left-8 z-50 flex items-center gap-3 px-5 py-2.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white/10 transition-all group"
            >
                <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-300 group-hover:text-white">Events</span>
            </Link>

            <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="fixed top-8 right-8 z-50 flex items-center gap-3 px-5 py-2.5 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-full hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-50"
            >
                <LogOut className="w-4 h-4" />
                <span className="text-[10px] font-bold tracking-widest uppercase">{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
            </button>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                    <div>
                        <span className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-4">
                            Organiser Panel
                        </span>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 mb-6">
                            MPL Registrations
                        </h1>
                        
                        {/* Search Bar */}
                        <div className="relative max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-zinc-500" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search team, name, roll no, branch..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 focus:bg-white/10 transition-all font-mono"
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center min-w-[100px]">
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Teams</p>
                            <p className="text-3xl font-bold text-white">{totalTeams}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center min-w-[100px]">
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Players</p>
                            <p className="text-3xl font-bold text-white">{totalPlayers}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredTeams.length === 0 ? (
                        <div className="text-center py-20 border border-white/10 rounded-3xl bg-white/5">
                            <p className="text-zinc-500 font-mono">No registrations match your search.</p>
                        </div>
                    ) : (
                        filteredTeams.map((team) => (
                            <div key={team.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-200 hover:border-white/20">
                                {/* Compact Team Header (Always Visible) */}
                                <div 
                                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                                    onClick={() => toggleTeam(team.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
                                            {team.team_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-lg font-bold text-white">{team.team_name}</h2>
                                                <span className="text-[9px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-sm uppercase tracking-widest border border-teal-500/20">
                                                    {team.status}
                                                </span>
                                            </div>
                                            <p className="text-xs font-mono text-zinc-500">
                                                Code: {team.team_code}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                                        <div className="text-left md:text-right">
                                            <p className="text-sm font-bold text-white mb-0.5">{team.players.length}/10</p>
                                            <p className="text-[9px] uppercase tracking-widest text-zinc-500">Members</p>
                                        </div>
                                        <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                                            {expandedTeams.has(team.id) ? (
                                                <>Hide Details <ChevronUp className="w-4 h-4" /></>
                                            ) : (
                                                <>View Details <ChevronDown className="w-4 h-4" /></>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Player Details */}
                                {expandedTeams.has(team.id) && (
                                    <div className="border-t border-white/10 bg-black/40 p-5 overflow-x-auto">
                                        <table className="w-full text-left text-sm text-zinc-300">
                                            <thead className="text-[10px] text-zinc-500 uppercase tracking-widest bg-white/5">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-l-lg">Role</th>
                                                    <th className="px-4 py-3">Name</th>
                                                    <th className="px-4 py-3">Roll No</th>
                                                    <th className="px-4 py-3">Email</th>
                                                    <th className="px-4 py-3">Phone</th>
                                                    <th className="px-4 py-3">Branch/Year</th>
                                                    <th className="px-4 py-3 rounded-r-lg">Section</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {team.players.map((player) => (
                                                    <tr key={player.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-3">
                                                            {player.is_leader ? (
                                                                <span className="text-[9px] bg-white text-black px-2 py-0.5 rounded-sm font-bold uppercase tracking-widest">Leader</span>
                                                            ) : (
                                                                <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Player</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-white">{player.name}</td>
                                                        <td className="px-4 py-3 font-mono text-xs">{player.roll_number}</td>
                                                        <td className="px-4 py-3 text-xs">{player.email}</td>
                                                        <td className="px-4 py-3 font-mono text-xs">{player.phone_number}</td>
                                                        <td className="px-4 py-3 text-xs">{player.branch} ({player.year})</td>
                                                        <td className="px-4 py-3 text-xs">{player.section || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
