"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Trash2, Edit2, CheckCircle2, Search, Link2, Loader2, X, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ContestDetailClient({ contestId, eventId }) {
    const router = useRouter();
    const [contest, setContest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('questions');
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);

    // Sorting State
    const [sortConfig, setSortConfig] = useState([
        { key: 'score', dir: 'desc' },
        { key: 'time_taken_seconds', dir: 'asc' }
    ]);

    const sortOptions = [
        { label: 'Score', value: 'score' },
        { label: 'Time Taken', value: 'time_taken_seconds' },
        { label: 'Tab Switches', value: 'tab_switch_count' },
        { label: 'Questions Answered', value: 'answered_count' },
        { label: 'Participant Name', value: 'name' },
        { label: 'Submitted At', value: 'submitted_at' }
    ];

    const sortedSubmissions = [...submissions].sort((a, b) => {
        const getVal = (obj, key) => {
            if (key === 'name') return obj.ps_participants?.name?.toLowerCase() || '';
            if (key === 'submitted_at') return obj.submitted_at ? new Date(obj.submitted_at).getTime() : 0;
            return obj[key] ?? 0;
        };

        for (const config of sortConfig) {
            const valA = getVal(a, config.key);
            const valB = getVal(b, config.key);

            if (valA < valB) return config.dir === 'asc' ? -1 : 1;
            if (valA > valB) return config.dir === 'asc' ? 1 : -1;
        }

        return 0;
    });

    // Bank Modal
    const [isBankOpen, setIsBankOpen] = useState(false);
    const [bankQuestions, setBankQuestions] = useState([]);
    const [bankSearch, setBankSearch] = useState("");
    const [bankLoading, setBankLoading] = useState(false);

    useEffect(() => {
        fetchContest();
    }, []);

    const fetchContest = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/placement-series/contests/${contestId}?eventId=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setContest(data.contest);
                setQuestions(data.questions || []);
            } else {
                router.push('/coordinator/contests');
            }
        } catch (error) {
            console.error("Failed to fetch contest:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBankQuestions = async () => {
        setBankLoading(true);
        try {
            const params = new URLSearchParams({ eventId, search: bankSearch });
            if (!bankSearch) params.delete('search');
            const res = await fetch(`/api/placement-series/question-bank?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setBankQuestions(data.questions || []);
            }
        } catch (error) {
            console.error("Failed to fetch bank:", error);
        } finally {
            setBankLoading(false);
        }
    };

    useEffect(() => {
        if (isBankOpen) {
            const delayDebounceFn = setTimeout(() => fetchBankQuestions(), 300);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [bankSearch, isBankOpen]);

    useEffect(() => {
        if (activeTab === 'submissions' && submissions.length === 0) {
            fetchSubmissions();
        }
    }, [activeTab]);

    const fetchSubmissions = async () => {
        setSubmissionsLoading(true);
        try {
            const res = await fetch(`/api/placement-series/contests/${contestId}/submissions?eventId=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data.submissions || []);
            }
        } catch (error) {
            console.error("Failed to fetch submissions:", error);
        } finally {
            setSubmissionsLoading(false);
        }
    };

    const addQuestionFromBank = (bankQ) => {
        setQuestions(prev => [
            ...prev,
            {
                questionNumber: prev.length + 1,
                questionText: bankQ.question_text,
                options: bankQ.options,
                correctOption: bankQ.correct_option,
                points: 10,
                questionBankId: bankQ.id
            }
        ]);
        setIsBankOpen(false);
    };

    const removeQuestion = (index) => {
        setQuestions(prev => {
            const updated = [...prev];
            updated.splice(index, 1);
            // Re-number
            return updated.map((q, i) => ({ ...q, questionNumber: i + 1 }));
        });
    };

    const handleSave = async (updates = {}) => {
        setSaving(true);
        try {
            const payload = { eventId, ...updates };
            if (!updates.isPublished && !updates.resultsPublished) {
                // If not just toggling a flag, assume full save
                payload.questions = questions;
            }
            
            const res = await fetch(`/api/placement-series/contests/${contestId}`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                fetchContest();
            } else {
                alert("Failed to save contest");
            }
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure? This will delete all submissions!")) return;
        try {
            const res = await fetch(`/api/placement-series/contests/${contestId}?eventId=${eventId}`, {
                method: "DELETE"
            });
            if (res.ok) router.push('/coordinator/contests');
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-400" /></div>;
    }

    if (!contest) return null;

    return (
        <div className="min-h-[100dvh] bg-black text-white relative pb-24">
            <div className="relative z-10 px-4 pt-24 pb-8 max-w-5xl mx-auto">
                <Link href="/coordinator/contests" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Contests
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded-md">Week {contest.week_number}</span>
                            {contest.is_published && <span className="text-xs font-bold px-2 py-1 bg-teal-500/20 text-teal-300 rounded-md">Published</span>}
                            {contest.results_published && <span className="text-xs font-bold px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md">Results Live</span>}
                        </div>
                        <h1 className="text-3xl font-bold">{contest.title}</h1>
                        <p className="text-white/50 mt-2 text-sm">
                            {new Date(contest.starts_at).toLocaleString()} - {new Date(contest.ends_at).toLocaleString()} • {contest.duration_minutes} mins
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <button 
                            onClick={() => handleSave()}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-black px-6 py-2.5 rounded-xl font-bold transition-all"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Questions
                        </button>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleSave({ isPublished: !contest.is_published })}
                                className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all"
                            >
                                {contest.is_published ? "Unpublish" : "Publish"}
                            </button>
                            <button 
                                onClick={() => handleSave({ resultsPublished: !contest.results_published })}
                                className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all"
                            >
                                {contest.results_published ? "Hide Results" : "Publish Results"}
                            </button>
                            <button 
                                onClick={handleDelete}
                                className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-white/10 mb-6">
                    <button 
                        onClick={() => setActiveTab('questions')}
                        className={`pb-3 px-2 font-medium transition-colors border-b-2 ${activeTab === 'questions' ? 'border-teal-400 text-teal-400' : 'border-transparent text-white/50 hover:text-white'}`}
                    >
                        Questions
                    </button>
                    <button 
                        onClick={() => setActiveTab('submissions')}
                        className={`pb-3 px-2 font-medium transition-colors border-b-2 ${activeTab === 'submissions' ? 'border-teal-400 text-teal-400' : 'border-transparent text-white/50 hover:text-white'}`}
                    >
                        Submissions
                    </button>
                </div>

                {activeTab === 'questions' ? (
                    <>
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Questions ({questions.length})</h2>
                            <button 
                                onClick={() => setIsBankOpen(true)}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                            >
                                <Plus className="w-4 h-4" /> Add from Bank
                            </button>
                        </div>

                        <div className="space-y-4">
                            {questions.length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-white/20 rounded-2xl">
                                    <p className="text-white/50">No questions added yet. Click 'Add from Bank' to start.</p>
                                </div>
                            ) : (
                                questions.map((q, idx) => (
                                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-5 relative group">
                                        <button 
                                            onClick={() => removeQuestion(idx)}
                                            className="absolute top-4 right-4 p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold shrink-0">
                                                {q.questionNumber || (idx + 1)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-medium mb-4 pr-8">{q.questionText || q.question_text}</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {q.options.map((opt, i) => (
                                                        <div key={i} className={`text-sm px-3 py-2 rounded-lg border ${
                                                            i === (q.correctOption ?? q.correct_option) ? 'border-teal-400/50 bg-teal-400/10 text-teal-200' : 'border-white/10 bg-black/40 text-white/70'
                                                        }`}>
                                                            <span className="mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span>
                                                            {opt}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        {submissionsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                            </div>
                        ) : submissions.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-white/50">No submissions yet.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {/* Sorting Controls */}
                                <div className="p-4 border-b border-white/10 bg-black/20 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <div className="flex flex-wrap items-center gap-4">
                                        {sortConfig.map((config, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <span className="text-xs text-white/50 uppercase tracking-wider font-bold">
                                                    {index === 0 ? 'Sort By' : 'Then By'}
                                                </span>
                                                <select 
                                                    value={config.key}
                                                    onChange={e => {
                                                        const newConfig = [...sortConfig];
                                                        newConfig[index].key = e.target.value;
                                                        setSortConfig(newConfig);
                                                    }}
                                                    className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-teal-500 outline-none"
                                                >
                                                    {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                </select>
                                                <button 
                                                    onClick={() => {
                                                        const newConfig = [...sortConfig];
                                                        newConfig[index].dir = newConfig[index].dir === 'asc' ? 'desc' : 'asc';
                                                        setSortConfig(newConfig);
                                                    }}
                                                    className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-mono font-bold border border-white/10 rounded-lg transition-colors"
                                                    title={`Change to ${config.dir === 'asc' ? 'Descending' : 'Ascending'}`}
                                                >
                                                    {config.dir === 'asc' ? 'ASC ↑' : 'DESC ↓'}
                                                </button>
                                                {index > 0 && (
                                                    <button 
                                                        onClick={() => {
                                                            const newConfig = [...sortConfig];
                                                            newConfig.splice(index, 1);
                                                            setSortConfig(newConfig);
                                                        }}
                                                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                        title="Remove sort condition"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {index < sortConfig.length - 1 && (
                                                    <div className="hidden sm:block w-px h-6 bg-white/10 ml-2"></div>
                                                )}
                                            </div>
                                        ))}
                                        {sortConfig.length < sortOptions.length && (
                                            <button 
                                                onClick={() => {
                                                    const availableKeys = sortOptions.map(o => o.value).filter(k => !sortConfig.some(c => c.key === k));
                                                    if (availableKeys.length > 0) {
                                                        setSortConfig([...sortConfig, { key: availableKeys[0], dir: 'desc' }]);
                                                    }
                                                }}
                                                className="flex items-center gap-1 text-xs font-bold text-teal-400 hover:bg-teal-500/10 px-3 py-1.5 rounded-lg border border-teal-500/30 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" /> Add Sort
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-sm font-medium text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full shrink-0">
                                        {submissions.length} Total
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-black/40">
                                            <th className="px-6 py-4 font-semibold text-white/70">Participant</th>
                                            <th className="px-6 py-4 font-semibold text-white/70">Score</th>
                                            <th className="px-6 py-4 font-semibold text-white/70">Questions</th>
                                            <th className="px-6 py-4 font-semibold text-white/70">Time Taken</th>
                                            <th className="px-6 py-4 font-semibold text-white/70">Tab Switches</th>
                                            <th className="px-6 py-4 font-semibold text-white/70">Submitted At</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {sortedSubmissions.map((sub) => (
                                            <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium">{sub.ps_participants?.name}</div>
                                                    <div className="text-xs text-white/50 font-mono">{sub.ps_participants?.roll_no}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-teal-400">{sub.score} / {sub.total_points}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <span className="text-white">{sub.answered_count || 0} Ans</span>
                                                        <span className="text-white/40 mx-2">|</span>
                                                        <span className="text-white/50">{sub.unanswered_count || 0} Skip</span>
                                                    </div>
                                                    {sub.detailed_results && Object.keys(sub.detailed_results).length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2 max-w-[220px]">
                                                            {questions.map((q, idx) => {
                                                                const res = sub.detailed_results[q.id];
                                                                const isAns = res?.status === 'answered';
                                                                const isCorrect = res?.is_correct;
                                                                const num = q.questionNumber || q.question_number || (idx + 1);
                                                                return (
                                                                    <div 
                                                                        key={q.id || idx} 
                                                                        title={isAns ? (isCorrect ? "Correct" : "Incorrect") : "Skipped"} 
                                                                        className={`w-5 h-5 flex items-center justify-center text-[10px] rounded font-bold transition-all hover:scale-110 cursor-help ${
                                                                            isAns 
                                                                                ? (isCorrect ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30') 
                                                                                : 'bg-white/5 text-white/30 border border-white/10 border-dashed'
                                                                        }`}
                                                                    >
                                                                        {num}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {sub.time_taken_seconds ? `${Math.floor(sub.time_taken_seconds / 60)}m ${sub.time_taken_seconds % 60}s` : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${sub.tab_switch_count > 3 ? 'bg-red-500/20 text-red-400' : sub.tab_switch_count > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50'}`}>
                                                        {sub.tab_switch_count}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-white/60">
                                                    {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'In Progress'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        )}
                    </div>
                )}
            </div>

            {/* Question Bank Modal */}
            {isBankOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold">Select Question from Bank</h2>
                            <button onClick={() => setIsBankOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 border-b border-white/10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input 
                                    type="text" 
                                    placeholder="Search question bank..."
                                    value={bankSearch}
                                    onChange={(e) => setBankSearch(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:border-teal-400/50 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {bankLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-teal-400" /></div>
                            ) : bankQuestions.length === 0 ? (
                                <div className="text-center py-8 text-white/50">No questions found.</div>
                            ) : (
                                bankQuestions.map(q => (
                                    <div key={q.id} className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-teal-500/50 transition-all flex justify-between items-center group">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold px-2 py-0.5 bg-white/10 rounded-md text-white/70">{q.category}</span>
                                            </div>
                                            <p className="text-sm font-medium">{q.question_text}</p>
                                        </div>
                                        <button 
                                            onClick={() => addQuestionFromBank(q)}
                                            className="ml-4 shrink-0 px-4 py-2 bg-white/10 hover:bg-teal-500 text-white hover:text-black rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
