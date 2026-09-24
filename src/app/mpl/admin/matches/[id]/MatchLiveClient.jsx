'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldAlert, Timer } from 'lucide-react';
import Link from 'next/link';

export default function MatchLiveClient({ match: initialMatch, matchTeams, initialDeliveries }) {
    const [match, setMatch] = useState(initialMatch);
    const [liveMatchTeams, setLiveMatchTeams] = useState(matchTeams);
    const [deliveries, setDeliveries] = useState(initialDeliveries);
    const [tossWinner, setTossWinner] = useState('');
    const [firstBatting, setFirstBatting] = useState('');
    const [batter, setBatter] = useState('');
    const [bowler, setBowler] = useState('');
    const [activeDelivery, setActiveDelivery] = useState(null);
    const [phase, setPhase] = useState('batter');
    const [powerShot, setPowerShot] = useState(false);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let mounted = true;
        const refreshRoster = async () => {
            const response = await fetch(`/api/mpl/matches/${initialMatch.id}/roster`, { cache: 'no-store' });
            if (!response.ok || !mounted) return;
            const data = await response.json();
            setLiveMatchTeams(data.teams || []);
        };
        refreshRoster();
        const interval = setInterval(refreshRoster, 3000);
        return () => { mounted = false; clearInterval(interval); };
    }, [initialMatch.id]);

    const currentInnings = match.status === 'innings_2' ? 2 : 1;
    const inningsTeam = liveMatchTeams.find((team) => team.innings_number === currentInnings);
    const livePlayers = liveMatchTeams.flatMap((team) => team.players || []);
    const currentPlayers = inningsTeam?.players || [];
    const plannedType = match.rules_config?.question_plan?.[deliveries.filter((delivery) => delivery.innings_number === currentInnings).length];
    const deliveryNumber = deliveries.filter((delivery) => delivery.innings_number === currentInnings).length + 1;
    const teamName = (teamId) => liveMatchTeams.find((team) => team.team_id === teamId)?.mpl_teams?.team_name || 'Team';
    const battingTeamId = match.status === 'innings_2'
        ? liveMatchTeams.find((team) => team.team_id !== match.first_batting_team_id)?.team_id
        : match.first_batting_team_id;
    const orderedTeams = [...liveMatchTeams].sort((first, second) => {
        if (first.team_id === battingTeamId) return -1;
        if (second.team_id === battingTeamId) return 1;
        return first.innings_number - second.innings_number;
    });

    const recordToss = async (event) => {
        event.preventDefault();
        setBusy(true); setMessage('');
        const response = await fetch(`/api/mpl/matches/${match.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tossWinnerTeamId: tossWinner, firstBattingTeamId: firstBatting }) });
        const data = await response.json();
        if (response.ok) setMatch(data.match); else setMessage(data.error || 'Unable to record toss.');
        setBusy(false);
    };

    const selectDelivery = async (event) => {
        event.preventDefault();
        setBusy(true); setMessage('');
        const response = await fetch(`/api/mpl/matches/${match.id}/select-delivery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inningsNumber: currentInnings, deliveryNumber, ballTypeSlug: plannedType, batterId: batter, bowlerId: bowler }) });
        const data = await response.json();
        if (response.ok) { setActiveDelivery({ ...data.delivery, question: data.question }); setPhase('batter'); setPowerShot(false); } else setMessage(data.error || 'Unable to select delivery.');
        setBusy(false);
    };

    const submitAnswer = async (answerOption, powerShot = false) => {
        setBusy(true); setMessage('');
        const response = await fetch(`/api/mpl/matches/${activeDelivery.id}/submit-answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phase, answerOption, powerShot }) });
        const data = await response.json();
        if (response.ok) {
            setActiveDelivery(data.delivery);
            if (phase === 'batter' && data.delivery.metadata?.rescue_available) setPhase('bowler');
            else { setDeliveries((current) => [...current, data.delivery]); setActiveDelivery(null); setBatter(''); setBowler(''); setPowerShot(false); }
        } else setMessage(data.error || 'Unable to submit answer.');
        setBusy(false);
    };

    const answerOptions = useMemo(() => activeDelivery?.question?.options || [], [activeDelivery]);

    return (
        <main className="min-h-screen bg-[#050505] px-4 py-16 text-white">
            <div className="mx-auto max-w-6xl">
                <Link href="/mpl/admin/matches" className="mb-6 flex items-center gap-2 text-xs text-zinc-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Match setup</Link>
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.25em] text-teal-300">Live organiser controls</p><h1 className="mt-2 text-4xl font-bold">{teamName(match.first_batting_team_id)} batting</h1><p className="mt-2 text-sm text-zinc-500">Keep this screen with the organiser. Teams answer when the question is displayed.</p></div><span className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-widest text-zinc-400">{match.status.replace('_', ' ')}</span></div>

                <div className="mb-6 grid gap-4 md:grid-cols-2">
                    {orderedTeams.map((team) => <section key={team.team_id} className={`rounded-2xl border p-5 ${team.team_id === battingTeamId ? 'border-teal-400/40 bg-teal-400/10' : 'border-white/10 bg-white/5'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-zinc-400">{team.team_id === battingTeamId ? 'Batting team' : 'Bowling team'}</p><h2 className="mt-1 text-xl font-bold">{team.mpl_teams?.team_name}</h2><p className="text-xs text-zinc-500">{team.mpl_teams?.team_code}</p></div><span className="rounded-full bg-black/30 px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-400">{team.players?.length || 0} joined</span></div><div className="mt-4 space-y-2">{(team.players || []).map((player) => <div key={player.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"><span>{player.name}{player.is_leader ? ' (Captain)' : ''}</span><span className="text-xs text-zinc-500">{player.roll_number}</span></div>)}{(!team.players || team.players.length === 0) && <p className="text-sm text-zinc-500">No players registered.</p>}</div></section>)}
                </div>

                {match.status === 'toss_pending' && <form onSubmit={recordToss} className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"><h2 className="text-xl font-bold">Record toss</h2><select required value={tossWinner} onChange={(event) => setTossWinner(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm"><option value="">Toss winner</option>{matchTeams.map((team) => <option key={team.team_id} value={team.team_id}>{team.mpl_teams.team_name}</option>)}</select><select required value={firstBatting} onChange={(event) => setFirstBatting(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm"><option value="">First batting team</option>{matchTeams.map((team) => <option key={team.team_id} value={team.team_id}>{team.mpl_teams.team_name}</option>)}</select><button disabled={busy} className="rounded-lg bg-teal-400 px-5 py-3 text-sm font-bold text-black">Confirm toss</button></form>}

                {match.status !== 'toss_pending' && <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]"><section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"><div className="flex items-center justify-between"><h2 className="font-bold">Delivery {deliveryNumber}</h2><span className="flex items-center gap-2 text-xs text-zinc-400"><Timer className="h-4 w-4" /> Planned: {plannedType}</span></div>{!activeDelivery ? <form onSubmit={selectDelivery} className="space-y-4"><select required value={batter} onChange={(event) => setBatter(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm"><option value="">Select batter</option>{currentPlayers.map((player) => <option key={player.id} value={player.id}>{player.name} ({player.roll_number})</option>)}</select><select required value={bowler} onChange={(event) => setBowler(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm"><option value="">Select bowler</option>{livePlayers.filter((player) => player.team_id !== inningsTeam?.team_id).map((player) => <option key={player.id} value={player.id}>{player.name} ({player.roll_number})</option>)}</select><button disabled={busy || !plannedType} className="w-full rounded-lg bg-white px-4 py-3 text-sm font-bold text-black">Display question</button></form> : <div className="space-y-4"><div className="rounded-xl border border-teal-400/20 bg-teal-400/5 p-4"><p className="text-xs uppercase tracking-widest text-teal-300">{phase === 'batter' ? 'Batter attempt' : 'Bowler rescue attempt'}</p><p className="mt-3 text-lg font-semibold">{activeDelivery.question?.question_text}</p></div>{phase === 'batter' && <label className="flex items-center gap-2 text-xs text-amber-200"><input type="checkbox" checked={powerShot} onChange={(event) => setPowerShot(event.target.checked)} /> Use Power Shot for this answer</label>}<div className="grid gap-3">{answerOptions.map((option, index) => <button key={index} disabled={busy} onClick={() => submitAnswer(index, phase === 'batter' && powerShot)} className="rounded-lg border border-white/10 bg-black/20 p-3 text-left text-sm hover:border-teal-400/50">{index + 1}. {option}</button>)}</div><p className="flex items-center gap-2 text-xs text-zinc-500"><ShieldAlert className="h-4 w-4" /> Incorrect batter answer opens the same question for the bowler.</p></div>}{message && <p className="text-sm text-amber-200">{message}</p>}</section><section className="rounded-2xl border border-white/10 bg-white/5 p-6"><h2 className="mb-4 font-bold">Completed deliveries</h2><div className="space-y-3">{deliveries.filter((delivery) => delivery.innings_number === currentInnings).map((delivery) => <div key={delivery.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3 text-sm"><span>#{delivery.delivery_number} <span className="text-zinc-500">{delivery.ball_type_slug}</span></span><span className="flex items-center gap-2 text-xs text-zinc-400">{delivery.status} <CheckCircle2 className="h-4 w-4 text-teal-300" /></span></div>)}{deliveries.length === 0 && <p className="text-sm text-zinc-500">No deliveries recorded yet.</p>}</div></section></div>}
            </div>
        </main>
    );
}
