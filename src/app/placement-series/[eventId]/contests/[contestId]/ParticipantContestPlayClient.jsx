"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, ArrowLeft, Clock, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, Flag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import toast from 'react-hot-toast';
import MathText from "@/components/MathText";

export default function ParticipantContestPlayClient({ eventId, contestId }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [contest, setContest] = useState(null);
    const [questions, setQuestions] = useState([]);
    
    // State machine: 'intro' -> 'playing' -> 'submitting' -> 'results' -> 'ended'
    const [stage, setStage] = useState('intro');
    const [submission, setSubmission] = useState(null);
    const [results, setResults] = useState(null);
    const [showInstructions, setShowInstructions] = useState(false);

    // Play state
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [answers, setAnswers] = useState({});
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [tabSwitches, setTabSwitches] = useState(0);
    
    const timerRef = useRef(null);
    const answersRef = useRef({});
    const tabSwitchesRef = useRef(0);
    const hasAutoSubmittedRef = useRef(false);

    useEffect(() => {
        fetchContestInit();
        return () => clearInterval(timerRef.current);
    }, []);

    // Tab visibility tracking
    useEffect(() => {
        if (stage === 'playing') {
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    setTabSwitches(prev => {
                        const next = prev + 1;
                        tabSwitchesRef.current = next;
                        return next;
                    });
                    // Could also auto-submit on 3rd violation, etc.
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }, [stage]);

    // Timer countdown — only start/stop when stage changes, not every second
    useEffect(() => {
        if (stage === 'playing') {
            hasAutoSubmittedRef.current = false;
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        // Use a ref guard to prevent double auto-submit
                        if (!hasAutoSubmittedRef.current) {
                            hasAutoSubmittedRef.current = true;
                            autoSubmit();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timerRef.current);
        }
    }, [stage]);

    const fetchContestInit = async () => {
        try {
            const res = await fetch(`/api/placement-series/contests/${contestId}?eventId=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setContest(data.contest);
                
                if (data.submission) {
                    if (data.submission.submitted_at) {
                        // Already submitted
                        setSubmission(data.submission);
                        setStage(data.contest.results_published ? 'results' : 'ended');
                        setQuestions(data.questions || []);
                    } else {
                        // Resuming... need to hit start endpoint to get questions and fresh timer
                        // Set contest state first so the page doesn't go blank if startContest fails
                        await startContest();
                    }
                }
            } else {
                router.push(`/placement-series/${eventId}/contests`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const startContest = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/placement-series/contests/${contestId}/start`, { method: "POST" });
            const data = await res.json();
            
            if (res.ok) {
                setQuestions(data.questions);
                setTimeRemaining(data.submission.timeRemainingSeconds);
                setSubmission(data.submission);
                setStage('playing');
            } else {
                if (data.error === 'already_submitted') {
                    toast.error("You have already submitted this contest.");
                    fetchContestInit(); // refresh
                } else {
                    toast.error(data.error || "Failed to start");
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOption = (questionId, optionIndex) => {
        const updated = { ...answersRef.current, [questionId]: optionIndex };
        answersRef.current = updated;
        setAnswers(updated);
    };

    const autoSubmit = () => {
        // Called from inside setTimeRemaining updater — use refs for latest values
        submitContestWithRefs(true);
    };

    // Core submit logic — accepts answers/tabSwitches as params to support both
    // direct calls (from button with current state) and auto-submit (from refs).
    const doSubmit = async (isAuto, answersToSubmit, tabSwitchCount) => {
        setStage('submitting');
        clearInterval(timerRef.current);

        try {
            const res = await fetch(`/api/placement-series/contests/${contestId}/submit`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: answersToSubmit, tabSwitchCount })
            });
            const data = await res.json();
            
            if (res.ok) {
                setResults(data);
                setStage('ended');
                
                if (data.percentage >= 80) {
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                }
                toast.success("Successfully submitted!");
            } else {
                toast.error(data.error || "Failed to submit");
                setStage('playing');
            }
        } catch (error) {
            console.error(error);
            setStage('playing');
        }
    };

    // Called from auto-submit timer — reads refs to avoid stale closure
    const submitContestWithRefs = (isAuto) => {
        doSubmit(isAuto, answersRef.current, tabSwitchesRef.current);
    };

    // Called from user-initiated submit buttons — reads current state
    const submitContest = async (isAuto = false) => {
        if (!isAuto && !confirm("Are you sure you want to submit? You cannot change your answers after this.")) {
            return;
        }
        doSubmit(isAuto, answers, tabSwitches);
    };

    const formatTime = (seconds) => {
        if (!seconds && seconds !== 0) return "00:00";
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-400" /></div>;
    if (!contest) return null;

    if (stage === 'intro') {
        const now = Date.now();
        const startsAt = new Date(contest.starts_at).getTime();
        const endsAt = new Date(contest.ends_at).getTime();
        const isUpcoming = now < startsAt;
        const isEnded = now > endsAt;

        return (
            <div className="min-h-[100dvh] pt-24 pb-12 px-4 flex items-center justify-center bg-black text-white relative">
                <div className="absolute inset-0 pointer-events-none opacity-20"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 blur-[120px] rounded-full" /></div>
                
                <div className="max-w-xl w-full bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 text-center relative z-10 backdrop-blur-xl">
                    <h1 className="text-3xl font-bold mb-4">{contest.title}</h1>
                    <div className="flex justify-center gap-6 text-white/60 text-sm mb-8">
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {contest.duration_minutes} mins</div>
                        <div className="flex items-center gap-2"><span>{contest.total_questions} Questions</span></div>
                    </div>
                    

                    {isUpcoming ? (
                        <button disabled className="w-full py-4 rounded-xl bg-white/5 text-white/50 font-bold border border-white/10 cursor-not-allowed">
                            Starts {new Date(startsAt).toLocaleString()}
                        </button>
                    ) : isEnded ? (
                        <button disabled className="w-full py-4 rounded-xl bg-white/5 text-white/50 font-bold border border-white/10 cursor-not-allowed">
                            Contest Ended
                        </button>
                    ) : (
                        <button onClick={() => setShowInstructions(true)} className="w-full bg-teal-500 hover:bg-teal-400 text-black py-4 rounded-xl font-extrabold text-lg transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(45,212,191,0.3)]">
                            PROCEED
                        </button>
                    )}
                    
                    <div className="mt-6">
                        <Link href={`/placement-series/${eventId}/contests`} className="text-sm text-white/40 hover:text-white transition-colors">
                            ← Back to Contests
                        </Link>
                    </div>

                    {showInstructions && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-left">
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-6 border-b border-white/10">
                                    <h2 className="text-2xl font-bold flex items-center gap-2"><Flag className="w-6 h-6 text-teal-400" /> Contest Instructions</h2>
                                </div>
                                <div className="p-6 space-y-6 text-white/80">
                                    <div>
                                        <h3 className="font-bold text-white mb-2 text-lg">1. Timing & Submission</h3>
                                        <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-white/70">
                                            <li>The contest will automatically submit when the timer reaches zero.</li>
                                            <li>You can manually submit at any time by clicking "Submit All".</li>
                                            <li>Once submitted, you cannot re-enter the contest or change your answers.</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-orange-400 mb-2 text-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> 2. Anti-Cheat Monitoring</h3>
                                        <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-white/70">
                                            <li>Tab switching, minimizing the browser, or leaving the window is strictly monitored.</li>
                                            <li>Each violation is recorded as a "Warning" against your submission.</li>
                                            <li>Excessive warnings may result in automatic disqualification by the coordinator.</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white mb-2 text-lg">3. Navigation & Scoring</h3>
                                        <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-white/70">
                                            <li>You can freely navigate between questions using the "Question Map" or "Previous/Next" buttons.</li>
                                            <li>Unanswered questions will not award points.</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-white/10 bg-white/5 flex flex-col-reverse sm:flex-row justify-end gap-4">
                                    <button 
                                        onClick={() => setShowInstructions(false)} 
                                        className="px-6 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setShowInstructions(false);
                                            startContest();
                                        }} 
                                        className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-black rounded-xl font-extrabold transition-transform hover:scale-105 shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                                    >
                                        I Understand, Start Contest
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (stage === 'playing' || stage === 'submitting') {
        const currentQ = questions[currentQIndex];
        const isLast = currentQIndex === questions.length - 1;

        return (
            <div className="min-h-[100dvh] bg-[#050505] text-white">
                {/* Header Navbar for contest */}
                <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-b border-white/10 z-50">
                    {/* Progress Bar (Goal Gradient) */}
                    <div className="absolute bottom-0 left-0 h-0.5 bg-teal-500 transition-all duration-300 shadow-[0_0_10px_rgba(45,212,191,0.8)]" style={{ width: `${((Object.keys(answers).length) / questions.length) * 100}%` }} />
                    <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between relative z-10">
                        <div className="font-bold hidden sm:block">{contest.title}</div>
                        
                        <div className="flex items-center gap-6">
                            {tabSwitches > 0 && (
                                <div className="text-orange-400 text-xs font-bold bg-orange-500/10 px-2 py-1 rounded">
                                    Warnings: {tabSwitches}
                                </div>
                            )}
                            <div className={`font-mono font-bold text-xl flex items-center gap-2 ${timeRemaining < 60 ? 'text-red-400' : 'text-teal-400'}`}>
                                <Clock className="w-5 h-5" />
                                {formatTime(timeRemaining)}
                            </div>
                            <button 
                                onClick={() => submitContest(false)}
                                disabled={stage === 'submitting'}
                                className="bg-teal-500 text-black px-4 py-1.5 rounded-lg font-bold text-sm"
                            >
                                Submit All
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 pt-24 pb-32 flex flex-col-reverse md:flex-row gap-8">
                    {/* Main Question Area */}
                    <div className="flex-1">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 min-h-[400px]">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-white/50 font-bold uppercase tracking-widest text-xs">Question {currentQIndex + 1} of {questions.length}</span>
                                <span className="text-teal-400 font-bold bg-teal-500/10 px-3 py-1 rounded-lg text-sm">{currentQ?.points} Points</span>
                            </div>
                            
                            <h2 className="text-2xl leading-relaxed font-medium mb-10">
                                <MathText text={currentQ?.question_text} />
                            </h2>

                            <div className="grid grid-cols-1 gap-4">
                                {currentQ?.options.map((opt, i) => {
                                    const isSelected = answers[currentQ.id] === i;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handleSelectOption(currentQ.id, i)}
                                            className={`text-left p-5 rounded-2xl border transition-all flex items-center gap-4 ${
                                                isSelected 
                                                    ? 'bg-teal-500/10 border-teal-500' 
                                                    : 'bg-black border-white/10 hover:border-white/30'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
                                                isSelected ? 'border-teal-400 bg-teal-400 text-black' : 'border-white/30 text-white/50'
                                            }`}>
                                                <span className="font-bold text-sm">{String.fromCharCode(65 + i)}</span>
                                            </div>
                                            <span className="text-lg"><MathText text={opt} /></span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex justify-between items-center mt-6">
                            <button 
                                onClick={() => setCurrentQIndex(p => Math.max(0, p - 1))}
                                disabled={currentQIndex === 0}
                                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl font-bold transition-all border border-white/10"
                            >
                                <ChevronLeft className="w-5 h-5" /> Previous
                            </button>
                            <button 
                                onClick={() => {
                                    if (isLast) submitContest(false);
                                    else setCurrentQIndex(p => Math.min(questions.length - 1, p + 1));
                                }}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                                    isLast ? 'bg-teal-500 text-black' : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                }`}
                            >
                                {isLast ? 'Submit' : 'Next'} {isLast ? <CheckCircle2 className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Question Palette Sidebar */}
                    <div className="w-full md:w-64 shrink-0">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 md:p-6 sticky top-20 md:top-24 z-20 backdrop-blur-xl">
                            <h3 className="font-bold mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-widest text-white/50">Question Map</h3>
                            <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-2 pb-2 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {questions.map((q, i) => {
                                    const isAnswered = answers[q.id] !== undefined;
                                    const isCurrent = currentQIndex === i;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentQIndex(i)}
                                            className={`shrink-0 w-10 md:w-auto aspect-square rounded-lg font-bold text-sm flex items-center justify-center transition-all duration-300 ${
                                                isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111] scale-110 z-10' : 'hover:scale-105 hover:border-white/50'
                                            } ${
                                                isAnswered ? 'bg-teal-500 text-black shadow-[0_0_10px_rgba(45,212,191,0.4)] border border-teal-400' : 'bg-transparent border-2 border-white/20 text-white/50'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {stage === 'submitting' && (
                    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 animate-spin text-teal-400 mb-4" />
                        <h2 className="text-2xl font-bold">Submitting Contest...</h2>
                    </div>
                )}
            </div>
        );
    }

    if (stage === 'ended' || stage === 'results') {
        return (
            <div className="min-h-[100dvh] pt-24 pb-12 px-4 relative flex items-center justify-center">
                <div className="max-w-xl w-full text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-500/20 text-teal-400 rounded-full mb-6">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    
                    <h1 className="text-4xl font-extrabold mb-4">Submission Received!</h1>
                    
                    {stage === 'ended' ? (
                        <>
                            <p className="text-white/60 mb-8 max-w-md mx-auto leading-relaxed">
                                Your answers have been securely recorded. The detailed results and answer key will be available once the coordinator publishes them.
                            </p>
                            
                            {results && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 inline-block mx-auto mb-8">
                                    <p className="text-sm text-white/50 uppercase tracking-widest font-bold mb-2">Preliminary Score</p>
                                    <div className="text-5xl font-mono font-bold text-teal-400">
                                        {results.score}<span className="text-2xl text-white/30">/{results.totalPoints}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-left space-y-6 mt-8">
                            <p className="text-center text-white/50 mb-8">Results have been published. Here is how you did:</p>
                            
                            {questions.map((q, i) => {
                                const uAns = q.user_answer;
                                const cAns = q.correct_option;
                                const isCorrect = uAns === cAns;
                                const isSkipped = uAns === undefined || uAns === null;

                                return (
                                    <div key={i} className={`bg-white/5 border rounded-2xl p-6 ${isCorrect ? 'border-green-500/30' : 'border-red-500/30'}`}>
                                        <div className="flex gap-4">
                                            <div className="font-bold text-white/50">{i + 1}.</div>
                                            <div className="flex-1">
                                                <p className="mb-4 font-medium"><MathText text={q.question_text} /></p>
                                                <div className="grid grid-cols-1 gap-2 text-sm">
                                                    {q.options.map((opt, oIdx) => {
                                                        const isUserSelection = oIdx === uAns;
                                                        const isActualCorrect = oIdx === cAns;
                                                        
                                                        let bg = "bg-black border-white/10";
                                                        if (isActualCorrect) bg = "bg-green-500/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)] text-green-200 ring-1 ring-green-500/50 relative z-10";
                                                        else if (isUserSelection) bg = "bg-red-500/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] text-red-200 relative z-10";

                                                        return (
                                                            <div key={oIdx} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${bg}`}>
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold font-mono shrink-0 ${isActualCorrect ? 'bg-green-500/30 text-green-300' : isUserSelection ? 'bg-red-500/30 text-red-300' : 'bg-white/10'}`}>
                                                                        {String.fromCharCode(65 + oIdx)}
                                                                    </span>
                                                                    <span className="font-medium text-base"><MathText text={opt} /></span>
                                                                </div>
                                                                {isUserSelection && (
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-black/50 border border-white/10 w-fit shrink-0 text-white">
                                                                        Your Answer
                                                                    </div>
                                                                )}
                                                                {isActualCorrect && !isUserSelection && (
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 w-fit shrink-0">
                                                                        Correct Answer
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-8">
                        <Link href={`/placement-series/${eventId}/contests`} className="inline-block bg-white/10 hover:bg-white/20 px-8 py-3 rounded-xl font-bold transition-all">
                            Back to Contests
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
