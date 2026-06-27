"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Loader2, Users, ChevronDown } from "lucide-react";
import SpotlightCard from "@/components/ui/SpotlightCard";

const TEAMS = ["WebDev", "Content", "PR", "Events"]; // Content & Media -> Content for env key

export default function TeamLogin() {
    const [team, setTeam] = useState(TEAMS[0]);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/team/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamName: team, password }),
            });
            const data = await res.json();
            
            if (res.ok) {
                router.push("/team/dashboard");
                router.refresh();
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md w-full mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-serif text-white mb-3 tracking-tight">Team Portal</h1>
                <p className="text-white/50 text-sm font-mono uppercase tracking-widest">Authorized Heads Only</p>
            </div>

            <SpotlightCard className="p-6 sm:p-8 border-white/10 bg-black/40">
                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <div className="p-4 rounded-xl border border-coral/30 bg-coral/5 text-coral/90 text-xs font-mono">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Select Team</label>
                        <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <select
                                value={team}
                                onChange={(e) => setTeam(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-11 py-3.5 
                                           text-sm text-white focus:border-teal/50 focus:bg-white/10 transition-colors
                                           appearance-none outline-none"
                            >
                                {TEAMS.map(t => <option key={t} value={t}>{t === "Content" ? "Content & Media" : t}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Access Code</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-11 py-3.5 
                                           text-sm text-white placeholder:text-white/20 focus:border-teal/50 focus:bg-white/10 transition-colors
                                           outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-white text-black py-4 rounded-xl font-bold font-mono text-xs uppercase tracking-widest
                                   hover:bg-teal hover:shadow-[0_0_20px_rgba(58,188,179,0.3)] transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authenticate"}
                    </button>
                </form>
            </SpotlightCard>
        </div>
    );
}
