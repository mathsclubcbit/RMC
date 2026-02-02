"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, ChevronDown, Calendar, AlertCircle } from "lucide-react";

export default function CoordinatorLoginPage() {
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [selectedEventId, setSelectedEventId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch events on mount
    useEffect(() => {
        const loadEvents = async () => {
            try {
                const response = await fetch("/api/events");
                if (!response.ok) throw new Error("Failed to fetch events");

                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    setEvents(data);
                    setSelectedEventId(data[0].id);
                }
            } catch (err) {
                console.error("Error loading events:", err);
                setError("Failed to load events");
            } finally {
                setLoadingEvents(false);
            }
        };

        loadEvents();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedEventId) {
            setError("Please select an event");
            return;
        }

        if (!password.trim()) {
            setError("Please enter the password");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/coordinator/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    eventId: selectedEventId,
                    password: password.trim()
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Login failed");
            }

            // Success - redirect to dashboard (full page reload to ensure cookie is read by middleware)
            window.location.href = "/coordinator/dashboard";

        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const selectedEvent = events.find(e => e.id === selectedEventId);

    return (
        <div className="min-h-screen bg-[#020617] relative flex items-center justify-center p-4 overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.05),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.05),transparent_50%)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/5 blur-[100px] rounded-full" />
            </div>

            <Link
                href="/"
                className="absolute top-8 left-8 text-white/40 hover:text-white flex items-center gap-2 transition-colors z-50"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-mono uppercase tracking-widest">Back to Site</span>
            </Link>

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-mono uppercase tracking-widest mb-4">
                        <Lock className="w-3 h-3" /> Coordinator Access
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-white mb-2">Event Dashboard</h1>
                    <p className="text-white/40 text-sm">Manage your event stats and verify tickets.</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Event Dropdown */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono ml-1">
                                Select Event
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />

                                {loadingEvents ? (
                                    <div className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white/40 text-sm">
                                        Loading events...
                                    </div>
                                ) : events.length === 0 ? (
                                    <div className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white/40 text-sm">
                                        No events available
                                    </div>
                                ) : (
                                    <select
                                        value={selectedEventId}
                                        onChange={(e) => setSelectedEventId(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-10 py-3.5 text-white text-sm appearance-none cursor-pointer focus:border-teal-500/50 focus:bg-black/60 outline-none transition-all"
                                    >
                                        {events.map((event) => (
                                            <option
                                                key={event.id}
                                                value={event.id}
                                                className="bg-gray-900 text-white"
                                            >
                                                {event.title}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                            </div>

                            {selectedEvent && (
                                <p className="text-[10px] text-white/30 font-mono ml-1">
                                    Event ID: {selectedEvent.id}
                                </p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono ml-1">
                                Access Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-white/30 focus:border-teal-500/50 focus:bg-black/60 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || loadingEvents || events.length === 0}
                            className="w-full py-4 mt-2 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl text-black font-bold uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Authenticating..." : "Login to Dashboard"}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-6 text-white/20 text-xs font-mono">
                    Restricted Area • Authorized Personnel Only
                </p>
            </div>
        </div>
    );
}
