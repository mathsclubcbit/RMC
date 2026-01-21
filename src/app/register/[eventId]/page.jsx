"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Smartphone, User, Mail, Hash, Briefcase, Calendar } from "lucide-react";
import { upcomingEvents } from "@/data/upcomingEvents";
import SectionTitle from "@/components/ui/SectionTitle";
import { useParams } from "next/navigation";

export default function RegistrationPage() {
    const params = useParams();
    const eventId = parseInt(params.eventId);
    const event = upcomingEvents.find(e => e.id === eventId);

    // Mock state if event not found (or handle redirect)
    if (!event && eventId) {
        // ideally notFound() but client side mock
    }

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        rollNo: "",
        branch: "",
        year: "1"
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsSubmitting(false);
        setIsSuccess(true);
    };

    if (!event) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Event Not Found</div>;

    return (
        <div className="min-h-screen bg-black relative flex flex-col md:flex-row">
            {/* Mobile Header (Visible only on small screens) */}
            <div className="md:hidden p-6 pt-24 pb-8 bg-black/80 backdrop-blur-md border-b border-white/10 z-20 text-center sticky top-0">
                <Link href="/events" className="inline-flex items-center text-xs text-muted mb-4 hover:text-white transition-colors">
                    <ArrowLeft className="w-3 h-3 mr-1" /> Back
                </Link>
                <h1 className="text-2xl font-serif font-bold text-white">{event.title}</h1>
                <div className="text-teal text-xs font-mono mt-2 uppercase tracking-widest">{event.date}</div>
            </div>

            {/* Left Panel - Visuals (Hidden on Mobile, or condensed) */}
            <div className="hidden md:flex flex-1 relative bg-gray-900 border-r border-white/5 items-center justify-center p-12 overflow-hidden">
                {/* Background Art */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />

                <div className="relative z-10 max-w-lg">
                    <Link href="/events" className="inline-flex items-center text-sm text-muted mb-8 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Return to Archives
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <span className="inline-block px-3 py-1 rounded-full border border-teal/30 bg-teal/10 text-teal text-[10px] font-mono uppercase tracking-widest">
                            {event.category || "Operation"}
                        </span>
                        <h1 className="text-6xl font-serif font-bold text-white leading-none">{event.title}</h1>
                        <p className="text-lg text-white/60 leading-relaxed font-light">{event.description}</p>

                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                            <div>
                                <h4 className="text-muted text-xs uppercase tracking-widest mb-2 font-mono">Status</h4>
                                <span className="text-teal font-bold">{event.status}</span>
                            </div>
                            <div>
                                <h4 className="text-muted text-xs uppercase tracking-widest mb-2 font-mono">Venue</h4>
                                <span className="text-white">{event.location}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 relative flex items-center justify-center p-6 md:p-12 lg:p-24 pt-10 md:pt-32">
                {/* Background Grid for Tech Feel */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                <div className="w-full max-w-md relative z-10">
                    {isSuccess ? (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-teal/10 border border-teal/20 rounded-3xl p-8 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-teal/20 flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-8 h-8 text-teal" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-white mb-2">Registration Confirmed</h3>
                            <p className="text-white/60 mb-8">Access granted. We have sent a confirmation frequency to your email.</p>
                            <Link href="/events" className="btn btn-outline w-full">Return to Operations</Link>
                        </motion.div>
                    ) : (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                            <div className="mb-8">
                                <h3 className="text-2xl font-serif font-bold text-white">Secure Access</h3>
                                <p className="text-white/40 text-sm">Enter your credentials to register.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-teal/70 font-mono pl-3">Full Identity</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-3.5 w-4 h-4 text-white/30" />
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/20 focus:border-teal/50 focus:ring-1 focus:ring-teal/50 outline-none transition-all"
                                            placeholder="John Nash"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-teal/70 font-mono pl-3">Digital Contact</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 w-4 h-4 text-white/30" />
                                        <input
                                            required
                                            type="email"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/20 focus:border-teal/50 focus:ring-1 focus:ring-teal/50 outline-none transition-all"
                                            placeholder="nash@princeton.edu"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest text-teal/70 font-mono pl-3">Roll No</label>
                                        <div className="relative">
                                            <Hash className="absolute left-4 top-3.5 w-4 h-4 text-white/30" />
                                            <input
                                                required
                                                type="text"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/20 focus:border-teal/50 focus:ring-1 focus:ring-teal/50 outline-none transition-all"
                                                placeholder="1601..."
                                                value={formData.rollNo}
                                                onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest text-teal/70 font-mono pl-3">Year</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-white/30" />
                                            <select
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white appearance-none focus:border-teal/50 focus:ring-1 focus:ring-teal/50 outline-none transition-all"
                                                value={formData.year}
                                                onChange={e => setFormData({ ...formData, year: e.target.value })}
                                            >
                                                <option value="1">Year 1</option>
                                                <option value="2">Year 2</option>
                                                <option value="3">Year 3</option>
                                                <option value="4">Year 4</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 mt-4 bg-teal hover:bg-teal-400 text-black font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_40px_rgba(45,212,191,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? "Processing..." : "Initiate Registration"}
                                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                                </button>

                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
