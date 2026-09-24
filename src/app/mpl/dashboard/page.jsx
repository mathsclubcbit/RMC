import { redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Users, Shield, User, MessageCircle } from 'lucide-react';
import UserProfileMenu from '../components/UserProfileMenu';
import { getIplTeam } from '@/constants/mpl';
import PreferredIplTeamCard from './PreferredIplTeamCard';

export const metadata = {
    title: 'MPL Team Dashboard | RMC',
};

export default async function MPLDashboard() {
    const supabaseSessionClient = await createClient();
    
    // 1. Get Session using the client that reads cookies
    const { data: { session } } = await supabaseSessionClient.auth.getSession();

    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const whatsappGroupLink = process.env.NEXT_PUBLIC_WHATSAPP_GROUP_LINK;
    
    if (!session) {
        redirect('/mpl/register');
    }

    const userEmail = session.user.email;

    // 2. Fetch Registration
    const admin = createAdminClient();
    
    // Check if user is a player
    const { data: playerRecord } = await admin
        .from('mpl_players')
        .select('*')
        .eq('email', userEmail)
        .single();

    if (!playerRecord) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center py-20 px-4 text-center">
                <div className="max-w-md w-full">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="w-10 h-10 text-red-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">No Squad Found</h1>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        We could not find an active MPL registration associated with your email ({userEmail}).
                    </p>
                    <Link
                        href="/mpl/register"
                        className="inline-block px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        Register or Join a Team
                    </Link>
                </div>
            </div>
        );
    }

    const { data: team } = await admin
        .from('mpl_teams')
        .select('*')
        .eq('id', playerRecord.team_id)
        .single();

    const { data: allPlayers } = await admin
        .from('mpl_players')
        .select('*')
        .eq('team_id', playerRecord.team_id);

    const { data: activeMatchTeam } = await admin
        .from('mpl_match_teams')
        .select('match_id, mpl_matches!inner(id, status, total_questions_per_innings)')
        .eq('team_id', playerRecord.team_id)
        .not('mpl_matches.status', 'in', '(completed,abandoned)')
        .order('created_at', { foreignTable: 'mpl_matches', ascending: false })
        .limit(1)
        .maybeSingle();

    const activeMatch = activeMatchTeam?.mpl_matches || null;

    const isLeader = playerRecord.is_leader;
    const leaderRecord = allPlayers.find(player => player.is_leader);
    const preferredIplTeam = getIplTeam(leaderRecord?.preferred_ipl_team);
    
    // Construct roster
    const roster = allPlayers.map(p => ({
        name: p.name,
        email: p.email,
        rollNo: p.roll_number,
        department: p.branch, // Map branch to department variable for existing UI
        isLeader: p.is_leader,
        avatar_url: p.avatar_url
    }));

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 relative overflow-hidden py-24 px-4 font-sans">
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-900/10 blur-[120px] pointer-events-none" />

            <Link
                href="/events"
                className="fixed top-8 left-8 z-50 flex items-center gap-3 px-5 py-2.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white/10 transition-all group pointer-events-auto"
            >
                <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-300 group-hover:text-white">Home</span>
            </Link>
            <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 50 }} className="pointer-events-auto">
                <UserProfileMenu 
                    avatarUrl={session.user.user_metadata?.avatar_url} 
                    email={session.user.email} 
                />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                    <div>
                        <span className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-4">
                            Team Dashboard
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-2">
                            {team.team_name || 'Unnamed Squad'}
                        </h1>
                        <p className="text-zinc-400 flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-teal-400" />
                            Status: <span className="text-teal-400 font-bold tracking-widest">{team.status}</span>
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-6">
                        <div>
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Invite Code</p>
                            <p className="text-2xl font-mono tracking-widest text-white">{team.team_code}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-reverse md:grid md:grid-cols-3 gap-8">
                    {/* Main Roster Panel */}
                    <div className="md:col-span-2 space-y-6">
                        {activeMatch && (
                            <div className="rounded-3xl border border-teal-400/30 bg-teal-400/10 p-6">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-teal-200">Match control room</p>
                                        <h2 className="mt-2 text-2xl font-bold text-white">Your match is live</h2>
                                        <p className="mt-2 text-sm text-zinc-300">Follow the organiser&apos;s current question and options here.</p>
                                    </div>
                                    <Link href="/mpl/match" className="rounded-xl bg-teal-300 px-5 py-3 text-xs font-bold uppercase tracking-widest text-black hover:bg-teal-200">Join live match</Link>
                                </div>
                            </div>
                        )}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                            <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                                <h2 className="text-xl font-bold flex items-center gap-3">
                                    <Users className="w-5 h-5 text-indigo-400" />
                                    Active Roster
                                </h2>
                                <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded-full text-zinc-300">
                                    {roster.length}/10 Members
                                </span>
                            </div>

                            <div className="space-y-4">
                                {roster.map((member, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            {member.avatar_url ? (
                                                <img src={member.avatar_url} alt={member.name} referrerPolicy="no-referrer" className="w-12 h-12 rounded-full border border-white/20 object-cover" />
                                            ) : (
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                                                    member.isLeader 
                                                        ? 'bg-white text-black' 
                                                        : 'bg-white/10 text-zinc-400'
                                                }`}>
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <p className="font-bold text-zinc-200">{member.name}</p>
                                                    {member.isLeader && (
                                                        <span className="text-[9px] bg-white text-black px-2 py-0.5 rounded-sm uppercase tracking-widest font-bold">
                                                            Team Lead
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 uppercase">
                                                    <span>{member.rollNo}</span>
                                                    <span>•</span>
                                                    <span>{member.department}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {roster.length < 10 && (
                                    <div className="p-4 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-zinc-500 text-sm py-8">
                                        Waiting for more members to join...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-6">
                        {preferredIplTeam ? (
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                                    <img src={preferredIplTeam.logo} alt={preferredIplTeam.name} className="w-12 h-12 object-contain" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Preferred IPL Team</p>
                                    <p className="text-lg font-bold text-white leading-tight">{preferredIplTeam.name}</p>
                                </div>
                            </div>
                        ) : (
                            <PreferredIplTeamCard isLeader={isLeader} />
                        )}

                        <div className="bg-gradient-to-br from-indigo-500/10 to-teal-500/10 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none" />
                            
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-6 relative z-10">Your Role</h3>
                            <div className="relative z-10">
                                {isLeader ? (
                                    <>
                                        <p className="text-3xl font-extrabold mb-2 text-white">Captain</p>
                                        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                                            As the Team Lead, you are responsible for making sure your team shows up on time. Ensure your squad is complete.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-3xl font-extrabold mb-2 text-zinc-300">Member</p>
                                        <p className="text-xs text-zinc-400 leading-relaxed">
                                            You are an active member of this squad. Please coordinate with your Team Lead for updates and schedules.
                                        </p>
                                    </>
                                )}

                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`Join my MPL team "${team.team_name}" using Code: ${team.team_code}. Link: ${baseUrl}/mpl/register?code=${team.team_code}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-white/5 text-[#7df5ae] border border-[#25D366]/40 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-[#25D366]/10 hover:border-[#25D366] transition-colors"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Invite Friends on WhatsApp
                                </a>

                                {whatsappGroupLink && (
                                    <a
                                        href={whatsappGroupLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 w-full flex items-center justify-center gap-2 py-4 bg-[#25D366] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-[#20bd5a] transition-colors shadow-[0_0_24px_rgba(37,211,102,0.28)]"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Join WhatsApp Group
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
