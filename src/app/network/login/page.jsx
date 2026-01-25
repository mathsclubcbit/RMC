"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Shield, Key, AlertCircle, ArrowRight, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NetworkLogin() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isFacultyMode, setIsFacultyMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Auto-redirect if already logged in
    useState(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) router.replace("/network/dashboard");
        };
        checkUser();
    }, []);


    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            router.push("/network/dashboard");
        } catch (err) {
            console.error("Auth Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black p-4 font-sans">

            {/* Exit Route */}
            <Link
                href="/"
                className="absolute top-8 left-8 z-20 flex items-center gap-2 text-white/30 hover:text-teal transition-colors font-mono text-[10px] uppercase tracking-[0.2em] group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Return to Origin
            </Link>

            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(45,212,191,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_-10px_rgba(45,212,191,0.2)]">

                    {/* Header */}
                    <div className="p-8 pb-0 text-center relative">
                        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 p-2 border transition-all shadow-[0_0_20px_rgba(45,212,191,0.1)] relative ${isFacultyMode ? 'bg-purple-500/10 border-purple-500/20 shadow-purple-500/10' : 'bg-teal/10 border-teal/20 shadow-teal/10'}`}>
                            <Image
                                src="/RMC logo-circular.png"
                                alt="RMC Logo"
                                fill
                                className="object-contain p-2"
                                sizes="64px"
                                priority
                            />
                        </div>
                        <h1 className="text-2xl font-[family-name:var(--font-cinzel)] font-bold text-white mb-2 uppercase tracking-wider">
                            {isFacultyMode ? 'Faculty Portal' : 'RMC Portal'}
                        </h1>
                        <p className="text-white/40 font-mono text-xs uppercase tracking-widest">
                            {isFacultyMode ? 'Administrative Access' : 'Management Console'}
                        </p>
                    </div>

                    {/* Form */}
                    <div className="p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-400 font-mono">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-4">
                            <div className="space-y-1">
                                <label className={`text-[10px] uppercase font-mono pl-3 tracking-widest transition-colors ${isFacultyMode ? 'text-purple-400/70' : 'text-teal/70'}`}>
                                    {isFacultyMode ? 'Faculty Email' : 'Email Address'}
                                </label>
                                <div className="relative group">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 transition-colors ${isFacultyMode ? 'group-focus-within:text-purple-400' : 'group-focus-within:text-teal'}`}>
                                        <Key className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/20 outline-none transition-all font-mono text-sm ${isFacultyMode ? 'focus:border-purple-500/50 focus:bg-purple-900/10' : 'focus:border-teal/50 focus:bg-black/50'}`}
                                        placeholder={isFacultyMode ? "faculty@rmc.cbit.ac.in" : "user@rmc.cbit.ac.in"}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className={`text-[10px] uppercase font-mono pl-3 tracking-widest transition-colors ${isFacultyMode ? 'text-purple-400/70' : 'text-teal/70'}`}>
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 transition-colors ${isFacultyMode ? 'group-focus-within:text-purple-400' : 'group-focus-within:text-teal'}`}>
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/20 outline-none transition-all font-mono text-sm ${isFacultyMode ? 'focus:border-purple-500/50 focus:bg-purple-900/10' : 'focus:border-teal/50 focus:bg-black/50'}`}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>



                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 mt-6 text-black font-bold rounded-xl uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg ${isFacultyMode ? 'bg-purple-500 hover:bg-purple-400 shadow-purple-500/20 hover:shadow-purple-500/40' : 'bg-teal hover:bg-teal-400 shadow-teal/20 hover:shadow-teal/40'}`}
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center space-y-6">
                            {/* Mode Switch */}
                            <button
                                onClick={() => setIsFacultyMode(!isFacultyMode)}
                                className={`inline-flex items-center gap-2 px-6 py-2 rounded-full border transition-all font-mono text-[10px] uppercase tracking-[0.2em] ${isFacultyMode
                                    ? 'bg-teal/5 border-teal/20 text-teal hover:bg-teal/10'
                                    : 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                                    }`}
                            >
                                <Lock className="w-3 h-3" />
                                {isFacultyMode ? 'Member Login' : 'Faculty Login'}
                            </button>

                            <p className="text-[10px] text-white/20 font-mono uppercase tracking-widest leading-relaxed">
                                Access limited to club members. <br /> Contact administrator for help.
                            </p>

                            <div className="pt-4 border-t border-white/5">
                                <Link
                                    href="/"
                                    className="text-[10px] text-teal/40 hover:text-teal font-mono uppercase tracking-[0.2em] transition-colors"
                                >
                                    [ Exit Hub ]
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Status */}
                <div className="mt-8 text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal/20 bg-teal/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                        <span className="text-[10px] text-teal font-mono uppercase tracking-widest">System Operational</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
