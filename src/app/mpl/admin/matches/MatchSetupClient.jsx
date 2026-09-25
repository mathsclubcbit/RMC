'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, CircleDot, Crosshair, Play, Plus, Scissors, Wind, X } from 'lucide-react';
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
    const [sideTeams, setSideTeams] = useState([[''], ['']]);
    const [sideNames, setSideNames] = useState(['Team A', 'Team B']);
    const [totalQuestions] = useState(20);
    const wideBallCount = 4;
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
    const selectedTeams = sideTeams.flat();
    const availableTeams = (sideIndex) => teams.filter((team) => sideTeams[sideIndex].includes(team.id) || !selectedTeams.includes(team.id));

    const updateTeam = (sideIndex, teamIndex, value) => setSideTeams((current) => current.map((side, index) => index === sideIndex ? side.map((teamId, itemIndex) => itemIndex === teamIndex ? value : teamId) : side));
    const addTeam = (sideIndex) => setSideTeams((current) => current.map((side, index) => index === sideIndex ? [...side, ''] : side));
    const removeTeam = (sideIndex, teamIndex) => setSideTeams((current) => current.map((side, index) => index === sideIndex ? side.filter((_, itemIndex) => itemIndex !== teamIndex) : side));
    const updateSideName = (sideIndex, value) => setSideNames((current) => current.map((name, index) => index === sideIndex ? value : name));
    const updateCount = (slug, value) => setDistribution((current) => ({ ...current, [slug]: value }));
    const updateMentor = (index, field, value) => setMentors((current) => current.map((mentor, mentorIndex) => mentorIndex === index ? { ...mentor, [field]: value } : mentor));

    const importRoster = async (index, file) => {
        if (!file || !sideTeams[index]?.[0]) return;
        const lines = (await file.text()).split(/\r?\n/).filter(Boolean).map(parseCsvLine);
        if (lines.length < 2) { setMessage('CSV must contain a header row and at least one player.'); return; }
        const headers = lines[0].map((header) => header.toLowerCase().replace(/\s+/g, '_'));
        const players = lines.slice(1).map((values) => Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex] || ''])));
        const response = await fetch('/api/mpl/import-players', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamId: sideTeams[index][0], players }) });
        const data = await response.json();
        setMessage(response.ok ? `Imported ${data.count} player(s) into Team ${index === 0 ? 'A' : 'B'}.` : (data.error || 'Unable to import players.'));
    };

    const createMatch = async (event) => {
        event.preventDefault();
        setMessage('');
        setCreatedMatch(null);
        const validBallCount = Number(totalQuestions) - wideBallCount;
        if (distributionTotal !== validBallCount) {
            setMessage(`Question distribution must total ${validBallCount}; the remaining ${wideBallCount} balls are automatic wides.`);
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch('/api/mpl/matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sideTeamIds: sideTeams,
                    sideNames,
                    mentors,
                    totalQuestionsPerInnings: Number(totalQuestions),
                    wideBallCount,
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
                        {[0, 1].map((sideIndex) => <div key={sideIndex} className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4"><label className="block text-sm text-zinc-300">{sideIndex === 0 ? 'Team A side name' : 'Team B side name'}<input required value={sideNames[sideIndex]} onChange={(event) => updateSideName(sideIndex, event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" /></label>{sideTeams[sideIndex].map((teamId, teamIndex) => <div key={`${sideIndex}-${teamIndex}`} className="flex gap-2"><select required value={teamId} onChange={(event) => updateTeam(sideIndex, teamIndex, event.target.value)} className="mt-2 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white"><option value="">Select registered team</option>{availableTeams(sideIndex).map((team) => <option key={team.id} value={team.id}>{team.team_name} ({team.team_code})</option>)}</select>{sideTeams[sideIndex].length > 1 && <button type="button" onClick={() => removeTeam(sideIndex, teamIndex)} className="mt-2 rounded-lg border border-red-400/20 px-3 text-red-300" aria-label="Remove team"><X className="h-4 w-4" /></button>}</div>)}<button type="button" onClick={() => addTeam(sideIndex)} className="flex items-center gap-2 text-xs font-semibold text-teal-300"><Plus className="h-4 w-4" /> Add team to this side</button><input type="file" accept=".csv,text/csv" onChange={(event) => importRoster(sideIndex, event.target.files?.[0])} className="w-full text-xs text-zinc-500" /><span className="block text-[10px] text-zinc-600">CSV import adds players to the first team on this side.</span></div>)}
                        <label className="block text-sm text-zinc-300">Balls per innings
                            <input required readOnly type="number" value={totalQuestions} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" />
                        </label>
                        <div className="grid grid-cols-2 gap-3"><label className="text-sm text-zinc-300">Base seconds<input min="10" type="number" value={baseTimerSeconds} onChange={(event) => setBaseTimerSeconds(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" /></label><label className="text-sm text-zinc-300">Adjustment<select value={timerAdjustment} onChange={(event) => setTimerAdjustment(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white"><option value={-30}>-30 seconds</option><option value={0}>No adjustment</option><option value={30}>+30 seconds</option></select></label></div>
                        <div className="border-t border-white/10 pt-4"><p className="mb-3 text-xs uppercase tracking-widest text-zinc-400">RMC Mentors</p><div className="space-y-3">{[0, 1].map((index) => <div key={index} className="grid grid-cols-2 gap-3"><input required value={mentors[index].name} onChange={(event) => updateMentor(index, 'name', event.target.value)} placeholder={`Team ${index === 0 ? 'A' : 'B'} mentor name`} className="rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" /><input required type="email" value={mentors[index].email} onChange={(event) => updateMentor(index, 'email', event.target.value)} placeholder="Mentor email" className="rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" /></div>)}</div></div>
                        <div className="border-t border-white/10 pt-4"><p className="mb-3 text-xs uppercase tracking-widest text-zinc-400">Streak settings</p><div className="grid grid-cols-3 gap-3"><label className="text-xs text-zinc-300">Threshold<input min="1" type="number" value={streakThreshold} onChange={(event) => setStreakThreshold(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" /></label><label className="text-xs text-zinc-300">Correct bonus<input min="0" type="number" value={battingStreakBonusRuns} onChange={(event) => setBattingStreakBonusRuns(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" /></label><label className="text-xs text-zinc-300">Failure deduction<input min="0" type="number" value={bowlingStreakDeductionRuns} onChange={(event) => setBowlingStreakDeductionRuns(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" /></label></div></div>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Question distribution</h2><p className="mt-1 text-xs text-zinc-500">16 question balls + 4 automatic wides (+1 each).</p></div><span className={`text-sm font-bold ${distributionTotal === Number(totalQuestions) - wideBallCount ? 'text-teal-300' : 'text-amber-300'}`}>{distributionTotal} / {Number(totalQuestions) - wideBallCount}</span></div>
                        <div className="space-y-3">{ballTypes.map((type) => { const Icon = type.metadata?.icon === 'in_swinger' ? Wind : type.metadata?.icon === 'out_swinger' ? Crosshair : type.metadata?.icon === 'leg_cutter' || type.metadata?.icon === 'off_cutter' ? Scissors : CircleDot; return <label key={type.slug} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-3"><span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400/10 text-teal-300"><Icon className="h-4 w-4" /></span><span><span className="block text-sm">{type.name}</span><span className="block text-xs text-zinc-500">{type.description}</span></span></span><input min="0" type="number" value={distribution[type.slug] ?? 0} onChange={(event) => updateCount(type.slug, event.target.value)} className="w-20 rounded-lg border border-white/10 bg-black/50 p-2 text-center text-sm text-white" /></label>; })}</div>
                        <button disabled={submitting || distributionTotal !== Number(totalQuestions) - wideBallCount} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-400 px-4 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"><Play className="h-4 w-4" />{submitting ? 'Creating...' : 'Create match'}</button>
                        {message && <p className="mt-3 text-sm text-teal-200">{message}</p>}
                        {createdMatch && <div className="mt-3 rounded-lg border border-teal-400/20 bg-teal-400/5 p-3"><p className="text-xs text-zinc-400">Match created. The organiser controls the live game while teams answer on screen.</p><Link href={`/mpl/admin/matches/${createdMatch.id}`} className="mt-2 inline-flex rounded-lg bg-teal-400 px-3 py-2 text-xs font-bold text-black">Open live match</Link></div>}
                    </section>
                </form>
            </div>
        </main>
    );
}
