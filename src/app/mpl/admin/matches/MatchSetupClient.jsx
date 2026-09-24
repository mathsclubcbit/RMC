'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';

const defaultCount = (slug) => slug === 'normal_1' ? 1 : 0;

function parseCsvLine(line) {
    const values = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (character === '"') {
            if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
            else quoted = !quoted;
        } else if (character === ',' && !quoted) {
            values.push(value.trim()); value = '';
        } else value += character;
    }
    values.push(value.trim());
    return values;
}

export default function MatchSetupClient({ teams, ballTypes }) {
    const [selectedTeams, setSelectedTeams] = useState(['', '']);
    const [totalQuestions, setTotalQuestions] = useState(10);
    const [baseTimerSeconds, setBaseTimerSeconds] = useState(60);
    const [timerAdjustment, setTimerAdjustment] = useState(0);
    const [mentors, setMentors] = useState([{ name: '', email: '' }, { name: '', email: '' }]);
    const [streakThreshold, setStreakThreshold] = useState(3);
    const [battingStreakBonusRuns, setBattingStreakBonusRuns] = useState(2);
    const [bowlingStreakDeductionRuns, setBowlingStreakDeductionRuns] = useState(2);
    const [distribution, setDistribution] = useState(() => Object.fromEntries(ballTypes.map((type) => [type.slug, defaultCount(type.slug)])));
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [createdMatch, setCreatedMatch] = useState(null);

    const distributionTotal = useMemo(() => Object.values(distribution).reduce((sum, count) => sum + Number(count || 0), 0), [distribution]);
    const availableTeams = (index) => teams.filter((team) => team.id === selectedTeams[index] || !selectedTeams.includes(team.id));

    const updateTeam = (index, value) => setSelectedTeams((current) => current.map((teamId, teamIndex) => teamIndex === index ? value : teamId));
    const updateCount = (slug, value) => setDistribution((current) => ({ ...current, [slug]: value }));
    const updateMentor = (index, field, value) => setMentors((current) => current.map((mentor, mentorIndex) => mentorIndex === index ? { ...mentor, [field]: value } : mentor));

    const importRoster = async (index, file) => {
        if (!file || !selectedTeams[index]) return;
        const lines = (await file.text()).split(/\r?\n/).filter(Boolean).map(parseCsvLine);
        if (lines.length < 2) { setMessage('CSV must contain a header row and at least one player.'); return; }
        const headers = lines[0].map((header) => header.toLowerCase().replace(/\s+/g, '_'));
        const players = lines.slice(1).map((values) => Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex] || ''])));
        const response = await fetch('/api/mpl/import-players', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamId: selectedTeams[index], players }) });
        const data = await response.json();
        setMessage(response.ok ? `Imported ${data.count} player(s) into Team ${index === 0 ? 'A' : 'B'}.` : (data.error || 'Unable to import players.'));
    };

    const createMatch = async (event) => {
        event.preventDefault();
        setMessage('');
        setCreatedMatch(null);
        if (distributionTotal !== Number(totalQuestions)) {
            setMessage(`Question counts total ${distributionTotal}; set them to ${totalQuestions}.`);
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch('/api/mpl/matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamIds: selectedTeams,
                    mentors,
                    totalQuestionsPerInnings: Number(totalQuestions),
                    baseTimerSeconds: Number(baseTimerSeconds),
                    timerAdjustmentSeconds: Number(timerAdjustment),
                    streakThreshold: Number(streakThreshold),
                    battingStreakBonusRuns: Number(battingStreakBonusRuns),
                    bowlingStreakDeductionRuns: Number(bowlingStreakDeductionRuns),
                    questionDistribution: distribution
                })
            });
            const data = await response.json();
            if (!response.ok) {
                setMessage(data.error || 'Unable to create match.');
                return;
            }
            setCreatedMatch(data.match);
            setMessage('Match created and delivery plan locked.');
        } catch {
            setMessage('Unable to reach the match service.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#050505] px-4 py-20 text-white">
            <div className="mx-auto max-w-5xl">
                <Link href="/mpl/admin" className="mb-6 flex items-center gap-2 text-xs text-zinc-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Organiser panel</Link>
                <div className="mb-8">
                    <p className="text-xs uppercase tracking-[0.25em] text-teal-300">MPL match engine</p>
                    <h1 className="mt-2 text-4xl font-bold">Create match</h1>
                    <p className="mt-2 max-w-2xl text-sm text-zinc-400">Choose the teams, lock the innings question mix, and set the initial timer policy. The server validates question availability before creating the match.</p>
                </div>

                <form onSubmit={createMatch} className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                    <section className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h2 className="font-bold">Teams and timer</h2>
                        {[0, 1].map((index) => <label key={index} className="block text-sm text-zinc-300">{index === 0 ? 'Team A' : 'Team B'}
                            <select required value={selectedTeams[index]} onChange={(event) => updateTeam(index, event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white">
                                <option value="">Select team</option>
                                {availableTeams(index).map((team) => <option key={team.id} value={team.id}>{team.team_name} ({team.team_code})</option>)}
                            </select>
                            <input type="file" accept=".csv,text/csv" onChange={(event) => importRoster(index, event.target.files?.[0])} className="mt-2 w-full text-xs text-zinc-500" />
                            <span className="mt-1 block text-[10px] text-zinc-600">CSV headers: name, roll_number, email, phone_number</span>
                        </label>)}
                        <label className="block text-sm text-zinc-300">Questions per innings
                            <input required min="1" type="number" value={totalQuestions} onChange={(event) => setTotalQuestions(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" />
                        </label>
                        <div className="grid grid-cols-2 gap-3"><label className="text-sm text-zinc-300">Base seconds<input min="10" type="number" value={baseTimerSeconds} onChange={(event) => setBaseTimerSeconds(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" /></label><label className="text-sm text-zinc-300">Adjustment<select value={timerAdjustment} onChange={(event) => setTimerAdjustment(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white"><option value={-30}>-30 seconds</option><option value={0}>No adjustment</option><option value={30}>+30 seconds</option></select></label></div>
                        <div className="border-t border-white/10 pt-4"><p className="mb-3 text-xs uppercase tracking-widest text-zinc-400">RMC Mentors</p><div className="space-y-3">{[0, 1].map((index) => <div key={index} className="grid grid-cols-2 gap-3"><input required value={mentors[index].name} onChange={(event) => updateMentor(index, 'name', event.target.value)} placeholder={`Team ${index === 0 ? 'A' : 'B'} mentor name`} className="rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" /><input required type="email" value={mentors[index].email} onChange={(event) => updateMentor(index, 'email', event.target.value)} placeholder="Mentor email" className="rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" /></div>)}</div></div>
                        <div className="border-t border-white/10 pt-4"><p className="mb-3 text-xs uppercase tracking-widest text-zinc-400">Streak settings</p><div className="grid grid-cols-3 gap-3"><label className="text-xs text-zinc-300">Threshold<input min="1" type="number" value={streakThreshold} onChange={(event) => setStreakThreshold(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" /></label><label className="text-xs text-zinc-300">Correct bonus<input min="0" type="number" value={battingStreakBonusRuns} onChange={(event) => setBattingStreakBonusRuns(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" /></label><label className="text-xs text-zinc-300">Failure deduction<input min="0" type="number" value={bowlingStreakDeductionRuns} onChange={(event) => setBowlingStreakDeductionRuns(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" /></label></div></div>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Question distribution</h2><p className="mt-1 text-xs text-zinc-500">Counts must equal {totalQuestions}.</p></div><span className={`text-sm font-bold ${distributionTotal === Number(totalQuestions) ? 'text-teal-300' : 'text-amber-300'}`}>{distributionTotal} / {totalQuestions}</span></div>
                        <div className="space-y-3">{ballTypes.map((type) => <label key={type.slug} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-3"><span><span className="block text-sm">{type.name}</span><span className="block text-xs text-zinc-500">{type.description}</span></span><input min="0" type="number" value={distribution[type.slug] ?? 0} onChange={(event) => updateCount(type.slug, event.target.value)} className="w-20 rounded-lg border border-white/10 bg-black/50 p-2 text-center text-sm text-white" /></label>)}</div>
                        <button disabled={submitting || distributionTotal !== Number(totalQuestions)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-400 px-4 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"><Play className="h-4 w-4" />{submitting ? 'Creating...' : 'Create match'}</button>
                        {message && <p className="mt-3 text-sm text-teal-200">{message}</p>}
                        {createdMatch && <div className="mt-3 rounded-lg border border-teal-400/20 bg-teal-400/5 p-3"><p className="text-xs text-zinc-400">Match created. The organiser controls the live game while teams answer on screen.</p><Link href={`/mpl/admin/matches/${createdMatch.id}`} className="mt-2 inline-flex rounded-lg bg-teal-400 px-3 py-2 text-xs font-bold text-black">Open live match</Link></div>}
                    </section>
                </form>
            </div>
        </main>
    );
}
