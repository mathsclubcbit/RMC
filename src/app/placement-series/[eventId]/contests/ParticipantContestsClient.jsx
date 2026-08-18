"use client";

import { useState, useEffect } from "react";
import { Swords, Lock, ArrowRight, Loader2, Calendar, Clock, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ParticipantContestsClient({ eventId }) {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);

    // OTP Auth State
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState("");
    const [authSuccess, setAuthSuccess] = useState("");

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

    const handleRequestOtp = async () => {
        setIsAuthenticating(true);
        setAuthError("");
        setAuthSuccess("");
        try {
            const res = await fetch(`/api/placement-series/request-otp`, { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                setOtpSent(true);
                setAuthSuccess("OTP sent to your email! (Valid for 10 mins)");
            } else {
                setAuthError(data.error || "Failed to send OTP");
            }
        } catch (error) {
            setAuthError("Network error.");
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsAuthenticating(true);
        setAuthError("");
        setAuthSuccess("");
        try {
            const res = await fetch(`/api/placement-series/verify-otp`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp })
            });
            const data = await res.json();
            if (res.ok) {
                setAuthSuccess("Successfully verified!");
                setSession(prev => ({ ...prev, isVerified: true }));
                setOtpSent(false);
            } else {
                setAuthError(data.error || "Invalid OTP");
            }
        } catch (error) {
            setAuthError("Network error.");
        } finally {
            setIsAuthenticating(false);
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

                {session && !session.isVerified && (
                    <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl" />
                        <div className="relative">
                            <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2">
                                <KeyRound className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400" />
                                Verify Identity
                            </h2>
                            <p className="text-white/50 mb-5 sm:mb-6 text-xs sm:text-sm leading-relaxed">To prevent cheating, contests require email verification. We will send an OTP to {session.email}</p>
                            
                            {authError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-4 text-xs sm:text-sm">{authError}</div>}
                            {authSuccess && <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl mb-4 text-xs sm:text-sm">{authSuccess}</div>}

                            {!otpSent ? (
                                <button 
                                    onClick={handleRequestOtp} 
                                    disabled={isAuthenticating}
                                    className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all min-h-[48px] active:scale-95 cursor-pointer shadow-lg shadow-teal-500/20"
                                >
                                    {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
                                </button>
                            ) : (
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <input 
                                        required type="text" placeholder="Enter 6-digit OTP" 
                                        value={otp} onChange={e => setOtp(e.target.value)} 
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-400/60 outline-none transition-all text-center font-mono text-lg sm:text-xl tracking-[0.2em] sm:tracking-[0.5em] text-white min-h-[48px]"
                                        maxLength={6}
                                    />
                                    <button 
                                        disabled={isAuthenticating || otp.length < 6} type="submit" 
                                        className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all min-h-[48px] active:scale-95 cursor-pointer shadow-lg shadow-teal-500/20"
                                    >
                                        {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Unlock"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}

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
