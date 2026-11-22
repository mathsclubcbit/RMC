"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Trophy, Clock, CheckCircle2, XCircle, ChevronLeft, Target, Loader2, Check } from "lucide-react";
import Link from "next/link";

const DIFFICULTY_COLORS = {
    easy: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
    medium: "text-amber-400 bg-amber-500/20 border-amber-500/30",
    hard: "text-red-400 bg-red-500/20 border-red-500/30",
};

function formatTime(seconds) {
    if (!seconds && seconds !== 0) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

export default function QuizResultClient({ eventId }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("sessionId");
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!sessionId) {
            router.replace(`/quiz/${eventId}`);
            return;
        }

        // Try to load from session storage first (immediate feedback after submit)
        const cached = sessionStorage.getItem("quiz_result");
        if (cached) {
            const data = JSON.parse(cached);
            if (data.sessionId === sessionId) {
                // If it's a cached submit response, it doesn't have the full review or rank.
                // We show it temporarily while fetching full results.
                setResult(data);
            }
        }

        fetchResult();
    }, [sessionId]);

    const fetchResult = async () => {
        try {
            const res = await fetch(`/api/quiz/results?eventId=${eventId}&sessionId=${sessionId}`);
            const data = await res.json();
            
            if (res.ok) {
                setResult(data);
                // Clear the cached submit response since we have the full data now
                sessionStorage.removeItem("quiz_result");
            } else {
                setError(data.error || "Failed to load results");
            }
        } catch (err) {
            console.error("Fetch result error:", err);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
                <XCircle className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-xl font-bold mb-2">Error Loading Results</h1>
                <p className="text-white/50 mb-6">{error}</p>
                <Link href={`/quiz/${eventId}`} className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
                    Go Back
                </Link>
            </div>
        );
    }

    if (loading && !result) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-400" /></div>;
    }

    const { session = {}, summary = {}, rank, totalParticipants, review } = result || {};
    const { score = 0, totalPossible = 0, timeTakenSeconds = 0, participantName } = session;
    const { totalQuestions = 0, answered = 0, correct = 0, incorrect = 0, unanswered = 0, accuracy = 0 } = summary;

    return (
        <div className="min-h-screen bg-black text-white px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Main Score Card */}
                    <div className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-teal-500/20 to-teal-900/10 border border-teal-500/20 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-teal-500/5 backdrop-blur-3xl" />
                        <div className="relative z-10">
                            {result?.autoSubmitted && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold mb-4 border border-amber-500/30">
                                    <Clock className="w-3.5 h-3.5" /> Auto-submitted (Time's Up)
                                </div>
                            )}
                            <h2 className="text-sm uppercase tracking-widest text-teal-300/70 font-bold mb-2">Final Score</h2>
                            <div className="text-7xl font-black text-white mb-2 tracking-tighter drop-shadow-2xl">
                                {score}<span className="text-3xl text-white/30 font-bold tracking-normal">/{totalPossible}</span>
                            </div>
                            <p className="text-teal-200/60 font-medium">Great effort, {participantName}!</p>
                        </div>
                    </div>

                    {/* Rank Card */}
                    <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 text-center flex flex-col justify-center relative group overflow-hidden">
                        <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 opacity-0 group-hover:opacity-100 transition duration-1000 blur-xl" />
                        <div className="relative z-10">
                            <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-3 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                            <div className="text-4xl font-black text-white tracking-tighter">
                                {rank ? `#${rank}` : "—"}
                            </div>
                            <div className="text-xs text-white/40 uppercase tracking-wider font-bold mt-2">
                                out of {totalParticipants || "—"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
                    {[
                        { label: "Questions", value: totalQuestions, icon: Target, color: "text-white" },
                        { label: "Correct", value: correct, icon: CheckCircle2, color: "text-emerald-400" },
                        { label: "Incorrect", value: incorrect, icon: XCircle, color: "text-red-400" },
                        { label: "Accuracy", value: `${accuracy}%`, icon: Target, color: "text-teal-400" },
                        { label: "Time Taken", value: formatTime(timeTakenSeconds), icon: Clock, color: "text-amber-400" },
                    ].map((s, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center">
                            <s.icon className={`w-5 h-5 mb-2 opacity-50 ${s.color}`} />
                            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                            <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Review Section */}
                {review && review.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-teal-400" />
                            Question Review
                        </h3>
                        <div className="space-y-4">
                            {review.map((q, idx) => {
                                const isUnanswered = !q.answered;
                                const isCorrect = q.isCorrect;
                                
                                return (
                                    <div key={q.questionId} className={`p-5 rounded-2xl border ${isUnanswered ? 'bg-white/[0.02] border-white/10' : isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-white/40 font-mono text-sm">Q{idx + 1}.</span>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[q.difficulty]}`}>
                                                    {q.difficulty} · {q.points}pt
                                                </span>
                                            </div>
                                            <div>
                                                {isUnanswered ? (
                                                    <span className="text-xs font-bold px-2 py-1 rounded bg-white/10 text-white/50">Unanswered</span>
                                                ) : isCorrect ? (
                                                    <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">+ {q.points}</span>
                                                ) : (
                                                    <span className="text-xs font-bold px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">Wrong</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <p className="text-sm font-medium text-white/90 mb-4">{q.questionText}</p>
                                        
                                        <div className="space-y-2">
                                            {q.options.map((opt, oi) => {
                                                const isSelected = q.selectedOption === oi;
                                                const isActualCorrect = q.correctOption === oi;
                                                
                                                let stateClass = "bg-white/[0.02] border-white/10 text-white/50";
                                                
                                                if (isSelected && isActualCorrect) {
                                                    stateClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-medium";
                                                } else if (isSelected && !isActualCorrect) {
                                                    stateClass = "bg-red-500/20 border-red-500/50 text-red-400";
                                                } else if (!isSelected && isActualCorrect && q.correctOption !== undefined) {
                                                    stateClass = "bg-emerald-500/5 border-emerald-500/30 text-emerald-400/80 border-dashed";
                                                }
                                                
                                                return (
                                                    <div key={oi} className={`px-4 py-3 rounded-xl border text-sm flex items-center justify-between transition-colors ${stateClass}`}>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-current text-white/90' : 'bg-white/5'}`}>
                                                                {String.fromCharCode(65 + oi)}
                                                            </span>
                                                            <span>{opt}</span>
                                                        </div>
                                                        {isSelected && isActualCorrect && <CheckCircle2 className="w-4 h-4" />}
                                                        {isSelected && !isActualCorrect && <XCircle className="w-4 h-4" />}
                                                        {!isSelected && isActualCorrect && q.correctOption !== undefined && <Check className="w-4 h-4" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
