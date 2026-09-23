'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Shield } from 'lucide-react';
import { IPL_TEAMS_2026 } from '@/constants/mpl';

export default function PreferredIplTeamCard() {
    const router = useRouter();
    const [selectedTeam, setSelectedTeam] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedTeam) return;

        setIsSaving(true);
        setErrorMessage('');

        try {
            const response = await fetch('/api/mpl/preferred-ipl-team', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferredIplTeam: selectedTeam })
            });
            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.error || 'Could not save your preference.');
                return;
            }

            router.refresh();
        } catch (error) {
            console.error(error);
            setErrorMessage('Network error. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white/5 border border-amber-300/20 rounded-3xl p-6 shadow-[0_0_30px_rgba(251,191,36,0.05)]">
            <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-300/10 border border-amber-300/20 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                    <p className="text-[10px] font-mono text-amber-200/70 uppercase tracking-widest mb-1">Complete your profile</p>
                    <h2 className="text-lg font-bold text-white">Choose your preferred IPL team</h2>
                    <p className="text-xs text-zinc-400 mt-1">This helps us personalise your participant profile.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <select
                    value={selectedTeam}
                    onChange={event => setSelectedTeam(event.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-amber-300/50 transition-colors"
                    required
                >
                    <option value="" className="bg-zinc-900">Select an IPL team</option>
                    {IPL_TEAMS_2026.map(team => (
                        <option key={team.name} value={team.name} className="bg-zinc-900">
                            {team.name}
                        </option>
                    ))}
                </select>
                <button
                    type="submit"
                    disabled={!selectedTeam || isSaving}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-amber-300 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Check className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Preferred Team'}
                </button>
                {errorMessage && <p className="text-xs text-red-300">{errorMessage}</p>}
            </form>
        </div>
    );
}
