'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Radio, Timer } from 'lucide-react';

export default function PlayerLiveMatch() {
    const [state, setState] = useState({ loading: true, match: null, teams: [], activeDelivery: null, error: '' });

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const response = await fetch('/api/mpl/player/match', { cache: 'no-store' });
                const data = await response.json();
                if (mounted) setState({ loading: false, match: data.match || null, teams: data.teams || [], activeDelivery: data.activeDelivery || null, error: response.ok ? '' : (data.error || 'Unable to load the live match.') });
            } catch {
                if (mounted) setState((current) => ({ ...current, loading: false, error: 'Unable to connect to the live match.' }));
            }
        };
        load();
        const interval = setInterval(load, 3000);
        return () => { mounted = false; clearInterval(interval); };
    }, []);

    if (state.loading) return <main className="min-h-screen bg-[#050505] p-8 text-sm text-zinc-400">Loading live match...</main>;

    return (
        <main className="min-h-screen bg-[#050505] px-4 py-20 text-white">
            <div className="mx-auto max-w-3xl">
                <Link href="/mpl/dashboard" className="mb-8 flex items-center gap-2 text-xs text-zinc-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Team dashboard</Link>
                {state.error && <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{state.error}</div>}
                {!state.error && !state.match && <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center"><Radio className="mx-auto h-10 w-10 text-zinc-600" /><h1 className="mt-4 text-2xl font-bold">No live match yet</h1><p className="mt-2 text-sm text-zinc-500">When your organiser starts a match involving your team, it will appear here.</p></section>}
                {!state.error && state.match && <>
                    <div className="mb-6 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.25em] text-teal-300">MPL live room</p><h1 className="mt-2 text-3xl font-bold">Your match is live</h1></div><span className="flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-2 text-xs uppercase tracking-widest text-teal-200"><Radio className="h-3.5 w-3.5" /> {state.match.status.replaceAll('_', ' ')}</span></div>
                    <div className="mb-6 grid gap-4 md:grid-cols-2">
                        {state.teams.map((team) => <section key={team.team_id} className={`rounded-2xl border p-5 ${team.is_batting ? 'border-teal-400/40 bg-teal-400/10' : 'border-white/10 bg-white/5'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-zinc-400">{team.is_batting ? 'Batting team' : 'Bowling team'}</p><h2 className="mt-1 text-xl font-bold">{team.team_name}</h2><p className="text-xs text-zinc-500">{team.team_code}</p></div><span className="rounded-full bg-black/30 px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-400">{team.players.length} joined</span></div><div className="mt-4 space-y-2">{team.players.map((player) => <div key={player.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"><span>{player.name}{player.is_leader ? ' (Captain)' : ''}</span><span className="text-xs text-zinc-500">{player.roll_number}</span></div>)}{team.players.length === 0 && <p className="text-sm text-zinc-500">No players registered.</p>}</div></section>)}
                    </div>
                    {!state.activeDelivery && <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center"><Timer className="mx-auto h-9 w-9 text-zinc-500" /><h2 className="mt-4 text-xl font-bold">Waiting for the next question</h2><p className="mt-2 text-sm text-zinc-500">Stay on this screen. The organiser will display the next question.</p></section>}
                    {state.activeDelivery && <section className="rounded-2xl border border-teal-400/30 bg-teal-400/10 p-6"><div className="flex items-center justify-between text-xs uppercase tracking-widest text-teal-200"><span>Question {state.activeDelivery.delivery_number}</span><span>{state.activeDelivery.timer_seconds}s</span></div><h2 className="mt-6 text-2xl font-bold leading-relaxed">{state.activeDelivery.question?.question_text}</h2><div className="mt-6 grid gap-3">{(state.activeDelivery.question?.options || []).map((option, index) => <div key={index} className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm"><span className="mr-3 text-teal-300">{index + 1}</span>{option}</div>)}</div><p className="mt-6 text-xs text-zinc-400">Answer verbally when the organiser asks. Do not submit answers from this screen.</p></section>}
                </>}
            </div>
        </main>
    );
}
