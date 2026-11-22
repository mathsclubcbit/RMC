'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldAlert, Timer, Zap } from 'lucide-react';
import Link from 'next/link';
import MatchCelebration from '../../../components/MatchCelebration';

export default function MatchLiveClient({ match: initialMatch, matchTeams, initialDeliveries }) {
    const [match, setMatch] = useState(initialMatch);
    const [liveMatchTeams, setLiveMatchTeams] = useState(matchTeams);
    const [deliveries, setDeliveries] = useState(initialDeliveries);
    const [tossWinner, setTossWinner] = useState('');
    const [tossCallingTeamId, setTossCallingTeamId] = useState(initialMatch.toss_calling_team_id || '');
    const [isFlipping, setIsFlipping] = useState(false);
    const [batter, setBatter] = useState('');
    const [bowler, setBowler] = useState('');
    const [activeDelivery, setActiveDelivery] = useState(null);
    const [phase, setPhase] = useState('batter');
    const [powerShot, setPowerShot] = useState(false);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [clockNow, setClockNow] = useState(() => Date.now());
    const [celebration, setCelebration] = useState(null);
    const [serverTimeOffset, setServerTimeOffset] = useState(0);
    const lastCelebrationDelivery = useRef(null);
    const matchCompletionSeen = useRef(false);

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

    const currentInnings = match.status === 'innings_1' || match.status === 'toss_pending' || match.status === 'toss_won' ? 1 : 2;
    const battingSideTeams = liveMatchTeams.filter((team) => team.innings_number === currentInnings);
    const bowlingSideTeams = liveMatchTeams.filter((team) => team.innings_number !== currentInnings);
    const currentPlayers = battingSideTeams.flatMap((team) => team.players || []);
    const bowlingPlayers = bowlingSideTeams.flatMap((team) => team.players || []);
    const anyPlayerOnline = liveMatchTeams.some((team) => (team.online_count || 0) > 0);
    const selectableBatters = anyPlayerOnline ? currentPlayers.filter((player) => player.is_online) : currentPlayers;
    const selectableBowlers = anyPlayerOnline ? bowlingPlayers.filter((player) => player.is_online) : bowlingPlayers;
    const dismissedPlayerIds = new Set(deliveries.filter((delivery) => delivery.status === 'wicket').map((delivery) => delivery.batter_id));
    const currentInningsDeliveries = deliveries.filter((delivery) => delivery.innings_number === currentInnings);

    const scoreState = useMemo(() => {
        let runs = 0, wickets = 0, boundaries = 0;
        const currentDeliveries = currentInningsDeliveries;
        currentDeliveries.forEach(d => {
            runs += (d.runs_awarded || 0) + (d.score_adjustment || 0);
            if (d.status === 'wicket') wickets += 1;
            if (d.runs_awarded >= 4) boundaries += 1;
        });
        const totalLegal = currentDeliveries.filter(d => !['wide', 'no_ball', 'cancelled'].includes(d.status)).length;
        return { runs, wickets, boundaries, totalLegal };
    }, [currentInningsDeliveries]);

    const deliveryNumber = currentInningsDeliveries.length + 1;

    const teamName = (teamId) => liveMatchTeams.find((team) => team.team_id === teamId)?.mpl_teams?.team_name || 'Team';
    const battingTeamId = match.status === 'innings_2'
        ? liveMatchTeams.find((team) => team.team_id !== match.first_batting_team_id)?.team_id
        : match.first_batting_team_id;
    const orderedTeams = [...liveMatchTeams].sort((first, second) => {
        if (first.team_id === battingTeamId) return -1;
        if (second.team_id === battingTeamId) return 1;
        return first.innings_number - second.innings_number;
    });

    const teamScores = useMemo(() => {
        return orderedTeams.map((team) => {
            const teamDeliveries = deliveries.filter((delivery) => delivery.innings_number === team.innings_number);
            return {
                team_id: team.team_id,
                team_name: team.mpl_teams?.team_name || 'Team',
                innings_number: team.innings_number,
                runs: teamDeliveries.reduce((total, delivery) => total + (delivery.runs_awarded || 0) + (delivery.score_adjustment || 0), 0),
                wickets: teamDeliveries.filter((delivery) => delivery.status === 'wicket').length,
                legal_deliveries: teamDeliveries.filter((delivery) => !['wide', 'no_ball', 'cancelled'].includes(delivery.status)).length
            };
        });
    }, [deliveries, orderedTeams]);

    const powerShotUsed = useMemo(() => {
        return deliveries.some(d => d.innings_number === currentInnings && d.metadata?.power_shot === true);
    }, [deliveries, currentInnings]);

    const matchOutcome = useMemo(() => {
        if (match.status !== 'completed' || orderedTeams.length < 2) return null;
        const team1 = orderedTeams[0], team2 = orderedTeams[1];

        const getStats = (inningsNum) => {
            let runs = 0, wickets = 0, boundaries = 0, answeringTimeSeconds = 0;
            deliveries.filter(d => d.innings_number === inningsNum).forEach(d => {
                runs += (d.runs_awarded || 0) + (d.score_adjustment || 0);
                if (d.status === 'wicket') wickets += 1;
                const boundaryRuns = Number(d.metadata?.base_runs ?? d.runs_awarded ?? 0);
                if (boundaryRuns === 4 || boundaryRuns === 6) boundaries += 1;
                if (d.answer_started_at && d.answer_submitted_at) {
                    answeringTimeSeconds += Math.max(0, (new Date(d.answer_submitted_at).getTime() - new Date(d.answer_started_at).getTime()) / 1000);
                }
            });
            return { runs, wickets, boundaries, answeringTimeSeconds };
        };

        const t1Stats = getStats(team1.innings_number), t2Stats = getStats(team2.innings_number);

        if (t1Stats.runs > t2Stats.runs) return { winner: team1, reason: 'by runs' };
        if (t2Stats.runs > t1Stats.runs) return { winner: team2, reason: 'by runs' };
        if (t1Stats.boundaries > t2Stats.boundaries) return { winner: team1, reason: 'on boundary count' };
        if (t2Stats.boundaries > t1Stats.boundaries) return { winner: team2, reason: 'on boundary count' };
        if (t1Stats.answeringTimeSeconds < t2Stats.answeringTimeSeconds) return { winner: team1, reason: 'on answering time' };
        if (t2Stats.answeringTimeSeconds < t1Stats.answeringTimeSeconds) return { winner: team2, reason: 'on answering time' };

        return { winner: null, reason: 'tie' };
    }, [match.status, deliveries, orderedTeams]);

    const assignTossCaptain = async () => {
        setBusy(true); setMessage('');
        const response = await fetch(`/api/mpl/matches/${match.id}/record-toss-winner`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tossCallingTeamId }) });
        const data = await response.json();
        if (response.ok) setMatch(data.match);
        else setMessage(data.error || 'Unable to assign toss captain.');
        setBusy(false);
    };

    const recordTossWinner = async () => {
        setBusy(true); setMessage('');
        const response = await fetch(`/api/mpl/matches/${match.id}/record-toss-winner`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ flip: true }) });
        const data = await response.json();
        if (response.ok) {
            setMatch(data.match);
            setTossWinner(data.match.toss_winner_team_id);
            const winningTeam = matchTeams.find((team) => team.team_id === tossWinner);
            setCelebration({ id: `toss-${match.id}`, type: 'toss_won', title: 'TOSS WON!', subtitle: `${winningTeam?.mpl_teams?.team_name || 'The team'} gets first choice.` });
        } else setMessage(data.error || 'Unable to record toss winner.');
        setBusy(false);
    };

    const handleFlipCoin = () => {
        setIsFlipping(true);
        window.setTimeout(async () => {
            await recordTossWinner();
            setIsFlipping(false);
        }, 1500);
    };

    const selectDelivery = async (event) => {
        event.preventDefault();
        setBusy(true); setMessage('');
        const response = await fetch(`/api/mpl/matches/${match.id}/select-delivery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inningsNumber: currentInnings, deliveryNumber, batterId: batter, bowlerId: bowler }) });
        const data = await response.json();
        if (response.ok) { setBatter(''); setBowler(''); setMessage(data.message || 'Waiting for the selected bowler to choose a question type.'); } else setMessage(data.error || 'Unable to assign delivery.');
        setBusy(false);
    };

    useEffect(() => {
        let mounted = true;
        const refreshMatch = async () => {
            const response = await fetch(`/api/mpl/matches/${match.id}`, { cache: 'no-store' });
            if (!response.ok || !mounted) return;
            const data = await response.json();
            const completedDeliveries = (data.deliveries || [])
                .filter((delivery) => delivery.status === 'answered' || delivery.status === 'wicket' || delivery.status === 'wide' || delivery.status === 'dot' || delivery.metadata?.rescue_available === true)
                .sort((first, second) => new Date(second.created_at || 0).getTime() - new Date(first.created_at || 0).getTime());
            const latestCelebration = completedDeliveries[0];
            if (latestCelebration && lastCelebrationDelivery.current === null) lastCelebrationDelivery.current = latestCelebration.id;
            else if (latestCelebration && latestCelebration.id !== lastCelebrationDelivery.current) {
                lastCelebrationDelivery.current = latestCelebration.id;
                const battingTeam = (data.teams || []).find((team) => team.innings_number === latestCelebration.innings_number);
                const celebrationTeam = latestCelebration.status === 'wicket' ? (data.teams || []).find((team) => team.team_id !== battingTeam?.team_id) : battingTeam;
                if (celebrationTeam) setCelebration({
                    id: latestCelebration.id,
                    type: latestCelebration.status === 'wide' ? 'wide' : latestCelebration.status === 'dot' ? 'dot' : latestCelebration.metadata?.rescue_available === true && latestCelebration.metadata?.answer_correct === false ? 'wrong_answer' : latestCelebration.status === 'wicket' ? 'wicket' : latestCelebration.metadata?.power_shot === true ? 'power_shot' : 'runs',
                    title: latestCelebration.status === 'wide' ? 'WIDE BALL · +1' : latestCelebration.status === 'dot' ? 'DOT BALL' : latestCelebration.metadata?.rescue_available === true && latestCelebration.metadata?.answer_correct === false ? 'WRONG ANSWER' : latestCelebration.status === 'wicket' ? 'WICKET!' : latestCelebration.metadata?.power_shot === true ? 'POWER SHOT!' : `+${latestCelebration.runs_awarded} runs`,
                    subtitle: latestCelebration.status === 'wide' ? 'Batting team gets 1 run' : latestCelebration.status === 'dot' ? 'No runs scored' : latestCelebration.metadata?.rescue_available === true && latestCelebration.metadata?.answer_correct === false ? 'Question passed to the bowler' : latestCelebration.status === 'wicket' ? `${celebrationTeam.mpl_teams?.team_name || 'Bowling team'} gets the wicket!` : `${celebrationTeam.mpl_teams?.team_name || 'Batting team'} scores!`
                });
            }
            if (data.server_time) setServerTimeOffset(Date.now() - new Date(data.server_time).getTime());
            const active = (data.deliveries || []).find((delivery) => delivery.status === 'active');
            setMatch(data.match);
            setDeliveries(data.deliveries || []);
            if (active) {
                setActiveDelivery({ ...active, question: active.mpl_questions });
                setPhase(active.metadata?.rescue_available ? 'bowler' : 'batter');
            } else {
                setActiveDelivery(null);
                setPhase('batter');
                setPowerShot(false);
            }
        };
        const interval = setInterval(refreshMatch, 2500);
        return () => { mounted = false; clearInterval(interval); };
    }, [match.id]);

    useEffect(() => {
        if (match.status !== 'completed' || matchCompletionSeen.current || !matchOutcome) return;
        matchCompletionSeen.current = true;
        const timeout = window.setTimeout(() => setCelebration({
            id: `match-complete-${match.id}`,
            type: 'match_winner',
            title: matchOutcome.winner ? `${matchOutcome.winner.mpl_teams?.team_name || 'Team'} wins!` : 'Match tied!',
            subtitle: matchOutcome.winner ? `Victory ${matchOutcome.reason}` : 'What a contest.'
        }), 0);
        return () => window.clearTimeout(timeout);
    }, [match.id, match.status, matchOutcome]);

    const clearCelebration = useCallback(() => setCelebration(null), []);

    useEffect(() => {
        if (!activeDelivery) return undefined;
        const updateClock = () => setClockNow(Date.now());
        updateClock();
        const interval = setInterval(updateClock, 250);
        return () => clearInterval(interval);
    }, [activeDelivery]);

    const submitAnswer = async (answerOption, isPowerShotChecked = false) => {
        setBusy(true); setMessage('');
        const finalPowerShot = isPowerShotChecked || activeDelivery.metadata?.power_shot === true;
        const response = await fetch(`/api/mpl/deliveries/${activeDelivery.id}/submit-answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phase, answerOption, powerShot: finalPowerShot }) });
        const data = await response.json();
        if (response.ok) {
            const scored = phase === 'batter' && data.delivery?.status === 'answered' && Number(data.delivery.runs_awarded || 0) > 0;
            const savedWicket = phase === 'bowler' && data.delivery?.status === 'wicket';
            if (scored || savedWicket) {
                lastCelebrationDelivery.current = data.delivery.id;
                const celebrationTeamId = savedWicket
                    ? liveMatchTeams.find((team) => team.team_id !== battingTeamId)?.team_id
                    : battingTeamId;
                setCelebration({
                    id: data.delivery.id,
                    type: savedWicket ? 'wicket' : data.delivery.metadata?.power_shot === true ? 'power_shot' : 'runs',
                    title: savedWicket ? 'WICKET!' : data.delivery.metadata?.power_shot === true ? 'POWER SHOT!' : `+${data.delivery.runs_awarded} runs`,
                    subtitle: savedWicket ? `${teamName(celebrationTeamId)} gets the wicket!` : `${teamName(celebrationTeamId)} scores!`
                });
            }
            setActiveDelivery(data.delivery);
            if (phase === 'batter' && data.delivery.metadata?.rescue_available) setPhase('bowler');
            else { setDeliveries((current) => [...current, data.delivery]); setActiveDelivery(null); setBatter(''); setBowler(''); setPowerShot(false); }
        } else setMessage(data.error || 'Unable to submit answer.');
        setBusy(false);
    };

    const markDelivery = useCallback(async (status, requireConfirmation = true) => {
        if (requireConfirmation) {
            const labels = { dot: 'Dot Ball', wide: 'Wide', no_ball: 'No Ball', wicket: 'Wicket', cancelled: 'Cancelled' };
            if (!window.confirm(`Confirm manual scoring override: ${labels[status] || status}?`)) return;
        }
        setBusy(true); setMessage('');
        const response = await fetch(`/api/mpl/deliveries/${activeDelivery.id}/mark`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
        const data = await response.json();
        if (response.ok) {
            setDeliveries((current) => [...current, data.delivery]);
            setActiveDelivery(null); setBatter(''); setBowler(''); setPowerShot(false);
        } else setMessage(data.error || `Unable to mark delivery as ${status}.`);
        setBusy(false);
    }, [activeDelivery]);

    const advancePhase = async () => {
        setBusy(true); setMessage('');
        const response = await fetch(`/api/mpl/matches/${match.id}/advance-phase`, { method: 'POST' });
        const data = await response.json();
        if (response.ok) setMatch(data.match);
        else setMessage(data.error || 'Unable to advance match phase.');
        setBusy(false);
    };

    const answerOptions = useMemo(() => activeDelivery?.question?.options || [], [activeDelivery]);

    const serverNow = clockNow - serverTimeOffset;
    const remainingSeconds = activeDelivery?.answer_started_at
        ? Math.max(0, Math.ceil((new Date(activeDelivery.answer_started_at).getTime() + (activeDelivery.timer_seconds * 1000) - serverNow) / 1000))
        : (activeDelivery?.timer_seconds || null);

    useEffect(() => {
        if (!activeDelivery) return undefined;
        const currentServerNow = Date.now() - serverTimeOffset;
        const deadline = activeDelivery.answer_started_at
            ? new Date(activeDelivery.answer_started_at).getTime() + (activeDelivery.timer_seconds * 1000)
            : currentServerNow + (activeDelivery.timer_seconds * 1000);
        const timeout = setTimeout(() => markDelivery('dot', false), Math.max(0, deadline - currentServerNow) + 50);
        return () => clearTimeout(timeout);
    }, [activeDelivery, markDelivery, serverTimeOffset]);

    return (
        <main className="min-h-screen bg-[#050505] px-4 py-16 text-white">
            <MatchCelebration event={celebration} onComplete={clearCelebration} />
            <div className="mx-auto max-w-6xl">
                <Link href="/mpl/admin/matches" className="mb-6 flex items-center gap-2 text-xs text-zinc-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Match setup</Link>
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.25em] text-teal-300">Live organiser controls</p><h1 className="mt-2 text-4xl font-bold">{teamName(battingTeamId)} batting</h1><p className="mt-2 text-sm text-zinc-500">Keep this screen with the organiser. Teams answer when the question is displayed.</p></div><span className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-widest text-zinc-400">{match.status.replace('_', ' ')}</span></div>

                {match.status === 'completed' && (
                    <div className="mb-8 max-w-xl space-y-6 rounded-2xl border border-teal-400/50 bg-teal-400/10 p-10 text-center mx-auto">
                        <h2 className="text-3xl font-black text-teal-300">Match Completed</h2>
                        {matchOutcome?.winner ? (
                            <div className="my-6">
                                <p className="text-sm text-teal-200">Winner {matchOutcome.reason}</p>
                                <p className="mt-2 text-4xl font-bold text-white">{matchOutcome.winner.mpl_teams?.team_name}</p>
                            </div>
                        ) : (
                            <div className="my-6">
                                <p className="text-4xl font-bold text-white">Match Tied</p>
                            </div>
                        )}
                        <div className="mt-8 flex justify-center">
                            <Link href="/mpl/admin/matches" className="rounded-lg bg-teal-400 px-6 py-3 font-bold text-black hover:bg-teal-300">Back to matches</Link>
                        </div>
                    </div>
                )}

                {match.status !== 'toss_pending' && match.status !== 'draft' && match.status !== 'completed' && (
                    <div className="mb-6 rounded-2xl border border-teal-400/20 bg-gradient-to-r from-teal-900/40 to-black p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-teal-400">Current Score</p>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-white">{scoreState.runs}</span>
                                    <span className="text-xl font-bold text-zinc-400">/ {scoreState.wickets}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-zinc-400">Legal Deliveries: <span className="font-bold text-white">{scoreState.totalLegal}</span> / {match.total_questions_per_innings}</p>
                                <p className="text-sm text-zinc-400">Boundaries: <span className="font-bold text-white">{scoreState.boundaries}</span></p>
                            </div>
                        </div>
                    </div>
                )}

                {teamScores?.length > 0 && match.status !== 'toss_pending' && match.status !== 'toss_won' && match.status !== 'draft' && (
                    <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                        <p className="text-xs uppercase tracking-widest text-zinc-400">Team scorecard</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {teamScores.map((score) => (
                                <div key={score.team_id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="font-semibold">{score.team_name}</span>
                                        <span className="text-2xl font-black text-teal-300">{score.runs}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-zinc-500">{score.wickets} wickets · {score.legal_deliveries} legal deliveries</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="mb-6 grid gap-4 md:grid-cols-2">
                    {orderedTeams.map((team) => <section key={team.team_id} className={`rounded-2xl border p-5 ${team.team_id === battingTeamId ? 'border-teal-400/40 bg-teal-400/10' : 'border-white/10 bg-white/5'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-zinc-400">{team.team_id === battingTeamId ? 'Batting team' : 'Bowling team'}</p><h2 className="mt-1 text-xl font-bold">{team.mpl_teams?.team_name}</h2><p className="text-xs text-zinc-500">{team.mpl_teams?.team_code}</p></div><span className="rounded-full bg-black/30 px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-400">{team.online_count || 0} online · {team.players?.length || 0} rostered</span></div><div className="mt-4 space-y-2">{(team.players || []).map((player) => <div key={player.id} className={`flex items-center justify-between rounded-lg border bg-black/20 px-3 py-2 text-sm ${dismissedPlayerIds.has(player.id) ? 'border-red-400/30 opacity-60' : 'border-white/10'}`}><span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${player.is_online ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'}`} />{player.name}{player.is_leader ? ' (Captain)' : ''}<span className={`text-[10px] uppercase tracking-wider ${dismissedPlayerIds.has(player.id) ? 'text-red-300' : player.is_online ? 'text-emerald-300' : 'text-zinc-500'}`}>{dismissedPlayerIds.has(player.id) ? 'OUT' : player.is_online ? 'Online' : 'Offline'}</span></span><span className="text-xs text-zinc-500">{player.roll_number}</span></div>)}{(!team.players || team.players.length === 0) && <p className="text-sm text-zinc-500">No players registered.</p>}</div></section>)}
                </div>

                {match.status === 'toss_pending' && (
                    <div className="max-w-xl space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h2 className="text-xl font-bold">Virtual Toss</h2>
                        {!match.toss_calling_team_id ? (
                            <div className="space-y-4">
                                <p className="text-sm text-zinc-400">Choose the team whose captain will call heads or tails.</p>
                                <select value={tossCallingTeamId} onChange={(event) => setTossCallingTeamId(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm text-white">
                                    <option value="">Select toss team</option>
                                    {matchTeams.map((team) => <option key={team.team_id} value={team.team_id}>{team.side_name || team.mpl_teams?.team_name} captain</option>)}
                                </select>
                                <button type="button" disabled={busy || !tossCallingTeamId} onClick={assignTossCaptain} className="w-full rounded-lg bg-teal-400 px-6 py-3 font-bold text-black disabled:opacity-50">Assign Toss Captain</button>
                            </div>
                        ) : (
                            <div className="space-y-4 text-center">
                                <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-teal-400 bg-teal-400/20 text-3xl font-bold text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.5)] transition-transform duration-700 ${isFlipping ? 'animate-spin' : ''}`}>{isFlipping ? '?' : match.toss_result || match.toss_choice || '?'}</div>
                                <p className="text-sm text-zinc-400">{match.toss_choice ? `Captain selected ${match.toss_choice}.` : 'Waiting for the selected captain to choose heads or tails.'}</p>
                                <button type="button" onClick={handleFlipCoin} disabled={isFlipping || !match.toss_choice} className="rounded-lg bg-teal-400 px-6 py-3 font-bold text-black hover:bg-teal-300 disabled:opacity-50">{isFlipping ? 'Flipping...' : 'Flip Coin'}</button>
                            </div>
                        )}
                    </div>
                )}

                {match.status === 'toss_won' && (
                    <div className="max-w-xl space-y-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6">
                        <h2 className="text-xl font-bold text-amber-200">Waiting for team to choose</h2>
                        <p className="text-sm text-amber-100/70">
                            <span className="font-bold text-white">{teamName(match.toss_winner_team_id)}</span> won the toss.
                            Their players are now choosing whether to bat or bowl first.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-amber-200/50">
                            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                            Waiting for their decision...
                        </div>
                    </div>
                )}

                {match.status !== 'toss_pending' && match.status !== 'toss_won' && match.status !== 'draft' && match.status !== 'completed' && (
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
                        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold">Delivery {deliveryNumber}</h2>
                                <span className="flex items-center gap-2 text-xs text-zinc-400"><Timer className="h-4 w-4" /> {activeDelivery ? `Question active · ${remainingSeconds}s remaining` : 'Bowler chooses question type'}</span>
                            </div>
                            {!activeDelivery ? (
                                scoreState.totalLegal >= match.total_questions_per_innings ? (
                                    <div className="rounded-xl border border-teal-400/20 bg-teal-400/5 p-6 text-center">
                                        <h3 className="mb-4 text-lg font-bold text-teal-300">Innings Complete</h3>
                                        <button disabled={busy} onClick={advancePhase} className="rounded-lg bg-white px-6 py-3 font-bold text-black hover:bg-zinc-200">Advance Match Phase</button>
                                    </div>
                                ) : (
                                    <form onSubmit={selectDelivery} className="space-y-4">
                                        <select required value={batter} onChange={(event) => setBatter(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm"><option value="">Select batter</option>{selectableBatters.map((player) => <option key={player.id} value={player.id}>{player.name} ({player.roll_number}){player.is_online ? '' : ' — offline'}</option>)}</select>
                                        <select required value={bowler} onChange={(event) => setBowler(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/50 p-3 text-sm"><option value="">Select bowler</option>{selectableBowlers.map((player) => <option key={player.id} value={player.id}>{player.name} ({player.roll_number}){player.is_online ? '' : ' — offline'}</option>)}</select>
                                        <button disabled={busy} className="w-full rounded-lg bg-white px-4 py-3 text-sm font-bold text-black">Assign players and wait for bowler</button>
                                    </form>
                                )
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-teal-400/20 bg-teal-400/5 p-4">
                                        <p className="text-xs uppercase tracking-widest text-teal-300">{phase === 'batter' ? 'Batter attempt' : 'Bowler rescue attempt'} · {activeDelivery.ball_type_slug}</p>
                                        <p className="mt-3 text-lg font-semibold">{activeDelivery.question?.question_text}</p>
                                    </div>
                                    {activeDelivery.metadata?.power_shot === true && (
                                        <div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-300/70 bg-amber-300/15 p-3 text-amber-100">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300 text-black">
                                                <Zap className="h-4 w-4" />
                                            </span>
                                            <span>
                                                <span className="block font-bold">Power Shot is Active!</span>
                                                <span className="mt-0.5 block text-xs text-amber-200/70">Correct answer runs will be doubled</span>
                                            </span>
                                        </div>
                                    )}
                                    {phase === 'batter' && !powerShotUsed && <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs transition ${powerShot ? 'border-amber-300/70 bg-amber-300/15 text-amber-100' : 'border-amber-300/25 bg-amber-300/5 text-amber-200 hover:border-amber-300/50'}`}><input type="checkbox" className="sr-only" checked={powerShot} onChange={(event) => setPowerShot(event.target.checked)} /><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${powerShot ? 'bg-amber-300 text-black' : 'bg-amber-300/15 text-amber-200'}`}><Zap className="h-4 w-4" /></span><span><span className="block font-bold">{powerShot ? 'Power Shot armed' : 'Use Power Shot'}</span><span className="mt-0.5 block text-amber-200/70">Double the runs if the batter answers correctly</span></span></label>}
                                    <div className="grid gap-3 sm:grid-cols-2">{answerOptions.map((option, index) => <button key={index} disabled={busy} onClick={() => submitAnswer(index, phase === 'batter' && powerShot)} className="rounded-xl border border-white/10 bg-black/20 p-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-teal-400/50 hover:bg-teal-400/5">{index + 1}. {option}</button>)}</div>
                                    <div className="border-t border-white/10 pt-4"><p className="mb-3 text-xs uppercase tracking-widest text-zinc-400">Manual Scoring Overrides</p><div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => markDelivery('dot')} className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold hover:bg-zinc-700">Mark Dot Ball</button><button type="button" disabled={busy} onClick={() => markDelivery('wide')} className="rounded-lg bg-amber-900/50 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-900">Mark Wide</button><button type="button" disabled={busy} onClick={() => markDelivery('no_ball')} className="rounded-lg bg-red-900/50 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-900">Mark No Ball</button><button type="button" disabled={busy} onClick={() => markDelivery('wicket')} className="rounded-lg bg-red-600/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-600/40">Mark Wicket</button></div></div>
                                    <p className="flex items-center gap-2 text-xs text-zinc-500"><ShieldAlert className="h-4 w-4" /> Incorrect batter answer opens the same question for the bowler.</p>
                                </div>
                            )}
                            {message && <p className="text-sm text-amber-200">{message}</p>}
                        </section>
                        <section className="rounded-2xl border border-white/10 bg-white/5 p-6"><h2 className="mb-4 font-bold">Completed deliveries</h2><div className="space-y-3">{currentInningsDeliveries.map((delivery) => <div key={delivery.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3 text-sm"><span>#{delivery.delivery_number} <span className="text-zinc-500">{delivery.ball_type_slug}</span></span><span className="flex items-center gap-2 text-xs text-zinc-400"><span className="font-bold text-teal-300">{(delivery.runs_awarded || 0) + (delivery.score_adjustment || 0) > 0 ? `+${(delivery.runs_awarded || 0) + (delivery.score_adjustment || 0)}` : ''}</span> {delivery.status} <CheckCircle2 className="h-4 w-4 text-teal-300" /></span></div>)}{currentInningsDeliveries.length === 0 && <p className="text-sm text-zinc-500">No deliveries recorded yet.</p>}</div></section>
                    </div>
                )}

            </div>
        </main>
    );
}
