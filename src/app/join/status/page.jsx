"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Search, Clock, Check, X, Loader2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

function StatusCard({ data }) {
    const isApproved = data.status === "APPROVED";
    const isPending = data.status === "PENDING";
    const isRejected = data.status === "REJECTED";

    const colors = {
        PENDING: { border: "border-orange/30", bg: "bg-orange/5", text: "text-orange", icon: Clock, glow: "rgba(232,178,55,0.2)" },
        APPROVED: { border: "border-teal/30", bg: "bg-teal/5", text: "text-teal", icon: Check, glow: "rgba(58,188,179,0.2)" },
        REJECTED: { border: "border-coral/30", bg: "bg-coral/5", text: "text-coral", icon: X, glow: "rgba(227,105,81,0.2)" },
    };

    const cfg = colors[data.status] || colors.PENDING;
    const Icon = cfg.icon;

    const formatDate = (iso) => {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={`border ${cfg.border} rounded-2xl overflow-hidden`}
            style={{ boxShadow: `0 0 40px ${cfg.glow}` }}
        >
            {/* Status banner */}
            <div className={`${cfg.bg} px-6 py-5 flex items-center gap-4 border-b border-white/5`}>
                <div className={`w-10 h-10 rounded-full border ${cfg.border} ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${cfg.text}`} />
                </div>
                <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/30">Application Status</p>
                    <p className={`font-mono font-bold text-lg ${cfg.text} tracking-wider`}>{data.status}</p>
                </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-1">
                {[
                    { label: "Applicant", value: data.name },
                    { label: "Email", value: data.email },
                    { label: "Applied On", value: formatDate(data.appliedAt) },
                    data.reviewedAt && { label: "Reviewed On", value: formatDate(data.reviewedAt) },
                    { label: "Academic Year", value: data.academicYear },
                ].filter(Boolean).map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-4 py-2.5 border-b border-white/5">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">{label}</span>
                        <span className="text-sm font-serif text-white/70 text-right">{value}</span>
                    </div>
                ))}

                {/* Status-specific messaging */}
                <div className={`mt-6 p-4 rounded-lg border ${cfg.border} ${cfg.bg}`}>
                    {isPending && (
                        <p className="text-orange/80 text-sm font-sans leading-relaxed">
                            ⏳ Your application is under review by the RMC council. You will receive an email once a decision has been made.
                        </p>
                    )}
                    {isApproved && (
                        <p className="text-teal/80 text-sm font-sans leading-relaxed">
                            ✅ Congratulations! Your application has been approved. Welcome to the Ramanujan Math Club. Watch your email for further instructions.
                        </p>
                    )}
                    {isRejected && (
                        <>
                            <p className="text-coral/80 text-sm font-sans leading-relaxed">
                                ❌ Your application was not selected for this recruitment cycle. We appreciate your interest and encourage you to reapply in the next cycle.
                            </p>
                            {data.reviewNote && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">
                                        Note from the Council
                                    </p>
                                    <p className="text-white/50 text-sm italic font-serif">"{data.reviewNote}"</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default function JoinStatusPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setError("");
        setResult(null);
        setSearched(false);

        try {
            const res = await fetch(`/api/recruitment/status?email=${encodeURIComponent(email.trim().toLowerCase())}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to fetch status.");
                return;
            }

            setSearched(true);
            if (data.found) {
                setResult({ ...data, email: email.trim() });
            } else {
                setResult(null);
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen">
            <PageHeader
                title="APPLICATION STATUS"
                subtitle="Enter the email you applied with to check the status of your membership application."
            />

            <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-xl mx-auto">

                    {/* Search card */}
                    <div className="relative p-1 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent mb-8">
                        <div className="bg-[#020617] rounded-[2.4rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal to-transparent opacity-50" />

                            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-teal/50 mb-2">
                                ∫ Status Lookup
                            </p>
                            <h2 className="font-serif text-2xl text-white mb-8">Check Your Application</h2>

                            <form onSubmit={handleSearch} className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="status-email"
                                        className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-teal/80 mb-3"
                                    >
                                        <Mail className="w-3 h-3" /> Email Address
                                    </label>
                                    <input
                                        id="status-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                        placeholder="Enter your email address"
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                                                   placeholder-white/20 focus:outline-none focus:border-teal/50 focus:bg-white/10
                                                   transition-all font-serif text-sm"
                                    />
                                </div>

                                {error && (
                                    <p className="text-xs text-coral/80 font-mono">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !email.trim()}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-teal/10 border border-teal/30 text-teal
                                               text-xs font-mono uppercase tracking-widest rounded-lg hover:bg-teal hover:text-black
                                               transition-all duration-300 shadow-[0_0_20px_rgba(58,188,179,0.1)]
                                               hover:shadow-[0_0_30px_rgba(58,188,179,0.4)] disabled:opacity-50"
                                >
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
                                    ) : (
                                        <><Search className="w-4 h-4" /> Check Status</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Results */}
                    <AnimatePresence>
                        {searched && result && <StatusCard data={result} />}

                        {searched && !result && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-10 border border-white/10 rounded-2xl bg-white/[0.02]"
                            >
                                <p className="text-white/30 font-mono text-sm">No application found for this email.</p>
                                <p className="text-white/20 font-sans text-xs mt-2">
                                    Not applied yet?{" "}
                                    <a href="/join" className="text-teal/60 hover:text-teal underline underline-offset-2 transition-colors">
                                        Apply here →
                                    </a>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </div>
    );
}
