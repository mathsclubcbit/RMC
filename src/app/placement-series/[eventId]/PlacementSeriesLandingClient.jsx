"use client";

import { useState, useEffect } from "react";
import { Loader2, CalendarDays, CheckCircle2, XCircle, Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function PlacementSeriesLandingClient({ eventId }) {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Auth State
    const [isSigningIn, setIsSigningIn] = useState(false);

    // Answer State
    const [submittingId, setSubmittingId] = useState(null);

    useEffect(() => {
        fetchSessionAndQuestions();
    }, []);

    const fetchSessionAndQuestions = async () => {
        setLoading(true);
        try {
            // 1. Fetch Session
            const sessRes = await fetch(`/api/placement-series/session`);
            if (sessRes.ok) {
                const sessData = await sessRes.json();
                setSession(sessData.participant);
            }

            // 2. Fetch Daily Questions
            const qRes = await fetch(`/api/placement-series/daily?eventId=${eventId}`);
            if (qRes.ok) {
                const qData = await qRes.json();
                setQuestions(qData.questions || []);
            }
        } catch (error) {
            console.error("Failed to load:", error);
        } finally {
            setLoading(false);
        }
    };

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
                toast.error("Failed to initiate Google Sign-In. Please try again.");
                console.error("OAuth error:", error);
                setIsSigningIn(false);
            }
        } catch (err) {
            toast.error("An unexpected error occurred.");
            setIsSigningIn(false);
        }
    };

    const submitAnswer = async (dailyQuestionId, selectedOption) => {
        if (!session) {
            toast.error("Please login first.");
            return;
        }
        
        setSubmittingId(dailyQuestionId);
        try {
            const res = await fetch(`/api/placement-series/daily/submit`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dailyQuestionId, selectedOption })
            });
            const data = await res.json();
            
            if (res.ok) {
                if (data.isCorrect) {
                    toast.success("Correct Answer!");
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#2dd4bf', '#ffffff', '#0f766e']
                    });
                } else {
                    toast.error("Incorrect Answer.");
                }
                
                // Update local state to show result immediately
                setQuestions(prev => prev.map(q => {
                    if (q.id === dailyQuestionId) {
                        return {
                            ...q,
                            submission: {
                                selectedOption,
                                isCorrect: data.isCorrect,
                                explanation: data.explanation
                            }
                        };
                    }
                    return q;
                }));
                
                // Update streak locally
                setSession(prev => ({...prev, streakCurrent: data.streakCurrent}));
                
            } else {
                if (data.error === 'already_submitted') {
                    toast.error("You have already submitted an answer for this question.");
                } else {
                    toast.error(data.error || "Failed to submit answer");
                }
            }
        } catch (error) {
            console.error("Submit error:", error);
        } finally {
            setSubmittingId(null);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-400" /></div>;
    }

    return (
        <div className="min-h-[100dvh] pt-24 pb-12 px-4 relative">
            <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute top-20 left-20 w-[400px] h-[400px] bg-teal-500/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-20 right-20 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400">
                        Daily Challenge
                    </h1>
                    <p className="text-white/60 max-w-2xl mx-auto">
                        Solve exactly 3 questions every day to build your streak, earn badges, and prepare for the weekly contests.
                    </p>
                </div>

                {!session && (
                    <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 mb-12 backdrop-blur-xl">
                        <h2 className="text-2xl font-bold mb-2">Join the Series</h2>
                        <p className="text-white/50 mb-6 text-sm">
                            Log in with your Google Account to track your daily streak and prepare for contests.
                        </p>

                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isSigningIn}
                            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-60 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
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
                            <span>{isSigningIn ? "Redirecting to Google…" : "Continue with Google"}</span>
                        </button>
                    </div>
                )}

                {session && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 mb-4 sm:mb-0">
                            <p className="text-sm text-white/50">Welcome back,</p>
                            <p className="font-bold text-xl text-white">{session.name}</p>
                        </div>
                        <div className="relative z-10 w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 bg-orange-500/10 px-5 py-3 rounded-xl border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                            <div className="animate-pulse">
                                <Flame className={`w-6 h-6 ${session.streakCurrent > 0 ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'text-white/30'}`} />
                            </div>
                            <div>
                                <p className="text-xs text-orange-200/70 font-medium uppercase tracking-wider mb-0.5">Current Streak</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="font-bold font-mono text-xl text-orange-400">{session.streakCurrent} Days</p>
                                    <p className="text-[10px] text-orange-300/50 hidden md:block">Keep it alive today!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {questions.length === 0 ? (
                        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl">
                            <CalendarDays className="w-12 h-12 text-white/20 mx-auto mb-4" />
                            <h3 className="text-xl font-bold">No Questions Yet</h3>
                            <p className="text-white/50 mt-2">Today's challenges haven't been posted. Check back soon!</p>
                        </div>
                    ) : (
                        questions.map((q, idx) => {
                            const isSubmitted = !!q.submission;
                            
                            return (
                                <div key={q.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:border-teal-500/40 hover:shadow-[0_0_30px_rgba(45,212,191,0.05)] transition-all duration-300 hover:-translate-y-1">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500/0 via-teal-500/0 to-teal-500/0 group-hover:from-teal-500/50 group-hover:via-emerald-500/50 group-hover:to-teal-500/50 transition-all duration-500" />
                                    <div className="flex items-start gap-4 mb-6 relative z-10">
                                        <div className="w-10 h-10 shrink-0 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-lg border border-teal-500/20 shadow-inner">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="flex gap-2 mb-2">
                                                <span className="text-xs font-semibold px-2 py-0.5 bg-white/10 rounded-md text-white/70">{q.category}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md shadow-sm border ${
                                                    q.difficulty === 'hard' ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/30 text-red-300' : 
                                                    q.difficulty === 'medium' ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-300' : 
                                                    'bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-500/30 text-green-300'
                                                }`}>{q.difficulty}</span>
                                            </div>
                                            <h3 className="text-xl font-medium leading-relaxed">{q.questionText}</h3>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 md:pl-14 mt-4 md:mt-0">
                                        {q.options.map((opt, oIdx) => {
                                            const isSelected = isSubmitted && q.submission.selectedOption === oIdx;
                                            
                                            // Determine styles if submitted
                                            let btnClass = "bg-black/50 border-white/10 hover:border-teal-500/50 hover:bg-white/5 text-white/70 hover:scale-[1.01] hover:shadow-lg";
                                            if (isSubmitted) {
                                                if (isSelected) {
                                                    btnClass = q.submission.isCorrect 
                                                        ? "bg-green-500/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)] text-green-300 scale-[1.02] z-10"
                                                        : "bg-red-500/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] text-red-300 scale-[1.02] z-10";
                                                } else {
                                                    btnClass = "bg-black/50 border-white/5 text-white/30 cursor-not-allowed opacity-50";
                                                }
                                            }

                                            return (
                                                <button 
                                                    key={oIdx}
                                                    disabled={isSubmitted || submittingId === q.id}
                                                    onClick={() => submitAnswer(q.id, oIdx)}
                                                    className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all duration-200 transform ${btnClass} ${submittingId === q.id ? 'scale-[0.98] opacity-80' : ''}`}
                                                >
                                                    <span className="w-6 h-6 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold font-mono">
                                                        {String.fromCharCode(65 + oIdx)}
                                                    </span>
                                                    <span className="font-medium">{opt}</span>
                                                    
                                                    {isSubmitted && isSelected && (
                                                        <div className="ml-auto">
                                                            {q.submission.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {isSubmitted && q.submission.explanation && (
                                        <div className="mt-6 pl-0 md:pl-14">
                                            <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
                                                <p className="text-sm font-bold text-teal-400 mb-1">Explanation</p>
                                                <p className="text-white/70 text-sm leading-relaxed">{q.submission.explanation}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
