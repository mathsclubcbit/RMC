"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';

export default function NewsletterSignup() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setStatus('success');
                setEmail('');
            } else {
                setStatus('error');
                setTimeout(() => setStatus('idle'), 3000);
            }
        } catch (error) {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <div className="relative group w-full max-w-4xl mx-auto">
            {/* Ambient Background Gradient - Subtle */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal/30 to-indigo-500/30 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

            <div className="relative bg-[#050510]/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-8 md:p-10 overflow-hidden shadow-2xl">

                {/* Decorative Grid - Subtle */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">

                    {/* Text Section */}
                    <div className="text-center md:text-left flex-1">
                        <h3 className="font-[family-name:var(--font-cinzel)] text-2xl md:text-3xl text-white mb-3 flex items-center justify-center md:justify-start gap-4">
                            Stay Updated
                            <span className="text-[10px] font-mono tracking-[0.2em] text-teal bg-teal/5 border border-teal/20 px-3 py-1 rounded-full uppercase">
                                Newsletter
                            </span>
                        </h3>
                        <p className="text-white/40 text-sm font-light leading-relaxed max-w-md mx-auto md:mx-0">
                            Join the inner circle. Get the latest research, event announcements, and club updates delivered to your inbox.
                        </p>
                    </div>

                    {/* Form Section */}
                    <div className="w-full md:w-auto">
                        <AnimatePresence mode="wait">
                            {status === 'success' ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex items-center gap-4 bg-teal/10 border border-teal/20 p-4 rounded-xl text-teal min-w-[320px] justify-center"
                                >
                                    <div className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className="font-mono text-xs tracking-widest uppercase">Subscribed Successfully</span>
                                </motion.div>
                            ) : (
                                <motion.form
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onSubmit={handleSubmit}
                                    className="flex flex-col sm:flex-row gap-3 w-full md:w-auto"
                                >
                                    <div className="relative group/input">
                                        <input
                                            type="email"
                                            required
                                            placeholder="email@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full md:w-72 bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-teal/40 focus:bg-white/[0.05] transition-all font-mono"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="relative overflow-hidden bg-white text-black hover:bg-teal transition-colors duration-500 rounded-xl px-8 py-4 font-bold text-xs tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed group/btn shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)]"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            {status === 'loading' ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    Subscribe <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
