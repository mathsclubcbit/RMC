"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChevronLeft, ChevronRight, Flag, Send, Loader2, AlertTriangle, CheckCircle2, Crosshair, HelpCircle, AlertOctagon } from "lucide-react";

const DIFFICULTY_BADGES = {
    easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
    hard: "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
};

export default function QuizPlayClient({ eventId }) {
    const router = useRouter();
    const [sessionData, setSessionData] = useState(null);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState({});
    const [flagged, setFlagged] = useState(new Set());
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [tabWarning, setTabWarning] = useState(false);
    const [animationKey, setAnimationKey] = useState(0); // To force re-trigger animations
    const timerRef = useRef(null);

    // Load session from sessionStorage
    useEffect(() => {
        const raw = sessionStorage.getItem("quiz_session");
        if (!raw) {
            router.replace(`/quiz/${eventId}`);
            return;
        }
        const data = JSON.parse(raw);
        setSessionData(data);

        // Calculate remaining time
        const startedAt = new Date(data.startedAt);
        const durationMs = (data.durationMinutes || 20) * 60 * 1000;
        const endTime = startedAt.getTime() + durationMs;
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
            handleAutoSubmit(data);
        }
    }, []);

    // Timer countdown
    useEffect(() => {
        if (timeLeft <= 0 || !sessionData) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleAutoSubmit(sessionData);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [sessionData]);

    // Tab switch detection
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                setTabSwitchCount(prev => {
                    const next = prev + 1;
                    if (next <= 3) {
                        setTabWarning(true);
                        setTimeout(() => setTabWarning(false), 3000);
                    }
                    return next;
                });
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showConfirm || isSubmitting || !sessionData) return;

            const questions = sessionData.questions;
            if (!questions) return;
            const question = questions[currentQ];

            // Number keys 1-4 for options
            if (['1', '2', '3', '4'].includes(e.key)) {
                const index = parseInt(e.key) - 1;
                if (index < question.options.length) {
                    selectAnswer(question.questionId, index);
                }
            }
            // Arrow keys for navigation
            else if (e.key === 'ArrowRight') {
                if (currentQ < questions.length - 1) changeQuestion(currentQ + 1);
            }
            else if (e.key === 'ArrowLeft') {
                if (currentQ > 0) changeQuestion(currentQ - 1);
            }
            // F key for flag
            else if (e.key.toLowerCase() === 'f') {
                toggleFlag(currentQ);
            }
            // Enter key to open submit modal
            else if (e.key === 'Enter' && currentQ === questions.length - 1) {
                handleSubmit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentQ, showConfirm, isSubmitting, sessionData]);

    const changeQuestion = (newIndex) => {
        if (newIndex === currentQ) return;
        setCurrentQ(newIndex);
        setAnimationKey(prev => prev + 1); // Retrigger slide animation
    };

    const handleAutoSubmit = useCallback(async (data) => {
        const session = data || sessionData;
        if (!session) return;
        await submitQuiz(session, true);
    }, [sessionData, answers]);

    const submitQuiz = async (session, isAuto = false) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/quiz/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: session.sessionId,
                    answers,
                    tabSwitchCount,
                }),
            });
            const data = await res.json();

            // Clear session storage
            sessionStorage.removeItem("quiz_session");

            // Store result for results page
            sessionStorage.setItem("quiz_result", JSON.stringify({
                ...data,
                sessionId: session.sessionId,
                participantName: session.participantName,
                eventId,
                autoSubmitted: isAuto,
            }));

            router.replace(`/quiz/${eventId}/results?sessionId=${session.sessionId}`);
        } catch (err) {
            console.error("Submit failed:", err);
            setIsSubmitting(false);
        }
    };

    const handleSubmit = () => setShowConfirm(true);
    
    const confirmSubmit = () => {
        setShowConfirm(false);
        submitQuiz(sessionData, false);
    };

    const selectAnswer = (questionId, optionIndex) => {
        // Trigger a tiny haptic-like bump using state (CSS handles scale on active)
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const toggleFlag = (qIndex) => {
        setFlagged(prev => {
            const next = new Set(prev);
            if (next.has(qIndex)) next.delete(qIndex);
            else next.add(qIndex);
            return next;
        });
    };

    const formatTimer = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    if (!sessionData) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center relative overflow-hidden">
                <Loader2 className="w-10 h-10 animate-spin text-teal-400 relative z-10" />
            </div>
        );
    }

    const questions = sessionData.questions || [];
    const question = questions[currentQ];
    const totalAnswered = Object.keys(answers).length;
    const isTimeCritical = timeLeft <= 60;
    const timerPercent = sessionData ? (timeLeft / (sessionData.durationMinutes * 60)) * 100 : 100;

    return (
        <div className={`min-h-screen bg-[#050505] text-white flex flex-col relative overflow-hidden transition-colors duration-1000 ${isTimeCritical ? 'shadow-[inset_0_0_150px_rgba(239,68,68,0.15)]' : ''}`}>
            
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-600/5 to-transparent pointer-events-none" />
            {isTimeCritical && (
                <div className="absolute inset-0 bg-red-500/5 pointer-events-none animate-pulse duration-1000" />
            )}

            {/* Tab Switch Warning */}
            {tabWarning && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-red-500/90 backdrop-blur-md text-white font-bold text-sm flex items-center gap-3 animate-in slide-in-from-top-4 shadow-[0_0_40px_rgba(239,68,68,0.5)]">
                    <AlertOctagon className="w-5 h-5 animate-pulse" /> FOCUS LOST! Return to the quiz immediately. ({tabSwitchCount}/3)
                </div>
            )}

            {/* Top HUD / Timer Bar */}
            <div className="relative z-40 bg-black/40 backdrop-blur-xl border-b border-white/5">
                <div className="h-1 bg-white/5 w-full">
                    <div
                        className={`h-full transition-all duration-1000 ease-linear ${isTimeCritical ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "bg-teal-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]"}`}
                        style={{ width: `${timerPercent}%` }}
                    />
                </div>
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                            <Crosshair className="w-4 h-4 text-teal-400" />
                            <span className="text-xs font-bold tracking-widest uppercase">{sessionData.participantName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-white/50 font-mono tracking-widest">Q {currentQ + 1}/{questions.length}</span>
                            <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-md border ${DIFFICULTY_BADGES[question?.difficulty] || ""}`}>
                                {question?.difficulty} · {question?.points}pt
                            </span>
                        </div>
                    </div>
                    
                    {/* Centered Timer */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 mt-0.5">
                        <div className={`flex items-center gap-2 font-mono text-2xl font-black px-4 py-1 rounded-xl backdrop-blur-md ${isTimeCritical ? "text-red-400 animate-pulse bg-red-500/10 border border-red-500/20" : "text-white bg-white/[0.02] border border-white/5"}`}>
                            <Clock className={`w-5 h-5 ${isTimeCritical ? 'animate-bounce' : ''}`} />
                            {formatTimer(timeLeft)}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-xs text-white/40 uppercase tracking-widest font-mono">
                            <strong className="text-white">{totalAnswered}</strong> / {questions.length} locked
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Battlefield */}
            <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-4 py-8 gap-8 relative z-10">
                
                {/* Question Panel */}
                <div className="flex-1 flex flex-col h-full min-h-[60vh]">
                    {question && (
                        <div key={animationKey} className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-500 fade-in fill-mode-both">
                            
                            <div className="mb-10 p-8 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl relative">
                                <div className="absolute top-0 left-8 w-16 h-1 bg-teal-500/50 rounded-b-full" />
                                <h2 className="text-2xl md:text-3xl font-medium text-white/95 leading-relaxed tracking-tight">
                                    {question.questionText}
                                </h2>
                            </div>

                            <div className="space-y-4 flex-1">
                                {question.options.map((opt, oi) => {
                                    const isSelected = answers[question.questionId] === oi;
                                    return (
                                        <button
                                            key={oi}
                                            onClick={() => selectAnswer(question.questionId, oi)}
                                            disabled={isSubmitting}
                                            className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex items-center gap-5 group disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden ${isSelected
                                                    ? "bg-teal-500/10 border-teal-500/40 shadow-[0_0_30px_rgba(139,92,246,0.15)]"
                                                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                                                }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent pointer-events-none" />
                                            )}
                                            
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black border transition-all duration-300 ${isSelected
                                                    ? "bg-teal-500 border-teal-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-110"
                                                    : "bg-black/50 border-white/10 text-white/30 group-hover:border-white/20 group-hover:text-white/60"
                                                }`}>
                                                {oi + 1}
                                            </div>
                                            
                                            <span className={`text-base md:text-lg transition-colors duration-200 ${isSelected ? 'text-white font-medium' : 'text-white/70 group-hover:text-white/90'}`}>{opt}</span>
                                            
                                            {isSelected && (
                                                <div className="ml-auto animate-in zoom-in-50 duration-300">
                                                    <CheckCircle2 className="w-6 h-6 text-teal-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Navigation Controls */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                        <div className="flex gap-3">
                            <button
                                onClick={() => changeQuestion(Math.max(0, currentQ - 1))}
                                disabled={currentQ === 0 || isSubmitting}
                                className="px-5 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" /> Prev
                            </button>

                            <button
                                onClick={() => toggleFlag(currentQ)}
                                disabled={isSubmitting}
                                className={`px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${flagged.has(currentQ) 
                                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                                    : "bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.08] hover:text-white/80"}`}
                            >
                                <Flag className={`w-4 h-4 ${flagged.has(currentQ) ? 'fill-amber-400' : ''}`} /> 
                                <span className="hidden sm:inline">{flagged.has(currentQ) ? "Flagged" : "Flag"}</span>
                            </button>
                        </div>

                        {currentQ < questions.length - 1 ? (
                            <button
                                onClick={() => changeQuestion(currentQ + 1)}
                                disabled={isSubmitting}
                                className="px-6 py-3 rounded-xl bg-white text-black text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-8 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-[0_0_25px_rgba(139,92,246,0.4)]"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Complete</>}
                            </button>
                        )}
                    </div>
                </div>

                {/* HUD Sidebar */}
                <div className="lg:w-80 flex-shrink-0">
                    <div className="sticky top-28 p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs text-white/50 uppercase tracking-[0.2em] font-bold">Quiz Progress</h3>
                            <HelpCircle className="w-4 h-4 text-white/20 hover:text-white/60 transition-colors cursor-help" title="Hotkeys: 1-4 (Select), Arrows (Navigate), F (Flag)" />
                        </div>
                        
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, idx) => {
                                const isAnswered = answers[q.questionId] !== undefined;
                                const isFlagged = flagged.has(idx);
                                const isCurrent = idx === currentQ;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => changeQuestion(idx)}
                                        disabled={isSubmitting}
                                        className={`w-full aspect-square rounded-xl text-xs font-black flex items-center justify-center border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95 ${isCurrent
                                                ? "bg-teal-500 border-teal-400 text-white shadow-[0_0_15px_rgba(139,92,246,0.6)] scale-110 z-10"
                                                : isAnswered
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                                    : isFlagged
                                                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                                        : "bg-white/[0.02] border-white/5 text-white/30 hover:border-white/20 hover:text-white/60"
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 space-y-3 p-4 rounded-2xl bg-black/40 border border-white/5">
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-emerald-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"/> Locked</span>
                                <span className="text-white">{totalAnswered}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-amber-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]"/> Flagged</span>
                                <span className="text-white">{flagged.size}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-white/40 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/20"/> Pending</span>
                                <span className="text-white">{questions.length - totalAnswered}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5">
                            <div className="text-[10px] text-white/30 text-center mb-3 uppercase tracking-widest font-mono">
                                Keyboard: 1-4, Arrows, F
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-4 rounded-xl bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 text-teal-300 hover:text-teal-200 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" /> Submit Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowConfirm(false)} />
                    <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
                        
                        <div className="w-20 h-20 rounded-2xl bg-teal-500/10 border border-teal-500/20 mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                            <Send className="w-10 h-10 text-teal-400" />
                        </div>
                        
                        <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Submit Quiz?</h2>
                        <p className="text-sm text-white/50 mb-6">
                            Are you ready to submit your final answers?
                        </p>
                        
                        <div className="bg-black/50 border border-white/5 rounded-2xl p-4 mb-8">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Answered Questions</span>
                                <span className="text-sm font-mono text-emerald-400 font-bold">{totalAnswered} / {questions.length}</span>
                            </div>
                            
                            {totalAnswered < questions.length && (
                                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 justify-center">
                                    <AlertTriangle className="w-4 h-4" /> {questions.length - totalAnswered} Questions Pending
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-4">
                            <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 rounded-xl border border-white/10 text-white/70 text-sm font-bold uppercase tracking-wider hover:bg-white/5 hover:text-white transition-all active:scale-95">
                                Return
                            </button>
                            <button
                                onClick={confirmSubmit}
                                disabled={isSubmitting}
                                className="flex-1 py-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-black text-sm uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
