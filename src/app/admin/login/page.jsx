"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, User, Key, ShieldCheck, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [isAdminMode, setIsAdminMode] = useState(true); // true = Main Admin, false = Event Admin
    const [credentials, setCredentials] = useState({
        username: "", // For Event Admin
        password: ""  // For Both
    });
    const [events, setEvents] = useState([]); // Store fetched events
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);

    // Fetch events for dropdown
    useEffect(() => {
        setIsLoadingEvents(true);
        fetch('/api/events')
            .then(res => res.json())
            .then(data => {
                setEvents(data);
                if (data.length > 0) {
                    setCredentials(prev => ({ ...prev, username: data[0].title }));
                }
                setIsLoadingEvents(false);
            })
            .catch(err => {
                console.error("Failed to fetch events:", err);
                setIsLoadingEvents(false);
            });
    }, []);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            if (isAdminMode) {
                // MAIN ADMIN CHECK (Mock)
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (credentials.password === "RMC2026") {
                    sessionStorage.setItem("admin-auth", "main");
                    router.push("/admin/dashboard");
                } else {
                    setError("Invalid Password. Please try again.");
                    setIsLoading(false);
                }
            } else {
                // EVENT ADMIN CHECK
                const res = await fetch('/api/events');
                if (!res.ok) throw new Error("Failed to verify credentials");

                const events = await res.json();
                const event = events.find(e => e.title === credentials.username && e.password === credentials.password);

                if (event) {
                    sessionStorage.setItem("admin-auth", "event-" + event.id);
                    router.push(`/admin/event/${event.id}`);
                } else {
                    setError("Authentication Failed. Check credentials.");
                    setIsLoading(false);
                }
            }
        } catch (err) {
            console.error(err);
            setError("Login Error. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-[#020617]" />
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-teal/10 blur-[120px] rounded-full opacity-30 animate-pulse" />

            <div className="w-full max-w-md relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                >
                    {/* Header Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setIsAdminMode(true)}
                            className={`flex-1 py-4 text-xs font-mono uppercase tracking-widest transition-colors ${isAdminMode ? 'bg-teal/10 text-teal' : 'text-white/40 hover:text-white'}`}
                        >
                            Club President
                        </button>
                        <button
                            onClick={() => setIsAdminMode(false)}
                            className={`flex-1 py-4 text-xs font-mono uppercase tracking-widest transition-colors ${!isAdminMode ? 'bg-teal/10 text-teal' : 'text-white/40 hover:text-white'}`}
                        >
                            Event Coordinator
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="mb-8 text-center">
                            <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal/20">
                                {isAdminMode ? <ShieldCheck className="w-8 h-8 text-teal" /> : <User className="w-8 h-8 text-teal" />}
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-white mb-1">
                                {isAdminMode ? "Admin Login" : "Coordinator Login"}
                            </h2>
                            <p className="text-white/40 text-sm">
                                {isAdminMode ? "Please enter your administrative password." : "Login with your event credentials."}
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            {!isAdminMode && (
                                <div className="space-y-1">
                                    <label className="text-[10px] text-teal/70 font-mono uppercase tracking-widest pl-3">Event Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <select
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white focus:border-teal/50 focus:ring-1 focus:ring-teal/50 outline-none transition-all placeholder-white/20 appearance-none"
                                            value={credentials.username}
                                            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                            disabled={isLoadingEvents}
                                        >
                                            {events.length === 0 && <option value="" disabled>Loading events...</option>}
                                            {events.map(event => (
                                                <option key={event.id} value={event.title} className="bg-black text-white">
                                                    {event.title}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 border-r border-b border-white/30 rotate-45 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] text-teal/70 font-mono uppercase tracking-widest pl-3">Password</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    <input
                                        type="password"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-teal/50 focus:ring-1 focus:ring-teal/50 outline-none transition-all placeholder-white/20"
                                        placeholder="••••••••"
                                        value={credentials.password}
                                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="text-red-400 text-xs text-center border border-red-500/20 bg-red-900/10 p-2 rounded-lg"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 mt-2 bg-teal hover:bg-teal-400 text-black font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Verifying..." : "Login"}
                                {!isLoading && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </form>
                    </div>
                </motion.div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-white/20 font-mono uppercase tracking-[0.2em]">RMC Administration Portal</p>
                </div>
            </div>
        </div>
    );
}
