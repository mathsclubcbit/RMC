"use client";

import { useState, useEffect } from "react";
import { Database, Plus, X, Edit3, Trash2, Loader2, Search, ChevronDown, ChevronUp, Check } from "lucide-react";

const DIFFICULTY_COLORS = {
    easy: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
    medium: "text-amber-400 bg-amber-500/20 border-amber-500/30",
    hard: "text-red-400 bg-red-500/20 border-red-500/30",
};

const DIFFICULTY_POINTS = { easy: 1, medium: 2, hard: 3 };

const emptyForm = {
    questionText: "",
    options: ["", "", "", ""],
    correctOption: 0,
    difficulty: "medium",
    explanation: "",
};

export default function QuizQuestionsClient({ eventId }) {
    const [questions, setQuestions] = useState([]);
    const [stats, setStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterDiff, setFilterDiff] = useState("all");

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [modalMode, setModalMode] = useState("manual"); // 'manual' or 'json'
    const [jsonInput, setJsonInput] = useState("");

    useEffect(() => { fetchQuestions(); }, []);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/quiz/questions?eventId=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data.questions || []);
                setStats(data.stats || { total: 0, easy: 0, medium: 0, hard: 0 });
            }
        } catch (err) {
            console.error("Failed to fetch questions:", err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = questions.filter(q => {
        const matchSearch = q.question_text.toLowerCase().includes(search.toLowerCase());
        const matchDiff = filterDiff === "all" || q.difficulty === filterDiff;
        return matchSearch && matchDiff;
    });

    const openAdd = () => {
        setEditingId(null);
        setForm({ ...emptyForm });
        setFormError("");
        setModalMode("manual");
        setJsonInput("");
        setIsFormOpen(true);
    };

    const openEdit = (q) => {
        setEditingId(q.id);
        setForm({
            questionText: q.question_text,
            options: [...q.options],
            correctOption: q.correct_option,
            difficulty: q.difficulty,
            explanation: q.explanation || "",
        });
        setFormError("");
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        setFormError("");
        let body;

        if (modalMode === "json") {
            try {
                const parsed = JSON.parse(jsonInput);
                if (!Array.isArray(parsed)) throw new Error("JSON must be an array of questions.");
                body = { eventId, questions: parsed };
            } catch (err) {
                return setFormError("Invalid JSON: " + err.message);
            }
        } else {
            if (!form.questionText.trim()) return setFormError("Question text is required");
            if (form.options.some(o => !o.trim())) return setFormError("All options must be filled");
            if (form.correctOption < 0 || form.correctOption >= form.options.length) return setFormError("Select a correct answer");

            body = {
                questionText: form.questionText,
                options: form.options,
                correctOption: form.correctOption,
                difficulty: form.difficulty,
                explanation: form.explanation,
                eventId,
            };
        }

        setIsSaving(true);
        try {

            if (editingId) {
                body.id = editingId;
                const res = await fetch("/api/quiz/questions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
            } else {
                const res = await fetch("/api/quiz/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                if (!res.ok) throw new Error((await res.json()).error || "Failed to create");
            }

            setIsFormOpen(false);
            setEditingId(null);
            fetchQuestions();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this question?")) return;
        try {
            await fetch(`/api/quiz/questions?id=${id}`, { method: "DELETE" });
            fetchQuestions();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white px-4 py-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            <Database className="w-6 h-6 text-violet-400" />
                            Quiz Question Bank
                        </h1>
                        <p className="text-sm text-white/50 mt-1">Manage questions for this quiz event</p>
                    </div>
                    <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold text-sm transition-all">
                        <Plus className="w-4 h-4" /> Add Question
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {[
                        { label: "Total", value: stats.total, color: "text-white border-white/10" },
                        { label: "Easy", value: stats.easy, color: "text-emerald-400 border-emerald-500/20" },
                        { label: "Medium", value: stats.medium, color: "text-amber-400 border-amber-500/20" },
                        { label: "Hard", value: stats.hard, color: "text-red-400 border-red-500/20" },
                    ].map(s => (
                        <div key={s.label} className={`p-4 rounded-xl bg-black/40 border ${s.color} text-center`}>
                            <div className="text-2xl font-bold">{s.value}</div>
                            <div className="text-xs text-white/40 uppercase tracking-wider mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Search & Filter */}
                <div className="flex gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search questions..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-violet-400/50 text-sm"
                        />
                    </div>
                    <select
                        value={filterDiff}
                        onChange={e => setFilterDiff(e.target.value)}
                        className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-violet-400/50 appearance-none text-white"
                    >
                        <option value="all" className="bg-gray-900">All Difficulties</option>
                        <option value="easy" className="bg-gray-900">Easy</option>
                        <option value="medium" className="bg-gray-900">Medium</option>
                        <option value="hard" className="bg-gray-900">Hard</option>
                    </select>
                </div>

                {/* Questions List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-white/30">
                        <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>{questions.length === 0 ? "No questions yet. Add your first question!" : "No questions match your search."}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((q, idx) => (
                            <div key={q.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-white/30 font-mono">Q{idx + 1}</span>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[q.difficulty]}`}>
                                                {q.difficulty} · {q.points}pt
                                            </span>
                                        </div>
                                        <p className="text-sm text-white/90 font-medium">{q.question_text}</p>
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            {q.options.map((opt, oi) => (
                                                <div key={oi} className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 ${oi === q.correct_option ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-white/5 text-white/50"}`}>
                                                    {oi === q.correct_option && <Check className="w-3 h-3" />}
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(q)} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-violet-400 transition">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(q.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/50 hover:text-red-400 transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add/Edit Modal */}
                {isFormOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold">{editingId ? "Edit Question" : "Add Question"}</h2>
                                <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
                            </div>

                            {formError && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{formError}</div>}

                            {!editingId && (
                                <div className="flex gap-2 p-1 mb-6 bg-white/5 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => setModalMode("manual")}
                                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${modalMode === "manual" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                                    >
                                        Manual Entry
                                    </button>
                                    <button
                                        onClick={() => setModalMode("json")}
                                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${modalMode === "json" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}
                                    >
                                        Bulk JSON Import
                                    </button>
                                </div>
                            )}

                            {modalMode === "json" ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Paste JSON Array</label>
                                        <textarea
                                            value={jsonInput}
                                            onChange={e => setJsonInput(e.target.value)}
                                            rows={12}
                                            className="w-full p-4 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-violet-400/50 text-sm font-mono text-zinc-300 custom-scrollbar"
                                            placeholder='[\n  {\n    "question_text": "...",\n    "options": ["A", "B", "C", "D"],\n    "correct_option": 0,\n    "difficulty": "easy",\n    "points": 1\n  }\n]'
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Question</label>
                                    <textarea
                                        value={form.questionText}
                                        onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-violet-400/50 text-sm"
                                        placeholder="Enter the question..."
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Options (click to mark correct)</label>
                                    <div className="space-y-2">
                                        {form.options.map((opt, oi) => (
                                            <div key={oi} className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, correctOption: oi }))}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border transition ${oi === form.correctOption ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/10 text-white/30 hover:border-white/20"}`}
                                                >
                                                    {oi === form.correctOption ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + oi)}
                                                </button>
                                                <input
                                                    value={opt}
                                                    onChange={e => {
                                                        const updated = [...form.options];
                                                        updated[oi] = e.target.value;
                                                        setForm(f => ({ ...f, options: updated }));
                                                    }}
                                                    className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 outline-none focus:border-violet-400/50 text-sm"
                                                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Difficulty</label>
                                        <select
                                            value={form.difficulty}
                                            onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-violet-400/50 appearance-none text-white"
                                        >
                                            <option value="easy" className="bg-gray-900">🟢 Easy (1 pt)</option>
                                            <option value="medium" className="bg-gray-900">🟡 Medium (2 pts)</option>
                                            <option value="hard" className="bg-gray-900">🔴 Hard (3 pts)</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <div className={`w-full text-center py-2.5 rounded-xl border text-sm font-bold ${DIFFICULTY_COLORS[form.difficulty]}`}>
                                            {DIFFICULTY_POINTS[form.difficulty]} point{DIFFICULTY_POINTS[form.difficulty] !== 1 ? "s" : ""}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Explanation (optional)</label>
                                    <textarea
                                        value={form.explanation}
                                        onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-violet-400/50 text-sm"
                                        placeholder="Why is this the correct answer?"
                                    />
                                </div>
                            </div>
                            )}

                            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-white/10">
                                <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-xl text-sm text-white/60 hover:bg-white/10 transition">Cancel</button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-6 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold text-sm transition disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Save Changes" : "Add Question"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
