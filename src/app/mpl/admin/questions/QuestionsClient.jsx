'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Database, UploadCloud } from 'lucide-react';
import Link from 'next/link';

const emptyForm = {
    questionText: '',
    options: ['', '', '', ''],
    correctOption: 0,
    ballTypeSlug: 'normal_1',
    runs: '',
    timerSeconds: '',
    explanation: ''
};

export default function QuestionsClient() {
    const [ballTypes, setBallTypes] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [filter, setFilter] = useState('');
    const [message, setMessage] = useState('');
    const [loadError, setLoadError] = useState('');
    const fileRef = useRef(null);

    const load = async () => {
        const [typesResponse, questionsResponse] = await Promise.all([
            fetch('/api/mpl/ball-types'),
            fetch(`/api/mpl/question-bank${filter ? `?ballType=${encodeURIComponent(filter)}` : ''}`)
        ]);
        const typesData = await typesResponse.json().catch(() => ({}));
        const questionsData = await questionsResponse.json().catch(() => ({}));
        if (typesResponse.ok) {
            setBallTypes(typesData.ballTypes || []);
            setLoadError('');
        } else {
            setLoadError(typesData.error || 'Unable to load MPL ball types. Apply the MPL database migration first.');
        }
        if (questionsResponse.ok) setQuestions(questionsData.questions || []);
    };

    useEffect(() => {
        const refresh = async () => { await load(); };
        refresh();
        // load reads the current filter and is intentionally refreshed when the filter changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const updateOption = (index, value) => {
        setForm((current) => ({ ...current, options: current.options.map((option, optionIndex) => optionIndex === index ? value : option) }));
    };

    const save = async (event) => {
        event.preventDefault();
        setMessage('');
        const response = await fetch('/api/mpl/question-bank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.error || 'Unable to save question.');
            return;
        }
        setForm(emptyForm);
        setMessage('Question added.');
        load();
    };

    const importQuestions = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const parsed = JSON.parse(String(reader.result));
                const response = await fetch('/api/mpl/question-bank', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questions: Array.isArray(parsed) ? parsed : parsed.questions })
                });
                const data = await response.json();
                setMessage(response.ok ? `Imported ${data.count} question(s).` : (data.error || 'Import failed.'));
                if (response.ok) load();
            } catch {
                setMessage('Import requires a valid JSON array or { questions: [...] }.');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white px-4 py-20">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                        <Link href="/mpl/admin" className="text-xs text-zinc-400 hover:text-white flex items-center gap-2 mb-4"><ArrowLeft className="w-4 h-4" /> Organiser panel</Link>
                        <h1 className="text-3xl font-bold flex items-center gap-3"><Database className="w-8 h-8 text-teal-400" /> MPL Question Bank</h1>
                        <p className="text-sm text-zinc-500 mt-2">Questions are grouped by the ball variations defined in the MPL rules.</p>
                        {loadError && <p className="mt-3 max-w-2xl rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">{loadError} Run <code>supabase/migrations/020_mpl_match_engine.sql</code> in the Supabase SQL editor, then refresh this page.</p>}
                    </div>
                    <div>
                        <input ref={fileRef} type="file" accept=".json" hidden onChange={importQuestions} />
                        <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-bold text-black"><UploadCloud className="w-4 h-4" /> Import JSON</button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[360px_1fr] gap-6">
                    <form onSubmit={save} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                        <h2 className="font-bold">Add question</h2>
                        <textarea required value={form.questionText} onChange={(event) => setForm({ ...form, questionText: event.target.value })} placeholder="Question text or LaTeX" className="w-full min-h-28 rounded-lg bg-black/40 border border-white/10 p-3 text-sm" />
                        <select required disabled={ballTypes.length === 0} value={form.ballTypeSlug} onChange={(event) => setForm({ ...form, ballTypeSlug: event.target.value })} className="w-full rounded-lg bg-black/40 border border-white/10 p-3 text-sm">
                            {ballTypes.length === 0 && <option value="">No ball types available</option>}
                            {ballTypes.map((type) => <option key={type.slug} value={type.slug}>{type.name} ({type.slug})</option>)}
                        </select>
                        {form.options.map((option, index) => <input key={index} required value={option} onChange={(event) => updateOption(index, event.target.value)} placeholder={`Option ${index + 1}`} className="w-full rounded-lg bg-black/40 border border-white/10 p-3 text-sm" />)}
                        <label className="block text-xs text-zinc-400">Correct option<select value={form.correctOption} onChange={(event) => setForm({ ...form, correctOption: Number(event.target.value) })} className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 p-3 text-sm"><option value={0}>Option 1</option><option value={1}>Option 2</option><option value={2}>Option 3</option><option value={3}>Option 4</option></select></label>
                        <div className="grid grid-cols-2 gap-3"><input type="number" min="0" value={form.runs} onChange={(event) => setForm({ ...form, runs: event.target.value })} placeholder="Runs override" className="rounded-lg bg-black/40 border border-white/10 p-3 text-sm" /><input type="number" min="1" value={form.timerSeconds} onChange={(event) => setForm({ ...form, timerSeconds: event.target.value })} placeholder="Timer override" className="rounded-lg bg-black/40 border border-white/10 p-3 text-sm" /></div>
                        <textarea value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} placeholder="Explanation (optional)" className="w-full rounded-lg bg-black/40 border border-white/10 p-3 text-sm" />
                        <button className="w-full rounded-lg bg-white px-4 py-3 text-sm font-bold text-black">Add to bank</button>
                        {message && <p className="text-xs text-teal-300">{message}</p>}
                    </form>

                    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><h2 className="font-bold">Stored questions ({questions.length})</h2><select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg bg-black/40 border border-white/10 p-2 text-xs"><option value="">All ball types</option>{ballTypes.map((type) => <option key={type.slug} value={type.slug}>{type.name}</option>)}</select></div>
                        <div className="space-y-3">{questions.map((question) => <article key={question.id} className="rounded-xl border border-white/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-4"><p className="text-sm whitespace-pre-wrap">{question.question_text}</p><span className="shrink-0 rounded bg-teal-400/10 px-2 py-1 text-[10px] uppercase tracking-wider text-teal-300">{question.ball_type_slug}</span></div><p className="mt-2 text-xs text-zinc-500">{question.options?.length || 0} options{question.runs != null ? ` | ${question.runs} runs` : ''}{question.timer_seconds ? ` | ${question.timer_seconds}s` : ''}</p></article>)}{questions.length === 0 && <p className="py-12 text-center text-sm text-zinc-500">No questions uploaded yet.</p>}</div>
                    </section>
                </div>
            </div>
        </main>
    );
}
