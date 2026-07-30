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
        <div className="min-h-[100dvh] pt-24 pb-12 px-4 relative">
            <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 flex items-center justify-center gap-4">
                        <Swords className="w-10 h-10 text-teal-400" />
                        Weekly Contests
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto">
                        Compete in intense, time-bound challenges every week to boost your ranking.
                    </p>
                </div>

                {!session && (
                    <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl mb-8">
                        <Lock className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-xl font-bold">Authentication Required</h3>
                        <p className="text-white/50 mt-2">Please register or solve a Daily Question first to unlock contests.</p>
                        <Link href={`/placement-series/${eventId}`} className="inline-block mt-6 px-6 py-2 bg-teal-500 text-black font-bold rounded-xl">
                            Go to Daily Challenge
                        </Link>
                    </div>
                )}

                {session && !session.isVerified && (
                    <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 mb-12 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl" />
                        <div className="relative">
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                <KeyRound className="w-6 h-6 text-teal-400" />
                                Verify Identity
                            </h2>
                            <p className="text-white/50 mb-6 text-sm">To prevent cheating, contests require email verification. We will send an OTP to {session.email}</p>
                            
                            {authError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-4 text-sm">{authError}</div>}
                            {authSuccess && <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl mb-4 text-sm">{authSuccess}</div>}

                            {!otpSent ? (
                                <button 
                                    onClick={handleRequestOtp} 
                                    disabled={isAuthenticating}
                                    className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
                                </button>
                            ) : (
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <input 
                                        required type="text" placeholder="Enter 6-digit OTP" 
                                        value={otp} onChange={e => setOtp(e.target.value)} 
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-400/50 outline-none transition-colors text-center font-mono text-xl tracking-[0.5em]" 
                                        maxLength={6}
                                    />
                                    <button 
                                        disabled={isAuthenticating || otp.length < 6} type="submit" 
                                        className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                    >
                                        {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Unlock"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {session?.isVerified && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contests.map((contest) => (
                            <Link 
                                href={`/placement-series/${eventId}/contests/${contest.id}`} 
                                key={contest.id}
                                className="bg-white/5 border border-white/10 hover:border-teal-400/50 rounded-3xl p-6 transition-all group block"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold px-3 py-1 bg-white/10 rounded-md uppercase tracking-wider">Week {contest.weekNumber}</span>
                                            <span className={`text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider ${
                                                contest.status === 'active' ? 'bg-teal-500/20 text-teal-300' :
                                                contest.status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-300' :
                                                'bg-white/10 text-white/50'
                                            }`}>
                                                {contest.status}
                                            </span>
                                            {contest.hasSubmitted && (
                                                <span className="text-xs font-bold px-3 py-1 bg-purple-500/20 text-purple-300 rounded-md uppercase tracking-wider">
                                                    Attempted
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-bold">{contest.title}</h3>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-black transition-colors shrink-0">
                                        <ArrowRight className="w-6 h-6" />
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-4 text-sm text-white/60">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-teal-500/50" />
                                        <span>{new Date(contest.startsAt).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-teal-500/50" />
                                        <span>{contest.durationMinutes} mins</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
                                        <span>{contest.totalQuestions} Questions</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {contests.length === 0 && (
                            <div className="col-span-1 md:col-span-2 text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                                <Swords className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                <h3 className="text-xl font-bold">No contests available</h3>
                                <p className="text-white/50 mt-2">Check back later for upcoming challenges.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
