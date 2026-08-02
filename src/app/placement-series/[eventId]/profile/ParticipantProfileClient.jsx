"use client";

import { useState, useEffect } from "react";
import { User, Medal, Flame, Calendar, Award, Share2, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ParticipantProfileClient({ eventId }) {
    const [session, setSession] = useState(null);
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const sessRes = await fetch(`/api/placement-series/session`);
            if (sessRes.ok) {
                const sessData = await sessRes.json();
                setSession(sessData.participant);
                
                if (sessData.participant) {
                    const badgeRes = await fetch(`/api/placement-series/badges`);
                    if (badgeRes.ok) {
                        const badgeData = await badgeRes.json();
                        setBadges(badgeData.badges || []);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleShareLinkedIn = (badge) => {
        const url = encodeURIComponent(window.location.origin);
        const text = encodeURIComponent(badge.linkedinText || `I just earned the ${badge.badgeLabel} badge in the RMC Placement Series! 🚀`);
        window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${text} %0A%0A${url}`, '_blank');
    };

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-400" /></div>;
    }

    if (!session) {
        return (
            <div className="min-h-[100dvh] pt-24 pb-12 px-4 flex items-center justify-center bg-black">
                <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl max-w-md w-full p-8">
                    <User className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Not Logged In</h3>
                    <p className="text-white/50 mb-6 text-sm">You need to register for the Placement Series first.</p>
                    <Link href={`/placement-series/${eventId}`} className="inline-block px-6 py-3 bg-teal-500 text-black font-bold rounded-xl w-full">
                        Join Now
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] pt-24 pb-12 px-4 relative">
            <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                
                {/* Profile Header */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 backdrop-blur-xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 p-1 shrink-0">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-4xl font-bold">
                                {session.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                <h1 className="text-3xl font-bold">{session.name}</h1>
                                {session.isVerified && (
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold uppercase tracking-widest rounded">Verified</span>
                                )}
                            </div>
                            <p className="text-white/50 font-mono mb-4">{session.rollNo} • {session.email}</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                                <div className="flex flex-col items-center md:items-start gap-1 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/10 hover:-translate-y-0.5 transition-all">
                                    <div className="flex items-center gap-2 text-orange-400">
                                        <Flame className="w-5 h-5 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-white/50">Streak</span>
                                    </div>
                                    <div className="font-mono font-bold text-2xl text-white">{session.streakCurrent}</div>
                                </div>
                                <div className="flex flex-col items-center md:items-start gap-1 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/10 hover:-translate-y-0.5 transition-all">
                                    <div className="flex items-center gap-2 text-teal-400">
                                        <Medal className="w-5 h-5 drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-white/50">Badges</span>
                                    </div>
                                    <div className="font-mono font-bold text-2xl text-white">{badges.length}</div>
                                </div>
                                <div className="flex flex-col items-center md:items-start gap-1 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/10 hover:-translate-y-0.5 transition-all">
                                    <div className="flex items-center gap-2 text-purple-400">
                                        <Calendar className="w-5 h-5 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-white/50">Joined</span>
                                    </div>
                                    <div className="font-bold text-sm text-white mt-1">{new Date(session.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Badges Section */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Award className="w-6 h-6 text-teal-400" />
                        My Achievements
                    </h2>

                    {badges.length === 0 ? (
                        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl">
                            <Medal className="w-12 h-12 text-white/20 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">No Badges Yet</h3>
                            <p className="text-white/50 text-sm max-w-md mx-auto">
                                Keep answering daily questions to build your streak, and participate in weekly contests to earn exclusive badges!
                            </p>
                            <Link href={`/placement-series/${eventId}`} className="inline-flex items-center gap-2 mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 transition-colors text-white font-medium rounded-xl">
                                Start Solving <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {badges.map((badge) => (
                                <div key={badge.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 group hover:border-teal-500/30 transition-all">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-b from-white/20 to-white/5 border border-white/30 shadow-[inset_0_1px_4px_rgba(255,255,255,0.4),0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center text-4xl group-hover:scale-110 group-hover:rotate-[10deg] group-hover:border-teal-400 group-hover:shadow-[0_0_30px_rgba(45,212,191,0.6),inset_0_1px_4px_rgba(255,255,255,0.8)] transition-all duration-300 backdrop-blur-md">
                                        <span className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">{badge.badgeIcon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-1">{badge.badgeType.replace('_', ' ')}</div>
                                        <h3 className="text-xl font-bold mb-1">{badge.badgeLabel}</h3>
                                        <p className="text-white/40 text-xs mb-4">Earned on {new Date(badge.earnedAt).toLocaleDateString()}</p>
                                        
                                        <button 
                                            onClick={() => handleShareLinkedIn(badge)}
                                            className="inline-flex items-center justify-center sm:justify-start gap-2 text-sm font-medium text-[#0A66C2] hover:text-[#004182] bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
                                        >
                                            <Share2 className="w-4 h-4" /> Share to LinkedIn
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
            </div>
        </div>
    );
}
