"use client";

import { useState, useEffect, useRef } from "react";
import { CalendarDays, Search, Check, Loader2, Link2, X, UploadCloud, Tag } from "lucide-react";

export default function DailyQuestionsClient({ eventId }) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyQuestions, setDailyQuestions] = useState([]);
    const [isExplanationDay, setIsExplanationDay] = useState(false);
    const [explanationSourceDate, setExplanationSourceDate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);
    const [importing, setImporting] = useState(false);
    const scheduleFileInputRef = useRef(null);

    // Question Bank Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bankQuestions, setBankQuestions] = useState([]);
    const [bankLoading, setBankLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedQIds, setSelectedQIds] = useState([]);

    // Stats Modal State
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [dailyStats, setDailyStats] = useState([]);
    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
        fetchDailyQuestions();
    }, [selectedDate]);

    const fetchDailyQuestions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/placement-series/daily?eventId=${eventId}&date=${selectedDate}`);
            if (res.ok) {
                const data = await res.json();
                // Only show questions that are actually assigned to the selected date.
                // isExplanationDay means there are no real assignments for selectedDate —
                // those are the previous day's fallback; don't display them here.
                if (data.isExplanationDay) {
                    setDailyQuestions([]);
                    setIsExplanationDay(true);
                    setExplanationSourceDate(data.sourceDate || null);
                } else {
                    setDailyQuestions(data.questions || []);
                    setIsExplanationDay(false);
                    setExplanationSourceDate(null);
                }
            }
        } catch (error) {
            console.error("Failed to fetch daily questions:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBankQuestions = async () => {
        setBankLoading(true);
        try {
            const params = new URLSearchParams({ eventId, search });
            if (!search) params.delete('search');
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

    const handleOpenAssignModal = () => {
        setSelectedQIds(dailyQuestions.map(q => q.question?.id || q.id)); // Pre-select current
        setIsModalOpen(true);
        fetchBankQuestions();
    };

    const fetchDailyStats = async () => {
        setStatsLoading(true);
        setIsStatsOpen(true);
        try {
            const res = await fetch(`/api/placement-series/daily/stats?eventId=${eventId}&date=${selectedDate}`);
            if (res.ok) {
                const data = await res.json();
                setDailyStats(data.stats || []);
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        if (isModalOpen) {
            const delayDebounceFn = setTimeout(() => fetchBankQuestions(), 300);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [search, isModalOpen]);

    const toggleSelect = (id) => {
        if (selectedQIds.includes(id)) {
            setSelectedQIds(selectedQIds.filter(qId => qId !== id));
        } else {
            if (selectedQIds.length >= 3) {
                alert("You can only assign 3 questions per day.");
                return;
            }
            setSelectedQIds([...selectedQIds, id]);
        }
    };

    const handleAssign = async () => {
        if (selectedQIds.length === 0) {
            alert("Please select at least 1 question.");
            return;
        }
        setIsAssigning(true);
        try {
            const assignments = selectedQIds.map((id, index) => ({
                questionNumber: index + 1,
                questionId: id
            }));
            const res = await fetch(`/api/placement-series/daily`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, date: selectedDate, assignments })
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchDailyQuestions();
            } else {
                alert("Failed to assign questions");
            }
        } catch (error) {
            console.error("Error assigning:", error);
        } finally {
            setIsAssigning(false);
        }
    };

    const handleScheduleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target.result);
                const scheduleArray = Array.isArray(json) ? json : (json.schedule || json.questions || [json]);

                const res = await fetch(`/api/placement-series/daily`, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        eventId, 
                        date: selectedDate,
                        schedule: scheduleArray 
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    alert(`✅ Successfully assigned ${data.assigned || scheduleArray.length} questions according to the schedule JSON!`);
                    fetchDailyQuestions();
                } else {
                    alert(`❌ Failed to assign questions: ${data.error || 'Server error'}`);
                }
            } catch (error) {
                console.error("Error parsing schedule JSON:", error);
                alert("❌ Invalid JSON file. Ensure it contains an array with company_label, question_no, and date.");
            } finally {
                setImporting(false);
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    return (
        <div className="min-h-[100dvh] bg-black text-white relative pb-24">
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-40 -left-20 w-[600px] h-[600px] bg-teal-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 px-4 pt-24 pb-8 max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <CalendarDays className="w-8 h-8 text-teal-400" />
                            Daily Questions
                        </h1>
                        <p className="text-white/50 mt-1">Assign 3 questions for students to solve every day or import a schedule.</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <label className="text-white/70 font-medium whitespace-nowrap">Select Date:</label>
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-teal-400/50 outline-none w-full sm:w-auto [color-scheme:dark]"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto items-center">
                            <input 
                                type="file" 
                                accept=".json" 
                                className="hidden" 
                                ref={scheduleFileInputRef} 
                                onChange={handleScheduleUpload} 
                            />
                            <button 
                                disabled={importing}
                                onClick={() => scheduleFileInputRef.current?.click()}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
                                title="Upload JSON containing company_label, question_no, and date"
                            >
                                {importing ? <Loader2 className="w-4 h-4 animate-spin text-teal-400" /> : <UploadCloud className="w-4 h-4" />}
                                {importing ? "Importing..." : "Import Schedule JSON"}
                            </button>

                            <button 
                                onClick={handleOpenAssignModal}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-black px-5 py-2.5 rounded-xl font-bold transition-all text-sm"
                            >
                                <Link2 className="w-4 h-4" />
                                Assign Questions
                            </button>
                            {dailyQuestions.length > 0 && (
                                <button 
                                    onClick={fetchDailyStats}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-4 py-2.5 rounded-xl font-bold transition-all text-sm border border-white/10"
                                >
                                    Stats
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                    </div>
                ) : dailyQuestions.length === 0 ? (
                    <div className="text-center py-16 border border-white/5 bg-white/5 rounded-2xl">
                        <CalendarDays className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No questions assigned for {selectedDate}</h3>
                        {isExplanationDay && explanationSourceDate ? (
                            <p className="text-white/50 text-sm mt-1">
                                📖 This is an <span className="text-purple-300 font-semibold">Explanation Day</span> — students are seeing solutions for <span className="text-teal-300">{explanationSourceDate}</span>.
                            </p>
                        ) : (
                            <p className="text-white/50 text-sm mt-1">Upload a Schedule JSON or click "Assign Questions" to set up today's challenge.</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {dailyQuestions.map((dq) => (
                            <div key={dq.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                                    <span className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-lg">
                                        {dq.questionNumber}
                                    </span>
                                    {dq.category && (
                                        <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-md text-white/70">
                                            {dq.category}
                                        </span>
                                    )}
                                    {dq.tags && dq.tags.length > 0 && dq.tags.filter(tag => !String(tag).startsWith('q_no:')).map((tag, tIdx) => (
                                        <span key={tIdx} className="text-[11px] font-bold px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-md border border-purple-500/30 flex items-center gap-1">
                                            <Tag className="w-3 h-3" />
                                            {tag}
                                        </span>
                                    ))}
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                                        dq.difficulty === 'hard' ? 'bg-red-500/20 text-red-300' : 
                                        dq.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
                                    }`}>
                                        {dq.difficulty}
                                    </span>
                                </div>
                                <h4 className="text-lg font-medium mb-4">{dq.questionText}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {dq.options.map((opt, idx) => (
                                        <div key={idx} className={`text-sm px-3 py-2 rounded-lg border ${
                                            idx === dq.question?.correct_option ? 'border-teal-400/50 bg-teal-400/10 text-teal-200' : 'border-white/10 bg-black/40 text-white/70'
                                        }`}>
                                            <span className="mr-2 opacity-50 font-bold font-mono">{String.fromCharCode(65 + idx)}.</span>
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Assign Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div>
                                <h2 className="text-xl font-bold">Assign to {selectedDate}</h2>
                                <p className="text-sm text-white/50 mt-1">Select exactly 3 questions. Currently selected: {selectedQIds.length}/3</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 border-b border-white/10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input 
                                    type="text" 
                                    placeholder="Search question bank by keyword or company tag..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:border-teal-400/50 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {bankLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                                </div>
                            ) : bankQuestions.length === 0 ? (
                                <div className="text-center py-12 text-white/40">
                                    No questions found in bank matching your query.
                                </div>
                            ) : (
                                bankQuestions.map((q) => {
                                    const isSelected = selectedQIds.includes(q.id);
                                    const selectionIndex = selectedQIds.indexOf(q.id);

                                    return (
                                        <div 
                                            key={q.id}
                                            onClick={() => toggleSelect(q.id)}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                                                isSelected 
                                                    ? 'bg-teal-500/10 border-teal-500/50 shadow-md' 
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                                                isSelected ? 'bg-teal-500 border-teal-500 text-black font-bold text-xs' : 'border-white/30'
                                            }`}>
                                                {isSelected ? selectionIndex + 1 : null}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-white/10 rounded">
                                                        {q.category}
                                                    </span>
                                                    {q.tags && q.tags.length > 0 && q.tags.filter(tag => !String(tag).startsWith('q_no:')).map((tag, tIdx) => (
                                                        <span key={tIdx} className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-white/5 rounded text-white/50">
                                                        {q.difficulty}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium">{q.question_text}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="p-4 border-t border-white/10 flex justify-between items-center bg-[#0a0a0a]">
                            <span className="text-sm text-white/50 font-medium">
                                {selectedQIds.length} of 3 selected
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-white/70 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleAssign}
                                    disabled={isAssigning || selectedQIds.length === 0}
                                    className="bg-teal-500 hover:bg-teal-400 text-black font-bold px-6 py-2 rounded-xl transition-all disabled:opacity-50"
                                >
                                    {isAssigning ? "Assigning..." : "Confirm Assignments"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Modal */}
            {isStatsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div>
                                <h2 className="text-xl font-bold">Daily Stats for {selectedDate}</h2>
                                <p className="text-sm text-white/50 mt-1">Summary of student answers for this date.</p>
                            </div>
                            <button onClick={() => setIsStatsOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {statsLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                                </div>
                            ) : dailyStats.length === 0 ? (
                                <div className="text-center py-12 text-white/40">
                                    No submissions recorded for this date yet.
                                </div>
                            ) : (
                                dailyStats.map((stat, idx) => (
                                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-sm">Question #{stat.questionNumber}</span>
                                            <span className="text-xs text-white/50">{stat.totalAttempts} total attempts</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-center">
                                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5">
                                                <div className="text-xs text-green-400 mb-0.5">Correct</div>
                                                <div className="text-lg font-bold text-white">{stat.correctAttempts}</div>
                                            </div>
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                                                <div className="text-xs text-red-400 mb-0.5">Incorrect</div>
                                                <div className="text-lg font-bold text-white">{stat.incorrectAttempts}</div>
                                            </div>
                                        </div>
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
