"use client";

import { useState, use, useEffect } from "react";
import { Loader2, CheckCircle2, FileText, UploadCloud, ArrowRight } from "lucide-react";
import Link from "next/link";
import SpotlightCard from "@/components/ui/SpotlightCard";

export default function TaskSubmissionPage({ params }) {
    const { id } = use(params);
    
    const [loading, setLoading] = useState(true);
    const [app, setApp] = useState(null);
    const [error, setError] = useState("");
    
    // Form state
    const [whyJoin, setWhyJoin] = useState("");
    const [whyTeam, setWhyTeam] = useState("");
    const [driveLink, setDriveLink] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!id) return;
        
        const fetchTaskInfo = async () => {
            try {
                const res = await fetch(`/api/recruitment/task-submit?id=${id}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to load task.");
                setApp(data.application);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTaskInfo();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/recruitment/task-submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicationId: id,
                    why_join: whyJoin,
                    why_team: whyTeam,
                    drive_link: driveLink
                })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSubmitted(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060606] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
                <SpotlightCard className="max-w-md w-full p-8 text-center border-coral/30 bg-black/40">
                    <p className="text-coral font-mono text-sm">{error}</p>
                    <Link href="/" className="inline-block mt-6 text-white/50 hover:text-white text-xs font-mono transition">
                        ← Return Home
                    </Link>
                </SpotlightCard>
            </div>
        );
    }

    if (submitted || app?.task_status === 'SUBMITTED') {
        return (
            <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
                <SpotlightCard className="max-w-md w-full p-8 text-center border-white/10 bg-black/40">
                    <div className="mx-auto w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-8 h-8 text-teal" />
                    </div>
                    <h1 className="text-2xl font-serif text-white mb-3">Task Submitted</h1>
                    <p className="text-sm text-white/60 mb-6">
                        Thank you for submitting your task. The council will review your work and get back to you soon.
                    </p>
                    <Link href="/" className="inline-block text-teal text-xs font-mono border border-teal/30 px-6 py-2 rounded-full hover:bg-teal hover:text-black transition">
                        Return Home
                    </Link>
                </SpotlightCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#060606] text-white relative overflow-hidden selection:bg-teal/30">
            {/* Background elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal/10 blur-[120px]" />
                <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] [background-size:32px_32px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-24 grid md:grid-cols-2 gap-12 items-start">
                
                {/* Left side: Task Details */}
                <div className="space-y-6 md:sticky top-24">
                    <div>
                        <p className="text-teal text-[10px] font-mono tracking-widest uppercase mb-2">Phase 2</p>
                        <h1 className="text-4xl md:text-5xl font-black font-serif">Task Assignment</h1>
                        <p className="mt-4 text-white/50 text-sm leading-relaxed">
                            Hello <strong className="text-white">{app?.name}</strong>. You have been assigned a task for the <strong className="text-teal">{app?.team}</strong> team. Please review the requirements carefully and submit your work through a Google Drive link.
                        </p>
                    </div>

                    <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
                        <FileText className="w-8 h-8 text-white/30 mb-4" />
                        <h3 className="font-bold text-lg mb-2">Your Task PDF</h3>
                        <p className="text-sm text-white/50 mb-6">View your assigned task instructions below.</p>
                        
                        <a 
                            href={app?.task_file_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold font-mono text-xs uppercase tracking-widest rounded-xl hover:bg-teal hover:shadow-[0_0_20px_rgba(58,188,179,0.3)] transition-all"
                        >
                            View Task <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>

                {/* Right side: Submission Form */}
                <SpotlightCard className="p-6 md:p-8 border-white/10 bg-black/60 shadow-2xl relative overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        
                        <div className="mb-8 border-b border-white/10 pb-6">
                            <h2 className="text-2xl font-serif mb-2 text-teal">Submit Your Work</h2>
                            <p className="text-xs text-white/40 font-mono">All fields are mandatory.</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="flex justify-between items-end text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
                                    <span>Why do you want to join RMC?</span>
                                    <span className={whyJoin.length > 500 ? "text-coral" : ""}>{whyJoin.length}/500</span>
                                </label>
                                <textarea
                                    required
                                    maxLength={500}
                                    rows={3}
                                    value={whyJoin}
                                    onChange={e => setWhyJoin(e.target.value)}
                                    placeholder="Briefly explain your motivation..."
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-teal/50 resize-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="flex justify-between items-end text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
                                    <span>Why did you choose the {app?.team || "selected"} team?</span>
                                    <span className={whyTeam.length > 500 ? "text-coral" : ""}>{whyTeam.length}/500</span>
                                </label>
                                <textarea
                                    required
                                    maxLength={500}
                                    rows={3}
                                    value={whyTeam}
                                    onChange={e => setWhyTeam(e.target.value)}
                                    placeholder="What interests you about this specific team?"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-teal/50 resize-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                                    <UploadCloud className="w-3 h-3 text-teal" /> Google Drive Link
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={driveLink}
                                    onChange={e => setDriveLink(e.target.value)}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-teal/50 transition-colors"
                                />
                                <p className="text-[10px] text-coral/80 mt-1.5 font-mono">⚠️ Make sure access is set to "Anyone with the link can view".</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="mt-8 w-full py-4 bg-teal hover:bg-[#20b29f] text-black font-bold font-mono text-sm tracking-widest uppercase rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-teal flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(58,188,179,0.1)] hover:shadow-[0_0_20px_rgba(58,188,179,0.4)]"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Transmit"}
                        </button>
                    </form>
                </SpotlightCard>

            </div>
        </div>
    );
}
