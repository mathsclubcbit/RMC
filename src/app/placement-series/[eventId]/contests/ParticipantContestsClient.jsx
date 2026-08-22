"use client";

import { useState, useEffect } from "react";
import { Swords, Lock, ArrowRight, Loader2, Calendar, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ParticipantContestsClient({ eventId }) {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSigningIn, setIsSigningIn] = useState(false);

    useEffect(() => {
        fetchSessionAndContests();
    }, []);

    const fetchSessionAndContests = async () => {
        setLoading(true);
        try {
            const sessRes = await fetch(`/api/placement-series/session`);
            if (sessRes.ok) {
                const sessData = await sessRes.json();
                setSession(sessData.participant);
            }

            const cRes = await fetch(`/api/placement-series/contests?eventId=${eventId}`);
            if (cRes.ok) {
                const cData = await cRes.json();
                setContests(cData.contests || []);
            }
        } catch (error) {
            console.error("Failed to load:", error);
        } finally {
            setLoading(false);
        }
    };

    // Google Sign-In is the ONLY verification path for contests.
    // complete-profile/route.js sets is_verified: true automatically after Google auth.
    const handleGoogleSignIn = async () => {
        setIsSigningIn(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?eventId=${eventId}`,
                    queryParams: {
                        access_type: "offline",
                        prompt: "select_account",
                    },
                },
            });
            if (error) {
                console.error("OAuth error:", error);
                setIsSigningIn(false);
            }
        } catch (err) {
            console.error("Unexpected sign-in error:", err);
            setIsSigningIn(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-400" /></div>;
    }

    return (
        <div className="min-h-[100dvh] pt-20 sm:pt-24 md:pt-28 pb-12 px-3.5 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-25 z-0">
                <div className="absolute top-10 sm:top-20 right-10 sm:right-20 w-[280px] sm:w-[450px] h-[280px] sm:h-[450px] bg-purple-500/15 blur-[90px] sm:blur-[120px] rounded-full" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10 space-y-8 sm:space-y-10">
                <div className="text-center max-w-2xl mx-auto px-2">
                    <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black mb-3 sm:mb-4 flex items-center justify-center gap-3 sm:gap-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400">
                        <Swords className="w-8 h-8 sm:w-10 sm:h-10 text-teal-400 shrink-0" />
                        Weekly Contests
                    </h1>
                    <p className="text-white/60 text-xs sm:text-sm md:text-base leading-relaxed">
                        Compete in intense, time-bound challenges every week to boost your ranking.
                    </p>
                </div>

                {/* Not logged in at all */}
                {!session && (
                    <div className="text-center py-12 sm:py-20 bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-10 mb-8 relative overflow-hidden group backdrop-blur-xl">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-teal-500/10 to-transparent opacity-50" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl rounded-full" />
                        <div className="relative z-10">
                            <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-teal-500/50 mx-auto mb-4 sm:mb-6 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)] group-hover:scale-110 transition-transform duration-500" />
                            <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 text-white">Unlock the Arena</h3>
                            <p className="text-white/50 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">Please register or solve a Daily Question first to unlock access to the weekly contests.</p>
                            <Link href={`/placement-series/${eventId}`} className="inline-flex items-center justify-center mt-6 sm:mt-8 px-6 sm:px-8 py-3 bg-teal-500 hover:bg-teal-400 text-black font-bold text-sm sm:text-base rounded-xl shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all hover:scale-105 active:scale-95 min-h-[44px]">
                                Go to Daily Challenge
                            </Link>
                        </div>
                    </div>
                )}

                {/* Logged in but NOT verified — prompt Google Sign-In */}
                {session && !session.isVerified && (
                    <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 blur-3xl rounded-full" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
                                <h2 className="text-xl sm:text-2xl font-bold">Verify to Compete</h2>
                            </div>
                            <p className="text-white/50 mb-6 text-xs sm:text-sm leading-relaxed">
                                Contests require Google Sign-In verification to ensure fair play and prevent duplicate accounts.
                                It only takes a second — your progress and streak are kept.
                            </p>

                            <button
                                onClick={handleGoogleSignIn}
                                disabled={isSigningIn}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-60 text-gray-900 font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-teal-500/10 active:scale-[0.98] min-h-[48px] cursor-pointer"
                            >
                                {isSigningIn ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                                ) : (
                                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                )}
                                <span className="text-xs sm:text-sm">
                                    {isSigningIn ? "Redirecting to Google…" : "Verify with Google — it's instant"}
                                </span>
                            </button>

                            <p className="text-white/30 text-[10px] sm:text-xs text-center mt-4">
                                Uses your college Google account. No password stored.
                            </p>
                        </div>
                    </div>
                )}

                {/* Verified — show contests grid */}
                {session?.isVerified && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                        {contests.map((contest) => (
                            <Link
                                href={`/placement-series/${eventId}/contests/${contest.id}`}
                                key={contest.id}
                                className="bg-white/5 border border-white/10 hover:border-teal-400/50 hover:shadow-[0_0_30px_rgba(45,212,191,0.12)] rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 transition-all duration-300 group block hover:-translate-y-1 relative overflow-hidden backdrop-blur-xl"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500/0 via-teal-500/0 to-teal-500/0 group-hover:from-teal-500/50 group-hover:via-emerald-500/50 group-hover:to-teal-500/50 transition-all duration-500" />
                                <div className="flex justify-between items-start mb-4 sm:mb-6 relative z-10 gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                                            <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:py-1 bg-white/10 rounded-md uppercase tracking-wider text-white/80">Week {contest.weekNumber}</span>
                                            <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 ${
                                                contest.status === 'active' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-[0_0_10px_rgba(45,212,191,0.2)]' :
                                                contest.status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                                'bg-white/10 text-white/50'
                                            }`}>
                                                {contest.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />}
                                                {contest.status}
                                            </span>
                                            {contest.hasSubmitted && (
                                                <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md uppercase tracking-wider">
                                                    Attempted
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white group-hover:text-teal-300 transition-colors truncate">{contest.title}</h3>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-black transition-all shrink-0 group-hover:scale-110 shadow-md">
                                        <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-white/60 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-teal-400/60" />
                                        <span>{new Date(contest.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-teal-400/60" />
                                        <span>{contest.durationMinutes} mins</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400/60" />
                                        <span>{contest.totalQuestions} Questions</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {contests.length === 0 && (
                            <div className="col-span-1 sm:col-span-2 text-center py-16 sm:py-20 bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-6">
                                <Swords className="w-10 h-10 sm:w-12 sm:h-12 text-white/20 mx-auto mb-4" />
                                <h3 className="text-lg sm:text-xl font-bold">No contests available</h3>
                                <p className="text-white/50 text-xs sm:text-sm mt-2">Check back later for upcoming challenges.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
