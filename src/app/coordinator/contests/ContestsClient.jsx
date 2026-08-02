"use client";

import { useState, useEffect } from "react";
import { Swords, Plus, Calendar, Clock, ArrowRight, X, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ContestsClient({ eventId }) {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        weekNumber: 1,
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        durationMinutes: 30
    });

    useEffect(() => {
        fetchContests();
    }, []);

    const fetchContests = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/placement-series/contests?eventId=${eventId}`);
            if (res.ok) {
                const data = await res.json();
                setContests(data.contests || []);
            }
        } catch (error) {
            console.error("Failed to fetch contests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Combine Date and Time strings into valid Date objects
            const startStr = `${formData.startDate}T${formData.startTime}`;
            const endStr = `${formData.endDate}T${formData.endTime}`;
            
            const startISO = new Date(startStr).toISOString();
            const endISO = new Date(endStr).toISOString();
            
            const payload = {
                eventId,
                title: formData.title,
                weekNumber: parseInt(formData.weekNumber),
                startsAt: startISO,
                endsAt: endISO,
                durationMinutes: parseInt(formData.durationMinutes)
            };

            const res = await fetch(`/api/placement-series/contests`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchContests();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to create contest");
            }
        } catch (error) {
            console.error("Error creating contest:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-black text-white relative pb-24">
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-20 right-20 w-[600px] h-[600px] bg-indigo-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 px-4 pt-24 pb-8 max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Swords className="w-8 h-8 text-teal-400" />
                            Contests
                        </h1>
                        <p className="text-white/50 mt-1">Create and manage weekly placement contests.</p>
                    </div>
                    <button 
                        onClick={() => {
                            setFormData({
                                title: "", weekNumber: contests.length + 1, startDate: "", startTime: "", endDate: "", endTime: "", durationMinutes: 30
                            });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-black px-6 py-2.5 rounded-xl font-bold transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Create Contest
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-400" /></div>
                ) : contests.length === 0 ? (
                    <div className="text-center py-20 border border-white/5 bg-white/5 rounded-2xl">
                        <Swords className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No contests yet</h3>
                        <p className="text-white/50 text-sm mt-1">Create a new contest to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contests.map((contest) => (
                            <Link 
                                href={`/coordinator/contests/${contest.id}`} 
                                key={contest.id}
                                className="bg-white/5 border border-white/10 hover:border-teal-400/50 rounded-2xl p-6 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded-md">Week {contest.weekNumber}</span>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                                                contest.status === 'active' ? 'bg-teal-500/20 text-teal-300' :
                                                contest.status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-300' :
                                                'bg-white/10 text-white/50'
                                            }`}>
                                                {contest.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold">{contest.title}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-black transition-colors">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="space-y-2 mt-4 text-sm text-white/60">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(contest.startsAt).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{contest.durationMinutes} mins</span>
                                        </div>
                                        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                                            <span className="font-semibold text-white/80">{contest.totalQuestions} Questions</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold">Create Contest</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Contest Title</label>
                                <input 
                                    required type="text" 
                                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                                    placeholder="e.g. Weekly Assessment 1"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-teal-400/50 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Week Number</label>
                                    <input 
                                        required type="number" min="1"
                                        value={formData.weekNumber} onChange={e => setFormData({...formData, weekNumber: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-teal-400/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Duration (mins)</label>
                                    <input 
                                        required type="number" min="5" max="180"
                                        value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-teal-400/50 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-2">
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                        <input 
                                            required type="date" 
                                            value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 focus:border-teal-400/50 outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Start Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                        <input 
                                            required type="time" 
                                            value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 focus:border-teal-400/50 outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pb-2">
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">End Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                        <input 
                                            required type="date" 
                                            value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 focus:border-teal-400/50 outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">End Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                                        <input 
                                            required type="time" 
                                            value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 focus:border-teal-400/50 outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-white/70 hover:bg-white/10 font-medium">Cancel</button>
                                <button disabled={isSaving} type="submit" className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2">
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null} Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
