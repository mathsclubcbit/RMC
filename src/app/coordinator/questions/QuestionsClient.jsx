"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Edit2, Trash2, X, Check, Database, Loader2, UploadCloud, Tag, FileText, ChevronDown, ChevronUp } from "lucide-react";

export default function QuestionsClient({ eventId }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const fileInputRef = useRef(null);
    const explanationsFileInputRef = useRef(null);
    const [importing, setImporting] = useState(false);
    const [expandedExplanations, setExpandedExplanations] = useState({});
    
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
        companyLabel: "",
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

            const tags = Array.isArray(formData.tags) ? [...formData.tags] : [];
            if (formData.companyLabel && !tags.includes(formData.companyLabel)) {
                tags.unshift(formData.companyLabel);
            }
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    eventId, 
                    questionText: formData.questionText,
                    options: formData.options,
                    correctOption: formData.correctOption,
                    explanation: formData.explanation,
                    category: formData.category,
                    difficulty: formData.difficulty,
                    tags
                })
            });
            
            if (res.ok) {
                setIsModalOpen(false);
                fetchQuestions();
            } else {
                const err = await res.json();
                alert(`Failed to save question: ${err.error || 'Unknown error'}`);
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
            const firstTag = (question.tags && question.tags.length > 0) ? question.tags[0] : "";
            setFormData({
                questionText: question.question_text || "",
                options: Array.isArray(question.options) ? question.options : ["", "", "", ""],
                correctOption: question.correct_option ?? 0,
                explanation: question.explanation || "",
                category: question.category || "Aptitude",
                difficulty: question.difficulty || "medium",
                companyLabel: firstTag,
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
                companyLabel: "",
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

        setImporting(true);
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

                const data = await res.json();
                if (res.ok) {
                    alert(`✅ Successfully imported ${data.count || questionsArray.length} questions into Question Bank!`);
                    fetchQuestions();
                } else {
                    alert(`❌ Failed to import questions: ${data.error || 'Server error'}`);
                }
            } catch (error) {
                console.error("Error parsing/uploading JSON:", error);
                alert("❌ Invalid JSON file format. Ensure it contains a valid array of question objects.");
            } finally {
                setImporting(false);
            }
        };
        reader.readAsText(file);
        e.target.value = null; // Reset input
    };

    const handleExplanationsUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target.result);
                const explanationsArray = Array.isArray(json) ? json : (json.explanations || json.questions || [json]);

                const res = await fetch(`/api/placement-series/question-bank`, {
                    method: "PATCH",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventId, explanations: explanationsArray })
                });

                const data = await res.json();
                if (res.ok) {
                    let msg = `✅ Successfully updated explanations for ${data.updatedCount || 0} questions!`;
                    if (data.errors && data.errors.length > 0) {
                        msg += `\n\n⚠️ Note (${data.errors.length} skipped):\n` + data.errors.slice(0, 3).join("\n");
                    }
                    alert(msg);
                    fetchQuestions();
                } else {
                    alert(`❌ Failed to update explanations: ${data.error || 'Server error'}`);
                }
            } catch (error) {
                console.error("Error parsing/uploading explanations JSON:", error);
                alert("❌ Invalid JSON file format. Ensure it contains an array with question_no, company_label, and explanation.");
            } finally {
                setImporting(false);
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    const toggleExplanation = (id) => {
        setExpandedExplanations(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
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
                        <p className="text-white/50 mt-1">Manage global questions, solutions & daily bank questions.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                        {/* Questions Upload */}
                        <input 
                            type="file" 
                            accept=".json" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                        />
                        {/* Explanations Upload */}
                        <input 
                            type="file" 
                            accept=".json" 
                            className="hidden" 
                            ref={explanationsFileInputRef} 
                            onChange={handleExplanationsUpload} 
                        />

                        <button 
                            disabled={importing}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
                            title="Import question statements & options"
                        >
                            {importing ? <Loader2 className="w-4 h-4 animate-spin text-teal-400" /> : <UploadCloud className="w-4 h-4" />}
                            Import Questions JSON
                        </button>

                        <button 
                            disabled={importing}
                            onClick={() => explanationsFileInputRef.current?.click()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
                            title="Upload explanations in format: question_no, company_label, explanation"
                        >
                            <FileText className="w-4 h-4" />
                            Import Explanations
                        </button>

                        <button 
                            onClick={() => openModal()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-black px-5 py-2.5 rounded-xl font-bold transition-all text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Question
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input 
                            type="text" 
                            placeholder="Search questions by statement or company tag..."
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
                        <p className="text-white/50 text-sm mt-1">Import questions or explanations to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-teal-400/30 transition-colors">
                                <div className="flex justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                                            <span className="text-xs font-mono px-2 py-0.5 bg-white/10 rounded-md text-white/70">#{idx + 1}</span>
                                            {q.category && (
                                                <span className="text-xs font-semibold px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-md border border-teal-500/30">
                                                    {q.category}
                                                </span>
                                            )}
                                            {q.tags && q.tags.length > 0 && q.tags.map((tag, tIdx) => (
                                                <span key={tIdx} className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                                    tag.startsWith('q_no:') 
                                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                                                        : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                                }`}>
                                                    <Tag className="w-3 h-3" />
                                                    {tag.startsWith('q_no:') ? `Q#${tag.replace('q_no:', '')}` : tag}
                                                </span>
                                            ))}
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                                                q.difficulty === 'hard' ? 'bg-red-500/20 text-red-300' : 
                                                q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
                                            }`}>{q.difficulty}</span>

                                            {q.explanation && (
                                                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30 flex items-center gap-1">
                                                    ✓ Has Explanation
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-lg font-medium mb-3">{q.question_text}</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                            {q.options.map((opt, i) => (
                                                <div key={i} className={`text-sm px-3 py-2 rounded-lg border ${
                                                    i === q.correct_option ? 'border-teal-400/50 bg-teal-400/10 text-teal-200' : 'border-white/10 bg-black/40 text-white/70'
                                                }`}>
                                                    <span className="mr-2 opacity-50 font-bold font-mono">{String.fromCharCode(65 + i)}.</span>
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Explanation preview toggle */}
                                        {q.explanation && (
                                            <div className="mt-2">
                                                <button 
                                                    onClick={() => toggleExplanation(q.id)}
                                                    className="text-xs text-teal-400/80 hover:text-teal-300 flex items-center gap-1 font-medium transition-colors"
                                                >
                                                    {expandedExplanations[q.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                    {expandedExplanations[q.id] ? 'Hide Explanation' : 'View Explanation'}
                                                </button>
                                                {expandedExplanations[q.id] && (
                                                    <div className="mt-2 p-3 rounded-lg bg-teal-950/30 border border-teal-500/20 text-xs text-teal-200/90 leading-relaxed">
                                                        <strong className="text-teal-300">Explanation: </strong>
                                                        {q.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => openModal(q)} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(q.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-white/70 hover:text-red-400 transition-colors" title="Delete">
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

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Company / Tag (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.companyLabel}
                                        onChange={e => setFormData({...formData, companyLabel: e.target.value})}
                                        placeholder="e.g. Flipkart, Amazon"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-teal-400/50 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
                                    <select 
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-teal-400/50 outline-none text-sm"
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
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-teal-400/50 outline-none text-sm"
                                    >
                                        <option value="easy" className="bg-gray-900">Easy</option>
                                        <option value="medium" className="bg-gray-900">Medium</option>
                                        <option value="hard" className="bg-gray-900">Hard</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-3">Options (Select the radio to mark correct option)</label>
                                <div className="space-y-3">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-3">
                                            <button 
                                                type="button"
                                                onClick={() => setFormData({...formData, correctOption: i})}
                                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs font-mono border transition-all ${
                                                    formData.correctOption === i ? 'bg-teal-500 border-teal-500 text-black shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'border-white/30 bg-white/5 text-white/70'
                                                }`}
                                            >
                                                {String.fromCharCode(65 + i)}
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
                                <label className="block text-sm font-medium text-white/70 mb-2">Explanation / Solution (Optional)</label>
                                <textarea 
                                    rows={3}
                                    value={formData.explanation}
                                    onChange={e => setFormData({...formData, explanation: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-400/50 outline-none"
                                    placeholder="Step-by-step solution shown to students after submission"
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
