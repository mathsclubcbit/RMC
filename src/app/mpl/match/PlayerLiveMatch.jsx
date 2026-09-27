'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Radio, Timer, Trophy, Swords, Target, Hourglass, Zap } from 'lucide-react';
import MatchCelebration from '../components/MatchCelebration';
import { createClient as createBrowserSupabase } from '@/lib/supabase/client';

export default function PlayerLiveMatch() {
    const [state, setState] = useState({ loading: true, player: null, match: null, teams: [], activeDelivery: null, pendingDelivery: null, questionTypes: [], ballChoices: [], latestDelivery: null, teamScores: [], dismissedPlayerIds: [], powerShotUsed: false, celebration: null, error: '', serverTimeOffset: 0 });
    const [clockNow, setClockNow] = useState(() => Date.now());
    const [submittingChoice, setSubmittingChoice] = useState(false);
    const [submittingAnswer, setSubmittingAnswer] = useState(false);
    const [usePowerShot, setUsePowerShot] = useState(false);
    const [answerFeedback, setAnswerFeedback] = useState('');
    const lastDeliveryCelebration = useRef(null);
    const tossCelebrationSeen = useRef(false);
    const matchCompletionSeen = useRef(false);

    // Shared: detect and deduplicate celebration events from any poll response.
    const processCelebration = useCallback((data) => {
        const scoringEvent = data.celebrationEvent;
        let celebration = null;
        if (scoringEvent && lastDeliveryCelebration.current === null) {
            lastDeliveryCelebration.current = scoringEvent.id;
        } else if (scoringEvent && scoringEvent.id !== lastDeliveryCelebration.current) {
            lastDeliveryCelebration.current = scoringEvent.id;
            celebration = scoringEvent;
        }
        if (data.match?.status === 'toss_won' && !tossCelebrationSeen.current) {
            tossCelebrationSeen.current = true;
            if (data.match.toss_winner_team_id === data.player?.team?.id) celebration = {
                id: `toss-${data.match.id}`,
                type: 'toss_won',
                title: 'TOSS WON!',
                subtitle: `${data.player.team.team_name} gets first choice.`
            };
        }
        if (data.match?.status === 'completed' && !matchCompletionSeen.current) {
            matchCompletionSeen.current = true;
            if (data.matchResult) celebration = { ...data.matchResult, type: 'match_winner', id: `match-complete-${data.match.id}` };
        }
        return celebration;
    }, []);

    // ── FULL POLL (every 30 s + random jitter) — roster, teams, scores ──
    // Jitter spreads players across 30 s so they don't all hit the DB at once
    // (the load test showed P99 spikes of 7 s when 400 players fired simultaneously).
    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const response = await fetch('/api/mpl/player/match', { cache: 'no-store' });
                const data = await response.json();
                if (!active) return;
                const celebration = processCelebration(data);
                setState((current) => ({
                    ...current,
                    loading: false,
                    player: data.player || null,
                    match: data.match || null,
                    teams: data.teams || current.teams,
                    activeDelivery: data.activeDelivery !== undefined ? data.activeDelivery : current.activeDelivery,
                    pendingDelivery: data.pendingDelivery !== undefined ? data.pendingDelivery : current.pendingDelivery,
                    questionTypes: data.questionTypes || [],
                    ballChoices: data.ballChoices ?? current.ballChoices,
                    latestDelivery: data.latestDelivery !== undefined ? data.latestDelivery : current.latestDelivery,
                    teamScores: data.teamScores || current.teamScores,
                    dismissedPlayerIds: data.dismissedPlayerIds || current.dismissedPlayerIds,
                    powerShotUsed: data.powerShotUsed === true,
                    isPowerShotArmed: data.isPowerShotArmed === true,
                    scoreState: data.scoreState || null,
                    error: response.ok ? '' : (data.error || 'Unable to load the live match.'),
                    celebration: celebration || current.celebration,
                    serverTimeOffset: data.server_time ? Date.now() - new Date(data.server_time).getTime() : current.serverTimeOffset,
                }));
            } catch {
                if (active) setState((current) => ({ ...current, loading: false, error: 'Unable to connect to the live match.' }));
            }
        };
        // Random jitter 0–15 s so players don't all fire the full poll at the same moment.
        // Initial load fires immediately; subsequent polls are staggered per-client.
        const jitter = Math.floor(Math.random() * 15000);
        load(); // initial load — no jitter, needed for first render
        let interval;
        const jitterTimeout = setTimeout(() => {
            if (!active) return;
            load();
            interval = setInterval(load, 30000);
        }, 30000 + jitter);
        return () => { active = false; clearTimeout(jitterTimeout); clearInterval(interval); };
    }, [processCelebration]);

    // ── REALTIME (Level 3) — subscribe once per match; fire lite fetch only on real DB change ──
    // Falls back to a 10 s safety-net poll in case the Realtime connection drops.
    useEffect(() => {
        const matchId = state.match?.id;
        if (!matchId) return; // not in a match yet — full poll will populate state.match

        const supabase = createBrowserSupabase();
        if (!supabase) return;

        let active = true;
        let safetyInterval = null;
        let realtimeConnected = false;

        const loadLite = async () => {
            try {
                const response = await fetch('/api/mpl/player/match?lite=1', { cache: 'no-store' });
                if (!response.ok || !active) return;
                const data = await response.json();
                if (!active) return;
                const celebration = processCelebration(data);
                setState((current) => ({
                    ...current,
                    match: data.match || current.match,
                    activeDelivery: data.activeDelivery !== undefined ? data.activeDelivery : current.activeDelivery,
                    pendingDelivery: data.pendingDelivery !== undefined ? data.pendingDelivery : current.pendingDelivery,
                    ballChoices: data.ballChoices ?? current.ballChoices,
                    latestDelivery: data.latestDelivery !== undefined ? data.latestDelivery : current.latestDelivery,
                    dismissedPlayerIds: data.dismissedPlayerIds ?? current.dismissedPlayerIds,
                    teamScores: data.teamScores ?? current.teamScores,
                    powerShotUsed: data.powerShotUsed === true ? true : current.powerShotUsed,
                    isPowerShotArmed: data.isPowerShotArmed === true,
                    scoreState: data.scoreState !== undefined ? data.scoreState : current.scoreState,
                    celebration: celebration || current.celebration,
                    serverTimeOffset: data.server_time ? Date.now() - new Date(data.server_time).getTime() : current.serverTimeOffset,
                }));
            } catch { /* safety net will retry */ }
        };

        // Throttled and jittered loader to prevent 20 clients from hitting the DB at the exact same millisecond
        let liteTimeout = null;
        const jitteredLoadLite = () => {
            if (liteTimeout) return;
            const jitter = Math.floor(Math.random() * 500); // spread load over 500ms to reduce perceived latency
            liteTimeout = setTimeout(() => {
                loadLite();
                liteTimeout = null;
            }, jitter);
        };

        // Subscribe to the three tables that drive gameplay for this match.
        // Each INSERT or UPDATE fires one lite fetch — replaces the blind poll.
        const channel = supabase
            .channel(`mpl-match-${matchId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mpl_match_deliveries',        filter: `match_id=eq.${matchId}` }, () => jitteredLoadLite())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mpl_match_delivery_requests', filter: `match_id=eq.${matchId}` }, () => jitteredLoadLite())
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mpl_matches',            filter: `id=eq.${matchId}` },        () => jitteredLoadLite())
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    realtimeConnected = true;
                    if (safetyInterval) { clearInterval(safetyInterval); safetyInterval = null; }
                    loadLite(); // one immediate sync after subscribing
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                    realtimeConnected = false;
                    if (!safetyInterval) safetyInterval = setInterval(loadLite, 10000);
                }
            });

        // Start 10 s safety-net immediately; it self-cancels once Realtime connects
        safetyInterval = setInterval(() => {
            if (!realtimeConnected) loadLite();
        }, 10000);

        return () => {
            active = false;
            if (safetyInterval) clearInterval(safetyInterval);
            supabase.removeChannel(channel);
        };
    }, [state.match?.id, processCelebration]); // re-subscribe if match changes



    // ── PRESENCE HEARTBEAT (every 30 s) — isolated write, not on hot path ──
    useEffect(() => {
        const beat = () => fetch('/api/mpl/player/presence', { method: 'POST', cache: 'no-store' }).catch(() => {});
        beat(); // mark as online immediately
        const interval = setInterval(beat, 30000);
        return () => clearInterval(interval);
    }, []);

    const clearCelebration = useCallback(() => setState((current) => ({ ...current, celebration: null })), []);

    useEffect(() => {
        if (!state.activeDelivery) return undefined;
        const updateClock = () => setClockNow(Date.now());
        updateClock();
        const interval = setInterval(updateClock, 250);
        return () => clearInterval(interval);
    }, [state.activeDelivery]);

    const ownTeamBatting = state.match?.batting_innings_number === state.match?.innings_number;
    const ownTeamWonToss = state.match?.toss_winner_team_id === state.match?.team_id;
    const matchStatusLabel = state.match?.status === 'toss_pending'
        ? 'Toss in progress'
        : state.match?.status === 'toss_won'
            ? (ownTeamWonToss ? 'Toss won' : 'Toss lost')
            : state.match?.status?.replaceAll('_', ' ');
    const currentAction = !state.match
        ? 'Waiting for the toss decision'
        : state.match.status === 'toss_pending'
            ? 'Toss in progress'
            : state.match.status === 'toss_won' && ownTeamWonToss
                ? 'You won the toss — choose bat or bowl'
                : state.match.status === 'toss_won'
                    ? 'Toss lost — waiting for the winner'
        : state.activeDelivery?.can_answer
            ? 'You are batting — select your answer'
            : state.activeDelivery?.can_rescue
                ? 'You are bowling — answer the rescue attempt'
                : state.pendingDelivery?.can_select_question
                    ? 'You are bowling — choose the question type'
                    : state.pendingDelivery?.batter_id === state.player?.id
                        ? 'You are the selected batter — waiting for the bowler'
                        : ownTeamBatting
                            ? (state.player?.is_leader && !state.powerShotUsed && !state.isPowerShotArmed ? 'Your team is batting — you can arm Power Shot' : 'Your team is batting — waiting for the next question')
                            : 'Your team is bowling — waiting for the next delivery';

    const submitAnswer = async (answerOption) => {
        if (!state.activeDelivery?.can_answer && !state.activeDelivery?.can_rescue) return;
        setSubmittingAnswer(true);
        const answerPhase = state.activeDelivery.can_rescue ? 'bowler' : 'batter';
        const response = await fetch('/api/mpl/player/submit-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deliveryId: state.activeDelivery.id, phase: answerPhase, answerOption, powerShot: state.activeDelivery.can_rescue ? false : (usePowerShot || state.activeDelivery.metadata?.power_shot === true) })
        });
        const data = await response.json();
        if (!response.ok) {
            setState((current) => ({ ...current, error: data.error || 'Unable to submit the answer.' }));
        } else {
            const delivery = data.delivery;
            const batterAnsweredIncorrectly = answerPhase === 'batter' && delivery?.metadata?.answer_correct === false;
            const scored = answerPhase === 'batter' && delivery?.status === 'answered' && Number(delivery.runs_awarded || 0) > 0;
            const dotBall = delivery?.status === 'dot';
            const isWicket = delivery?.status === 'wicket';
            const teamName = state.player?.team?.team_name || 'Your team';
            
            if (scored || isWicket || dotBall) {
                lastDeliveryCelebration.current = delivery.id;
                setState((current) => ({ ...current, celebration: {
                    id: delivery.id,
                    type: isWicket ? 'wicket' : dotBall ? 'dot' : delivery.metadata?.power_shot === true ? 'power_shot' : 'runs',
                    title: isWicket ? 'WICKET!' : dotBall ? 'DOT BALL!' : delivery.metadata?.power_shot === true ? 'POWER SHOT!' : `+${delivery.runs_awarded} runs`,
                    subtitle: isWicket ? `${teamName} gets the wicket!` : dotBall ? 'No runs scored' : `${teamName} scores!`
                } }));
            }
            setUsePowerShot(false);
            if (batterAnsweredIncorrectly) {
                setAnswerFeedback('Incorrect answer. The question has been assigned to the bowler.');
                window.setTimeout(() => setAnswerFeedback(''), 4000);
            }
            setState((current) => ({ ...current, activeDelivery: null, powerShotUsed: current.powerShotUsed || (answerPhase === 'batter' && usePowerShot), error: '' }));
        }
        setSubmittingAnswer(false);
    };

    if (state.loading) return <main className="min-h-screen bg-[#050505] p-8 text-sm text-zinc-400">Loading live match...</main>;

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#123b3b_0,_#050505_42rem)] px-3 py-6 text-white sm:px-6 sm:py-10 lg:py-16">
            <MatchCelebration event={state.celebration} onComplete={clearCelebration} />
            <div className="mx-auto max-w-4xl">
                <Link href="/mpl/dashboard" className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-300 transition hover:border-teal-300/40 hover:text-white sm:mb-8"><ArrowLeft className="h-4 w-4" /> Team dashboard</Link>
                {state.error && <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{state.error}</div>}
                {answerFeedback && <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">{answerFeedback}</div>}
                {state.latestDelivery?.status === 'wide' && <div className="mb-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm font-semibold text-amber-100">Wide ball · +1 run to the batting team</div>}
                {!state.error && !state.match && <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center"><Radio className="mx-auto h-10 w-10 text-zinc-600" /><h1 className="mt-4 text-2xl font-bold">No live match yet</h1><p className="mt-2 text-sm text-zinc-500">When your organiser starts a match involving your team, it will appear here.</p></section>}
                {!state.error && state.match && <>
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.25em] text-teal-300">MPL live room</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Your match is live</h1><p className="mt-2 text-sm text-zinc-400">Follow the delivery, answer quickly, and back your team.</p></div><div className="flex items-center gap-2"><span className={`inline-block h-2 w-2 rounded-full ${state.match.status === 'toss_won' && !ownTeamWonToss ? 'bg-zinc-500' : 'bg-teal-400'}`}></span><span className={`text-xs font-bold uppercase tracking-widest ${state.match.status === 'toss_won' && !ownTeamWonToss ? 'text-zinc-400' : 'text-teal-300'}`}>{matchStatusLabel}</span></div></div>
                    <section className="mb-6 overflow-hidden rounded-2xl border border-teal-400/30 bg-gradient-to-br from-teal-400/15 via-teal-950/30 to-black p-5 shadow-[0_18px_60px_rgba(20,184,166,0.08)]"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase tracking-widest text-teal-300">Your team</p><h2 className="mt-1 text-2xl font-black">{state.player?.team?.team_name || 'Team'}</h2><p className="mt-1 text-sm text-zinc-400">{state.player?.name} <span className="text-zinc-600">·</span> {ownTeamBatting ? 'Batting' : state.match.status === 'toss_pending' ? 'Toss pending' : state.match.status === 'toss_won' ? (ownTeamWonToss ? 'Toss winner' : 'Toss loser') : 'Bowling'}</p></div><div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white shadow-inner"><span className="mb-1 block text-[10px] uppercase tracking-widest text-zinc-500">Your status</span>{currentAction}</div></div></section>
                    {state.scoreState && state.match.status !== 'toss_pending' && (
                        <div className="mb-6 sticky top-4 z-40 rounded-2xl border border-teal-400/20 bg-gradient-to-r from-teal-900/90 to-black/90 p-5 sm:p-6 backdrop-blur-md shadow-lg shadow-teal-900/20">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-teal-400">Current Score</p>
                                    <div className="mt-1 flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-white">{state.scoreState.runs}</span>
                                        <span className="text-xl font-bold text-zinc-400">/ {state.scoreState.wickets}</span>
                                    </div>
                                </div>
                                <div className="flex gap-5 text-left sm:text-right">
                                    <p className="text-sm text-zinc-400">Legal Deliveries: <span className="font-bold text-white">{state.scoreState.totalLegal}</span> / {state.match.total_questions_per_innings}</p>
                                    <p className="text-sm text-zinc-400">Boundaries: <span className="font-bold text-white">{state.scoreState.boundaries}</span></p>
                                </div>
                            </div>
                        </div>
                    )}
                    {state.teamScores?.length > 0 && state.match.status !== 'toss_pending' && state.match.status !== 'toss_won' && <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs uppercase tracking-widest text-zinc-400">{state.match.status === 'completed' ? 'Final score' : 'Team scorecard'}</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{state.teamScores.map((score) => <div key={score.team_id} className="rounded-xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between gap-3"><span className="font-semibold">{score.team_name}</span><span className="text-2xl font-black text-teal-300">{score.runs}</span></div><p className="mt-1 text-xs text-zinc-500">{score.wickets} wickets · {score.legal_deliveries} legal deliveries</p></div>)}</div></section>}
                    <div className="mb-6 grid gap-4 md:grid-cols-2">
                        {state.teams.map((team) => <section key={team.team_id} className={`rounded-2xl border p-5 ${team.is_batting ? 'border-teal-400/40 bg-teal-400/10' : 'border-white/10 bg-white/5'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-zinc-400">{team.is_batting ? 'Batting team' : state.match.status === 'toss_won' ? (team.team_id === state.match.toss_winner_team_id ? 'Toss winner' : 'Toss loser') : state.match.status === 'toss_pending' ? 'Awaiting toss' : 'Bowling team'}</p><h2 className="mt-1 text-xl font-bold">{team.team_name}</h2><p className="text-xs text-zinc-500">{team.team_code}</p></div><span className="rounded-full bg-black/30 px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-400">{team.players.length} joined</span></div><div className="mt-4 space-y-2">{team.players.map((player) => { const isOut = state.dismissedPlayerIds?.includes(player.id); return <div key={player.id} className={`flex items-center justify-between rounded-lg border bg-black/20 px-3 py-2 text-sm ${isOut ? 'border-red-400/30 opacity-60' : 'border-white/10'}`}><span>{player.name}{player.is_leader ? ' (Captain)' : ''}<span className={`ml-2 text-[10px] uppercase tracking-wider ${isOut ? 'text-red-300' : 'text-zinc-500'}`}>{isOut ? 'OUT' : ''}</span></span><span className="text-xs text-zinc-500">{player.roll_number}</span></div>; })}{team.players.length === 0 && <p className="text-sm text-zinc-500">No players registered.</p>}</div></section>)}
                    </div>
                    <div className="mb-6">
                        {state.teams.filter((team) => team.team_id === state.match.team_id).map((team) => <div key={`${team.team_id}-mentor`} className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm"><span className="text-xs uppercase tracking-widest text-amber-300">Your RMC Mentor</span><p className="mt-1 font-semibold">{team.mentor_name || 'Assigned by organiser'}</p><p className="text-xs text-zinc-500">{team.mentor_email || 'Contact details held by organisers'}</p></div>)}
                    </div>
                    {!state.activeDelivery && state.match.status === 'toss_pending' && <section className="rounded-2xl border border-teal-400/30 bg-teal-400/10 p-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-teal-400 text-2xl font-bold uppercase text-teal-300">{state.match.toss_result || state.match.toss_choice || '?'}</div><h2 className="mt-6 text-2xl font-bold text-teal-100">Virtual Toss</h2>{!state.match.toss_calling_team_id ? <p className="mt-3 text-sm text-teal-200/70">Waiting for the organiser to select the toss captain.</p> : state.match.is_toss_captain && !state.match.toss_choice ? <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" onClick={async () => { const response = await fetch('/api/mpl/player/toss-choice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: state.match.id, choice: 'heads' }) }); const data = await response.json(); if (response.ok) setState((current) => ({ ...current, match: { ...current.match, ...data.match } })); else setState((current) => ({ ...current, error: data.error || 'Unable to submit toss choice.' })); }} className="rounded-xl bg-teal-300 px-4 py-3 font-bold text-black">Heads</button><button type="button" onClick={async () => { const response = await fetch('/api/mpl/player/toss-choice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: state.match.id, choice: 'tails' }) }); const data = await response.json(); if (response.ok) setState((current) => ({ ...current, match: { ...current.match, ...data.match } })); else setState((current) => ({ ...current, error: data.error || 'Unable to submit toss choice.' })); }} className="rounded-xl border border-teal-300/50 px-4 py-3 font-bold text-teal-100">Tails</button></div> : <p className="mt-3 text-sm text-teal-200/70">{state.match.toss_choice ? `Captain selected ${state.match.toss_choice}. Waiting for the organiser to flip the coin.` : `Waiting for ${state.match.toss_captain_name || 'the selected captain'} to call the toss.`}</p>}</section>}
                    {!state.activeDelivery && state.match.status === 'toss_won' && state.match.toss_winner_team_id === state.match.team_id && state.player?.is_leader && (
                        <section className="rounded-2xl border border-teal-400/40 bg-teal-400/10 p-10 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-teal-400 bg-teal-400/20 text-teal-300 shadow-[0_0_20px_rgba(45,212,191,0.6)]"><Trophy className="h-8 w-8" /></div>
                            <h2 className="mt-6 text-2xl font-bold text-teal-100">You Won the Toss!</h2>
                            <p className="mt-2 text-sm text-teal-200/70">Choose whether your team will bat or bowl first.</p>
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <button disabled={submittingChoice} onClick={async () => { setSubmittingChoice(true); const res = await fetch('/api/mpl/player/choose-batting', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: state.match.id, choice: 'bat' }) }); if(res.ok) { const data = await res.json(); setState(s => ({...s, match: data.match})); } setSubmittingChoice(false); }} className="flex flex-col items-center justify-center rounded-xl border-2 border-teal-400 bg-teal-400/20 p-6 font-bold text-teal-200 hover:bg-teal-400/40 transition-colors disabled:opacity-50">
                                    <Swords className="h-8 w-8 mb-2" />
                                    Bat First
                                </button>
                                <button disabled={submittingChoice} onClick={async () => { setSubmittingChoice(true); const res = await fetch('/api/mpl/player/choose-batting', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: state.match.id, choice: 'bowl' }) }); if(res.ok) { const data = await res.json(); setState(s => ({...s, match: data.match})); } setSubmittingChoice(false); }} className="flex flex-col items-center justify-center rounded-xl border-2 border-white/20 bg-white/5 p-6 font-bold text-zinc-300 hover:bg-white/10 transition-colors disabled:opacity-50">
                                    <Target className="h-8 w-8 mb-2" />
                                    Bowl First
                                </button>
                            </div>
                        </section>
                    )}
                    {!state.activeDelivery && state.match.status === 'toss_won' && state.match.toss_winner_team_id !== state.match.team_id && <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/20 text-zinc-400"><Hourglass className="h-6 w-6 animate-pulse" /></div><h2 className="mt-4 text-xl font-bold">Toss decided</h2><p className="mt-2 text-sm text-zinc-500">The other team won the toss. Waiting for them to choose bat or bowl...</p></section>}
                    {!state.activeDelivery && state.pendingDelivery?.can_select_question && <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6"><p className="text-xs uppercase tracking-widest text-amber-300">Bowler decision</p><h2 className="mt-2 text-2xl font-bold">Choose a ball</h2><p className="mt-2 text-sm text-zinc-400">Select the next ball icon. Its delivery type is hidden until the question appears.</p><div className="mt-6 grid grid-cols-5 gap-3">{(state.ballChoices || []).map((ball) => <button key={ball.ballNumber} disabled={submittingChoice} onClick={async () => { setSubmittingChoice(true); const res = await fetch('/api/mpl/player/choose-question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: state.match.id, requestId: state.pendingDelivery.id, ballNumber: ball.ballNumber }) }); if (!res.ok) { const data = await res.json(); setState((current) => ({ ...current, error: data.error || 'Unable to select the ball.' })); } setSubmittingChoice(false); }} className="flex aspect-square items-center justify-center rounded-full border border-amber-300/40 bg-black/30 text-xs font-bold text-amber-100 hover:border-amber-200 hover:bg-amber-300/20 disabled:opacity-50" aria-label={ball.label}><img src="/full logo.png" alt="RMC" className="h-8 w-8 rounded-full object-contain" /></button>)}</div></section>}
                    {!state.activeDelivery && state.pendingDelivery && !state.pendingDelivery.can_select_question && <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center"><Hourglass className="mx-auto h-9 w-9 animate-pulse text-zinc-500" /><h2 className="mt-4 text-xl font-bold">Waiting for the selected bowler</h2><p className="mt-2 text-sm text-zinc-500">The organiser assigned the delivery. The selected bowler will choose the question type.</p></section>}
                    {!state.activeDelivery && !state.pendingDelivery && state.match.status !== 'toss_pending' && state.match.status !== 'toss_won' && <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center"><Timer className="mx-auto h-9 w-9 text-zinc-500" /><h2 className="mt-4 text-xl font-bold">Waiting for the next question</h2><p className="mt-2 text-sm text-zinc-500">Stay on this screen. The organiser will display the next question.</p></section>}
                    {!state.activeDelivery && state.pendingDelivery && !state.pendingDelivery.can_select_question && ownTeamBatting && state.player?.is_leader && !state.powerShotUsed && !state.isPowerShotArmed && (
                        <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-center">
                            <Zap className="mx-auto h-10 w-10 text-amber-300 mb-4" />
                            <h2 className="text-xl font-bold text-amber-100">Arm Power Shot</h2>
                            <p className="mt-2 text-sm text-amber-200/70">Double the runs for the next delivery if your team answers correctly. Can only be used once per innings.</p>
                            <button disabled={submittingChoice} onClick={async () => {
                                setSubmittingChoice(true);
                                const res = await fetch('/api/mpl/player/arm-power-shot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId: state.match.id, inningsNumber: state.match.batting_innings_number }) });
                                if (res.ok) setState((current) => ({ ...current, isPowerShotArmed: true }));
                                else { const data = await res.json(); setState((current) => ({ ...current, error: data.error || 'Unable to arm power shot.' })); }
                                setSubmittingChoice(false);
                            }} className="mt-6 rounded-xl bg-amber-300 px-6 py-3 font-bold text-black hover:bg-amber-400 disabled:opacity-50">Activate Power Shot</button>
                        </section>
                    )}
                    {state.activeDelivery && <p className="mb-2 text-xs uppercase tracking-widest text-teal-300">Question ball</p>}
                    {state.activeDelivery && <section className="rounded-2xl border border-teal-300/40 bg-gradient-to-br from-teal-400/15 via-teal-950/30 to-black p-4 shadow-[0_20px_70px_rgba(20,184,166,0.1)] sm:p-6"><div className="flex items-center justify-between text-xs uppercase tracking-widest text-teal-200"><span>Question {state.activeDelivery.delivery_number}</span><span className="rounded-full bg-black/30 px-3 py-1.5 font-bold">{Math.max(0, Math.ceil((new Date(state.activeDelivery.answer_started_at).getTime() + (state.activeDelivery.timer_seconds * 1000) - (clockNow - (state.serverTimeOffset || 0))) / 1000))}s</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-teal-300/30 bg-teal-300/10 p-3"><p className="text-[10px] uppercase tracking-widest text-teal-200">Batting</p><p className="mt-1 font-bold text-white">{state.activeDelivery.batter_name} is batting</p></div><div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-3"><p className="text-[10px] uppercase tracking-widest text-amber-200">Bowling</p><p className="mt-1 font-bold text-white">{state.activeDelivery.bowler_name} is bowling</p></div></div><div className="mt-6 flex flex-col gap-2"><div className="inline-flex items-center self-start rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-bold text-teal-300">Assigned Score: {state.activeDelivery.assigned_score} runs</div><h2 className="text-2xl font-black leading-tight sm:text-3xl">{state.activeDelivery.question?.question_text}</h2></div>{state.activeDelivery.metadata?.power_shot === true && <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-300/70 bg-amber-300/15 p-3 text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.12)]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300 text-black"><Zap className="h-4 w-4" /></span><span><span className="block font-bold">Power Shot is Active!</span><span className="mt-0.5 block text-xs text-amber-200/70">Correct answer runs will be doubled</span></span></div>}<div className="mt-6 grid gap-3 sm:grid-cols-2">{(state.activeDelivery.question?.options || []).map((option, index) => (state.activeDelivery.can_answer || state.activeDelivery.can_rescue) ? <button key={index} disabled={submittingAnswer} onClick={() => submitAnswer(index)} className="rounded-xl border border-white/10 bg-black/30 p-4 text-left text-sm transition hover:-translate-y-0.5 hover:border-teal-300/70 hover:bg-teal-300/10 disabled:opacity-50"><span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-300/15 text-xs font-bold text-teal-200">{index + 1}</span>{option}</button> : <div key={index} className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm"><span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-300/15 text-xs font-bold text-teal-200">{index + 1}</span>{option}</div>)}</div><p className="mt-6 text-xs text-zinc-400">{state.activeDelivery.can_answer ? 'Select your answer before the timer expires.' : state.activeDelivery.can_rescue ? 'The batter was incorrect. Select the answer for the bowler rescue attempt.' : 'Waiting for the selected player to answer.'}</p></section>}
                </>}
            </div>
        </main>
    );
}
