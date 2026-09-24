'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';

const defaultCount = (slug) => slug === 'normal_1' ? 1 : 0;

export default function MatchSetupClient({ teams, ballTypes }) {
    const [selectedTeams, setSelectedTeams] = useState(['', '']);
    const [totalQuestions, setTotalQuestions] = useState(10);
    const [baseTimerSeconds, setBaseTimerSeconds] = useState(60);
    const [timerAdjustment, setTimerAdjustment] = useState(0);
    const [distribution, setDistribution] = useState(() => Object.fromEntries(ballTypes.map((type) => [type.slug, defaultCount(type.slug)])));
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [createdMatch, setCreatedMatch] = useState(null);

    const distributionTotal = useMemo(() => Object.values(distribution).reduce((sum, count) => sum + Number(count || 0), 0), [distribution]);
    const availableTeams = (index) => teams.filter((team) => team.id === selectedTeams[index] || !selectedTeams.includes(team.id));

    const updateTeam = (index, value) => setSelectedTeams((current) => current.map((teamId, teamIndex) => teamIndex === index ? value : teamId));
    const updateCount = (slug, value) => setDistribution((current) => ({ ...current, [slug]: value }));

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
                body: JSON.stringify({ teamIds: selectedTeams, totalQuestionsPerInnings: Number(totalQuestions), baseTimerSeconds: Number(baseTimerSeconds), timerAdjustmentSeconds: Number(timerAdjustment), questionDistribution: distribution })
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
                        </label>)}
                        <label className="block text-sm text-zinc-300">Questions per innings
                            <input required min="1" type="number" value={totalQuestions} onChange={(event) => setTotalQuestions(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" />
                        </label>
                        <div className="grid grid-cols-2 gap-3"><label className="text-sm text-zinc-300">Base seconds<input min="10" type="number" value={baseTimerSeconds} onChange={(event) => setBaseTimerSeconds(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white" /></label><label className="text-sm text-zinc-300">Adjustment<select value={timerAdjustment} onChange={(event) => setTimerAdjustment(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white"><option value={-30}>-30 seconds</option><option value={0}>No adjustment</option><option value={30}>+30 seconds</option></select></label></div>
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
