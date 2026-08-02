"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Edit2, Trash2, X, Check, Database, Loader2, UploadCloud } from "lucide-react";

export default function QuestionsClient({ eventId }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const fileInputRef = useRef(null);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [formData, setFormData] = useState({
        questionText: "",
        options: ["", "", "", ""],
        correctOption: 0,
        explanation: "",
        category: "Aptitude",
        difficulty: "medium",
        tags: []
    });

    useEffect(() => {
        fetchQuestions();
    }, [search, categoryFilter]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ eventId, search, category: categoryFilter });
            if (!search) params.delete('search');
            if (!categoryFilter) params.delete('category');
            
            const res = await fetch(`/api/placement-series/question-bank?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data.questions || []);
            }
        } catch (error) {
            console.error("Failed to fetch questions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const url = editingQuestion 
                ? `/api/placement-series/question-bank/${editingQuestion.id}`
                : `/api/placement-series/question-bank`;
            const method = editingQuestion ? "PUT" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, ...formData })
            });
            
            if (res.ok) {
                setIsModalOpen(false);
                fetchQuestions();
            } else {
                alert("Failed to save question");
            }
        } catch (error) {
            console.error("Error saving question:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this question?")) return;
        try {
            const res = await fetch(`/api/placement-series/question-bank/${id}?eventId=${eventId}`, {
                method: "DELETE"
            });
            if (res.ok) fetchQuestions();
        } catch (error) {
            console.error("Error deleting question:", error);
        }
    };

    const openModal = (question = null) => {
        if (question) {
            setEditingQuestion(question);
            setFormData({
                questionText: question.question_text,
                options: question.options,
                correctOption: question.correct_option,
                explanation: question.explanation || "",
                category: question.category || "Aptitude",
                difficulty: question.difficulty || "medium",
                tags: question.tags || []
            });
        } else {
            setEditingQuestion(null);
            setFormData({
                questionText: "",
                options: ["", "", "", ""],
                correctOption: 0,
                explanation: "",
                category: "Aptitude",
                difficulty: "medium",
                tags: []
            });
        }
        setIsModalOpen(true);
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target.result);
                const questionsArray = Array.isArray(json) ? json : (json.questions || [json]);

                const res = await fetch(`/api/placement-series/question-bank`, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventId, questions: questionsArray })
                });

                if (res.ok) {
                    alert(`Successfully imported ${questionsArray.length} questions!`);
                    fetchQuestions();
                } else {
                    const err = await res.json();
                    alert(`Failed to import questions: ${err.error}`);
                }
            } catch (error) {
                console.error("Error parsing/uploading JSON:", error);
                alert("Invalid JSON format or structure.");
            }
        };
        reader.readAsText(file);
        e.target.value = null; // Reset input
    };

    return (
        <div className="min-h-[100dvh] bg-black text-white relative pb-24">
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-teal-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 px-4 pt-24 pb-8 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Database className="w-8 h-8 text-teal-400" />
                            Question Bank
                        </h1>
                        <p className="text-white/50 mt-1">Manage global questions available for events.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <input 
                            type="file" 
                            accept=".json" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl font-bold transition-all"
                        >
                            <UploadCloud className="w-5 h-5" />
                            Import JSON
                        </button>
                        <button 
                            onClick={() => openModal()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-black px-6 py-2.5 rounded-xl font-bold transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Add Question
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input 
                            type="text" 
                            placeholder="Search questions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 focus:border-teal-400/50 outline-none text-white"
                        />
                    </div>
                    <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-teal-400/50 outline-none appearance-none min-w-[150px]"
                    >
                        <option value="" className="bg-gray-900">All Categories</option>
                        <option value="Aptitude" className="bg-gray-900">Aptitude</option>
                        <option value="Reasoning" className="bg-gray-900">Reasoning</option>
                        <option value="Technical" className="bg-gray-900">Technical</option>
                        <option value="Verbal" className="bg-gray-900">Verbal</option>
                    </select>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                    </div>
                ) : questions.length === 0 ? (
                    <div className="text-center py-20 border border-white/5 bg-white/5 rounded-2xl">
                        <Database className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No questions found</h3>
                        <p className="text-white/50 text-sm mt-1">Try adjusting your filters or add a new question.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-teal-400/30 transition-colors">
                                <div className="flex justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xs font-mono px-2 py-1 bg-white/10 rounded-md text-white/70">#{idx + 1}</span>
                                            <span className="text-xs font-semibold px-2 py-1 bg-teal-500/20 text-teal-300 rounded-md">{q.category}</span>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                                                q.difficulty === 'hard' ? 'bg-red-500/20 text-red-300' : 
                                                q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
                                            }`}>{q.difficulty}</span>
                                        </div>
                                        <h4 className="text-lg font-medium mb-3">{q.question_text}</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {q.options.map((opt, i) => (
                                                <div key={i} className={`text-sm px-3 py-2 rounded-lg border ${
                                                    i === q.correct_option ? 'border-teal-400/50 bg-teal-400/10 text-teal-200' : 'border-white/10 bg-black/40 text-white/70'
                                                }`}>
                                                    <span className="mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span>
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => openModal(q)} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(q.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-white/70 hover:text-red-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#0a0a0a]">
                            <h2 className="text-xl font-bold">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Question Text</label>
                                <textarea 
                                    required
                                    rows={3}
                                    value={formData.questionText}
                                    onChange={e => setFormData({...formData, questionText: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-400/50 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
                                    <select 
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-400/50 outline-none"
                                    >
                                        <option value="Aptitude" className="bg-gray-900">Aptitude</option>
                                        <option value="Reasoning" className="bg-gray-900">Reasoning</option>
                                        <option value="Technical" className="bg-gray-900">Technical</option>
                                        <option value="Verbal" className="bg-gray-900">Verbal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Difficulty</label>
                                    <select 
                                        value={formData.difficulty}
                                        onChange={e => setFormData({...formData, difficulty: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-400/50 outline-none"
                                    >
                                        <option value="easy" className="bg-gray-900">Easy</option>
                                        <option value="medium" className="bg-gray-900">Medium</option>
                                        <option value="hard" className="bg-gray-900">Hard</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-3">Options (Select the correct one)</label>
                                <div className="space-y-3">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-3">
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({...formData, correctOption: i})}
                                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                                                    formData.correctOption === i ? 'bg-teal-500 border-teal-500 text-black' : 'border-white/30 bg-white/5'
                                                }`}
                                            >
                                                {formData.correctOption === i && <Check className="w-4 h-4" />}
                                            </button>
                                            <input 
                                                required
                                                type="text" 
                                                value={formData.options[i]}
                                                onChange={e => handleOptionChange(i, e.target.value)}
                                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-teal-400/50 outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Explanation (Optional)</label>
                                <textarea 
                                    rows={2}
                                    value={formData.explanation}
                                    onChange={e => setFormData({...formData, explanation: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-400/50 outline-none"
                                    placeholder="Shown to students after they submit"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-teal-500 hover:bg-teal-400 text-black px-6 py-2.5 rounded-xl font-bold"
                                >
                                    Save Question
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
