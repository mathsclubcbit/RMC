"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Search, Check, Loader2, Link2, X } from "lucide-react";

export default function DailyQuestionsClient({ eventId }) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyQuestions, setDailyQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);

    // Question Bank Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bankQuestions, setBankQuestions] = useState([]);
    const [bankLoading, setBankLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedQIds, setSelectedQIds] = useState([]);

    useEffect(() => {
        fetchDailyQuestions();
    }, [selectedDate]);

    const fetchDailyQuestions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/placement-series/daily?eventId=${eventId}&date=${selectedDate}`);
            if (res.ok) {
                const data = await res.json();
                setDailyQuestions(data.questions || []);
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
        setSelectedQIds(dailyQuestions.map(q => q.question.id)); // Pre-select current
        setIsModalOpen(true);
        fetchBankQuestions();
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
                        <p className="text-white/50 mt-1">Assign 3 questions for students to answer every day.</p>
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
                        <button 
                            onClick={handleOpenAssignModal}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-black px-6 py-2.5 rounded-xl font-bold transition-all"
                        >
                            <Link2 className="w-5 h-5" />
                            Assign Questions
                        </button>
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
                        <p className="text-white/50 text-sm mt-1">Click "Assign Questions" to add up to 3 questions.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {dailyQuestions.map((dq) => (
                            <div key={dq.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-lg">
                                        {dq.questionNumber}
                                    </span>
                                    <span className="text-xs font-semibold px-2 py-1 bg-white/10 rounded-md text-white/70">
                                        {dq.category}
                                    </span>
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
                                            <span className="mr-2 opacity-50">{String.fromCharCode(65 + idx)}.</span>
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
                                    placeholder="Search question bank..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
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
                                bankQuestions.map(q => {
                                    const isSelected = selectedQIds.includes(q.id);
                                    return (
                                        <div 
                                            key={q.id}
                                            onClick={() => toggleSelect(q.id)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                                isSelected ? 'border-teal-500 bg-teal-500/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                                            }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                                    isSelected ? 'border-teal-400 bg-teal-400 text-black' : 'border-white/30'
                                                }`}>
                                                    {isSelected && <Check className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-semibold px-2 py-0.5 bg-white/10 rounded-md text-white/70">{q.category}</span>
                                                        <span className="text-xs text-white/40">{q.difficulty}</span>
                                                    </div>
                                                    <p className="text-sm font-medium">{q.question_text}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-[#0a0a0a]">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-white/70 hover:bg-white/10 font-medium">
                                Cancel
                            </button>
                            <button 
                                onClick={handleAssign}
                                disabled={isAssigning || selectedQIds.length === 0}
                                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black px-6 py-2.5 rounded-xl font-bold"
                            >
                                {isAssigning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                Assign {selectedQIds.length} Questions
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
