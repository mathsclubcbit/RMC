"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function NetworkLoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const router = useRouter();
    const { signIn, signUp } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setLoading(true);

        try {
            if (isSignUp) {
                // Sign Up Logic
                const { data, error: signUpError } = await signUp(email, password, {
                    data: {
                        full_name: fullName.trim() || email.split('@')[0]
                    }
                });

                if (signUpError) {
                    setError(signUpError.message);
                    setLoading(false);
                    return;
                }

                if (data?.user) {
                    setSuccessMessage("Account created! Logging you in...");
                    if (data.session) {
                        setTimeout(() => router.push("/network/dashboard"), 1000);
                    } else {
                        setSuccessMessage("Account created! Please check your email to confirm.");
                        setLoading(false);
                    }
                }
            } else {
                // Sign In Logic
                const { data, error: signInError } = await signIn(email, password);

                if (signInError) {
                    setError(signInError.message);
                    setLoading(false);
                    return;
                }

                if (data?.user) {
                    setTimeout(() => {
                        router.push("/network/dashboard");
                    }, 100);
                }
            }
        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] bg-teal/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[60%] bg-purple-900/5 rounded-full blur-[150px]" />
            </div>

            {/* Back to Home Link */}
            <Link
                href="/"
                className="absolute top-6 left-6 text-white/40 hover:text-white text-sm flex items-center gap-2 transition-colors z-20"
            >
                ← Back to Home
            </Link>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-teal/20 blur-xl rounded-full" />
                                <Image
                                    src="/RMC logo-circular.png"
                                    alt="RMC Logo"
                                    width={80}
                                    height={80}
                                    className="relative z-10"
                                />
                            </div>
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">
                            {isSignUp ? "Create Account" : "RMC Network"}
                        </h1>
                        <p className="text-white/50 text-sm">
                            {isSignUp ? "Sign up to join your team" : "Member Portal Access"}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-teal/10 border border-teal/20 rounded-xl flex items-center gap-3 text-teal text-sm"
                        >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {successMessage}
                        </motion.div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name Field (Only for Sign Up) */}
                        {isSignUp && (
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 flex items-center justify-center font-bold text-xs">
                                        Az
                                    </div>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="John Doe"
                                        required={isSignUp}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/20 focus:border-teal/50 focus:bg-white/10 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@cbit.ac.in"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/20 focus:border-teal/50 focus:bg-white/10 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono ml-1">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/20 focus:border-teal/50 focus:bg-white/10 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-teal to-emerald-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-teal/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {isSignUp ? "Creating Account..." : "Signing In..."}
                                </>
                            ) : (
                                <>
                                    {isSignUp ? "Create Account" : "Access Network"}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle Mode */}
                    <div className="text-center mt-6">
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError("");
                                setSuccessMessage("");
                            }}
                            className="text-teal text-sm hover:underline"
                        >
                            {isSignUp ? "Already have an account? Sign In" : "First time here? Create an Account"}
                        </button>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-teal/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
            </motion.div>
        </div>
    );
}
