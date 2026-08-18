"use client";

import { useState, useEffect } from "react";
import { Clock, Users, ArrowRight, Loader2, CheckCircle2, AlertCircle, Trophy, Crosshair, Zap, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuizLandingClient({ eventId, entryCode }) {
    const router = useRouter();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: "", email: "", phone: "", rollNo: "", department: "" });
    const [isStarting, setIsStarting] = useState(false);
    const [error, setError] = useState("");
    const [existingSession, setExistingSession] = useState(null);

    useEffect(() => {
        fetchEvent();
    }, []);

    const fetchEvent = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setEvent(data);
            }
        } catch (err) {
            console.error("Failed to load event:", err);
        } finally {
            setLoading(false);
        }
    };

    const quizConfig = event?.quizConfig || event?.payload?.quizConfig || {};
    const totalQuestions = (parseInt(quizConfig.easyCount) || 0) + (parseInt(quizConfig.mediumCount) || 0) + (parseInt(quizConfig.hardCount) || 0);
    const maxScore = (parseInt(quizConfig.easyCount) || 0) * 1 + (parseInt(quizConfig.mediumCount) || 0) * 2 + (parseInt(quizConfig.hardCount) || 0) * 3;

    const handleStart = async () => {
        setError("");
        if (!form.name.trim()) return setError("Please enter your name to enter the arena");
        if (!form.email.trim()) return setError("Please enter your email to enter the arena");
        
        if (entryCode) {
            if (!form.phone.trim()) return setError("Please enter your phone number");
            if (!form.rollNo.trim()) return setError("Please enter your roll number");
            if (!form.department.trim()) return setError("Please enter your department");

        setIsStarting(true);
        try {
            const res = await fetch("/api/quiz/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId,
                    participantName: form.name.trim(),
                    participantEmail: form.email.trim(),
                    phone: form.phone.trim(),
                    rollNo: form.rollNo.trim(),
                    department: form.department.trim(),
                    entryCode
                }),
            });
            const data = await res.json();

            if (res.status === 409 && data.session?.submitted) {
                setExistingSession(data.session);
                return;
            }

            if (!res.ok) {
                setError(data.error || "Failed to enter arena");
                return;
            }

            // Store session data and navigate to play
            sessionStorage.setItem("quiz_session", JSON.stringify({
                sessionId: data.sessionId,
                questions: data.questions,
                startedAt: data.startedAt,
                totalPossible: data.totalPossible,
                durationMinutes: data.durationMinutes,
                participantName: form.name.trim(),
                eventId,
            }));

            router.push(`/quiz/${eventId}/play`);
        } catch (err) {
            setError("Network error. Connection to arena lost.");
        } finally {
            setIsStarting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/20 blur-[120px] rounded-full" />
                <Loader2 className="w-10 h-10 animate-spin text-violet-400 relative z-10" />
                <p className="mt-4 text-violet-400/60 text-sm tracking-widest uppercase font-mono relative z-10 animate-pulse">Initializing Arena...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden selection:bg-violet-500/30">
            {/* Animated Background Orbs */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full animate-pulse duration-1000" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-600/10 blur-[150px] rounded-full animate-pulse duration-700" style={{ animationDelay: '1s' }} />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

            <div className="relative max-w-3xl mx-auto px-4 py-16 flex flex-col min-h-screen justify-center">
                {/* Header */}
                <div className="text-center mb-12 animate-in slide-in-from-bottom-8 duration-700 fade-in fill-mode-both">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-[0.2em] mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                        <Crosshair className="w-3.5 h-3.5" /> Pre-Match Lobby
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent tracking-tight">
                        {event?.title || "Classified Operation"}
                    </h1>
                    {event?.description && (
                        <p className="text-white/50 text-base max-w-xl mx-auto leading-relaxed">{event.description}</p>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                    {/* Left Column: Stats & Rules */}
                    <div className="space-y-6 animate-in slide-in-from-left-8 duration-700 delay-150 fade-in fill-mode-both">
                        {/* HUD Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md relative overflow-hidden group hover:border-violet-500/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="text-3xl font-black text-white mb-1">{totalQuestions}</div>
                                <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono flex items-center gap-1.5"><Shield className="w-3 h-3 text-violet-400" /> Targets</div>
                            </div>
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="text-3xl font-black text-white mb-1">{quizConfig.durationMinutes || 20}</div>
                                <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono flex items-center gap-1.5"><Clock className="w-3 h-3 text-amber-400" /> Mins</div>
                            </div>
                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="text-3xl font-black text-white mb-1">{maxScore}</div>
                                <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono flex items-center gap-1.5"><Zap className="w-3 h-3 text-emerald-400" /> Max Pt</div>
                            </div>
                        </div>

                        {/* Rules of Engagement */}
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-5 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-white/40" /> Rules of Engagement
                            </h3>
                            <ul className="space-y-4 text-sm text-white/70">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5"><Zap className="w-3.5 h-3.5 text-violet-400" /></div>
                                    <span>Questions are completely randomized. Your arena is unique.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5"><Trophy className="w-3.5 h-3.5 text-emerald-400" /></div>
                                    <span>Scoring scales with difficulty: Easy (1pt), Medium (2pt), Hard (3pt).</span>
                                </li>
                                {quizConfig.negativeMarking && (
                                    <li className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5"><AlertCircle className="w-3.5 h-3.5 text-red-400" /></div>
                                        <span><strong className="text-red-400 font-semibold">Lethal Mode:</strong> -{quizConfig.negativeMarkValue} points per incorrect answer.</span>
                                    </li>
                                )}
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5"><Clock className="w-3.5 h-3.5 text-amber-400" /></div>
                                    <span>Timer does not pause. Switching tabs is strictly monitored.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Action Panel */}
                    <div className="animate-in slide-in-from-right-8 duration-700 delay-300 fade-in fill-mode-both">
                        {existingSession ? (
                            <div className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 backdrop-blur-xl text-center relative overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                                <Trophy className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-white mb-2">Operation Complete</h2>
                                <p className="text-white/50 mb-6">Score: {existingSession.score}/{existingSession.totalPossible}</p>
                                <button
                                    onClick={() => router.push(`/quiz/${eventId}/results?sessionId=${existingSession.id}`)}
                                    className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-colors"
                                >
                                    View After Action Report
                                </button>
                            </div>
                        ) : (
                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-50" />
                                
                                {event?.payload?.secureWalkInMode && !entryCode ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                            <Shield className="w-8 h-8 text-red-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
                                        <p className="text-sm text-white/60 mb-6">This arena requires a live QR scan. Please scan the QR code displayed at the event venue to enter.</p>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-xl font-bold text-white mb-6">Initialize Agent</h3>

                                        {error && (
                                            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-sm animate-in zoom-in-95 duration-200">
                                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                                <p>{error}</p>
                                            </div>
                                        )}

                                        <div className="space-y-4 mb-8">
                                            <div className="relative">
                                                <input
                                                    value={form.name}
                                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                    placeholder="Agent Callsign (Full Name)"
                                                    className="w-full px-5 py-4 rounded-xl bg-black/60 border border-white/10 outline-none focus:border-violet-500/50 focus:bg-white/[0.02] text-white placeholder:text-white/20 transition-all font-mono text-sm"
                                                />
                                            </div>
                                            <div className="relative">
                                                <input
                                                    value={form.email}
                                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                                    type="email"
                                                    placeholder="Secure Comms (Email)"
                                                    className="w-full px-5 py-4 rounded-xl bg-black/60 border border-white/10 outline-none focus:border-violet-500/50 focus:bg-white/[0.02] text-white placeholder:text-white/20 transition-all font-mono text-sm"
                                                />
                                            </div>
                                            {entryCode && (
                                                <>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="relative">
                                                            <input
                                                                value={form.phone}
                                                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                                                placeholder="Comm Link (Phone)"
                                                                className="w-full px-5 py-4 rounded-xl bg-black/60 border border-white/10 outline-none focus:border-violet-500/50 focus:bg-white/[0.02] text-white placeholder:text-white/20 transition-all font-mono text-sm"
                                                            />
                                                        </div>
                                                        <div className="relative">
                                                            <input
                                                                value={form.rollNo}
                                                                onChange={e => setForm(f => ({ ...f, rollNo: e.target.value }))}
                                                                placeholder="Agent ID (Roll No)"
                                                                className="w-full px-5 py-4 rounded-xl bg-black/60 border border-white/10 outline-none focus:border-violet-500/50 focus:bg-white/[0.02] text-white placeholder:text-white/20 transition-all font-mono text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            value={form.department}
                                                            onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                                                            placeholder="Division (Department)"
                                                            className="w-full px-5 py-4 rounded-xl bg-black/60 border border-white/10 outline-none focus:border-violet-500/50 focus:bg-white/[0.02] text-white placeholder:text-white/20 transition-all font-mono text-sm"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleStart}
                                            disabled={isStarting}
                                            className="relative w-full py-4 rounded-xl bg-white text-black font-black text-sm uppercase tracking-widest overflow-hidden group/btn hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none disabled:scale-100"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-fuchsia-400 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                            <div className="relative flex items-center justify-center gap-2 group-hover/btn:text-white transition-colors">
                                                {isStarting ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" /> Uplinking...
                                                    </>
                                                ) : (
                                                    <>
                                                        Enter Arena <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                        <p className="mt-4 text-[10px] text-white/30 text-center uppercase tracking-widest font-mono">
                                            Timer deploys immediately upon entry
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
